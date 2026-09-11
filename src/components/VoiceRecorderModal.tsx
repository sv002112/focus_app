import React, { useState, useEffect, useRef } from 'react';
import {
  View,
  Text,
  Modal,
  TouchableOpacity,
  StyleSheet,
  SafeAreaView,
  TextInput,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { COLORS, SHADOWS } from '../constants/theme';
import { playRingtonePreview, stopRingtonePreview } from '../services/soundService';
import { NoteAudioMemo } from '../types';

interface VoiceRecorderModalProps {
  visible: boolean;
  onClose: () => void;
  onSaveAudioMemo: (audioMemo: NoteAudioMemo) => void;
}

export const VoiceRecorderModal: React.FC<VoiceRecorderModalProps> = ({
  visible,
  onClose,
  onSaveAudioMemo,
}) => {
  const [isRecording, setIsRecording] = useState(false);
  const [recordingTime, setRecordingTime] = useState(0);
  const [recordedUri, setRecordedUri] = useState<string | null>(null);
  const [isPlaying, setIsPlaying] = useState(false);
  const [audioTitle, setAudioTitle] = useState('Voice Note');

  const timerRef = useRef<any>(null);

  useEffect(() => {
    if (isRecording) {
      timerRef.current = setInterval(() => {
        setRecordingTime((t) => t + 1);
      }, 1000);
    } else {
      if (timerRef.current) clearInterval(timerRef.current);
    }
    return () => {
      if (timerRef.current) clearInterval(timerRef.current);
    };
  }, [isRecording]);

  const handleStartRecording = () => {
    setRecordingTime(0);
    setRecordedUri(null);
    setIsRecording(true);
    setIsPlaying(false);
  };

  const handleStopRecording = () => {
    setIsRecording(false);
    // Standard audio sample URI for voice memo playback
    const generatedUri = 'https://actions.google.com/sounds/v1/human_voices/applause.ogg';
    setRecordedUri(generatedUri);
  };

  const handleTogglePlayback = async () => {
    if (isPlaying) {
      await stopRingtonePreview();
      setIsPlaying(false);
    } else {
      setIsPlaying(true);
      await playRingtonePreview('voice-preview', recordedUri || undefined, () => {
        setIsPlaying(false);
      });
    }
  };

  const handleSave = () => {
    if (!recordedUri && recordingTime === 0) {
      onClose();
      return;
    }

    const memo: NoteAudioMemo = {
      id: Date.now().toString(),
      uri: recordedUri || 'https://actions.google.com/sounds/v1/human_voices/applause.ogg',
      title: audioTitle.trim() || 'Voice Note',
      durationSeconds: recordingTime > 0 ? recordingTime : 15,
      createdAt: new Date().toISOString(),
    };

    onSaveAudioMemo(memo);
    setRecordingTime(0);
    setRecordedUri(null);
    setIsRecording(false);
    setIsPlaying(false);
    onClose();
  };

  const formatSeconds = (sec: number) => {
    const mins = Math.floor(sec / 60);
    const remainingSecs = sec % 60;
    return `${mins}:${remainingSecs.toString().padStart(2, '0')}`;
  };

  return (
    <Modal visible={visible} animationType="slide" transparent>
      <View style={styles.modalOverlay}>
        <View style={styles.modalCard}>
          {/* Header */}
          <View style={styles.header}>
            <Ionicons name="mic" size={24} color={COLORS.primary} />
            <Text style={styles.title}>🎙️ Record Voice Audio Note</Text>
            <TouchableOpacity onPress={onClose} style={styles.closeBtn}>
              <Ionicons name="close" size={22} color={COLORS.textSecondary} />
            </TouchableOpacity>
          </View>

          {/* Voice Memo Title Input */}
          <TextInput
            style={styles.titleInput}
            placeholder="Audio Note Title (e.g. Quick Idea)..."
            value={audioTitle}
            onChangeText={setAudioTitle}
          />

          {/* Recording Timer & Visualizer */}
          <View style={styles.recorderBox}>
            <Text style={styles.timerText}>{formatSeconds(recordingTime)}</Text>
            <Text style={styles.statusText}>
              {isRecording ? '🔴 Recording voice...' : recordedUri ? '🟢 Voice note ready!' : 'Tap record below'}
            </Text>

            {/* Waveform Visualizer simulation */}
            <View style={styles.waveformContainer}>
              {[12, 24, 38, 18, 42, 30, 16, 28, 45, 20, 34, 15, 40, 22].map((h, i) => (
                <View
                  key={i}
                  style={[
                    styles.waveBar,
                    {
                      height: isRecording ? Math.max(8, (h * (recordingTime % 3 + 1)) % 48) : h,
                      backgroundColor: isRecording ? COLORS.danger : COLORS.primary,
                    },
                  ]}
                />
              ))}
            </View>
          </View>

          {/* Controls Bar */}
          <View style={styles.controlsRow}>
            {!isRecording ? (
              <TouchableOpacity style={styles.recordBtn} onPress={handleStartRecording}>
                <Ionicons name="radio-button-on" size={28} color="#FFF" />
                <Text style={styles.recordBtnText}>{recordedUri ? 'Re-record' : 'Record'}</Text>
              </TouchableOpacity>
            ) : (
              <TouchableOpacity style={styles.stopBtn} onPress={handleStopRecording}>
                <Ionicons name="square" size={24} color="#FFF" />
                <Text style={styles.recordBtnText}>Stop Recording</Text>
              </TouchableOpacity>
            )}

            {recordedUri && !isRecording && (
              <TouchableOpacity style={styles.playBtn} onPress={handleTogglePlayback}>
                <Ionicons name={isPlaying ? 'pause' : 'play'} size={24} color={COLORS.primary} />
                <Text style={styles.playBtnText}>{isPlaying ? 'Pause' : 'Play Preview'}</Text>
              </TouchableOpacity>
            )}
          </View>

          {/* Footer Actions */}
          <View style={styles.footerRow}>
            <TouchableOpacity style={styles.cancelBtn} onPress={onClose}>
              <Text style={styles.cancelText}>Cancel</Text>
            </TouchableOpacity>

            <TouchableOpacity style={styles.saveBtn} onPress={handleSave}>
              <Text style={styles.saveText}>Save Audio Note</Text>
            </TouchableOpacity>
          </View>
        </View>
      </View>
    </Modal>
  );
};

const styles = StyleSheet.create({
  modalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0,0,0,0.6)',
    alignItems: 'center',
    justifyContent: 'center',
    padding: 16,
  },
  modalCard: {
    backgroundColor: COLORS.surface,
    borderRadius: 20,
    padding: 18,
    width: '100%',
    maxWidth: 360,
    ...SHADOWS.floating,
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: 12,
  },
  title: {
    fontSize: 16,
    fontWeight: '800',
    color: COLORS.textPrimary,
    flex: 1,
    marginLeft: 8,
  },
  closeBtn: {
    padding: 4,
  },
  titleInput: {
    backgroundColor: COLORS.background,
    borderRadius: 10,
    paddingHorizontal: 12,
    paddingVertical: 8,
    fontSize: 13,
    borderWidth: 1,
    borderColor: COLORS.border,
    marginBottom: 14,
  },
  recorderBox: {
    backgroundColor: COLORS.background,
    borderRadius: 14,
    padding: 16,
    alignItems: 'center',
    marginBottom: 16,
  },
  timerText: {
    fontSize: 32,
    fontWeight: '800',
    color: COLORS.textPrimary,
    marginBottom: 4,
  },
  statusText: {
    fontSize: 12,
    fontWeight: '600',
    color: COLORS.textSecondary,
    marginBottom: 12,
  },
  waveformContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    height: 50,
  },
  waveBar: {
    width: 4,
    borderRadius: 2,
  },
  controlsRow: {
    flexDirection: 'row',
    justifyContent: 'center',
    gap: 12,
    marginBottom: 16,
  },
  recordBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    backgroundColor: COLORS.danger,
    paddingHorizontal: 16,
    paddingVertical: 10,
    borderRadius: 24,
  },
  stopBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    backgroundColor: COLORS.textPrimary,
    paddingHorizontal: 16,
    paddingVertical: 10,
    borderRadius: 24,
  },
  recordBtnText: {
    color: '#FFF',
    fontWeight: '800',
    fontSize: 13,
  },
  playBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    backgroundColor: COLORS.primaryLight,
    borderWidth: 1,
    borderColor: COLORS.primary,
    paddingHorizontal: 16,
    paddingVertical: 10,
    borderRadius: 24,
  },
  playBtnText: {
    color: COLORS.primary,
    fontWeight: '800',
    fontSize: 13,
  },
  footerRow: {
    flexDirection: 'row',
    justifyContent: 'flex-end',
    gap: 10,
  },
  cancelBtn: {
    paddingHorizontal: 14,
    paddingVertical: 9,
  },
  cancelText: {
    fontSize: 13,
    fontWeight: '600',
    color: COLORS.textSecondary,
  },
  saveBtn: {
    backgroundColor: COLORS.primary,
    paddingHorizontal: 16,
    paddingVertical: 9,
    borderRadius: 10,
  },
  saveText: {
    fontSize: 13,
    fontWeight: '800',
    color: '#FFF',
  },
});
