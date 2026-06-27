import { customFetch } from "./lib/api";
import React, { useState, useEffect, useRef } from "react";
import { AlertTriangle, Key, X, Info, Check, Trophy, Trash2, RefreshCw, Sparkles } from "lucide-react";
import Navbar from "./components/Navbar";
import DashboardView from "./components/DashboardView";
import ScheduleView from "./components/ScheduleView";
import HabitsView from "./components/HabitsView";
import FocusView from "./components/FocusView";
import SettingsView from "./components/SettingsView";
import ProfileView from "./components/ProfileView";
import { VoiceAssistant } from "./components/VoiceAssistant";
import { Task, Habit, FocusSession } from "./types";
import { auth, db } from "./lib/firebase";
import { signInAnonymously, onAuthStateChanged } from "firebase/auth";
import { collection, doc, setDoc, getDocs, onSnapshot, query, where } from "firebase/firestore";
import { playTimerEndSound, playClickSound, playSuccessSound } from "./lib/audio";

const DEFAULT_HABITS: Habit[] = [
  { id: "1", name: "Study for 1 hour", icon: "BookOpen", streak: 3, days: [1, 0, 1, 1, 0, 0, 0] },
  { id: "2", name: "Exercise 30 mins", icon: "Heart", streak: 5, days: [1, 1, 1, 1, 1, 0, 0] },
  { id: "3", name: "Drink 8 glasses of water", icon: "GlassWater", streak: 2, days: [0, 1, 0, 1, 1, 0, 0] },
  { id: "4", name: "Sleep by 11:00 PM", icon: "Moon", streak: 7, days: [1, 1, 1, 1, 1, 1, 1] },
];

export default function App() {
  const [activeTab, setActiveTab] = useState<string>("dashboard");
  const [userId, setUserId] = useState<string | null>(null);

  // Core local states
  const [tasks, setTasks] = useState<Task[]>([]);
  const [habits, setHabits] = useState<Habit[]>([]);
  const [focusSessions, setFocusSessions] = useState<FocusSession[]>([]);

  // Global Timer State
  const [timeLeft, setTimeLeft] = useState(25 * 60);
  const [totalTime, setTotalTime] = useState(25 * 60);
  const [isRunning, setIsRunning] = useState(false);
  const [timerMode, setTimerMode] = useState<string>("Focus Session");
  const [selectedTaskId, setSelectedTaskId] = useState<string>("");

  // Health / Connection State
  const [isAiConnected, setIsAiConnected] = useState(false);
  const [apiError, setApiError] = useState<string | null>(null);
  const [showApiBanner, setShowApiBanner] = useState(false);

  // Toast State
  const [toast, setToast] = useState<{ show: boolean; icon: string; message: string } | null>(null);

  useEffect(() => {
    // Authenticate user anonymously
    const unsubscribe = onAuthStateChanged(auth, (user) => {
      if (user) {
        setUserId(user.uid);
      } else {
        signInAnonymously(auth).catch((error) => {
          let localId = localStorage.getItem("local_fallback_uid");
          if (!localId) {
            localId = "user_" + Math.random().toString(36).substring(2, 15);
            localStorage.setItem("local_fallback_uid", localId);
          }
          setUserId(localId);
        });
      }
    });
    return unsubscribe;
  }, []);

  useEffect(() => {
    if (!userId) return;

    // Load state from Firestore on mount and subscribe to changes
    const qTasks = query(collection(db, "tasks"), where("userId", "==", userId));
    const unsubTasks = onSnapshot(qTasks, (snapshot) => {
      const fetchedTasks = snapshot.docs.map(doc => ({ ...doc.data(), id: doc.id } as any));
      setTasks(fetchedTasks);
    }, (error) => console.error("Firestore tasks error:", error));

    const qHabits = query(collection(db, "habits"), where("userId", "==", userId));
    const unsubHabits = onSnapshot(qHabits, (snapshot) => {
      if (snapshot.empty) {
        setHabits(DEFAULT_HABITS);
        DEFAULT_HABITS.forEach(habit => {
          const data: any = { ...habit, userId };
          import("firebase/firestore").then(({ setDoc, doc }) => {
            setDoc(doc(db, "habits", String(habit.id)), data, { merge: true }).catch(console.error);
          });
        });
      } else {
        const fetchedHabits = snapshot.docs.map(doc => ({ ...doc.data(), id: doc.id } as any));
        setHabits(fetchedHabits);
      }
    }, (error) => console.error("Firestore habits error:", error));

    const qSessions = query(collection(db, "focusSessions"), where("userId", "==", userId));
    const unsubSessions = onSnapshot(qSessions, (snapshot) => {
      const fetchedSessions = snapshot.docs.map(doc => ({ ...doc.data(), id: doc.id } as any));
      setFocusSessions(fetchedSessions);
    }, (error) => console.error("Firestore sessions error:", error));

    // Check backend API connection
    checkApiConnection();

    // Request Notification Permission
    if ("Notification" in window && Notification.permission === "default") {
      Notification.requestPermission();
    }

    return () => {
      unsubTasks();
      unsubHabits();
      unsubSessions();
    };
  }, [userId]);

  // Hook to persist to Firestore when tasks state changes locally from subcomponents
  // Actually, since subcomponents use setTasks, and if we intercept it, it might conflict with onSnapshot.
  // Instead of modifying every child component, we will keep setTasks updating local state,
  // and we'll sync local state to Firestore by wrapping setTasks, or we will pass a custom setter.
  // A cleaner way for an MVP refactor without changing all children:
  
  const handleTimerComplete = () => {
    playTimerEndSound();
    
    if (timerMode === "Focus Session") {
      const selectedTask = tasks.find((t) => t.id.toString() === selectedTaskId);
      const sessionName = selectedTask ? selectedTask.name : (selectedTaskId || "General Focus Session");
      const completedMinutes = Math.round(totalTime / 60);

      const newSession: any = {
        id: Date.now().toString(),
        userId: userId || "",
        taskId: selectedTask ? selectedTaskId : undefined,
        taskName: sessionName,
        duration: completedMinutes,
        completedAt: new Date().toISOString(),
      };

      setFocusSessions((prev) => [newSession, ...prev]);
      
      if (userId) {
        const data = { ...newSession };
        Object.keys(data).forEach(key => data[key] === undefined && delete data[key]);
        setDoc(doc(db, "focusSessions", String(newSession.id)), data, { merge: true }).catch(console.error);
      }
      
      showToast("Trophy", `Completed ${completedMinutes}m focus session!`);
    } else {
      showToast("Check", `${timerMode} complete! Back to work.`);
    }
  };

  const targetEndTimeRef = useRef<number | null>(null);

  useEffect(() => {
    let interval: NodeJS.Timeout;
    if (isRunning) {
      if (!targetEndTimeRef.current) {
        targetEndTimeRef.current = Date.now() + timeLeft * 1000;
      }

      interval = setInterval(() => {
        if (!targetEndTimeRef.current) return;
        const remaining = Math.max(0, Math.floor((targetEndTimeRef.current - Date.now()) / 1000));
        
        if (remaining <= 0) {
          setIsRunning(false);
          targetEndTimeRef.current = null;
          handleTimerComplete();
          setTimeLeft(0);
        } else {
          setTimeLeft(remaining);
        }
      }, 1000);
    } else {
      targetEndTimeRef.current = null;
    }
    return () => clearInterval(interval);
  }, [isRunning, timerMode, selectedTaskId, totalTime, tasks, userId]);

  const handleSetTasks = (action: React.SetStateAction<Task[]>) => {
    setTasks(prev => {
      const newTasks = typeof action === 'function' ? action(prev) : action;
      // Sync to Firestore
      if (userId) {
        // Find deleted tasks and delete them from Firestore
        const prevIds = new Set<string>(prev.map(t => String(t.id)));
        const newIds = new Set<string>(newTasks.map(t => String(t.id)));
        prevIds.forEach((id: string) => {
          if (!newIds.has(id)) {
            import("firebase/firestore").then(({ deleteDoc, doc }) => {
              deleteDoc(doc(db, "tasks", id)).catch(console.error);
            });
          }
        });
        
        newTasks.forEach(task => {
          const data: any = { ...task, userId };
          Object.keys(data).forEach(key => data[key] === undefined && delete data[key]);
          setDoc(doc(db, "tasks", String(task.id)), data, { merge: true }).catch(console.error);
        });
      }
      localStorage.removeItem("lifesaver_schedule");
      return newTasks;
    });
  };

  const handleSetHabits = (action: React.SetStateAction<Habit[]>) => {
    setHabits(prev => {
      const newHabits = typeof action === 'function' ? action(prev) : action;
      if (userId) {
        // Find deleted habits and delete them from Firestore
        const prevIds = new Set<string>(prev.map(h => String(h.id)));
        const newIds = new Set<string>(newHabits.map(h => String(h.id)));
        prevIds.forEach((id: string) => {
          if (!newIds.has(id)) {
            import("firebase/firestore").then(({ deleteDoc, doc }) => {
              deleteDoc(doc(db, "habits", id)).catch(console.error);
            });
          }
        });
        
        newHabits.forEach(habit => {
          const data: any = { ...habit, userId };
          Object.keys(data).forEach(key => data[key] === undefined && delete data[key]);
          setDoc(doc(db, "habits", String(habit.id)), data, { merge: true }).catch(console.error);
        });
      }
      return newHabits;
    });
  };

  // Background Notification Worker
  useEffect(() => {
    const interval = setInterval(() => {
      const now = new Date();
      tasks.forEach((task) => {
        if (!task.completed && task.deadline) {
          const deadlineDate = new Date(task.deadline);
          const diffMs = deadlineDate.getTime() - now.getTime();
          const diffMins = Math.floor(diffMs / (1000 * 60));

          if (diffMins > 0 && diffMins <= 60) {
            const key = `notified_1h_${task.id}`;
            const hasNotified = localStorage.getItem(key);
            if (!hasNotified) {
              if ("Notification" in window && Notification.permission === "granted") {
                new Notification(`Deadline approaching: ${task.name}`, { body: "This task is due in less than 1 hour." });
              }
              localStorage.setItem(key, "true");
            }
          }
          
          if (diffMins > 0 && diffMins <= 24 * 60) {
            const key = `notified_24h_${task.id}`;
            const hasNotified = localStorage.getItem(key);
            if (!hasNotified) {
              if ("Notification" in window && Notification.permission === "granted") {
                new Notification(`Due tomorrow: ${task.name}`, { body: "This task is due in less than 24 hours." });
              }
              localStorage.setItem(key, "true");
            }
          }
          if (diffMins > 0 && diffMins <= 15) {
            const key15 = `notified_15m_${task.id}`;
            const hasNotified15 = localStorage.getItem(key15);
            if (!hasNotified15) {
              if ("Notification" in window && Notification.permission === "granted") {
                new Notification(`URGENT: ${task.name}`, { body: "Due in less than 15 minutes! Please focus." });
              }
              speakAlert(`Reminder: Your task, ${task.name}, is due in less than 15 minutes. Please complete it.`);
              localStorage.setItem(key15, "true");
            }
          }
          // Overdue
          if (diffMins <= 0 && diffMins >= -5) {
            // only notify once when it hits overdue within a 5 min window
            const overdueKey = `notified_overdue_${task.id}`;
            if (!localStorage.getItem(overdueKey)) {
              if ("Notification" in window && Notification.permission === "granted") {
                new Notification(`OVERDUE: ${task.name}`, { body: "You missed the deadline!" });
              }
              speakAlert(`Alert: Your task, ${task.name}, is now overdue and not completed. Please check your dashboard.`);
              localStorage.setItem(overdueKey, "true");
            }
          }
        }
      });
    }, 30 * 1000); // Check every 30 seconds

    return () => clearInterval(interval);
  }, [tasks]);

  const speakAlert = (message: string) => {
    if ("speechSynthesis" in window) {
      const utterance = new SpeechSynthesisUtterance(message);
      utterance.rate = 0.9; // Slightly slower, clearer voice
      window.speechSynthesis.speak(utterance);
    }
  };

  const checkApiConnection = async () => {
    try {
      const response = await customFetch("/api/health");
      if (response.ok) {
        setIsAiConnected(true);
        setApiError(null);
        setShowApiBanner(false);
      } else {
        throw new Error("API responded with an error");
      }
    } catch (err) {
      console.warn("Express backend API offline or key missing:", err);
      setIsAiConnected(false);
      setApiError("Your Gemini API key might not be set or the backend server is launching. Connect your key via Settings > Secrets.");
      setShowApiBanner(true);
    }
  };

  // Toast Trigger Helper
  const showToast = (iconName: string, message: string) => {
    setToast({ show: true, icon: iconName, message });
    setTimeout(() => {
      setToast(null);
    }, 3500);
  };

  return (
    <div className="min-h-screen text-[var(--color-brand-dark)] flex flex-col min-[481px]:flex-row font-sans selection:bg-[var(--color-brand-primary)] selection:text-white">
      {/* Navbar component (Sidebar on desktop, Topbar on mobile) */}
      <Navbar activeTab={activeTab} setActiveTab={setActiveTab} isAiConnected={isAiConnected} />

      <div className="flex-1 flex flex-col min-w-0 h-screen overflow-y-auto overflow-x-hidden pr-0 lg:pr-4">
        {/* Floating Warnings / Instructions Alert Banner */}
        {showApiBanner && (
          <div className="bg-[var(--color-brand-cream)] border-b border-[#ede5d0] px-6 py-3.5 flex items-center justify-between gap-4 text-xs md:text-sm text-[var(--color-brand-dark)] transition-all duration-300">
            <div className="flex items-center gap-2.5 max-w-4xl">
              <AlertTriangle className="text-[var(--color-brand-primary)] flex-shrink-0 animate-bounce" size={18} />
              <span className="leading-relaxed">
                <strong>Local Fallback Active:</strong> {apiError}{" "}
                <span className="hidden md:inline">The application remains fully functional offline using smart pre-baked layouts and prompts.</span>
              </span>
            </div>
            <button
              onClick={() => setShowApiBanner(false)}
              className="p-1.5 hover:bg-black/5 text-[var(--color-brand-dark)] rounded-[14px] transition-colors cursor-pointer"
            >
              <X size={15} />
            </button>
          </div>
        )}

        {/* Application Content wrapper */}
        <main className="flex-1 max-w-7xl w-full mx-auto px-4 sm:px-6 md:px-12 py-6 md:py-10 overflow-x-hidden">
          {activeTab === "dashboard" && (
            <DashboardView
            tasks={tasks}
            setTasks={handleSetTasks}
            focusSessions={focusSessions}
            showToast={showToast}
            apiError={apiError}
          />
        )}

        {activeTab === "schedule" && (
          <ScheduleView
            tasks={tasks}
            setTasks={handleSetTasks}
            showToast={showToast}
          />
        )}

        {activeTab === "habits" && (
          <HabitsView
            habits={habits}
            setHabits={handleSetHabits}
            showToast={showToast}
          />
        )}

        {activeTab === "focus" && (
          <FocusView
            tasks={tasks}
            focusSessions={focusSessions}
            showToast={showToast}
            timeLeft={timeLeft}
            setTimeLeft={setTimeLeft}
            totalTime={totalTime}
            setTotalTime={setTotalTime}
            isRunning={isRunning}
            setIsRunning={setIsRunning}
            timerMode={timerMode}
            setTimerMode={setTimerMode}
            selectedTaskId={selectedTaskId}
            setSelectedTaskId={setSelectedTaskId}
          />
        )}

        {activeTab === "settings" && (
          <SettingsView
            showToast={showToast}
            checkApiConnection={checkApiConnection}
          />
        )}

        {activeTab === "profile" && (
          <ProfileView showToast={showToast} />
        )}
      </main>

      <VoiceAssistant tasks={tasks} />

      {/* Toast Notification Container */}
      {toast && (
        <div className="fixed bottom-24 md:bottom-8 left-4 right-4 md:left-auto md:right-8 bg-[var(--color-brand-dark)] text-white px-6 py-4 rounded-[10px] border border-[var(--color-brand-dark)] text-[12px] font-bold uppercase tracking-widest shadow-xl flex items-center gap-4 z-50 transition-all transform animate-slideIn">
          <div className="text-white">
            {toast.icon === "Trophy" && <Trophy size={16} />}
            {toast.icon === "Check" && <Check size={16} />}
            {toast.icon === "CheckCircle" && <Check size={16} />}
            {toast.icon === "Trash2" && <Trash2 size={16} />}
            {toast.icon === "RefreshCw" && <RefreshCw size={16} className="animate-spin" />}
            {toast.icon === "Sparkles" && <Sparkles size={16} />}
            {toast.icon === "AlertCircle" && <AlertTriangle size={16} />}
            {toast.icon === "AlertTriangle" && <AlertTriangle size={16} />}
          </div>
          <span className="leading-snug">{toast.message}</span>
        </div>
      )}
      </div>
    </div>
  );
}
