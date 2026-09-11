import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  TouchableOpacity,
  StyleSheet,
  TextInput,
  Modal,
  SafeAreaView,
  ScrollView,
  Image,
  Alert,
  Linking,
  PanResponder,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import * as ImagePicker from 'expo-image-picker';
import { Note, NoteChecklistItem, NoteType, NoteCategory, NoteAudioMemo, NoteWebLink } from '../types';
import { COLORS, SHADOWS, DEFAULT_CATEGORIES } from '../constants/theme';
import { NoteCard } from '../components/NoteCard';
import { DrawingModal } from '../components/DrawingModal';
import { CalendarDatePickerModal } from '../components/CalendarDatePickerModal';
import { ImageLightboxModal } from '../components/ImageLightboxModal';
import { VoiceRecorderModal } from '../components/VoiceRecorderModal';
import { getCategoriesStorage, saveCategoriesStorage } from '../storage/localStorage';
import { playRingtonePreview, stopRingtonePreview } from '../services/soundService';

interface NotesScreenProps {
  notes: Note[];
  onAddNote: (note: Note) => void;
  onUpdateNote: (note: Note) => void;
  onDeleteNote: (id: string) => void;
  onOpenProfile?: () => void;
  avatarEmoji?: string;
}

type FilterTab = 'notes' | 'archive' | 'trash';

interface ChecklistDragRowProps {
  item: NoteChecklistItem;
  index: number;
  totalCount: number;
  isCompleted?: boolean;
  onToggle: (id: string) => void;
  onChangeText: (id: string, text: string) => void;
  onDelete: (id: string) => void;
  onMoveToPosition: (id: string, newIndex: number) => void;
}

const ChecklistDragRow: React.FC<ChecklistDragRowProps> = ({
  item,
  index,
  totalCount,
  isCompleted,
  onToggle,
  onChangeText,
  onDelete,
  onMoveToPosition,
}) => {
  const panResponder = React.useRef(
    PanResponder.create({
      onStartShouldSetPanResponder: () => true,
      onMoveShouldSetPanResponder: () => true,
      onPanResponderMove: (_, gestureState) => {
        const ROW_HEIGHT = 44;
        const offset = Math.round(gestureState.dy / ROW_HEIGHT);
        if (offset !== 0) {
          const targetIndex = Math.max(0, Math.min(totalCount - 1, index + offset));
          if (targetIndex !== index) {
            onMoveToPosition(item.id, targetIndex);
          }
        }
      },
    })
  ).current;

  return (
    <View style={styles.checklistEditorRow}>
      {/* Google Keep 6-Dot Drag Handle Icon */}
      <View style={styles.dragHandleContainer} {...panResponder.panHandlers}>
        <View style={styles.dragHandleDots}>
          <View style={styles.dotRow}>
            <View style={styles.dragDot} />
            <View style={styles.dragDot} />
          </View>
          <View style={styles.dotRow}>
            <View style={styles.dragDot} />
            <View style={styles.dragDot} />
          </View>
          <View style={styles.dotRow}>
            <View style={styles.dragDot} />
            <View style={styles.dragDot} />
          </View>
        </View>
      </View>

      <TouchableOpacity onPress={() => onToggle(item.id)}>
        <Ionicons
          name={isCompleted ? 'checkbox' : 'square-outline'}
          size={20}
          color={isCompleted ? COLORS.primary : COLORS.textSecondary}
        />
      </TouchableOpacity>

      <TextInput
        style={[styles.checklistItemInput, isCompleted && styles.checklistItemCompleted]}
        value={item.text}
        onChangeText={(text) => onChangeText(item.id, text)}
      />

      <TouchableOpacity onPress={() => onDelete(item.id)}>
        <Ionicons name="close" size={18} color={COLORS.textSecondary} />
      </TouchableOpacity>
    </View>
  );
};

export const NotesScreen: React.FC<NotesScreenProps> = ({
  notes,
  onAddNote,
  onUpdateNote,
  onDeleteNote,
  onOpenProfile,
  avatarEmoji = '⚡',
}) => {
  // Categories State
  const [categories, setCategories] = useState<NoteCategory[]>(DEFAULT_CATEGORIES);

  // Load stored categories
  useEffect(() => {
    async function loadCategories() {
      const stored = await getCategoriesStorage();
      setCategories(stored);
    }
    loadCategories();
  }, []);

  // Navigation & View Mode State
  const [searchQuery, setSearchQuery] = useState('');
  const [activeTab, setActiveTab] = useState<FilterTab>('notes');
  const [selectedCategoryFilter, setSelectedCategoryFilter] = useState<string>('All');
  const [isGridView, setIsGridView] = useState<boolean>(true);

  // Editor Modal State
  const [activeModal, setActiveModal] = useState<boolean>(false);
  const [selectedNote, setSelectedNote] = useState<Note | null>(null);

  // Form State inside Editor Modal
  const [title, setTitle] = useState('');
  const [content, setContent] = useState('');
  const [noteType, setNoteType] = useState<NoteType>('text');
  const [selectedCategory, setSelectedCategory] = useState<string>('General');
  const [selectedColor, setSelectedColor] = useState<string>('#FFFFFF');
  const [isPinned, setIsPinned] = useState(false);
  const [reminderDate, setReminderDate] = useState<string | undefined>(undefined);

  // Multi-Attachment Arrays
  const [imagesList, setImagesList] = useState<string[]>([]);
  const [drawingsList, setDrawingsList] = useState<string[]>([]);
  const [audioMemosList, setAudioMemosList] = useState<NoteAudioMemo[]>([]);
  const [webLinksList, setWebLinksList] = useState<NoteWebLink[]>([]);

  // Checklist State
  const [checklist, setChecklist] = useState<NoteChecklistItem[]>([]);
  const [newChecklistText, setNewChecklistText] = useState('');
  const [showCompletedChecklist, setShowCompletedChecklist] = useState<boolean>(true);

  // Web Link Modal State (Display Text + URL)
  const [isUrlModalOpen, setIsUrlModalOpen] = useState(false);
  const [linkDisplayText, setLinkDisplayText] = useState('');
  const [linkUrlInput, setLinkUrlInput] = useState('');

  // Auxiliary Modals State
  const [isDrawingModalOpen, setIsDrawingModalOpen] = useState(false);
  const [isVoiceRecorderOpen, setIsVoiceRecorderOpen] = useState(false);
  const [isCategoryPickerOpen, setIsCategoryPickerOpen] = useState(false);
  
  // Lightbox Full Screen View State
  const [lightboxImageUri, setLightboxImageUri] = useState<string | undefined>(undefined);
  const [lightboxTitle, setLightboxTitle] = useState<string | undefined>(undefined);

  // Create New Category Modal State
  const [isCreateCategoryModalOpen, setIsCreateCategoryModalOpen] = useState(false);
  const [newCategoryName, setNewCategoryName] = useState('');
  const [newCategoryColor, setNewCategoryColor] = useState('#FFE0B2');

  // Alarm Reminder Picker Modal State
  const [isReminderPickerOpen, setIsReminderPickerOpen] = useState(false);

  // Playback state in editor sheet
  const [playingAudioId, setPlayingAudioId] = useState<string | null>(null);

  // Main Views & Category Dropdown State
  const [isMainFilterDropdownOpen, setIsMainFilterDropdownOpen] = useState(false);

  // Delete Category Handler - Moves all notes under category to 'Uncategorized'
  const handleDeleteCategory = async (catName: string) => {
    const cleanName = catName.trim();
    if (cleanName.toLowerCase() === 'uncategorized' || cleanName.toLowerCase() === 'none') return; // Cannot delete 'Uncategorized'

    // 1. Remove category from categories array
    const updatedCategories = categories.filter(
      (c) => c.name.toLowerCase() !== cleanName.toLowerCase()
    );
    setCategories(updatedCategories);
    await saveCategoriesStorage(updatedCategories);

    // 2. Move all notes under this category to 'Uncategorized'
    notes.forEach((n) => {
      if ((n.category || '').toLowerCase() === cleanName.toLowerCase()) {
        onUpdateNote({
          ...n,
          category: 'Uncategorized',
          updatedAt: new Date().toISOString(),
        });
      }
    });

    // 3. Reset active category filter if the deleted category was selected
    if (selectedCategoryFilter.toLowerCase() === cleanName.toLowerCase()) {
      setSelectedCategoryFilter('Uncategorized');
    }
  };

  // Open modal to create a fresh note
  const openCreateModal = (initialType: NoteType = 'text') => {
    setSelectedNote(null);
    setTitle('');
    setContent('');
    setNoteType(initialType);
    setSelectedCategory('General');
    setSelectedColor('#FFFFFF');
    setIsPinned(false);
    setReminderDate(undefined);
    setImagesList([]);
    setDrawingsList([]);
    setAudioMemosList([]);
    setWebLinksList([]);
    setChecklist([]);
    setNewChecklistText('');
    setActiveModal(true);
  };

  // Open modal to edit an existing note
  const openEditModal = (note: Note) => {
    setSelectedNote(note);
    setTitle(note.title);
    setContent(note.content);
    setNoteType(note.type || (note.checklist && note.checklist.length > 0 ? 'checklist' : 'text'));
    setSelectedCategory(note.category || 'General');
    setSelectedColor(note.color || '#FFFFFF');
    setIsPinned(!!note.isPinned);
    setReminderDate(note.reminderDate);

    // Multi-attachment initialization
    const imgs: string[] = note.images ? [...note.images] : [];
    if (note.imageUri && !imgs.includes(note.imageUri)) imgs.unshift(note.imageUri);
    setImagesList(imgs);

    const dwgs: string[] = note.drawings ? [...note.drawings] : [];
    if (note.drawingUri && !dwgs.includes(note.drawingUri)) dwgs.unshift(note.drawingUri);
    setDrawingsList(dwgs);

    const auds: NoteAudioMemo[] = note.audioMemos ? [...note.audioMemos] : [];
    if (note.audioUri && !auds.some((a) => a.uri === note.audioUri)) {
      auds.unshift({
        id: 'legacy-audio',
        uri: note.audioUri,
        title: 'Voice Note',
        durationSeconds: 15,
        createdAt: note.createdAt,
      });
    }
    setAudioMemosList(auds);

    const lnks: NoteWebLink[] = note.webLinks ? [...note.webLinks] : [];
    setWebLinksList(lnks);

    setChecklist(note.checklist ? [...note.checklist] : []);
    setNewChecklistText('');
    setActiveModal(true);
  };

  // Category Selector
  const handleSelectCategory = (catName: string) => {
    setSelectedCategory(catName);
    setIsCategoryPickerOpen(false);
    const cat = categories.find((c) => c.name.toLowerCase() === catName.toLowerCase());
    if (cat && cat.color) {
      setSelectedColor(cat.color);
    }
  };

  // Create & Save Category
  const handleCreateCategory = async () => {
    const cleanName = newCategoryName.trim();
    if (!cleanName) return;

    if (categories.some((c) => c.name.toLowerCase() === cleanName.toLowerCase())) {
      Alert.alert('Category Exists', `Category "${cleanName}" already exists.`);
      return;
    }

    const newCat: NoteCategory = {
      id: Date.now().toString(),
      name: cleanName,
      color: newCategoryColor,
      icon: 'folder-outline',
    };

    const updatedCategories = [...categories, newCat];
    setCategories(updatedCategories);
    await saveCategoriesStorage(updatedCategories);

    setSelectedCategory(cleanName);
    setSelectedColor(newCategoryColor);
    setNewCategoryName('');
    setIsCreateCategoryModalOpen(false);
    setIsCategoryPickerOpen(false);
  };

  // Switch Note Type (Text ↔️ Checklist)
  const handleSetNoteType = (targetType: NoteType) => {
    if (targetType === noteType) return;

    if (targetType === 'checklist') {
      const lines = content.split('\n').map((l) => l.trim()).filter((l) => l.length > 0);
      const newItems: NoteChecklistItem[] = lines.map((l, idx) => ({
        id: (Date.now() + idx).toString(),
        text: l.replace(/^[•\-*]\s*/, ''),
        completed: false,
      }));
      setChecklist(newItems.length > 0 ? newItems : checklist);
      setNoteType('checklist');
    } else {
      const textLines = checklist.map((item) => `${item.completed ? '✓ ' : '• '}${item.text}`).join('\n');
      if (textLines && !content) {
        setContent(textLines);
      }
      setNoteType('text');
    }
  };

  // Attachment Management Handlers
  const handlePickDeviceImage = async () => {
    try {
      const permissionResult = await ImagePicker.requestMediaLibraryPermissionsAsync();
      if (!permissionResult.granted) {
        Alert.alert('Permission Required', 'Media library access is needed to attach photos.');
        return;
      }

      const result = await ImagePicker.launchImageLibraryAsync({
        mediaTypes: ['images'],
        allowsEditing: true,
        quality: 0.8,
      });

      if (!result.canceled && result.assets && result.assets.length > 0) {
        const uri = result.assets[0].uri;
        setImagesList((prev) => [...prev, uri]);
      }
    } catch (e) {
      console.warn('Error picking image:', e);
    }
  };

  // Web Link Modal Handler (Display Text + URL)
  const handleAddWebLink = () => {
    const rawUrl = linkUrlInput.trim();
    if (!rawUrl) return;

    const formattedUrl = rawUrl.match(/^https?:\/\//i) ? rawUrl : `https://${rawUrl}`;
    const display = linkDisplayText.trim() || rawUrl.replace(/^https?:\/\/(www\.)?/, '');

    const newLink: NoteWebLink = {
      id: Date.now().toString(),
      displayText: display,
      url: formattedUrl,
    };

    setWebLinksList((prev) => [...prev, newLink]);
    setLinkDisplayText('');
    setLinkUrlInput('');
    setIsUrlModalOpen(false);
  };

  const handleRemoveWebLink = (linkId: string) => {
    setWebLinksList((prev) => prev.filter((l) => l.id !== linkId));
  };

  const handleRemoveImageAtIndex = (idx: number) => {
    setImagesList((prev) => prev.filter((_, i) => i !== idx));
  };

  const handleRemoveDrawingAtIndex = (idx: number) => {
    setDrawingsList((prev) => prev.filter((_, i) => i !== idx));
  };

  const handleRemoveAudioMemo = (memoId: string) => {
    setAudioMemosList((prev) => prev.filter((a) => a.id !== memoId));
  };

  const handleAddDrawing = (svgUri: string) => {
    setDrawingsList((prev) => [...prev, svgUri]);
  };

  const handleSaveAudioMemo = (memo: NoteAudioMemo) => {
    setAudioMemosList((prev) => [...prev, memo]);
  };

  const handleTogglePlayAudioInEditor = async (memoId: string, uri: string) => {
    if (playingAudioId === memoId) {
      await stopRingtonePreview();
      setPlayingAudioId(null);
    } else {
      setPlayingAudioId(memoId);
      await playRingtonePreview(memoId, uri, () => {
        setPlayingAudioId(null);
      });
    }
  };

  // Checklist Management
  const handleAddChecklistItem = () => {
    if (!newChecklistText.trim()) return;
    const newItem: NoteChecklistItem = {
      id: Date.now().toString(),
      text: newChecklistText.trim(),
      completed: false,
    };
    setChecklist([...checklist, newItem]);
    setNewChecklistText('');
  };

  const handleToggleChecklistItemInEditor = (id: string) => {
    setChecklist(
      checklist.map((item) =>
        item.id === id ? { ...item, completed: !item.completed } : item
      )
    );
  };

  const handleDeleteChecklistItemInEditor = (id: string) => {
    setChecklist(checklist.filter((item) => item.id !== id));
  };

  // Move checklist item freely to any index position in list
  const handleMoveChecklistItemToPosition = (id: string, newIndex: number) => {
    const oldIndex = checklist.findIndex((item) => item.id === id);
    if (oldIndex === -1 || newIndex < 0 || newIndex >= checklist.length) return;
    if (oldIndex === newIndex) return;

    const updated = [...checklist];
    const [movedItem] = updated.splice(oldIndex, 1);
    updated.splice(newIndex, 0, movedItem);

    setChecklist(updated);
  };

  // Save Note Action
  const handleSave = () => {
    const isChecklistEmpty = noteType === 'checklist' && checklist.length === 0;
    const isTextEmpty = noteType === 'text' && !content.trim();

    if (!title.trim() && isTextEmpty && isChecklistEmpty && imagesList.length === 0 && drawingsList.length === 0 && audioMemosList.length === 0 && webLinksList.length === 0) {
      setActiveModal(false);
      return;
    }

    if (selectedNote) {
      onUpdateNote({
        ...selectedNote,
        title: title.trim() || (noteType === 'checklist' ? 'Checklist' : 'Untitled Note'),
        content: content.trim(),
        type: noteType,
        category: selectedCategory,
        color: selectedColor,
        isPinned,
        images: imagesList,
        drawings: drawingsList,
        audioMemos: audioMemosList,
        webLinks: webLinksList,
        imageUri: imagesList[0] || undefined,
        drawingUri: drawingsList[0] || undefined,
        audioUri: audioMemosList[0]?.uri || undefined,
        reminderDate,
        checklist: noteType === 'checklist' ? checklist : undefined,
        updatedAt: new Date().toISOString(),
      });
    } else {
      const newNote: Note = {
        id: Date.now().toString(),
        title: title.trim() || (noteType === 'checklist' ? 'Checklist' : 'Untitled Note'),
        content: content.trim(),
        type: noteType,
        category: selectedCategory,
        color: selectedColor,
        isPinned,
        images: imagesList,
        drawings: drawingsList,
        audioMemos: audioMemosList,
        webLinks: webLinksList,
        imageUri: imagesList[0] || undefined,
        drawingUri: drawingsList[0] || undefined,
        audioUri: audioMemosList[0]?.uri || undefined,
        reminderDate,
        checklist: noteType === 'checklist' ? checklist : undefined,
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString(),
      };
      onAddNote(newNote);
    }

    setActiveModal(false);
  };

  // Card Handlers
  const handleTogglePinOnCard = (id: string) => {
    const target = notes.find((n) => n.id === id);
    if (!target) return;
    onUpdateNote({ ...target, isPinned: !target.isPinned });
  };

  const handleToggleArchiveOnCard = (id: string) => {
    const target = notes.find((n) => n.id === id);
    if (!target) return;
    onUpdateNote({ ...target, isArchived: !target.isArchived, isPinned: false });
  };

  const handleSoftDeleteOnCard = (id: string) => {
    const target = notes.find((n) => n.id === id);
    if (!target) return;
    onUpdateNote({ ...target, isTrashed: true, isPinned: false });
  };

  const handleRestoreOnCard = (id: string) => {
    const target = notes.find((n) => n.id === id);
    if (!target) return;
    onUpdateNote({ ...target, isTrashed: false });
  };

  const handlePermanentDeleteOnCard = (id: string) => {
    onDeleteNote(id);
  };

  const handleToggleChecklistItemOnCard = (noteId: string, itemId: string) => {
    const target = notes.find((n) => n.id === noteId);
    if (!target || !target.checklist) return;

    const updatedChecklist = target.checklist.map((item) =>
      item.id === itemId ? { ...item, completed: !item.completed } : item
    );

    onUpdateNote({ ...target, checklist: updatedChecklist });
  };

  // Filter notes
  const filteredNotes = notes.filter((n) => {
    if (activeTab === 'notes' && (n.isArchived || n.isTrashed)) return false;
    if (activeTab === 'archive' && (!n.isArchived || n.isTrashed)) return false;
    if (activeTab === 'trash' && !n.isTrashed) return false;

    if (selectedCategoryFilter !== 'All') {
      const noteCat = n.category && n.category.trim() !== '' && n.category.toLowerCase() !== 'none'
        ? n.category.toLowerCase()
        : 'uncategorized';
      const targetCat = selectedCategoryFilter.toLowerCase() === 'none'
        ? 'uncategorized'
        : selectedCategoryFilter.toLowerCase();
      if (noteCat !== targetCat) {
        return false;
      }
    }

    if (searchQuery.trim()) {
      const q = searchQuery.toLowerCase();
      const matchesTitle = n.title.toLowerCase().includes(q);
      const matchesContent = n.content.toLowerCase().includes(q);
      const matchesCategory = (n.category || '').toLowerCase().includes(q);
      const matchesChecklist = n.checklist?.some((c) => c.text.toLowerCase().includes(q));
      const matchesWebLink = n.webLinks?.some((l) => l.displayText.toLowerCase().includes(q) || l.url.toLowerCase().includes(q));
      return matchesTitle || matchesContent || matchesCategory || matchesChecklist || matchesWebLink;
    }

    return true;
  });

  const pinnedNotes = filteredNotes.filter((n) => n.isPinned);
  const otherNotes = filteredNotes.filter((n) => !n.isPinned);

  const activeChecklistItems = checklist.filter((i) => !i.completed);
  const completedChecklistItems = checklist.filter((i) => i.completed);

  return (
    <SafeAreaView style={styles.container}>
      {/* Header Bar */}
      <View style={styles.header}>
        <View style={styles.headerTopRow}>
          <View style={styles.headerTitleRow}>
            {onOpenProfile && (
              <TouchableOpacity style={styles.profileHeaderBtn} onPress={onOpenProfile}>
                <Text style={{ fontSize: 18 }}>{avatarEmoji}</Text>
              </TouchableOpacity>
            )}
            <Text style={styles.appTitle}>My Notes 📌</Text>
          </View>

          {/* Grid vs List View Switcher */}
          <TouchableOpacity
            style={styles.viewToggleBtn}
            onPress={() => setIsGridView(!isGridView)}
          >
            <Ionicons
              name={isGridView ? 'list-outline' : 'grid-outline'}
              size={20}
              color={COLORS.textPrimary}
            />
          </TouchableOpacity>
        </View>

        {/* Search Bar */}
        <View style={styles.searchBar}>
          <Ionicons name="search" size={18} color={COLORS.textSecondary} />
          <TextInput
            style={styles.searchInput}
            placeholder="Search notes, checklists & categories..."
            value={searchQuery}
            onChangeText={setSearchQuery}
          />
          {searchQuery ? (
            <TouchableOpacity onPress={() => setSearchQuery('')}>
              <Ionicons name="close-circle" size={18} color={COLORS.textSecondary} />
            </TouchableOpacity>
          ) : null}
        </View>

        {/* Single Combined Dropdown for Views & Categories */}
        <View style={styles.filterDropdownContainer}>
          <TouchableOpacity
            style={styles.filterDropdownTriggerBtn}
            onPress={() => setIsMainFilterDropdownOpen(!isMainFilterDropdownOpen)}
            activeOpacity={0.8}
          >
            <View style={styles.filterDropdownTriggerLeft}>
              <Ionicons
                name={
                  activeTab === 'archive'
                    ? 'archive-outline'
                    : activeTab === 'trash'
                    ? 'trash-outline'
                    : 'journal-outline'
                }
                size={16}
                color={COLORS.primary}
              />
              <Text style={styles.filterDropdownTriggerText} numberOfLines={1}>
                {activeTab === 'archive'
                  ? '📦 Archive Notes'
                  : activeTab === 'trash'
                  ? '🗑️ Trash Notes'
                  : selectedCategoryFilter === 'All'
                  ? '📝 Notes — All Categories'
                  : `📝 Notes — ${selectedCategoryFilter}`}
              </Text>
            </View>
            <Ionicons
              name={isMainFilterDropdownOpen ? 'chevron-up' : 'chevron-down'}
              size={18}
              color={COLORS.textSecondary}
            />
          </TouchableOpacity>

          {isMainFilterDropdownOpen && (
            <View style={styles.filterDropdownMenuBox}>
              <ScrollView style={{ maxHeight: 320 }} nestedScrollEnabled showsVerticalScrollIndicator={false}>
                {/* SECTION 1: VIEWS */}
                <Text style={styles.dropdownSectionLabel}>VIEWS</Text>
                <TouchableOpacity
                  style={[
                    styles.dropdownOptionRow,
                    activeTab === 'notes' && selectedCategoryFilter === 'All' && styles.activeDropdownOption,
                  ]}
                  onPress={() => {
                    setActiveTab('notes');
                    setSelectedCategoryFilter('All');
                    setIsMainFilterDropdownOpen(false);
                  }}
                >
                  <Ionicons name="journal-outline" size={16} color={COLORS.primary} />
                  <Text style={styles.dropdownOptionText}>📝 All Notes</Text>
                  {activeTab === 'notes' && selectedCategoryFilter === 'All' && (
                    <Ionicons name="checkmark" size={16} color={COLORS.primary} />
                  )}
                </TouchableOpacity>

                <TouchableOpacity
                  style={[
                    styles.dropdownOptionRow,
                    activeTab === 'archive' && styles.activeDropdownOption,
                  ]}
                  onPress={() => {
                    setActiveTab('archive');
                    setSelectedCategoryFilter('All');
                    setIsMainFilterDropdownOpen(false);
                  }}
                >
                  <Ionicons name="archive-outline" size={16} color={COLORS.primary} />
                  <Text style={styles.dropdownOptionText}>📦 Archive</Text>
                  {activeTab === 'archive' && (
                    <Ionicons name="checkmark" size={16} color={COLORS.primary} />
                  )}
                </TouchableOpacity>

                <TouchableOpacity
                  style={[
                    styles.dropdownOptionRow,
                    activeTab === 'trash' && styles.activeDropdownOption,
                  ]}
                  onPress={() => {
                    setActiveTab('trash');
                    setSelectedCategoryFilter('All');
                    setIsMainFilterDropdownOpen(false);
                  }}
                >
                  <Ionicons name="trash-outline" size={16} color={COLORS.danger} />
                  <Text style={styles.dropdownOptionText}>🗑️ Trash</Text>
                  {activeTab === 'trash' && (
                    <Ionicons name="checkmark" size={16} color={COLORS.primary} />
                  )}
                </TouchableOpacity>

                {/* SECTION 2: CATEGORIES */}
                <View style={styles.dropdownDividerLine} />
                <Text style={styles.dropdownSectionLabel}>FILTER BY CATEGORY</Text>

                <TouchableOpacity
                  style={[
                    styles.dropdownOptionRow,
                    activeTab === 'notes' && selectedCategoryFilter === 'All' && styles.activeDropdownOption,
                  ]}
                  onPress={() => {
                    setActiveTab('notes');
                    setSelectedCategoryFilter('All');
                    setIsMainFilterDropdownOpen(false);
                  }}
                >
                  <Ionicons name="apps-outline" size={16} color={COLORS.textPrimary} />
                  <Text style={styles.dropdownOptionText}>All Categories</Text>
                  {activeTab === 'notes' && selectedCategoryFilter === 'All' && (
                    <Ionicons name="checkmark" size={16} color={COLORS.primary} />
                  )}
                </TouchableOpacity>

                {categories.map((cat) => (
                  <View key={cat.id} style={styles.dropdownCatItemWrapper}>
                    <TouchableOpacity
                      style={[
                        styles.dropdownCatLeftBtn,
                        activeTab === 'notes' &&
                          selectedCategoryFilter.toLowerCase() === cat.name.toLowerCase() &&
                          styles.activeDropdownOption,
                      ]}
                      onPress={() => {
                        setActiveTab('notes');
                        setSelectedCategoryFilter(cat.name);
                        setIsMainFilterDropdownOpen(false);
                      }}
                    >
                      <Ionicons
                        name={cat.icon as any || 'folder-outline'}
                        size={15}
                        color={COLORS.textPrimary}
                      />
                      <Text style={styles.dropdownOptionText}>{cat.name}</Text>
                      <View style={[styles.catColorDot, { backgroundColor: cat.color || '#F5F5F5' }]} />
                    </TouchableOpacity>

                    {/* Delete Category Button (Cannot delete system 'Uncategorized') */}
                    {cat.name.toLowerCase() !== 'uncategorized' && cat.name.toLowerCase() !== 'none' && (
                      <TouchableOpacity
                        style={styles.catDeleteBtn}
                        onPress={() => handleDeleteCategory(cat.name)}
                      >
                        <Ionicons name="trash-outline" size={14} color={COLORS.danger} />
                      </TouchableOpacity>
                    )}
                  </View>
                ))}

                {/* Create Category Trigger inside Dropdown */}
                <TouchableOpacity
                  style={styles.dropdownCreateCatBtn}
                  onPress={() => {
                    setIsMainFilterDropdownOpen(false);
                    setIsCreateCategoryModalOpen(true);
                  }}
                >
                  <Ionicons name="add-circle-outline" size={17} color={COLORS.primary} />
                  <Text style={styles.dropdownCreateCatText}>+ Create New Category</Text>
                </TouchableOpacity>
              </ScrollView>
            </View>
          )}
        </View>
      </View>

      {/* Main Notes Display */}
      <ScrollView contentContainerStyle={styles.scrollContent}>
        {/* Pinned Section */}
        {pinnedNotes.length > 0 && activeTab === 'notes' && (
          <View style={styles.section}>
            <Text style={styles.sectionHeader}>PINNED</Text>
            <View style={isGridView ? styles.gridContainer : styles.listContainerStyle}>
              {pinnedNotes.map((n) => (
                <View key={n.id} style={isGridView ? styles.gridItemWrapper : undefined}>
                  <NoteCard
                    note={n}
                    onPressNote={openEditModal}
                    onTogglePin={handleTogglePinOnCard}
                    onDeleteNote={handleSoftDeleteOnCard}
                    onToggleArchiveNote={handleToggleArchiveOnCard}
                    onToggleChecklistItem={handleToggleChecklistItemOnCard}
                    onOpenImageLightbox={(uri, title) => {
                      setLightboxImageUri(uri);
                      setLightboxTitle(title);
                    }}
                    isGridView={isGridView}
                  />
                </View>
              ))}
            </View>
          </View>
        )}

        {/* Others Section */}
        <View style={styles.section}>
          {pinnedNotes.length > 0 && activeTab === 'notes' && (
            <Text style={styles.sectionHeader}>OTHERS</Text>
          )}

          <View style={isGridView ? styles.gridContainer : styles.listContainerStyle}>
            {otherNotes.map((n) => (
              <View key={n.id} style={isGridView ? styles.gridItemWrapper : undefined}>
                <NoteCard
                  note={n}
                  onPressNote={openEditModal}
                  onTogglePin={handleTogglePinOnCard}
                  onDeleteNote={handleSoftDeleteOnCard}
                  onToggleArchiveNote={handleToggleArchiveOnCard}
                  onRestoreNote={handleRestoreOnCard}
                  onPermanentDeleteNote={handlePermanentDeleteOnCard}
                  onToggleChecklistItem={handleToggleChecklistItemOnCard}
                  onOpenImageLightbox={(uri, title) => {
                    setLightboxImageUri(uri);
                    setLightboxTitle(title);
                  }}
                  isGridView={isGridView}
                />
              </View>
            ))}
          </View>

          {filteredNotes.length === 0 && (
            <View style={styles.emptyState}>
              <Ionicons
                name={
                  activeTab === 'archive'
                    ? 'archive-outline'
                    : activeTab === 'trash'
                    ? 'trash-outline'
                    : 'journal-outline'
                }
                size={48}
                color={COLORS.textSecondary}
              />
              <Text style={styles.emptyTitle}>
                {activeTab === 'archive'
                  ? 'No Archived Notes'
                  : activeTab === 'trash'
                  ? 'Trash is Empty'
                  : 'No Notes Found'}
              </Text>
              <Text style={styles.emptySub}>
                {activeTab === 'notes'
                  ? 'Tap the + button to create a Google Keep note or checklist!'
                  : 'Notes you archive or delete will appear here.'}
              </Text>
            </View>
          )}
        </View>
      </ScrollView>

      {/* Google Keep Bottom Toolbar & Quick Create Actions */}
      <View style={styles.bottomQuickToolbar}>
        <View style={styles.quickActionsGroup}>
          <TouchableOpacity
            style={styles.quickActionBtn}
            onPress={() => openCreateModal('checklist')}
          >
            <Ionicons name="checkbox-outline" size={20} color={COLORS.textPrimary} />
          </TouchableOpacity>

          <TouchableOpacity
            style={styles.quickActionBtn}
            onPress={() => {
              openCreateModal('text');
              setIsDrawingModalOpen(true);
            }}
          >
            <Ionicons name="brush-outline" size={20} color={COLORS.textPrimary} />
          </TouchableOpacity>

          <TouchableOpacity
            style={styles.quickActionBtn}
            onPress={() => {
              openCreateModal('text');
              setIsVoiceRecorderOpen(true);
            }}
          >
            <Ionicons name="mic-outline" size={20} color={COLORS.textPrimary} />
          </TouchableOpacity>

          <TouchableOpacity
            style={styles.quickActionBtn}
            onPress={() => {
              openCreateModal('text');
              handlePickDeviceImage();
            }}
          >
            <Ionicons name="image-outline" size={20} color={COLORS.textPrimary} />
          </TouchableOpacity>
        </View>

        <TouchableOpacity
          style={styles.fabBtn}
          onPress={() => openCreateModal('text')}
        >
          <Ionicons name="add" size={28} color="#FFF" />
        </TouchableOpacity>
      </View>

      {/* Google Keep 90% Height Note Detail & Editor Modal */}
      <Modal visible={activeModal} transparent animationType="slide">
        <View style={styles.modalOverlay}>
          <View style={[styles.modalCard, { backgroundColor: selectedColor }]}>
            {/* Modal Header */}
            <View style={styles.modalHeader}>
              <Text style={styles.modalTitleHeader}>
                {selectedNote ? 'Edit Note' : 'New Keep Note'}
              </Text>

              <TouchableOpacity onPress={() => setActiveModal(false)} style={styles.closeBtn}>
                <Ionicons name="close" size={24} color={COLORS.textSecondary} />
              </TouchableOpacity>
            </View>

            {/* Scrollable Main Content */}
            <ScrollView style={styles.modalScrollView} showsVerticalScrollIndicator={false}>
              {/* Attached Images List (Preserves Aspect Ratio, No Crop + Lightbox Trigger) */}
              {imagesList.length > 0 && (
                <View style={styles.mediaGridSection}>
                  <Text style={styles.subHeading}>IMAGES ({imagesList.length})</Text>
                  <ScrollView horizontal showsHorizontalScrollIndicator={false} style={styles.mediaScrollRow}>
                    {imagesList.map((imgUri, idx) => (
                      <TouchableOpacity
                        key={idx}
                        style={styles.editorImageThumbWrapper}
                        activeOpacity={0.9}
                        onPress={() => {
                          setLightboxImageUri(imgUri);
                          setLightboxTitle(`Image ${idx + 1}`);
                        }}
                      >
                        <Image source={{ uri: imgUri }} style={styles.editorImageFit} resizeMode="contain" />
                        <TouchableOpacity
                          style={styles.removeMediaBadge}
                          onPress={() => handleRemoveImageAtIndex(idx)}
                        >
                          <Ionicons name="close" size={14} color="#FFF" />
                        </TouchableOpacity>
                      </TouchableOpacity>
                    ))}
                  </ScrollView>
                </View>
              )}

              {/* Attached Canvas Sketches List (Preserves Aspect Ratio + Crisp Background) */}
              {drawingsList.length > 0 && (
                <View style={styles.mediaGridSection}>
                  <Text style={styles.subHeading}>CANVAS SKETCHES ({drawingsList.length})</Text>
                  <ScrollView horizontal showsHorizontalScrollIndicator={false} style={styles.mediaScrollRow}>
                    {drawingsList.map((dwgUri, idx) => (
                      <TouchableOpacity
                        key={idx}
                        style={styles.editorDrawingThumbWrapper}
                        activeOpacity={0.9}
                        onPress={() => {
                          setLightboxImageUri(dwgUri);
                          setLightboxTitle(`Canvas Sketch ${idx + 1}`);
                        }}
                      >
                        <Image source={{ uri: dwgUri }} style={styles.editorImageFit} resizeMode="contain" />
                        <TouchableOpacity
                          style={styles.removeMediaBadge}
                          onPress={() => handleRemoveDrawingAtIndex(idx)}
                        >
                          <Ionicons name="close" size={14} color="#FFF" />
                        </TouchableOpacity>
                      </TouchableOpacity>
                    ))}
                  </ScrollView>
                </View>
              )}

              {/* Attached Voice Audio Memos List */}
              {audioMemosList.length > 0 && (
                <View style={styles.mediaGridSection}>
                  <Text style={styles.subHeading}>VOICE MEMOS ({audioMemosList.length})</Text>
                  {audioMemosList.map((memo) => (
                    <View key={memo.id} style={styles.editorAudioBar}>
                      <TouchableOpacity
                        style={styles.editorAudioPlayBtn}
                        onPress={() => handleTogglePlayAudioInEditor(memo.id, memo.uri)}
                      >
                        <Ionicons
                          name={playingAudioId === memo.id ? 'pause' : 'play'}
                          size={16}
                          color="#FFF"
                        />
                      </TouchableOpacity>

                      <View style={{ flex: 1 }}>
                        <Text style={styles.editorAudioTitle}>{memo.title || 'Voice Note'}</Text>
                        <Text style={styles.editorAudioSub}>
                          {playingAudioId === memo.id ? 'Playing audio...' : `${memo.durationSeconds || 15}s duration`}
                        </Text>
                      </View>

                      <TouchableOpacity onPress={() => handleRemoveAudioMemo(memo.id)}>
                        <Ionicons name="close-circle" size={18} color={COLORS.textSecondary} />
                      </TouchableOpacity>
                    </View>
                  ))}
                </View>
              )}

              {/* Attached Web Links List */}
              {webLinksList.length > 0 && (
                <View style={styles.mediaGridSection}>
                  <Text style={styles.subHeading}>WEB HYPERLINKS ({webLinksList.length})</Text>
                  {webLinksList.map((link) => (
                    <View key={link.id} style={styles.editorWebLinkBar}>
                      <Ionicons name="link-outline" size={16} color={COLORS.primary} />
                      <TouchableOpacity
                        style={{ flex: 1 }}
                        onPress={() => Linking.openURL(link.url)}
                      >
                        <Text style={styles.editorWebLinkTitle} numberOfLines={1}>
                          {link.displayText || link.url}
                        </Text>
                        <Text style={styles.editorWebLinkUrl} numberOfLines={1}>
                          {link.url}
                        </Text>
                      </TouchableOpacity>
                      <TouchableOpacity onPress={() => handleRemoveWebLink(link.id)}>
                        <Ionicons name="close-circle" size={18} color={COLORS.textSecondary} />
                      </TouchableOpacity>
                    </View>
                  ))}
                </View>
              )}

              {/* Reminder Date Badge */}
              {reminderDate ? (
                <View style={styles.editorReminderBadge}>
                  <Ionicons name="alarm" size={16} color={COLORS.dueBadgeText} />
                  <Text style={styles.editorReminderText}>
                    Reminder: {new Date(reminderDate).toLocaleDateString([], { month: 'short', day: 'numeric' })}{' '}
                    at {new Date(reminderDate).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                  </Text>
                  <TouchableOpacity onPress={() => setReminderDate(undefined)}>
                    <Ionicons name="close-circle" size={16} color={COLORS.textSecondary} />
                  </TouchableOpacity>
                </View>
              ) : null}

              {/* Note Title Input */}
              <TextInput
                style={styles.titleInput}
                placeholder="Title"
                value={title}
                onChangeText={setTitle}
                placeholderTextColor="rgba(0,0,0,0.4)"
              />

              {/* Text Note Mode - Body Content Input */}
              {noteType === 'text' && (
                <TextInput
                  style={styles.contentInput}
                  placeholder="Note content..."
                  value={content}
                  onChangeText={setContent}
                  multiline
                  placeholderTextColor="rgba(0,0,0,0.4)"
                />
              )}

              {/* Checklist Mode */}
              {noteType === 'checklist' && (
                <View style={styles.checklistSection}>
                  <Text style={styles.subHeading}>
                    CHECKLIST ITEMS ({completedChecklistItems.length}/{checklist.length})
                  </Text>

                  {/* Active Items */}
                  {activeChecklistItems.map((item, idx) => (
                    <ChecklistDragRow
                      key={item.id}
                      item={item}
                      index={idx}
                      totalCount={activeChecklistItems.length}
                      isCompleted={false}
                      onToggle={handleToggleChecklistItemInEditor}
                      onChangeText={(id, text) => {
                        setChecklist(
                          checklist.map((c) => (c.id === id ? { ...c, text } : c))
                        );
                      }}
                      onDelete={handleDeleteChecklistItemInEditor}
                      onMoveToPosition={handleMoveChecklistItemToPosition}
                    />
                  ))}

                  {/* Add New Checklist Item Input */}
                  <View style={styles.addChecklistRow}>
                    <Ionicons name="add" size={18} color={COLORS.textSecondary} />
                    <TextInput
                      style={styles.addChecklistInput}
                      placeholder="List item..."
                      value={newChecklistText}
                      onChangeText={setNewChecklistText}
                      onSubmitEditing={handleAddChecklistItem}
                      placeholderTextColor="rgba(0,0,0,0.4)"
                    />
                    {newChecklistText.trim() ? (
                      <TouchableOpacity style={styles.addChecklistBtn} onPress={handleAddChecklistItem}>
                        <Text style={styles.addChecklistText}>Add</Text>
                      </TouchableOpacity>
                    ) : null}
                  </View>

                  {/* Collapsible Completed Items Section */}
                  {completedChecklistItems.length > 0 && (
                    <View style={styles.completedSection}>
                      <TouchableOpacity
                        style={styles.completedToggleHeader}
                        onPress={() => setShowCompletedChecklist(!showCompletedChecklist)}
                      >
                        <Ionicons
                          name={showCompletedChecklist ? 'chevron-down' : 'chevron-forward'}
                          size={16}
                          color={COLORS.textSecondary}
                        />
                        <Text style={styles.completedToggleText}>
                          {completedChecklistItems.length} Completed {completedChecklistItems.length === 1 ? 'item' : 'items'}
                        </Text>
                      </TouchableOpacity>

                      {showCompletedChecklist &&
                        completedChecklistItems.map((item, cIdx) => (
                          <ChecklistDragRow
                            key={item.id}
                            item={item}
                            index={cIdx}
                            totalCount={completedChecklistItems.length}
                            isCompleted={true}
                            onToggle={handleToggleChecklistItemInEditor}
                            onChangeText={(id, text) => {
                              setChecklist(
                                checklist.map((c) => (c.id === id ? { ...c, text } : c))
                              );
                            }}
                            onDelete={handleDeleteChecklistItemInEditor}
                            onMoveToPosition={handleMoveChecklistItemToPosition}
                          />
                        ))}
                    </View>
                  )}
                </View>
              )}

              {/* Category Dropdown Picker */}
              <View style={styles.categoryPickerSection}>
                <Text style={styles.subHeading}>CATEGORY</Text>
                <TouchableOpacity
                  style={styles.categoryDropdownBtn}
                  onPress={() => setIsCategoryPickerOpen(!isCategoryPickerOpen)}
                >
                  <View style={styles.catDropdownLeft}>
                    <Ionicons
                      name={
                        categories.find((c) => c.name === selectedCategory)?.icon as any ||
                        'journal-outline'
                      }
                      size={16}
                      color={COLORS.textPrimary}
                    />
                    <Text style={styles.catDropdownText}>{selectedCategory}</Text>
                  </View>
                  <Ionicons
                    name={isCategoryPickerOpen ? 'chevron-up' : 'chevron-down'}
                    size={18}
                    color={COLORS.textSecondary}
                  />
                </TouchableOpacity>

                {isCategoryPickerOpen && (
                  <View style={styles.catDropdownMenu}>
                    {categories.map((cat) => (
                      <TouchableOpacity
                        key={cat.id}
                        style={[
                          styles.catMenuItem,
                          selectedCategory === cat.name && styles.activeCatMenuItem,
                        ]}
                        onPress={() => handleSelectCategory(cat.name)}
                      >
                        <Ionicons name={cat.icon as any} size={16} color={COLORS.textPrimary} />
                        <Text style={styles.catMenuText}>{cat.name}</Text>
                        <View style={[styles.catColorDot, { backgroundColor: cat.color }]} />
                      </TouchableOpacity>
                    ))}

                    <TouchableOpacity
                      style={styles.createCatOptionBtn}
                      onPress={() => {
                        setIsCategoryPickerOpen(false);
                        setIsCreateCategoryModalOpen(true);
                      }}
                    >
                      <Ionicons name="add-circle-outline" size={18} color={COLORS.primary} />
                      <Text style={styles.createCatOptionText}>+ Create New Category</Text>
                    </TouchableOpacity>
                  </View>
                )}
              </View>

              {/* Manual Note Color Select Palette */}
              <Text style={styles.colorLabel}>Manual Color Select</Text>
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
            </ScrollView>

            {/* Modal Bottom Actions Toolbar */}
            <View style={styles.modalFooterToolbar}>
              <View style={styles.mediaActionsGroup}>
                {/* 1. Pin option */}
                <TouchableOpacity
                  style={[styles.toolBtn, isPinned && styles.toolBtnActive]}
                  onPress={() => setIsPinned(!isPinned)}
                >
                  <Ionicons
                    name={isPinned ? 'pin' : 'pin-outline'}
                    size={19}
                    color={isPinned ? COLORS.primary : COLORS.textPrimary}
                  />
                </TouchableOpacity>

                {/* 2. Text Note symbol */}
                <TouchableOpacity
                  style={[styles.toolBtn, noteType === 'text' && styles.toolBtnActive]}
                  onPress={() => handleSetNoteType('text')}
                >
                  <Ionicons
                    name="document-text-outline"
                    size={19}
                    color={noteType === 'text' ? COLORS.primary : COLORS.textPrimary}
                  />
                </TouchableOpacity>

                {/* 3. Checklist symbol */}
                <TouchableOpacity
                  style={[styles.toolBtn, noteType === 'checklist' && styles.toolBtnActive]}
                  onPress={() => handleSetNoteType('checklist')}
                >
                  <Ionicons
                    name="checkbox-outline"
                    size={19}
                    color={noteType === 'checklist' ? COLORS.primary : COLORS.textPrimary}
                  />
                </TouchableOpacity>

                {/* 4. Picture option */}
                <TouchableOpacity style={styles.toolBtn} onPress={handlePickDeviceImage}>
                  <Ionicons name="image-outline" size={19} color={COLORS.textPrimary} />
                </TouchableOpacity>

                {/* 5. Drawing Brush */}
                <TouchableOpacity style={styles.toolBtn} onPress={() => setIsDrawingModalOpen(true)}>
                  <Ionicons name="brush-outline" size={19} color={COLORS.textPrimary} />
                </TouchableOpacity>

                {/* 6. Voice Audio Note Recorder */}
                <TouchableOpacity style={styles.toolBtn} onPress={() => setIsVoiceRecorderOpen(true)}>
                  <Ionicons
                    name="mic-outline"
                    size={19}
                    color={audioMemosList.length > 0 ? COLORS.primary : COLORS.textPrimary}
                  />
                </TouchableOpacity>

                {/* 7. Alarm / Reminder */}
                <TouchableOpacity style={styles.toolBtn} onPress={() => setIsReminderPickerOpen(true)}>
                  <Ionicons name="alarm-outline" size={19} color={reminderDate ? COLORS.dueBadgeText : COLORS.textPrimary} />
                </TouchableOpacity>

                {/* 8. Web Hyperlink (Excel Style Display Text + URL) */}
                <TouchableOpacity
                  style={[styles.toolBtn, webLinksList.length > 0 && styles.toolBtnActive]}
                  onPress={() => setIsUrlModalOpen(true)}
                >
                  <Ionicons
                    name="link-outline"
                    size={19}
                    color={webLinksList.length > 0 ? COLORS.primary : COLORS.textPrimary}
                  />
                </TouchableOpacity>

                {selectedNote && (
                  <TouchableOpacity
                    style={styles.toolBtn}
                    onPress={() => {
                      handleSoftDeleteOnCard(selectedNote.id);
                      setActiveModal(false);
                    }}
                  >
                    <Ionicons name="trash-outline" size={19} color={COLORS.danger} />
                  </TouchableOpacity>
                )}
              </View>

              <TouchableOpacity style={styles.saveBtn} onPress={handleSave}>
                <Text style={styles.saveText}>Save 💾</Text>
              </TouchableOpacity>
            </View>
          </View>
        </View>
      </Modal>

      {/* Full Screen Image Lightbox Modal */}
      <ImageLightboxModal
        visible={lightboxImageUri !== undefined}
        imageUri={lightboxImageUri}
        title={lightboxTitle}
        onClose={() => {
          setLightboxImageUri(undefined);
          setLightboxTitle(undefined);
        }}
      />

      {/* Voice Audio Recorder Modal */}
      <VoiceRecorderModal
        visible={isVoiceRecorderOpen}
        onClose={() => setIsVoiceRecorderOpen(false)}
        onSaveAudioMemo={handleSaveAudioMemo}
      />

      {/* Auxiliary Create New Category Modal */}
      <Modal visible={isCreateCategoryModalOpen} transparent animationType="fade">
        <View style={styles.urlModalOverlay}>
          <View style={styles.urlModalCard}>
            <Text style={styles.urlModalTitle}>🏷️ Create New Category</Text>
            
            <Text style={styles.inputLabel}>Category Name:</Text>
            <TextInput
              style={styles.urlInput}
              placeholder="e.g. Finance, Fitness, Travel..."
              value={newCategoryName}
              onChangeText={setNewCategoryName}
              autoFocus
            />

            <Text style={styles.inputLabel}>Associated Theme Color:</Text>
            <ScrollView horizontal showsHorizontalScrollIndicator={false} style={{ marginBottom: 16 }}>
              {COLORS.keepColors.map((col) => (
                <TouchableOpacity
                  key={col.id}
                  style={[
                    styles.colorCircle,
                    { backgroundColor: col.hex, borderColor: col.border },
                    newCategoryColor === col.hex && styles.selectedCircle,
                  ]}
                  onPress={() => setNewCategoryColor(col.hex)}
                />
              ))}
            </ScrollView>

            <View style={styles.urlBtnRow}>
              <TouchableOpacity
                style={styles.cancelUrlBtn}
                onPress={() => setIsCreateCategoryModalOpen(false)}
              >
                <Text style={styles.cancelUrlText}>Cancel</Text>
              </TouchableOpacity>
              <TouchableOpacity
                style={styles.submitUrlBtn}
                onPress={handleCreateCategory}
              >
                <Text style={styles.submitUrlText}>Save Category</Text>
              </TouchableOpacity>
            </View>
          </View>
        </View>
      </Modal>

      {/* Auxiliary Canvas Drawing Sketch Modal */}
      <DrawingModal
        visible={isDrawingModalOpen}
        onClose={() => setIsDrawingModalOpen(false)}
        onSaveDrawing={handleAddDrawing}
      />

      {/* Auxiliary Attach Web Link Modal (Excel Style: Display Text + URL) */}
      <Modal visible={isUrlModalOpen} transparent animationType="fade">
        <View style={styles.urlModalOverlay}>
          <View style={styles.urlModalCard}>
            <Text style={styles.urlModalTitle}>🔗 Attach Web Hyperlink</Text>

            <Text style={styles.inputLabel}>Display Text (e.g. Google Docs, Amazon Item):</Text>
            <TextInput
              style={styles.urlInput}
              placeholder="e.g. Project Specs Sheet"
              value={linkDisplayText}
              onChangeText={setLinkDisplayText}
            />

            <Text style={styles.inputLabel}>Web URL (https://...):</Text>
            <TextInput
              style={styles.urlInput}
              placeholder="https://docs.google.com/..."
              value={linkUrlInput}
              onChangeText={setLinkUrlInput}
              autoCapitalize="none"
            />

            <View style={styles.urlBtnRow}>
              <TouchableOpacity style={styles.cancelUrlBtn} onPress={() => setIsUrlModalOpen(false)}>
                <Text style={styles.cancelUrlText}>Cancel</Text>
              </TouchableOpacity>
              <TouchableOpacity style={styles.submitUrlBtn} onPress={handleAddWebLink}>
                <Text style={styles.submitUrlText}>Attach Link</Text>
              </TouchableOpacity>
            </View>
          </View>
        </View>
      </Modal>

      {/* Auxiliary Google Calendar Interactive Date & Time AM/PM Alarm Reminder Modal */}
      <CalendarDatePickerModal
        visible={isReminderPickerOpen}
        onClose={() => setIsReminderPickerOpen(false)}
        onSaveReminder={(isoString) => setReminderDate(isoString)}
        initialDate={reminderDate}
      />
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
    paddingVertical: 10,
    backgroundColor: COLORS.surface,
    borderBottomWidth: 1,
    borderBottomColor: COLORS.border,
  },
  headerTopRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: 8,
  },
  headerTitleRow: {
    flexDirection: 'row',
    alignItems: 'center',
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
    fontSize: 18,
    fontWeight: '800',
    color: COLORS.textPrimary,
  },
  viewToggleBtn: {
    padding: 7,
    borderRadius: 10,
    backgroundColor: 'rgba(0,0,0,0.04)',
    borderWidth: 1,
    borderColor: 'rgba(0,0,0,0.06)',
  },
  searchBar: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: 'rgba(0,0,0,0.04)',
    borderRadius: 24,
    paddingHorizontal: 14,
    paddingVertical: 8,
    borderWidth: 1,
    borderColor: 'rgba(0,0,0,0.06)',
    marginBottom: 10,
  },
  searchInput: {
    flex: 1,
    fontSize: 13.5,
    color: COLORS.textPrimary,
    marginLeft: 8,
  },
  tabsRow: {
    flexDirection: 'row',
    gap: 8,
    marginBottom: 10,
  },
  tabChip: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 20,
    backgroundColor: 'rgba(0,0,0,0.03)',
    borderWidth: 1,
    borderColor: 'rgba(0,0,0,0.06)',
  },
  activeTabChip: {
    backgroundColor: COLORS.primaryLight,
    borderColor: COLORS.primary,
  },
  tabChipText: {
    fontSize: 12,
    fontWeight: '600',
    color: COLORS.textSecondary,
  },
  activeTabChipText: {
    color: COLORS.primary,
    fontWeight: '700',
  },
  categoryFilterRow: {
    flexDirection: 'row',
  },
  catFilterChip: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    paddingHorizontal: 13,
    paddingVertical: 6,
    borderRadius: 20,
    backgroundColor: 'rgba(0,0,0,0.04)',
    marginRight: 8,
    borderWidth: 1,
    borderColor: 'rgba(0,0,0,0.06)',
  },
  activeCatFilterChip: {
    backgroundColor: COLORS.primary,
    borderColor: COLORS.primary,
  },
  catFilterText: {
    fontSize: 12,
    fontWeight: '600',
    color: COLORS.textSecondary,
  },
  activeCatFilterText: {
    color: '#FFF',
    fontWeight: '700',
  },
  scrollContent: {
    padding: 12,
    paddingBottom: 90,
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
  gridContainer: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    justifyContent: 'space-between',
  },
  gridItemWrapper: {
    width: '48.5%',
  },
  listContainerStyle: {
    width: '100%',
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
  bottomQuickToolbar: {
    position: 'absolute',
    bottom: 0,
    left: 0,
    right: 0,
    height: 64,
    backgroundColor: '#FFFFFF',
    borderTopWidth: 1,
    borderTopColor: 'rgba(0,0,0,0.06)',
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 16,
    ...SHADOWS.card,
  },
  quickActionsGroup: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
  },
  quickActionBtn: {
    padding: 8,
    borderRadius: 12,
    backgroundColor: 'rgba(0,0,0,0.03)',
  },
  fabBtn: {
    width: 44,
    height: 44,
    borderRadius: 14,
    backgroundColor: COLORS.primary,
    alignItems: 'center',
    justifyContent: 'center',
    ...SHADOWS.floating,
  },
  modalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0,0,0,0.6)',
    justifyContent: 'flex-end',
  },
  modalCard: {
    height: '90%',
    maxHeight: '90%',
    borderTopLeftRadius: 24,
    borderTopRightRadius: 24,
    padding: 16,
    justifyContent: 'space-between',
    ...SHADOWS.floating,
  },
  modalHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingBottom: 10,
    borderBottomWidth: 1,
    borderBottomColor: 'rgba(0,0,0,0.08)',
  },
  modalTitleHeader: {
    fontSize: 16,
    fontWeight: '800',
    color: COLORS.textPrimary,
  },
  closeBtn: {
    padding: 4,
  },
  modalScrollView: {
    flex: 1,
    paddingVertical: 10,
  },
  mediaGridSection: {
    marginBottom: 12,
  },
  mediaScrollRow: {
    flexDirection: 'row',
    marginVertical: 4,
  },
  editorImageThumbWrapper: {
    width: 140,
    height: 110,
    borderRadius: 12,
    backgroundColor: '#F0F0F0',
    marginRight: 8,
    overflow: 'hidden',
    position: 'relative',
    borderWidth: 1,
    borderColor: 'rgba(0,0,0,0.08)',
  },
  editorDrawingThumbWrapper: {
    width: 140,
    height: 100,
    borderRadius: 12,
    backgroundColor: '#FAF9F6',
    marginRight: 8,
    overflow: 'hidden',
    position: 'relative',
    borderWidth: 1,
    borderColor: 'rgba(0,0,0,0.08)',
  },
  editorImageFit: {
    width: '100%',
    height: '100%',
  },
  removeMediaBadge: {
    position: 'absolute',
    top: 6,
    right: 6,
    backgroundColor: 'rgba(0,0,0,0.7)',
    borderRadius: 12,
    width: 24,
    height: 24,
    alignItems: 'center',
    justifyContent: 'center',
  },
  editorAudioBar: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: COLORS.primaryLight,
    paddingHorizontal: 10,
    paddingVertical: 8,
    borderRadius: 10,
    marginBottom: 6,
    gap: 8,
  },
  editorAudioPlayBtn: {
    width: 28,
    height: 28,
    borderRadius: 14,
    backgroundColor: COLORS.primary,
    alignItems: 'center',
    justifyContent: 'center',
  },
  editorAudioTitle: {
    fontSize: 12,
    fontWeight: '700',
    color: COLORS.primary,
  },
  editorAudioSub: {
    fontSize: 10,
    color: COLORS.textSecondary,
  },
  editorWebLinkBar: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: 'rgba(26,115,232,0.08)',
    paddingHorizontal: 10,
    paddingVertical: 8,
    borderRadius: 10,
    borderWidth: 1,
    borderColor: 'rgba(26,115,232,0.2)',
    marginBottom: 6,
    gap: 8,
  },
  editorWebLinkTitle: {
    fontSize: 13,
    fontWeight: '700',
    color: COLORS.primary,
  },
  editorWebLinkUrl: {
    fontSize: 11,
    color: COLORS.textSecondary,
  },
  editorReminderBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    backgroundColor: COLORS.dueBadgeBg,
    paddingHorizontal: 10,
    paddingVertical: 6,
    borderRadius: 10,
    marginBottom: 10,
  },
  editorReminderText: {
    fontSize: 12,
    fontWeight: '700',
    color: COLORS.dueBadgeText,
    flex: 1,
  },
  titleInput: {
    fontSize: 20,
    fontWeight: '800',
    color: COLORS.textPrimary,
    marginBottom: 10,
    paddingVertical: 4,
  },
  contentInput: {
    fontSize: 15,
    color: COLORS.textPrimary,
    minHeight: 120,
    textAlignVertical: 'top',
    marginBottom: 14,
    lineHeight: 22,
  },
  subHeading: {
    fontSize: 11,
    fontWeight: '800',
    color: COLORS.textSecondary,
    marginBottom: 6,
    letterSpacing: 0.8,
  },
  checklistSection: {
    marginBottom: 16,
    paddingTop: 10,
    borderTopWidth: 1,
    borderTopColor: 'rgba(0,0,0,0.08)',
  },
  checklistEditorRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    marginVertical: 4,
  },
  reorderBtnGroup: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 2,
    marginRight: 2,
  },
  dragHandleContainer: {
    paddingHorizontal: 4,
    paddingVertical: 6,
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: 4,
  },
  dragHandleDots: {
    gap: 3,
    alignItems: 'center',
    justifyContent: 'center',
  },
  dotRow: {
    flexDirection: 'row',
    gap: 3,
  },
  dragDot: {
    width: 3.5,
    height: 3.5,
    borderRadius: 2,
    backgroundColor: '#80868B',
  },
  checklistItemInput: {
    flex: 1,
    fontSize: 14,
    color: COLORS.textPrimary,
    paddingVertical: 4,
  },
  checklistItemCompleted: {
    textDecorationLine: 'line-through',
    color: COLORS.textSecondary,
    opacity: 0.7,
  },
  addChecklistRow: {
    flexDirection: 'row',
    alignItems: 'center',
    marginTop: 8,
    gap: 8,
    backgroundColor: 'rgba(0,0,0,0.04)',
    borderRadius: 10,
    paddingHorizontal: 10,
    paddingVertical: 6,
  },
  addChecklistInput: {
    flex: 1,
    fontSize: 13,
    color: COLORS.textPrimary,
  },
  addChecklistBtn: {
    backgroundColor: COLORS.primary,
    borderRadius: 6,
    paddingHorizontal: 10,
    paddingVertical: 4,
  },
  addChecklistText: {
    color: '#FFF',
    fontSize: 12,
    fontWeight: '700',
  },
  completedSection: {
    marginTop: 12,
    paddingTop: 8,
    borderTopWidth: 1,
    borderTopColor: 'rgba(0,0,0,0.06)',
  },
  completedToggleHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    paddingVertical: 4,
  },
  completedToggleText: {
    fontSize: 13,
    fontWeight: '700',
    color: COLORS.textSecondary,
  },
  categoryPickerSection: {
    marginBottom: 16,
    paddingTop: 10,
    borderTopWidth: 1,
    borderTopColor: 'rgba(0,0,0,0.08)',
  },
  categoryDropdownBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    backgroundColor: 'rgba(0,0,0,0.04)',
    paddingHorizontal: 12,
    paddingVertical: 10,
    borderRadius: 10,
  },
  catDropdownLeft: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  catDropdownText: {
    fontSize: 14,
    fontWeight: '700',
    color: COLORS.textPrimary,
  },
  catDropdownMenu: {
    marginTop: 6,
    backgroundColor: COLORS.surface,
    borderRadius: 12,
    borderWidth: 1,
    borderColor: COLORS.border,
    overflow: 'hidden',
    ...SHADOWS.card,
  },
  catMenuItem: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 14,
    paddingVertical: 10,
    gap: 10,
    borderBottomWidth: 1,
    borderBottomColor: 'rgba(0,0,0,0.04)',
  },
  activeCatMenuItem: {
    backgroundColor: COLORS.primaryLight,
  },
  catMenuText: {
    fontSize: 13,
    fontWeight: '600',
    color: COLORS.textPrimary,
    flex: 1,
  },
  catColorDot: {
    width: 14,
    height: 14,
    borderRadius: 7,
    borderWidth: 1,
    borderColor: '#E0E0E0',
  },
  createCatOptionBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 14,
    paddingVertical: 12,
    gap: 8,
    backgroundColor: COLORS.primaryLight,
  },
  createCatOptionText: {
    fontSize: 13,
    fontWeight: '700',
    color: COLORS.primary,
  },
  colorLabel: {
    fontSize: 11,
    fontWeight: '800',
    color: COLORS.textSecondary,
    marginTop: 6,
    marginBottom: 6,
    letterSpacing: 0.8,
  },
  colorRow: {
    flexDirection: 'row',
    marginBottom: 14,
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
  modalFooterToolbar: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingTop: 10,
    borderTopWidth: 1,
    borderTopColor: 'rgba(0,0,0,0.08)',
  },
  mediaActionsGroup: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
  },
  toolBtn: {
    padding: 7,
    borderRadius: 10,
    backgroundColor: 'rgba(0,0,0,0.06)',
  },
  toolBtnActive: {
    backgroundColor: COLORS.primaryLight,
    borderWidth: 1,
    borderColor: COLORS.primary,
  },
  saveBtn: {
    backgroundColor: COLORS.primary,
    borderRadius: 12,
    paddingHorizontal: 18,
    paddingVertical: 9,
  },
  saveText: {
    color: '#FFF',
    fontSize: 14,
    fontWeight: '800',
  },
  urlModalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0,0,0,0.5)',
    alignItems: 'center',
    justifyContent: 'center',
    padding: 20,
  },
  urlModalCard: {
    backgroundColor: COLORS.surface,
    borderRadius: 16,
    padding: 16,
    width: '100%',
    ...SHADOWS.floating,
  },
  urlModalTitle: {
    fontSize: 16,
    fontWeight: '800',
    color: COLORS.textPrimary,
    marginBottom: 12,
  },
  inputLabel: {
    fontSize: 12,
    fontWeight: '700',
    color: COLORS.textSecondary,
    marginBottom: 4,
    marginTop: 4,
  },
  urlInput: {
    backgroundColor: COLORS.background,
    borderRadius: 10,
    paddingHorizontal: 12,
    paddingVertical: 8,
    fontSize: 13,
    borderWidth: 1,
    borderColor: COLORS.border,
    marginBottom: 10,
  },
  urlBtnRow: {
    flexDirection: 'row',
    justifyContent: 'flex-end',
    gap: 10,
    marginTop: 8,
  },
  cancelUrlBtn: {
    paddingHorizontal: 14,
    paddingVertical: 8,
    alignItems: 'center',
  },
  cancelUrlText: {
    fontSize: 13,
    fontWeight: '600',
    color: COLORS.textSecondary,
  },
  submitUrlBtn: {
    backgroundColor: COLORS.primary,
    paddingHorizontal: 14,
    paddingVertical: 8,
    borderRadius: 8,
  },
  submitUrlText: {
    fontSize: 13,
    fontWeight: '700',
    color: '#FFF',
  },
  filterDropdownContainer: {
    marginBottom: 8,
    position: 'relative',
    zIndex: 100,
  },
  filterDropdownTriggerBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    backgroundColor: 'rgba(0,0,0,0.04)',
    borderRadius: 14,
    paddingHorizontal: 12,
    paddingVertical: 10,
    borderWidth: 1,
    borderColor: 'rgba(0,0,0,0.06)',
  },
  filterDropdownTriggerLeft: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    flex: 1,
  },
  filterDropdownTriggerText: {
    fontSize: 13.5,
    fontWeight: '700',
    color: COLORS.textPrimary,
  },
  filterDropdownMenuBox: {
    marginTop: 6,
    backgroundColor: '#FFFFFF',
    borderRadius: 14,
    borderWidth: 1,
    borderColor: COLORS.border,
    paddingVertical: 6,
    ...SHADOWS.floating,
  },
  dropdownSectionLabel: {
    fontSize: 10.5,
    fontWeight: '800',
    color: COLORS.textSecondary,
    paddingHorizontal: 12,
    paddingTop: 8,
    paddingBottom: 4,
    letterSpacing: 0.8,
  },
  dropdownDividerLine: {
    height: 1,
    backgroundColor: 'rgba(0,0,0,0.06)',
    marginVertical: 6,
  },
  dropdownOptionRow: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 12,
    paddingVertical: 9,
    gap: 10,
  },
  activeDropdownOption: {
    backgroundColor: COLORS.primaryLight,
  },
  dropdownOptionText: {
    fontSize: 13,
    fontWeight: '600',
    color: COLORS.textPrimary,
    flex: 1,
  },
  dropdownCatItemWrapper: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingRight: 8,
  },
  dropdownCatLeftBtn: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 12,
    paddingVertical: 8,
    gap: 10,
  },
  catDeleteBtn: {
    padding: 6,
    borderRadius: 6,
    backgroundColor: 'rgba(234,67,53,0.08)',
  },
  dropdownCreateCatBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    paddingHorizontal: 12,
    paddingVertical: 10,
    marginTop: 6,
    backgroundColor: COLORS.primaryLight,
    borderBottomLeftRadius: 12,
    borderBottomRightRadius: 12,
  },
  dropdownCreateCatText: {
    fontSize: 13,
    fontWeight: '700',
    color: COLORS.primary,
  },
});
