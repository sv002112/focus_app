import React from 'react';
import { View, Text, TouchableOpacity, ScrollView, StyleSheet } from 'react-native';
import { COLORS } from '../constants/theme';

interface CalendarStripProps {
  selectedDate: string | null; // ISO YYYY-MM-DD or null for all
  onSelectDate: (dateStr: string | null) => void;
}

export const CalendarStrip: React.FC<CalendarStripProps> = ({
  selectedDate,
  onSelectDate,
}) => {
  // Generate 14 days starting from today
  const days = React.useMemo(() => {
    const list = [];
    const today = new Date();
    for (let i = 0; i < 14; i++) {
      const d = new Date(today);
      d.setDate(today.getDate() + i);
      const isoKey = d.toISOString().split('T')[0];
      const dayName = i === 0 ? 'TODAY' : d.toLocaleDateString('en-US', { weekday: 'short' }).toUpperCase();
      const dateNum = d.getDate();
      list.push({ dateObj: d, isoKey, dayName, dateNum });
    }
    return list;
  }, []);

  return (
    <View style={styles.wrapper}>
      <ScrollView
        horizontal
        showsHorizontalScrollIndicator={false}
        contentContainerStyle={styles.scrollContent}
      >
        <TouchableOpacity
          style={[
            styles.dayChip,
            selectedDate === null && styles.activeChip,
          ]}
          onPress={() => onSelectDate(null)}
        >
          <Text style={[styles.dayText, selectedDate === null && styles.activeText]}>ALL</Text>
          <Text style={[styles.numText, selectedDate === null && styles.activeText]}>📅</Text>
        </TouchableOpacity>

        {days.map((item) => {
          const isSelected = selectedDate === item.isoKey;
          return (
            <TouchableOpacity
              key={item.isoKey}
              style={[styles.dayChip, isSelected && styles.activeChip]}
              onPress={() => onSelectDate(isSelected ? null : item.isoKey)}
            >
              <Text style={[styles.dayText, isSelected && styles.activeText]}>{item.dayName}</Text>
              <Text style={[styles.numText, isSelected && styles.activeText]}>{item.dateNum}</Text>
            </TouchableOpacity>
          );
        })}
      </ScrollView>
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
  dayChip: {
    paddingVertical: 6,
    paddingHorizontal: 12,
    borderRadius: 12,
    backgroundColor: COLORS.background,
    alignItems: 'center',
    minWidth: 54,
    borderWidth: 1,
    borderColor: COLORS.border,
  },
  activeChip: {
    backgroundColor: COLORS.primary,
    borderColor: COLORS.primary,
  },
  dayText: {
    fontSize: 10,
    fontWeight: '700',
    color: COLORS.textSecondary,
  },
  numText: {
    fontSize: 14,
    fontWeight: '800',
    color: COLORS.textPrimary,
    marginTop: 2,
  },
  activeText: {
    color: '#FFFFFF',
  },
});
