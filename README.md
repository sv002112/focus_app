# Focus Keep 🧠⚡
> **An ADHD-Friendly Task, Notes, & AI Brain Dump Mobile App**

Focus Keep is a minimalist, low-friction mobile productivity app built specifically for individuals with ADHD. Drawing design inspiration from **Google Keep** and **Google Tasks**, it eliminates executive overload, task paralysis, time blindness, and app avoidance through calm UI meters, multi-modal brain dumping, and intelligent AI organization.

---

## 🌟 Key Features & ADHD Design Philosophy

### 1. 🔋 Vertical 4-Bar Battery Signal Indicator
Replaces harsh, anxiety-inducing red warning badges with a classic nostalgic vertical battery/signal meter:
* █ `1 Bar  (Soft Green)` ➔ Easy Win / Very Low Energy
* █ █ `2 Bars (Soft Green)` ➔ Light Effort
* █ █ █ `3 Bars (Warm Yellow)` ➔ Moderate Focus
* █ █ █ █ `4 Bars (Soft Orange)` ➔ Deep Focus Task
> **Auto-Assigned + 1-Tap Override**: Automatically tags tasks based on description complexity, with a single-tap popover to adjust energy levels anytime.

### 2. 🧠 Multi-Modal AI Brain Dump (Idea Vault)
A zero-friction parking lot for spontaneous thoughts, web links, images, and audio voice memos so context is never lost:
* 📝 **Quick Text**: Instant thought capture without mandatory folder/tag picker.
* 🔗 **Link + Context Note**: Save web links with optional text explaining *why* it was saved.
* 📷 **Photo + Context Note**: Store images/photos with optional text descriptions.
* 🎙️ **Voice Memo**: 1-tap audio recorder for capturing spoken thoughts on the go.
* ✨ **"Organize with AI" Button**: Processes raw vault items offline and presents a 1-tap confirmation card to convert items into **Tasks** or **Notes**.

### 3. 📌 One-Time Tasks vs. 🔄 Weekly/Daily Routines
Keeps single to-dos cleanly separated from habits & recurring routines:
* **One-Time Tasks**: Completing an item moves it to history with a dopamine checkmark animation.
* **Routines & Habits**: Completing an item updates today's instance and advances your **Habit Streak Counter** (`🔥 4 weeks streak`).

### 4. 📅 Google Tasks Style Calendar Agenda
* Interactive date bar at the top of Focus Tasks.
* Tapping any date filters the task list agenda directly below it.

### 5. 🪄 AI "Break-It-Down" Magic Button
* Tap the magic wand icon on any daunting task (e.g., *"Clean garage"*).
* AI automatically generates 3–5 small 2-minute sub-steps.
* **Fully Editable**: Add, edit, or delete generated sub-steps inline.

### 6. ⏳ Calm Deadline Indicators (Anxiety-Free)
* Displays clean relative badges (*"Due in 3 hours"*, *"Due tomorrow at 5 PM"*).
* **No ticking seconds countdown**: Keeps the interface peaceful and prevents stress spikes.

### 7. 💤 Guilt-Free Snooze & Dopamine Rewards
* Swipe right to complete with haptic vibration + visual checkmark animations.
* Swipe left to snooze to tomorrow or return to the Brain Dump without shame counters.

---

## 📱 App Modules & Architecture

```
┌─────────────────────────────────────────────────────────────────────────────┐
│                      FOCUS KEEP (ADHD PRODUCTIVITY APP)                     │
└──────────────────────────────────────┬──────────────────────────────────────┘
                                       │
         ┌─────────────────────────────┼─────────────────────────────┐
         ▼                             ▼                             ▼
 ┌───────────────┐             ┌───────────────┐             ┌───────────────┐
 │ 1. FOCUS TASKS│             │   2. NOTES    │             │3. AI BRAIN    │
 │   & CALENDAR  │             │   (KEEP-LIKE) │             │    DUMP       │
 └───────────────┘             └───────────────┘             └───────────────┘
 - 📌 One-Time Tasks           - Masonry Card Grid           - Text, Links + Notes
 - 🔄 Routines & Habits        - Color Backgrounds           - Photos + Notes
 - Google Tasks Calendar       - Pinning & Search            - 🎙️ Voice Memos
 - Vertical Battery Meter      - Checkbox Lists              - 100% Local Storage
 - AI "Break-It-Down"          - Attachment links            - "✨ Organize with AI"
 - Calm Deadline Badges        - Quick Notes                 - Keep Raw vs Convert
```

---

## 🔒 100% Offline & Private
All tasks, notes, links, uploaded photos, voice recordings, and AI organization structures are stored **locally on your device**. No data leaves your phone.

---

## 🛠️ Technology Stack

* **Framework**: React Native with Expo (TypeScript)
* **Design Language**: Material 3 / Google Keep & Tasks inspiration
* **Local Database**: SQLite / AsyncStorage
* **Native Build & Export**: Expo Prebuild (`npx expo prebuild`) for native **Android Studio** compilation & Google Play deployment.

---

## 🚀 Development Roadmap

1. **Phase 1**: Expo Initialization & Design Tokens (Cards, Checkboxes, Battery Meter)
2. **Phase 2**: Focus Tasks & Google Calendar Agenda Engine
3. **Phase 3**: AI "Break-It-Down" Sub-task Manager & Haptic Dopamine Effects
4. **Phase 4**: Google Keep Replica Notes Module
5. **Phase 5**: Multi-Modal AI Brain Dump & Local Vault Processor
6. **Phase 6**: Prebuild `android/` directory and compile signed APK/AAB in Android Studio.
