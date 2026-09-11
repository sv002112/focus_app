import React, { useState } from 'react';
import { View, Text, TouchableOpacity, StyleSheet, Image, Linking } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { Note, NoteAudioMemo, NoteWebLink } from '../types';
import { COLORS, SHADOWS, DEFAULT_CATEGORIES } from '../constants/theme';
import { playRingtonePreview, stopRingtonePreview } from '../services/soundService';

interface NoteCardProps {
  note: Note;
  onPressNote: (note: Note) => void;
  onTogglePin: (id: string) => void;
  onDeleteNote: (id: string) => void;
  onToggleArchiveNote?: (id: string) => void;
  onRestoreNote?: (id: string) => void;
  onPermanentDeleteNote?: (id: string) => void;
  onToggleChecklistItem?: (noteId: string, itemId: string) => void;
  onOpenImageLightbox?: (uri: string, title?: string) => void;
  isGridView?: boolean;
}

export const NoteCard: React.FC<NoteCardProps> = ({
  note,
  onPressNote,
  onTogglePin,
  onDeleteNote,
  onToggleArchiveNote,
  onRestoreNote,
  onPermanentDeleteNote,
  onToggleChecklistItem,
  onOpenImageLightbox,
  isGridView = false,
}) => {
  const [playingAudioId, setPlayingAudioId] = useState<string | null>(null);

  // Category Icon Match
  const matchedCategory = DEFAULT_CATEGORIES.find(
    (c) => c.name.toLowerCase() === (note.category || 'General').toLowerCase()
  );
  const categoryIcon = matchedCategory ? matchedCategory.icon : 'journal-outline';

  // Gather all Images (both single imageUri and array images)
  const allImages: string[] = [];
  if (note.imageUri) allImages.push(note.imageUri);
  if (note.images && note.images.length > 0) {
    note.images.forEach((img) => {
      if (!allImages.includes(img)) allImages.push(img);
    });
  }

  // Gather all Canvas Sketches
  const allDrawings: string[] = [];
  if (note.drawingUri) allDrawings.push(note.drawingUri);
  if (note.drawings && note.drawings.length > 0) {
    note.drawings.forEach((d) => {
      if (!allDrawings.includes(d)) allDrawings.push(d);
    });
  }

  // Gather all Voice Memos
  const allAudioMemos: NoteAudioMemo[] = note.audioMemos ? [...note.audioMemos] : [];
  if (note.audioUri && !allAudioMemos.some((a) => a.uri === note.audioUri)) {
    allAudioMemos.push({
      id: 'legacy-audio',
      uri: note.audioUri,
      title: 'Voice Note',
      durationSeconds: 15,
      createdAt: note.createdAt,
    });
  }

  // Checklist items
  const isChecklist = note.type === 'checklist' || (!note.type && note.checklist && note.checklist.length > 0);
  const activeChecklist = note.checklist ? note.checklist.filter((i) => !i.completed) : [];
  const completedChecklist = note.checklist ? note.checklist.filter((i) => i.completed) : [];
  const displayChecklist = [...activeChecklist, ...completedChecklist];

  // Play/Pause Voice Audio
  const handleTogglePlayAudio = async (audioId: string, uri: string) => {
    if (playingAudioId === audioId) {
      await stopRingtonePreview();
      setPlayingAudioId(null);
    } else {
      setPlayingAudioId(audioId);
      await playRingtonePreview(audioId, uri, () => {
        setPlayingAudioId(null);
      });
    }
  };

  return (
    <TouchableOpacity
      style={[
        styles.card,
        isGridView && styles.gridCard,
        { backgroundColor: note.color || COLORS.surface },
      ]}
      onPress={() => onPressNote(note)}
      activeOpacity={0.85}
    >
      {/* Attached Images (Full Aspect Ratio Preserve, No Crop + Lightbox Trigger) */}
      {allImages.length > 0 && (
        <View style={styles.mediaContainer}>
          {allImages.slice(0, 2).map((imgUri, idx) => (
            <TouchableOpacity
              key={idx}
              style={styles.imageWrapper}
              activeOpacity={0.9}
              onPress={(e) => {
                e.stopPropagation();
                if (onOpenImageLightbox) {
                  onOpenImageLightbox(imgUri, `${note.title || 'Note'} - Image ${idx + 1}`);
                } else {
                  onPressNote(note);
                }
              }}
            >
              <Image
                source={{ uri: imgUri }}
                style={styles.cardImageFit}
                resizeMode="contain"
              />
            </TouchableOpacity>
          ))}
          {allImages.length > 2 && (
            <Text style={styles.moreMediaText}>+{allImages.length - 2} more photos</Text>
          )}
        </View>
      )}

      {/* Attached Canvas Sketches (Full Aspect Ratio & Contrast + Lightbox Trigger) */}
      {allDrawings.length > 0 && (
        <View style={styles.drawingContainer}>
          {allDrawings.slice(0, 2).map((dwgUri, idx) => (
            <TouchableOpacity
              key={idx}
              style={styles.drawingWrapper}
              activeOpacity={0.9}
              onPress={(e) => {
                e.stopPropagation();
                if (onOpenImageLightbox) {
                  onOpenImageLightbox(dwgUri, `${note.title || 'Note'} - Canvas Sketch`);
                } else {
                  onPressNote(note);
                }
              }}
            >
              <Image
                source={{ uri: dwgUri }}
                style={styles.cardImageFit}
                resizeMode="contain"
              />
            </TouchableOpacity>
          ))}
        </View>
      )}

      {/* Header Row Title & Pin / Restore Action */}
      <View style={styles.headerRow}>
        <Text style={styles.titleText} numberOfLines={2}>
          {note.title || 'Untitled Note'}
        </Text>
        
        {note.isTrashed ? (
          <TouchableOpacity onPress={() => onRestoreNote && onRestoreNote(note.id)} style={styles.actionBtn}>
            <Ionicons name="refresh-outline" size={16} color={COLORS.primary} />
          </TouchableOpacity>
        ) : (
          <TouchableOpacity onPress={() => onTogglePin(note.id)} style={styles.actionBtn}>
            <Ionicons
              name={note.isPinned ? 'pin' : 'pin-outline'}
              size={16}
              color={note.isPinned ? COLORS.primary : COLORS.textSecondary}
            />
          </TouchableOpacity>
        )}
      </View>

      {/* Body Content - Text Note Mode */}
      {!isChecklist && note.content ? (
        <Text style={styles.contentText} numberOfLines={isGridView ? 5 : 4}>
          {note.content}
        </Text>
      ) : null}

      {/* Body Content - Checklist Mode */}
      {isChecklist && displayChecklist.length > 0 ? (
        <View style={styles.checklistContainer}>
          {displayChecklist.slice(0, 4).map((item) => (
            <View
              key={item.id}
              style={styles.checkItemRow}
            >
              <Ionicons
                name={item.completed ? 'checkbox' : 'square-outline'}
                size={15}
                color={item.completed ? COLORS.primary : COLORS.textSecondary}
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
          {displayChecklist.length > 4 && (
            <Text style={styles.moreText}>+{displayChecklist.length - 4} more items</Text>
          )}
        </View>
      ) : null}

      {/* Voice Audio Note Player Bar */}
      {allAudioMemos.map((memo) => (
        <View key={memo.id} style={styles.audioPlayerBox}>
          <TouchableOpacity
            style={styles.audioPlayBtn}
            onPress={(e) => {
              e.stopPropagation();
              handleTogglePlayAudio(memo.id, memo.uri);
            }}
          >
            <Ionicons
              name={playingAudioId === memo.id ? 'pause' : 'play'}
              size={14}
              color="#FFFFFF"
            />
          </TouchableOpacity>
          <View style={styles.audioTextGroup}>
            <Text style={styles.audioTitleText} numberOfLines={1}>
              {memo.title || 'Voice Note'}
            </Text>
            <Text style={styles.audioSubText}>
              {playingAudioId === memo.id ? 'Playing audio...' : `${memo.durationSeconds || 15}s`}
            </Text>
          </View>
        </View>
      ))}

      {/* Web Link Attachments */}
      {note.webLinks && note.webLinks.length > 0 ? (
        <View style={styles.webLinksContainer}>
          {note.webLinks.map((link) => (
            <TouchableOpacity
              key={link.id}
              style={styles.webLinkChip}
              activeOpacity={0.7}
              onPress={(e) => {
                e.stopPropagation();
                if (link.url) Linking.openURL(link.url);
              }}
            >
              <Ionicons name="link-outline" size={13} color={COLORS.primary} />
              <Text style={styles.webLinkText} numberOfLines={1}>
                {link.displayText || link.url}
              </Text>
              <Ionicons name="open-outline" size={11} color={COLORS.primary} />
            </TouchableOpacity>
          ))}
        </View>
      ) : null}

      {/* Reminder Date Badge */}
      {note.reminderDate ? (
        <View style={styles.reminderBadge}>
          <Ionicons name="alarm-outline" size={13} color={COLORS.dueBadgeText} />
          <Text style={styles.reminderText} numberOfLines={1}>
            {new Date(note.reminderDate).toLocaleDateString([], { month: 'short', day: 'numeric', hour: '2-digit', minute: '2-digit' })}
          </Text>
        </View>
      ) : null}

      {/* Footer Row - Category Badge & Actions */}
      <View style={styles.footerRow}>
        <View style={styles.categoryBadge}>
          <Ionicons name={categoryIcon as any} size={13} color={COLORS.textSecondary} />
          <Text style={styles.categoryBadgeText}>
            {note.category || 'General'}
          </Text>
        </View>

        <View style={styles.footerActionsGroup}>
          {note.isTrashed ? (
            <TouchableOpacity
              onPress={() => onPermanentDeleteNote && onPermanentDeleteNote(note.id)}
              style={styles.actionBtn}
            >
              <Ionicons name="trash-bin-outline" size={15} color={COLORS.danger} />
            </TouchableOpacity>
          ) : (
            <>
              {onToggleArchiveNote && (
                <TouchableOpacity onPress={() => onToggleArchiveNote(note.id)} style={styles.actionBtn}>
                  <Ionicons
                    name={note.isArchived ? 'archive' : 'archive-outline'}
                    size={15}
                    color={COLORS.textSecondary}
                  />
                </TouchableOpacity>
              )}
              <TouchableOpacity onPress={() => onDeleteNote(note.id)} style={styles.actionBtn}>
                <Ionicons name="trash-outline" size={15} color={COLORS.textSecondary} />
              </TouchableOpacity>
            </>
          )}
        </View>
      </View>
    </TouchableOpacity>
  );
};

const styles = StyleSheet.create({
  card: {
    borderRadius: 14,
    padding: 12,
    marginBottom: 12,
    borderWidth: 1,
    borderColor: 'rgba(0,0,0,0.08)',
    overflow: 'hidden',
    ...SHADOWS.card,
  },
  gridCard: {
    marginBottom: 10,
  },
  mediaContainer: {
    marginTop: -12,
    marginHorizontal: -12,
    marginBottom: 10,
    backgroundColor: '#F5F5F5',
    overflow: 'hidden',
  },
  imageWrapper: {
    width: '100%',
    height: 140,
    backgroundColor: '#F0F0F0',
    alignItems: 'center',
    justifyContent: 'center',
    borderBottomWidth: 1,
    borderBottomColor: 'rgba(0,0,0,0.06)',
  },
  drawingContainer: {
    marginTop: -12,
    marginHorizontal: -12,
    marginBottom: 10,
    backgroundColor: '#FAF9F6',
    overflow: 'hidden',
  },
  drawingWrapper: {
    width: '100%',
    height: 120,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: '#FAF9F6',
    borderBottomWidth: 1,
    borderBottomColor: 'rgba(0,0,0,0.06)',
  },
  cardImageFit: {
    width: '100%',
    height: '100%',
  },
  moreMediaText: {
    fontSize: 10,
    fontWeight: '700',
    color: COLORS.textSecondary,
    textAlign: 'center',
    paddingVertical: 4,
    backgroundColor: 'rgba(0,0,0,0.04)',
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
  actionBtn: {
    padding: 4,
  },
  contentText: {
    fontSize: 13,
    color: COLORS.textPrimary,
    lineHeight: 18,
    marginBottom: 8,
  },
  checklistContainer: {
    marginBottom: 8,
    marginTop: 2,
  },
  checkItemRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    marginVertical: 3,
  },
  checkItemText: {
    fontSize: 12.5,
    color: COLORS.textPrimary,
    flex: 1,
  },
  checkItemCompleted: {
    textDecorationLine: 'line-through',
    color: COLORS.textSecondary,
    opacity: 0.7,
  },
  moreText: {
    fontSize: 11,
    color: COLORS.textSecondary,
    fontStyle: 'italic',
    marginTop: 3,
  },
  audioPlayerBox: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: 'rgba(26,115,232,0.1)',
    paddingHorizontal: 8,
    paddingVertical: 6,
    borderRadius: 10,
    marginBottom: 8,
    gap: 8,
  },
  audioPlayBtn: {
    width: 26,
    height: 26,
    borderRadius: 13,
    backgroundColor: COLORS.primary,
    alignItems: 'center',
    justifyContent: 'center',
  },
  audioTextGroup: {
    flex: 1,
  },
  audioTitleText: {
    fontSize: 12,
    fontWeight: '700',
    color: COLORS.primary,
  },
  audioSubText: {
    fontSize: 10,
    color: COLORS.textSecondary,
  },
  webLinksContainer: {
    marginBottom: 6,
    gap: 4,
  },
  webLinkChip: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    backgroundColor: 'rgba(26,115,232,0.08)',
    paddingHorizontal: 8,
    paddingVertical: 5,
    borderRadius: 8,
    borderWidth: 1,
    borderColor: 'rgba(26,115,232,0.2)',
  },
  webLinkText: {
    fontSize: 11.5,
    fontWeight: '700',
    color: COLORS.primary,
    flex: 1,
  },
  reminderBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    backgroundColor: COLORS.dueBadgeBg,
    paddingHorizontal: 8,
    paddingVertical: 3,
    borderRadius: 8,
    alignSelf: 'flex-start',
    marginBottom: 6,
  },
  reminderText: {
    fontSize: 11,
    fontWeight: '600',
    color: COLORS.dueBadgeText,
  },
  footerRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginTop: 6,
    paddingTop: 4,
  },
  categoryBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    backgroundColor: 'rgba(0,0,0,0.05)',
    paddingHorizontal: 8,
    paddingVertical: 3,
    borderRadius: 8,
  },
  categoryBadgeText: {
    fontSize: 11,
    color: COLORS.textSecondary,
    fontWeight: '700',
  },
  footerActionsGroup: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
});
