import React, { useState } from 'react';
import { View, Text, TouchableOpacity, StyleSheet, TextInput } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { Task, EnergyLevel } from '../types';
import { COLORS, SHADOWS } from '../constants/theme';
import { BatteryMeter } from './BatteryMeter';

interface TaskCardProps {
  task: Task;
  onToggleComplete: (id: string) => void;
  onUpdateTask: (updatedTask: Task) => void;
  onDeleteTask: (id: string) => void;
  onAIBreakdown: (id: string) => void;
  onStartFocusTimer?: (task: Task) => void;
}

export const TaskCard: React.FC<TaskCardProps> = ({
  task,
  onToggleComplete,
  onUpdateTask,
  onDeleteTask,
  onAIBreakdown,
  onStartFocusTimer,
}) => {
  const [expanded, setExpanded] = useState(false);
  const [newSubTaskTitle, setNewSubTaskTitle] = useState('');

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

            {/* Vertical Battery Energy Level */}
            <BatteryMeter level={task.energyLevel} onChangeLevel={handleEnergyChange} size="small" />
          </View>
        </TouchableOpacity>

        {/* Focus Timer Button */}
        {onStartFocusTimer && !task.completed && (
          <TouchableOpacity
            onPress={() => onStartFocusTimer(task)}
            style={styles.timerBtn}
          >
            <Ionicons name="time-outline" size={18} color="#0288D1" />
          </TouchableOpacity>
        )}

        {/* AI Magic Breakdown Button */}
        <TouchableOpacity
          onPress={() => {
            onAIBreakdown(task.id);
            setExpanded(true);
          }}
          style={styles.magicBtn}
        >
          <Ionicons name="sparkles-outline" size={18} color={COLORS.primary} />
        </TouchableOpacity>
      </View>

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
            <TouchableOpacity style={styles.deleteBtn} onPress={() => onDeleteTask(task.id)}>
              <Ionicons name="trash-outline" size={16} color={COLORS.danger} />
              <Text style={styles.deleteText}>Delete Task</Text>
            </TouchableOpacity>

            <TouchableOpacity style={styles.collapseBtn} onPress={() => setExpanded(false)}>
              <Text style={styles.collapseText}>Done</Text>
            </TouchableOpacity>
          </View>
        </View>
      )}
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
  timerBtn: {
    padding: 6,
    borderRadius: 10,
    backgroundColor: '#E1F5FE',
    marginRight: 4,
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
});
