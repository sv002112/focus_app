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
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { Task, EnergyLevel, RepeatFrequency } from '../types';
import { COLORS, SHADOWS } from '../constants/theme';
import { CalendarStrip } from '../components/CalendarStrip';
import { TaskCard } from '../components/TaskCard';
import { BatteryMeter } from '../components/BatteryMeter';
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
  const [activeTab, setActiveTab] = useState<'oneTime' | 'recurring'>('oneTime');
  const [selectedDate, setSelectedDate] = useState<string | null>(null);
  const [isAddModalOpen, setIsAddModalOpen] = useState(false);

  // Focus Ring Timer state
  const [focusTask, setFocusTask] = useState<Task | null>(null);
  const [timerSeconds, setTimerSeconds] = useState<number>(300); // 5 min default
  const [isTimerRunning, setIsTimerRunning] = useState<boolean>(false);

  // New task form state
  const [newTitle, setNewTitle] = useState('');
  const [newDesc, setNewDesc] = useState('');
  const [isRecurring, setIsRecurring] = useState(false);
  const [repeatFrequency, setRepeatFrequency] = useState<RepeatFrequency>('weekly');
  const [energyLevel, setEnergyLevel] = useState<EnergyLevel>(2);

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

  const handleCreateTask = () => {
    if (!newTitle.trim()) return;
    
    const newTask: Task = {
      id: Date.now().toString(),
      title: newTitle.trim(),
      description: newDesc.trim() || undefined,
      isRecurring: activeTab === 'recurring' || isRecurring,
      repeatFrequency: activeTab === 'recurring' || isRecurring ? repeatFrequency : undefined,
      dueDate: selectedDate ? new Date(selectedDate).toISOString() : new Date().toISOString(),
      energyLevel,
      subTasks: [],
      completed: false,
      streakCount: activeTab === 'recurring' ? 0 : undefined,
      createdAt: new Date().toISOString(),
    };

    onAddTask(newTask);
    setNewTitle('');
    setNewDesc('');
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
    setTimerSeconds(300); // 5 min default
    setIsTimerRunning(false);
  };

  const formatTime = (secs: number) => {
    const m = Math.floor(secs / 60);
    const s = secs % 60;
    return `${m.toString().padStart(2, '0')}:${s.toString().padStart(2, '0')}`;
  };

  const filteredTasks = tasks.filter((t) => {
    const matchesTab = activeTab === 'recurring' ? t.isRecurring : !t.isRecurring;
    if (!matchesTab) return false;
    
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
        {onOpenProfile && (
          <TouchableOpacity style={styles.profileHeaderBtn} onPress={onOpenProfile}>
            <Text style={{ fontSize: 20 }}>{avatarEmoji}</Text>
          </TouchableOpacity>
        )}
        <View style={styles.titleRow}>
          <Text style={styles.appTitle}>Focus Tasks ⚡</Text>
          <Text style={styles.subTitle}>ADHD-friendly task manager</Text>
        </View>
        <TouchableOpacity
          style={styles.addFabHeader}
          onPress={() => {
            setIsRecurring(activeTab === 'recurring');
            setIsAddModalOpen(true);
          }}
        >
          <Ionicons name="add" size={24} color="#FFF" />
        </TouchableOpacity>
      </View>

      {/* One-Time vs Recurring Tabs */}
      <View style={styles.tabBar}>
        <TouchableOpacity
          style={[styles.tabItem, activeTab === 'oneTime' && styles.activeTabItem]}
          onPress={() => setActiveTab('oneTime')}
        >
          <Ionicons
            name="pin-outline"
            size={16}
            color={activeTab === 'oneTime' ? COLORS.primary : COLORS.textSecondary}
          />
          <Text style={[styles.tabLabel, activeTab === 'oneTime' && styles.activeTabLabel]}>
            📌 One-Time
          </Text>
        </TouchableOpacity>

        <TouchableOpacity
          style={[styles.tabItem, activeTab === 'recurring' && styles.activeTabItem]}
          onPress={() => setActiveTab('recurring')}
        >
          <Ionicons
            name="repeat-outline"
            size={16}
            color={activeTab === 'recurring' ? COLORS.primary : COLORS.textSecondary}
          />
          <Text style={[styles.tabLabel, activeTab === 'recurring' && styles.activeTabLabel]}>
            🔄 Routines & Habits
          </Text>
        </TouchableOpacity>
      </View>

      {/* Google Tasks Style Calendar Agenda */}
      <CalendarStrip selectedDate={selectedDate} onSelectDate={setSelectedDate} />

      {/* Task List */}
      <FlatList
        data={filteredTasks}
        keyExtractor={(item) => item.id}
        contentContainerStyle={styles.listContainer}
        renderItem={({ item }) => (
          <TaskCard
            task={item}
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

            <View style={styles.energySelectionRow}>
              <Text style={styles.energySelectLabel}>Energy Needed:</Text>
              <BatteryMeter level={energyLevel} onChangeLevel={setEnergyLevel} showLabel />
            </View>

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

            <TouchableOpacity style={styles.createSubmitBtn} onPress={handleCreateTask}>
              <Text style={styles.createSubmitText}>Create Task ⚡</Text>
            </TouchableOpacity>
          </View>
        </View>
      </Modal>

      {/* Focus Countdown Ring Timer Modal */}
      <Modal visible={focusTask !== null} transparent animationType="fade">
        <View style={styles.focusModalOverlay}>
          <View style={styles.focusModalCard}>
            <TouchableOpacity style={styles.closeFocusBtn} onPress={() => setFocusTask(null)}>
              <Ionicons name="close" size={24} color={COLORS.textSecondary} />
            </TouchableOpacity>

            <Text style={styles.focusHeaderTag}>🎯 ONE-THING FOCUS MODE</Text>
            <Text style={styles.focusTaskTitle}>{focusTask?.title}</Text>

            {/* Circular Timer Display */}
            <View style={styles.timerRing}>
              <Text style={styles.timerDigits}>{formatTime(timerSeconds)}</Text>
              <Text style={styles.timerSubText}>
                {isTimerRunning ? '🔥 Stay Focused!' : 'Ready to sprint'}
              </Text>
            </View>

            {/* Quick Duration Preset Selector */}
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

            {/* Controls Row */}
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
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
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
  titleRow: {
    flex: 1,
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
  addFabHeader: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: COLORS.primary,
    alignItems: 'center',
    justifyContent: 'center',
    ...SHADOWS.floating,
  },
  tabBar: {
    flexDirection: 'row',
    backgroundColor: COLORS.surface,
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderBottomWidth: 1,
    borderBottomColor: COLORS.border,
    gap: 8,
  },
  tabItem: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 8,
    borderRadius: 10,
    backgroundColor: COLORS.background,
    gap: 6,
  },
  activeTabItem: {
    backgroundColor: COLORS.primaryLight,
  },
  tabLabel: {
    fontSize: 12,
    fontWeight: '600',
    color: COLORS.textSecondary,
  },
  activeTabLabel: {
    fontWeight: '800',
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
    backgroundColor: COLORS.primary,
    borderRadius: 12,
    paddingVertical: 12,
    alignItems: 'center',
    marginTop: 8,
  },
  createSubmitText: {
    color: '#FFF',
    fontSize: 14,
    fontWeight: '800',
  },
  // Focus Modal Styles
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
