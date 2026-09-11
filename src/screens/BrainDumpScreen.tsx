import React, { useState } from 'react';
import {
  View,
  Text,
  TouchableOpacity,
  FlatList,
  StyleSheet,
  SafeAreaView,
  Modal,
  StatusBar,
  Platform,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { BrainDumpItem, BrainDumpType, AISuggestion, Task, Note } from '../types';
import { COLORS, SHADOWS } from '../constants/theme';
import { BrainDumpInput } from '../components/BrainDumpInput';
import { BatteryMeter } from '../components/BatteryMeter';
import { organizeBrainDumpAI } from '../services/aiService';

interface BrainDumpScreenProps {
  items: BrainDumpItem[];
  onAddDumpItem: (type: BrainDumpType, content: string, contextNote?: string) => void;
  onDeleteDumpItem: (id: string) => void;
  onConvertToTask: (task: Task) => void;
  onConvertToNote: (note: Note) => void;
  onOpenProfile?: () => void;
  avatarEmoji?: string;
}

export const BrainDumpScreen: React.FC<BrainDumpScreenProps> = ({
  items,
  onAddDumpItem,
  onDeleteDumpItem,
  onConvertToTask,
  onConvertToNote,
  onOpenProfile,
  avatarEmoji = '⚡',
}) => {
  const [selectedItem, setSelectedItem] = useState<BrainDumpItem | null>(null);
  const [aiProposal, setAiProposal] = useState<AISuggestion | null>(null);

  const handleOrganizeWithAI = (item: BrainDumpItem) => {
    const proposal = organizeBrainDumpAI(item);
    setSelectedItem(item);
    setAiProposal(proposal);
  };

  const handleAcceptProposal = () => {
    if (!selectedItem || !aiProposal) return;

    if (aiProposal.itemType === 'task') {
      const newTask: Task = {
        id: Date.now().toString(),
        title: aiProposal.title,
        description: aiProposal.description,
        isRecurring: !!aiProposal.isRecurring,
        repeatFrequency: aiProposal.repeatFrequency,
        dueDate: new Date().toISOString(),
        energyLevel: aiProposal.energyLevel || 2,
        subTasks: (aiProposal.suggestedSubTasks || []).map((t, idx) => ({
          id: `${Date.now()}-${idx}`,
          title: t,
          completed: false,
        })),
        completed: false,
        createdAt: new Date().toISOString(),
      };
      onConvertToTask(newTask);
    } else {
      const newNote: Note = {
        id: Date.now().toString(),
        title: aiProposal.title,
        content: aiProposal.description || '',
        type: aiProposal.noteType || 'text',
        color: aiProposal.noteColor || '#FFF9C4',
        category: aiProposal.category || 'Ideas',
        isPinned: false,
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString(),
      };
      onConvertToNote(newNote);
    }

    // Remove from raw brain dump after converting
    onDeleteDumpItem(selectedItem.id);
    setSelectedItem(null);
    setAiProposal(null);
  };

  return (
    <SafeAreaView style={styles.container}>
      <View style={styles.header}>
        {onOpenProfile && (
          <TouchableOpacity style={styles.profileHeaderBtn} onPress={onOpenProfile}>
            <Text style={{ fontSize: 20 }}>{avatarEmoji}</Text>
          </TouchableOpacity>
        )}
        <View style={{ flex: 1 }}>
          <Text style={styles.appTitle}>AI Brain Dump 🧠</Text>
          <Text style={styles.subTitle}>100% Local idea parking lot</Text>
        </View>
      </View>

      <FlatList
        data={items}
        keyExtractor={(item) => item.id}
        ListHeaderComponent={
          <BrainDumpInput onAddDumpItem={onAddDumpItem} />
        }
        contentContainerStyle={styles.listContainer}
        renderItem={({ item }) => (
          <View style={styles.dumpCard}>
            <View style={styles.cardHeader}>
              <View style={styles.typeBadge}>
                {item.type === 'text' && <Ionicons name="create-outline" size={14} color={COLORS.primary} />}
                {item.type === 'link' && <Ionicons name="link-outline" size={14} color="#0288D1" />}
                {item.type === 'image' && <Ionicons name="image-outline" size={14} color="#7B1FA2" />}
                {item.type === 'audio' && <Ionicons name="mic-outline" size={14} color="#E65100" />}
                <Text style={styles.typeText}>{item.type.toUpperCase()}</Text>
              </View>

              <TouchableOpacity onPress={() => onDeleteDumpItem(item.id)}>
                <Ionicons name="trash-outline" size={16} color={COLORS.textSecondary} />
              </TouchableOpacity>
            </View>

            {/* Content Preview */}
            <Text style={styles.contentText}>{item.content}</Text>

            {/* Optional Context Note */}
            {item.contextNote ? (
              <View style={styles.contextNoteBox}>
                <Ionicons name="chatbox-ellipses-outline" size={12} color={COLORS.textSecondary} />
                <Text style={styles.contextNoteText}>{item.contextNote}</Text>
              </View>
            ) : null}

            {/* Organize with AI Button */}
            <TouchableOpacity
              style={styles.organizeAiBtn}
              onPress={() => handleOrganizeWithAI(item)}
            >
              <Ionicons name="sparkles" size={16} color="#FFF" />
              <Text style={styles.organizeAiText}>Organize with AI ✨</Text>
            </TouchableOpacity>
          </View>
        )}
        ListEmptyComponent={
          <View style={styles.emptyState}>
            <Ionicons name="bulb-outline" size={48} color={COLORS.textSecondary} />
            <Text style={styles.emptyTitle}>Vault is Empty</Text>
            <Text style={styles.emptySub}>
              Use the input buttons above to dump thoughts, links, photos, or voice notes!
            </Text>
          </View>
        }
      />

      {/* AI Recommendation Modal */}
      <Modal visible={aiProposal !== null} transparent animationType="fade">
        <View style={styles.modalOverlay}>
          <View style={styles.modalCard}>
            <View style={styles.proposalHeader}>
              <Ionicons name="sparkles" size={24} color={COLORS.primary} />
              <Text style={styles.proposalTitle}>AI Suggestion ✨</Text>
            </View>

            {aiProposal && (
              <View style={styles.proposalBody}>
                <Text style={styles.itemTypeLabel}>
                  {aiProposal.itemType === 'task' ? '📌 Proposed Task' : '📝 Proposed Note'}
                </Text>
                
                <Text style={styles.proposalTitleText}>{aiProposal.title}</Text>
                {aiProposal.description ? (
                  <Text style={styles.proposalDescText}>{aiProposal.description}</Text>
                ) : null}

                {aiProposal.itemType === 'task' && aiProposal.energyLevel && (
                  <View style={styles.energyProposalRow}>
                    <Text style={styles.energyProposalLabel}>Suggested Energy:</Text>
                    <BatteryMeter level={aiProposal.energyLevel} showLabel />
                  </View>
                )}

                {aiProposal.suggestedSubTasks && aiProposal.suggestedSubTasks.length > 0 && (
                  <View style={styles.subProposalBox}>
                    <Text style={styles.subProposalLabel}>Extracted Sub-steps:</Text>
                    {aiProposal.suggestedSubTasks.map((step, idx) => (
                      <Text key={idx} style={styles.subProposalItem}>• {step}</Text>
                    ))}
                  </View>
                )}
              </View>
            )}

            <View style={styles.proposalBtnGroup}>
              <TouchableOpacity
                style={styles.acceptBtn}
                onPress={handleAcceptProposal}
              >
                <Text style={styles.acceptText}>
                  {aiProposal?.itemType === 'task' ? 'Accept & Add to Tasks ⚡' : 'Accept & Add to Notes 📌'}
                </Text>
              </TouchableOpacity>

              <TouchableOpacity
                style={styles.keepRawBtn}
                onPress={() => setAiProposal(null)}
              >
                <Text style={styles.keepRawText}>Keep Raw in Dump 📁</Text>
              </TouchableOpacity>
            </View>
          </View>
        </View>
      </Modal>
    </SafeAreaView>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: COLORS.background,
    paddingTop: Platform.OS === 'android' ? (StatusBar.currentHeight || 24) : 0,
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 16,
    paddingVertical: 12,
    backgroundColor: COLORS.surface,
    borderBottomWidth: 1,
    borderBottomColor: COLORS.border,
  },
  profileHeaderBtn: {
    width: 36,
    height: 36,
    borderRadius: 18,
    backgroundColor: COLORS.primaryLight,
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: 10,
    borderWidth: 1,
    borderColor: COLORS.primary,
  },
  appTitle: {
    fontSize: 20,
    fontWeight: '800',
    color: COLORS.textPrimary,
  },
  subTitle: {
    fontSize: 11,
    color: COLORS.textSecondary,
  },
  listContainer: {
    padding: 12,
    paddingBottom: 80,
  },
  dumpCard: {
    backgroundColor: COLORS.surface,
    borderRadius: 12,
    padding: 12,
    marginBottom: 10,
    borderWidth: 1,
    borderColor: COLORS.border,
    ...SHADOWS.card,
  },
  cardHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: 8,
  },
  typeBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: COLORS.background,
    paddingVertical: 2,
    paddingHorizontal: 6,
    borderRadius: 6,
    gap: 4,
  },
  typeText: {
    fontSize: 10,
    fontWeight: '700',
    color: COLORS.textSecondary,
  },
  contentText: {
    fontSize: 14,
    color: COLORS.textPrimary,
    fontWeight: '500',
  },
  contextNoteBox: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: COLORS.primaryLight,
    padding: 6,
    borderRadius: 6,
    marginTop: 6,
    gap: 6,
  },
  contextNoteText: {
    fontSize: 12,
    color: COLORS.primary,
    flex: 1,
  },
  organizeAiBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: COLORS.primary,
    borderRadius: 8,
    paddingVertical: 8,
    marginTop: 10,
    gap: 6,
  },
  organizeAiText: {
    color: '#FFF',
    fontSize: 13,
    fontWeight: '700',
  },
  emptyState: {
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 40,
  },
  emptyTitle: {
    fontSize: 16,
    fontWeight: '700',
    color: COLORS.textPrimary,
    marginTop: 8,
  },
  emptySub: {
    fontSize: 12,
    color: COLORS.textSecondary,
    textAlign: 'center',
    marginTop: 4,
    maxWidth: 240,
  },
  modalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0,0,0,0.5)',
    alignItems: 'center',
    justifyContent: 'center',
    padding: 20,
  },
  modalCard: {
    backgroundColor: COLORS.surface,
    borderRadius: 16,
    padding: 20,
    width: '100%',
    ...SHADOWS.floating,
  },
  proposalHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    marginBottom: 12,
  },
  proposalTitle: {
    fontSize: 18,
    fontWeight: '800',
    color: COLORS.textPrimary,
  },
  proposalBody: {
    backgroundColor: COLORS.background,
    padding: 12,
    borderRadius: 10,
    marginBottom: 16,
  },
  itemTypeLabel: {
    fontSize: 11,
    fontWeight: '700',
    color: COLORS.primary,
    marginBottom: 4,
  },
  proposalTitleText: {
    fontSize: 15,
    fontWeight: '700',
    color: COLORS.textPrimary,
  },
  proposalDescText: {
    fontSize: 12,
    color: COLORS.textSecondary,
    marginTop: 4,
  },
  energyProposalRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginTop: 8,
  },
  energyProposalLabel: {
    fontSize: 12,
    color: COLORS.textSecondary,
    fontWeight: '600',
  },
  subProposalBox: {
    marginTop: 8,
    paddingTop: 8,
    borderTopWidth: 1,
    borderTopColor: COLORS.border,
  },
  subProposalLabel: {
    fontSize: 11,
    fontWeight: '700',
    color: COLORS.textSecondary,
    marginBottom: 4,
  },
  subProposalItem: {
    fontSize: 12,
    color: COLORS.textPrimary,
    marginVertical: 1,
  },
  proposalBtnGroup: {
    gap: 8,
  },
  acceptBtn: {
    backgroundColor: COLORS.primary,
    borderRadius: 10,
    paddingVertical: 12,
    alignItems: 'center',
  },
  acceptText: {
    color: '#FFF',
    fontSize: 14,
    fontWeight: '700',
  },
  keepRawBtn: {
    backgroundColor: COLORS.background,
    borderRadius: 10,
    paddingVertical: 10,
    alignItems: 'center',
  },
  keepRawText: {
    color: COLORS.textSecondary,
    fontSize: 13,
    fontWeight: '600',
  },
});
