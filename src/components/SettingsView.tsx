import React, { useState, useEffect } from "react";
import { Save, RefreshCw, Globe, Moon, Sun, Zap, Bot } from "lucide-react";
import { motion } from "motion/react";
import { useLanguage } from "../lib/LanguageContext";
import { getTranslation } from "../lib/i18n";

interface SettingsViewProps {
  showToast: (icon: string, message: string) => void;
  onClose?: () => void;
}

export default function SettingsView({ showToast, onClose }: SettingsViewProps) {

  const [isSaving, setIsSaving] = useState(false);
  const [isDark, setIsDark] = useState(false);
  const [energyProfile, setEnergyProfile] = useState({ morning: 80, afternoon: 50, evening: 30 });
  const { language, setLanguage } = useLanguage();

  useEffect(() => {
    setIsDark(document.body.classList.contains("dark"));
    
    const savedEnergy = localStorage.getItem("lifesaver_energy_profile");
    if (savedEnergy) {
      try { setEnergyProfile(JSON.parse(savedEnergy)); } catch(e) {}
    }
  }, []);

  const toggleDarkMode = () => {
    if (isDark) {
      document.body.classList.remove("dark");
      localStorage.setItem("lifesaver_theme", "light");
      setIsDark(false);
    } else {
      document.body.classList.add("dark");
      localStorage.setItem("lifesaver_theme", "dark");
      setIsDark(true);
    }
  };

  const handleSave = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsSaving(true);
    localStorage.setItem("lifesaver_energy_profile", JSON.stringify(energyProfile));
    showToast("Check", "Settings updated successfully.");
    setIsSaving(false);
  };

  return (
    <motion.div 
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      exit={{ opacity: 0, y: -20 }}
      transition={{ duration: 0.4, ease: "easeOut" }}
      className="space-y-6 max-w-2xl mx-auto"
    >
      <div className="flex flex-col md:flex-row md:items-end justify-between gap-4 border-b border-[var(--color-brand-dark)] pb-6 mb-10">
        <div>
          <div className="flex items-center space-x-4 mb-2">
            <div className="h-[1px] w-8 bg-[var(--color-brand-dark)]"></div>
            <span className="text-[10px] font-bold uppercase tracking-widest">{getTranslation(language, 'configuration')}</span>
          </div>
          <h2 className="text-5xl md:text-6xl font-serif italic font-normal text-[var(--color-brand-dark)]">{getTranslation(language, 'settings')}</h2>
        </div>
      </div>

      <div className="bg-[var(--color-brand-white)] border border-[var(--color-brand-dark)]/20 rounded-[14px] p-8 shadow-xs">
        <h3 className="flex items-center gap-2 text-2xl font-serif italic font-normal text-[var(--color-brand-dark)] mb-6">
          <Moon size={18} className="text-[var(--color-brand-dark)]" /> Appearance
        </h3>
        
        <p className="text-xs text-[var(--color-brand-dark)]/70 mb-6 leading-relaxed">
          Switch between light and dark themes to reduce eye strain during focus sessions.
        </p>

        <button
          onClick={toggleDarkMode}
          className="flex items-center justify-between w-full p-4 bg-[var(--color-brand-cream)] border border-[var(--color-brand-dark)]/20 rounded-[10px] text-sm hover:bg-[var(--color-brand-dark)]/5 transition-colors text-[var(--color-brand-dark)]"
        >
          <span className="font-medium">{isDark ? "Dark Mode Active" : "Light Mode Active"}</span>
          {isDark ? <Moon size={20} /> : <Sun size={20} />}
        </button>
      </div>

      <div className="bg-[var(--color-brand-white)] border border-[var(--color-brand-dark)]/20 rounded-[14px] p-8 shadow-xs">
        <h3 className="flex items-center gap-2 text-2xl font-serif italic font-normal text-[var(--color-brand-dark)] mb-6">
          <Zap size={18} className="text-[var(--color-brand-dark)]" /> Energy-Based Scheduling
        </h3>
        
        <p className="text-xs text-[var(--color-brand-dark)]/70 mb-6 leading-relaxed">
          Set your natural energy curve. AI will schedule demanding tasks during your peak hours and administrative work during your slumps.
        </p>

        <div className="space-y-6">
          <div>
            <div className="flex justify-between text-xs text-[var(--color-brand-dark)]/80 mb-2 font-bold uppercase tracking-widest">
              <span>Morning Peak</span>
              <span>{energyProfile.morning}%</span>
            </div>
            <input type="range" min="0" max="100" value={energyProfile.morning} onChange={(e) => setEnergyProfile({...energyProfile, morning: parseInt(e.target.value)})} className="w-full accent-[var(--color-brand-dark)]" />
          </div>
          <div>
            <div className="flex justify-between text-xs text-[var(--color-brand-dark)]/80 mb-2 font-bold uppercase tracking-widest">
              <span>Afternoon Slump</span>
              <span>{energyProfile.afternoon}%</span>
            </div>
            <input type="range" min="0" max="100" value={energyProfile.afternoon} onChange={(e) => setEnergyProfile({...energyProfile, afternoon: parseInt(e.target.value)})} className="w-full accent-[var(--color-brand-dark)]" />
          </div>
          <div>
            <div className="flex justify-between text-xs text-[var(--color-brand-dark)]/80 mb-2 font-bold uppercase tracking-widest">
              <span>Evening Second Wind</span>
              <span>{energyProfile.evening}%</span>
            </div>
            <input type="range" min="0" max="100" value={energyProfile.evening} onChange={(e) => setEnergyProfile({...energyProfile, evening: parseInt(e.target.value)})} className="w-full accent-[var(--color-brand-dark)]" />
          </div>
        </div>
      </div>

      <div className="bg-[var(--color-brand-white)] border border-[var(--color-brand-dark)]/20 rounded-[14px] p-8 shadow-xs">
        <h3 className="flex items-center gap-2 text-2xl font-serif italic font-normal text-[var(--color-brand-dark)] mb-6">
          <Globe size={18} className="text-[var(--color-brand-dark)]" /> {getTranslation(language, 'language')}
        </h3>
        
        <p className="text-xs text-[var(--color-brand-dark)]/70 mb-6 leading-relaxed">
          {getTranslation(language, 'selectLanguage')}
        </p>
        
        <select
          value={language}
          onChange={(e) => setLanguage(e.target.value)}
          className="w-full bg-[var(--color-brand-cream)] border border-[var(--color-brand-dark)]/20 text-[var(--color-brand-dark)] text-sm rounded-[10px] focus:ring-2 focus:ring-[var(--color-brand-primary)] focus:border-transparent outline-none transition-all py-3 px-4 appearance-none"
        >
          <option value="en">English (US)</option>
          <option value="hi">हिंदी (India)</option>
          <option value="es">Español (Spain)</option>
        </select>
      </div>

      <div className="bg-[var(--color-brand-white)] border border-[var(--color-brand-dark)]/20 rounded-[14px] p-8 shadow-xs">
        <h3 className="flex items-center gap-2 text-2xl font-serif italic font-normal text-[var(--color-brand-dark)] mb-6">
          <Bot size={18} className="text-[var(--color-brand-dark)]" /> AI Configuration
        </h3>
        
        <p className="text-xs text-[var(--color-brand-dark)]/70 mb-6 leading-relaxed">
          If you are hitting rate limits with the shared public key, you can provide your own Google Gemini API key below. It will be stored securely in your browser's local storage.
        </p>
        
        <div className="space-y-4">
          <div>
            <label className="text-xs text-[var(--color-brand-dark)]/80 font-bold uppercase tracking-widest block mb-2">Custom Gemini Key</label>
            <input 
              type="password"
              placeholder="AIzaSy..."
              className="w-full bg-[var(--color-brand-cream)] border border-[var(--color-brand-dark)]/20 text-[var(--color-brand-dark)] text-sm rounded-[10px] focus:ring-2 focus:ring-[var(--color-brand-primary)] outline-none py-3 px-4"
              onChange={(e) => {
                if(e.target.value) {
                  localStorage.setItem("lifesaver_gemini_key", e.target.value);
                } else {
                  localStorage.removeItem("lifesaver_gemini_key");
                }
              }}
              defaultValue={localStorage.getItem("lifesaver_gemini_key") || ""}
            />
          </div>
        </div>
      </div>

        <form onSubmit={handleSave} className="mt-8">
          <button
            type="submit"
            disabled={isSaving}
            className="flex items-center justify-center w-full gap-2 px-6 py-4 bg-[var(--color-brand-dark)] hover:bg-[var(--color-brand-dark)]/90 text-[var(--color-text-on-dark)] rounded-[10px] text-sm font-bold uppercase tracking-widest transition-colors duration-300 cursor-pointer disabled:opacity-50 shadow-md"
          >
            {isSaving ? <RefreshCw size={18} className="animate-spin" /> : <Save size={18} />}
            {getTranslation(language, 'saveSettings')}
          </button>
        </form>
    </motion.div>
  );
}
