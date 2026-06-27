import { customFetch } from "../lib/api";
import React, { useState } from "react";
import { Flame, Star, Sparkles, BookOpen, Heart, GlassWater, Moon, Brain, Plus, Check, RefreshCw } from "lucide-react";
import { Habit } from "../types";
import { playClickSound, playSuccessSound } from "../lib/audio";

interface HabitsViewProps {
  habits: Habit[];
  setHabits: React.Dispatch<React.SetStateAction<Habit[]>>;
  showToast: (iconName: string, message: string) => void;
}

const WEEK_DAYS = ["M", "T", "W", "T", "F", "S", "S"];

export default function HabitsView({ habits, setHabits, showToast }: HabitsViewProps) {
  const [newHabitName, setNewHabitName] = useState("");
  const [showAddForm, setShowAddForm] = useState(false);
  const [isAnalyzing, setIsAnalyzing] = useState(false);
  const [habitInsights, setHabitInsights] = useState<string[] | null>(null);

  // Toggle day completed
  const toggleDay = (habitId: string, dayIndex: number) => {
    let wasChecked = false;
    const updated = habits.map((h) => {
      if (h.id === habitId) {
        const nextDays = [...h.days];
        nextDays[dayIndex] = nextDays[dayIndex] === 1 ? 0 : 1;
        if (nextDays[dayIndex] === 1) wasChecked = true;

        // Calculate consecutive streak based on current week's status
        let maxStreak = 0;
        let currentRun = 0;
        for (let i = 0; i < nextDays.length; i++) {
          if (nextDays[i] === 1) {
            currentRun++;
            if (currentRun > maxStreak) maxStreak = currentRun;
          } else {
            currentRun = 0;
          }
        }

        return { ...h, days: nextDays, streak: maxStreak };
      }
      return h;
    });
    setHabits(updated);
    if (wasChecked) {
      playSuccessSound();
    } else {
      playClickSound();
    }
    showToast("Check", "Habit status updated");
  };

  // Add custom habit
  const handleAddHabit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!newHabitName.trim()) {
      showToast("AlertCircle", "Please enter a habit name");
      return;
    }

    const newHabit: Habit = {
      id: Date.now().toString(),
      name: newHabitName.trim(),
      icon: "Star",
      streak: 0,
      days: [0, 0, 0, 0, 0, 0, 0],
    };

    const updated = [...habits, newHabit];
    setHabits(updated);
    setNewHabitName("");
    setShowAddForm(false);
    showToast("CheckCircle", "New habit added");
  };

  // Delete habit
  const deleteHabit = (id: string) => {
    playClickSound();
    const updated = habits.filter((h) => h.id !== id);
    setHabits(updated);
    showToast("Trash2", "Habit deleted");
  };

  // Analyze Habits with AI
  const analyzeHabits = async () => {
    setIsAnalyzing(true);
    try {
      const response = await customFetch("/api/habit-insights", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ habits }),
      });

      if (!response.ok) {
        throw new Error("Failed to query habit analysis");
      }

      const data = await response.json();
      setHabitInsights(data.insights || []);
      showToast("Sparkles", "AI Habit Analysis loaded successfully!");
    } catch (err) {
      console.error(err);
      // Fallback offline suggestions
      setHabitInsights([
        "Consistency is key! Try placing a physical visual trigger in your workspace to remind you of your daily goals.",
        "Your streaks are doing great! Link study habits directly to your lunch routine to build instant triggers (habit stacking).",
        "Maintain focus on hydration! Keep a large glass of water directly beside your desk to ease friction of habit completion.",
      ]);
      showToast("AlertCircle", "AI service offline. Loaded standard consistency coaching.");
    } finally {
      setIsAnalyzing(false);
    }
  };

  return (
    <div className="space-y-6">
      <div className="flex flex-col md:flex-row md:items-end justify-between gap-4 border-b border-[var(--color-brand-dark)] pb-6 mb-10">
        <div>
          <div className="flex items-center space-x-4 mb-2">
            <div className="h-[1px] w-8 bg-[var(--color-brand-dark)]"></div>
            <span className="text-[10px] font-bold uppercase tracking-widest">Consistency</span>
          </div>
          <h2 className="text-5xl md:text-6xl font-serif italic font-normal text-[var(--color-brand-dark)]">Habits</h2>
        </div>
        <button
          id="btn-add-habit-toggle"
          onClick={() => setShowAddForm(!showAddForm)}
          className="flex items-center gap-2 px-6 py-3 bg-[#fff] border border-[var(--color-brand-dark)] hover:bg-[var(--color-brand-dark)] hover:text-[#fff] text-[var(--color-brand-dark)] text-[10px] font-bold uppercase tracking-widest transition-colors duration-300 cursor-pointer"
        >
          <Plus size={14} /> New Habit
        </button>
      </div>

      {showAddForm && (
        <form onSubmit={handleAddHabit} className="bg-[#fff] border border-[var(--color-brand-dark)]/20 p-4.5 rounded-[14px] flex gap-3 max-w-lg transition-all animate-fadeIn">
          <input
            id="input-new-habit-name"
            type="text"
            required
            placeholder="e.g. Meditate for 10 minutes"
            value={newHabitName}
            onChange={(e) => setNewHabitName(e.target.value)}
            className="flex-1 px-3.5 py-2.5 bg-[#fff] border-[var(--color-brand-dark)]/30 transition-colors"
          />
          <button
            id="btn-add-habit-submit"
            type="submit"
            className="px-4 py-2.5 bg-[var(--color-brand-dark)] hover:bg-[var(--color-brand-dark)]/90 text-[#fff] rounded-full text-xs font-bold uppercase tracking-widest text-[10px] transition-all cursor-pointer"
          >
            Create
          </button>
        </form>
      )}

      <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 items-start">
        {/* Left column: Habits Tracker matrix */}
        <div className="lg:col-span-8 bg-[#fff] border border-[var(--color-brand-dark)]/20 rounded-[14px] p-6 shadow-2xs">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between mb-6 gap-4">
            <h3 className="flex items-center gap-2 text-2xl font-serif italic font-normal text-[var(--color-brand-dark)]">
              <Flame size={18} className="text-[var(--color-brand-dark)]" /> Weekly Habit Matrix
            </h3>
            {/* Mon-Sun column headers */}
            <div className="hidden sm:flex gap-2">
              {WEEK_DAYS.map((day, idx) => (
                <div key={idx} className="w-8 text-center text-[10px] font-bold uppercase tracking-widest text-[10px] text-[var(--color-brand-dark)]/40">
                  {day}
                </div>
              ))}
              <div className="w-12 text-center text-[10px] font-bold uppercase tracking-widest text-[10px] text-[var(--color-brand-dark)]/40">STREAK</div>
            </div>
          </div>

          <div className="space-y-4" id="habits-matrix-container">
            {habits.length === 0 ? (
              <div className="text-center py-12 text-[var(--color-brand-dark)]/40">
                <p className="text-xs">No habits tracked yet. Click "New Habit" above to start!</p>
              </div>
            ) : (
              habits.map((habit) => (
                <div key={habit.id} className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 py-3 border-b border-slate-50 last:border-b-0">
                  <div className="flex-1 min-w-0 pr-2">
                    <span className="font-medium uppercase tracking-wider text-[10px] text-[var(--color-brand-dark)] text-xs sm:text-sm truncate block">{habit.name}</span>
                  </div>

                  <div className="flex items-center gap-2 overflow-x-auto pb-2 sm:pb-0 scrollbar-none w-full sm:w-auto">
                    {/* Checkboxes */}
                    {habit.days.map((dayVal, dayIdx) => (
                      <button
                        key={dayIdx}
                        id={`habit-cell-${habit.id}-${dayIdx}`}
                        onClick={() => toggleDay(habit.id, dayIdx)}
                        className={`w-8 h-8 rounded-[14px] border-2 flex items-center justify-center cursor-pointer transition-colors ${
                          dayVal === 1
                            ? "bg-[var(--color-brand-dark)]/20 border-[var(--color-brand-dark)]/40 text-[var(--color-brand-dark)]"
                            : "border-[var(--color-brand-dark)]/10 hover:border-[var(--color-brand-dark)] bg-[#fff] border border-[var(--color-brand-dark)]/10"
                        }`}
                      >
                        {dayVal === 1 && <Check size={12} strokeWidth={3} />}
                      </button>
                    ))}

                    {/* Streak indicator */}
                    <div className="w-12 flex items-center justify-center gap-1 font-bold uppercase tracking-widest text-[11px] text-[var(--color-brand-dark)] text-xs sm:text-sm">
                      <Flame size={14} fill="currentColor" />
                      <span>{habit.streak}d</span>
                    </div>

                    {/* Delete action */}
                    <button
                      id={`habit-delete-${habit.id}`}
                      onClick={() => deleteHabit(habit.id)}
                      className="p-1.5 text-slate-300 hover:text-[var(--color-brand-dark)] hover:bg-[var(--color-brand-dark)]/10 rounded-[14px] transition-colors cursor-pointer"
                    >
                      &times;
                    </button>
                  </div>
                </div>
              ))
            )}
          </div>
        </div>

        {/* Right column: AI habit insights coach */}
        <div className="lg:col-span-4">
          <div className="bg-[#fff] border border-[var(--color-brand-dark)]/20 rounded-[14px] p-5 shadow-xs flex flex-col gap-5">
            <div className="flex items-center gap-2">
              <Star size={18} className="text-[var(--color-brand-dark)]" />
              <h3 className="font-bold uppercase tracking-widest text-[10px] text-[var(--color-brand-dark)] text-sm">AI Habit Coach Insights</h3>
            </div>

            <button
              id="btn-analyze-habits"
              onClick={analyzeHabits}
              disabled={isAnalyzing}
              className="w-full flex items-center justify-center gap-2 px-4 py-2.5 bg-[var(--color-brand-dark)] hover:bg-[var(--color-brand-dark)]/90 text-[#fff] rounded-full text-xs font-bold uppercase tracking-widest text-[10px] transition-all cursor-pointer disabled:opacity-50"
            >
              {isAnalyzing ? (
                <RefreshCw size={13} className="animate-spin" />
              ) : (
                <Sparkles size={13} className="text-[var(--color-brand-dark)]" />
              )}
              Analyze My Habits
            </button>

            <div className="space-y-3.5 mt-2" id="habit-insights-container">
              {!habitInsights ? (
                <p className="text-xs text-[var(--color-brand-dark)]/60 text-center py-6">
                  Click above to get Gemini coaching insights on your weekly consistency.
                </p>
              ) : (
                habitInsights.map((insight, idx) => (
                  <div key={idx} className="bg-[#fff] border border-[var(--color-brand-dark)]/15 p-3.5 rounded-[14px] flex gap-2.5 items-start">
                    <Star size={14} className="text-[var(--color-brand-dark)] flex-shrink-0 mt-0.5" />
                    <p className="text-xs text-[var(--color-brand-dark)]/80 leading-relaxed font-medium">{insight}</p>
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
