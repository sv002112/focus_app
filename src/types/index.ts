export type EnergyLevel = 1 | 2 | 3 | 4;

export interface SubTask {
  id: string;
  title: string;
  completed: boolean;
}

export type RepeatFrequency = 'daily' | 'weekly' | 'monthly';

export interface Task {
  id: string;
  title: string;
  description?: string;
  isRecurring: boolean;
  repeatFrequency?: RepeatFrequency;
  repeatDays?: number[]; // 0 = Sun, 1 = Mon, ..., 6 = Sat
  dueDate?: string; // ISO string
  energyLevel: EnergyLevel; // 1 to 4 bars
  subTasks: SubTask[];
  completed: boolean;
  completedAt?: string;
  streakCount?: number;
  createdAt: string;
}

export interface NoteChecklistItem {
  id: string;
  text: string;
  completed: boolean;
}

export interface Note {
  id: string;
  title: string;
  content: string;
  color: string; // e.g. '#FFF8E1' (Yellow), '#E8F5E9' (Green), etc.
  isPinned: boolean;
  tags: string[];
  checklist?: NoteChecklistItem[];
  createdAt: string;
  updatedAt: string;
}

export type BrainDumpType = 'text' | 'link' | 'image' | 'audio';

export interface BrainDumpItem {
  id: string;
  type: BrainDumpType;
  content: string; // text string, link URL, image URI, or audio file URI
  contextNote?: string; // optional extra note attached to link/image/audio
  title?: string;
  processed: boolean;
  createdAt: string;
}

export interface AISuggestion {
  itemType: 'task' | 'note';
  title: string;
  description?: string;
  isRecurring?: boolean;
  repeatFrequency?: RepeatFrequency;
  energyLevel?: EnergyLevel;
  suggestedSubTasks?: string[];
  noteColor?: string;
  tags?: string[];
}

export interface CustomRingtone {
  id: string;
  name: string;
  uri: string;
  addedAt: string;
}

export interface UserProfile {
  name: string;
  email: string;
  avatarEmoji: string;
  darkMode: boolean;
  notificationsEnabled: boolean;
  aiAutoOrganize: boolean;
  alarmToneId?: string;
  customRingtones?: CustomRingtone[];
}
