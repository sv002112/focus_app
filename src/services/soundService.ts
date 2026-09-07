import * as Haptics from 'expo-haptics';
import { CustomRingtone, UserProfile } from '../types';

export interface RingtoneOption {
  id: string;
  name: string;
  emoji: string;
  uri?: string;
  isCustom?: boolean;
}

export const BUILT_IN_RINGTONES: RingtoneOption[] = [
  {
    id: 'classic-bell',
    name: 'Classic Bell',
    emoji: '🔔',
    uri: 'https://actions.google.com/sounds/v1/alarms/alarm_clock.ogg',
  },
  {
    id: 'digital-pulse',
    name: 'Digital Pulse',
    emoji: '⚡',
    uri: 'https://actions.google.com/sounds/v1/alarms/beep_short.ogg',
  },
  {
    id: 'sunrise-breeze',
    name: 'Sunrise Breeze',
    emoji: '🌅',
    uri: 'https://actions.google.com/sounds/v1/alarms/digital_watch_alarm.ogg',
  },
  {
    id: 'ocean-wave',
    name: 'Ocean Wave',
    emoji: '🌊',
    uri: 'https://actions.google.com/sounds/v1/alarms/mechanical_clock_ring.ogg',
  },
  {
    id: 'zen-gong',
    name: 'Zen Gong',
    emoji: '🧘',
    uri: 'https://actions.google.com/sounds/v1/alarms/bugle_tune.ogg',
  },
];

let activeHtmlAudio: any = null;
let activeExpoSound: any = null;
let currentPlayingId: string | null = null;

/**
 * Web Audio API synthesizer tone engine (100% JS & Web Audio supported)
 */
const playSynthTone = (toneId: string) => {
  try {
    if (typeof window === 'undefined') return;
    const AudioCtx = (window as any).AudioContext || (window as any).webkitAudioContext;
    if (!AudioCtx) return;
    const ctx = new AudioCtx();

    const createNote = (freq: number, startTime: number, duration: number, type: OscillatorType = 'sine') => {
      const osc = ctx.createOscillator();
      const gain = ctx.createGain();

      osc.type = type;
      osc.frequency.setValueAtTime(freq, ctx.currentTime + startTime);

      gain.gain.setValueAtTime(0.15, ctx.currentTime + startTime);
      gain.gain.exponentialRampToValueAtTime(0.001, ctx.currentTime + startTime + duration);

      osc.connect(gain);
      gain.connect(ctx.destination);

      osc.start(ctx.currentTime + startTime);
      osc.stop(ctx.currentTime + startTime + duration);
    };

    switch (toneId) {
      case 'digital-pulse':
        createNote(880, 0, 0.12, 'square');
        createNote(1760, 0.15, 0.15, 'square');
        createNote(880, 0.32, 0.12, 'square');
        break;
      case 'sunrise-breeze':
        createNote(440, 0, 0.25, 'sine');
        createNote(554.37, 0.2, 0.25, 'sine');
        createNote(659.25, 0.4, 0.3, 'sine');
        createNote(880, 0.6, 0.4, 'sine');
        break;
      case 'ocean-wave':
        createNote(329.63, 0, 0.4, 'triangle');
        createNote(440, 0.25, 0.5, 'triangle');
        break;
      case 'zen-gong':
        createNote(220, 0, 0.8, 'sine');
        createNote(222, 0, 0.8, 'sine');
        break;
      case 'classic-bell':
      default:
        createNote(523.25, 0, 0.2, 'sine');
        createNote(659.25, 0.15, 0.2, 'sine');
        createNote(783.99, 0.3, 0.35, 'sine');
        break;
    }
  } catch (e) {
    // Ignore synth audio errors safely
  }
};

/**
 * Safely trigger haptic feedback on devices
 */
const triggerHaptics = async () => {
  try {
    await Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
  } catch (e) {
    // Haptics optional fallback
  }
};

/**
 * Safely play ringtone preview without requiring static native modules that crash Expo Go or Android Studio.
 */
export const playRingtonePreview = async (
  toneId: string,
  uri?: string,
  onFinish?: () => void
): Promise<string | null> => {
  try {
    if (currentPlayingId === toneId) {
      await stopRingtonePreview();
      if (onFinish) onFinish();
      return null;
    }

    await stopRingtonePreview();
    currentPlayingId = toneId;
    triggerHaptics();

    let soundPlayed = false;

    // 1. Try HTML5 Audio if web environment and URI available
    if (uri && typeof window !== 'undefined' && (window as any).Audio) {
      try {
        const audio = new (window as any).Audio(uri);
        activeHtmlAudio = audio;
        audio.onended = () => {
          stopRingtonePreview();
          if (onFinish) onFinish();
        };
        await audio.play();
        soundPlayed = true;
      } catch (err) {
        // Fallback safely
      }
    }

    // 2. Try native expo-av safely if available in environment (guarded try-catch require)
    if (!soundPlayed && uri) {
      try {
        const ExpoAV = require('expo-av');
        if (ExpoAV && ExpoAV.Audio && ExpoAV.Audio.Sound) {
          const { sound } = await ExpoAV.Audio.Sound.createAsync(
            { uri },
            { shouldPlay: true }
          );
          activeExpoSound = sound;
          sound.setOnPlaybackStatusUpdate((status: any) => {
            if (status.isLoaded && status.didJustFinish) {
              stopRingtonePreview();
              if (onFinish) onFinish();
            }
          });
          soundPlayed = true;
        }
      } catch (e) {
        // Native module unavailable or symbol link error - fallback safely without crashing app!
      }
    }

    // 3. Fallback Synthesizer + Haptic Feedback
    if (!soundPlayed) {
      playSynthTone(toneId);
      setTimeout(() => {
        if (currentPlayingId === toneId) {
          currentPlayingId = null;
          if (onFinish) onFinish();
        }
      }, 1200);
    }

    return toneId;
  } catch (error) {
    playSynthTone(toneId);
    setTimeout(() => {
      if (currentPlayingId === toneId) {
        currentPlayingId = null;
        if (onFinish) onFinish();
      }
    }, 1200);
    return toneId;
  }
};

/**
 * Safely stop any running ringtone preview
 */
export const stopRingtonePreview = async (): Promise<void> => {
  if (activeHtmlAudio) {
    try {
      activeHtmlAudio.pause();
      activeHtmlAudio.currentTime = 0;
    } catch (e) {}
    activeHtmlAudio = null;
  }

  if (activeExpoSound) {
    try {
      await activeExpoSound.stopAsync();
      await activeExpoSound.unloadAsync();
    } catch (e) {}
    activeExpoSound = null;
  }

  currentPlayingId = null;
};

/**
 * Pick custom audio file using expo-document-picker with defensive dynamic import
 */
export const pickCustomAudioFromDevice = async (): Promise<CustomRingtone | null> => {
  try {
    const DocumentPicker = require('expo-document-picker');
    if (!DocumentPicker || !DocumentPicker.getDocumentAsync) {
      return null;
    }

    const result = await DocumentPicker.getDocumentAsync({
      type: ['audio/*', 'audio/mpeg', 'audio/wav', 'audio/x-m4a', 'audio/mp4', 'audio/ogg'],
      copyToCacheDirectory: true,
    });

    if (!result.canceled && result.assets && result.assets.length > 0) {
      const asset = result.assets[0];
      const filename = asset.name || 'Custom Ringtone';
      const cleanName = filename.replace(/\.[^/.]+$/, '');

      return {
        id: `custom-${Date.now()}`,
        name: cleanName,
        uri: asset.uri,
        addedAt: new Date().toISOString(),
      };
    }
    return null;
  } catch (error) {
    console.warn('Error picking custom audio ringtone:', error);
    return null;
  }
};

/**
 * Plays active alarm ringtone from Settings.
 */
export const playSelectedAlarmTone = async (
  profile?: UserProfile,
  onFinish?: () => void
): Promise<string | null> => {
  const toneId = profile?.alarmToneId || 'classic-bell';
  let uri: string | undefined;

  const customTone = profile?.customRingtones?.find((r) => r.id === toneId);
  if (customTone) {
    uri = customTone.uri;
  } else {
    const builtIn = BUILT_IN_RINGTONES.find((b) => b.id === toneId);
    uri = builtIn?.uri;
  }

  return await playRingtonePreview(toneId, uri, onFinish);
};

/**
 * Gets details of the selected alarm ringtone.
 */
export const getSelectedRingtoneInfo = (
  profile?: UserProfile
): { name: string; emoji: string } => {
  const toneId = profile?.alarmToneId || 'classic-bell';

  const customTone = profile?.customRingtones?.find((r) => r.id === toneId);
  if (customTone) {
    return { name: customTone.name, emoji: '📱' };
  }

  const builtIn = BUILT_IN_RINGTONES.find((b) => b.id === toneId);
  if (builtIn) {
    return { name: builtIn.name, emoji: builtIn.emoji };
  }

  return { name: 'Classic Bell', emoji: '🔔' };
};
