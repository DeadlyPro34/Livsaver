import { getPrioritizedTask, getBurnoutScore, getProcrastinationReason, getWeeklyDebrief, getChatReply } from "../lib/vertex";
import React, { useState, useEffect, useRef } from "react";
import { motion, AnimatePresence } from "motion/react";
import { getTranslation, getDailyQuote } from "../lib/i18n";
import { useLanguage } from "../lib/LanguageContext";
import { playClickSound, playSuccessSound } from "../lib/audio";
import { PieChart, Pie, Cell, Tooltip, ResponsiveContainer, BarChart, Bar, XAxis, YAxis, CartesianGrid } from "recharts";
import {
  Plus,
  Sparkles,
  Trash2,
  RefreshCw,
  Bot,
  Send,
  Calendar,
  Clock,
  Briefcase,
  BookOpen,
  Home,
  Heart,
  Coins,
  Compass,
  AlertTriangle,
  ArrowUpCircle,
  MinusCircle,
  CheckCircle,
  ChevronRight,
  AlertCircle,
  HelpCircle,
  Brain,
  Rocket,
  Check,
  CheckSquare,
  Square,
  Trophy,
  X,
  Pencil
} from "lucide-react";
import { Task, ChatMessage, FocusSession, Habit } from "../types";

interface DashboardViewProps {
  tasks: Task[];
  setTasks: React.Dispatch<React.SetStateAction<Task[]>>;
  focusSessions: FocusSession[];
  showToast: (iconName: string, message: string) => void;
  awardPoints: (points: number) => void;
  habits: Habit[];
  chatMessages: ChatMessage[];
  setChatMessages: React.Dispatch<React.SetStateAction<ChatMessage[]>>;
}

const CAT_ICONS: Record<string, React.ReactNode> = {
  work: <Briefcase size={14} />,
  study: <BookOpen size={14} />,
  personal: <Home size={14} />,
  health: <Heart size={14} />,
  finance: <Coins size={14} />,
  other: <Compass size={14} />,
};

const PRIORITY_LABELS: Record<string, string> = {
  critical: "Critical",
  high: "High",
  medium: "Medium",
  low: "Low",
};

export default function DashboardView({
  tasks,
  setTasks,
  focusSessions,
  showToast,
  awardPoints,
  habits,
  chatMessages,
  setChatMessages,
}: DashboardViewProps) {
  const { language } = useLanguage();
  
  // Add Task Form State
  const [showAddForm, setShowAddForm] = useState(false);
  const [taskName, setTaskName] = useState("");
  const [taskDeadline, setTaskDeadline] = useState("");
  const [taskCategory, setTaskCategory] = useState<Task["category"]>("work");
  const [taskEstimatedTime, setTaskEstimatedTime] = useState("1 hour");
  const [taskPriority, setTaskPriority] = useState<"auto" | Task["priority"]>("auto");
  const [taskNotes, setTaskNotes] = useState("");
  const [taskBlockedBy, setTaskBlockedBy] = useState<string[]>([]);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [editingTaskId, setEditingTaskId] = useState<string | null>(null);

  // Filters State
  const [categoryFilter, setCategoryFilter] = useState<string>("all");
  const [priorityFilter, setPriorityFilter] = useState<string>("all");
  const [searchQuery, setSearchQuery] = useState("");

  // Burnout Score State
  const [burnoutScore, setBurnoutScore] = useState<number | null>(null);
  const [burnoutRecommendation, setBurnoutRecommendation] = useState<string | null>(null);
  const [isBurnoutLoading, setIsBurnoutLoading] = useState(false);

  // Weekly Debrief State
  const [showDebriefModal, setShowDebriefModal] = useState(false);
  const [debriefData, setDebriefData] = useState<{ text: string, suggestions: string[] } | null>(null);
  const [isDebriefLoading, setIsDebriefLoading] = useState(false);

  // Procrastination State
  const [showProcrastinationModal, setShowProcrastinationModal] = useState<{show: boolean, taskName?: string, reason?: string}>({show: false});
  const [isProcrastinationLoading, setIsProcrastinationLoading] = useState<string | null>(null);

  // Chat State
  const [chatInput, setChatInput] = useState("");
  const [isChatLoading, setIsChatLoading] = useState(false);

  const chatEndRef = useRef<HTMLDivElement>(null);

  // Drag to scroll for filters
  const scrollContainerRef = useRef<HTMLDivElement>(null);
  const [isDraggingFilter, setIsDraggingFilter] = useState(false);
  const [startX, setStartX] = useState(0);
  const [scrollLeft, setScrollLeft] = useState(0);

  const handleMouseDownFilter = (e: React.MouseEvent) => {
    if (!scrollContainerRef.current) return;
    setIsDraggingFilter(true);
    setStartX(e.pageX - scrollContainerRef.current.offsetLeft);
    setScrollLeft(scrollContainerRef.current.scrollLeft);
  };
  const handleMouseLeaveFilter = () => setIsDraggingFilter(false);
  const handleMouseUpFilter = () => setIsDraggingFilter(false);
  const handleMouseMoveFilter = (e: React.MouseEvent) => {
    if (!isDraggingFilter || !scrollContainerRef.current) return;
    e.preventDefault();
    const x = e.pageX - scrollContainerRef.current.offsetLeft;
    const walk = (x - startX) * 2; 
    scrollContainerRef.current.scrollLeft = scrollLeft - walk;
  };

  // Set default deadline to 24h from now on mount
  useEffect(() => {
    const tomorrow = new Date();
    tomorrow.setHours(tomorrow.getHours() + 24);
    setTaskDeadline(tomorrow.toISOString().slice(0, 16));
  }, []);

  // Scroll chat to bottom safely without scrolling the page
  useEffect(() => {
    const chatContainer = document.getElementById("chat-messages-container");
    if (chatContainer) {
      chatContainer.scrollTop = chatContainer.scrollHeight;
    }
  }, [chatMessages, isChatLoading]);

  // Form toggle helper
  const toggleAddForm = () => {
    if (showAddForm) {
      setEditingTaskId(null);
      setTaskName("");
      setTaskNotes("");
      setTaskBlockedBy([]);
      const tomorrow = new Date();
      tomorrow.setHours(tomorrow.getHours() + 24);
      setTaskDeadline(tomorrow.toISOString().slice(0, 16));
    }
    setShowAddForm(!showAddForm);
  };

  // Helper to format remaining deadline time
  const getDeadlineStatus = (deadlineStr: string) => {
    const diff = new Date(deadlineStr).getTime() - Date.now();
    const hours = diff / (1000 * 3600);
    if (diff < 0) {
      return { label: "Overdue", cls: "text-[var(--color-brand-dark)] font-bold uppercase tracking-widest text-[10px] bg-[var(--color-brand-dark)]/10 px-2 py-0.5 rounded" };
    }
    if (hours < 6) {
      return { label: `${Math.round(hours)}h left — urgent`, cls: "text-[var(--color-brand-dark)] font-medium uppercase tracking-wider text-[10px] bg-[var(--color-brand-dark)]/10 px-2 py-0.5 rounded animate-pulse" };
    }
    if (hours < 24) {
      return { label: `${Math.round(hours)}h left`, cls: "text-[var(--color-brand-dark)]/80 font-medium bg-[var(--color-brand-dark)]/5 px-2 py-0.5 rounded" };
    }
    const days = Math.floor(hours / 24);
    return { label: `${days}d left`, cls: "text-[var(--color-brand-dark)]/60 font-normal" };
  };

  // Call API to prioritize a task
  const prioritizeTaskWithAi = async (taskToPrioritize: Task) => {
    try {
      const otherTasksStr = tasks
        .filter((t) => t.id !== taskToPrioritize.id && !t.completed)
        .map((t) => `"${t.name}" (${t.priority} priority, deadline ${t.deadline})`)
        .join(", ");

      const data = await getPrioritizedTask(taskToPrioritize, otherTasksStr);

      setTasks((prev) =>
        prev.map((t) =>
          t.id === taskToPrioritize.id
            ? {
                ...t,
                priority: data.priority || t.priority,
                aiNote: data.aiNote || t.aiNote,
                suggestedStart: data.suggestedStart || t.suggestedStart,
              }
            : t
        )
      );
      showToast("Sparkles", `AI prioritized: "${taskToPrioritize.name}"`);
    } catch (err: any) {
      console.error(err);
      showToast("AlertTriangle", "AI prioritization offline. Used default settings.");
    }
  };

  // Fetch Burnout Score
  const fetchBurnoutScore = async () => {
    setIsBurnoutLoading(true);
    try {
      const data = await getBurnoutScore(tasks, focusSessions, habits);
      setBurnoutScore(data.score);
      setBurnoutRecommendation(data.recommendation);
    } catch (e) {
      console.error(e);
    } finally {
      setIsBurnoutLoading(false);
    }
  };

  // Generate Weekly Debrief
  const handleWeeklyDebrief = async () => {
    setShowDebriefModal(true);
    setIsDebriefLoading(true);
    try {
      const data = await getWeeklyDebrief(tasks, habits);
      setDebriefData({ text: data.debriefText, suggestions: data.suggestions });
    } catch(e) {
      setDebriefData({ text: "Failed to generate debrief. Try again later.", suggestions: [] });
    } finally {
      setIsDebriefLoading(false);
    }
  };

  // Get Procrastination Reason
  const handleProcrastinationAnalysis = async (task: Task) => {
    setIsProcrastinationLoading(task.id);
    try {
      const data = await getProcrastinationReason(task);
      setShowProcrastinationModal({ show: true, taskName: task.name, reason: data.reasoning });
    } catch(e) {
      console.error(e);
      showToast("AlertCircle", "Failed to analyze procrastination");
    } finally {
      setIsProcrastinationLoading(null);
    }
  };

  const hasFetchedBurnout = useRef(false);
  useEffect(() => {
    if (tasks.length > 0 && !hasFetchedBurnout.current) {
      fetchBurnoutScore();
      hasFetchedBurnout.current = true;
    }
  }, [tasks]);

  // Add Task Handler
  const handleAddTask = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!taskName.trim()) {
      showToast("AlertCircle", "Please enter a task name");
      return;
    }
    if (!taskDeadline) {
      showToast("AlertCircle", "Please set a deadline");
      return;
    }

    setIsSubmitting(true);

    const manualPriority = taskPriority === "auto" ? "medium" : taskPriority;

    if (editingTaskId) {
      let targetTask: Task | undefined;
      const updatedTasks = tasks.map(t => {
        if (t.id === editingTaskId) {
          let updatedMissedCount = t.missedDeadlineCount || 0;
          let updatedLastMissedDate = t.lastMissedDate;
          const todayStr = new Date().toISOString().split('T')[0];
          
          if (new Date(taskDeadline).getTime() > new Date(t.deadline).getTime()) {
            if (t.lastMissedDate !== todayStr) {
              updatedMissedCount += 1;
              updatedLastMissedDate = todayStr;
            }
          }
          const updated = {
            ...t,
            name: taskName.trim(),
            deadline: taskDeadline,
            category: taskCategory,
            estimatedTime: taskEstimatedTime,
            priority: manualPriority,
            notes: taskNotes.trim() || undefined,
            missedDeadlineCount: updatedMissedCount,
            lastMissedDate: updatedLastMissedDate,
            blockedBy: taskBlockedBy,
            // Preserve existing AI notes unless AI will re-prioritize this edit
            aiNote: taskPriority === "auto" ? undefined : t.aiNote,
            suggestedStart: taskPriority === "auto" ? undefined : t.suggestedStart,
          };
          targetTask = updated;
          return updated;
        }
        return t;
      });
      
      setTasks(updatedTasks);
      setTaskName("");
      setTaskNotes("");
      setTaskBlockedBy([]);
      setShowAddForm(false);
      setEditingTaskId(null);
      setIsSubmitting(false);
      showToast("CheckCircle", "Task updated successfully");

      if (taskPriority === "auto" && targetTask) {
        await prioritizeTaskWithAi(targetTask);
      }
      return;
    }

    const newTask: Task = {
      id: Date.now().toString(),
      name: taskName.trim(),
      deadline: taskDeadline,
      category: taskCategory,
      estimatedTime: taskEstimatedTime,
      priority: manualPriority,
      notes: taskNotes.trim() || undefined,
      completed: false,
      addedAt: new Date().toISOString(),
      missedDeadlineCount: 0,
      blockedBy: taskBlockedBy,
    };

    // Add to state immediately
    const updatedTasks = [newTask, ...tasks];
    setTasks(updatedTasks);
    // Reset Form fully
    setTaskName("");
    setTaskNotes("");
    setTaskBlockedBy([]);
    setTaskCategory("work");
    setTaskPriority("auto");
    setTaskEstimatedTime("1 hour");
    const tomorrow = new Date();
    tomorrow.setHours(tomorrow.getHours() + 24);
    setTaskDeadline(tomorrow.toISOString().slice(0, 16));
    setShowAddForm(false);
    setIsSubmitting(false);
    showToast("CheckCircle", "Task added successfully");

    // If auto priority selected, prioritize with AI
    if (taskPriority === "auto") {
      await prioritizeTaskWithAi(newTask);
    }
  };

  // Re-prioritize all tasks with AI
  const prioritizeAllWithAi = async () => {
    const pendingTasks = tasks.filter((t) => !t.completed);
    if (pendingTasks.length === 0) {
      showToast("AlertCircle", "No pending tasks to prioritize.");
      return;
    }

    showToast("RefreshCw", `Re-prioritizing ${pendingTasks.length} tasks...`);
    for (const task of pendingTasks) {
      await prioritizeTaskWithAi(task);
    }
  };

  // Delete Task Handler
  const handleDeleteTask = (id: number | string) => {
    playClickSound();
    const strId = String(id);
    // Remove stale blockedBy references from other tasks
    const updated = tasks
      .filter((t) => String(t.id) !== strId)
      .map((t) => ({
        ...t,
        blockedBy: t.blockedBy ? t.blockedBy.filter((bid) => bid !== strId) : [],
      }));
    setTasks(updated);
    // Clean up all notification keys for this task
    ["notified_1h_", "notified_24h_", "notified_15m_", "notified_overdue_"].forEach((prefix) =>
      localStorage.removeItem(`${prefix}${strId}`)
    );
    showToast("Trash2", "Task removed");
  };

  // Edit Task Handler
  const handleEditClick = (task: Task) => {
    playClickSound();
    setTaskName(task.name);
    
    let formattedDeadline = task.deadline;
    try {
       const d = new Date(task.deadline);
       if (!isNaN(d.getTime())) {
          const pad = (n: number) => n.toString().padStart(2, '0');
          formattedDeadline = `${d.getFullYear()}-${pad(d.getMonth()+1)}-${pad(d.getDate())}T${pad(d.getHours())}:${pad(d.getMinutes())}`;
       }
    } catch(e) {}
    
    setTaskDeadline(formattedDeadline);
    setTaskCategory(task.category || "work");
    setTaskEstimatedTime(task.estimatedTime || "1 hour");
    setTaskPriority(task.priority || "auto");
    setTaskNotes(task.notes || "");
    setTaskBlockedBy(task.blockedBy || []);
    setEditingTaskId(task.id);
    setShowAddForm(true);
    setTimeout(() => {
      document.getElementById("add-task-card")?.scrollIntoView({ behavior: "smooth", block: "center" });
    }, 100);
  };

  // Toggle Complete Handler
  const handleToggleComplete = (id: number | string) => {
    const updated = tasks.map((t) => {
      if (String(t.id) === String(id)) {
        const nextState = !t.completed;
        if (nextState) {
          playSuccessSound();
          showToast("Trophy", "Awesome job completing this task! +10 Points");
          awardPoints(10);
        } else {
          playClickSound();
        }
        return { ...t, completed: nextState };
      }
      return t;
    });
    setTasks(updated);
  };

  const toggleSubtask = (taskId: number | string, subIndex: number) => {
    setTasks(prev =>
      prev.map(t => {
        if (String(t.id) !== String(taskId) || !t.subtasks) return t;
        const updated = t.subtasks.map((s, i) =>
          i === subIndex ? { ...s, completed: !s.completed } : s
        );
        return { ...t, subtasks: updated };
      })
    );
  };

  // AI Chat Handler
  const handleSendChat = async (textToSend?: string) => {
    const messageText = textToSend || chatInput;
    if (!messageText.trim()) return;

    const userMsg: ChatMessage = {
      id: Date.now().toString(),
      role: "user",
      text: messageText,
      timestamp: new Date().toISOString(),
    };

    setChatMessages((prev) => [...prev, userMsg]);
    if (!textToSend) setChatInput("");
    setIsChatLoading(true);

    try {
      const pendingTasksContext = tasks
        .filter((t) => !t.completed)
        .map((t) => `- "${t.name}" | Priority: ${t.priority} | Category: ${t.category} | Deadline: ${t.deadline}`)
        .join("\n");

      const data = await getChatReply(messageText, chatMessages, pendingTasksContext || "No pending tasks left.");
      const aiReply: ChatMessage = {
        id: (Date.now() + 1).toString(),
        role: "ai",
        text: data.reply || "I am processing your requests now.",
        timestamp: new Date().toISOString(),
      };
      setChatMessages((prev) => [...prev, aiReply]);
    } catch (err) {
      console.error(err);
      const offlineReply: ChatMessage = {
        id: (Date.now() + 1).toString(),
        role: "ai",
        text: "My AI circuits are currently having trouble communicating. Connect a valid Gemini API key in the panel or verify backend credentials to unlock full chat responses!",
        timestamp: new Date().toISOString(),
      };
      setChatMessages((prev) => [...prev, offlineReply]);
    } finally {
      setIsChatLoading(false);
    }
  };

  // Calculations for new cards
  const urgentTodayCount = tasks.filter(t => !t.completed && (new Date(t.deadline).getTime() - Date.now() < 24 * 3600 * 1000)).length;
  const highRiskCount = tasks.filter(t => !t.completed && (t.riskScore && t.riskScore > 70)).length;
  const totalCompleted = tasks.filter(t => t.completed).length;
  const completionRate = tasks.length > 0 ? Math.round((totalCompleted / tasks.length) * 100) : 0;
  
  const parseTime = (timeStr: string) => {
    if (timeStr.includes("15")) return 0.25;
    if (timeStr.includes("30")) return 0.5;
    if (timeStr.includes("2")) return 2;
    if (timeStr.includes("4")) return 4;
    if (timeStr.includes("Full day")) return 8;
    return 1;
  };
  const totalTimeReq = tasks.filter(t => !t.completed).reduce((acc, t) => acc + parseTime(t.estimatedTime), 0);
  
  const emergencyTasks = tasks.filter(t => !t.completed && (new Date(t.deadline).getTime() - Date.now() < 12 * 3600 * 1000));
  const emergencyMode = emergencyTasks.length > 0;

  // Priority filters mapping counts
  const totalPending = tasks.filter((t) => !t.completed).length;
  const criticalCount = tasks.filter((t) => t.priority === "critical" && !t.completed).length;
  const highCount = tasks.filter((t) => t.priority === "high" && !t.completed).length;
  const mediumCount = tasks.filter((t) => t.priority === "medium" && !t.completed).length;
  const lowCount = tasks.filter((t) => t.priority === "low" && !t.completed).length;

  // Focus chart data prep
  const getFocusChartData = () => {
    const dataMap: Record<string, number> = {};
    const now = new Date();
    // Initialize last 7 days
    for (let i = 6; i >= 0; i--) {
      const d = new Date(now);
      d.setDate(d.getDate() - i);
      const key = d.toLocaleDateString('en-US', { weekday: 'short' });
      dataMap[key] = 0;
    }
    
    focusSessions.forEach(session => {
      if (!session.completedAt) return;
      const sessionDate = new Date(session.completedAt);
      const diffTime = Math.abs(now.getTime() - sessionDate.getTime());
      const diffDays = diffTime / (1000 * 60 * 60 * 24);
      if (diffDays <= 7) {
        const key = sessionDate.toLocaleDateString('en-US', { weekday: 'short' });
        if (dataMap[key] !== undefined) {
          dataMap[key] += session.duration;
        }
      }
    });

    return Object.keys(dataMap).map(key => ({
      name: key,
      minutes: dataMap[key]
    }));
  };

  const focusChartData = getFocusChartData();

  // Task Completion Pie Chart
  const taskPieData = [
    { name: 'Completed', value: totalCompleted, color: 'var(--color-brand-dark)' },
    { name: 'Pending', value: tasks.length - totalCompleted, color: '#e5e7eb' },
  ];

  // Filter tasks for listing
  const getFilteredTasks = () => {
    let list = [...tasks];

    // Search filter
    if (searchQuery.trim() !== "") {
      const q = searchQuery.trim().toLowerCase();
      list = list.filter((t) => t.name.toLowerCase().includes(q));
    }

    // Category filter
    if (categoryFilter === "completed") {
      list = list.filter((t) => t.completed);
    } else if (categoryFilter !== "all") {
      list = list.filter((t) => t.category === categoryFilter && !t.completed);
    } else {
      list = list.filter((t) => !t.completed);
    }

    // Priority filter
    if (priorityFilter !== "all") {
      list = list.filter((t) => t.priority === priorityFilter);
    }

    // Sort by priority first (critical > high > medium > low), then deadline
    const priorityOrder = { critical: 0, high: 1, medium: 2, low: 3 };
    return list.sort((a, b) => {
      const diff = priorityOrder[a.priority] - priorityOrder[b.priority];
      if (diff !== 0) return diff;
      return new Date(a.deadline).getTime() - new Date(b.deadline).getTime();
    });
  };

  const filteredTasks = getFilteredTasks();

  return (
    <div className="space-y-12">
      {/* Hero section */}
      <div className="py-8 md:py-12 grid grid-cols-1 min-[901px]:grid-cols-[1fr_minmax(0,260px)] gap-8 items-end justify-between border-b border-[var(--color-brand-dark)]/20 pb-8 md:pb-12">
        <div className="flex flex-col justify-start w-full">
          <div className="flex items-center space-x-4 mb-4">
            <div className="h-[1px] w-12 bg-[var(--color-brand-dark)]"></div>
            <span className="text-[10px] font-bold uppercase tracking-widest">{getTranslation(language, 'manifesto')}</span>
          </div>
          <h1 className="text-6xl sm:text-7xl md:text-8xl font-serif font-black tracking-tight text-[var(--color-brand-dark)] leading-[0.85] italic mb-6 whitespace-pre-line">
            {getTranslation(language, 'finishThings')}
          </h1>
          <p className="text-sm italic font-serif opacity-70 leading-snug">
            {getDailyQuote(language)}
          </p>
        </div>
        
        <div className="flex flex-col gap-2 min-w-0 overflow-visible break-words min-[901px]:border-l border-[var(--color-brand-dark)]/20 min-[901px]:pl-8 text-left max-[900px]:border-t max-[900px]:pt-4 max-[900px]:mt-4">
          <p className="text-xs leading-relaxed text-[var(--color-brand-dark)]/80 mb-4 min-w-0 break-words whitespace-normal">
            Exploring the intersection of raw focus and the ephemeral nature of time. An AI-powered companion that turns overwhelming task lists into clear, prioritized, actionable plans.
          </p>
          <div className="flex flex-col gap-1 items-start text-[11px] font-bold uppercase tracking-widest text-[var(--color-brand-dark)]/60 min-w-0 break-words whitespace-normal">
            <span className="min-w-0 break-words whitespace-normal"><Brain size={12} className="inline mr-2 flex-shrink-0" /> AI PRIORITIZATION</span>
            <span className="min-w-0 break-words whitespace-normal"><Calendar size={12} className="inline mr-2 flex-shrink-0" /> SMART SCHEDULING</span>
          </div>
        </div>
      </div>

      {emergencyMode && (
        <div className="bg-red-500 text-white border-b-4 border-red-700 p-6 mb-8 flex flex-col md:flex-row items-center justify-between shadow-2xl animate-pulse">
          <div className="flex items-center gap-4">
            <AlertTriangle size={32} />
            <div>
              <h2 className="font-bold text-xl uppercase tracking-widest">⚠ Emergency Rescue Activated</h2>
              <p className="text-sm opacity-90">{emergencyTasks.length} task(s) due in less than 12 hours. Compressed action plan recommended.</p>
            </div>
          </div>
          <button onClick={() => handleSendChat("Activate emergency compressed schedule for my imminent tasks.")} className="mt-4 md:mt-0 px-6 py-2 border-2 border-[var(--color-brand-white)] font-bold uppercase tracking-widest hover:bg-[var(--color-brand-white)] hover:text-[var(--color-brand-primary)] transition-colors text-sm">
            Fix My Day
          </button>
        </div>
      )}

      {/* Advanced Dashboard Cards */}
      <motion.div 
        initial={{ opacity: 0, y: 30 }}
        whileInView={{ opacity: 1, y: 0 }}
        viewport={{ once: true, margin: "-40px" }}
        transition={{ duration: 0.6, ease: "easeOut" }}
        className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-5 gap-4 mt-8 mb-12"
      >
        <div className="bg-[var(--color-brand-dark)] text-[var(--color-text-on-dark)] p-4 sm:p-5 shadow-xl relative overflow-hidden group flex flex-col justify-center min-w-0">
          <div className="text-3xl sm:text-4xl font-serif italic mb-2 relative z-10 truncate">{urgentTodayCount}</div>
          <div className="text-[9px] sm:text-[10px] font-bold uppercase tracking-widest opacity-70 relative z-10 flex items-center gap-1.5 whitespace-nowrap truncate">
            <AlertCircle size={12} className="flex-shrink-0" /> <span className="truncate">Urgent Today</span>
          </div>
          <div className="absolute -right-4 -bottom-4 text-white/5 opacity-50 group-hover:scale-110 transition-transform duration-500 pointer-events-none">
            <AlertCircle size={100} />
          </div>
        </div>

        <div className="bg-[var(--color-brand-white)] border border-[var(--color-brand-dark)]/20 p-4 sm:p-5 relative overflow-hidden group flex flex-col justify-center min-w-0">
          <div className="text-3xl sm:text-4xl font-serif italic mb-2 relative z-10 text-[var(--color-brand-dark)] truncate">{highRiskCount}</div>
          <div className="text-[9px] sm:text-[10px] font-bold uppercase tracking-widest text-[var(--color-brand-dark)]/60 relative z-10 flex items-center gap-1.5 whitespace-nowrap truncate">
            <AlertTriangle size={12} className="flex-shrink-0" /> <span className="truncate">High Risk Tasks</span>
          </div>
          <div className="absolute -right-4 -bottom-4 text-[var(--color-brand-dark)]/5 group-hover:scale-110 transition-transform duration-500 pointer-events-none">
            <AlertTriangle size={100} />
          </div>
        </div>

        <div className="bg-[var(--color-brand-white)] border border-[var(--color-brand-dark)]/20 p-4 sm:p-5 relative overflow-hidden group flex flex-col justify-center min-w-0">
          <div className="text-3xl sm:text-4xl font-serif italic mb-2 relative z-10 text-[var(--color-brand-dark)] truncate">{totalTimeReq.toFixed(1)}h</div>
          <div className="text-[9px] sm:text-[10px] font-bold uppercase tracking-widest text-[var(--color-brand-dark)]/60 relative z-10 flex items-center gap-1.5 whitespace-nowrap truncate">
            <Clock size={12} className="flex-shrink-0" /> <span className="truncate">Total Time Req.</span>
          </div>
          <div className="absolute -right-4 -bottom-4 text-[var(--color-brand-dark)]/5 group-hover:scale-110 transition-transform duration-500 pointer-events-none">
            <Clock size={100} />
          </div>
        </div>

        <div className="bg-[var(--color-brand-white)] border border-[var(--color-brand-dark)]/20 p-4 sm:p-5 relative overflow-hidden group flex flex-col justify-center min-w-0">
          <div className="text-3xl sm:text-4xl font-serif italic mb-2 relative z-10 text-[var(--color-brand-dark)] truncate">{completionRate}%</div>
          <div className="text-[9px] sm:text-[10px] font-bold uppercase tracking-widest text-[var(--color-brand-dark)]/60 relative z-10 flex items-center gap-1.5 whitespace-nowrap truncate">
            <Trophy size={12} className="flex-shrink-0" /> <span className="truncate">Completion Rate</span>
          </div>
          <div className="absolute -right-4 -bottom-4 text-[var(--color-brand-dark)]/5 group-hover:scale-110 transition-transform duration-500 pointer-events-none">
            <Trophy size={100} />
          </div>
        </div>

        <div className="bg-gradient-to-br from-[var(--color-brand-dark)] to-[#9333EA] text-[var(--color-text-on-dark)] border border-[var(--color-brand-dark)]/20 p-4 sm:p-5 relative overflow-hidden group col-span-1 min-[500px]:col-span-2 lg:col-span-1 min-w-0">
          <div className="flex items-center justify-between mb-2">
            <div className="text-[9px] sm:text-[10px] font-bold uppercase tracking-widest opacity-70 flex items-center gap-1.5 whitespace-nowrap truncate">
              <Brain size={12} className="flex-shrink-0" /> <span className="truncate">Burnout Risk</span>
            </div>
            <button onClick={fetchBurnoutScore} disabled={isBurnoutLoading} className="opacity-50 hover:opacity-100 transition-opacity flex-shrink-0 ml-2" title="Refresh">
              <RefreshCw size={12} className={isBurnoutLoading ? "animate-spin" : ""} />
            </button>
          </div>
          {isBurnoutLoading ? (
             <div className="text-xs font-serif italic leading-relaxed z-10 relative">Analyzing...</div>
          ) : (
            <>
              <div className="text-3xl sm:text-4xl font-serif italic mb-1 relative z-10 truncate">{burnoutScore !== null ? burnoutScore : "?"}/100</div>
              <p className="text-[10px] sm:text-xs font-serif italic leading-tight z-10 relative line-clamp-2">
                {burnoutRecommendation || "Keep a balanced pace. Make sure to rest."}
              </p>
            </>
          )}
          <div className="absolute -right-4 -bottom-4 text-white/5 opacity-50 group-hover:scale-110 transition-transform duration-500 pointer-events-none">
            <Brain size={100} />
          </div>
        </div>
      </motion.div>
      
      {/* Action Bar */}
      <div className="flex flex-wrap gap-4 items-center justify-between mt-2 mb-8">
        <button
          onClick={handleWeeklyDebrief}
          disabled={isDebriefLoading}
          className="flex items-center gap-2 px-4 py-2 bg-[var(--color-brand-white)] border border-[var(--color-brand-dark)] text-[var(--color-brand-dark)] hover:bg-[var(--color-brand-dark)] hover:text-[var(--color-brand-white)] rounded-[12px] text-xs font-bold uppercase tracking-widest transition-colors disabled:opacity-50"
        >
          {isDebriefLoading ? <RefreshCw size={14} className="animate-spin" /> : <Bot size={14} />}
          Weekly AI Debrief
        </button>
      </div>
      <div className="grid grid-cols-1 lg:grid-cols-[1fr_320px] gap-4 items-start pb-12 w-full">
        
        {/* Left Column: Charts + Tasks */}
        <div className="flex flex-col gap-6 min-w-0 w-full">
          {/* Charts Section */}
          <motion.div 
            initial={{ opacity: 0, y: 30 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true, margin: "-40px" }}
            transition={{ duration: 0.6, ease: "easeOut", delay: 0.1 }}
            className="grid grid-cols-1 lg:grid-cols-2 gap-4 w-full"
          >
            {/* Focus Time Chart */}
            <div className="bg-[var(--color-brand-white)] border border-[var(--color-brand-dark)]/20 p-6 min-w-0">
              <h3 className="text-xl font-serif italic text-[var(--color-brand-dark)] mb-6 flex items-center gap-2">
                <Clock size={18} /> Daily Focus Time
              </h3>
              <div className="h-64 w-full">
                <ResponsiveContainer width="100%" height="100%">
                  <BarChart data={focusChartData} margin={{ top: 10, right: 10, left: -20, bottom: 0 }}>
                    <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="var(--color-brand-dark)" opacity={0.1} />
                    <XAxis dataKey="name" axisLine={false} tickLine={false} tick={{ fontSize: 10, fill: 'var(--color-brand-dark)', opacity: 0.6 }} />
                    <YAxis axisLine={false} tickLine={false} tick={{ fontSize: 10, fill: 'var(--color-brand-dark)', opacity: 0.6 }} />
                    <Tooltip 
                      cursor={{ fill: 'var(--color-brand-dark)', opacity: 0.05 }}
                      contentStyle={{ backgroundColor: 'var(--color-brand-white)', borderColor: 'var(--color-brand-dark)', borderRadius: '0px' }}
                      itemStyle={{ color: 'var(--color-brand-dark)', fontSize: '12px', fontWeight: 'bold' }}
                      labelStyle={{ color: 'var(--color-brand-dark)', fontSize: '12px', fontWeight: 'normal' }}
                    />
                    <Bar dataKey="minutes" fill="var(--color-brand-dark)" radius={[2, 2, 0, 0]} />
                  </BarChart>
                </ResponsiveContainer>
              </div>
            </div>

            {/* Task Completion Chart */}
            <div className="bg-[var(--color-brand-white)] border border-[var(--color-brand-dark)]/20 p-6 flex flex-col justify-center items-center relative min-w-0">
              <h3 className="text-xl font-serif italic text-[var(--color-brand-dark)] mb-2 absolute top-6 left-6 flex items-center gap-2">
                <Trophy size={18} /> Task Completion
              </h3>
              <div className="h-64 w-full mt-8">
                <ResponsiveContainer width="100%" height="100%">
                  <PieChart>
                    <Pie
                      data={taskPieData}
                      cx="50%"
                      cy="50%"
                      innerRadius={60}
                      outerRadius={80}
                      paddingAngle={2}
                      dataKey="value"
                      stroke="none"
                    >
                      {taskPieData.map((entry, index) => (
                        <Cell key={`cell-${index}`} fill={entry.color} />
                      ))}
                    </Pie>
                    <Tooltip 
                      contentStyle={{ backgroundColor: 'var(--color-brand-white)', borderColor: 'var(--color-brand-dark)', borderRadius: '0px' }}
                      itemStyle={{ color: 'var(--color-brand-dark)', fontSize: '12px', fontWeight: 'bold' }}
                      labelStyle={{ color: 'var(--color-brand-dark)', fontSize: '12px', fontWeight: 'normal' }}
                    />
                  </PieChart>
                </ResponsiveContainer>
              </div>
              <div className="absolute inset-0 flex items-center justify-center mt-8 pointer-events-none">
                <div className="text-center">
                  <div className="text-3xl font-serif italic text-[var(--color-brand-dark)]">{completionRate}%</div>
                  <div className="text-[10px] font-bold uppercase tracking-widest text-[var(--color-brand-dark)]/60">Done</div>
                </div>
              </div>
            </div>
          </motion.div>

          {/* Tasks Section */}
          <div className="space-y-6">
            <div className="flex items-center justify-between gap-4">
              <div className="min-w-0 flex-1">
                <h2 className="text-4xl md:text-5xl font-serif italic font-normal text-[var(--color-brand-dark)] truncate">{getTranslation(language, 'yourTasklist')}</h2>
                <p className="text-xs text-[var(--color-brand-dark)]/60 mt-1 truncate">{getTranslation(language, 'sortedDynamically')}</p>
              </div>
              <button
              id="btn-add-task-toggle"
              onClick={toggleAddForm}
              className="btn flex items-center justify-center gap-2 px-4 py-2 bg-[var(--color-brand-dark)] hover:bg-[var(--color-brand-dark)]/90 text-[var(--color-text-on-dark)] rounded-full text-sm font-bold uppercase tracking-widest text-[10px] transition-all shadow-xs cursor-pointer whitespace-nowrap shrink-0"
            >
              <Plus size={16} /> Add Task
            </button>
          </div>

          {/* Add Task Form Card */}
          {showAddForm && (
            <div id="add-task-card" className="bg-[var(--color-brand-white)] border border-[var(--color-brand-dark)]/20 rounded-[14px] p-6 shadow-sm transition-all animate-fadeIn">
              <h3 className="flex items-center gap-2 text-2xl font-serif italic font-normal text-[var(--color-brand-dark)] mb-5">
                <Plus size={18} className="text-[var(--color-brand-dark)]" /> {editingTaskId ? "Edit Task" : "New Task"}
              </h3>
              <form onSubmit={handleAddTask} className="space-y-4">
                <div className="flex flex-col gap-1.5">
                  <label className="text-xs font-medium uppercase tracking-wider text-[10px] text-[var(--color-brand-dark)]">Task Name</label>
                  <input
                    id="input-task-name"
                    type="text"
                    required
                    placeholder="e.g. Submit chemistry laboratory report"
                    value={taskName}
                    onChange={(e) => setTaskName(e.target.value)}
                    className="px-3.5 py-2.5 bg-[var(--color-brand-white)] border-[var(--color-brand-dark)]/40 transition-colors"
                  />
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  <div className="flex flex-col gap-1.5">
                    <label className="text-xs font-medium uppercase tracking-wider text-[10px] text-[var(--color-brand-dark)]">Deadline</label>
                    <input
                      id="input-task-deadline"
                      type="datetime-local"
                      required
                      value={taskDeadline}
                      onChange={(e) => setTaskDeadline(e.target.value)}
                      className="px-3.5 py-2.5 bg-[var(--color-brand-white)] border-[var(--color-brand-dark)]/40 transition-colors"
                    />
                  </div>

                  <div className="flex flex-col gap-1.5">
                    <label className="text-xs font-medium uppercase tracking-wider text-[10px] text-[var(--color-brand-dark)]">Category</label>
                    <select
                      id="select-task-category"
                      value={taskCategory}
                      onChange={(e) => setTaskCategory(e.target.value as Task["category"])}
                      className="px-3.5 py-2.5 bg-[var(--color-brand-white)] border-[var(--color-brand-dark)]/40 transition-colors cursor-pointer"
                    >
                      <option value="work">Work</option>
                      <option value="study">Study</option>
                      <option value="personal">Personal</option>
                      <option value="health">Health</option>
                      <option value="finance">Finance</option>
                      <option value="other">Other</option>
                    </select>
                  </div>
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  <div className="flex flex-col gap-1.5">
                    <label className="text-xs font-medium uppercase tracking-wider text-[10px] text-[var(--color-brand-dark)]">Estimated Duration</label>
                    <select
                      id="select-task-duration"
                      value={taskEstimatedTime}
                      onChange={(e) => setTaskEstimatedTime(e.target.value)}
                      className="px-3.5 py-2.5 bg-[var(--color-brand-white)] border-[var(--color-brand-dark)]/40 transition-colors cursor-pointer"
                    >
                      <option value="15 min">15 min</option>
                      <option value="30 min">30 min</option>
                      <option value="1 hour">1 hour</option>
                      <option value="2 hours">2 hours</option>
                      <option value="4 hours">4 hours</option>
                      <option value="Full day">Full day</option>
                    </select>
                  </div>

                  <div className="flex flex-col gap-1.5">
                    <label className="text-xs font-medium uppercase tracking-wider text-[10px] text-[var(--color-brand-dark)]">AI Urgency Priority</label>
                    <select
                      id="select-task-priority"
                      value={taskPriority}
                      onChange={(e) => setTaskPriority(e.target.value as "auto" | Task["priority"])}
                      className="px-3.5 py-2.5 bg-[var(--color-brand-white)] border-[var(--color-brand-dark)]/40 transition-colors cursor-pointer"
                    >
                      <option value="auto">⚡ Auto (Gemini Decides)</option>
                      <option value="critical">Critical</option>
                      <option value="high">High</option>
                      <option value="medium">Medium</option>
                      <option value="low">Low</option>
                    </select>
                  </div>
                </div>

                <div className="flex flex-col gap-1.5">
                  <label className="text-xs font-medium uppercase tracking-wider text-[10px] text-[var(--color-brand-dark)]">Detailed Notes / Extra Context</label>
                  <textarea
                    id="input-task-notes"
                    placeholder="Provide additional details or attachments info to assist Gemini during smart prioritization..."
                    value={taskNotes}
                    onChange={(e) => setTaskNotes(e.target.value)}
                    rows={2}
                    className="px-3.5 py-2.5 bg-[var(--color-brand-white)] border-[var(--color-brand-dark)]/40 transition-colors resize-y"
                  />
                </div>

                <div className="flex flex-col gap-1.5">
                  <label className="text-xs font-medium uppercase tracking-wider text-[10px] text-[var(--color-brand-dark)]">Blocked By (Optional)</label>
                  <select
                    multiple
                    value={taskBlockedBy}
                    onChange={(e) => {
                      const options = Array.from(e.target.selectedOptions as HTMLCollectionOf<HTMLOptionElement>);
                      setTaskBlockedBy(options.map(o => o.value));
                    }}
                    className="px-3.5 py-2.5 bg-[var(--color-brand-white)] border-[var(--color-brand-dark)]/40 transition-colors cursor-pointer"
                    size={3}
                  >
                    {tasks.filter(t => t.id.toString() !== editingTaskId && !t.completed).map(t => (
                      <option key={t.id} value={t.id}>{t.name}</option>
                    ))}
                  </select>
                  <p className="text-[9px] text-[var(--color-brand-dark)]/60">Hold Ctrl/Cmd to select multiple dependencies.</p>
                </div>

                <div className="flex gap-2.5 pt-3">
                  <button
                    id="btn-add-task-submit"
                    type="submit"
                    disabled={isSubmitting}
                    className="flex items-center gap-2 px-5 py-2.5 bg-[var(--color-brand-dark)] hover:bg-[var(--color-brand-dark)]/90 text-[var(--color-text-on-dark)] rounded-full text-sm font-bold uppercase tracking-widest text-[10px] transition-all shadow-xs cursor-pointer disabled:opacity-50"
                  >
                    {isSubmitting ? (
                      <RefreshCw size={14} className="animate-spin" />
                    ) : (
                      <Sparkles size={14} className="text-[var(--color-text-on-dark)]" />
                    )}
                    {editingTaskId ? "Update Task" : "Add & Prioritize Task"}
                  </button>
                  <button
                    id="btn-add-task-cancel"
                    type="button"
                    onClick={toggleAddForm}
                    className="px-5 py-2.5 border border-[var(--color-brand-dark)]/20 bg-[var(--color-brand-accent)] hover:brightness-95 text-[var(--color-text-on-cream)] rounded-[8px] text-sm font-bold uppercase tracking-widest text-[10px] transition-all cursor-pointer"
                  >
                    Cancel
                  </button>
                </div>
              </form>
            </div>
          )}

          {/* Search and Filters */}
          <div className="flex flex-col gap-4">
            <div className="relative w-full">
              <input
                type="text"
                placeholder="Search tasks..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                aria-label="Search tasks"
                className="w-full pl-10 pr-10 py-3 border border-[var(--color-brand-dark)]/20 rounded-full text-sm focus:border-[var(--color-brand-dark)] outline-none bg-[var(--color-brand-white)]/50 focus:bg-[var(--color-brand-white)] placeholder-[var(--color-brand-dark)]/40 text-[var(--color-brand-dark)] transition-all"
              />
              <div className="absolute left-4 top-1/2 -translate-y-1/2 text-[var(--color-brand-dark)]/40 pointer-events-none flex items-center justify-center">
                <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"><circle cx="11" cy="11" r="8"></circle><line x1="21" y1="21" x2="16.65" y2="16.65"></line></svg>
              </div>
              {searchQuery && (
                <button
                  onClick={() => setSearchQuery('')}
                  className="absolute right-4 top-1/2 -translate-y-1/2 text-[var(--color-brand-dark)]/40 hover:text-[var(--color-brand-dark)] transition-colors flex items-center justify-center"
                  aria-label="Clear search"
                >
                  <X size={16} />
                </button>
              )}
            </div>

            {/* Quick Category Filters */}
            <div 
              ref={scrollContainerRef}
              onMouseDown={handleMouseDownFilter}
              onMouseLeave={handleMouseLeaveFilter}
              onMouseUp={handleMouseUpFilter}
              onMouseMove={handleMouseMoveFilter}
              className={`flex flex-nowrap gap-2 items-center overflow-x-auto select-none [&::-webkit-scrollbar]:hidden [-ms-overflow-style:none] [scrollbar-width:none] ${isDraggingFilter ? 'cursor-grabbing' : 'cursor-grab'}`}
            >
              {[
              { id: "all", label: getTranslation(language, 'allTasks'), icon: <Compass size={14} /> },
              { id: "work", label: getTranslation(language, 'work'), icon: CAT_ICONS.work },
              { id: "study", label: getTranslation(language, 'study'), icon: CAT_ICONS.study },
              { id: "personal", label: getTranslation(language, 'personal'), icon: CAT_ICONS.personal },
              { id: "health", label: getTranslation(language, 'health'), icon: CAT_ICONS.health },
              { id: "finance", label: getTranslation(language, 'finance'), icon: CAT_ICONS.finance },
              { id: "completed", label: getTranslation(language, 'completedTasks'), icon: <CheckCircle size={14} /> },
            ].map((chip) => (
              <button
                key={chip.id}
                id={`filter-chip-${chip.id}`}
                onClick={() => setCategoryFilter(chip.id)}
                className={`flex-shrink-0 flex items-center gap-1.5 px-4 py-2 border rounded-full text-xs font-bold uppercase tracking-widest text-[10px] transition-all whitespace-nowrap ${
                  categoryFilter === chip.id
                    ? "bg-[var(--color-brand-dark)] border-[var(--color-brand-dark)] text-[var(--color-text-on-dark)] shadow-sm"
                    : "bg-[var(--color-brand-white)] border-[var(--color-brand-dark)]/20 text-[var(--color-brand-dark)]/70 hover:border-[var(--color-brand-dark)]/40"
                }`}
              >
                {chip.icon}
                <span>{chip.label}</span>
              </button>
            ))}
            </div>
          </div>

          {/* Task List */}
          <div className="space-y-3.5" id="task-list-container">
            {tasks.length === 0 ? (
              <div className="text-center py-20 px-6 bg-[var(--color-brand-white)] border border-[var(--color-brand-dark)]/15 rounded-[14px] flex flex-col items-center shadow-sm">
                <div className="w-24 h-24 mb-6 relative">
                  <div className="absolute inset-0 bg-[var(--color-brand-accent)] rounded-full animate-ping opacity-30"></div>
                  <div className="relative w-full h-full bg-[var(--color-brand-cream)] border-2 border-[var(--color-brand-dark)] rounded-[24px] flex flex-col items-center justify-center transform rotate-3 shadow-md overflow-hidden">
                    <div className="w-full bg-[var(--color-brand-dark)] h-4 absolute top-0 flex items-center px-2 gap-1 border-b border-[var(--color-brand-dark)]">
                      <div className="w-1.5 h-1.5 rounded-full bg-[var(--color-brand-white)]/50"></div>
                      <div className="w-1.5 h-1.5 rounded-full bg-[var(--color-brand-white)]/50"></div>
                    </div>
                    <CheckSquare size={32} className="text-[var(--color-brand-dark)] mt-2" />
                  </div>
                </div>
                <h3 className="text-2xl font-serif italic text-[var(--color-brand-dark)] mb-2">Welcome to your Lifesaver</h3>
                <p className="text-sm text-[var(--color-brand-dark)]/60 max-w-[280px] mb-8">
                  Get started by adding your first task. Organize your day, track progress, and stay focused.
                </p>
                <button
                  onClick={() => {
                    playClickSound();
                    setShowAddForm(true);
                  }}
                  className="px-6 py-3 bg-[var(--color-brand-dark)] text-[var(--color-text-on-dark)] rounded-[12px] font-bold uppercase tracking-widest text-[11px] hover:scale-105 transition-transform flex items-center gap-2 shadow-lg hover:shadow-xl active:scale-95"
                >
                  <span className="flex items-center gap-2">Add your first task <span className="text-[14px]">→</span></span>
                </button>
              </div>
            ) : filteredTasks.length === 0 ? (
              <div className="text-center py-16 bg-[var(--color-brand-white)] border border-[var(--color-brand-dark)]/15 rounded-[14px]">
                <div className="w-12 h-12 bg-[var(--color-brand-white)] border border-[var(--color-brand-dark)]/20 text-[var(--color-brand-dark)]/40 rounded-[14px] flex items-center justify-center mx-auto mb-3">
                  <CheckCircle size={20} />
                </div>
                <h3 className="font-bold uppercase tracking-widest text-[10px] text-[var(--color-brand-dark)] text-base">{getTranslation(language, 'youAreAllClear')}</h3>
                <p className="text-xs text-[var(--color-brand-dark)]/40 mt-1">{getTranslation(language, 'noPendingActions')}</p>
              </div>
            ) : (
              <AnimatePresence>
                {filteredTasks.map((task, index) => {
                  const dl = getDeadlineStatus(task.deadline);
                  const accentBorder = {
                    critical: "border-l-red-500",
                    high: "border-l-orange-500",
                    medium: "border-l-amber-500",
                    low: "border-l-emerald-500",
                  }[task.priority];

                  const tagBg = {
                    critical: "bg-[var(--color-brand-dark)]/10 text-[var(--color-brand-dark)] border-[var(--color-brand-dark)]",
                    high: "bg-[var(--color-brand-dark)]/5 text-[var(--color-brand-dark)]/80 border-[var(--color-brand-dark)]/60",
                    medium: "bg-[var(--color-brand-dark)] text-[var(--color-text-on-dark)] border-[var(--color-brand-dark)]",
                    low: "bg-[var(--color-brand-dark)]/5 text-[var(--color-brand-dark)] border-[var(--color-brand-dark)]/40",
                  }[task.priority];

                  return (
                    <motion.div
                      layout
                      key={task.id}
                      initial={{ opacity: 0, y: 15 }}
                      animate={{ opacity: 1, y: 0 }}
                      exit={{ opacity: 0, scale: 0.95 }}
                      transition={{ duration: 0.25, delay: index * 0.05, ease: "easeOut" }}
                      className={`bg-[var(--color-brand-white)] border-l-4 ${accentBorder} rounded-[14px] p-4 transition-all hover:border-[var(--color-brand-dark)]/30 hover:shadow-xs flex flex-col gap-3 relative overflow-hidden ${
                        task.completed ? "opacity-60" : ""
                      }`}
                    >
                    <div className="flex items-start justify-between gap-4">
                      <div className="flex items-start gap-3">
                        <button
                          id={`task-check-${task.id}`}
                          onClick={() => handleToggleComplete(task.id)}
                          className={`w-5 h-5 rounded-[14px] border-2 flex items-center justify-center mt-0.5 cursor-pointer transition-colors ${
                            task.completed
                              ? "bg-[var(--color-brand-dark)]/20 border-[var(--color-brand-dark)]/40 text-[var(--color-brand-dark)]"
                              : "border-[var(--color-brand-dark)]/20 hover:border-[var(--color-brand-dark)]"
                          }`}
                        >
                          {task.completed && <Check size={12} strokeWidth={3} />}
                        </button>
                        <div>
                          <h4
                            className={`font-medium uppercase tracking-wider text-[10px] text-[var(--color-brand-dark)] text-sm leading-snug ${
                              task.completed ? "line-through text-[var(--color-brand-dark)]/40" : ""
                            }`}
                          >
                            {task.name}
                          </h4>
                          <div className="flex items-center gap-3 text-xs text-[var(--color-brand-dark)]/40 mt-1.5 flex-wrap">
                            <span className="flex items-center gap-1">
                              {CAT_ICONS[task.category]} {task.category}
                            </span>
                            <span className="flex items-center gap-1">
                              <Clock size={12} /> {task.estimatedTime}
                            </span>
                            <span className={`flex items-center gap-1 ${dl.cls}`}>
                              <Calendar size={12} /> {dl.label}
                            </span>
                            {task.suggestedStart && (
                              <span className="text-[var(--color-text-on-dark)] bg-[var(--color-brand-dark)] px-1.5 py-0.5 rounded text-[10px] font-bold uppercase tracking-widest text-[10px]">
                                AI: {task.suggestedStart}
                              </span>
                            )}
                          </div>
                        </div>
                      </div>

                      <div className="flex items-center gap-1 flex-shrink-0">
                        {task.blockedBy && task.blockedBy.length > 0 && !task.completed && (
                          <span title={`Blocked by ${task.blockedBy.length} task(s)`} className="p-1 flex items-center gap-1 bg-orange-500/10 text-orange-600 border border-orange-500/20 rounded-[14px] text-[10px] font-bold uppercase tracking-widest mr-1">
                            <AlertCircle size={12} /> Blocked
                          </span>
                        )}
                        {(task.missedDeadlineCount || 0) >= 2 && !task.completed && (
                          <button
                            onClick={() => handleProcrastinationAnalysis(task)}
                            disabled={isProcrastinationLoading === task.id}
                            className="p-1.5 flex items-center gap-1 bg-red-500/10 text-red-600 hover:bg-red-500/20 border border-red-500/20 rounded-[14px] transition-colors cursor-pointer mr-2"
                            title="Procrastination Warning"
                          >
                            {isProcrastinationLoading === task.id ? <RefreshCw size={14} className="animate-spin" /> : <AlertTriangle size={14} />}
                          </button>
                        )}
                        <span className={`text-[10px] font-bold uppercase tracking-widest text-[10px] uppercase tracking-wider px-2 py-0.5 rounded-[14px] border ${tagBg}`}>
                          {PRIORITY_LABELS[task.priority]}
                        </span>
                        <button
                          id={`task-prioritize-btn-${task.id}`}
                          onClick={() => prioritizeTaskWithAi(task)}
                          title="Recalculate AI Priority"
                          className="p-1.5 text-[var(--color-brand-dark)]/40 hover:text-[var(--color-brand-dark)] hover:bg-[var(--color-brand-white)] border border-[var(--color-brand-dark)]/10 rounded-[14px] transition-colors cursor-pointer"
                        >
                          <RefreshCw size={14} />
                        </button>
                        <button
                          id={`task-edit-btn-${task.id}`}
                          onClick={() => handleEditClick(task)}
                          title="Edit Task"
                          className="p-1.5 text-[var(--color-brand-dark)]/40 hover:text-[var(--color-brand-dark)] hover:bg-[var(--color-brand-dark)]/10 rounded-[14px] transition-colors cursor-pointer"
                        >
                          <Pencil size={14} />
                        </button>
                        <button
                          id={`task-delete-btn-${task.id}`}
                          onClick={() => handleDeleteTask(task.id)}
                          title="Delete Task"
                          className="p-1.5 text-[var(--color-brand-dark)]/40 hover:text-[var(--color-brand-dark)] hover:bg-[var(--color-brand-dark)]/10 rounded-[14px] transition-colors cursor-pointer"
                        >
                          <Trash2 size={14} />
                        </button>
                      </div>
                    </div>

                    {/* AI Coach note context */}
                    {task.aiNote && (
                      <div className="bg-[var(--color-brand-white)] border-l-2 border-[var(--color-brand-dark)]/40 rounded-[14px] py-2 px-3 flex gap-2 items-start text-xs text-[var(--color-brand-dark)]/80 leading-relaxed">
                        <Bot size={14} className="text-[var(--color-brand-dark)]/60 mt-0.5 flex-shrink-0" />
                        <span>{task.aiNote}</span>
                      </div>
                    )}

                    {/* Static standard notes block */}
                    {task.notes && (
                      <div className="text-xs text-[var(--color-brand-dark)]/40 italic bg-[var(--color-brand-white)] border-[var(--color-brand-dark)]/10 leading-relaxed">
                        <strong>Context Note: </strong> {task.notes}
                      </div>
                    )}

                    {/* Subtasks Block */}
                    {task.subtasks && task.subtasks.length > 0 && (
                      <div className="mt-2 space-y-1.5">
                        {task.subtasks.map((sub, index) => (
                          <div key={index} className="flex items-center gap-2 text-xs">
                            <button
                              onClick={() => toggleSubtask(task.id, index)}
                              className={`w-3.5 h-3.5 border rounded-[14px] flex items-center justify-center transition-colors ${
                                sub.completed ? "bg-[var(--color-brand-dark)]/20 border-[var(--color-brand-dark)]/40 text-[var(--color-brand-dark)]" : "border-[var(--color-brand-dark)]/20 hover:border-[var(--color-brand-dark)]"
                              }`}
                            >
                              {sub.completed && <Check size={10} strokeWidth={3} />}
                            </button>
                            <span className={sub.completed ? "line-through text-[var(--color-brand-dark)]/40" : "text-[var(--color-brand-dark)]/80"}>
                              {sub.title}
                            </span>
                          </div>
                        ))}
                      </div>
                    )}
                    </motion.div>
                  );
                })}
              </AnimatePresence>
            )}

            {tasks.filter((t) => !t.completed).length > 0 && (
              <div className="text-center pt-2" id="re-prioritize-all-wrap">
                <button
                  id="btn-reprioritize-all"
                  onClick={prioritizeAllWithAi}
                  className="inline-flex items-center gap-2 px-4.5 py-2 border border-[var(--color-brand-dark)]/10 text-[var(--color-brand-dark)]/80 rounded-[14px] text-xs font-medium uppercase tracking-wider text-[10px] transition-all cursor-pointer"
                >
                  <RefreshCw size={13} /> Re-prioritize All with Gemini
                </button>
              </div>
            )}
          </div>
        </div>
      </div>

        {/* Right Column: AI Assistant Panel */}
        <div className="h-full flex flex-col mt-6 lg:mt-0">
          <div className="bg-[var(--color-brand-white)] border border-[var(--color-brand-dark)]/20 rounded-[14px] shadow-xs overflow-hidden flex flex-col flex-1 min-h-[420px]" id="ai-chat-panel">
            {/* Panel Title */}
            <div className="bg-[var(--color-brand-dark)] px-5 py-4 flex items-center justify-between text-[var(--color-text-on-dark)]">
              <div className="flex items-center gap-2">
                <Bot size={18} className="text-[var(--color-text-on-dark)]" />
                <span className="font-bold uppercase tracking-widest text-[10px] text-sm tracking-tight">LifeSaver Coach AI</span>
              </div>
              <span className="text-[10px] bg-[var(--color-brand-dark)] text-[var(--color-text-on-dark)] px-2 py-0.5 rounded-[14px] font-bold uppercase tracking-widest text-[10px]">ACTIVE</span>
            </div>

            {/* Quick Actions Suggestions */}
            <div className="px-4 py-3 bg-[var(--color-brand-white)] border-b border-[var(--color-brand-dark)]/10 flex flex-col gap-1.5 flex-shrink-0">
              <button
                id="btn-quick-focus"
                onClick={() => handleSendChat("What should I focus on right now based on my tasks?")}
                className="flex items-center gap-2 text-left p-2 bg-[var(--color-brand-white)] hover:bg-[var(--color-brand-dark)]/5 border border-[var(--color-brand-dark)]/20 rounded-[14px] text-xs text-[var(--color-brand-dark)]/80 font-medium uppercase tracking-wider text-[10px] transition-all cursor-pointer"
              >
                <Compass size={13} className="text-[var(--color-brand-dark)]/40" /> {getTranslation(language, 'quickFocus')}
              </button>
              <button
                id="btn-quick-plan"
                onClick={() => handleSendChat("Give me an optimized hourly productivity plan for today based on my active tasks.")}
                className="flex items-center gap-2 text-left p-2 bg-[var(--color-brand-white)] hover:bg-[var(--color-brand-dark)]/5 border border-[var(--color-brand-dark)]/20 rounded-[14px] text-xs text-[var(--color-brand-dark)]/80 font-medium uppercase tracking-wider text-[10px] transition-all cursor-pointer"
              >
                <Calendar size={13} className="text-[var(--color-brand-dark)]/40" /> {getTranslation(language, 'quickPlan')}
              </button>
              <button
                id="btn-quick-overdue"
                onClick={() => handleSendChat("Are any of my tasks at serious risk of being missed? What are your recommendations?")}
                className="flex items-center gap-2 text-left p-2 bg-[var(--color-brand-white)] hover:bg-[var(--color-brand-dark)]/5 border border-[var(--color-brand-dark)]/20 rounded-[14px] text-xs text-[var(--color-brand-dark)]/80 font-medium uppercase tracking-wider text-[10px] transition-all cursor-pointer"
              >
                <AlertTriangle size={13} className="text-[var(--color-brand-dark)]/40" /> {getTranslation(language, 'quickRisk')}
              </button>
              <button
                id="btn-quick-motivation"
                onClick={() => handleSendChat("I am feeling incredibly overwhelmed with my work. Give me a strong motivational push.")}
                className="flex items-center gap-2 text-left p-2 bg-[var(--color-brand-white)] hover:bg-[var(--color-brand-dark)]/5 border border-[var(--color-brand-dark)]/20 rounded-[14px] text-xs text-[var(--color-brand-dark)]/80 font-medium uppercase tracking-wider text-[10px] transition-all cursor-pointer"
              >
                <Rocket size={13} className="text-[var(--color-brand-dark)]/40" /> I need a motivational push
              </button>
            </div>

            {/* Chat message listing */}
            <div className="flex-1 p-4 overflow-y-auto space-y-4" id="chat-messages-container">
              {chatMessages.map((msg) => (
                <div key={msg.id} className={`flex gap-2.5 items-start ${msg.role === "user" ? "flex-row-reverse" : ""}`}>
                  <div
                    className={`w-8 h-8 rounded-[14px] flex items-center justify-center flex-shrink-0 ${
                      msg.role === "ai"
                        ? "bg-[var(--color-brand-dark)] text-[var(--color-text-on-dark)]"
                        : "bg-[var(--color-brand-dark)] text-[var(--color-text-on-dark)] font-bold uppercase tracking-widest text-[10px] text-xs"
                    }`}
                  >
                    {msg.role === "ai" ? <Bot size={15} /> : "ME"}
                  </div>
                  <div
                    className={`p-3 rounded-[14px] text-xs leading-relaxed max-w-[80%] ${
                      msg.role === "ai"
                        ? "bg-[var(--color-brand-dark)]/5 text-[var(--color-brand-dark)] rounded-[14px] border border-[var(--color-brand-dark)]/20"
                        : "bg-[var(--color-brand-dark)] text-[var(--color-text-on-dark)] rounded-[14px]"
                    }`}
                  >
                    <p>{msg.text}</p>
                    <span className="block text-[9px] text-[var(--color-brand-dark)]/40 mt-1 text-right">{msg.timestamp}</span>
                  </div>
                </div>
              ))}

              {isChatLoading && (
                <div className="flex gap-2.5 items-start">
                  <div className="w-8 h-8 rounded-[14px] bg-[var(--color-brand-dark)] text-[var(--color-text-on-dark)] flex items-center justify-center flex-shrink-0 animate-pulse">
                    <Bot size={15} />
                  </div>
                  <div className="p-3 bg-[var(--color-brand-dark)]/5 border border-[var(--color-brand-dark)]/20 rounded-[14px] rounded-[14px] flex items-center gap-1.5 py-4">
                    <div className="w-2 h-2 bg-slate-400 rounded-[14px] animate-bounce" />
                    <div className="w-2 h-2 bg-slate-400 rounded-[14px] animate-bounce [animation-delay:0.2s]" />
                    <div className="w-2 h-2 bg-slate-400 rounded-[14px] animate-bounce [animation-delay:0.4s]" />
                  </div>
                </div>
              )}
              <div ref={chatEndRef} />
            </div>

            {/* Chat input box */}
            <div className="p-3 bg-[var(--color-brand-white)] border-t border-[var(--color-brand-dark)]/15 flex items-center gap-2 flex-shrink-0 mt-auto">
              <input
                id="chat-input-field"
                type="text"
                placeholder={getTranslation(language, 'chatPlaceholder')}
                value={chatInput}
                onChange={(e) => setChatInput(e.target.value)}
                onKeyDown={(e) => e.key === "Enter" && handleSendChat()}
                className="flex-1 px-3.5 py-2.5 bg-[var(--color-brand-white)] border-[var(--color-brand-dark)]/30 transition-colors"
              />
              <button
                id="chat-send-btn"
                onClick={() => handleSendChat()}
                className="p-2.5 bg-[var(--color-brand-dark)] hover:bg-[var(--color-brand-dark)]/90 text-[var(--color-text-on-dark)] rounded-full transition-colors cursor-pointer flex-shrink-0"
              >
                <Send size={14} />
              </button>
            </div>
          </div>
        </div>
      </div>
      {showDebriefModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/50 backdrop-blur-sm">
          <div className="bg-[var(--color-brand-cream)] w-full max-w-lg rounded-[24px] border border-[var(--color-brand-dark)]/20 shadow-2xl overflow-hidden flex flex-col max-h-[90vh]">
            <div className="p-6 border-b border-[var(--color-brand-dark)]/10 flex items-center justify-between bg-[var(--color-brand-white)]">
              <h2 className="text-2xl font-serif italic text-[var(--color-brand-dark)]">Weekly AI Debrief</h2>
              <button onClick={() => setShowDebriefModal(false)} className="text-[var(--color-brand-dark)]/60 hover:text-[var(--color-brand-dark)]"><X size={20}/></button>
            </div>
            <div className="p-6 overflow-y-auto space-y-6">
              {isDebriefLoading ? (
                <div className="flex flex-col items-center justify-center py-12 gap-4">
                  <RefreshCw size={32} className="animate-spin text-[var(--color-brand-dark)]/40" />
                  <p className="text-sm text-[var(--color-brand-dark)]/60 font-serif italic">Gemini is analyzing your week...</p>
                </div>
              ) : debriefData ? (
                <>
                  <p className="text-[var(--color-brand-dark)] leading-relaxed text-sm">
                    {debriefData.text}
                  </p>
                  <div>
                    <h4 className="font-bold uppercase tracking-widest text-[10px] text-[var(--color-brand-dark)]/70 mb-3">Actionable Changes for Next Week</h4>
                    <ul className="space-y-3">
                      {debriefData.suggestions.map((s, i) => (
                        <li key={i} className="flex gap-3 text-sm text-[var(--color-brand-dark)] bg-[var(--color-brand-white)] p-3 rounded-xl border border-[var(--color-brand-dark)]/10">
                          <Sparkles size={16} className="flex-shrink-0 mt-0.5 text-[#9333EA]" />
                          <span>{s}</span>
                        </li>
                      ))}
                    </ul>
                  </div>
                </>
              ) : (
                <p className="text-sm text-[var(--color-brand-dark)]/60 text-center py-8">Failed to load debrief. Please try again.</p>
              )}
            </div>
            <div className="p-4 bg-[var(--color-brand-white)] border-t border-[var(--color-brand-dark)]/10">
              <button onClick={() => setShowDebriefModal(false)} className="w-full py-3 bg-[var(--color-brand-dark)] text-white rounded-xl font-bold uppercase tracking-widest text-[10px]">Got it</button>
            </div>
          </div>
        </div>
      )}


      {showProcrastinationModal.show && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/50 backdrop-blur-sm">
          <div className="bg-[var(--color-brand-cream)] w-full max-w-lg rounded-[24px] border border-[var(--color-brand-dark)]/20 shadow-2xl overflow-hidden flex flex-col max-h-[90vh]">
            <div className="p-6 border-b border-[var(--color-brand-dark)]/10 flex items-center justify-between bg-[var(--color-brand-white)]">
              <h2 className="text-xl font-serif italic text-red-600 flex items-center gap-2"><AlertTriangle size={20} /> Procrastination Alert</h2>
              <button onClick={() => setShowProcrastinationModal({show: false})} className="text-[var(--color-brand-dark)]/60 hover:text-[var(--color-brand-dark)]"><X size={20}/></button>
            </div>
            <div className="p-6 overflow-y-auto space-y-4">
              <p className="text-sm font-bold uppercase tracking-widest text-[var(--color-brand-dark)]">Task: {showProcrastinationModal.taskName}</p>
              <div className="bg-[var(--color-brand-white)] border-l-4 border-red-500 rounded-[14px] py-3 px-4 text-sm text-[var(--color-brand-dark)]/80 leading-relaxed">
                {showProcrastinationModal.reason}
              </div>
            </div>
            <div className="p-4 bg-[var(--color-brand-white)] border-t border-[var(--color-brand-dark)]/10">
              <button onClick={() => setShowProcrastinationModal({show: false})} className="w-full py-3 bg-[var(--color-brand-dark)] text-white rounded-xl font-bold uppercase tracking-widest text-[10px]">I Will Do It Now</button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
