import React, { useState } from "react";
import { Zap, Menu, X, Instagram, Youtube, Linkedin } from "lucide-react";
import { IconSquareRotatedFilled, IconCircleFilled, IconDiamondFilled } from "@tabler/icons-react";
import { playClickSound } from "../lib/audio";
import { motion } from "motion/react";
import { useLanguage } from "../lib/LanguageContext";
import { getTranslation } from "../lib/i18n";

interface NavbarProps {
  activeTab: string;
  setActiveTab: (tab: string) => void;
  isAiConnected: boolean;
}

export default function Navbar({ activeTab, setActiveTab, isAiConnected }: NavbarProps) {
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  const { language } = useLanguage();

  const tabs = [
    { id: "dashboard", label: getTranslation(language, "dashboard"), num: "01" },
    { id: "schedule", label: getTranslation(language, "schedule"), num: "02" },
    { id: "habits", label: getTranslation(language, "habits"), num: "03" },
    { id: "focus", label: getTranslation(language, "focus"), num: "04" },
    { id: "settings", label: getTranslation(language, "settings"), num: "05" },
    { id: "profile", label: getTranslation(language, "profile"), num: "06" },
  ];

  const SideMenuContent = () => (
    <>
      {/* Top decorative icons */}
      <div className="flex items-center gap-2 mb-4 mt-1 flex-row flex-nowrap">
        <div className="flex items-center gap-1 shrink-0">
          <IconSquareRotatedFilled className="text-[#5DB85C] w-[20px] h-[20px]" />
          <IconCircleFilled className="text-[#F0C040] border-[4px] border-[#F0C040] bg-transparent rounded-full !w-[22px] !h-[22px]" />
          <IconDiamondFilled className="text-[#6B9FD4] w-[20px] h-[20px]" />
        </div>
        
        <div className="flex font-black text-sm tracking-wider text-[#faf6ef] overflow-hidden ml-1">
          {"LIFESAVER".split("").map((letter, index) => (
            <motion.span
              key={index}
              whileHover={{ scale: 1.1, color: "#F0C040" }}
              transition={{ type: "spring", stiffness: 300, damping: 10 }}
              className="cursor-default inline-block drop-shadow-sm"
            >
              {letter}
            </motion.span>
          ))}
        </div>
      </div>

      {/* Menu Items */}
      <div className="flex flex-col gap-[5px]">
        {tabs.map((tab) => {
          const isActive = activeTab === tab.id;
          
          return (
            <div 
              key={tab.id}
              className={`h-[38px] px-[12px] rounded-[10px] flex flex-row items-center justify-between cursor-pointer transition-colors active:scale-[0.98] ${isActive ? "bg-[var(--color-brand-cream)] text-[var(--color-brand-dark)] shadow-sm" : "bg-[var(--color-brand-accent)] text-[var(--color-brand-dark)] hover:brightness-95"}`}
              onClick={() => {
                playClickSound();
                setActiveTab(tab.id);
                setMobileMenuOpen(false);
              }}
            >
              <div className="inline-block text-[13px] font-bold lowercase whitespace-nowrap overflow-visible">
                {tab.label.split("").map((letter, i) => (
                  <motion.span
                    key={i}
                    whileHover={{ scale: 1.1, color: "#F0C040" }}
                    transition={{ type: "spring", stiffness: 300, damping: 10 }}
                    className="inline-block"
                  >
                    {letter === " " ? "\u00A0" : letter}
                  </motion.span>
                ))}
              </div>
              <div className={`bg-[var(--color-brand-badge)] text-[var(--color-brand-dark)] text-[10px] font-bold px-[7px] py-[1px] rounded-full`}>
                {tab.num}
              </div>
            </div>
          );
        })}
      </div>

      {/* Bottom Section */}
      <div className="mt-auto pt-2 pb-1 shrink-0">
        <h3 className="text-[var(--color-text-on-orange)] text-[16px] md:text-[18px] font-bold leading-[1.2] mb-3 font-serif">
          {getTranslation(language, 'appQuote')}
        </h3>
        
        <div className="bg-[var(--color-brand-cream)] rounded-[10px] p-[10px_12px] flex flex-col gap-2 text-[12px] text-[#555]">
          <span>©2026 LifeSaver AI.</span>
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
        <div className="flex items-center gap-2">
          <div className="flex items-center gap-1 shrink-0">
            <IconSquareRotatedFilled className="text-[#5DB85C]" size={20} />
            <IconCircleFilled className="text-[#F0C040] border-[4px] border-[#F0C040] bg-transparent rounded-full !w-[22px] !h-[22px]" size={20} />
            <IconDiamondFilled className="text-[#6B9FD4]" size={20} />
          </div>
          <div className="flex font-black text-sm tracking-wider text-[var(--color-brand-dark)] overflow-hidden ml-1">
            {"LIFESAVER".split("").map((letter, index) => (
              <motion.span
                key={index}
                whileHover={{ scale: 1.1, color: "#F0C040" }}
                transition={{ type: "spring", stiffness: 300, damping: 10 }}
                className="cursor-default inline-block"
              >
                {letter}
              </motion.span>
            ))}
          </div>
        </div>
        <motion.button 
          whileHover={{ scale: 1.15, rotate: 90 }}
          whileTap={{ scale: 0.9, rotate: -90 }}
          transition={{ type: "spring", stiffness: 300, damping: 15 }}
          className="text-[var(--color-brand-dark)] bg-[var(--color-brand-cream)] rounded-[8px] w-[36px] h-[36px] flex items-center justify-center shadow-sm"
          onClick={() => {
            playClickSound();
            setMobileMenuOpen(false);
          }}
        >
          <X size={20} />
        </motion.button>
      </div>

      <div className="grid grid-cols-2 gap-[8px] p-[12px_16px] -mx-[16px]">
        {tabs.map((tab) => {
          const isActive = activeTab === tab.id;
          return (
            <div 
              key={tab.id}
              className={`rounded-[10px] p-[10px_14px] w-full flex justify-between items-center cursor-pointer transition-colors active:scale-[0.98] ${isActive ? "bg-[var(--color-brand-cream)] text-[var(--color-brand-dark)] shadow-sm" : "bg-[var(--color-brand-accent)] text-[var(--color-brand-dark)] hover:brightness-95"}`}
              onClick={() => {
                playClickSound();
                setActiveTab(tab.id);
                setMobileMenuOpen(false);
              }}
            >
              <div className="inline-block text-[14px] font-[600] lowercase whitespace-nowrap">
                {tab.label.split("").map((letter, i) => (
                  <motion.span
                    key={i}
                    whileHover={{ scale: 1.1, color: "#F0C040" }}
                    transition={{ type: "spring", stiffness: 300, damping: 10 }}
                    className="inline-block"
                  >
                    {letter === " " ? "\u00A0" : letter}
                  </motion.span>
                ))}
              </div>
              <div className="bg-[var(--color-brand-badge)] text-[var(--color-brand-dark)] text-[11px] font-bold px-[7px] py-[1px] rounded-full flex-shrink-0">
                {tab.num}
              </div>
            </div>
          );
        })}
      </div>

      <div>
        <h3 className="text-[var(--color-text-on-orange)] text-[18px] font-bold leading-[1.3] pr-4 font-serif">
          {getTranslation(language, 'appQuote')}
        </h3>
      </div>

      <div className="bg-[var(--color-brand-cream)] rounded-[10px] p-[12px_14px] mt-[12px]">
        <div className="text-[12px] text-[#555] mb-2">©2026 LifeSaver AI.</div>
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
      <nav className="sm:hidden flex justify-between items-center border-b border-[var(--color-brand-dark)]/20 pb-4 px-4 pt-6 bg-[var(--color-brand-white)] sticky top-0 z-40">
        <div className="flex items-center gap-1.5 shrink-0">
          <div className="flex items-center gap-1 shrink-0">
            <IconSquareRotatedFilled className="text-[#5DB85C]" size={16} />
            <IconCircleFilled className="text-[#F0C040] border-[3px] border-[#F0C040] bg-transparent rounded-full !w-[18px] !h-[18px]" size={16} />
            <IconDiamondFilled className="text-[#6B9FD4]" size={16} />
          </div>
          <div className="flex font-black text-[11px] tracking-wider text-[var(--color-brand-dark)] overflow-hidden">
            {"LIFESAVER".split("").map((letter, index) => (
              <motion.span
                key={index}
                whileHover={{ scale: 1.1, color: "#F0C040" }}
                transition={{ type: "spring", stiffness: 300, damping: 10 }}
                className="cursor-default inline-block"
              >
                {letter}
              </motion.span>
            ))}
          </div>
        </div>
        <div className="flex items-center gap-2 sm:gap-4">
          <div className="flex items-center gap-1.5 text-[9px] uppercase tracking-widest font-bold opacity-60 text-[var(--color-brand-dark)]">
            GEMINI 2.0 
            <div className={`w-1.5 h-1.5 rounded-full ${isAiConnected ? "bg-[var(--color-brand-primary)]" : "bg-[var(--color-brand-dark)] opacity-20"}`} />
          </div>
          <motion.button 
            whileHover={{ scale: 1.15, rotate: 180 }}
            whileTap={{ scale: 0.9, rotate: -90 }}
            transition={{ type: "spring", stiffness: 300, damping: 15 }}
            className="text-[var(--color-brand-dark)] p-1 -mr-1"
            onClick={() => {
              playClickSound();
              setMobileMenuOpen(true);
            }}
          >
            <Menu size={24} />
          </motion.button>
        </div>
      </nav>

      {/* Desktop Sidebar */}
      <aside className="hidden sm:flex flex-col w-[190px] md:w-[220px] lg:w-[260px] flex-shrink-0 bg-[var(--color-bg-base)] p-2 lg:p-4 h-screen sticky top-0 overflow-hidden">
        <div className="w-full h-full bg-[var(--color-brand-primary)] rounded-[14px] p-3 lg:p-4 flex flex-col relative shadow-md overflow-hidden">
          <SideMenuContent />
        </div>
      </aside>

      {/* Mobile Side Menu Overlay */}
      {mobileMenuOpen && (
        <div className="fixed inset-0 z-[100] flex bg-black/60 p-4 sm:hidden animate-fadeIn overflow-hidden items-start justify-center pt-16">
          <div className="w-full max-w-[400px] bg-[var(--color-brand-primary)] rounded-[16px] p-[20px] flex flex-col relative shadow-xl overflow-y-auto max-h-[90vh] hide-scrollbar">
            <MobileMenuContent />
          </div>
        </div>
      )}
    </>
  );
}

