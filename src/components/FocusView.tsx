import { customFetch } from "../lib/api";
import React, { useState } from "react";
import { Play, Pause, RefreshCw, Trophy, Clock, History, HelpCircle, Sparkles, Bot, AlertCircle } from "lucide-react";
import { Task, FocusSession } from "../types";
import { playClickSound } from "../lib/audio";

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
  const [focusTip, setFocusTip] = useState<string | null>(null);
  const [isLoadingTip, setIsLoadingTip] = useState(false);

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
  const getFocusTip = async () => {
    const selectedTask = tasks.find((t) => t.id.toString() === selectedTaskId);
    const taskNameContext = selectedTask ? selectedTask.name : (selectedTaskId || "General Work Focus");

    setIsLoadingTip(true);
    try {
      const response = await customFetch("/api/focus-tip", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ taskName: taskNameContext }),
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

  // Active tasks context filter
  const pendingTasks = tasks.filter((t) => !t.completed);

  // Daily stats summaries
  const todaySessionsCount = focusSessions.length;
  const todayMinutesCount = focusSessions.reduce((acc, curr) => acc + curr.duration, 0);

  return (
    <div className="space-y-6">
      <div className="flex flex-col md:flex-row md:items-end justify-between gap-4 border-b border-[var(--color-brand-dark)] pb-6 mb-10">
        <div>
          <div className="flex items-center space-x-4 mb-2">
            <div className="h-[1px] w-8 bg-[var(--color-brand-dark)]"></div>
            <span className="text-[10px] font-bold uppercase tracking-widest">Deep Work</span>
          </div>
          <h2 className="text-5xl md:text-6xl font-serif italic font-normal text-[var(--color-brand-dark)]">Focus Mode</h2>
        </div>
        <p className="text-xs text-[var(--color-brand-dark)]/60 max-w-sm text-left md:text-right">Pomodoro cognitive deep work blocks. Shut out noise, enter code-flow state.</p>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 items-start">
        {/* Left Column: Interactive Timer */}
        <div className="lg:col-span-7 bg-[#fff] border border-[var(--color-brand-dark)]/20 rounded-[14px] p-6 md:p-10 shadow-2xs text-center flex flex-col items-center">
          <div className="text-7xl md:text-8xl font-black text-[var(--color-brand-dark)] tracking-tighter tabular-nums" id="timer-numbers">
            {minutes}:{seconds}
          </div>
          <div className="text-xs font-bold uppercase tracking-widest text-[10px] uppercase tracking-widest text-[var(--color-brand-dark)]/40 mt-2" id="timer-mode-label">
            {timerMode}
          </div>

          {/* Progress bar */}
          <div className="w-full h-1.5 bg-[var(--color-brand-dark)]/5 rounded-[14px] mt-8 overflow-hidden relative border border-slate-50">
            <div
              id="timer-progress-bar"
              className="h-full bg-[var(--color-brand-dark)] rounded-[14px] transition-all duration-1000"
              style={{ width: `${progressPercent}%` }}
            />
          </div>

          {/* Action buttons */}
          <div className="flex gap-2.5 mt-8 flex-wrap justify-center">
            <button
              id="btn-timer-toggle"
              onClick={toggleTimer}
              className={`flex items-center gap-2 px-6 py-3 rounded-[14px] font-bold uppercase tracking-widest text-[10px] text-sm transition-all shadow-xs cursor-pointer ${
                isRunning
                  ? "bg-[var(--color-brand-dark)]/5 border border-[var(--color-brand-dark)]/20 text-[var(--color-brand-dark)] hover:bg-[var(--color-brand-dark)]/10"
                  : "bg-[var(--color-brand-dark)] hover:bg-[var(--color-brand-dark)]/90 text-[#fff]"
              }`}
            >
              {isRunning ? <Pause size={16} /> : <Play size={16} />}
              <span>{isRunning ? "Pause Session" : "Start Focus"}</span>
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
              className="p-3 bg-[#fff] border-[var(--color-brand-dark)]/10 rounded-[14px] transition-all cursor-pointer"
            >
              <Trophy size={16} />
            </button>
            <button
              id="btn-timer-reset"
              onClick={resetTimer}
              title="Reset Timer"
              className="p-3 bg-[#fff] border-[var(--color-brand-dark)]/10 rounded-[14px] transition-all cursor-pointer"
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
                className="px-3.5 py-2.5 bg-[#fff] border-[var(--color-brand-dark)]/30 transition-colors"
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
              <div className="bg-[var(--color-brand-dark)] border border-[var(--color-brand-dark)] rounded-[14px] p-3.5 flex gap-2.5 items-start text-xs text-[#fff] animate-fadeIn">
                <Bot size={16} className="text-[#fff] flex-shrink-0 mt-0.5" />
                <p className="leading-relaxed font-medium uppercase tracking-wider text-[10px]">{focusTip}</p>
              </div>
            )}
          </div>
        </div>

        {/* Right Column: Focus Stats & Session Log */}
        <div className="lg:col-span-5 space-y-6">
          {/* Today's Focus metrics */}
          <div className="bg-[#fff] border border-[var(--color-brand-dark)]/20 rounded-[14px] p-5 shadow-xs grid grid-cols-2 gap-4">
            <div className="bg-[#fff] border border-[var(--color-brand-dark)]/10 p-4 rounded-[14px] text-center">
              <div className="text-3xl font-bold uppercase tracking-widest text-[11px] text-[var(--color-brand-dark)]" id="stats-sessions-count">
                {todaySessionsCount}
              </div>
              <div className="text-[10px] font-bold uppercase tracking-widest text-[10px] text-[var(--color-brand-dark)]/60 mt-1 uppercase tracking-wider">Blocks Done</div>
            </div>
            <div className="bg-[#fff] border border-[var(--color-brand-dark)]/10 p-4 rounded-[14px] text-center">
              <div className="text-3xl font-bold uppercase tracking-widest text-[11px] text-[var(--color-brand-dark)] animate-pulse" id="stats-minutes-count">
                {todayMinutesCount}
              </div>
              <div className="text-[10px] font-bold uppercase tracking-widest text-[10px] text-[var(--color-brand-dark)]/60 mt-1 uppercase tracking-wider">Minutes Focus</div>
            </div>
          </div>

          {/* Log panel */}
          <div className="bg-[#fff] border border-[var(--color-brand-dark)]/20 rounded-[14px] p-5 shadow-xs">
            <h3 className="flex items-center gap-2 text-2xl font-serif italic font-normal text-[var(--color-brand-dark)] mb-4">
              <History size={16} className="text-[var(--color-brand-dark)]/60" /> Focus Log History
            </h3>

            <div className="space-y-3.5 max-h-60 overflow-y-auto pr-1" id="focus-log-container">
              {focusSessions.length === 0 ? (
                <p className="text-xs text-[var(--color-brand-dark)]/40 text-center py-10 italic">
                  No blocks completed yet. Ready to start your first Pomodoro session?
                </p>
              ) : (
                focusSessions.map((session) => (
                    <div key={session.id} className="bg-[#fff] border border-[var(--color-brand-dark)]/15 p-3 rounded-[14px] flex items-center justify-between gap-3 text-xs">
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
