export const COLORS = {
  // Brand / Material Colors
  primary: '#1A73E8',
  primaryLight: '#E8F0FE',
  background: '#F8F9FA',
  surface: '#FFFFFF',
  textPrimary: '#202124',
  textSecondary: '#5F6368',
  border: '#E8EAED',
  divider: '#F1F3F4',
  
  // Google Keep Card Colors (Light Mode)
  keepColors: [
    { id: 'default', name: 'White', hex: '#FFFFFF', border: '#DADCE0' },
    { id: 'yellow', name: 'Soft Yellow', hex: '#FFF9C4', border: '#FBC02D' },
    { id: 'green', name: 'Soft Green', hex: '#E8F5E9', border: '#81C784' },
    { id: 'blue', name: 'Soft Blue', hex: '#E1F5FE', border: '#4FC3F7' },
    { id: 'teal', name: 'Soft Teal', hex: '#E0F2F1', border: '#4DB6AC' },
    { id: 'pink', name: 'Soft Pink', hex: '#FCE4EC', border: '#F06292' },
    { id: 'purple', name: 'Soft Purple', hex: '#F3E5F5', border: '#BA68C8' },
    { id: 'orange', name: 'Soft Orange', hex: '#FFE0B2', border: '#FFB74D' },
  ],

  // Energy Level Colors (4-Bar Vertical Battery Meter)
  energyBars: {
    1: { color: '#4CAF50', label: '1 Bar (Easy Win / Low Energy)' },
    2: { color: '#4CAF50', label: '2 Bars (Light Effort)' },
    3: { color: '#FFB300', label: '3 Bars (Moderate Focus)' },
    4: { color: '#FB8C00', label: '4 Bars (Deep Focus Task)' },
    empty: '#E0E0E0',
  },

  // Priority Chips & Tags
  routineBadgeBg: '#EDF2FA',
  routineBadgeText: '#0B57D0',
  dueBadgeBg: '#FEF7E0',
  dueBadgeText: '#B06000',
  
  // Dopamine Feedback & Actions
  success: '#34A853',
  danger: '#EA4335',
  warning: '#FBBC04',
};

export const SHADOWS = {
  card: {
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.08,
    shadowRadius: 3,
    elevation: 2,
  },
  floating: {
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.2,
    shadowRadius: 8,
    elevation: 6,
  },
};
