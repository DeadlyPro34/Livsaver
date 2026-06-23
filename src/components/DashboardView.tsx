import { customFetch } from "../lib/api";
import React, { useState, useEffect, useRef } from "react";
import { playClickSound, playSuccessSound } from "../lib/audio";
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
  Trophy
} from "lucide-react";
import { Task, ChatMessage } from "../types";

interface DashboardViewProps {
  tasks: Task[];
  setTasks: React.Dispatch<React.SetStateAction<Task[]>>;
  showToast: (iconName: string, message: string) => void;
  apiError: string | null;
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
  showToast,
  apiError,
}: DashboardViewProps) {
  // Add Task Form State
  const [showAddForm, setShowAddForm] = useState(false);
  const [taskName, setTaskName] = useState("");
  const [taskDeadline, setTaskDeadline] = useState("");
  const [taskCategory, setTaskCategory] = useState<Task["category"]>("work");
  const [taskEstimatedTime, setTaskEstimatedTime] = useState("1 hour");
  const [taskPriority, setTaskPriority] = useState<"auto" | Task["priority"]>("auto");
  const [taskNotes, setTaskNotes] = useState("");
  const [isSubmitting, setIsSubmitting] = useState(false);

  // Filters State
  const [categoryFilter, setCategoryFilter] = useState<string>("all");
  const [priorityFilter, setPriorityFilter] = useState<string>("all");

  // Chat State
  const [chatInput, setChatInput] = useState("");
  const [chatMessages, setChatMessages] = useState<ChatMessage[]>([
    {
      id: "init",
      role: "ai",
      text: "Hey! I am your LifeSaver AI companion. Add some tasks and I will help you prioritize, plan, and crush every deadline. What's on your agenda today?",
      timestamp: new Date().toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" }),
    },
  ]);
  const [isChatLoading, setIsChatLoading] = useState(false);

  const chatEndRef = useRef<HTMLDivElement>(null);

  // Set default deadline to 24h from now on mount
  useEffect(() => {
    const tomorrow = new Date();
    tomorrow.setHours(tomorrow.getHours() + 24);
    setTaskDeadline(tomorrow.toISOString().slice(0, 16));
  }, []);

  // Scroll chat to bottom
  useEffect(() => {
    chatEndRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [chatMessages, isChatLoading]);

  // Form toggle helper
  const toggleAddForm = () => {
    setShowAddForm(!showAddForm);
  };

  // Helper to format remaining deadline time
  const getDeadlineStatus = (deadlineStr: string) => {
    const diff = new Date(deadlineStr).getTime() - Date.now();
    const hours = diff / (1000 * 3600);
    if (diff < 0) {
      return { label: "Overdue", cls: "text-[#4C1D95] font-bold uppercase tracking-widest text-[10px] bg-[#4C1D95]/10 px-2 py-0.5 rounded" };
    }
    if (hours < 6) {
      return { label: `${Math.round(hours)}h left — urgent`, cls: "text-[#4C1D95] font-medium uppercase tracking-wider text-[10px] bg-[#4C1D95]/10 px-2 py-0.5 rounded animate-pulse" };
    }
    if (hours < 24) {
      return { label: `${Math.round(hours)}h left`, cls: "text-[#4C1D95]/80 font-medium bg-[#4C1D95]/5 px-2 py-0.5 rounded" };
    }
    const days = Math.floor(hours / 24);
    return { label: `${days}d left`, cls: "text-[#4C1D95]/60 font-normal" };
  };

  // Call API to prioritize a task
  const prioritizeTaskWithAi = async (taskToPrioritize: Task) => {
    try {
      const otherTasksStr = tasks
        .filter((t) => t.id !== taskToPrioritize.id && !t.completed)
        .map((t) => `"${t.name}" (${t.priority} priority, deadline ${t.deadline})`)
        .join(", ");

      const response = await customFetch("/api/prioritize", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          task: taskToPrioritize,
          otherTasksContext: otherTasksStr,
        }),
      });

      if (!response.ok) {
        throw new Error("Gemini API prioritized callback failed");
      }

      const data = await response.json();
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

    const newTask: Task = {
      id: Date.now(),
      name: taskName.trim(),
      deadline: taskDeadline,
      category: taskCategory,
      estimatedTime: taskEstimatedTime,
      priority: manualPriority,
      notes: taskNotes.trim() || undefined,
      completed: false,
      addedAt: new Date().toISOString(),
    };

    // Add to state immediately
    const updatedTasks = [newTask, ...tasks];
    setTasks(updatedTasks);
    // Reset Form
    setTaskName("");
    setTaskNotes("");
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
  const handleDeleteTask = (id: number) => {
    playClickSound();
    const updated = tasks.filter((t) => t.id !== id);
    setTasks(updated);
    showToast("Trash2", "Task removed");
  };

  // Toggle Complete Handler
  const handleToggleComplete = (id: number) => {
    const updated = tasks.map((t) => {
      if (t.id === id) {
        const nextState = !t.completed;
        if (nextState) {
          playSuccessSound();
          showToast("Trophy", "Awesome job completing this task!");
        } else {
          playClickSound();
        }
        return { ...t, completed: nextState };
      }
      return t;
    });
    setTasks(updated);
  };

  // AI Chat Handler
  const handleSendChat = async (textToSend?: string) => {
    const messageText = textToSend || chatInput;
    if (!messageText.trim()) return;

    const userMsg: ChatMessage = {
      id: Date.now().toString(),
      role: "user",
      text: messageText,
      timestamp: new Date().toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" }),
    };

    setChatMessages((prev) => [...prev, userMsg]);
    if (!textToSend) setChatInput("");
    setIsChatLoading(true);

    try {
      const pendingTasksContext = tasks
        .filter((t) => !t.completed)
        .map((t) => `- "${t.name}" | Priority: ${t.priority} | Category: ${t.category} | Deadline: ${t.deadline}`)
        .join("\n");

      const response = await customFetch("/api/chat", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          message: messageText,
          chatHistory: chatMessages.slice(-5), // Send last 5 messages for brief history
          tasksContext: pendingTasksContext || "No pending tasks left.",
        }),
      });

      if (!response.ok) {
        throw new Error("Chat response failed");
      }

      const data = await response.json();
      const aiReply: ChatMessage = {
        id: (Date.now() + 1).toString(),
        role: "ai",
        text: data.reply || "I am processing your requests now.",
        timestamp: new Date().toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" }),
      };
      setChatMessages((prev) => [...prev, aiReply]);
    } catch (err) {
      console.error(err);
      const offlineReply: ChatMessage = {
        id: (Date.now() + 1).toString(),
        role: "ai",
        text: "My AI circuits are currently having trouble communicating. Connect a valid Gemini API key in the panel or verify backend credentials to unlock full chat responses!",
        timestamp: new Date().toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" }),
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

  // Filter tasks for listing
  const getFilteredTasks = () => {
    let list = [...tasks];

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
      <div className="py-12 flex flex-col md:flex-row gap-8 items-center md:items-end justify-between border-b border-[#4C1D95] pb-12">
        <div className="flex flex-col justify-start max-w-2xl">
          <div className="flex items-center space-x-4 mb-4">
            <div className="h-[1px] w-12 bg-[#4C1D95]"></div>
            <span className="text-[10px] font-bold uppercase tracking-widest">Manifesto</span>
          </div>
          <h1 className="text-6xl md:text-8xl font-serif font-black tracking-tight text-[#4C1D95] leading-[0.85] italic mb-6">
            FINISH<br />THINGS
          </h1>
          <p className="text-sm italic font-serif opacity-70 leading-snug">
            "Structure is not the destination, but the vessel through which the sun speaks to the interior."
          </p>
        </div>
        
        <div className="flex flex-col gap-2 max-w-sm md:border-l border-[#4C1D95] md:pl-8 text-right md:text-left">
          <p className="text-xs leading-relaxed text-[#4C1D95]/80 mb-4">
            Exploring the intersection of raw focus and the ephemeral nature of time. An AI-powered companion that turns overwhelming task lists into clear, prioritized, actionable plans.
          </p>
          <div className="flex flex-col gap-1 items-end md:items-start text-[10px] font-bold uppercase tracking-widest text-[#4C1D95]/60">
            <span><Brain size={12} className="inline mr-2" /> AI Prioritization</span>
            <span><Calendar size={12} className="inline mr-2" /> Smart Scheduling</span>
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
          <button onClick={() => handleSendChat("Activate emergency compressed schedule for my imminent tasks.")} className="mt-4 md:mt-0 px-6 py-2 border-2 border-white font-bold uppercase tracking-widest hover:bg-white hover:text-red-500 transition-colors text-sm">
            Fix My Day
          </button>
        </div>
      )}

      {/* Advanced Dashboard Cards */}
      <div className="grid grid-cols-2 lg:grid-cols-5 gap-4 mt-8 mb-12">
        <div className="bg-[#4C1D95] text-[#FAF5FF] p-5 shadow-xl relative overflow-hidden group">
          <div className="text-4xl font-serif italic mb-2 relative z-10">{urgentTodayCount}</div>
          <div className="text-[10px] font-bold uppercase tracking-widest opacity-70 relative z-10 flex items-center gap-1.5"><AlertCircle size={12}/> Urgent Today</div>
          <div className="absolute -right-4 -bottom-4 text-white/5 opacity-50 group-hover:scale-110 transition-transform duration-500">
            <AlertCircle size={100} />
          </div>
        </div>

        <div className="bg-[#FAF5FF] border border-[#4C1D95]/20 p-5 relative overflow-hidden group">
          <div className="text-4xl font-serif italic mb-2 relative z-10 text-[#4C1D95]">{highRiskCount}</div>
          <div className="text-[10px] font-bold uppercase tracking-widest text-[#4C1D95]/60 relative z-10 flex items-center gap-1.5"><AlertTriangle size={12}/> High Risk Tasks</div>
          <div className="absolute -right-4 -bottom-4 text-[#4C1D95]/5 group-hover:scale-110 transition-transform duration-500">
            <AlertTriangle size={100} />
          </div>
        </div>

        <div className="bg-[#FAF5FF] border border-[#4C1D95]/20 p-5 relative overflow-hidden group">
          <div className="text-4xl font-serif italic mb-2 relative z-10 text-[#4C1D95]">{totalTimeReq.toFixed(1)}h</div>
          <div className="text-[10px] font-bold uppercase tracking-widest text-[#4C1D95]/60 relative z-10 flex items-center gap-1.5"><Clock size={12}/> Total Time Req.</div>
          <div className="absolute -right-4 -bottom-4 text-[#4C1D95]/5 group-hover:scale-110 transition-transform duration-500">
            <Clock size={100} />
          </div>
        </div>

        <div className="bg-[#FAF5FF] border border-[#4C1D95]/20 p-5 relative overflow-hidden group">
          <div className="text-4xl font-serif italic mb-2 relative z-10 text-[#4C1D95]">{completionRate}%</div>
          <div className="text-[10px] font-bold uppercase tracking-widest text-[#4C1D95]/60 relative z-10 flex items-center gap-1.5"><Trophy size={12}/> Completion Rate</div>
          <div className="absolute -right-4 -bottom-4 text-[#4C1D95]/5 group-hover:scale-110 transition-transform duration-500">
            <Trophy size={100} />
          </div>
        </div>

        <div className="bg-gradient-to-br from-[#4C1D95] to-[#9333EA] text-[#FAF5FF] border border-[#4C1D95]/20 p-5 relative overflow-hidden group col-span-2 lg:col-span-1">
          <div className="text-[10px] font-bold uppercase tracking-widest opacity-70 mb-2 flex items-center gap-1.5"><Brain size={12}/> AI Insight</div>
          <p className="text-xs font-serif italic leading-relaxed z-10 relative">
            {urgentTodayCount > 3 ? "You have many tasks tonight. Consider moving two to tomorrow." : "You're on track. Focus on one task at a time."}
          </p>
          <div className="absolute -right-4 -bottom-4 text-white/5 opacity-50 group-hover:scale-110 transition-transform duration-500">
            <Brain size={100} />
          </div>
        </div>
      </div>

      {/* Main Grid */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 items-start">
        {/* Left Column: Tasks */}
        <div className="lg:col-span-7 space-y-6">
          <div className="flex items-center justify-between">
            <div>
              <h2 className="text-4xl md:text-5xl font-serif italic font-normal text-[#4C1D95]">Your Tasklist</h2>
              <p className="text-xs text-[#4C1D95]/60 mt-1">Sorted dynamically by urgency and AI priority</p>
            </div>
            <button
              id="btn-add-task-toggle"
              onClick={toggleAddForm}
              className="btn flex items-center gap-2 px-4 py-2 bg-[#4C1D95] hover:bg-[#4C1D95]/90 text-[#FAF5FF] rounded-none text-sm font-bold uppercase tracking-widest text-[10px] transition-all shadow-xs cursor-pointer"
            >
              <Plus size={16} /> Add Task
            </button>
          </div>

          {/* Add Task Form Card */}
          {showAddForm && (
            <div id="add-task-card" className="bg-[#FAF5FF] border border-[#4C1D95]/20 rounded-none p-6 shadow-sm transition-all animate-fadeIn">
              <h3 className="flex items-center gap-2 text-2xl font-serif italic font-normal text-[#4C1D95] mb-5">
                <Plus size={18} className="text-[#4C1D95]" /> New Task
              </h3>
              <form onSubmit={handleAddTask} className="space-y-4">
                <div className="flex flex-col gap-1.5">
                  <label className="text-xs font-medium uppercase tracking-wider text-[10px] text-[#4C1D95]">Task Name</label>
                  <input
                    id="input-task-name"
                    type="text"
                    required
                    placeholder="e.g. Submit chemistry laboratory report"
                    value={taskName}
                    onChange={(e) => setTaskName(e.target.value)}
                    className="px-3.5 py-2.5 bg-[#FAF5FF] border border-[#4C1D95]/20 rounded-none text-sm text-[#4C1D95] outline-hidden focus:border-[#4C1D95]/40 transition-colors"
                  />
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  <div className="flex flex-col gap-1.5">
                    <label className="text-xs font-medium uppercase tracking-wider text-[10px] text-[#4C1D95]">Deadline</label>
                    <input
                      id="input-task-deadline"
                      type="datetime-local"
                      required
                      value={taskDeadline}
                      onChange={(e) => setTaskDeadline(e.target.value)}
                      className="px-3.5 py-2.5 bg-[#FAF5FF] border border-[#4C1D95]/20 rounded-none text-sm text-[#4C1D95] outline-hidden focus:border-[#4C1D95]/40 transition-colors"
                    />
                  </div>

                  <div className="flex flex-col gap-1.5">
                    <label className="text-xs font-medium uppercase tracking-wider text-[10px] text-[#4C1D95]">Category</label>
                    <select
                      id="select-task-category"
                      value={taskCategory}
                      onChange={(e) => setTaskCategory(e.target.value as Task["category"])}
                      className="px-3.5 py-2.5 bg-[#FAF5FF] border border-[#4C1D95]/20 rounded-none text-sm text-[#4C1D95] outline-hidden focus:border-[#4C1D95]/40 transition-colors cursor-pointer"
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
                    <label className="text-xs font-medium uppercase tracking-wider text-[10px] text-[#4C1D95]">Estimated Duration</label>
                    <select
                      id="select-task-duration"
                      value={taskEstimatedTime}
                      onChange={(e) => setTaskEstimatedTime(e.target.value)}
                      className="px-3.5 py-2.5 bg-[#FAF5FF] border border-[#4C1D95]/20 rounded-none text-sm text-[#4C1D95] outline-hidden focus:border-[#4C1D95]/40 transition-colors cursor-pointer"
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
                    <label className="text-xs font-medium uppercase tracking-wider text-[10px] text-[#4C1D95]">AI Urgency Priority</label>
                    <select
                      id="select-task-priority"
                      value={taskPriority}
                      onChange={(e) => setTaskPriority(e.target.value as "auto" | Task["priority"])}
                      className="px-3.5 py-2.5 bg-[#FAF5FF] border border-[#4C1D95]/20 rounded-none text-sm text-[#4C1D95] outline-hidden focus:border-[#4C1D95]/40 transition-colors cursor-pointer"
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
                  <label className="text-xs font-medium uppercase tracking-wider text-[10px] text-[#4C1D95]">Detailed Notes / Extra Context</label>
                  <textarea
                    id="input-task-notes"
                    placeholder="Provide additional details or attachments info to assist Gemini during smart prioritization..."
                    value={taskNotes}
                    onChange={(e) => setTaskNotes(e.target.value)}
                    rows={2}
                    className="px-3.5 py-2.5 bg-[#FAF5FF] border border-[#4C1D95]/20 rounded-none text-sm text-[#4C1D95] outline-hidden focus:border-[#4C1D95]/40 transition-colors resize-y"
                  />
                </div>

                <div className="flex gap-2.5 pt-3">
                  <button
                    id="btn-add-task-submit"
                    type="submit"
                    disabled={isSubmitting}
                    className="flex items-center gap-2 px-5 py-2.5 bg-[#4C1D95] hover:bg-[#4C1D95]/90 text-[#FAF5FF] rounded-none text-sm font-bold uppercase tracking-widest text-[10px] transition-all shadow-xs cursor-pointer disabled:opacity-50"
                  >
                    {isSubmitting ? (
                      <RefreshCw size={14} className="animate-spin" />
                    ) : (
                      <Sparkles size={14} className="text-[#4C1D95]" />
                    )}
                    Add & Prioritize Task
                  </button>
                  <button
                    id="btn-add-task-cancel"
                    type="button"
                    onClick={toggleAddForm}
                    className="px-5 py-2.5 border border-[#4C1D95]/20 hover:bg-[#4C1D95]/5 text-[#4C1D95] rounded-none text-sm font-bold uppercase tracking-widest text-[10px] transition-all cursor-pointer"
                  >
                    Cancel
                  </button>
                </div>
              </form>
            </div>
          )}

          {/* Quick Category Filters */}
          <div className="flex gap-1.5 overflow-x-auto pb-2 scrollbar-none flex-wrap">
            {[
              { id: "all", label: "All Tasks", icon: <Compass size={14} /> },
              { id: "work", label: "Work", icon: CAT_ICONS.work },
              { id: "study", label: "Study", icon: CAT_ICONS.study },
              { id: "personal", label: "Personal", icon: CAT_ICONS.personal },
              { id: "health", label: "Health", icon: CAT_ICONS.health },
              { id: "finance", label: "Finance", icon: CAT_ICONS.finance },
              { id: "completed", label: "Done", icon: <CheckCircle size={14} /> },
            ].map((chip) => (
              <button
                key={chip.id}
                id={`filter-chip-${chip.id}`}
                onClick={() => setCategoryFilter(chip.id)}
                className={`flex items-center gap-1.5 px-3.5 py-1.5 border rounded-none text-xs font-bold uppercase tracking-widest text-[10px] transition-all cursor-pointer ${
                  categoryFilter === chip.id
                    ? "bg-[#4C1D95] border-[#4C1D95] text-[#FAF5FF]"
                    : "bg-[#FAF5FF] border-[#4C1D95]/20 text-[#4C1D95]/60 hover:border-[#4C1D95]/30"
                }`}
              >
                {chip.icon}
                <span>{chip.label}</span>
              </button>
            ))}
          </div>

          {/* Task List */}
          <div className="space-y-3.5" id="task-list-container">
            {filteredTasks.length === 0 ? (
              <div className="text-center py-16 bg-[#FAF5FF] border border-[#4C1D95]/15 rounded-none">
                <div className="w-12 h-12 bg-[#FAF5FF] border border-[#4C1D95]/20 text-[#4C1D95]/40 rounded-none flex items-center justify-center mx-auto mb-3">
                  <CheckCircle size={20} />
                </div>
                <h3 className="font-bold uppercase tracking-widest text-[10px] text-[#4C1D95] text-base">You are all clear</h3>
                <p className="text-xs text-[#4C1D95]/40 mt-1">No pending actions found in this segment.</p>
              </div>
            ) : (
              filteredTasks.map((task) => {
                const dl = getDeadlineStatus(task.deadline);
                const accentBorder = {
                  critical: "border-l-red-500",
                  high: "border-l-orange-500",
                  medium: "border-l-amber-500",
                  low: "border-l-emerald-500",
                }[task.priority];

                const tagBg = {
                  critical: "bg-[#4C1D95]/10 text-[#4C1D95] border-[#4C1D95]",
                  high: "bg-[#4C1D95]/5 text-[#4C1D95]/80 border-[#4C1D95]/60",
                  medium: "bg-[#4C1D95] text-[#FAF5FF] border-[#4C1D95]",
                  low: "bg-[#4C1D95]/5 text-[#4C1D95] border-[#4C1D95]/40",
                }[task.priority];

                return (
                  <div
                    key={task.id}
                    className={`bg-[#FAF5FF] border border-[#4C1D95]/20 border-l-4 ${accentBorder} rounded-none p-4 transition-all hover:border-[#4C1D95]/30 hover:shadow-xs flex flex-col gap-3 relative overflow-hidden ${
                      task.completed ? "opacity-60" : ""
                    }`}
                  >
                    <div className="flex items-start justify-between gap-4">
                      <div className="flex items-start gap-3">
                        <button
                          id={`task-check-${task.id}`}
                          onClick={() => handleToggleComplete(task.id)}
                          className={`w-5 h-5 rounded-none border-2 flex items-center justify-center mt-0.5 cursor-pointer transition-colors ${
                            task.completed
                              ? "bg-[#4C1D95]/20 border-[#4C1D95]/40 text-[#4C1D95]"
                              : "border-[#4C1D95]/20 hover:border-[#4C1D95]"
                          }`}
                        >
                          {task.completed && <Check size={12} strokeWidth={3} />}
                        </button>
                        <div>
                          <h4
                            className={`font-medium uppercase tracking-wider text-[10px] text-[#4C1D95] text-sm leading-snug ${
                              task.completed ? "line-through text-[#4C1D95]/40" : ""
                            }`}
                          >
                            {task.name}
                          </h4>
                          <div className="flex items-center gap-3 text-xs text-[#4C1D95]/40 mt-1.5 flex-wrap">
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
                              <span className="text-[#FAF5FF] bg-[#4C1D95] px-1.5 py-0.5 rounded text-[10px] font-bold uppercase tracking-widest text-[10px]">
                                AI: {task.suggestedStart}
                              </span>
                            )}
                          </div>
                        </div>
                      </div>

                      <div className="flex items-center gap-1 flex-shrink-0">
                        <span className={`text-[10px] font-bold uppercase tracking-widest text-[10px] uppercase tracking-wider px-2 py-0.5 rounded-none border ${tagBg}`}>
                          {PRIORITY_LABELS[task.priority]}
                        </span>
                        <button
                          id={`task-prioritize-btn-${task.id}`}
                          onClick={() => prioritizeTaskWithAi(task)}
                          title="Recalculate AI Priority"
                          className="p-1.5 text-[#4C1D95]/40 hover:text-[#4C1D95] hover:bg-[#FAF5FF] border border-[#4C1D95]/10 rounded-none transition-colors cursor-pointer"
                        >
                          <RefreshCw size={14} />
                        </button>
                        <button
                          id={`task-delete-btn-${task.id}`}
                          onClick={() => handleDeleteTask(task.id)}
                          title="Delete Task"
                          className="p-1.5 text-[#4C1D95]/40 hover:text-[#4C1D95] hover:bg-[#4C1D95]/10 rounded-none transition-colors cursor-pointer"
                        >
                          <Trash2 size={14} />
                        </button>
                      </div>
                    </div>

                    {/* AI Coach note context */}
                    {task.aiNote && (
                      <div className="bg-[#FAF5FF] border border-[#4C1D95]/10 border-l-2 border-[#4C1D95]/40 rounded-none-lg py-2 px-3 flex gap-2 items-start text-xs text-[#4C1D95]/80 leading-relaxed">
                        <Bot size={14} className="text-[#4C1D95]/60 mt-0.5 flex-shrink-0" />
                        <span>{task.aiNote}</span>
                      </div>
                    )}

                    {/* Static standard notes block */}
                    {task.notes && (
                      <div className="text-xs text-[#4C1D95]/40 italic bg-[#FAF5FF] border border-[#4C1D95]/10/50 p-2.5 rounded-none border border-[#4C1D95]/10 leading-relaxed">
                        <strong>Context Note: </strong> {task.notes}
                      </div>
                    )}
                  </div>
                );
              })
            )}

            {tasks.filter((t) => !t.completed).length > 0 && (
              <div className="text-center pt-2" id="re-prioritize-all-wrap">
                <button
                  id="btn-reprioritize-all"
                  onClick={prioritizeAllWithAi}
                  className="inline-flex items-center gap-2 px-4.5 py-2 border border-[#4C1D95]/20 hover:border-[#4C1D95]/30 hover:bg-[#FAF5FF] border border-[#4C1D95]/10 text-[#4C1D95]/80 rounded-none text-xs font-medium uppercase tracking-wider text-[10px] transition-all cursor-pointer"
                >
                  <RefreshCw size={13} /> Re-prioritize All with Gemini
                </button>
              </div>
            )}
          </div>
        </div>

        {/* Right Column: AI Assistant Panel */}
        <div className="lg:col-span-5">
          <div className="bg-[#FAF5FF] border border-[#4C1D95]/20 rounded-none shadow-xs overflow-hidden flex flex-col h-[580px]" id="ai-chat-panel">
            {/* Panel Title */}
            <div className="bg-[#4C1D95] px-5 py-4 flex items-center justify-between text-[#FAF5FF]">
              <div className="flex items-center gap-2">
                <Bot size={18} className="text-[#FAF5FF]" />
                <span className="font-bold uppercase tracking-widest text-[10px] text-sm tracking-tight">LifeSaver Coach AI</span>
              </div>
              <span className="text-[10px] bg-[#4C1D95] text-[#FAF5FF] px-2 py-0.5 rounded-none font-bold uppercase tracking-widest text-[10px]">ACTIVE</span>
            </div>

            {/* Quick Actions Suggestions */}
            <div className="px-4 py-3 bg-[#FAF5FF] border border-[#4C1D95]/10 border-b border-[#4C1D95]/10 flex flex-col gap-1.5 flex-shrink-0">
              <button
                id="btn-quick-focus"
                onClick={() => handleSendChat("What should I focus on right now based on my tasks?")}
                className="flex items-center gap-2 text-left p-2 bg-[#FAF5FF] hover:bg-[#4C1D95]/5 border border-[#4C1D95]/20 rounded-none text-xs text-[#4C1D95]/80 font-medium uppercase tracking-wider text-[10px] transition-all cursor-pointer"
              >
                <Compass size={13} className="text-[#4C1D95]/40" /> What should I focus on right now?
              </button>
              <button
                id="btn-quick-plan"
                onClick={() => handleSendChat("Give me an optimized hourly productivity plan for today based on my active tasks.")}
                className="flex items-center gap-2 text-left p-2 bg-[#FAF5FF] hover:bg-[#4C1D95]/5 border border-[#4C1D95]/20 rounded-none text-xs text-[#4C1D95]/80 font-medium uppercase tracking-wider text-[10px] transition-all cursor-pointer"
              >
                <Calendar size={13} className="text-[#4C1D95]/40" /> Plan my day step-by-step
              </button>
              <button
                id="btn-quick-overdue"
                onClick={() => handleSendChat("Are any of my tasks at serious risk of being missed? What are your recommendations?")}
                className="flex items-center gap-2 text-left p-2 bg-[#FAF5FF] hover:bg-[#4C1D95]/5 border border-[#4C1D95]/20 rounded-none text-xs text-[#4C1D95]/80 font-medium uppercase tracking-wider text-[10px] transition-all cursor-pointer"
              >
                <AlertTriangle size={13} className="text-[#4C1D95]/40" /> What am I at risk of missing?
              </button>
              <button
                id="btn-quick-motivation"
                onClick={() => handleSendChat("I am feeling incredibly overwhelmed with my work. Give me a strong motivational push.")}
                className="flex items-center gap-2 text-left p-2 bg-[#FAF5FF] hover:bg-[#4C1D95]/5 border border-[#4C1D95]/20 rounded-none text-xs text-[#4C1D95]/80 font-medium uppercase tracking-wider text-[10px] transition-all cursor-pointer"
              >
                <Rocket size={13} className="text-[#4C1D95]/40" /> I need a motivational push
              </button>
            </div>

            {/* Chat message listing */}
            <div className="flex-1 p-4 overflow-y-auto space-y-4" id="chat-messages-container">
              {chatMessages.map((msg) => (
                <div key={msg.id} className={`flex gap-2.5 items-start ${msg.role === "user" ? "flex-row-reverse" : ""}`}>
                  <div
                    className={`w-8 h-8 rounded-none flex items-center justify-center flex-shrink-0 ${
                      msg.role === "ai"
                        ? "bg-[#4C1D95] text-[#FAF5FF]"
                        : "bg-[#4C1D95] text-[#FAF5FF] font-bold uppercase tracking-widest text-[10px] text-xs"
                    }`}
                  >
                    {msg.role === "ai" ? <Bot size={15} /> : "ME"}
                  </div>
                  <div
                    className={`p-3 rounded-none text-xs leading-relaxed max-w-[80%] ${
                      msg.role === "ai"
                        ? "bg-[#4C1D95]/5 text-[#4C1D95] rounded-none-none border border-[#4C1D95]/20"
                        : "bg-[#4C1D95] text-[#FAF5FF] rounded-none-none"
                    }`}
                  >
                    <p>{msg.text}</p>
                    <span className="block text-[9px] text-[#4C1D95]/40 mt-1 text-right">{msg.timestamp}</span>
                  </div>
                </div>
              ))}

              {isChatLoading && (
                <div className="flex gap-2.5 items-start">
                  <div className="w-8 h-8 rounded-none bg-[#4C1D95] text-[#FAF5FF] flex items-center justify-center flex-shrink-0 animate-pulse">
                    <Bot size={15} />
                  </div>
                  <div className="p-3 bg-[#4C1D95]/5 border border-[#4C1D95]/20 rounded-none rounded-none-none flex items-center gap-1.5 py-4">
                    <div className="w-2 h-2 bg-slate-400 rounded-none animate-bounce" />
                    <div className="w-2 h-2 bg-slate-400 rounded-none animate-bounce [animation-delay:0.2s]" />
                    <div className="w-2 h-2 bg-slate-400 rounded-none animate-bounce [animation-delay:0.4s]" />
                  </div>
                </div>
              )}
              <div ref={chatEndRef} />
            </div>

            {/* Chat input box */}
            <div className="p-3 bg-[#FAF5FF] border border-[#4C1D95]/10 border-t border-[#4C1D95]/15 flex items-center gap-2 flex-shrink-0">
              <input
                id="chat-input-field"
                type="text"
                placeholder="Ask anything about your tasks..."
                value={chatInput}
                onChange={(e) => setChatInput(e.target.value)}
                onKeyDown={(e) => e.key === "Enter" && handleSendChat()}
                className="flex-1 px-3.5 py-2.5 bg-[#FAF5FF] border border-[#4C1D95]/20 rounded-none text-xs text-[#4C1D95] outline-hidden focus:border-[#4C1D95]/30 transition-colors"
              />
              <button
                id="chat-send-btn"
                onClick={() => handleSendChat()}
                className="p-2.5 bg-[#4C1D95] hover:bg-[#4C1D95]/90 text-[#FAF5FF] rounded-none transition-colors cursor-pointer flex-shrink-0"
              >
                <Send size={14} />
              </button>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
