import React, { useState } from 'react';
import { View, Text, TouchableOpacity, ScrollView, StyleSheet } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { COLORS } from '../constants/theme';
import { CalendarDatePickerModal } from './CalendarDatePickerModal';

interface CalendarStripProps {
  selectedDate: string | null; // ISO YYYY-MM-DD or null for all
  onSelectDate: (dateStr: string | null) => void;
}

export const CalendarStrip: React.FC<CalendarStripProps> = ({
  selectedDate,
  onSelectDate,
}) => {
  const [isCalendarModalOpen, setIsCalendarModalOpen] = useState(false);

  // Compute Today and Tomorrow date keys (YYYY-MM-DD)
  const { todayStr, tomorrowStr } = React.useMemo(() => {
    const now = new Date();
    const todayStr = now.toISOString().split('T')[0];

    const tom = new Date(now);
    tom.setDate(now.getDate() + 1);
    const tomorrowStr = tom.toISOString().split('T')[0];

    return { todayStr, tomorrowStr };
  }, []);

  const isCustomDateSelected =
    selectedDate !== null &&
    selectedDate !== todayStr &&
    selectedDate !== tomorrowStr;

  const formattedCustomDate = React.useMemo(() => {
    if (!selectedDate) return '';
    try {
      const parts = selectedDate.split('-');
      const d = new Date(parseInt(parts[0]), parseInt(parts[1]) - 1, parseInt(parts[2]));
      return d.toLocaleDateString([], { month: 'short', day: 'numeric' });
    } catch {
      return selectedDate;
    }
  }, [selectedDate]);

  return (
    <View style={styles.wrapper}>
      <ScrollView
        horizontal
        showsHorizontalScrollIndicator={false}
        contentContainerStyle={styles.scrollContent}
      >
        {/* 1. ALL Tasks Chip */}
        <TouchableOpacity
          style={[
            styles.quickChip,
            selectedDate === null && styles.activeQuickChip,
          ]}
          onPress={() => onSelectDate(null)}
        >
          <Text style={[styles.chipText, selectedDate === null && styles.activeChipText]}>
            All Tasks
          </Text>
        </TouchableOpacity>

        {/* 2. TODAY Chip */}
        <TouchableOpacity
          style={[
            styles.quickChip,
            selectedDate === todayStr && styles.activeQuickChip,
          ]}
          onPress={() => onSelectDate(selectedDate === todayStr ? null : todayStr)}
        >
          <Ionicons
            name="today-outline"
            size={14}
            color={selectedDate === todayStr ? '#FFF' : COLORS.primary}
          />
          <Text style={[styles.chipText, selectedDate === todayStr && styles.activeChipText]}>
            Today
          </Text>
        </TouchableOpacity>

        {/* 3. TOMORROW Chip */}
        <TouchableOpacity
          style={[
            styles.quickChip,
            selectedDate === tomorrowStr && styles.activeQuickChip,
          ]}
          onPress={() => onSelectDate(selectedDate === tomorrowStr ? null : tomorrowStr)}
        >
          <Ionicons
            name="time-outline"
            size={14}
            color={selectedDate === tomorrowStr ? '#FFF' : COLORS.textSecondary}
          />
          <Text style={[styles.chipText, selectedDate === tomorrowStr && styles.activeChipText]}>
            Tomorrow
          </Text>
        </TouchableOpacity>

        {/* 5. Custom Selected Date Badge (If active custom date) */}
        {isCustomDateSelected && (
          <TouchableOpacity
            style={[styles.quickChip, styles.activeQuickChip]}
            onPress={() => onSelectDate(null)}
          >
            <Ionicons name="calendar" size={14} color="#FFF" />
            <Text style={[styles.chipText, styles.activeChipText]}>
              {formattedCustomDate}
            </Text>
            <Ionicons name="close-circle" size={14} color="#FFF" />
          </TouchableOpacity>
        )}

        {/* 6. Calendar Icon Button (Opens Interactive Calendar Modal) */}
        <TouchableOpacity
          style={[styles.calendarIconBtn, isCustomDateSelected && styles.activeCalendarIconBtn]}
          onPress={() => setIsCalendarModalOpen(true)}
        >
          <Ionicons
            name="calendar"
            size={18}
            color={isCustomDateSelected ? '#FFF' : COLORS.primary}
          />
        </TouchableOpacity>
      </ScrollView>

      {/* Calendar & Alarm Reminder Date Picker Modal */}
      <CalendarDatePickerModal
        visible={isCalendarModalOpen}
        onClose={() => setIsCalendarModalOpen(false)}
        mode="dateOnly"
        onSaveReminder={(isoString) => {
          const dateKey = isoString.split('T')[0];
          onSelectDate(dateKey);
        }}
        initialDate={selectedDate || undefined}
      />
    </View>
  );
};

const styles = StyleSheet.create({
  wrapper: {
    backgroundColor: COLORS.surface,
    borderBottomWidth: 1,
    borderBottomColor: COLORS.border,
    paddingVertical: 8,
  },
  scrollContent: {
    paddingHorizontal: 12,
    alignItems: 'center',
    gap: 8,
  },
  quickChip: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    paddingVertical: 6,
    paddingHorizontal: 13,
    borderRadius: 20,
    backgroundColor: COLORS.background,
    borderWidth: 1,
    borderColor: COLORS.border,
  },
  activeQuickChip: {
    backgroundColor: COLORS.primary,
    borderColor: COLORS.primary,
  },
  chipText: {
    fontSize: 12,
    fontWeight: '700',
    color: COLORS.textPrimary,
  },
  activeChipText: {
    color: '#FFFFFF',
  },
  calendarIconBtn: {
    width: 32,
    height: 32,
    borderRadius: 16,
    backgroundColor: COLORS.primaryLight,
    borderWidth: 1,
    borderColor: COLORS.primary,
    alignItems: 'center',
    justifyContent: 'center',
  },
  activeCalendarIconBtn: {
    backgroundColor: COLORS.primary,
  },
});
