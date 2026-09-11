import AsyncStorage from '@react-native-async-storage/async-storage';
import { Task, Note, BrainDumpItem, UserProfile, NoteCategory } from '../types';
import { DEFAULT_CATEGORIES } from '../constants/theme';

const STORAGE_KEYS = {
  TASKS: '@focus_keep_tasks',
  NOTES: '@focus_keep_notes',
  BRAIN_DUMP: '@focus_keep_brain_dump',
  PROFILE: '@focus_keep_profile',
  CATEGORIES: '@focus_keep_categories',
};

// Seed Data for initial launch
const SEED_TASKS: Task[] = [
  {
    id: '1',
    title: 'Clean workspace desk',
    description: 'Clear trash, wipe down surface, align monitor',
    isRecurring: false,
    dueDate: new Date().toISOString(),
    energyLevel: 1, // Low Energy (1 bar)
    subTasks: [
      { id: 's1', title: 'Put away coffee mug', completed: true },
      { id: 's2', title: 'Wipe surface with cloth', completed: false },
    ],
    completed: false,
    createdAt: new Date().toISOString(),
  },
  {
    id: '2',
    title: 'Review quarterly goals & project roadmaps',
    description: 'Break down major deliverables for next week',
    isRecurring: false,
    dueDate: new Date().toISOString(),
    energyLevel: 4, // Deep Focus (4 bars)
    subTasks: [],
    completed: false,
    createdAt: new Date().toISOString(),
  },
  {
    id: '3',
    title: 'Daily 10-Minute Evening Reset',
    description: 'Tidy up room, prep clothes for tomorrow',
    isRecurring: true,
    repeatFrequency: 'daily',
    energyLevel: 2,
    subTasks: [],
    completed: false,
    streakCount: 3,
    createdAt: new Date().toISOString(),
  },
];

const SEED_NOTES: Note[] = [
  {
    id: '1',
    title: '💡 Project Idea: Focus Keep',
    content: 'An ADHD-friendly app focusing on visual energy meters, 1-tap brain dump, and low-friction organization.',
    type: 'text',
    color: '#FFF9C4',
    category: 'Ideas',
    isPinned: true,
    imageUri: 'https://images.unsplash.com/photo-1517842645767-c639042777db?w=600&auto=format&fit=crop&q=80',
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString(),
  },
  {
    id: '2',
    title: '🛒 Weekly Grocery Checklist',
    content: 'Stock up on healthy high-protein focus snacks for the week!',
    type: 'checklist',
    color: '#E8F5E9',
    category: 'Shopping',
    isPinned: false,
    checklist: [
      { id: 'c1', text: 'Greek yogurt & blueberries', completed: true },
      { id: 'c2', text: 'Almonds & walnuts', completed: true },
      { id: 'c3', text: 'Sparkling water (Lime)', completed: false },
      { id: 'c4', text: 'Dark chocolate 85%', completed: false },
    ],
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString(),
  },
];

const SEED_BRAIN_DUMP: BrainDumpItem[] = [
  {
    id: '1',
    type: 'text',
    content: 'Remember to order replacement air filters for HVAC',
    processed: false,
    createdAt: new Date().toISOString(),
  },
];

const DEFAULT_PROFILE: UserProfile = {
  name: 'Alex Rivera',
  email: 'alex.rivera@focus.app',
  avatarEmoji: '⚡',
  darkMode: false,
  notificationsEnabled: true,
  aiAutoOrganize: true,
  alarmToneId: 'classic-bell',
};

// --- TASKS STORAGE API ---
export const getTasksStorage = async (): Promise<Task[]> => {
  try {
    const json = await AsyncStorage.getItem(STORAGE_KEYS.TASKS);
    if (!json) {
      await AsyncStorage.setItem(STORAGE_KEYS.TASKS, JSON.stringify(SEED_TASKS));
      return SEED_TASKS;
    }
    return JSON.parse(json);
  } catch (e) {
    console.error('Error reading tasks', e);
    return SEED_TASKS;
  }
};

export const saveTasksStorage = async (tasks: Task[]): Promise<void> => {
  try {
    await AsyncStorage.setItem(STORAGE_KEYS.TASKS, JSON.stringify(tasks));
  } catch (e) {
    console.error('Error saving tasks', e);
  }
};

// --- NOTES STORAGE API ---
export const getNotesStorage = async (): Promise<Note[]> => {
  try {
    const json = await AsyncStorage.getItem(STORAGE_KEYS.NOTES);
    if (!json) {
      await AsyncStorage.setItem(STORAGE_KEYS.NOTES, JSON.stringify(SEED_NOTES));
      return SEED_NOTES;
    }
    return JSON.parse(json);
  } catch (e) {
    console.error('Error reading notes', e);
    return SEED_NOTES;
  }
};

export const saveNotesStorage = async (notes: Note[]): Promise<void> => {
  try {
    await AsyncStorage.setItem(STORAGE_KEYS.NOTES, JSON.stringify(notes));
  } catch (e) {
    console.error('Error saving notes', e);
  }
};

// --- BRAIN DUMP STORAGE API ---
export const getBrainDumpStorage = async (): Promise<BrainDumpItem[]> => {
  try {
    const json = await AsyncStorage.getItem(STORAGE_KEYS.BRAIN_DUMP);
    if (!json) {
      await AsyncStorage.setItem(STORAGE_KEYS.BRAIN_DUMP, JSON.stringify(SEED_BRAIN_DUMP));
      return SEED_BRAIN_DUMP;
    }
    return JSON.parse(json);
  } catch (e) {
    console.error('Error reading brain dump', e);
    return SEED_BRAIN_DUMP;
  }
};

export const saveBrainDumpStorage = async (items: BrainDumpItem[]): Promise<void> => {
  try {
    await AsyncStorage.setItem(STORAGE_KEYS.BRAIN_DUMP, JSON.stringify(items));
  } catch (e) {
    console.error('Error saving brain dump', e);
  }
};

// --- USER PROFILE STORAGE API ---
export const getProfileStorage = async (): Promise<UserProfile> => {
  try {
    const json = await AsyncStorage.getItem(STORAGE_KEYS.PROFILE);
    if (!json) {
      await AsyncStorage.setItem(STORAGE_KEYS.PROFILE, JSON.stringify(DEFAULT_PROFILE));
      return DEFAULT_PROFILE;
    }
    return JSON.parse(json);
  } catch (e) {
    return DEFAULT_PROFILE;
  }
};

export const saveProfileStorage = async (profile: UserProfile): Promise<void> => {
  try {
    await AsyncStorage.setItem(STORAGE_KEYS.PROFILE, JSON.stringify(profile));
  } catch (e) {
    console.error('Error saving profile', e);
  }
};

export const getCategoriesStorage = async (): Promise<NoteCategory[]> => {
  try {
    const json = await AsyncStorage.getItem(STORAGE_KEYS.CATEGORIES);
    let cats: NoteCategory[] = json ? JSON.parse(json) : DEFAULT_CATEGORIES;
    
    // Filter out old legacy 'none' entries and ensure 'Uncategorized' is present
    cats = cats.filter((c) => c.name.toLowerCase() !== 'none');
    const hasUncategorized = cats.some((c) => c.name.toLowerCase() === 'uncategorized');
    
    if (!hasUncategorized) {
      cats = [
        { id: 'uncategorized', name: 'Uncategorized', color: '#F1F3F4', icon: 'folder-open-outline' },
        ...cats,
      ];
      await AsyncStorage.setItem(STORAGE_KEYS.CATEGORIES, JSON.stringify(cats));
    }
    return cats;
  } catch (e) {
    return DEFAULT_CATEGORIES;
  }
};

export const saveCategoriesStorage = async (categories: NoteCategory[]): Promise<void> => {
  try {
    await AsyncStorage.setItem(STORAGE_KEYS.CATEGORIES, JSON.stringify(categories));
  } catch (e) {
    console.error('Error saving categories', e);
  }
};

export const clearAllAppStorage = async (): Promise<void> => {
  try {
    await AsyncStorage.multiRemove([
      STORAGE_KEYS.TASKS,
      STORAGE_KEYS.NOTES,
      STORAGE_KEYS.BRAIN_DUMP,
      STORAGE_KEYS.PROFILE,
      STORAGE_KEYS.CATEGORIES,
    ]);
  } catch (e) {
    console.error('Error clearing storage', e);
  }
};
