# ⚡ Focus Keep - App Features & Architecture Specifications

> **An ADHD-Friendly Task, Notes & AI Brain Dump Companion Mobile App**
> Built with React Native, Expo (v57.0.0), TypeScript, and Material 3 / Google Keep & Tasks Design Principles.

---

## 📋 Executive Overview

**Focus Keep** is engineered specifically for individuals dealing with ADHD, executive dysfunction, task paralysis, and time blindness. By combining visual energy budgeting, multi-modal friction-free brain dumping, Google Keep-style notes, and AI task decomposition, Focus Keep transforms daily organization into an anxiety-free, dopamine-rewarding experience.

---

## 🌟 Comprehensive Feature Catalog

### 1. ⚡ Focus Tasks & Agenda Module
* **📌 One-Time Tasks vs. 🔄 Routines & Habits**:
  - Separate views for one-off tasks and recurring habits/routines.
  - **Habit Streak Tracker**: Completing recurring tasks increases the habit streak counter (`🔥 streakCount`).
* **📅 Google Tasks-Style Calendar Agenda (`CalendarStrip.tsx`)**:
  - 14-day interactive horizontal date picker at the top of the task list.
  - Instant agenda filtering by tapping any date chip or resetting to "ALL".
* **🔘 Google Tasks Circular Checkbox**:
  - Clean circular completion checkboxes with smooth visual strikethrough and feedback.
* **🔋 Vertical 4-Bar Battery Signal Indicator (`BatteryMeter.tsx`)**:
  - Visual energy budgeting system replacing anxiety-inducing urgency badges:
    - █ `1 Bar (Soft Green)` ➔ Easy Win / Low Energy Needed
    - █ █ `2 Bars (Soft Green)` ➔ Light Effort
    - █ █ █ `3 Bars (Warm Yellow)` ➔ Moderate Focus
    - █ █ █ █ `4 Bars (Soft Orange)` ➔ Deep Focus Task
  - **Smart Energy Auto-Detection**: Automatically detects energy level based on task keywords (e.g. "code", "study", "trash", "water").
  - **1-Tap Interactive Override**: Tap the battery meter on any task card or creation modal to cycle levels (1 ➔ 2 ➔ 3 ➔ 4).
* **🪄 AI "Break-It-Down" Magic Decomposition (`aiService.ts`)**:
  - Tap the sparkles icon on any daunting task to trigger AI decomposition into 3–5 actionable 2-minute sub-steps.
  - **Sub-task Manager**: Add custom sub-steps, mark sub-steps completed inline, track completion ratio (`Sub-steps (x/y)`), and delete sub-steps.
* **🎯 1-Thing Focus Ring Timer Modal**:
  - Dedicated focus sprint overlay isolating a single task.
  - Interactive circular timer display formatted in MM:SS.
  - Quick duration presets: `2m`, `5m`, `15m`, `25m`.
  - Play / Pause controls & 1-tap "Mark Done 🎉" button.

---

### 2. 📝 Google Keep-Style Notes Module (`NotesScreen.tsx`, `NoteCard.tsx`, `DrawingModal.tsx`)
* **📱 90% Screen Height Note Editor & View Modal**:
  - Tapping any note tile opens a 90% screen height sheet with rounded top corners for reading and rich editing.
* **🔲 Note vs. Checklist Mode Switcher**:
  - Notes are explicitly formatted as either **Text Notes** or **Checklists**.
  - 1-tap converter switches between Text and Checklist mode (auto-splitting text lines into checklist items or joining items into text lines).
  - **Collapsible Completed Checklist Section**: Completed items automatically move into a collapsible list at the bottom (`+ X completed items`).
* **🏷️ Category System with Custom Category Creation & Associated Colors**:
  - Structured Categories (`General`, `Personal`, `Work`, `Shopping`, `Ideas`, `Projects`, `Health`).
  - **+ Create New Category**: Create custom categories with custom names and assigned theme colors.
  - Selecting a Category automatically updates the Note's color to the Category's default theme color.
  - **Manual Color Palette Override**: Retains the 8-color Google Keep palette picker, allowing users to manually pick any custom color override.
* **🔘 Bottom Toolbar Note Editor Controls**:
  - **Moved Pin Option**: 📌 Pin button moved to bottom toolbar for quick access.
  - **Text & Checklist Mode Symbols**: 📝 Text Note and ☑️ Checklist symbol buttons placed right before the picture option for 1-tap format toggling.
* **🔲 Grid (2-Column) vs. List (1-Column) View Toggle**:
  - Switch header layout between 2-column masonry grid and single column list.
* **🖼️ Uncropped Aspect-Ratio Image Engine & Full-Screen Lightbox (`ImageLightboxModal.tsx`)**:
  - Images display with full aspect ratio (`resizeMode="contain"`), avoiding awkward cropping.
  - Tapping any image preview opens a full-screen Lightbox modal viewer.
* **🎨 Canvas Drawing & Sketch Attachment (`DrawingModal.tsx`)**:
  - Interactive touch sketch canvas with clear stroke visibility. Tapping canvas sketches opens full-screen Lightbox preview.
* **🎙️ Voice Audio Recorder & Player Engine (`VoiceRecorderModal.tsx`, `soundService.ts`)**:
  - Dedicated voice audio recorder modal with live waveform visualizer, recording timer, and preview playback.
  - Note cards and editor sheet include interactive voice note player bars with Play/Pause audio playback.
* **📎 Multi-Attachment Engine**:
  - Support attaching **multiple images**, **multiple canvas sketches**, AND **multiple voice audio notes** coexisting simultaneously on a single note!
* **📥 Archive & 🗑️ Trash System**:
  - View tabs for active Notes, Archived notes, and Trashed notes with 1-tap restore or permanent deletion.
* **⏰ Interactive Google Calendar Month & Dropdown Time AM/PM Alarm Picker (`CalendarDatePickerModal.tsx`)**:
  - Full interactive month calendar grid with day selection and previous/next month navigation.
  - Hour dropdown (`1`–`12`), Minute dropdown (`00`–`55`), and `AM` / `PM` period selector.
  - Real-time date & time preview summary (e.g. *Monday, Sep 21, 2026 at 4:30 PM*).
* **🔍 Real-Time Multi-Field Search Bar**:
  - Instant live filtering by note title, content, checklist items, or category names.

---

### 3. 🧠 Multi-Modal AI Brain Dump Vault (`BrainDumpScreen.tsx`, `BrainDumpInput.tsx`)
* **🚀 Zero-Friction Thought Parking Lot**:
  - Dump ideas instantly without forced categorization, folder selection, or tag inputs.
* **🎙️ Multi-Modal Capture Types**:
  - 📝 **Quick Text**: Raw text thoughts.
  - 🔗 **Link + Context Note**: Save web URLs with optional notes explaining *why* it was saved.
  - 📷 **Photo Reference + Note**: Image descriptions or URIs with context notes.
  - 🎙️ **Voice Memo**: Tap-to-record voice audio memos.
* **✨ "Organize with AI" Intelligence Engine (`organizeBrainDumpAI`)**:
  - Offline heuristic AI classifier that analyzes raw vault entries.
  - Automatically determines if an entry is an **Actionable Task** or a **Keep Note**.
  - Extracts title, description, energy level, recurring frequency, micro sub-steps, or Keep card color and tags.
  - **1-Tap Confirmation Modal**: Choose "Accept & Add to Tasks ⚡", "Accept & Add to Notes 📌", or "Keep Raw in Dump 📁".

---

### 4. 👤 User Profile & Settings Engine (`ProfileModal.tsx`, `soundService.ts`)
* **📊 ADHD Focus Stats Summary Grid**:
  - Real-time counters showing Completed Tasks, Total Tasks, Saved Notes, and Vault Ideas.
* **😄 Avatar & Profile Customization**:
  - Editable display name, email, and 8 emoji avatar choices (`⚡`, `🧠`, `🎯`, `🚀`, `💡`, `🌟`, `🦊`, `🎨`).
* **⚙️ Preference Switches**:
  - **Dark Theme Mode**: Night viewing mode.
  - **Focus Reminders**: Daily notification toggle.
  - **AI Smart Auto-Organize**: Automated brain dump processing toggle.
* **🔔 Alarm & Ringtone Customization (`soundService.ts`)**:
  - **Built-in Tones**: Classic Bell 🔔, Digital Pulse ⚡, Sunrise Breeze 🌅, Ocean Wave 🌊, Zen Gong 🧘.
  - **Dual Audio Engine**: Web Audio API Synthesizer + HTML5 Audio + guarded native `expo-av` integration for zero-crash cross-platform support.
  - **Custom Device Ringtone Picker**: Import audio files (`.mp3`, `.wav`, `.m4a`, `.ogg`) directly from device storage via `expo-document-picker`.
  - **Haptic Vibration**: Integrated haptic feedback via `expo-haptics`.
* **💾 Data Backup & Reset**:
  - Local backup export indicator.
  - **Clear All Data**: Safe reset trigger with confirmation dialog.

---

### 5. 🔒 Architecture & Storage Layer (`localStorage.ts`)
* **100% Offline & Private**:
  - Uses `@react-native-async-storage/async-storage` for local data persistence.
  - Zero external server requirement; all user data remains strictly on-device.
* **Automatic Seed Data**:
  - Initializes friendly seed tasks, notes, and brain dump items on first launch for effortless onboarding.

---

## 🛠️ Technology Stack Summary

| Layer | Technology |
| :--- | :--- |
| **Framework** | React Native (Expo SDK 57) |
| **Language** | TypeScript (Strict type safety) |
| **Navigation** | React Navigation (Bottom Tabs v7) |
| **Icons** | `@expo/vector-icons` (Ionicons) |
| **Storage** | `@react-native-async-storage/async-storage` |
| **Audio & Haptics** | Web Audio API / `expo-document-picker` / `expo-haptics` / `expo-av` |
| **Design System** | Custom Material 3 & Google Keep Inspired Theme (`theme.ts`) |

---

## 📁 File Structure Reference

```
focus_app/
├── App.tsx                    # Main App entry point & reactive state navigator
├── feature.md                 # Detailed feature catalog and specs (This file)
├── README.md                  # Project overview & guide
├── package.json               # Dependencies & scripts
├── tsconfig.json              # TypeScript configuration
└── src/
    ├── components/
    │   ├── BatteryMeter.tsx    # 4-Bar vertical energy meter
    │   ├── BrainDumpInput.tsx  # Multi-modal input modal (Text, Link, Photo, Voice)
    │   ├── CalendarStrip.tsx   # 14-Day Google Tasks agenda strip
    │   ├── NoteCard.tsx        # Google Keep-style note card component
    │   ├── ProfileModal.tsx    # User stats, preferences, & ringtone selector
    │   └── TaskCard.tsx        # Task item card with AI magic breakdown & timer
    ├── constants/
    │   └── theme.ts            # Material 3 colors, Keep palette, energy bar tokens
    ├── screens/
    │   ├── BrainDumpScreen.tsx # AI Vault parking lot screen
    │   ├── FocusTasksScreen.tsx# Main tasks agenda & focus timer screen
    │   └── NotesScreen.tsx     # Keep notes wall & search screen
    ├── services/
    │   ├── aiService.ts        # AI energy detection, break-it-down & vault organizer
    │   └── soundService.ts     # Synthesizer, ringtone previewer & custom audio picker
    ├── storage/
    │   └── localStorage.ts     # AsyncStorage persistence API & initial seed data
    └── types/
        └── index.ts            # TypeScript interfaces & types
```
