import React, { useState } from 'react';
import { View, Text, TouchableOpacity, StyleSheet, TextInput } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { Task, EnergyLevel, NoteCategory } from '../types';
import { COLORS, SHADOWS, DEFAULT_CATEGORIES } from '../constants/theme';
import { BatteryMeter } from './BatteryMeter';
import { CalendarDatePickerModal } from './CalendarDatePickerModal';

interface TaskCardProps {
  task: Task;
  categories?: NoteCategory[];
  onToggleComplete: (id: string) => void;
  onUpdateTask: (updatedTask: Task) => void;
  onDeleteTask: (id: string) => void;
  onToggleArchiveTask?: (id: string) => void;
  onRestoreTask?: (id: string) => void;
  onPermanentDeleteTask?: (id: string) => void;
  onAIBreakdown: (id: string) => void;
  onStartFocusTimer?: (task: Task) => void;
}

export const TaskCard: React.FC<TaskCardProps> = ({
  task,
  categories,
  onToggleComplete,
  onUpdateTask,
  onDeleteTask,
  onToggleArchiveTask,
  onRestoreTask,
  onPermanentDeleteTask,
  onAIBreakdown,
  onStartFocusTimer,
}) => {
  const [expanded, setExpanded] = useState(false);
  const [newSubTaskTitle, setNewSubTaskTitle] = useState('');
  const [isReminderPickerOpen, setIsReminderPickerOpen] = useState(false);
  const [isCategoryPickerOpen, setIsCategoryPickerOpen] = useState(false);

  const activeCategoriesList = categories && categories.length > 0 ? categories : DEFAULT_CATEGORIES;

  // Category Icon Match
  const matchedCategory = activeCategoriesList.find(
    (c) => c.name.toLowerCase() === (task.category || 'General').toLowerCase()
  );
  const categoryIcon = matchedCategory ? matchedCategory.icon : 'folder-outline';

  const handleEnergyChange = (newLevel: EnergyLevel) => {
    onUpdateTask({ ...task, energyLevel: newLevel });
  };

  const handleToggleSubTask = (subId: string) => {
    const updatedSubTasks = task.subTasks.map((st) =>
      st.id === subId ? { ...st, completed: !st.completed } : st
    );
    onUpdateTask({ ...task, subTasks: updatedSubTasks });
  };

  const handleDeleteSubTask = (subId: string) => {
    const updatedSubTasks = task.subTasks.filter((st) => st.id !== subId);
    onUpdateTask({ ...task, subTasks: updatedSubTasks });
  };

  const handleAddSubTask = () => {
    if (!newSubTaskTitle.trim()) return;
    const newSub = {
      id: Date.now().toString(),
      title: newSubTaskTitle.trim(),
      completed: false,
    };
    onUpdateTask({ ...task, subTasks: [...task.subTasks, newSub] });
    setNewSubTaskTitle('');
  };

  return (
    <View style={[styles.card, task.completed && styles.cardCompleted]}>
      {/* Top Header Row */}
      <View style={styles.headerRow}>
        {/* Google Tasks Circular Checkbox */}
        <TouchableOpacity
          onPress={() => onToggleComplete(task.id)}
          style={styles.checkboxTouch}
        >
          <View style={[styles.circleCheck, task.completed && styles.circleChecked]}>
            {task.completed && <Ionicons name="checkmark" size={14} color="#FFF" />}
          </View>
        </TouchableOpacity>

        {/* Task Title & Details */}
        <TouchableOpacity
          style={styles.titleArea}
          onPress={() => setExpanded(!expanded)}
          activeOpacity={0.7}
        >
          <Text style={[styles.titleText, task.completed && styles.titleTextCompleted]}>
            {task.title}
          </Text>

          {/* Badges & Tags Row */}
          <View style={styles.badgeRow}>
            {/* Differentiator Badge */}
            {task.isRecurring ? (
              <View style={styles.routineBadge}>
                <Ionicons name="repeat" size={12} color={COLORS.routineBadgeText} />
                <Text style={styles.routineText}>
                  Habit {task.streakCount ? `🔥 ${task.streakCount}` : ''}
                </Text>
              </View>
            ) : (
              <View style={styles.dueBadge}>
                <Ionicons name="calendar-outline" size={12} color={COLORS.dueBadgeText} />
                <Text style={styles.dueText}>One-Time</Text>
              </View>
            )}

            {/* Category Badge - Clickable to select category */}
            <TouchableOpacity
              style={styles.categoryBadge}
              onPress={(e) => {
                e.stopPropagation();
                setIsCategoryPickerOpen(!isCategoryPickerOpen);
              }}
            >
              <Ionicons name={categoryIcon as any} size={11} color={COLORS.textSecondary} />
              <Text style={styles.categoryBadgeText}>
                {task.category || 'General'}
              </Text>
              <Ionicons name="chevron-down" size={10} color={COLORS.textSecondary} />
            </TouchableOpacity>

            {/* Alarm Reminder Badge */}
            {task.reminderDate ? (
              <TouchableOpacity
                style={styles.reminderBadge}
                onPress={(e) => {
                  e.stopPropagation();
                  setIsReminderPickerOpen(true);
                }}
              >
                <Ionicons name="alarm" size={11} color={COLORS.dueBadgeText} />
                <Text style={styles.reminderText} numberOfLines={1}>
                  {new Date(task.reminderDate).toLocaleDateString([], { month: 'short', day: 'numeric', hour: '2-digit', minute: '2-digit' })}
                </Text>
                <TouchableOpacity
                  onPress={(e) => {
                    e.stopPropagation();
                    onUpdateTask({ ...task, reminderDate: undefined });
                  }}
                  style={{ marginLeft: 2 }}
                >
                  <Ionicons name="close-circle" size={12} color={COLORS.dueBadgeText} />
                </TouchableOpacity>
              </TouchableOpacity>
            ) : null}

            {/* Vertical Battery Energy Level */}
            <BatteryMeter level={task.energyLevel} onChangeLevel={handleEnergyChange} size="small" />
          </View>
        </TouchableOpacity>

        {/* Restore Quick Action for Trashed Task */}
        {task.isTrashed && onRestoreTask ? (
          <TouchableOpacity
            onPress={() => onRestoreTask(task.id)}
            style={styles.restoreHeaderBtn}
          >
            <Ionicons name="refresh-outline" size={18} color={COLORS.primary} />
          </TouchableOpacity>
        ) : null}

        {/* Set Alarm Reminder Button directly on Tile (Pulled from Notes) */}
        {!task.completed && !task.isTrashed && (
          <TouchableOpacity
            onPress={() => setIsReminderPickerOpen(true)}
            style={[styles.timerBtn, task.reminderDate && styles.reminderBtnActive]}
          >
            <Ionicons
              name={task.reminderDate ? 'alarm' : 'alarm-outline'}
              size={18}
              color={task.reminderDate ? COLORS.dueBadgeText : COLORS.primary}
            />
          </TouchableOpacity>
        )}

        {/* AI Magic Breakdown Button */}
        {!task.isTrashed && (
          <TouchableOpacity
            onPress={() => {
              onAIBreakdown(task.id);
              setExpanded(true);
            }}
            style={styles.magicBtn}
          >
            <Ionicons name="sparkles-outline" size={18} color={COLORS.primary} />
          </TouchableOpacity>
        )}
      </View>

      {/* Category Selection Dropdown Overlay */}
      {isCategoryPickerOpen && (
        <View style={styles.catDropdownMenuOverlay}>
          <View style={styles.catDropdownHeaderRow}>
            <Text style={styles.catDropdownHeaderTitle}>SELECT CATEGORY</Text>
            <TouchableOpacity onPress={() => setIsCategoryPickerOpen(false)}>
              <Ionicons name="close" size={18} color={COLORS.textSecondary} />
            </TouchableOpacity>
          </View>
          {activeCategoriesList.map((cat) => {
            const isSelected = (task.category || 'General').toLowerCase() === cat.name.toLowerCase();
            return (
              <TouchableOpacity
                key={cat.id}
                style={[styles.catMenuItem, isSelected && styles.activeCatMenuItem]}
                onPress={() => {
                  onUpdateTask({ ...task, category: cat.name });
                  setIsCategoryPickerOpen(false);
                }}
              >
                <Ionicons name={(cat.icon as any) || 'folder-outline'} size={15} color={COLORS.textPrimary} />
                <Text style={[styles.catMenuText, isSelected && styles.activeCatMenuText]}>
                  {cat.name}
                </Text>
                <View style={[styles.catColorDot, { backgroundColor: cat.color || '#FFE0B2' }]} />
                {isSelected && <Ionicons name="checkmark" size={16} color={COLORS.primary} />}
              </TouchableOpacity>
            );
          })}
        </View>
      )}

      {/* Expanded Sub-Tasks Section */}
      {expanded && (
        <View style={styles.expandedContent}>
          {task.description ? (
            <Text style={styles.descText}>{task.description}</Text>
          ) : null}

          {/* Sub-tasks List */}
          <Text style={styles.subHeading}>Sub-steps ({task.subTasks.filter(s => s.completed).length}/{task.subTasks.length})</Text>
          
          {task.subTasks.map((sub) => (
            <View key={sub.id} style={styles.subTaskRow}>
              <TouchableOpacity onPress={() => handleToggleSubTask(sub.id)}>
                <Ionicons
                  name={sub.completed ? 'checkbox' : 'square-outline'}
                  size={18}
                  color={sub.completed ? COLORS.primary : COLORS.textSecondary}
                />
              </TouchableOpacity>

              <Text style={[styles.subTaskText, sub.completed && styles.subTaskCompleted]}>
                {sub.title}
              </Text>

              <TouchableOpacity onPress={() => handleDeleteSubTask(sub.id)}>
                <Ionicons name="close-circle-outline" size={16} color={COLORS.textSecondary} />
              </TouchableOpacity>
            </View>
          ))}

          {/* Add Sub-task Input */}
          <View style={styles.addSubRow}>
            <TextInput
              style={styles.subInput}
              placeholder="Add tiny 2-min sub-step..."
              value={newSubTaskTitle}
              onChangeText={setNewSubTaskTitle}
              onSubmitEditing={handleAddSubTask}
            />
            <TouchableOpacity style={styles.addSubBtn} onPress={handleAddSubTask}>
              <Ionicons name="add" size={18} color="#FFF" />
            </TouchableOpacity>
          </View>

          {/* Card Footer Actions */}
          <View style={styles.cardFooter}>
            <View style={styles.footerLeftActions}>
              {task.isTrashed ? (
                <>
                  {onRestoreTask && (
                    <TouchableOpacity style={styles.restoreFooterBtn} onPress={() => onRestoreTask(task.id)}>
                      <Ionicons name="refresh-outline" size={15} color={COLORS.primary} />
                      <Text style={styles.restoreText}>Restore</Text>
                    </TouchableOpacity>
                  )}
                  {onPermanentDeleteTask && (
                    <TouchableOpacity style={styles.deleteBtn} onPress={() => onPermanentDeleteTask(task.id)}>
                      <Ionicons name="trash-bin-outline" size={15} color={COLORS.danger} />
                      <Text style={styles.deleteText}>Delete Permanently</Text>
                    </TouchableOpacity>
                  )}
                </>
              ) : (
                <>
                  {onToggleArchiveTask && (
                    <TouchableOpacity style={styles.archiveBtn} onPress={() => onToggleArchiveTask(task.id)}>
                      <Ionicons
                        name={task.isArchived ? 'archive' : 'archive-outline'}
                        size={15}
                        color={COLORS.textSecondary}
                      />
                      <Text style={styles.archiveText}>{task.isArchived ? 'Unarchive' : 'Archive'}</Text>
                    </TouchableOpacity>
                  )}

                  <TouchableOpacity style={styles.deleteBtn} onPress={() => onDeleteTask(task.id)}>
                    <Ionicons name="trash-outline" size={15} color={COLORS.danger} />
                    <Text style={styles.deleteText}>Trash</Text>
                  </TouchableOpacity>
                </>
              )}
            </View>

            <TouchableOpacity style={styles.collapseBtn} onPress={() => setExpanded(false)}>
              <Text style={styles.collapseText}>Done</Text>
            </TouchableOpacity>
          </View>
        </View>
      )}

      {/* Alarm Reminder Date Picker Modal */}
      <CalendarDatePickerModal
        visible={isReminderPickerOpen}
        onClose={() => setIsReminderPickerOpen(false)}
        onSaveReminder={(isoString) => {
          onUpdateTask({ ...task, reminderDate: isoString });
        }}
        initialDate={task.reminderDate}
      />
    </View>
  );
};

const styles = StyleSheet.create({
  card: {
    backgroundColor: COLORS.surface,
    borderRadius: 14,
    padding: 12,
    marginBottom: 10,
    borderWidth: 1,
    borderColor: COLORS.border,
    ...SHADOWS.card,
  },
  cardCompleted: {
    opacity: 0.6,
    backgroundColor: '#F5F5F5',
  },
  headerRow: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  checkboxTouch: {
    paddingRight: 10,
  },
  circleCheck: {
    width: 22,
    height: 22,
    borderRadius: 11,
    borderWidth: 2,
    borderColor: COLORS.primary,
    alignItems: 'center',
    justifyContent: 'center',
  },
  circleChecked: {
    backgroundColor: COLORS.primary,
  },
  titleArea: {
    flex: 1,
  },
  titleText: {
    fontSize: 15,
    fontWeight: '700',
    color: COLORS.textPrimary,
  },
  titleTextCompleted: {
    textDecorationLine: 'line-through',
    color: COLORS.textSecondary,
  },
  badgeRow: {
    flexDirection: 'row',
    alignItems: 'center',
    marginTop: 4,
    gap: 8,
  },
  routineBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: COLORS.routineBadgeBg,
    paddingHorizontal: 6,
    paddingVertical: 2,
    borderRadius: 6,
    gap: 4,
  },
  routineText: {
    fontSize: 10,
    fontWeight: '700',
    color: COLORS.routineBadgeText,
  },
  dueBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: COLORS.dueBadgeBg,
    paddingHorizontal: 6,
    paddingVertical: 2,
    borderRadius: 6,
    gap: 4,
  },
  dueText: {
    fontSize: 10,
    fontWeight: '700',
    color: COLORS.dueBadgeText,
  },
  categoryBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: 'rgba(0,0,0,0.05)',
    paddingHorizontal: 6,
    paddingVertical: 2,
    borderRadius: 6,
    gap: 3,
  },
  categoryBadgeText: {
    fontSize: 10,
    fontWeight: '700',
    color: COLORS.textSecondary,
  },
  reminderBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: COLORS.dueBadgeBg,
    paddingHorizontal: 6,
    paddingVertical: 2,
    borderRadius: 6,
    gap: 3,
  },
  reminderText: {
    fontSize: 10,
    fontWeight: '700',
    color: COLORS.dueBadgeText,
  },
  timerBtn: {
    padding: 6,
    borderRadius: 10,
    backgroundColor: '#E1F5FE',
    marginRight: 4,
  },
  reminderBtnActive: {
    backgroundColor: COLORS.dueBadgeBg,
  },
  magicBtn: {
    padding: 6,
    borderRadius: 10,
    backgroundColor: COLORS.primaryLight,
  },
  expandedContent: {
    marginTop: 12,
    paddingTop: 10,
    borderTopWidth: 1,
    borderTopColor: COLORS.border,
  },
  descText: {
    fontSize: 12,
    color: COLORS.textSecondary,
    marginBottom: 8,
  },
  subHeading: {
    fontSize: 11,
    fontWeight: '700',
    color: COLORS.textSecondary,
    marginBottom: 6,
  },
  subTaskRow: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 4,
    gap: 8,
  },
  subTaskText: {
    fontSize: 13,
    color: COLORS.textPrimary,
    flex: 1,
  },
  subTaskCompleted: {
    textDecorationLine: 'line-through',
    color: COLORS.textSecondary,
  },
  addSubRow: {
    flexDirection: 'row',
    alignItems: 'center',
    marginTop: 8,
    gap: 6,
  },
  subInput: {
    flex: 1,
    backgroundColor: COLORS.background,
    borderRadius: 8,
    paddingHorizontal: 10,
    paddingVertical: 6,
    fontSize: 12,
    borderWidth: 1,
    borderColor: COLORS.border,
  },
  addSubBtn: {
    backgroundColor: COLORS.primary,
    borderRadius: 8,
    width: 30,
    height: 30,
    alignItems: 'center',
    justifyContent: 'center',
  },
  cardFooter: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginTop: 12,
  },
  footerLeftActions: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
  },
  archiveBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
  },
  archiveText: {
    fontSize: 11,
    color: COLORS.textSecondary,
    fontWeight: '700',
  },
  restoreHeaderBtn: {
    padding: 6,
    borderRadius: 10,
    backgroundColor: COLORS.primaryLight,
    marginRight: 4,
  },
  restoreFooterBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
  },
  restoreText: {
    fontSize: 11,
    color: COLORS.primary,
    fontWeight: '700',
  },
  deleteBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
  },
  deleteText: {
    fontSize: 11,
    color: COLORS.danger,
    fontWeight: '700',
  },
  collapseBtn: {
    backgroundColor: COLORS.primaryLight,
    paddingHorizontal: 12,
    paddingVertical: 4,
    borderRadius: 8,
  },
  collapseText: {
    fontSize: 11,
    fontWeight: '700',
    color: COLORS.primary,
  },
  catDropdownMenuOverlay: {
    marginTop: 10,
    backgroundColor: COLORS.surface,
    borderRadius: 12,
    padding: 10,
    borderWidth: 1,
    borderColor: COLORS.border,
    ...SHADOWS.card,
  },
  catDropdownHeaderRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: 8,
    paddingBottom: 6,
    borderBottomWidth: 1,
    borderBottomColor: COLORS.border,
  },
  catDropdownHeaderTitle: {
    fontSize: 11,
    fontWeight: '800',
    color: COLORS.textSecondary,
    letterSpacing: 0.8,
  },
  catMenuItem: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 8,
    paddingHorizontal: 8,
    borderRadius: 8,
    gap: 8,
    marginBottom: 2,
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
  activeCatMenuText: {
    fontWeight: '800',
    color: COLORS.primary,
  },
  catColorDot: {
    width: 10,
    height: 10,
    borderRadius: 5,
  },
});
