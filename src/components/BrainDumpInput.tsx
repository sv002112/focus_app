import React, { useState } from 'react';
import { View, Text, TextInput, TouchableOpacity, StyleSheet, Modal } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { BrainDumpType } from '../types';
import { COLORS, SHADOWS } from '../constants/theme';

interface BrainDumpInputProps {
  onAddDumpItem: (type: BrainDumpType, content: string, contextNote?: string) => void;
}

export const BrainDumpInput: React.FC<BrainDumpInputProps> = ({ onAddDumpItem }) => {
  const [activeModal, setActiveModal] = useState<BrainDumpType | null>(null);
  const [primaryInput, setPrimaryInput] = useState('');
  const [contextNote, setContextNote] = useState('');
  const [isRecording, setIsRecording] = useState(false);

  const handleOpenType = (type: BrainDumpType) => {
    setPrimaryInput('');
    setContextNote('');
    setActiveModal(type);
  };

  const handleSave = () => {
    if (!activeModal) return;
    
    let contentToSave = primaryInput.trim();
    if (activeModal === 'audio') {
      contentToSave = primaryInput.trim() || '🎙️ Recorded Audio Voice Memo';
    }

    if (!contentToSave) return;

    onAddDumpItem(activeModal, contentToSave, contextNote.trim() || undefined);
    setActiveModal(null);
  };

  return (
    <View style={styles.container}>
      <Text style={styles.promptText}>🧠 What's on your mind? Dump it raw!</Text>
      
      <View style={styles.btnRow}>
        <TouchableOpacity style={styles.typeBtn} onPress={() => handleOpenType('text')}>
          <Ionicons name="create-outline" size={18} color={COLORS.primary} />
          <Text style={styles.btnLabel}>Text</Text>
        </TouchableOpacity>

        <TouchableOpacity style={styles.typeBtn} onPress={() => handleOpenType('link')}>
          <Ionicons name="link-outline" size={18} color="#0288D1" />
          <Text style={styles.btnLabel}>Link + Note</Text>
        </TouchableOpacity>

        <TouchableOpacity style={styles.typeBtn} onPress={() => handleOpenType('image')}>
          <Ionicons name="image-outline" size={18} color="#7B1FA2" />
          <Text style={styles.btnLabel}>Photo + Note</Text>
        </TouchableOpacity>

        <TouchableOpacity style={styles.typeBtn} onPress={() => handleOpenType('audio')}>
          <Ionicons name="mic-outline" size={18} color="#E65100" />
          <Text style={styles.btnLabel}>Voice Memo</Text>
        </TouchableOpacity>
      </View>

      {/* Capture Input Modal */}
      <Modal visible={activeModal !== null} transparent animationType="slide">
        <View style={styles.modalOverlay}>
          <View style={styles.modalCard}>
            <View style={styles.modalHeader}>
              <Text style={styles.modalTitle}>
                {activeModal === 'text' && '📝 Quick Thought'}
                {activeModal === 'link' && '🔗 Web Link + Note'}
                {activeModal === 'image' && '📷 Photo Reference + Note'}
                {activeModal === 'audio' && '🎙️ Voice Memo'}
              </Text>
              <TouchableOpacity onPress={() => setActiveModal(null)}>
                <Ionicons name="close" size={24} color={COLORS.textSecondary} />
              </TouchableOpacity>
            </View>

            {/* Form Fields depending on type */}
            {activeModal === 'text' && (
              <TextInput
                style={[styles.input, styles.multiline]}
                placeholder="Write your raw thought here... (no need to categorize now!)"
                value={primaryInput}
                onChangeText={setPrimaryInput}
                multiline
                autoFocus
              />
            )}

            {activeModal === 'link' && (
              <>
                <TextInput
                  style={styles.input}
                  placeholder="Paste URL (e.g. https://example.com)"
                  value={primaryInput}
                  onChangeText={setPrimaryInput}
                  autoCapitalize="none"
                  autoFocus
                />
                <TextInput
                  style={[styles.input, styles.multiline, { marginTop: 8 }]}
                  placeholder="Optional context note (Why did you save this?)"
                  value={contextNote}
                  onChangeText={setContextNote}
                  multiline
                />
              </>
            )}

            {activeModal === 'image' && (
              <>
                <TextInput
                  style={styles.input}
                  placeholder="Image URL or local photo description"
                  value={primaryInput}
                  onChangeText={setPrimaryInput}
                  autoFocus
                />
                <TextInput
                  style={[styles.input, styles.multiline, { marginTop: 8 }]}
                  placeholder="Optional note about this photo"
                  value={contextNote}
                  onChangeText={setContextNote}
                  multiline
                />
              </>
            )}

            {activeModal === 'audio' && (
              <View style={styles.audioBox}>
                <TouchableOpacity
                  style={[styles.micBtnLarge, isRecording && styles.micRecording]}
                  onPress={() => setIsRecording(!isRecording)}
                >
                  <Ionicons name={isRecording ? 'stop' : 'mic'} size={32} color="#FFF" />
                </TouchableOpacity>
                <Text style={styles.audioStatusText}>
                  {isRecording ? '🔴 Recording... Tap to stop' : 'Tap to start voice recording'}
                </Text>
                <TextInput
                  style={[styles.input, styles.multiline, { marginTop: 12 }]}
                  placeholder="Add optional notes for this voice memo..."
                  value={contextNote}
                  onChangeText={setContextNote}
                  multiline
                />
              </View>
            )}

            <TouchableOpacity style={styles.saveSubmitBtn} onPress={handleSave}>
              <Text style={styles.saveSubmitText}>Save to Brain Dump 🧠</Text>
            </TouchableOpacity>
          </View>
        </View>
      </Modal>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    backgroundColor: COLORS.surface,
    padding: 12,
    borderRadius: 14,
    marginBottom: 12,
    borderWidth: 1,
    borderColor: COLORS.border,
    ...SHADOWS.card,
  },
  promptText: {
    fontSize: 13,
    fontWeight: '700',
    color: COLORS.textSecondary,
    marginBottom: 10,
  },
  btnRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    gap: 6,
  },
  typeBtn: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 8,
    backgroundColor: COLORS.background,
    borderRadius: 10,
    borderWidth: 1,
    borderColor: COLORS.border,
  },
  btnLabel: {
    fontSize: 11,
    fontWeight: '600',
    color: COLORS.textPrimary,
    marginTop: 4,
  },
  modalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0,0,0,0.5)',
    justifyContent: 'flex-end',
  },
  modalCard: {
    backgroundColor: COLORS.surface,
    borderTopLeftRadius: 20,
    borderTopRightRadius: 20,
    padding: 16,
    maxHeight: '80%',
  },
  modalHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 14,
  },
  modalTitle: {
    fontSize: 16,
    fontWeight: '700',
    color: COLORS.textPrimary,
  },
  input: {
    backgroundColor: COLORS.background,
    borderRadius: 10,
    padding: 12,
    fontSize: 14,
    color: COLORS.textPrimary,
    borderWidth: 1,
    borderColor: COLORS.border,
  },
  multiline: {
    minHeight: 80,
    textAlignVertical: 'top',
  },
  audioBox: {
    alignItems: 'center',
    paddingVertical: 12,
  },
  micBtnLarge: {
    width: 64,
    height: 64,
    borderRadius: 32,
    backgroundColor: COLORS.primary,
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 8,
  },
  micRecording: {
    backgroundColor: COLORS.danger,
  },
  audioStatusText: {
    fontSize: 12,
    fontWeight: '600',
    color: COLORS.textSecondary,
  },
  saveSubmitBtn: {
    backgroundColor: COLORS.primary,
    borderRadius: 12,
    paddingVertical: 12,
    alignItems: 'center',
    marginTop: 16,
  },
  saveSubmitText: {
    color: '#FFF',
    fontSize: 15,
    fontWeight: '700',
  },
});
