import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  TouchableOpacity,
  FlatList,
  StyleSheet,
  TextInput,
  Modal,
  SafeAreaView,
  StatusBar,
  Platform,
  ScrollView,
  Alert,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { Task, EnergyLevel, RepeatFrequency, NoteCategory } from '../types';
import { COLORS, SHADOWS, DEFAULT_CATEGORIES } from '../constants/theme';
import { CalendarStrip } from '../components/CalendarStrip';
import { TaskCard } from '../components/TaskCard';
import { BatteryMeter } from '../components/BatteryMeter';
import { CalendarDatePickerModal } from '../components/CalendarDatePickerModal';
import { getCategoriesStorage, saveCategoriesStorage } from '../storage/localStorage';
import { detectEnergyLevel, breakDownTaskAI } from '../services/aiService';

interface FocusTasksScreenProps {
  tasks: Task[];
  onAddTask: (task: Task) => void;
  onUpdateTask: (task: Task) => void;
  onDeleteTask: (id: string) => void;
  onOpenProfile?: () => void;
  avatarEmoji?: string;
}

export const FocusTasksScreen: React.FC<FocusTasksScreenProps> = ({
  tasks,
  onAddTask,
  onUpdateTask,
  onDeleteTask,
  onOpenProfile,
  avatarEmoji = '⚡',
}) => {
  // Navigation & View Mode State
  const [activeTab, setActiveTab] = useState<'oneTime' | 'recurring'>('oneTime');
  const [selectedDate, setSelectedDate] = useState<string | null>(null);
  const [selectedCategoryFilter, setSelectedCategoryFilter] = useState<string>('All');
  const [isMainFilterDropdownOpen, setIsMainFilterDropdownOpen] = useState(false);

  // Categories State
  const [categories, setCategories] = useState<NoteCategory[]>(DEFAULT_CATEGORIES);

  useEffect(() => {
    async function loadCategories() {
      const stored = await getCategoriesStorage();
      setCategories(stored);
    }
    loadCategories();
  }, []);

  // Add Task Modal State
  const [isAddModalOpen, setIsAddModalOpen] = useState(false);
  const [newTitle, setNewTitle] = useState('');
  const [newDesc, setNewDesc] = useState('');
  const [isRecurring, setIsRecurring] = useState(false);
  const [repeatFrequency, setRepeatFrequency] = useState<RepeatFrequency>('weekly');
  const [energyLevel, setEnergyLevel] = useState<EnergyLevel>(2);
  const [selectedCategory, setSelectedCategory] = useState<string>('General');
  const [newReminderDate, setNewReminderDate] = useState<string | undefined>(undefined);

  // Auxiliary Modals
  const [isReminderPickerOpen, setIsReminderPickerOpen] = useState(false);
  const [isCategoryPickerOpen, setIsCategoryPickerOpen] = useState(false);
  const [isCreateCategoryModalOpen, setIsCreateCategoryModalOpen] = useState(false);
  const [newCategoryName, setNewCategoryName] = useState('');
  const [newCategoryColor, setNewCategoryColor] = useState('#FFE0B2');

  // Focus Ring Timer State
  const [focusTask, setFocusTask] = useState<Task | null>(null);
  const [timerSeconds, setTimerSeconds] = useState<number>(300);
  const [isTimerRunning, setIsTimerRunning] = useState<boolean>(false);

  useEffect(() => {
    let interval: any = null;
    if (isTimerRunning && timerSeconds > 0) {
      interval = setInterval(() => {
        setTimerSeconds((prev) => prev - 1);
      }, 1000);
    } else if (timerSeconds === 0 && isTimerRunning) {
      setIsTimerRunning(false);
    }
    return () => {
      if (interval) clearInterval(interval);
    };
  }, [isTimerRunning, timerSeconds]);

  const handleTitleChange = (text: string) => {
    setNewTitle(text);
    const detected = detectEnergyLevel(text);
    setEnergyLevel(detected);
  };

  // Category deletion
  const handleDeleteCategory = async (catName: string) => {
    const cleanName = catName.trim();
    if (cleanName.toLowerCase() === 'uncategorized' || cleanName.toLowerCase() === 'none') return;

    const updatedCategories = categories.filter(
      (c) => c.name.toLowerCase() !== cleanName.toLowerCase()
    );
    setCategories(updatedCategories);
    await saveCategoriesStorage(updatedCategories);

    // Reassign affected tasks to 'Uncategorized'
    tasks.forEach((t) => {
      if ((t.category || '').toLowerCase() === cleanName.toLowerCase()) {
        onUpdateTask({
          ...t,
          category: 'Uncategorized',
        });
      }
    });

    if (selectedCategoryFilter.toLowerCase() === cleanName.toLowerCase()) {
      setSelectedCategoryFilter('Uncategorized');
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
    setNewCategoryName('');
    setIsCreateCategoryModalOpen(false);
    setIsCategoryPickerOpen(false);
  };

  const openCreateTaskModal = () => {
    setNewTitle('');
    setNewDesc('');
    setIsRecurring(activeTab === 'recurring');
    setSelectedCategory('General');
    setNewReminderDate(undefined);
    setIsAddModalOpen(true);
  };

  const handleCreateTask = () => {
    if (!newTitle.trim()) return;

    const newTask: Task = {
      id: Date.now().toString(),
      title: newTitle.trim(),
      description: newDesc.trim() || undefined,
      isRecurring: activeTab === 'recurring' || isRecurring,
      repeatFrequency: activeTab === 'recurring' || isRecurring ? repeatFrequency : undefined,
      dueDate: selectedDate ? new Date(selectedDate).toISOString() : new Date().toISOString(),
      reminderDate: newReminderDate,
      category: selectedCategory,
      energyLevel,
      subTasks: [],
      completed: false,
      streakCount: activeTab === 'recurring' ? 0 : undefined,
      createdAt: new Date().toISOString(),
    };

    onAddTask(newTask);
    setNewTitle('');
    setNewDesc('');
    setNewReminderDate(undefined);
    setIsAddModalOpen(false);
  };

  const handleToggleComplete = (id: string) => {
    const target = tasks.find((t) => t.id === id);
    if (!target) return;

    if (target.isRecurring) {
      const nextStreak = (target.streakCount || 0) + 1;
      onUpdateTask({
        ...target,
        streakCount: nextStreak,
        completedAt: new Date().toISOString(),
      });
    } else {
      onUpdateTask({
        ...target,
        completed: !target.completed,
        completedAt: !target.completed ? new Date().toISOString() : undefined,
      });
    }
  };

  const handleAIBreakdown = (id: string) => {
    const target = tasks.find((t) => t.id === id);
    if (!target) return;

    const generatedSubSteps = breakDownTaskAI(target.title);
    const newSubTasks = generatedSubSteps.map((stepTitle, index) => ({
      id: `${Date.now()}-${index}`,
      title: stepTitle,
      completed: false,
    }));

    onUpdateTask({
      ...target,
      subTasks: [...target.subTasks, ...newSubTasks],
    });
  };

  const handleStartFocusTimer = (task: Task) => {
    setFocusTask(task);
    setTimerSeconds(300);
    setIsTimerRunning(false);
  };

  const formatTime = (secs: number) => {
    const m = Math.floor(secs / 60);
    const s = secs % 60;
    return `${m.toString().padStart(2, '0')}:${s.toString().padStart(2, '0')}`;
  };

  // Filter Tasks by Tab, Category, and Date
  const filteredTasks = tasks.filter((t) => {
    const matchesTab = activeTab === 'recurring' ? t.isRecurring : !t.isRecurring;
    if (!matchesTab) return false;

    if (selectedCategoryFilter !== 'All') {
      const taskCat = t.category && t.category.trim() !== '' ? t.category.toLowerCase() : 'uncategorized';
      const filterCat = selectedCategoryFilter.toLowerCase();
      if (taskCat !== filterCat) return false;
    }

    if (selectedDate && t.dueDate) {
      const taskDateKey = t.dueDate.split('T')[0];
      return taskDateKey === selectedDate;
    }

    return true;
  });

  return (
    <SafeAreaView style={styles.container}>
      <StatusBar barStyle="dark-content" />

      {/* Screen Header */}
      <View style={styles.header}>
        <View style={styles.headerTopRow}>
          <View style={styles.titleRow}>
            {onOpenProfile && (
              <TouchableOpacity style={styles.profileHeaderBtn} onPress={onOpenProfile}>
                <Text style={{ fontSize: 18 }}>{avatarEmoji}</Text>
              </TouchableOpacity>
            )}
            <View style={styles.headerTitleBadge}>
              <Ionicons name="checkbox" size={20} color={COLORS.primary} />
              <Text style={styles.appTitle}>Focus Tasks</Text>
            </View>
          </View>

          <TouchableOpacity
            style={styles.addFabHeader}
            onPress={openCreateTaskModal}
          >
            <Ionicons name="add" size={24} color="#FFF" />
          </TouchableOpacity>
        </View>

        {/* Combined Dropdown for Views & Categories (Just like Notes Screen) */}
        <View style={styles.filterDropdownContainer}>
          <TouchableOpacity
            style={styles.filterDropdownTriggerBtn}
            onPress={() => setIsMainFilterDropdownOpen(!isMainFilterDropdownOpen)}
            activeOpacity={0.8}
          >
            <View style={styles.filterDropdownTriggerLeft}>
              <Ionicons
                name={activeTab === 'recurring' ? 'repeat-outline' : 'checkbox-outline'}
                size={16}
                color={COLORS.primary}
              />
              <Text style={styles.filterDropdownTriggerText} numberOfLines={1}>
                {activeTab === 'recurring'
                  ? selectedCategoryFilter === 'All'
                    ? '🔄 Habits — All Categories'
                    : `🔄 Habits — ${selectedCategoryFilter}`
                  : selectedCategoryFilter === 'All'
                  ? '📌 Tasks — All Categories'
                  : `📌 Tasks — ${selectedCategoryFilter}`}
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
              <ScrollView style={{ maxHeight: 300 }} nestedScrollEnabled showsVerticalScrollIndicator={false}>
                {/* SECTION 1: VIEWS */}
                <Text style={styles.dropdownSectionLabel}>TASK VIEWS</Text>
                <TouchableOpacity
                  style={[
                    styles.dropdownOptionRow,
                    activeTab === 'oneTime' && selectedCategoryFilter === 'All' && styles.activeDropdownOption,
                  ]}
                  onPress={() => {
                    setActiveTab('oneTime');
                    setSelectedCategoryFilter('All');
                    setIsMainFilterDropdownOpen(false);
                  }}
                >
                  <Ionicons name="pin-outline" size={16} color={COLORS.primary} />
                  <Text style={styles.dropdownOptionText}>📌 One-Time Tasks</Text>
                  {activeTab === 'oneTime' && selectedCategoryFilter === 'All' && (
                    <Ionicons name="checkmark" size={16} color={COLORS.primary} />
                  )}
                </TouchableOpacity>

                <TouchableOpacity
                  style={[
                    styles.dropdownOptionRow,
                    activeTab === 'recurring' && selectedCategoryFilter === 'All' && styles.activeDropdownOption,
                  ]}
                  onPress={() => {
                    setActiveTab('recurring');
                    setSelectedCategoryFilter('All');
                    setIsMainFilterDropdownOpen(false);
                  }}
                >
                  <Ionicons name="repeat-outline" size={16} color={COLORS.primary} />
                  <Text style={styles.dropdownOptionText}>🔄 Routines & Habits</Text>
                  {activeTab === 'recurring' && selectedCategoryFilter === 'All' && (
                    <Ionicons name="checkmark" size={16} color={COLORS.primary} />
                  )}
                </TouchableOpacity>

                {/* SECTION 2: CATEGORIES */}
                <View style={styles.dropdownDividerLine} />
                <Text style={styles.dropdownSectionLabel}>FILTER BY CATEGORY</Text>

                <TouchableOpacity
                  style={[
                    styles.dropdownOptionRow,
                    selectedCategoryFilter === 'All' && styles.activeDropdownOption,
                  ]}
                  onPress={() => {
                    setSelectedCategoryFilter('All');
                    setIsMainFilterDropdownOpen(false);
                  }}
                >
                  <Ionicons name="apps-outline" size={16} color={COLORS.textPrimary} />
                  <Text style={styles.dropdownOptionText}>All Categories</Text>
                  {selectedCategoryFilter === 'All' && (
                    <Ionicons name="checkmark" size={16} color={COLORS.primary} />
                  )}
                </TouchableOpacity>

                {categories.map((cat) => (
                  <View key={cat.id} style={styles.dropdownCatItemWrapper}>
                    <TouchableOpacity
                      style={[
                        styles.dropdownCatLeftBtn,
                        selectedCategoryFilter.toLowerCase() === cat.name.toLowerCase() &&
                          styles.activeDropdownOption,
                      ]}
                      onPress={() => {
                        setSelectedCategoryFilter(cat.name);
                        setIsMainFilterDropdownOpen(false);
                      }}
                    >
                      <Ionicons
                        name={(cat.icon as any) || 'folder-outline'}
                        size={15}
                        color={COLORS.textPrimary}
                      />
                      <Text style={styles.dropdownOptionText}>{cat.name}</Text>
                      <View style={[styles.catColorDot, { backgroundColor: cat.color || '#F5F5F5' }]} />
                    </TouchableOpacity>

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

      {/* Date Quick Selector (Today, Tomorrow, Day After, Calendar Modal) */}
      <CalendarStrip selectedDate={selectedDate} onSelectDate={setSelectedDate} />

      {/* Task List */}
      <FlatList
        data={filteredTasks}
        keyExtractor={(item) => item.id}
        contentContainerStyle={styles.listContainer}
        renderItem={({ item }) => (
          <TaskCard
            task={item}
            categories={categories}
            onToggleComplete={handleToggleComplete}
            onUpdateTask={onUpdateTask}
            onDeleteTask={onDeleteTask}
            onAIBreakdown={handleAIBreakdown}
            onStartFocusTimer={handleStartFocusTimer}
          />
        )}
        ListEmptyComponent={
          <View style={styles.emptyState}>
            <Ionicons name="checkmark-done-circle-outline" size={48} color={COLORS.textSecondary} />
            <Text style={styles.emptyTitle}>
              {activeTab === 'oneTime' ? 'No One-Time Tasks' : 'No Recurring Habits'}
            </Text>
            <Text style={styles.emptySub}>
              Tap the + button above to add a new task without friction!
            </Text>
          </View>
        }
      />

      {/* Create Task Modal */}
      <Modal visible={isAddModalOpen} transparent animationType="slide">
        <View style={styles.modalOverlay}>
          <View style={styles.modalCard}>
            <View style={styles.modalHeader}>
              <Text style={styles.modalTitle}>
                {activeTab === 'recurring' ? '🔄 New Habit / Routine' : '📌 New One-Time Task'}
              </Text>
              <TouchableOpacity onPress={() => setIsAddModalOpen(false)}>
                <Ionicons name="close" size={24} color={COLORS.textSecondary} />
              </TouchableOpacity>
            </View>

            <ScrollView showsVerticalScrollIndicator={false}>
              <TextInput
                style={styles.modalInput}
                placeholder="Task Title (e.g. Clean study desk)"
                value={newTitle}
                onChangeText={handleTitleChange}
                autoFocus
              />

              <TextInput
                style={[styles.modalInput, styles.modalDescInput]}
                placeholder="Optional notes or details..."
                value={newDesc}
                onChangeText={setNewDesc}
                multiline
              />

              {/* Energy Needed Picker */}
              <View style={styles.energySelectionRow}>
                <Text style={styles.energySelectLabel}>Energy Needed:</Text>
                <BatteryMeter level={energyLevel} onChangeLevel={setEnergyLevel} showLabel />
              </View>

              {/* Category Picker Dropdown (Same as Notes) */}
              <View style={styles.categoryPickerSection}>
                <Text style={styles.subHeading}>CATEGORY</Text>
                <TouchableOpacity
                  style={styles.categoryDropdownBtn}
                  onPress={() => setIsCategoryPickerOpen(!isCategoryPickerOpen)}
                >
                  <View style={styles.catDropdownLeft}>
                    <Ionicons
                      name={
                        (categories.find((c) => c.name === selectedCategory)?.icon as any) ||
                        'folder-outline'
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
                        onPress={() => {
                          setSelectedCategory(cat.name);
                          setIsCategoryPickerOpen(false);
                        }}
                      >
                        <Ionicons name={(cat.icon as any) || 'folder-outline'} size={16} color={COLORS.textPrimary} />
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

              {/* Alarm / Reminder Picker (Same as Notes) */}
              <View style={styles.reminderPickerSection}>
                <Text style={styles.subHeading}>ALARM / REMINDER ⏰</Text>
                {newReminderDate ? (
                  <View style={styles.reminderBadgeActive}>
                    <Ionicons name="alarm" size={16} color={COLORS.dueBadgeText} />
                    <Text style={styles.reminderBadgeText}>
                      {new Date(newReminderDate).toLocaleDateString([], { month: 'short', day: 'numeric' })}{' '}
                      at {new Date(newReminderDate).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                    </Text>
                    <TouchableOpacity onPress={() => setNewReminderDate(undefined)}>
                      <Ionicons name="close-circle" size={16} color={COLORS.textSecondary} />
                    </TouchableOpacity>
                  </View>
                ) : (
                  <TouchableOpacity
                    style={styles.setReminderBtn}
                    onPress={() => setIsReminderPickerOpen(true)}
                  >
                    <Ionicons name="alarm-outline" size={18} color={COLORS.primary} />
                    <Text style={styles.setReminderText}>Set Alarm & Time Reminder</Text>
                  </TouchableOpacity>
                )}
              </View>

              {/* Recurring Habits Frequency Selection */}
              {activeTab === 'recurring' && (
                <View style={styles.freqRow}>
                  <Text style={styles.freqLabel}>Repeat Frequency:</Text>
                  {(['daily', 'weekly', 'monthly'] as RepeatFrequency[]).map((freq) => (
                    <TouchableOpacity
                      key={freq}
                      style={[
                        styles.freqChip,
                        repeatFrequency === freq && styles.activeFreqChip,
                      ]}
                      onPress={() => setRepeatFrequency(freq)}
                    >
                      <Text
                        style={[
                          styles.freqChipText,
                          repeatFrequency === freq && styles.activeFreqChipText,
                        ]}
                      >
                        {freq.toUpperCase()}
                      </Text>
                    </TouchableOpacity>
                  ))}
                </View>
              )}
            </ScrollView>

            <TouchableOpacity style={styles.createSubmitBtn} onPress={handleCreateTask}>
              <Ionicons name="checkmark-done" size={18} color="#FFF" style={{ marginRight: 6 }} />
              <Text style={styles.createSubmitText}>Create Task</Text>
            </TouchableOpacity>
          </View>
        </View>
      </Modal>

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

      {/* Calendar & Alarm Reminder Date Picker Modal (Same as Notes) */}
      <CalendarDatePickerModal
        visible={isReminderPickerOpen}
        onClose={() => setIsReminderPickerOpen(false)}
        onSaveReminder={(isoString) => setNewReminderDate(isoString)}
        initialDate={newReminderDate}
      />

      {/* Focus Countdown Ring Timer Modal */}
      <Modal visible={focusTask !== null} transparent animationType="fade">
        <View style={styles.focusModalOverlay}>
          <View style={styles.focusModalCard}>
            <TouchableOpacity style={styles.closeFocusBtn} onPress={() => setFocusTask(null)}>
              <Ionicons name="close" size={24} color={COLORS.textSecondary} />
            </TouchableOpacity>

            <Text style={styles.focusHeaderTag}>🎯 ONE-THING FOCUS MODE</Text>
            <Text style={styles.focusTaskTitle}>{focusTask?.title}</Text>

            <View style={styles.timerRing}>
              <Text style={styles.timerDigits}>{formatTime(timerSeconds)}</Text>
              <Text style={styles.timerSubText}>
                {isTimerRunning ? '🔥 Stay Focused!' : 'Ready to sprint'}
              </Text>
            </View>

            <View style={styles.presetRow}>
              {[120, 300, 900, 1500].map((secs) => (
                <TouchableOpacity
                  key={secs}
                  style={[styles.presetChip, timerSeconds === secs && styles.activePresetChip]}
                  onPress={() => {
                    setIsTimerRunning(false);
                    setTimerSeconds(secs);
                  }}
                >
                  <Text style={[styles.presetText, timerSeconds === secs && styles.activePresetText]}>
                    {secs / 60}m
                  </Text>
                </TouchableOpacity>
              ))}
            </View>

            <View style={styles.timerControlRow}>
              <TouchableOpacity
                style={[styles.timerMainBtn, isTimerRunning ? styles.pauseBtn : styles.startBtn]}
                onPress={() => setIsTimerRunning(!isTimerRunning)}
              >
                <Ionicons name={isTimerRunning ? 'pause' : 'play'} size={24} color="#FFF" />
                <Text style={styles.timerMainText}>
                  {isTimerRunning ? 'Pause' : 'Start Focus'}
                </Text>
              </TouchableOpacity>

              <TouchableOpacity
                style={styles.completeFocusBtn}
                onPress={() => {
                  if (focusTask) handleToggleComplete(focusTask.id);
                  setFocusTask(null);
                }}
              >
                <Ionicons name="checkmark-done" size={20} color={COLORS.primary} />
                <Text style={styles.completeFocusText}>Mark Done 🎉</Text>
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
    paddingTop: Platform.OS === 'web' ? 12 : Platform.OS === 'android' ? (StatusBar.currentHeight || 24) : 0,
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
  titleRow: {
    flexDirection: 'row',
    alignItems: 'center',
    flex: 1,
  },
  headerTitleBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
  },
  appTitle: {
    fontSize: 18,
    fontWeight: '800',
    color: COLORS.textPrimary,
  },
  addFabHeader: {
    width: 36,
    height: 36,
    borderRadius: 18,
    backgroundColor: COLORS.primary,
    alignItems: 'center',
    justifyContent: 'center',
    ...SHADOWS.floating,
  },
  filterDropdownContainer: {
    marginBottom: 4,
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
    position: 'absolute',
    top: 48,
    left: 0,
    right: 0,
    zIndex: 999,
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
  catColorDot: {
    width: 12,
    height: 12,
    borderRadius: 6,
    borderWidth: 1,
    borderColor: '#E0E0E0',
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
  listContainer: {
    padding: 14,
  },
  emptyState: {
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 60,
  },
  emptyTitle: {
    fontSize: 16,
    fontWeight: '700',
    color: COLORS.textPrimary,
    marginTop: 12,
  },
  emptySub: {
    fontSize: 12,
    color: COLORS.textSecondary,
    marginTop: 4,
    textAlign: 'center',
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
    padding: 20,
    maxHeight: '90%',
    ...SHADOWS.floating,
  },
  modalHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: 16,
  },
  modalTitle: {
    fontSize: 16,
    fontWeight: '800',
    color: COLORS.textPrimary,
  },
  modalInput: {
    backgroundColor: COLORS.background,
    borderRadius: 10,
    paddingHorizontal: 14,
    paddingVertical: 10,
    fontSize: 14,
    color: COLORS.textPrimary,
    borderWidth: 1,
    borderColor: COLORS.border,
    marginBottom: 12,
  },
  modalDescInput: {
    minHeight: 60,
    textAlignVertical: 'top',
  },
  energySelectionRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: 14,
  },
  energySelectLabel: {
    fontSize: 13,
    fontWeight: '700',
    color: COLORS.textPrimary,
  },
  subHeading: {
    fontSize: 11,
    fontWeight: '800',
    color: COLORS.textSecondary,
    marginBottom: 6,
    letterSpacing: 0.8,
  },
  categoryPickerSection: {
    marginBottom: 14,
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
  reminderPickerSection: {
    marginBottom: 14,
  },
  setReminderBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    backgroundColor: 'rgba(0,0,0,0.04)',
    paddingHorizontal: 12,
    paddingVertical: 10,
    borderRadius: 10,
  },
  setReminderText: {
    fontSize: 13,
    fontWeight: '700',
    color: COLORS.primary,
  },
  reminderBadgeActive: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    backgroundColor: COLORS.dueBadgeBg,
    paddingHorizontal: 12,
    paddingVertical: 8,
    borderRadius: 10,
  },
  reminderBadgeText: {
    fontSize: 12,
    fontWeight: '700',
    color: COLORS.dueBadgeText,
    flex: 1,
  },
  freqRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    marginBottom: 14,
  },
  freqLabel: {
    fontSize: 12,
    fontWeight: '700',
    color: COLORS.textSecondary,
  },
  freqChip: {
    paddingHorizontal: 10,
    paddingVertical: 4,
    borderRadius: 8,
    backgroundColor: COLORS.background,
    borderWidth: 1,
    borderColor: COLORS.border,
  },
  activeFreqChip: {
    backgroundColor: COLORS.primaryLight,
    borderColor: COLORS.primary,
  },
  freqChipText: {
    fontSize: 11,
    fontWeight: '700',
    color: COLORS.textSecondary,
  },
  activeFreqChipText: {
    color: COLORS.primary,
  },
  createSubmitBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: COLORS.primary,
    borderRadius: 12,
    paddingVertical: 12,
    marginTop: 8,
  },
  createSubmitText: {
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
  focusModalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0,0,0,0.85)',
    justifyContent: 'center',
    alignItems: 'center',
    padding: 20,
  },
  focusModalCard: {
    width: '100%',
    backgroundColor: COLORS.surface,
    borderRadius: 24,
    padding: 24,
    alignItems: 'center',
    position: 'relative',
    ...SHADOWS.floating,
  },
  closeFocusBtn: {
    position: 'absolute',
    top: 16,
    right: 16,
  },
  focusHeaderTag: {
    fontSize: 11,
    fontWeight: '800',
    color: COLORS.primary,
    letterSpacing: 1,
    marginBottom: 8,
  },
  focusTaskTitle: {
    fontSize: 18,
    fontWeight: '800',
    color: COLORS.textPrimary,
    textAlign: 'center',
    marginBottom: 20,
  },
  timerRing: {
    width: 160,
    height: 160,
    borderRadius: 80,
    borderWidth: 6,
    borderColor: COLORS.primary,
    backgroundColor: COLORS.primaryLight + '30',
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 20,
  },
  timerDigits: {
    fontSize: 36,
    fontWeight: '800',
    color: COLORS.primary,
  },
  timerSubText: {
    fontSize: 11,
    fontWeight: '600',
    color: COLORS.textSecondary,
    marginTop: 4,
  },
  presetRow: {
    flexDirection: 'row',
    gap: 10,
    marginBottom: 20,
  },
  presetChip: {
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 12,
    backgroundColor: COLORS.background,
    borderWidth: 1,
    borderColor: COLORS.border,
  },
  activePresetChip: {
    backgroundColor: COLORS.primary,
    borderColor: COLORS.primary,
  },
  presetText: {
    fontSize: 12,
    fontWeight: '700',
    color: COLORS.textPrimary,
  },
  activePresetText: {
    color: '#FFF',
  },
  timerControlRow: {
    flexDirection: 'row',
    gap: 12,
    width: '100%',
  },
  timerMainBtn: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 12,
    borderRadius: 14,
    gap: 8,
  },
  startBtn: {
    backgroundColor: COLORS.primary,
  },
  pauseBtn: {
    backgroundColor: COLORS.danger,
  },
  timerMainText: {
    color: '#FFF',
    fontSize: 14,
    fontWeight: '800',
  },
  completeFocusBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingHorizontal: 16,
    paddingVertical: 12,
    borderRadius: 14,
    backgroundColor: COLORS.primaryLight,
    gap: 6,
  },
  completeFocusText: {
    fontSize: 13,
    fontWeight: '800',
    color: COLORS.primary,
  },
});
