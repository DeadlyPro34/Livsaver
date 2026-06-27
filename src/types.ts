export interface Task {
  id: string;
  name: string;
  deadline: string;
  category: "work" | "study" | "personal" | "health" | "finance" | "other";
  estimatedTime: string;
  priority: "critical" | "high" | "medium" | "low";
  notes?: string;
  completed: boolean;
  aiNote?: string;
  suggestedStart?: string;
  addedAt: string;
  riskScore?: number;
  completionProbability?: number;
  subtasks?: { title: string; completed: boolean }[];
  missedDeadlineCount?: number;
  lastMissedDate?: string;
  blockedBy?: string[];
}

export interface UserEnergyProfile {
  morning: number;
  afternoon: number;
  evening: number;
}

export interface ScheduleBlock {
  id?: string;
  taskId?: string;
  completed?: boolean;
  time: string;
  task: string;
  duration: string;
  type: "focus" | "break" | "admin";
  color: string;
  tip: string;
}

export interface Habit {
  id: string;
  name: string;
  icon: string;
  streak: number;
  days: number[]; // 7 elements, 0 or 1 representing Mon-Sun
  lastUpdateWeek?: number;
}

export interface FocusSession {
  id: string;
  userId?: string;
  taskName: string;
  duration: number; // in minutes
  completedAt: string;
}

export interface ChatMessage {
  id: string;
  role: "user" | "ai";
  text: string;
  timestamp: string;
}
