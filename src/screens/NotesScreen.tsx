import React, { useState } from 'react';
import {
  View,
  Text,
  TouchableOpacity,
  FlatList,
  StyleSheet,
  TextInput,
  Modal,
  SafeAreaView,
  ScrollView,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { Note } from '../types';
import { COLORS, SHADOWS } from '../constants/theme';
import { NoteCard } from '../components/NoteCard';

interface NotesScreenProps {
  notes: Note[];
  onAddNote: (note: Note) => void;
  onUpdateNote: (note: Note) => void;
  onDeleteNote: (id: string) => void;
  onOpenProfile?: () => void;
  avatarEmoji?: string;
}

export const NotesScreen: React.FC<NotesScreenProps> = ({
  notes,
  onAddNote,
  onUpdateNote,
  onDeleteNote,
  onOpenProfile,
  avatarEmoji = '⚡',
}) => {
  const [searchQuery, setSearchQuery] = useState('');
  const [activeModal, setActiveModal] = useState<boolean>(false);
  const [selectedNote, setSelectedNote] = useState<Note | null>(null);

  // Form states
  const [title, setTitle] = useState('');
  const [content, setContent] = useState('');
  const [selectedColor, setSelectedColor] = useState('#FFFFFF');

  const openCreateModal = () => {
    setSelectedNote(null);
    setTitle('');
    setContent('');
    setSelectedColor('#FFFFFF');
    setActiveModal(true);
  };

  const openEditModal = (note: Note) => {
    setSelectedNote(note);
    setTitle(note.title);
    setContent(note.content);
    setSelectedColor(note.color);
    setActiveModal(true);
  };

  const handleSave = () => {
    if (!title.trim() && !content.trim()) return;

    if (selectedNote) {
      onUpdateNote({
        ...selectedNote,
        title: title.trim() || 'Untitled Note',
        content: content.trim(),
        color: selectedColor,
        updatedAt: new Date().toISOString(),
      });
    } else {
      const newNote: Note = {
        id: Date.now().toString(),
        title: title.trim() || 'Untitled Note',
        content: content.trim(),
        color: selectedColor,
        isPinned: false,
        tags: ['quick-note'],
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString(),
      };
      onAddNote(newNote);
    }

    setActiveModal(false);
  };

  const handleTogglePin = (id: string) => {
    const target = notes.find((n) => n.id === id);
    if (!target) return;
    onUpdateNote({ ...target, isPinned: !target.isPinned });
  };

  // Filter notes by search
  const filteredNotes = notes.filter((n) => {
    const q = searchQuery.toLowerCase();
    return (
      n.title.toLowerCase().includes(q) ||
      n.content.toLowerCase().includes(q) ||
      n.tags.some((t) => t.toLowerCase().includes(q))
    );
  });

  const pinnedNotes = filteredNotes.filter((n) => n.isPinned);
  const otherNotes = filteredNotes.filter((n) => !n.isPinned);

  return (
    <SafeAreaView style={styles.container}>
      {/* Header & Search Bar */}
      <View style={styles.header}>
        <View style={styles.headerTitleRow}>
          {onOpenProfile && (
            <TouchableOpacity style={styles.profileHeaderBtn} onPress={onOpenProfile}>
              <Text style={{ fontSize: 18 }}>{avatarEmoji}</Text>
            </TouchableOpacity>
          )}
          <Text style={styles.appTitle}>Notes 📌</Text>
        </View>
        <View style={styles.searchBar}>
          <Ionicons name="search" size={18} color={COLORS.textSecondary} />
          <TextInput
            style={styles.searchInput}
            placeholder="Search notes & tags..."
            value={searchQuery}
            onChangeText={setSearchQuery}
          />
          {searchQuery ? (
            <TouchableOpacity onPress={() => setSearchQuery('')}>
              <Ionicons name="close-circle" size={18} color={COLORS.textSecondary} />
            </TouchableOpacity>
          ) : null}
        </View>
      </View>

      <ScrollView contentContainerStyle={styles.scrollContent}>
        {/* Pinned Section */}
        {pinnedNotes.length > 0 && (
          <View style={styles.section}>
            <Text style={styles.sectionHeader}>PINNED</Text>
            {pinnedNotes.map((n) => (
              <NoteCard
                key={n.id}
                note={n}
                onPressNote={openEditModal}
                onTogglePin={handleTogglePin}
                onDeleteNote={onDeleteNote}
              />
            ))}
          </View>
        )}

        {/* Others Section */}
        <View style={styles.section}>
          {pinnedNotes.length > 0 && <Text style={styles.sectionHeader}>OTHERS</Text>}
          {otherNotes.map((n) => (
            <NoteCard
              key={n.id}
              note={n}
              onPressNote={openEditModal}
              onTogglePin={handleTogglePin}
              onDeleteNote={onDeleteNote}
            />
          ))}

          {filteredNotes.length === 0 && (
            <View style={styles.emptyState}>
              <Ionicons name="journal-outline" size={48} color={COLORS.textSecondary} />
              <Text style={styles.emptyTitle}>No Notes Found</Text>
              <Text style={styles.emptySub}>Tap the + button to create a Google Keep-style note!</Text>
            </View>
          )}
        </View>
      </ScrollView>

      {/* Floating Add Note FAB */}
      <TouchableOpacity style={styles.fab} onPress={openCreateModal}>
        <Ionicons name="add" size={28} color="#FFF" />
      </TouchableOpacity>

      {/* Note Editor Modal */}
      <Modal visible={activeModal} transparent animationType="slide">
        <View style={styles.modalOverlay}>
          <View style={[styles.modalCard, { backgroundColor: selectedColor }]}>
            <View style={styles.modalHeader}>
              <Text style={styles.modalTitle}>{selectedNote ? 'Edit Note' : 'New Note'}</Text>
              <TouchableOpacity onPress={() => setActiveModal(false)}>
                <Ionicons name="close" size={24} color={COLORS.textSecondary} />
              </TouchableOpacity>
            </View>

            <TextInput
              style={styles.titleInput}
              placeholder="Title"
              value={title}
              onChangeText={setTitle}
              placeholderTextColor={COLORS.textSecondary}
            />

            <TextInput
              style={styles.contentInput}
              placeholder="Note content..."
              value={content}
              onChangeText={setContent}
              multiline
              placeholderTextColor={COLORS.textSecondary}
            />

            {/* Google Keep Color Palette Picker */}
            <Text style={styles.colorLabel}>Note Color:</Text>
            <ScrollView horizontal showsHorizontalScrollIndicator={false} style={styles.colorRow}>
              {COLORS.keepColors.map((col) => (
                <TouchableOpacity
                  key={col.id}
                  style={[
                    styles.colorCircle,
                    { backgroundColor: col.hex, borderColor: col.border },
                    selectedColor === col.hex && styles.selectedCircle,
                  ]}
                  onPress={() => setSelectedColor(col.hex)}
                />
              ))}
            </ScrollView>

            <TouchableOpacity style={styles.saveBtn} onPress={handleSave}>
              <Text style={styles.saveText}>Save Note 💾</Text>
            </TouchableOpacity>
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
  },
  header: {
    paddingHorizontal: 16,
    paddingVertical: 12,
    backgroundColor: COLORS.surface,
    borderBottomWidth: 1,
    borderBottomColor: COLORS.border,
  },
  headerTitleRow: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 8,
  },
  profileHeaderBtn: {
    width: 32,
    height: 32,
    borderRadius: 16,
    backgroundColor: COLORS.primaryLight,
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: 8,
    borderWidth: 1,
    borderColor: COLORS.primary,
  },
  appTitle: {
    fontSize: 20,
    fontWeight: '800',
    color: COLORS.textPrimary,
  },
  searchBar: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: COLORS.background,
    borderRadius: 10,
    paddingHorizontal: 10,
    paddingVertical: 6,
    borderWidth: 1,
    borderColor: COLORS.border,
  },
  searchInput: {
    flex: 1,
    fontSize: 13,
    color: COLORS.textPrimary,
    marginLeft: 6,
  },
  scrollContent: {
    padding: 12,
    paddingBottom: 80,
  },
  section: {
    marginBottom: 12,
  },
  sectionHeader: {
    fontSize: 11,
    fontWeight: '700',
    color: COLORS.textSecondary,
    marginBottom: 8,
    letterSpacing: 1,
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
  },
  fab: {
    position: 'absolute',
    bottom: 20,
    right: 20,
    width: 56,
    height: 56,
    borderRadius: 28,
    backgroundColor: COLORS.primary,
    alignItems: 'center',
    justifyContent: 'center',
    ...SHADOWS.floating,
  },
  modalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0,0,0,0.5)',
    justifyContent: 'flex-end',
  },
  modalCard: {
    borderTopLeftRadius: 20,
    borderTopRightRadius: 20,
    padding: 16,
    minHeight: '60%',
  },
  modalHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 12,
  },
  modalTitle: {
    fontSize: 16,
    fontWeight: '700',
    color: COLORS.textPrimary,
  },
  titleInput: {
    fontSize: 18,
    fontWeight: '700',
    color: COLORS.textPrimary,
    marginBottom: 12,
  },
  contentInput: {
    fontSize: 14,
    color: COLORS.textPrimary,
    minHeight: 120,
    textAlignVertical: 'top',
  },
  colorLabel: {
    fontSize: 12,
    fontWeight: '600',
    color: COLORS.textSecondary,
    marginTop: 10,
    marginBottom: 6,
  },
  colorRow: {
    flexDirection: 'row',
    marginBottom: 16,
  },
  colorCircle: {
    width: 32,
    height: 32,
    borderRadius: 16,
    borderWidth: 2,
    marginRight: 10,
  },
  selectedCircle: {
    borderWidth: 3,
    borderColor: COLORS.primary,
  },
  saveBtn: {
    backgroundColor: COLORS.primary,
    borderRadius: 12,
    paddingVertical: 12,
    alignItems: 'center',
  },
  saveText: {
    color: '#FFF',
    fontSize: 15,
    fontWeight: '700',
  },
});
