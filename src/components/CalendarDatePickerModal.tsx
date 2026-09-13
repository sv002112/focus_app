import React, { useState } from 'react';
import {
  View,
  Text,
  Modal,
  TouchableOpacity,
  StyleSheet,
  ScrollView,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { COLORS, SHADOWS } from '../constants/theme';

interface CalendarDatePickerModalProps {
  visible: boolean;
  onClose: () => void;
  onSaveReminder: (isoDateString: string) => void;
  initialDate?: string;
  mode?: 'alarmReminder' | 'dateOnly';
}

const MONTH_NAMES = [
  'January', 'February', 'March', 'April', 'May', 'June',
  'July', 'August', 'September', 'October', 'November', 'December'
];

const DAYS_OF_WEEK = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'];

export const CalendarDatePickerModal: React.FC<CalendarDatePickerModalProps> = ({
  visible,
  onClose,
  onSaveReminder,
  initialDate,
  mode = 'alarmReminder',
}) => {
  // Calendar date state (defaults to today or initialDate)
  const init = initialDate ? new Date(initialDate) : new Date();
  
  const [currentYear, setCurrentYear] = useState<number>(init.getFullYear());
  const [currentMonth, setCurrentMonth] = useState<number>(init.getMonth()); // 0-indexed
  const [selectedDay, setSelectedDay] = useState<number>(init.getDate());

  // Time state (Hour 1-12, Minute 0-55 step 5, AM/PM)
  const initialHours = init.getHours();
  const [selectedHour, setSelectedHour] = useState<number>(
    initialHours === 0 ? 12 : initialHours > 12 ? initialHours - 12 : initialHours
  );
  const [selectedMinute, setSelectedMinute] = useState<number>(
    Math.floor(init.getMinutes() / 5) * 5
  );
  const [selectedAmPm, setSelectedAmPm] = useState<'AM' | 'PM'>(
    initialHours >= 12 ? 'PM' : 'AM'
  );

  // Dropdown expansion toggles
  const [isHourDropdownOpen, setIsHourDropdownOpen] = useState(false);
  const [isMinuteDropdownOpen, setIsMinuteDropdownOpen] = useState(false);
  const [isAmPmDropdownOpen, setIsAmPmDropdownOpen] = useState(false);

  // Calendar calculations
  const firstDayOfMonth = new Date(currentYear, currentMonth, 1).getDay(); // 0 = Sun
  const daysInMonth = new Date(currentYear, currentMonth + 1, 0).getDate();

  const handlePrevMonth = () => {
    if (currentMonth === 0) {
      setCurrentMonth(11);
      setCurrentYear((y) => y - 1);
    } else {
      setCurrentMonth((m) => m - 1);
    }
  };

  const handleNextMonth = () => {
    if (currentMonth === 11) {
      setCurrentMonth(0);
      setCurrentYear((y) => y + 1);
    } else {
      setCurrentMonth((m) => m + 1);
    }
  };

  const handleSave = () => {
    let hour24 = selectedHour;
    if (mode === 'alarmReminder') {
      if (selectedAmPm === 'PM' && hour24 < 12) hour24 += 12;
      if (selectedAmPm === 'AM' && hour24 === 12) hour24 = 0;
    } else {
      hour24 = 12; // Noon default for date-only filter
    }

    const finalDate = new Date(currentYear, currentMonth, selectedDay, hour24, mode === 'alarmReminder' ? selectedMinute : 0, 0);
    onSaveReminder(finalDate.toISOString());
    onClose();
  };

  // Build grid days cells
  const calendarCells = [];
  for (let i = 0; i < firstDayOfMonth; i++) {
    calendarCells.push(<View key={`blank-${i}`} style={styles.calendarCellEmpty} />);
  }
  for (let day = 1; day <= daysInMonth; day++) {
    const isSelected = selectedDay === day;
    const isToday =
      new Date().getDate() === day &&
      new Date().getMonth() === currentMonth &&
      new Date().getFullYear() === currentYear;

    calendarCells.push(
      <TouchableOpacity
        key={`day-${day}`}
        style={[
          styles.calendarCell,
          isToday && styles.calendarCellToday,
          isSelected && styles.calendarCellSelected,
        ]}
        onPress={() => setSelectedDay(day)}
      >
        <Text
          style={[
            styles.calendarDayText,
            isToday && styles.calendarDayTodayText,
            isSelected && styles.calendarDaySelectedText,
          ]}
        >
          {day}
        </Text>
      </TouchableOpacity>
    );
  }

  // Format summary string
  const formattedMinuteStr = selectedMinute.toString().padStart(2, '0');
  const dateObj = new Date(currentYear, currentMonth, selectedDay);
  const dayOfWeekStr = DAYS_OF_WEEK[dateObj.getDay()];
  const monthNameStr = MONTH_NAMES[currentMonth];

  const isDateOnly = mode === 'dateOnly';

  return (
    <Modal visible={visible} transparent animationType="fade">
      <View style={styles.modalOverlay}>
        <View style={styles.modalCard}>
          {/* Header */}
          <View style={styles.headerRow}>
            <Ionicons
              name={isDateOnly ? 'calendar-outline' : 'alarm-outline'}
              size={22}
              color={COLORS.primary}
            />
            <Text style={styles.headerTitle}>
              {isDateOnly ? 'Select Date 📅' : 'Set Alarm & Reminder ⏰'}
            </Text>
            <TouchableOpacity onPress={onClose} style={styles.closeBtn}>
              <Ionicons name="close" size={22} color={COLORS.textSecondary} />
            </TouchableOpacity>
          </View>

          {/* Calendar Month Navigation Header */}
          <View style={styles.monthNavRow}>
            <TouchableOpacity onPress={handlePrevMonth} style={styles.monthNavBtn}>
              <Ionicons name="chevron-back" size={20} color={COLORS.textPrimary} />
            </TouchableOpacity>

            <Text style={styles.monthTitleText}>
              {MONTH_NAMES[currentMonth]} {currentYear}
            </Text>

            <TouchableOpacity onPress={handleNextMonth} style={styles.monthNavBtn}>
              <Ionicons name="chevron-forward" size={20} color={COLORS.textPrimary} />
            </TouchableOpacity>
          </View>

          {/* Days of Week Header */}
          <View style={styles.weekDaysRow}>
            {DAYS_OF_WEEK.map((d, idx) => (
              <Text key={idx} style={styles.weekDayText}>
                {d}
              </Text>
            ))}
          </View>

          {/* Days Grid */}
          <View style={styles.calendarGrid}>{calendarCells}</View>

          {/* Dropdown Selectors for Hour, Minute, AM/PM */}
          {!isDateOnly && (
            <>
              <Text style={styles.sectionLabel}>SELECT TIME:</Text>
              <View style={styles.timeDropdownsRow}>
                {/* Hour Dropdown */}
                <View style={styles.dropdownContainer}>
                  <Text style={styles.dropdownLabel}>Hour</Text>
                  <TouchableOpacity
                    style={styles.dropdownHeader}
                    onPress={() => {
                      setIsHourDropdownOpen(!isHourDropdownOpen);
                      setIsMinuteDropdownOpen(false);
                      setIsAmPmDropdownOpen(false);
                    }}
                  >
                    <Text style={styles.dropdownHeaderText}>{selectedHour}</Text>
                    <Ionicons
                      name={isHourDropdownOpen ? 'chevron-up' : 'chevron-down'}
                      size={16}
                      color={COLORS.textSecondary}
                    />
                  </TouchableOpacity>

                  {isHourDropdownOpen && (
                    <ScrollView style={styles.dropdownMenuList} nestedScrollEnabled>
                      {[1, 2, 3, 4, 5, 6, 7, 8, 9, 10, 11, 12].map((h) => (
                        <TouchableOpacity
                          key={h}
                          style={[styles.dropdownMenuItem, selectedHour === h && styles.dropdownMenuItemActive]}
                          onPress={() => {
                            setSelectedHour(h);
                            setIsHourDropdownOpen(false);
                          }}
                        >
                          <Text style={[styles.dropdownMenuText, selectedHour === h && styles.dropdownMenuTextActive]}>
                            {h}
                          </Text>
                        </TouchableOpacity>
                      ))}
                    </ScrollView>
                  )}
                </View>

                {/* Minute Dropdown */}
                <View style={styles.dropdownContainer}>
                  <Text style={styles.dropdownLabel}>Minute</Text>
                  <TouchableOpacity
                    style={styles.dropdownHeader}
                    onPress={() => {
                      setIsMinuteDropdownOpen(!isMinuteDropdownOpen);
                      setIsHourDropdownOpen(false);
                      setIsAmPmDropdownOpen(false);
                    }}
                  >
                    <Text style={styles.dropdownHeaderText}>{formattedMinuteStr}</Text>
                    <Ionicons
                      name={isMinuteDropdownOpen ? 'chevron-up' : 'chevron-down'}
                      size={16}
                      color={COLORS.textSecondary}
                    />
                  </TouchableOpacity>

                  {isMinuteDropdownOpen && (
                    <ScrollView style={styles.dropdownMenuList} nestedScrollEnabled>
                      {[0, 5, 10, 15, 20, 25, 30, 35, 40, 45, 50, 55].map((m) => (
                        <TouchableOpacity
                          key={m}
                          style={[styles.dropdownMenuItem, selectedMinute === m && styles.dropdownMenuItemActive]}
                          onPress={() => {
                            setSelectedMinute(m);
                            setIsMinuteDropdownOpen(false);
                          }}
                        >
                          <Text style={[styles.dropdownMenuText, selectedMinute === m && styles.dropdownMenuTextActive]}>
                            {m.toString().padStart(2, '0')}
                          </Text>
                        </TouchableOpacity>
                      ))}
                    </ScrollView>
                  )}
                </View>

                {/* AM / PM Dropdown */}
                <View style={styles.dropdownContainer}>
                  <Text style={styles.dropdownLabel}>Period</Text>
                  <TouchableOpacity
                    style={styles.dropdownHeader}
                    onPress={() => {
                      setIsAmPmDropdownOpen(!isAmPmDropdownOpen);
                      setIsHourDropdownOpen(false);
                      setIsMinuteDropdownOpen(false);
                    }}
                  >
                    <Text style={styles.dropdownHeaderText}>{selectedAmPm}</Text>
                    <Ionicons
                      name={isAmPmDropdownOpen ? 'chevron-up' : 'chevron-down'}
                      size={16}
                      color={COLORS.textSecondary}
                    />
                  </TouchableOpacity>

                  {isAmPmDropdownOpen && (
                    <View style={styles.dropdownMenuList}>
                      {(['AM', 'PM'] as const).map((period) => (
                        <TouchableOpacity
                          key={period}
                          style={[styles.dropdownMenuItem, selectedAmPm === period && styles.dropdownMenuItemActive]}
                          onPress={() => {
                            setSelectedAmPm(period);
                            setIsAmPmDropdownOpen(false);
                          }}
                        >
                          <Text style={[styles.dropdownMenuText, selectedAmPm === period && styles.dropdownMenuTextActive]}>
                            {period}
                          </Text>
                        </TouchableOpacity>
                      ))}
                    </View>
                  )}
                </View>
              </View>
            </>
          )}

          {/* Selected DateTime Summary Preview */}
          <View style={styles.summaryBox}>
            <Ionicons name={isDateOnly ? 'calendar-outline' : 'alarm'} size={18} color={COLORS.primary} />
            <Text style={styles.summaryText}>
              {isDateOnly
                ? `${dayOfWeekStr}, ${monthNameStr} ${selectedDay}, ${currentYear}`
                : `${dayOfWeekStr}, ${monthNameStr} ${selectedDay}, ${currentYear} at ${selectedHour}:${formattedMinuteStr} ${selectedAmPm}`}
            </Text>
          </View>

          {/* Footer Action Buttons */}
          <View style={styles.footerBtnRow}>
            <TouchableOpacity style={styles.cancelBtn} onPress={onClose}>
              <Text style={styles.cancelText}>Cancel</Text>
            </TouchableOpacity>

            <TouchableOpacity style={styles.saveBtn} onPress={handleSave}>
              <Text style={styles.saveText}>{isDateOnly ? 'Select Date' : 'Set Alarm'}</Text>
            </TouchableOpacity>
          </View>
        </View>
      </View>
    </Modal>
  );
};

const styles = StyleSheet.create({
  modalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0,0,0,0.5)',
    alignItems: 'center',
    justifyContent: 'center',
    padding: 16,
  },
  modalCard: {
    backgroundColor: COLORS.surface,
    borderRadius: 20,
    padding: 18,
    width: '100%',
    maxWidth: 360,
    ...SHADOWS.floating,
  },
  headerRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: 12,
  },
  headerTitle: {
    fontSize: 16,
    fontWeight: '800',
    color: COLORS.textPrimary,
    flex: 1,
    marginLeft: 8,
  },
  closeBtn: {
    padding: 4,
  },
  monthNavRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: 10,
    backgroundColor: COLORS.background,
    paddingHorizontal: 8,
    paddingVertical: 6,
    borderRadius: 10,
  },
  monthNavBtn: {
    padding: 6,
  },
  monthTitleText: {
    fontSize: 14,
    fontWeight: '800',
    color: COLORS.textPrimary,
  },
  weekDaysRow: {
    flexDirection: 'row',
    justifyContent: 'space-around',
    marginBottom: 6,
  },
  weekDayText: {
    width: 36,
    textAlign: 'center',
    fontSize: 11,
    fontWeight: '700',
    color: COLORS.textSecondary,
  },
  calendarGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    marginBottom: 14,
  },
  calendarCellEmpty: {
    width: '14.28%',
    height: 36,
  },
  calendarCell: {
    width: '14.28%',
    height: 36,
    alignItems: 'center',
    justifyContent: 'center',
    borderRadius: 18,
  },
  calendarCellToday: {
    borderWidth: 1,
    borderColor: COLORS.primary,
  },
  calendarCellSelected: {
    backgroundColor: COLORS.primary,
  },
  calendarDayText: {
    fontSize: 13,
    fontWeight: '600',
    color: COLORS.textPrimary,
  },
  calendarDayTodayText: {
    color: COLORS.primary,
    fontWeight: '800',
  },
  calendarDaySelectedText: {
    color: '#FFFFFF',
    fontWeight: '800',
  },
  sectionLabel: {
    fontSize: 11,
    fontWeight: '800',
    color: COLORS.textSecondary,
    marginBottom: 6,
    letterSpacing: 0.8,
  },
  timeDropdownsRow: {
    flexDirection: 'row',
    gap: 10,
    marginBottom: 14,
    zIndex: 10,
  },
  dropdownContainer: {
    flex: 1,
    position: 'relative',
  },
  dropdownLabel: {
    fontSize: 10,
    fontWeight: '700',
    color: COLORS.textSecondary,
    marginBottom: 4,
  },
  dropdownHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    backgroundColor: COLORS.background,
    borderWidth: 1,
    borderColor: COLORS.border,
    borderRadius: 8,
    paddingHorizontal: 10,
    paddingVertical: 8,
  },
  dropdownHeaderText: {
    fontSize: 14,
    fontWeight: '800',
    color: COLORS.textPrimary,
  },
  dropdownMenuList: {
    position: 'absolute',
    top: 56,
    left: 0,
    right: 0,
    maxHeight: 140,
    backgroundColor: COLORS.surface,
    borderWidth: 1,
    borderColor: COLORS.border,
    borderRadius: 8,
    zIndex: 999,
    ...SHADOWS.card,
  },
  dropdownMenuItem: {
    paddingHorizontal: 10,
    paddingVertical: 8,
    borderBottomWidth: 1,
    borderBottomColor: 'rgba(0,0,0,0.04)',
  },
  dropdownMenuItemActive: {
    backgroundColor: COLORS.primaryLight,
  },
  dropdownMenuText: {
    fontSize: 13,
    fontWeight: '600',
    color: COLORS.textPrimary,
  },
  dropdownMenuTextActive: {
    color: COLORS.primary,
    fontWeight: '800',
  },
  summaryBox: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    backgroundColor: COLORS.primaryLight,
    paddingHorizontal: 12,
    paddingVertical: 10,
    borderRadius: 10,
    marginBottom: 14,
  },
  summaryText: {
    fontSize: 12,
    fontWeight: '700',
    color: COLORS.primary,
    flex: 1,
  },
  footerBtnRow: {
    flexDirection: 'row',
    justifyContent: 'flex-end',
    gap: 10,
  },
  cancelBtn: {
    paddingHorizontal: 14,
    paddingVertical: 9,
  },
  cancelText: {
    fontSize: 13,
    fontWeight: '600',
    color: COLORS.textSecondary,
  },
  saveBtn: {
    backgroundColor: COLORS.primary,
    paddingHorizontal: 16,
    paddingVertical: 9,
    borderRadius: 10,
  },
  saveText: {
    fontSize: 13,
    fontWeight: '800',
    color: '#FFF',
  },
});
