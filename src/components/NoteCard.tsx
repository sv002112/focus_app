import React from 'react';
import { View, Text, TouchableOpacity, StyleSheet } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { Note } from '../types';
import { COLORS, SHADOWS } from '../constants/theme';

interface NoteCardProps {
  note: Note;
  onPressNote: (note: Note) => void;
  onTogglePin: (id: string) => void;
  onDeleteNote: (id: string) => void;
}

export const NoteCard: React.FC<NoteCardProps> = ({
  note,
  onPressNote,
  onTogglePin,
  onDeleteNote,
}) => {
  return (
    <TouchableOpacity
      style={[
        styles.card,
        { backgroundColor: note.color || COLORS.surface },
      ]}
      onPress={() => onPressNote(note)}
      activeOpacity={0.8}
    >
      {/* Header */}
      <View style={styles.headerRow}>
        <Text style={styles.titleText} numberOfLines={1}>
          {note.title || 'Untitled Note'}
        </Text>
        <TouchableOpacity onPress={() => onTogglePin(note.id)} style={styles.pinBtn}>
          <Ionicons
            name={note.isPinned ? 'pin' : 'pin-outline'}
            size={16}
            color={note.isPinned ? COLORS.primary : COLORS.textSecondary}
          />
        </TouchableOpacity>
      </View>

      {/* Body Content */}
      {note.content ? (
        <Text style={styles.contentText} numberOfLines={4}>
          {note.content}
        </Text>
      ) : null}

      {/* Checklist Items if present */}
      {note.checklist && note.checklist.length > 0 ? (
        <View style={styles.checklistContainer}>
          {note.checklist.slice(0, 3).map((item) => (
            <View key={item.id} style={styles.checkItemRow}>
              <Ionicons
                name={item.completed ? 'checkbox' : 'square-outline'}
                size={14}
                color={COLORS.textSecondary}
              />
              <Text
                style={[
                  styles.checkItemText,
                  item.completed && styles.checkItemCompleted,
                ]}
                numberOfLines={1}
              >
                {item.text}
              </Text>
            </View>
          ))}
          {note.checklist.length > 3 && (
            <Text style={styles.moreText}>+{note.checklist.length - 3} more items</Text>
          )}
        </View>
      ) : null}

      {/* Tags Footer */}
      <View style={styles.footerRow}>
        <View style={styles.tagGroup}>
          {note.tags.map((tag, idx) => (
            <Text key={idx} style={styles.tagText}>
              #{tag}
            </Text>
          ))}
        </View>
        <TouchableOpacity onPress={() => onDeleteNote(note.id)}>
          <Ionicons name="trash-outline" size={14} color={COLORS.textSecondary} />
        </TouchableOpacity>
      </View>
    </TouchableOpacity>
  );
};

const styles = StyleSheet.create({
  card: {
    borderRadius: 12,
    padding: 12,
    marginBottom: 10,
    borderWidth: 1,
    borderColor: 'rgba(0,0,0,0.08)',
    ...SHADOWS.card,
  },
  headerRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: 6,
  },
  titleText: {
    fontSize: 15,
    fontWeight: '700',
    color: COLORS.textPrimary,
    flex: 1,
    marginRight: 6,
  },
  pinBtn: {
    padding: 2,
  },
  contentText: {
    fontSize: 13,
    color: COLORS.textPrimary,
    lineHeight: 18,
    marginBottom: 8,
  },
  checklistContainer: {
    marginBottom: 8,
  },
  checkItemRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    marginVertical: 2,
  },
  checkItemText: {
    fontSize: 12,
    color: COLORS.textPrimary,
    flex: 1,
  },
  checkItemCompleted: {
    textDecorationLine: 'line-through',
    color: COLORS.textSecondary,
  },
  moreText: {
    fontSize: 11,
    color: COLORS.textSecondary,
    fontStyle: 'italic',
    marginTop: 2,
  },
  footerRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginTop: 4,
  },
  tagGroup: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 6,
  },
  tagText: {
    fontSize: 11,
    color: COLORS.textSecondary,
    fontWeight: '600',
  },
});
