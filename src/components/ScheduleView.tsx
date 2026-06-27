import { customFetch } from "../lib/api";
import React, { useState, useEffect } from "react";
import { motion, AnimatePresence } from "motion/react";
import { Sparkles, CalendarDays, Lightbulb, Clock, Info, AlertCircle, RefreshCw, Brain, CheckCircle, Check } from "lucide-react";
import { Task, ScheduleBlock } from "../types";

interface ScheduleViewProps {
  tasks: Task[];
  setTasks: React.Dispatch<React.SetStateAction<Task[]>>;
  showToast: (iconName: string, message: string) => void;
}

export default function ScheduleView({ tasks, setTasks, showToast }: ScheduleViewProps) {
  const [scheduleData, setScheduleData] = useState<{
    summary: string;
    schedule: ScheduleBlock[];
  } | null>(null);
  const [isLoading, setIsLoading] = useState(false);

  useEffect(() => {
    const savedSchedule = localStorage.getItem("lifesaver_schedule");
    if (savedSchedule) {
      setScheduleData(JSON.parse(savedSchedule));
    } else if (!scheduleData && tasks.length > 0) {
      generateSchedule();
    }
  }, []);

  const handleCompleteBlock = (blockIdx: number, taskId?: number) => {
    // If it has a taskId, complete the global task
    if (taskId) {
      setTasks((prev) => {
        const updated = prev.map((t) => (String(t.id) === String(taskId) ? { ...t, completed: true } : t));
        return updated;
      });
      showToast("CheckCircle", "Task marked as done!");
    } else {
      showToast("CheckCircle", "Block completed!");
    }

    // Always update local schedule UI
    setScheduleData((prev) => {
      if (!prev) return prev;
      const updatedSchedule = [...prev.schedule];
      updatedSchedule[blockIdx] = { ...updatedSchedule[blockIdx], completed: true };
      const newData = { ...prev, schedule: updatedSchedule };
      localStorage.setItem("lifesaver_schedule", JSON.stringify(newData));
      return newData;
    });
  };
  const generateSchedule = async () => {
    const pendingTasks = tasks.filter((t) => !t.completed);
    if (pendingTasks.length === 0) {
      showToast("AlertCircle", "Add some pending tasks first before scheduling!");
      return;
    }

    setIsLoading(true);
    try {
      const response = await customFetch("/api/schedule", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ tasks: pendingTasks }),
      });

      if (!response.ok) {
        throw new Error("Failed to generate schedule");
      }

      const data = await response.json();
      setScheduleData(data);
      localStorage.setItem("lifesaver_schedule", JSON.stringify(data));
      showToast("Sparkles", "AI organized schedule generated!");
    } catch (err) {
      console.error(err);
      // Fallback local schedule generator if API is offline
      const mockBlocks: ScheduleBlock[] = [
        {
          time: "09:00 AM",
          task: "Plan of Action & Coffee",
          duration: "15 min",
          type: "admin",
          color: "#475569",
          tip: "Outline exact micro-milestones.",
        },
        ...pendingTasks.map((t, idx) => {
          const hour = (10 + idx) % 12 || 12;
          const ampm = (10 + idx) >= 12 && (10 + idx) < 24 ? "PM" : "AM";
          return {
            taskId: t.id,
            time: `${hour}:00 ${ampm}`,
            task: `Autonomous Block: ${t.name}`,
            duration: t.estimatedTime || "1 hour",
            type: "focus" as const,
            color: t.priority === "critical" ? "var(--color-brand-dark)" : t.priority === "high" ? "var(--color-brand-dark)" : "var(--color-brand-dark)",
            tip: `Proactive execution scheduled.`,
          };
        }),
        {
          time: "06:00 PM",
          task: "Daily Review",
          duration: "30 min",
          type: "admin",
          color: "#10B981",
          tip: "Review accomplished tasks.",
        },
      ];
      const fallbackData = {
        summary: "Autonomous offline planner has actively scheduled all your pending tasks to ensure completion.",
        schedule: mockBlocks,
      };
      setScheduleData(fallbackData);
      localStorage.setItem("lifesaver_schedule", JSON.stringify(fallbackData));
      showToast("AlertCircle", "Autonomous offline schedule active.");
    } finally {
      setIsLoading(false);
    }
  };

  const exportToICal = () => {
    if (!scheduleData || scheduleData.schedule.length === 0) {
      showToast("AlertCircle", "No schedule to export!");
      return;
    }

    let icsContent = [
      "BEGIN:VCALENDAR",
      "VERSION:2.0",
      "PRODID:-//LifeSaver AI//Schedule//EN",
    ];

    const today = new Date();
    const dateStr = today.toISOString().split("T")[0].replace(/-/g, "");

    scheduleData.schedule.forEach((block, idx) => {
      // Very basic time parsing - assumes "hh:mm AM/PM"
      const match = block.time.match(/(\d+):(\d+)\s*(AM|PM)/i);
      if (match) {
        let hours = parseInt(match[1]);
        const mins = parseInt(match[2]);
        const ampm = match[3].toUpperCase();
        if (ampm === "PM" && hours < 12) hours += 12;
        if (ampm === "AM" && hours === 12) hours = 0;
        
        let durMins = 30; // default
        if (block.duration.includes("min")) {
          durMins = parseInt(block.duration) || 30;
        } else if (block.duration.includes("hour") || block.duration.includes("hr")) {
          durMins = (parseFloat(block.duration) || 1) * 60;
        }

        const startDate = new Date(today);
        startDate.setHours(hours, mins, 0);
        
        const endDate = new Date(startDate.getTime() + durMins * 60000);

        const formatICSDate = (date: Date) => date.toISOString().replace(/[-:]/g, "").split(".")[0] + "Z";
        
        icsContent.push(
          "BEGIN:VEVENT",
          `UID:${dateStr}-${idx}@lifesaver`,
          `DTSTAMP:${formatICSDate(new Date())}`,
          `DTSTART:${formatICSDate(startDate)}`,
          `DTEND:${formatICSDate(endDate)}`,
          `SUMMARY:${block.task}`,
          `DESCRIPTION:${block.tip || ""}`,
          "END:VEVENT"
        );
      }
    });

    icsContent.push("END:VCALENDAR");

    const blob = new Blob([icsContent.join("\r\n")], { type: "text/calendar;charset=utf-8" });
    const link = document.createElement("a");
    link.href = URL.createObjectURL(blob);
    link.download = `schedule-${dateStr}.ics`;
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    
    showToast("CalendarDays", "Schedule exported to Calendar!");
  };

  return (
    <div className="space-y-6">
      <div className="flex flex-col md:flex-row md:items-end justify-between gap-4 border-b border-[var(--color-brand-dark)] pb-6 mb-10">
        <div>
          <div className="flex items-center space-x-4 mb-2">
            <div className="h-[1px] w-8 bg-[var(--color-brand-dark)]"></div>
            <span className="text-[10px] font-bold uppercase tracking-widest">Chronology</span>
          </div>
          <h2 className="text-5xl md:text-6xl font-serif italic font-normal text-[var(--color-brand-dark)]">AI Schedule</h2>
        </div>
        <div className="flex flex-col sm:flex-row gap-2 mt-4 md:mt-0">
          <button
            onClick={exportToICal}
            disabled={!scheduleData || isLoading}
            className="flex items-center gap-2 px-4 py-3 bg-[var(--color-brand-dark)] hover:bg-[#fff] hover:text-[var(--color-brand-dark)] border border-[var(--color-brand-dark)] text-[#fff] text-[10px] font-bold uppercase tracking-widest transition-colors duration-300 cursor-pointer disabled:opacity-50"
            title="Export to Calendar (.ics)"
          >
            <CalendarDays size={14} />
          </button>
          <button
            id="btn-generate-schedule"
            onClick={generateSchedule}
            disabled={isLoading}
            className="flex items-center gap-2 px-6 py-3 bg-[#fff] border border-[var(--color-brand-dark)] hover:bg-[var(--color-brand-dark)] hover:text-[#fff] text-[var(--color-brand-dark)] text-[10px] font-bold uppercase tracking-widest transition-colors duration-300 cursor-pointer disabled:opacity-50"
          >
            {isLoading ? (
              <RefreshCw size={14} className="animate-spin" />
            ) : (
              <Sparkles size={14} />
            )}
            Generate Today's Plan
          </button>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 items-start">
        {/* Left Column: Schedule entries */}
        <div className="lg:col-span-8 bg-[#fff] border border-[var(--color-brand-dark)]/20 rounded-[14px] p-6 shadow-xs">
          <h3 className="flex items-center gap-2 text-2xl font-serif italic font-normal text-[var(--color-brand-dark)] mb-6">
            <CalendarDays size={18} className="text-[var(--color-brand-dark)]" /> Today's Schedule Timeline
          </h3>

          {!scheduleData ? (
            <div className="text-center py-20 bg-[#fff] border border-[var(--color-brand-dark)]/20 rounded-[14px]">
              <div className="w-14 h-14 bg-[#fff] border border-[var(--color-brand-dark)]/20 text-[var(--color-brand-dark)]/40 rounded-[14px] flex items-center justify-center mx-auto mb-4">
                <CalendarDays size={24} />
              </div>
              <h4 className="font-bold uppercase tracking-widest text-[10px] text-[var(--color-brand-dark)] text-base">No schedule generated yet</h4>
              <p className="text-xs text-[var(--color-brand-dark)]/40 mt-1 max-w-xs mx-auto">
                Click "Generate Today's Plan" and let Gemini AI assemble your day into blocks.
              </p>
            </div>
          ) : (
            <div className="space-y-5">
              {scheduleData.summary && (
                <div className="bg-[var(--color-brand-dark)] border-l-3 border-[var(--color-brand-dark)] rounded-[14px] p-3.5 flex gap-2.5 items-start text-xs text-[#fff] leading-relaxed">
                  <Info size={16} className="text-[#fff] flex-shrink-0 mt-0.5" />
                  <div>
                    <strong className="font-bold uppercase tracking-widest text-[10px]">Gemini Strategy:</strong> {scheduleData.summary}
                  </div>
                </div>
              )}

              <div className="space-y-4 pt-2">
                <AnimatePresence>
                  {scheduleData.schedule.map((block, idx) => (
                    <motion.div
                      layout
                      key={idx}
                      initial={{ opacity: 0, y: 15 }}
                      animate={{ opacity: 1, y: 0 }}
                      exit={{ opacity: 0, scale: 0.95 }}
                      transition={{ duration: 0.25, delay: idx * 0.05, ease: "easeOut" }}
                      className={`flex gap-4 items-start bg-[#fff] border border-[var(--color-brand-dark)]/15 p-4 rounded-[14px] shadow-2xs hover:scale-101 transition-all ${
                        block.completed ? "opacity-50 grayscale" : ""
                      }`}
                    >
                    {/* Visual dot & time indicator */}
                    <div className="flex flex-col items-center gap-1.5 flex-shrink-0 min-w-20">
                      <div className="w-3.5 h-3.5 rounded-[14px]" style={{ backgroundColor: block.color }} />
                      <span className="text-xs font-bold uppercase tracking-widest text-[11px] text-[var(--color-brand-dark)]">{block.time}</span>
                    </div>

                    <div className="flex-1">
                      <h4 className={`font-bold uppercase tracking-widest text-[10px] text-[var(--color-brand-dark)] text-xs sm:text-sm ${block.completed ? "line-through" : ""}`}>{block.task}</h4>
                      <div className="flex items-center gap-3 text-[var(--color-brand-dark)]/40 text-[11px] mt-1.5 flex-wrap">
                        <span className="flex items-center gap-1">
                          <Clock size={11} /> {block.duration}
                        </span>
                        <span className="capitalize bg-[#fff] border border-[var(--color-brand-dark)]/10 px-1.5 py-0.5 rounded text-[10px] font-medium uppercase tracking-wider text-[10px] text-[var(--color-brand-dark)]/60">
                          {block.type}
                        </span>
                        {block.tip && (
                          <span className="flex items-center gap-1 text-[var(--color-brand-dark)]/60">
                            <Lightbulb size={11} className="text-[var(--color-brand-dark)]" /> Tips: {block.tip}
                          </span>
                        )}
                      </div>
                    </div>
                    
                    {!block.completed && (
                      <button
                        onClick={() => handleCompleteBlock(idx, block.taskId)}
                        className="p-2 border border-[var(--color-brand-dark)]/20 hover:bg-[var(--color-brand-dark)] hover:text-[#fff] text-[var(--color-brand-dark)] rounded-[14px] transition-colors cursor-pointer flex-shrink-0"
                        title="Mark complete"
                      >
                        <Check size={14} />
                      </button>
                    )}
                    </motion.div>
                  ))}
                </AnimatePresence>
              </div>
            </div>
          )}
        </div>

        {/* Right Column: Tips */}
        <div className="lg:col-span-4 space-y-6">
          <div className="bg-[#fff] border border-[var(--color-brand-dark)]/20 rounded-[14px] p-6 shadow-xs">
            <h3 className="flex items-center gap-2 text-2xl font-serif italic font-normal text-[var(--color-brand-dark)] mb-5">
              <Lightbulb size={18} className="text-[var(--color-brand-dark)]" /> Science-backed Productivity Tips
            </h3>

            <div className="space-y-4">
              <div className="bg-[#fff] border border-[var(--color-brand-dark)]/15 p-3.5 rounded-[14px] flex gap-3 items-start">
                <Clock size={18} className="text-[var(--color-brand-dark)] flex-shrink-0 mt-0.5" />
                <div className="text-xs text-[var(--color-brand-dark)]/80 leading-relaxed">
                  <strong className="font-medium uppercase tracking-wider text-[10px] text-[var(--color-brand-dark)]">Time Blocking Works</strong>
                  <p className="mt-1">Group similar tasks into dedicated slots to minimize context-switching penalties and stay in deep flow longer.</p>
                </div>
              </div>

              <div className="bg-[#fff] border border-[var(--color-brand-dark)]/15 p-3.5 rounded-[14px] flex gap-3 items-start">
                <Brain size={18} className="text-[var(--color-brand-dark)] flex-shrink-0 mt-0.5" />
                <div className="text-xs text-[var(--color-brand-dark)]/80 leading-relaxed">
                  <strong className="font-medium uppercase tracking-wider text-[10px] text-[var(--color-brand-dark)]">Do Hard Things First</strong>
                  <p className="mt-1">Willpower and executive function peak in the mornings. Tackle critical, cognitively demanding tasks before lunch.</p>
                </div>
              </div>

              <div className="bg-[#fff] border border-[var(--color-brand-dark)]/15 p-3.5 rounded-[14px] flex gap-3 items-start">
                <Sparkles size={18} className="text-[var(--color-brand-dark)] flex-shrink-0 mt-0.5" />
                <div className="text-xs text-[var(--color-brand-dark)]/80 leading-relaxed">
                  <strong className="font-medium uppercase tracking-wider text-[10px] text-[var(--color-brand-dark)]">The 2-Minute Rule</strong>
                  <p className="mt-1">If an administrative task takes less than 2 minutes, act on it immediately. Do not put off simple housekeeping.</p>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
