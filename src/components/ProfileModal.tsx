import React, { useState } from 'react';
import {
  View,
  Text,
  TouchableOpacity,
  StyleSheet,
  Modal,
  ScrollView,
  TextInput,
  Switch,
  Alert,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { UserProfile, CustomRingtone } from '../types';
import { COLORS, SHADOWS } from '../constants/theme';
import {
  BUILT_IN_RINGTONES,
  playRingtonePreview,
  stopRingtonePreview,
  pickCustomAudioFromDevice,
} from '../services/soundService';

interface ProfileModalProps {
  visible: boolean;
  onClose: () => void;
  tasksCount: number;
  completedTasksCount: number;
  notesCount: number;
  brainDumpCount: number;
  profile: UserProfile;
  onUpdateProfile: (updated: UserProfile) => void;
  onClearAllData: () => void;
}

const EMOJI_AVATARS = ['⚡', '🧠', '🎯', '🚀', '💡', '🌟', '🦊', '🎨'];

export const ProfileModal: React.FC<ProfileModalProps> = ({
  visible,
  onClose,
  tasksCount,
  completedTasksCount,
  notesCount,
  brainDumpCount,
  profile,
  onUpdateProfile,
  onClearAllData,
}) => {
  const [isEditing, setIsEditing] = useState(false);
  const [name, setName] = useState(profile.name);
  const [email, setEmail] = useState(profile.email);
  const [avatar, setAvatar] = useState(profile.avatarEmoji);
  const [playingToneId, setPlayingToneId] = useState<string | null>(null);

  const handleCloseModal = () => {
    stopRingtonePreview();
    setPlayingToneId(null);
    onClose();
  };

  const handleSelectTone = (toneId: string) => {
    onUpdateProfile({
      ...profile,
      alarmToneId: toneId,
    });
  };

  const handleTogglePreviewTone = async (toneId: string, uri?: string) => {
    if (playingToneId === toneId) {
      await stopRingtonePreview();
      setPlayingToneId(null);
    } else {
      const activeId = await playRingtonePreview(toneId, uri, () => {
        setPlayingToneId(null);
      });
      setPlayingToneId(activeId);
    }
  };

  const handlePickDeviceTone = async () => {
    const newRingtone = await pickCustomAudioFromDevice();
    if (newRingtone) {
      const updatedCustoms = [...(profile.customRingtones || []), newRingtone];
      onUpdateProfile({
        ...profile,
        alarmToneId: newRingtone.id,
        customRingtones: updatedCustoms,
      });
      Alert.alert('🔔 Custom Ringtone Set', `"${newRingtone.name}" has been set as your active alarm tone.`);
    }
  };

  const handleDeleteCustomTone = (customId: string) => {
    Alert.alert(
      'Remove Custom Ringtone',
      'Are you sure you want to remove this ringtone from your list?',
      [
        { text: 'Cancel', style: 'cancel' },
        {
          text: 'Remove',
          style: 'destructive',
          onPress: () => {
            const updatedCustoms = (profile.customRingtones || []).filter((r: CustomRingtone) => r.id !== customId);
            const isCurrentlySelected = profile.alarmToneId === customId;
            onUpdateProfile({
              ...profile,
              alarmToneId: isCurrentlySelected ? 'classic-bell' : profile.alarmToneId,
              customRingtones: updatedCustoms,
            });
          },
        },
      ]
    );
  };

  const handleSaveProfileInfo = () => {
    onUpdateProfile({
      ...profile,
      name: name.trim() || 'Focus Explorer',
      email: email.trim() || 'user@example.com',
      avatarEmoji: avatar,
    });
    setIsEditing(false);
  };

  const handleToggleSwitch = (key: keyof Pick<UserProfile, 'darkMode' | 'notificationsEnabled' | 'aiAutoOrganize'>) => {
    onUpdateProfile({
      ...profile,
      [key]: !profile[key],
    });
  };

  const handleExportData = () => {
    Alert.alert(
      '💾 Data Backup Exported',
      `Your ${tasksCount} tasks, ${notesCount} notes, and ${brainDumpCount} brain dump items are stored 100% locally on your device!`,
      [{ text: 'OK' }]
    );
  };

  const handleConfirmClearData = () => {
    Alert.alert(
      '⚠️ Clear All App Data?',
      'This will permanently reset all your tasks, notes, and brain dump items. Are you sure?',
      [
        { text: 'Cancel', style: 'cancel' },
        {
          text: 'Clear Data',
          style: 'destructive',
          onPress: () => {
            onClearAllData();
            handleCloseModal();
          },
        },
      ]
    );
  };

  return (
    <Modal visible={visible} transparent animationType="slide">
      <View style={styles.modalOverlay}>
        <View style={styles.modalCard}>
          {/* Header */}
          <View style={styles.header}>
            <Text style={styles.headerTitle}>User Profile & Settings 👤</Text>
            <TouchableOpacity onPress={handleCloseModal} style={styles.closeBtn}>
              <Ionicons name="close" size={24} color={COLORS.textSecondary} />
            </TouchableOpacity>
          </View>

          <ScrollView contentContainerStyle={styles.scrollContent} showsVerticalScrollIndicator={false}>
            {/* User Profile Card */}
            <View style={styles.profileCard}>
              <View style={styles.avatarRow}>
                <TouchableOpacity
                  style={styles.avatarCircle}
                  onPress={() => setIsEditing(!isEditing)}
                >
                  <Text style={styles.avatarEmoji}>{profile.avatarEmoji}</Text>
                  <View style={styles.editAvatarBadge}>
                    <Ionicons name="pencil" size={10} color="#FFF" />
                  </View>
                </TouchableOpacity>

                <View style={styles.profileDetails}>
                  <Text style={styles.profileName}>{profile.name}</Text>
                  <Text style={styles.profileEmail}>{profile.email}</Text>
                  <TouchableOpacity style={styles.editProfileChip} onPress={() => setIsEditing(!isEditing)}>
                    <Ionicons name="create-outline" size={12} color={COLORS.primary} />
                    <Text style={styles.editProfileText}>{isEditing ? 'Done Editing' : 'Edit Info'}</Text>
                  </TouchableOpacity>
                </View>
              </View>

              {/* Edit Mode Fields */}
              {isEditing && (
                <View style={styles.editFormBox}>
                  <Text style={styles.formLabel}>Select Avatar:</Text>
                  <View style={styles.emojiPickerRow}>
                    {EMOJI_AVATARS.map((em) => (
                      <TouchableOpacity
                        key={em}
                        style={[styles.emojiOption, avatar === em && styles.selectedEmojiOption]}
                        onPress={() => setAvatar(em)}
                      >
                        <Text style={{ fontSize: 18 }}>{em}</Text>
                      </TouchableOpacity>
                    ))}
                  </View>

                  <Text style={styles.formLabel}>Display Name:</Text>
                  <TextInput
                    style={styles.input}
                    value={name}
                    onChangeText={setName}
                    placeholder="Enter your name"
                  />

                  <Text style={styles.formLabel}>Email:</Text>
                  <TextInput
                    style={styles.input}
                    value={email}
                    onChangeText={setEmail}
                    placeholder="Enter your email"
                    keyboardType="email-address"
                    autoCapitalize="none"
                  />

                  <TouchableOpacity style={styles.saveInfoBtn} onPress={handleSaveProfileInfo}>
                    <Text style={styles.saveInfoText}>Save Changes 💾</Text>
                  </TouchableOpacity>
                </View>
              )}
            </View>

            {/* Focus Stats Summary Grid */}
            <Text style={styles.sectionHeader}>ADHD FOCUS STATS ⚡</Text>
            <View style={styles.statsGrid}>
              <View style={styles.statBox}>
                <Text style={styles.statNum}>{completedTasksCount}</Text>
                <Text style={styles.statLabel}>Completed</Text>
              </View>

              <View style={styles.statBox}>
                <Text style={styles.statNum}>{tasksCount}</Text>
                <Text style={styles.statLabel}>Total Tasks</Text>
              </View>

              <View style={styles.statBox}>
                <Text style={styles.statNum}>{notesCount}</Text>
                <Text style={styles.statLabel}>Saved Notes</Text>
              </View>

              <View style={styles.statBox}>
                <Text style={styles.statNum}>{brainDumpCount}</Text>
                <Text style={styles.statLabel}>Vault Ideas</Text>
              </View>
            </View>

            {/* App Preferences */}
            <Text style={styles.sectionHeader}>PREFERENCES & SETTINGS ⚙️</Text>
            <View style={styles.settingsGroup}>
              <View style={styles.settingRow}>
                <View style={styles.settingLabelRow}>
                  <Ionicons name="moon-outline" size={18} color={COLORS.primary} />
                  <View style={{ marginLeft: 10 }}>
                    <Text style={styles.settingTitle}>Dark Theme Mode</Text>
                    <Text style={styles.settingSub}>Comfortable night viewing</Text>
                  </View>
                </View>
                <Switch
                  value={profile.darkMode}
                  onValueChange={() => handleToggleSwitch('darkMode')}
                  trackColor={{ false: COLORS.border, true: COLORS.primaryLight }}
                  thumbColor={profile.darkMode ? COLORS.primary : '#FFF'}
                />
              </View>

              <View style={styles.settingRow}>
                <View style={styles.settingLabelRow}>
                  <Ionicons name="notifications-outline" size={18} color="#0288D1" />
                  <View style={{ marginLeft: 10 }}>
                    <Text style={styles.settingTitle}>Focus Reminders</Text>
                    <Text style={styles.settingSub}>Daily push notifications</Text>
                  </View>
                </View>
                <Switch
                  value={profile.notificationsEnabled}
                  onValueChange={() => handleToggleSwitch('notificationsEnabled')}
                  trackColor={{ false: COLORS.border, true: COLORS.primaryLight }}
                  thumbColor={profile.notificationsEnabled ? COLORS.primary : '#FFF'}
                />
              </View>

              <View style={styles.settingRow}>
                <View style={styles.settingLabelRow}>
                  <Ionicons name="sparkles-outline" size={18} color="#7B1FA2" />
                  <View style={{ marginLeft: 10 }}>
                    <Text style={styles.settingTitle}>AI Smart Auto-Organize</Text>
                    <Text style={styles.settingSub}>Intelligent brain dump sorting</Text>
                  </View>
                </View>
                <Switch
                  value={profile.aiAutoOrganize}
                  onValueChange={() => handleToggleSwitch('aiAutoOrganize')}
                  trackColor={{ false: COLORS.border, true: COLORS.primaryLight }}
                  thumbColor={profile.aiAutoOrganize ? COLORS.primary : '#FFF'}
                />
              </View>
            </View>

            {/* Alarm & Ringtone Settings */}
            <Text style={styles.sectionHeader}>ALARM & RINGTONE TONES 🔔</Text>
            <View style={styles.settingsGroup}>
              {BUILT_IN_RINGTONES.map((tone) => {
                const isSelected = (profile.alarmToneId || 'classic-bell') === tone.id;
                const isPlaying = playingToneId === tone.id;

                return (
                  <View
                    key={tone.id}
                    style={[
                      styles.toneRow,
                      isSelected && styles.selectedToneRow,
                    ]}
                  >
                    <TouchableOpacity
                      style={styles.toneSelectArea}
                      onPress={() => handleSelectTone(tone.id)}
                    >
                      <Ionicons
                        name={isSelected ? 'checkmark-circle' : 'ellipse-outline'}
                        size={20}
                        color={isSelected ? COLORS.primary : COLORS.textSecondary}
                      />
                      <Text style={styles.toneEmoji}>{tone.emoji}</Text>
                      <Text style={[styles.toneName, isSelected && styles.selectedToneName]}>
                        {tone.name}
                      </Text>
                      {isSelected && <Text style={styles.activeBadge}>Active</Text>}
                    </TouchableOpacity>

                    <TouchableOpacity
                      style={[styles.playToneBtn, isPlaying && styles.playingToneBtn]}
                      onPress={() => handleTogglePreviewTone(tone.id, tone.uri)}
                    >
                      <Ionicons
                        name={isPlaying ? 'square' : 'play'}
                        size={12}
                        color={isPlaying ? '#FFF' : COLORS.primary}
                      />
                      <Text style={[styles.playToneText, isPlaying && styles.playingToneText]}>
                        {isPlaying ? 'Stop' : 'Preview'}
                      </Text>
                    </TouchableOpacity>
                  </View>
                );
              })}

              {(profile.customRingtones || []).map((customTone: CustomRingtone) => {
                const isSelected = profile.alarmToneId === customTone.id;
                const isPlaying = playingToneId === customTone.id;

                return (
                  <View
                    key={customTone.id}
                    style={[
                      styles.toneRow,
                      isSelected && styles.selectedToneRow,
                    ]}
                  >
                    <TouchableOpacity
                      style={styles.toneSelectArea}
                      onPress={() => handleSelectTone(customTone.id)}
                    >
                      <Ionicons
                        name={isSelected ? 'checkmark-circle' : 'ellipse-outline'}
                        size={20}
                        color={isSelected ? COLORS.primary : COLORS.textSecondary}
                      />
                      <Text style={styles.toneEmoji}>📱</Text>
                      <Text
                        style={[styles.toneName, isSelected && styles.selectedToneName]}
                        numberOfLines={1}
                      >
                        {customTone.name}
                      </Text>
                      {isSelected && <Text style={styles.activeBadge}>Custom</Text>}
                    </TouchableOpacity>

                    <View style={{ flexDirection: 'row', alignItems: 'center', gap: 6 }}>
                      <TouchableOpacity
                        style={[styles.playToneBtn, isPlaying && styles.playingToneBtn]}
                        onPress={() => handleTogglePreviewTone(customTone.id, customTone.uri)}
                      >
                        <Ionicons
                          name={isPlaying ? 'square' : 'play'}
                          size={12}
                          color={isPlaying ? '#FFF' : COLORS.primary}
                        />
                        <Text style={[styles.playToneText, isPlaying && styles.playingToneText]}>
                          {isPlaying ? 'Stop' : 'Preview'}
                        </Text>
                      </TouchableOpacity>

                      <TouchableOpacity
                        style={styles.deleteToneBtn}
                        onPress={() => handleDeleteCustomTone(customTone.id)}
                      >
                        <Ionicons name="trash-outline" size={14} color={COLORS.danger} />
                      </TouchableOpacity>
                    </View>
                  </View>
                );
              })}

              <TouchableOpacity style={styles.addToneBtn} onPress={handlePickDeviceTone}>
                <Ionicons name="add-circle-outline" size={18} color={COLORS.primary} />
                <Text style={styles.addToneBtnText}>Add Ringtone from Device Storage</Text>
              </TouchableOpacity>
            </View>

            {/* Storage & Backup */}
            <Text style={styles.sectionHeader}>DATA & BACKUP 💾</Text>
            <View style={styles.settingsGroup}>
              <TouchableOpacity style={styles.actionRow} onPress={handleExportData}>
                <Ionicons name="download-outline" size={18} color={COLORS.primary} />
                <Text style={styles.actionText}>Backup & Export Local Data</Text>
                <Ionicons name="chevron-forward" size={16} color={COLORS.textSecondary} style={{ marginLeft: 'auto' }} />
              </TouchableOpacity>

              <TouchableOpacity style={[styles.actionRow, styles.dangerActionRow]} onPress={handleConfirmClearData}>
                <Ionicons name="trash-outline" size={18} color={COLORS.danger} />
                <Text style={[styles.actionText, { color: COLORS.danger }]}>Clear All Local App Data</Text>
                <Ionicons name="chevron-forward" size={16} color={COLORS.danger} style={{ marginLeft: 'auto' }} />
              </TouchableOpacity>
            </View>

            {/* App Info Footer */}
            <View style={styles.appFooter}>
              <Text style={styles.appFooterTitle}>⚡ Focus Tasks ADHD Companion</Text>
              <Text style={styles.appFooterSub}>Version 1.0.0 • 100% Offline & Private</Text>
              <Text style={styles.adhdTip}>💡 Tip: Keep tasks under 5 mins for instant momentum!</Text>
            </View>
          </ScrollView>
        </View>
      </View>
    </Modal>
  );
};

const styles = StyleSheet.create({
  modalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0,0,0,0.5)',
    justifyContent: 'flex-end',
  },
  modalCard: {
    backgroundColor: COLORS.surface,
    borderTopLeftRadius: 24,
    borderTopRightRadius: 24,
    padding: 20,
    maxHeight: '88%',
    ...SHADOWS.floating,
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingBottom: 14,
    borderBottomWidth: 1,
    borderBottomColor: COLORS.border,
  },
  headerTitle: {
    fontSize: 18,
    fontWeight: '800',
    color: COLORS.textPrimary,
  },
  closeBtn: {
    padding: 4,
  },
  scrollContent: {
    paddingVertical: 14,
  },
  profileCard: {
    backgroundColor: COLORS.background,
    borderRadius: 16,
    padding: 14,
    borderWidth: 1,
    borderColor: COLORS.border,
    marginBottom: 16,
  },
  avatarRow: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  avatarCircle: {
    width: 60,
    height: 60,
    borderRadius: 30,
    backgroundColor: COLORS.primaryLight,
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: 2,
    borderColor: COLORS.primary,
    position: 'relative',
  },
  avatarEmoji: {
    fontSize: 30,
  },
  editAvatarBadge: {
    position: 'absolute',
    bottom: -2,
    right: -2,
    backgroundColor: COLORS.primary,
    borderRadius: 10,
    width: 18,
    height: 18,
    alignItems: 'center',
    justifyContent: 'center',
  },
  profileDetails: {
    marginLeft: 14,
    flex: 1,
  },
  profileName: {
    fontSize: 16,
    fontWeight: '800',
    color: COLORS.textPrimary,
  },
  profileEmail: {
    fontSize: 12,
    color: COLORS.textSecondary,
    marginTop: 2,
  },
  editProfileChip: {
    flexDirection: 'row',
    alignItems: 'center',
    marginTop: 6,
    gap: 4,
  },
  editProfileText: {
    fontSize: 11,
    fontWeight: '700',
    color: COLORS.primary,
  },
  editFormBox: {
    marginTop: 14,
    paddingTop: 12,
    borderTopWidth: 1,
    borderTopColor: COLORS.border,
  },
  formLabel: {
    fontSize: 12,
    fontWeight: '700',
    color: COLORS.textSecondary,
    marginBottom: 6,
    marginTop: 8,
  },
  emojiPickerRow: {
    flexDirection: 'row',
    gap: 8,
    marginBottom: 8,
  },
  emojiOption: {
    width: 34,
    height: 34,
    borderRadius: 17,
    backgroundColor: COLORS.surface,
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: 1,
    borderColor: COLORS.border,
  },
  selectedEmojiOption: {
    borderColor: COLORS.primary,
    backgroundColor: COLORS.primaryLight,
    borderWidth: 2,
  },
  input: {
    backgroundColor: COLORS.surface,
    borderRadius: 10,
    paddingHorizontal: 12,
    paddingVertical: 8,
    fontSize: 13,
    color: COLORS.textPrimary,
    borderWidth: 1,
    borderColor: COLORS.border,
  },
  saveInfoBtn: {
    backgroundColor: COLORS.primary,
    borderRadius: 10,
    paddingVertical: 10,
    alignItems: 'center',
    marginTop: 12,
  },
  saveInfoText: {
    color: '#FFF',
    fontSize: 13,
    fontWeight: '700',
  },
  sectionHeader: {
    fontSize: 11,
    fontWeight: '800',
    color: COLORS.textSecondary,
    marginBottom: 10,
    marginTop: 6,
    letterSpacing: 1,
  },
  statsGrid: {
    flexDirection: 'row',
    gap: 8,
    marginBottom: 18,
  },
  statBox: {
    flex: 1,
    backgroundColor: COLORS.background,
    borderRadius: 12,
    padding: 10,
    alignItems: 'center',
    borderWidth: 1,
    borderColor: COLORS.border,
  },
  statNum: {
    fontSize: 18,
    fontWeight: '800',
    color: COLORS.primary,
  },
  statLabel: {
    fontSize: 10,
    fontWeight: '700',
    color: COLORS.textSecondary,
    marginTop: 2,
  },
  settingsGroup: {
    backgroundColor: COLORS.background,
    borderRadius: 14,
    padding: 4,
    borderWidth: 1,
    borderColor: COLORS.border,
    marginBottom: 18,
  },
  settingRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    padding: 10,
  },
  settingLabelRow: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  settingTitle: {
    fontSize: 13,
    fontWeight: '700',
    color: COLORS.textPrimary,
  },
  settingSub: {
    fontSize: 11,
    color: COLORS.textSecondary,
  },
  toneRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingVertical: 10,
    paddingHorizontal: 12,
    borderBottomWidth: 1,
    borderBottomColor: COLORS.border,
  },
  selectedToneRow: {
    backgroundColor: COLORS.primaryLight + '25',
  },
  toneSelectArea: {
    flexDirection: 'row',
    alignItems: 'center',
    flex: 1,
    gap: 8,
  },
  toneEmoji: {
    fontSize: 16,
  },
  toneName: {
    fontSize: 13,
    fontWeight: '600',
    color: COLORS.textPrimary,
    flex: 1,
  },
  selectedToneName: {
    fontWeight: '700',
    color: COLORS.primary,
  },
  activeBadge: {
    fontSize: 10,
    fontWeight: '800',
    color: COLORS.primary,
    backgroundColor: COLORS.primaryLight,
    paddingHorizontal: 6,
    paddingVertical: 2,
    borderRadius: 6,
    marginRight: 6,
  },
  playToneBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    backgroundColor: COLORS.surface,
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 8,
    borderWidth: 1,
    borderColor: COLORS.primary,
  },
  playingToneBtn: {
    backgroundColor: COLORS.primary,
  },
  playToneText: {
    fontSize: 11,
    fontWeight: '700',
    color: COLORS.primary,
  },
  playingToneText: {
    color: '#FFF',
  },
  deleteToneBtn: {
    padding: 5,
    borderRadius: 8,
    backgroundColor: COLORS.surface,
    borderWidth: 1,
    borderColor: COLORS.border,
  },
  addToneBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 8,
    paddingVertical: 12,
    backgroundColor: COLORS.surface,
  },
  addToneBtnText: {
    fontSize: 13,
    fontWeight: '700',
    color: COLORS.primary,
  },
  actionRow: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: 12,
    gap: 10,
  },
  dangerActionRow: {
    borderTopWidth: 1,
    borderTopColor: COLORS.border,
  },
  actionText: {
    fontSize: 13,
    fontWeight: '700',
    color: COLORS.textPrimary,
  },
  appFooter: {
    alignItems: 'center',
    paddingVertical: 14,
  },
  appFooterTitle: {
    fontSize: 13,
    fontWeight: '800',
    color: COLORS.textPrimary,
  },
  appFooterSub: {
    fontSize: 11,
    color: COLORS.textSecondary,
    marginTop: 2,
  },
  adhdTip: {
    fontSize: 11,
    fontWeight: '600',
    color: COLORS.primary,
    marginTop: 8,
    textAlign: 'center',
  },
});
