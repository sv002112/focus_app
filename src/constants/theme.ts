import { NoteCategory } from '../types';

export const DEFAULT_CATEGORIES: NoteCategory[] = [
  { id: 'uncategorized', name: 'Uncategorized', color: '#F1F3F4', icon: 'folder-open-outline' },
  { id: 'general', name: 'General', color: '#FFFFFF', icon: 'journal-outline' },
  { id: 'personal', name: 'Personal', color: '#FFF9C4', icon: 'person-outline' },
  { id: 'work', name: 'Work', color: '#E1F5FE', icon: 'briefcase-outline' },
  { id: 'shopping', name: 'Shopping', color: '#E8F5E9', icon: 'cart-outline' },
  { id: 'ideas', name: 'Ideas', color: '#F3E5F5', icon: 'bulb-outline' },
  { id: 'projects', name: 'Projects', color: '#FFE0B2', icon: 'rocket-outline' },
  { id: 'health', name: 'Health', color: '#E0F2F1', icon: 'fitness-outline' },
];

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
    { id: 'coral', name: 'Soft Coral', hex: '#FFEBEE', border: '#E57373' },
    { id: 'mint', name: 'Mint Green', hex: '#E0F7FA', border: '#4DD0E1' },
    { id: 'lavender', name: 'Lavender', hex: '#EDE7F6', border: '#9FA8DA' },
    { id: 'rose', name: 'Soft Rose', hex: '#F8BBD0', border: '#F48FB1' },
    { id: 'sand', name: 'Warm Sand', hex: '#F5F5DC', border: '#D7CCC8' },
    { id: 'grey', name: 'Sober Grey', hex: '#EAECEE', border: '#CBD5E1' },
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
