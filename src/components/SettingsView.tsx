import React, { useState, useEffect } from "react";
import { Key, Save, AlertCircle, RefreshCw, Globe } from "lucide-react";
import { motion } from "motion/react";
import { useLanguage } from "../lib/LanguageContext";
import { getTranslation } from "../lib/i18n";

interface SettingsViewProps {
  showToast: (icon: string, message: string) => void;
  onClose?: () => void;
  checkApiConnection: () => Promise<void>;
}

export default function SettingsView({ showToast, onClose, checkApiConnection }: SettingsViewProps) {
  const [apiKey, setApiKey] = useState("");
  const [isSaving, setIsSaving] = useState(false);
  const { language, setLanguage } = useLanguage();

  useEffect(() => {
    const savedKey = localStorage.getItem("lifesaver_api_key");
    if (savedKey) setApiKey(savedKey);
  }, []);

  const handleSave = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsSaving(true);
    
    if (apiKey.trim()) {
      localStorage.setItem("lifesaver_api_key", apiKey.trim());
    } else {
      localStorage.removeItem("lifesaver_api_key");
    }

    await checkApiConnection();
    showToast("Check", "API Key setting updated successfully.");
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

      <div className="bg-[#fff] border border-[var(--color-brand-dark)]/20 rounded-[14px] p-8 shadow-xs">
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

      <div className="bg-[#fff] border border-[var(--color-brand-dark)]/20 rounded-[14px] p-8 shadow-xs">
        <h3 className="flex items-center gap-2 text-2xl font-serif italic font-normal text-[var(--color-brand-dark)] mb-6">
          <Key size={18} className="text-[var(--color-brand-dark)]" /> {getTranslation(language, 'apiConfig')}
        </h3>
        
        <p className="text-xs text-[var(--color-brand-dark)]/70 mb-6 leading-relaxed">
          {getTranslation(language, 'apiDesc')}
        </p>

        <form onSubmit={handleSave} className="space-y-6">
          <div>
            <label htmlFor="api-key" className="block text-[10px] font-bold uppercase tracking-widest text-[var(--color-brand-dark)]/60 mb-2">
              {getTranslation(language, 'apiKeyLabel')}
            </label>
            <input
              id="api-key"
              type="password"
              placeholder="AIzaSy..."
              value={apiKey}
              onChange={(e) => setApiKey(e.target.value)}
              className="w-full px-4 py-3 bg-[#fff] border-[var(--color-brand-dark)]/50 transition-colors"
            />
            <p className="text-[10px] text-[var(--color-brand-dark)]/40 mt-2 uppercase tracking-wider">
              {getTranslation(language, 'leaveBlank')}
            </p>
          </div>

          <button
            type="submit"
            disabled={isSaving}
            className="flex items-center gap-2 px-6 py-3 bg-[var(--color-brand-dark)] hover:bg-[var(--color-brand-dark)]/90 text-[#fff] rounded-full text-[10px] font-bold uppercase tracking-widest transition-colors duration-300 cursor-pointer disabled:opacity-50"
          >
            {isSaving ? <RefreshCw size={14} className="animate-spin" /> : <Save size={14} />}
            {getTranslation(language, 'saveSettings')}
          </button>
        </form>
      </div>
    </motion.div>
  );
}
