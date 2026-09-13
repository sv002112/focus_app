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
  reminderDate?: string; // ISO string for alarm/reminder
  category?: string; // e.g. 'Work', 'Personal', 'General'
  energyLevel: EnergyLevel; // 1 to 4 bars
  subTasks: SubTask[];
  completed: boolean;
  completedAt?: string;
  streakCount?: number;
  isPinned?: boolean;
  isArchived?: boolean;
  isTrashed?: boolean;
  createdAt: string;
}

export interface NoteChecklistItem {
  id: string;
  text: string;
  completed: boolean;
}

export interface NoteCategory {
  id: string;
  name: string;
  color: string;
  icon: string;
}

export type NoteType = 'text' | 'checklist';

export interface NoteAudioMemo {
  id: string;
  uri: string;
  title: string;
  durationSeconds: number;
  createdAt: string;
}

export interface NoteWebLink {
  id: string;
  displayText: string;
  url: string;
}

export interface Note {
  id: string;
  title: string;
  content: string;
  type: NoteType;
  color: string; // e.g. '#FFF9C4' (Yellow), '#E8F5E9' (Green), etc.
  category: string; // e.g. 'Personal', 'Work', 'Shopping', 'Ideas', 'Projects', 'Health', 'General'
  isPinned: boolean;
  isArchived?: boolean;
  isTrashed?: boolean;
  checklist?: NoteChecklistItem[];
  images?: string[]; // Multiple image URIs
  drawings?: string[]; // Multiple SVG drawing URIs
  audioMemos?: NoteAudioMemo[]; // Multiple voice memos
  webLinks?: NoteWebLink[]; // Clickable hyperlink attachments
  imageUri?: string; // Legacy single image URI
  drawingUri?: string; // Legacy single drawing URI
  audioUri?: string; // Legacy single audio URI
  reminderDate?: string;
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
  category?: string;
  noteType?: NoteType;
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
