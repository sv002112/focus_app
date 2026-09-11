import React, { useEffect, useState } from 'react';
import { View, ActivityIndicator, StyleSheet } from 'react-native';
import { SafeAreaProvider } from 'react-native-safe-area-context';
import { StatusBar } from 'expo-status-bar';
import { NavigationContainer } from '@react-navigation/native';
import { createBottomTabNavigator } from '@react-navigation/bottom-tabs';
import { Ionicons } from '@expo/vector-icons';

import { Task, Note, BrainDumpItem, BrainDumpType, UserProfile } from './src/types';
import { COLORS } from './src/constants/theme';
import {
  getTasksStorage,
  saveTasksStorage,
  getNotesStorage,
  saveNotesStorage,
  getBrainDumpStorage,
  saveBrainDumpStorage,
  getProfileStorage,
  saveProfileStorage,
  clearAllAppStorage,
} from './src/storage/localStorage';

import { FocusTasksScreen } from './src/screens/FocusTasksScreen';
import { NotesScreen } from './src/screens/NotesScreen';
import { BrainDumpScreen } from './src/screens/BrainDumpScreen';
import { ProfileModal } from './src/components/ProfileModal';

const Tab = createBottomTabNavigator();

export default function App() {
  const [loading, setLoading] = useState(true);
  const [tasks, setTasks] = useState<Task[]>([]);
  const [notes, setNotes] = useState<Note[]>([]);
  const [brainDumpItems, setBrainDumpItems] = useState<BrainDumpItem[]>([]);
  const [profile, setProfile] = useState<UserProfile>({
    name: 'Alex Rivera',
    email: 'alex.rivera@focus.app',
    avatarEmoji: '⚡',
    darkMode: false,
    notificationsEnabled: true,
    aiAutoOrganize: true,
    alarmToneId: 'classic-bell',
  });
  const [isProfileOpen, setIsProfileOpen] = useState(false);

  // Load persistent storage on launch
  useEffect(() => {
    async function loadData() {
      const storedTasks = await getTasksStorage();
      const storedNotes = await getNotesStorage();
      const storedDump = await getBrainDumpStorage();
      const storedProfile = await getProfileStorage();
      setTasks(storedTasks);
      setNotes(storedNotes);
      setBrainDumpItems(storedDump);
      setProfile(storedProfile);
      setLoading(false);
    }
    loadData();
  }, []);

  // Sync state changes with AsyncStorage
  const handleAddTask = (newTask: Task) => {
    const updated = [newTask, ...tasks];
    setTasks(updated);
    saveTasksStorage(updated);
  };

  const handleUpdateTask = (updatedTask: Task) => {
    const updated = tasks.map((t) => (t.id === updatedTask.id ? updatedTask : t));
    setTasks(updated);
    saveTasksStorage(updated);
  };

  const handleDeleteTask = (id: string) => {
    const updated = tasks.filter((t) => t.id !== id);
    setTasks(updated);
    saveTasksStorage(updated);
  };

  const handleAddNote = (newNote: Note) => {
    const updated = [newNote, ...notes];
    setNotes(updated);
    saveNotesStorage(updated);
  };

  const handleUpdateNote = (updatedNote: Note) => {
    const updated = notes.map((n) => (n.id === updatedNote.id ? updatedNote : n));
    setNotes(updated);
    saveNotesStorage(updated);
  };

  const handleDeleteNote = (id: string) => {
    const updated = notes.filter((n) => n.id !== id);
    setNotes(updated);
    saveNotesStorage(updated);
  };

  const handleAddBrainDumpItem = (
    type: BrainDumpType,
    content: string,
    contextNote?: string
  ) => {
    const newItem: BrainDumpItem = {
      id: Date.now().toString(),
      type,
      content,
      contextNote,
      processed: false,
      createdAt: new Date().toISOString(),
    };
    const updated = [newItem, ...brainDumpItems];
    setBrainDumpItems(updated);
    saveBrainDumpStorage(updated);
  };

  const handleDeleteBrainDumpItem = (id: string) => {
    const updated = brainDumpItems.filter((i) => i.id !== id);
    setBrainDumpItems(updated);
    saveBrainDumpStorage(updated);
  };

  const handleUpdateProfile = (updated: UserProfile) => {
    setProfile(updated);
    saveProfileStorage(updated);
  };

  const handleClearAllData = async () => {
    await clearAllAppStorage();
    setTasks([]);
    setNotes([]);
    setBrainDumpItems([]);
  };

  const handleReorderNotes = (reorderedNotes: Note[]) => {
    setNotes(reorderedNotes);
    saveNotesStorage(reorderedNotes);
  };

  if (loading) {
    return (
      <View style={styles.loadingContainer}>
        <ActivityIndicator size="large" color={COLORS.primary} />
      </View>
    );
  }

  const completedTasksCount = tasks.filter((t) => t.completed).length;

  return (
    <SafeAreaProvider>
      <StatusBar style={profile.darkMode ? 'light' : 'dark'} />
      <NavigationContainer>
        <Tab.Navigator
          screenOptions={({ route }) => ({
            headerShown: false,
            tabBarActiveTintColor: COLORS.primary,
            tabBarInactiveTintColor: COLORS.textSecondary,
            tabBarStyle: {
              backgroundColor: COLORS.surface,
              borderTopColor: COLORS.border,
              height: 60,
              paddingBottom: 8,
              paddingTop: 6,
            },
            tabBarLabelStyle: {
              fontSize: 11,
              fontWeight: '600',
            },
            tabBarIcon: ({ color, size }) => {
              let iconName: keyof typeof Ionicons.glyphMap = 'checkmark-circle-outline';
              if (route.name === 'Tasks') {
                iconName = 'checkbox-outline';
              } else if (route.name === 'Notes') {
                iconName = 'journal-outline';
              } else if (route.name === 'Brain Dump') {
                iconName = 'bulb-outline';
              }
              return <Ionicons name={iconName} size={size} color={color} />;
            },
          })}
        >
          <Tab.Screen name="Tasks">
            {() => (
              <FocusTasksScreen
                tasks={tasks}
                onAddTask={handleAddTask}
                onUpdateTask={handleUpdateTask}
                onDeleteTask={handleDeleteTask}
                onOpenProfile={() => setIsProfileOpen(true)}
                avatarEmoji={profile.avatarEmoji}
              />
            )}
          </Tab.Screen>

          <Tab.Screen name="Notes">
            {() => (
              <NotesScreen
                notes={notes}
                onAddNote={handleAddNote}
                onUpdateNote={handleUpdateNote}
                onDeleteNote={handleDeleteNote}
                onReorderNotes={handleReorderNotes}
                onOpenProfile={() => setIsProfileOpen(true)}
                avatarEmoji={profile.avatarEmoji}
              />
            )}
          </Tab.Screen>

          <Tab.Screen name="Brain Dump">
            {() => (
              <BrainDumpScreen
                items={brainDumpItems}
                onAddDumpItem={handleAddBrainDumpItem}
                onDeleteDumpItem={handleDeleteBrainDumpItem}
                onConvertToTask={handleAddTask}
                onConvertToNote={handleAddNote}
                onOpenProfile={() => setIsProfileOpen(true)}
                avatarEmoji={profile.avatarEmoji}
              />
            )}
          </Tab.Screen>
        </Tab.Navigator>

        {/* Global Profile & Settings Modal */}
        <ProfileModal
          visible={isProfileOpen}
          onClose={() => setIsProfileOpen(false)}
          tasksCount={tasks.length}
          completedTasksCount={completedTasksCount}
          notesCount={notes.length}
          brainDumpCount={brainDumpItems.length}
          profile={profile}
          onUpdateProfile={handleUpdateProfile}
          onClearAllData={handleClearAllData}
        />
      </NavigationContainer>
    </SafeAreaProvider>
  );
}

const styles = StyleSheet.create({
  loadingContainer: {
    flex: 1,
    backgroundColor: COLORS.background,
    alignItems: 'center',
    justifyContent: 'center',
  },
});
