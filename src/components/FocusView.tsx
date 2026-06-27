import { customFetch } from "../lib/api";
import React, { useState, useRef, useEffect } from "react";
import { motion, AnimatePresence } from "motion/react";
import { getTranslation } from "../lib/i18n";
import { useLanguage } from "../lib/LanguageContext";
import { Play, Pause, RefreshCw, Trophy, Clock, History, HelpCircle, Sparkles, Bot, AlertCircle, Volume2, VolumeX } from "lucide-react";
import { Task, FocusSession } from "../types";
import { playClickSound } from "../lib/audio";

const MOODS = [
  { emoji: "🤩", label: "Energetic" },
  { emoji: "🙂", label: "Good" },
  { emoji: "😐", label: "Neutral" },
  { emoji: "😫", label: "Tired" },
  { emoji: "😰", label: "Anxious" }
];

const PRIORITY_LABELS: Record<string, string> = {
  critical: "Critical",
  high: "High",
  medium: "Medium",
  low: "Low",
};

interface FocusViewProps {
  tasks: Task[];
  focusSessions: FocusSession[];
  showToast: (iconName: string, message: string) => void;
  timeLeft: number;
  setTimeLeft: React.Dispatch<React.SetStateAction<number>>;
  totalTime: number;
  setTotalTime: React.Dispatch<React.SetStateAction<number>>;
  isRunning: boolean;
  setIsRunning: React.Dispatch<React.SetStateAction<boolean>>;
  timerMode: string;
  setTimerMode: React.Dispatch<React.SetStateAction<string>>;
  selectedTaskId: string;
  setSelectedTaskId: React.Dispatch<React.SetStateAction<string>>;
}

export default function FocusView({
  tasks,
  focusSessions,
  showToast,
  timeLeft,
  setTimeLeft,
  totalTime,
  setTotalTime,
  isRunning,
  setIsRunning,
  timerMode,
  setTimerMode,
  selectedTaskId,
  setSelectedTaskId,
}: FocusViewProps) {
  const { language } = useLanguage();
  const [focusTip, setFocusTip] = useState<string | null>(null);
  const [isLoadingTip, setIsLoadingTip] = useState(false);
  
  const [selectedMood, setSelectedMood] = useState<string | null>(null);

  // Switch presets helper
  const setTimerPreset = (min: number, label: string) => {
    playClickSound();
    setIsRunning(false);
    setTimeLeft(min * 60);
    setTotalTime(min * 60);
    setTimerMode(label);
  };

  // Reset timer helper
  const resetTimer = () => {
    playClickSound();
    setIsRunning(false);
    setTimeLeft(totalTime);
  };

  const toggleTimer = () => {
    playClickSound();
    setIsRunning(!isRunning);
  };


  // Hit focus tip API
  const getFocusTip = async (mood?: string) => {
    const selectedTask = tasks.find((t) => t.id.toString() === selectedTaskId);
    const taskNameContext = selectedTask ? selectedTask.name : (selectedTaskId || "General Work Focus");

    setIsLoadingTip(true);
    try {
      const response = await customFetch("/api/focus-tip", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ taskName: taskNameContext, mood: mood || selectedMood }),
      });

      if (!response.ok) {
        throw new Error("Failed to query focus tip");
      }

      const data = await response.json();
      setFocusTip(data.tip);
    } catch (err) {
      console.error(err);
      setFocusTip("Offline helper tip: Block all internet tabs for exactly 25 minutes using an environment blocker or focus mode.");
    } finally {
      setIsLoadingTip(false);
    }
  };

  // Display calculations
  const minutes = Math.floor(timeLeft / 60).toString().padStart(2, "0");
  const seconds = (timeLeft % 60).toString().padStart(2, "0");
  const progressPercent = (timeLeft / totalTime) * 100;

  const handleMoodSelect = (mood: string) => {
    setSelectedMood(mood);
    getFocusTip(mood);
  };

  // Active tasks context filter
  const pendingTasks = tasks.filter((t) => !t.completed);

  // Daily stats summaries
  const today = new Date().toDateString();
  const todaySessions = focusSessions.filter(s => new Date(s.completedAt).toDateString() === today);
  const todaySessionsCount = todaySessions.length;
  const todayMinutesCount = todaySessions.reduce((acc, curr) => acc + curr.duration, 0);

  return (
    <div className="space-y-6">
      <div className="flex flex-col md:flex-row md:items-end justify-between gap-4 border-b border-[var(--color-brand-dark)] pb-6 mb-10">
        <div>
          <div className="flex items-center space-x-4 mb-2">
            <div className="h-[1px] w-8 bg-[var(--color-brand-dark)]"></div>
            <span className="text-[10px] font-bold uppercase tracking-widest">{getTranslation(language, 'deepWork') || "Deep Work"}</span>
          </div>
          <h2 className="text-5xl md:text-6xl font-serif italic font-normal text-[var(--color-brand-dark)]">{getTranslation(language, 'focusMode') || "Focus Mode"}</h2>
        </div>
        <p className="text-xs text-[var(--color-brand-dark)]/60 max-w-sm text-left md:text-right">Pomodoro cognitive deep work blocks. Shut out noise, enter code-flow state.</p>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 items-start">
        {/* Left Column: Interactive Timer */}
        <div className="lg:col-span-7 bg-[var(--color-brand-white)] border border-[var(--color-brand-dark)]/20 rounded-[14px] p-6 md:p-10 shadow-2xs text-center flex flex-col items-center">
          <div className="relative flex justify-center items-center w-[260px] h-[260px] md:w-[320px] md:h-[320px] my-4 md:my-8">
            <svg className="absolute inset-0 w-full h-full -rotate-90 transform" viewBox="0 0 320 320">
              <circle
                cx="160"
                cy="160"
                r="150"
                fill="transparent"
                stroke="currentColor"
                strokeWidth="8"
                className="text-[var(--color-brand-dark)]/5"
              />
              <motion.circle
                cx="160"
                cy="160"
                r="150"
                fill="transparent"
                stroke="currentColor"
                strokeWidth="8"
                strokeLinecap="round"
                className="text-[var(--color-brand-dark)] drop-shadow-sm"
                initial={{ strokeDasharray: 942, strokeDashoffset: 942 }}
                animate={{ strokeDashoffset: 942 - (942 * progressPercent) / 100 }}
                transition={{ duration: 1, ease: "linear" }}
              />
            </svg>
            <div className="flex flex-col items-center z-10">
              <motion.div 
                animate={isRunning ? { scale: [1, 1.02, 1] } : { scale: 1 }}
                transition={{ duration: 2, repeat: Infinity, ease: "easeInOut" }}
                className="text-6xl md:text-8xl font-black text-[var(--color-brand-dark)] tracking-tighter tabular-nums" 
                id="timer-numbers"
              >
                {minutes}:{seconds}
              </motion.div>
              <div className="text-xs font-bold uppercase tracking-widest text-[10px] uppercase tracking-widest text-[var(--color-brand-dark)]/40 mt-3" id="timer-mode-label">
                {timerMode}
              </div>
            </div>
          </div>

          {/* Action buttons */}
          {!isRunning && timeLeft === totalTime && (
            <div className="mb-4 text-center">
              <p className="text-[10px] font-bold uppercase tracking-widest text-[var(--color-brand-dark)]/60 mb-2">Check-in: How are you feeling?</p>
              <div className="flex gap-2 justify-center">
                {MOODS.map(m => (
                  <button 
                    key={m.label} 
                    onClick={() => handleMoodSelect(m.label)}
                    className={`text-2xl hover:scale-110 transition-transform ${selectedMood === m.label ? 'ring-2 ring-[var(--color-brand-dark)] rounded-full' : 'opacity-50 hover:opacity-100'}`}
                    title={m.label}
                  >
                    {m.emoji}
                  </button>
                ))}
              </div>
            </div>
          )}

          <div className="flex gap-2.5 mt-8 flex-wrap justify-center">
            <button
              id="btn-timer-toggle"
              onClick={toggleTimer}
              className={`flex items-center gap-2 px-6 py-3 rounded-[14px] font-bold uppercase tracking-widest text-[10px] text-sm transition-all shadow-xs cursor-pointer ${
                isRunning
                  ? "bg-[var(--color-brand-dark)]/5 border border-[var(--color-brand-dark)]/20 text-[var(--color-brand-dark)] hover:bg-[var(--color-brand-dark)]/10"
                  : "bg-[var(--color-brand-dark)] hover:bg-[var(--color-brand-dark)]/90 text-[var(--color-text-on-dark)]"
              }`}
            >
              {isRunning ? <Pause size={16} /> : <Play size={16} />}
              <span>{isRunning ? "Pause Session" : (getTranslation(language, 'startFocus') || "Start Focus")}</span>
            </button>

            <button
              id="btn-timer-finish-early"
              onClick={() => {
                playClickSound();
                setIsRunning(false);
                setTimeout(() => {
                  setTimeLeft(1); // Set to 1 second
                  setIsRunning(true);
                }, 50);
              }}
              title="Finish Early"
              className="p-3 bg-[var(--color-brand-white)] border-[var(--color-brand-dark)]/10 rounded-[14px] transition-all cursor-pointer"
            >
              <Trophy size={16} />
            </button>
            <button
              id="btn-timer-reset"
              onClick={resetTimer}
              title="Reset Timer"
              className="p-3 bg-[var(--color-brand-white)] border-[var(--color-brand-dark)]/10 rounded-[14px] transition-all cursor-pointer"
            >
              <RefreshCw size={16} />
            </button>
          </div>

          <div className="flex flex-wrap gap-2 mt-6 justify-center items-center">
            <button
              id="preset-pomodoro"
              onClick={() => setTimerPreset(25, "Focus Session")}
              className="px-4 py-2 border border-[var(--color-brand-dark)]/20 hover:bg-[var(--color-brand-dark)]/5 rounded-[14px] text-[10px] font-bold uppercase tracking-widest text-[var(--color-brand-dark)]/80 cursor-pointer"
            >
              25 min focus
            </button>
            <button
              id="preset-short-break"
              onClick={() => setTimerPreset(5, "Short Break")}
              className="px-4 py-2 border border-[var(--color-brand-dark)]/20 hover:bg-[var(--color-brand-dark)]/5 rounded-[14px] text-[10px] font-bold uppercase tracking-widest text-[var(--color-brand-dark)]/80 cursor-pointer"
            >
              5 min break
            </button>
            <button
              id="preset-long-break"
              onClick={() => setTimerPreset(15, "Long Break")}
              className="px-4 py-2 border border-[var(--color-brand-dark)]/20 hover:bg-[var(--color-brand-dark)]/5 rounded-[14px] text-[10px] font-bold uppercase tracking-widest text-[var(--color-brand-dark)]/80 cursor-pointer"
            >
              15 min break
            </button>
            <div className="flex items-center gap-2">
              <input
                id="input-custom-time"
                type="number"
                min="1"
                max="120"
                placeholder="Custom"
                className="w-20 px-3 py-2 bg-transparent border border-[var(--color-brand-dark)]/20 rounded-[14px] text-[10px] font-bold text-center text-[var(--color-brand-dark)]/80 outline-hidden focus:border-[var(--color-brand-dark)]/40 transition-colors"
                onKeyDown={(e) => {
                  if (e.key === 'Enter') {
                    const val = parseInt((e.target as HTMLInputElement).value);
                    if (!isNaN(val) && val > 0) {
                      setTimerPreset(val, "Custom Session");
                      (e.target as HTMLInputElement).value = '';
                    }
                  }
                }}
              />
              <span className="text-[10px] font-bold uppercase tracking-widest text-[var(--color-brand-dark)]/60">min</span>
            </div>
          </div>

          {/* Linking to a specific task */}
          <div className="w-full border-t border-[var(--color-brand-dark)]/10 mt-8 pt-6 flex flex-col items-stretch text-left gap-4">
            <div className="flex flex-col gap-1.5">
              <label className="text-xs font-bold uppercase tracking-widest text-[10px] text-[var(--color-brand-dark)]">Link task to this session</label>
              <input
                id="input-focus-task"
                type="text"
                value={selectedTaskId}
                onChange={(e) => setSelectedTaskId(e.target.value)}
                placeholder="Type a custom task to focus on..."
                className="px-3.5 py-2.5 bg-[var(--color-brand-white)] border-[var(--color-brand-dark)]/30 transition-colors"
              />
            </div>

            <button
              id="btn-get-focus-tip"
              onClick={getFocusTip}
              disabled={isLoadingTip}
              className="w-full flex items-center justify-center gap-2 px-4 py-2 bg-[var(--color-brand-dark)]/5 border border-[var(--color-brand-dark)]/20 hover:bg-[var(--color-brand-dark)]/10 text-[var(--color-brand-dark)] rounded-[14px] text-xs font-bold uppercase tracking-widest text-[10px] transition-all cursor-pointer disabled:opacity-50"
            >
              {isLoadingTip ? (
                <RefreshCw size={13} className="animate-spin" />
              ) : (
                <Sparkles size={13} className="text-[var(--color-brand-dark)] animate-pulse" />
              )}
              Get AI Cognitive Focus Tip
            </button>

            {focusTip && (
              <div className="bg-[var(--color-brand-dark)] border border-[var(--color-brand-dark)] rounded-[14px] p-3.5 flex gap-2.5 items-start text-xs text-[var(--color-text-on-dark)] animate-fadeIn">
                <Bot size={16} className="text-[var(--color-text-on-dark)] flex-shrink-0 mt-0.5" />
                <p className="leading-relaxed font-medium uppercase tracking-wider text-[10px]">{focusTip}</p>
              </div>
            )}
          </div>
        </div>

        {/* Right Column: Focus Stats & Session Log */}
        <div className="lg:col-span-5 space-y-6">
          {/* Today's Focus metrics */}
          <div className="bg-[var(--color-brand-white)] border border-[var(--color-brand-dark)]/20 rounded-[14px] p-5 shadow-xs grid grid-cols-2 gap-4">
            <div className="bg-[var(--color-brand-white)] border border-[var(--color-brand-dark)]/10 p-4 rounded-[14px] text-center">
              <div className="text-3xl font-bold uppercase tracking-widest text-[11px] text-[var(--color-brand-dark)]" id="stats-sessions-count">
                {todaySessionsCount}
              </div>
              <div className="text-[10px] font-bold uppercase tracking-widest text-[10px] text-[var(--color-brand-dark)]/60 mt-1 uppercase tracking-wider">Blocks Done</div>
            </div>
            <div className="bg-[var(--color-brand-white)] border border-[var(--color-brand-dark)]/10 p-4 rounded-[14px] text-center">
              <div className="text-3xl font-bold uppercase tracking-widest text-[11px] text-[var(--color-brand-dark)] animate-pulse" id="stats-minutes-count">
                {todayMinutesCount}
              </div>
              <div className="text-[10px] font-bold uppercase tracking-widest text-[10px] text-[var(--color-brand-dark)]/60 mt-1 uppercase tracking-wider">Minutes Focus</div>
            </div>
          </div>

          {/* Log panel */}
          <div className="bg-[var(--color-brand-white)] border border-[var(--color-brand-dark)]/20 rounded-[14px] p-5 shadow-xs">
            <h3 className="flex items-center gap-2 text-2xl font-serif italic font-normal text-[var(--color-brand-dark)] mb-4">
              <History size={16} className="text-[var(--color-brand-dark)]/60" /> Focus Log History
            </h3>

            <div className="space-y-3.5 max-h-60 overflow-y-auto pr-1" id="focus-log-container">
              {focusSessions.length === 0 ? (
                <div className="text-center py-12 px-6 flex flex-col items-center">
                  <div className="w-20 h-20 mb-5 relative">
                    <div className="absolute inset-0 bg-[var(--color-brand-badge)]/20 rounded-full animate-pulse opacity-50"></div>
                    <div className="relative w-full h-full bg-[var(--color-brand-cream)] border-2 border-[var(--color-brand-dark)] rounded-full flex flex-col items-center justify-center transform -rotate-6">
                      <div className="w-1 absolute top-0 -mt-2 h-3 bg-[var(--color-brand-dark)] rounded-full"></div>
                      <div className="w-1 absolute top-0 -mt-2 h-3 bg-[var(--color-brand-dark)] rounded-full rotate-45 transform origin-bottom translate-x-2"></div>
                      <Play size={28} className="text-[var(--color-brand-dark)] ml-1" />
                    </div>
                  </div>
                  <h4 className="text-lg font-serif italic text-[var(--color-brand-dark)] mb-2">Ready to focus?</h4>
                  <p className="text-xs text-[var(--color-brand-dark)]/60 max-w-[220px] mb-6">
                    Start your first session to track your deep work and build momentum.
                  </p>
                  <button
                    onClick={() => {
                      playClickSound();
                      setIsRunning(true);
                    }}
                    className="px-5 py-2.5 bg-[var(--color-brand-dark)] text-[var(--color-text-on-dark)] rounded-[10px] font-bold uppercase tracking-widest text-[10px] hover:scale-105 transition-transform flex items-center gap-2 shadow-sm"
                  >
                    <Play size={14} />
                    Start Focusing
                  </button>
                </div>
              ) : todaySessions.length === 0 ? (
                <p className="text-xs text-[var(--color-brand-dark)]/40 text-center py-10 italic">
                  No blocks completed today. Ready to start your first session?
                </p>
              ) : (
                todaySessions.map((session) => (
                    <div key={session.id} className="bg-[var(--color-brand-white)] border border-[var(--color-brand-dark)]/15 p-3 rounded-[14px] flex items-center justify-between gap-3 text-xs">
                      <div className="flex items-center gap-2.5 min-w-0">
                        <Trophy size={14} className="text-[var(--color-brand-dark)] flex-shrink-0" />
                        <span className="font-medium uppercase tracking-wider text-[10px] text-[var(--color-brand-dark)] truncate block">{session.taskName}</span>
                      </div>
                      <span className="text-[var(--color-brand-dark)]/40 font-medium flex-shrink-0">
                        {session.duration} min &middot; {new Date(session.completedAt).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                      </span>
                    </div>
                ))
              )}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
