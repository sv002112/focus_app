import React from 'react';
import { View, Text, TouchableOpacity, StyleSheet } from 'react-native';
import { EnergyLevel } from '../types';
import { COLORS } from '../constants/theme';

interface BatteryMeterProps {
  level: EnergyLevel;
  onChangeLevel?: (newLevel: EnergyLevel) => void;
  showLabel?: boolean;
  size?: 'small' | 'medium' | 'large';
}

export const BatteryMeter: React.FC<BatteryMeterProps> = ({
  level,
  onChangeLevel,
  showLabel = false,
  size = 'medium',
}) => {
  const getBarColor = (barIndex: number) => {
    if (barIndex > level) return COLORS.energyBars.empty;
    if (level <= 2) return COLORS.energyBars[1].color; // Soft Green
    if (level === 3) return COLORS.energyBars[3].color; // Warm Yellow
    return COLORS.energyBars[4].color; // Soft Orange
  };

  const heights = size === 'small' ? [6, 9, 12, 15] : [10, 14, 18, 22];
  const barWidth = size === 'small' ? 3.5 : 5;
  const gap = size === 'small' ? 2 : 3;

  const handlePress = () => {
    if (onChangeLevel) {
      const nextLevel = (level % 4 + 1) as EnergyLevel;
      onChangeLevel(nextLevel);
    }
  };

  return (
    <TouchableOpacity
      activeOpacity={onChangeLevel ? 0.7 : 1}
      onPress={handlePress}
      style={styles.container}
    >
      <View style={[styles.meterBox, { gap }]}>
        {[1, 2, 3, 4].map((barIndex) => (
          <View
            key={barIndex}
            style={[
              styles.bar,
              {
                width: barWidth,
                height: heights[barIndex - 1],
                backgroundColor: getBarColor(barIndex),
              },
            ]}
          />
        ))}
      </View>
      {showLabel && (
        <Text style={styles.labelText}>
          {level} Bar{level > 1 ? 's' : ''} ({level <= 2 ? 'Low' : level === 3 ? 'Medium' : 'Deep Focus'})
        </Text>
      )}
    </TouchableOpacity>
  );
};

const styles = StyleSheet.create({
  container: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 2,
    paddingHorizontal: 4,
    borderRadius: 6,
    backgroundColor: '#F1F3F4',
  },
  meterBox: {
    flexDirection: 'row',
    alignItems: 'flex-end',
  },
  bar: {
    borderRadius: 1.5,
  },
  labelText: {
    marginLeft: 6,
    fontSize: 11,
    fontWeight: '600',
    color: COLORS.textSecondary,
  },
});
