import { Zap } from "lucide-react";

interface NavbarProps {
  activeTab: string;
  setActiveTab: (tab: string) => void;
  isAiConnected: boolean;
}

export default function Navbar({ activeTab, setActiveTab, isAiConnected }: NavbarProps) {
  return (
    <nav className="flex justify-between items-baseline border-b border-[#4C1D95] pb-6 mb-10 px-6 md:px-12 pt-8 bg-[#FAF5FF] sticky top-0 z-50">
      <div className="flex items-center gap-3 text-xs font-bold uppercase tracking-widest text-[10px] tracking-[0.25em] uppercase text-[#4C1D95]">
        <Zap size={16} />
        LIFESAVER AI
      </div>

      <div className="flex space-x-8 md:space-x-12 text-[11px] font-medium uppercase tracking-wider">
        <button
          className={`transition-opacity ${activeTab === "dashboard" ? "opacity-100 border-b border-[#4C1D95] pb-1" : "opacity-40 hover:opacity-100"}`}
          onClick={() => setActiveTab("dashboard")}
        >
          Dashboard
        </button>
        <button
          className={`transition-opacity ${activeTab === "schedule" ? "opacity-100 border-b border-[#4C1D95] pb-1" : "opacity-40 hover:opacity-100"}`}
          onClick={() => setActiveTab("schedule")}
        >
          Schedule
        </button>
        <button
          className={`transition-opacity ${activeTab === "habits" ? "opacity-100 border-b border-[#4C1D95] pb-1" : "opacity-40 hover:opacity-100"}`}
          onClick={() => setActiveTab("habits")}
        >
          Habits
        </button>
        <button
          className={`transition-opacity ${activeTab === "focus" ? "opacity-100 border-b border-[#4C1D95] pb-1" : "opacity-40 hover:opacity-100"}`}
          onClick={() => setActiveTab("focus")}
        >
          Focus
        </button>
        <button
          className={`transition-opacity ${activeTab === "settings" ? "opacity-100 border-b border-[#4C1D95] pb-1" : "opacity-40 hover:opacity-100"}`}
          onClick={() => setActiveTab("settings")}
        >
          Settings
        </button>
      </div>

      <div className="hidden md:flex items-center gap-2 text-[10px] uppercase tracking-widest font-bold uppercase tracking-widest text-[10px] opacity-60">
        GEMINI 3.5 
        <div className={`w-1.5 h-1.5 rounded-none ${isAiConnected ? "bg-[#4C1D95]" : "bg-[#4C1D95]/10"}`} />
      </div>
    </nav>
  );
}

