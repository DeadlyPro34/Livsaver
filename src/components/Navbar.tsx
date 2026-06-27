import React, { useState } from "react";
import { Zap, Menu, X, Instagram, Youtube, Linkedin } from "lucide-react";
import { IconSquareRotatedFilled, IconCircleFilled, IconDiamondFilled } from "@tabler/icons-react";
import { playClickSound } from "../lib/audio";

interface NavbarProps {
  activeTab: string;
  setActiveTab: (tab: string) => void;
  isAiConnected: boolean;
}

export default function Navbar({ activeTab, setActiveTab, isAiConnected }: NavbarProps) {
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);

  const tabs = [
    { id: "dashboard", label: "Dashboard", num: "01" },
    { id: "schedule", label: "Schedule", num: "02" },
    { id: "habits", label: "Habits", num: "03" },
    { id: "focus", label: "Focus", num: "04" },
    { id: "settings", label: "Settings", num: "05" },
    { id: "profile", label: "Profile", num: "06" },
  ];

  const SideMenuContent = () => (
    <>
      {/* Top decorative icons */}
      <div className="flex items-center gap-1 mb-6 mt-1 flex-row flex-nowrap">
        <IconSquareRotatedFilled className="text-[#5DB85C] w-[20px] h-[20px]" />
        <IconCircleFilled className="text-[#F0C040] border-[4px] border-[#F0C040] bg-transparent rounded-full !w-[22px] !h-[22px]" />
        <IconDiamondFilled className="text-[#6B9FD4] w-[20px] h-[20px]" />
      </div>

      {/* Menu Items */}
      <div className="flex flex-col gap-[8px]">
        {tabs.map((tab) => {
          const isActive = activeTab === tab.id;
          
          return (
            <div 
              key={tab.id}
              className={`${isActive ? "bg-[var(--color-brand-cream)] text-[var(--color-brand-dark)]" : "bg-[var(--color-brand-accent)] text-[var(--color-brand-dark)]"} h-[44px] px-[14px] rounded-[12px] flex flex-row items-center justify-between cursor-pointer transition-transform active:scale-[0.98] shadow-sm`}
              onClick={() => {
                playClickSound();
                setActiveTab(tab.id);
                setMobileMenuOpen(false);
              }}
            >
              <span className="text-[14px] font-bold lowercase whitespace-nowrap overflow-visible">{tab.label}</span>
              <div className={`bg-[var(--color-brand-badge)] text-[var(--color-brand-dark)] text-[11px] font-bold px-[7px] py-[1px] rounded-full`}>
                {tab.num}
              </div>
            </div>
          );
        })}
      </div>

      {/* Bottom Section */}
      <div className="mt-auto pt-3 pb-1">
        <h3 className="text-[var(--color-text-on-orange)] text-[18px] font-bold leading-[1.3] mb-4 font-serif">
          reserve a time to speak with our experts
        </h3>
        
        <div className="bg-[var(--color-brand-cream)] rounded-[10px] p-[12px_14px] flex flex-col gap-2 text-[12px] text-[#555]">
          <span>©2026 three circles.</span>
          <div className="flex gap-3 text-[var(--color-brand-dark)] items-center">
            <Instagram size={14} />
            <span className="font-bold text-[14px] leading-none">X</span>
            <Youtube size={14} />
            <Linkedin size={14} />
          </div>
        </div>
      </div>
    </>
  );

  const MobileMenuContent = () => (
    <div className="flex flex-col gap-[12px]">
      <div className="flex justify-between items-center">
        <div className="flex items-center gap-1 text-[20px]">
          <IconSquareRotatedFilled className="text-[#5DB85C]" size={20} />
          <IconCircleFilled className="text-[#F0C040] border-[4px] border-[#F0C040] bg-transparent rounded-full !w-[22px] !h-[22px]" size={20} />
          <IconDiamondFilled className="text-[#6B9FD4]" size={20} />
        </div>
        <button 
          className="text-[var(--color-brand-dark)] bg-[var(--color-brand-cream)] rounded-[8px] w-[36px] h-[36px] flex items-center justify-center shadow-sm"
          onClick={() => {
            playClickSound();
            setMobileMenuOpen(false);
          }}
        >
          <X size={20} />
        </button>
      </div>

      <div className="grid grid-cols-2 gap-[8px] p-[12px_16px] -mx-[16px]">
        {tabs.map((tab) => {
          const isActive = activeTab === tab.id;
          return (
            <div 
              key={tab.id}
              className={`${isActive ? "bg-[var(--color-brand-cream)]" : "bg-[var(--color-brand-accent)]"} text-[var(--color-brand-dark)] rounded-[10px] p-[10px_14px] w-full flex justify-between items-center shadow-sm cursor-pointer transition-transform active:scale-[0.98]`}
              onClick={() => {
                playClickSound();
                setActiveTab(tab.id);
                setMobileMenuOpen(false);
              }}
            >
              <span className="text-[14px] font-[600] lowercase">{tab.label}</span>
              <div className="bg-[var(--color-brand-badge)] text-[var(--color-brand-dark)] text-[11px] font-bold px-[7px] py-[1px] rounded-full flex-shrink-0">
                {tab.num}
              </div>
            </div>
          );
        })}
      </div>

      <div>
        <h3 className="text-[var(--color-text-on-orange)] text-[18px] font-bold leading-[1.3] pr-4 font-serif">
          reserve a time to speak with our experts
        </h3>
      </div>

      <div className="bg-[var(--color-brand-cream)] rounded-[10px] p-[12px_14px] mt-[12px]">
        <div className="text-[12px] text-[#555] mb-2">©2026 three circles.</div>
        <div className="flex gap-3 text-[var(--color-brand-dark)] items-center">
          <Instagram size={14} />
          <span className="font-bold text-[14px] leading-none">X</span>
          <Youtube size={14} />
          <Linkedin size={14} />
        </div>
      </div>
    </div>
  );

  return (
    <>
      {/* Mobile Top Navbar */}
      <nav className="min-[481px]:hidden flex justify-between items-center border-b border-[#ede5d0] pb-4 px-4 pt-6 bg-[#fff] sticky top-0 z-40">
        <div className="flex items-center gap-3 text-xs font-bold uppercase tracking-widest text-[10px] tracking-[0.25em] text-[var(--color-brand-dark)]">
          <Zap size={16} className="text-[var(--color-brand-primary)]" />
          LIFESAVER AI
        </div>
        <div className="flex items-center gap-4">
          <div className="flex items-center gap-2 text-[10px] uppercase tracking-widest font-bold opacity-60 text-[var(--color-brand-dark)]">
            GEMINI 2.0 
            <div className={`w-1.5 h-1.5 rounded-full ${isAiConnected ? "bg-[var(--color-brand-primary)]" : "bg-[var(--color-brand-dark)] opacity-20"}`} />
          </div>
          <button 
            className="text-[var(--color-brand-dark)] p-1 -mr-1"
            onClick={() => {
              playClickSound();
              setMobileMenuOpen(true);
            }}
          >
            <Menu size={24} />
          </button>
        </div>
      </nav>

      {/* Desktop Sidebar */}
      <aside className="hidden min-[481px]:flex flex-col w-[200px] flex-shrink-0 bg-[#faf6ef] p-4 h-screen sticky top-0 overflow-hidden">
        <div className="w-full h-full bg-[var(--color-brand-primary)] rounded-[14px] p-5 flex flex-col relative shadow-md overflow-y-auto hide-scrollbar">
          <SideMenuContent />
        </div>
      </aside>

      {/* Mobile Side Menu Overlay */}
      {mobileMenuOpen && (
        <div className="fixed inset-0 z-[100] flex bg-black/60 p-4 min-[481px]:hidden animate-fadeIn overflow-hidden items-start justify-center pt-16">
          <div className="w-full max-w-[400px] bg-[var(--color-brand-primary)] rounded-[16px] p-[20px] flex flex-col relative shadow-xl overflow-y-auto max-h-[90vh] hide-scrollbar">
            <MobileMenuContent />
          </div>
        </div>
      )}
    </>
  );
}

