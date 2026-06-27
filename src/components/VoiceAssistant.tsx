import React, { useState, useEffect, useRef } from "react";
import { Mic, Loader2, Volume2, X } from "lucide-react";
import { motion } from "motion/react";
import { customFetch } from "../lib/api";
import { Task } from "../types";

export function VoiceAssistant({ tasks }: { tasks: Task[] }) {
  const [isListening, setIsListening] = useState(false);
  const [isSpeaking, setIsSpeaking] = useState(false);
  const [isOpen, setIsOpen] = useState(false);
  const [message, setMessage] = useState("How can I help you?");
  const [isSupported, setIsSupported] = useState(false);
  
  const recognitionRef = useRef<any>(null);
  
  useEffect(() => {
    // Check if browser supports speech recognition
    const SpeechRecognition = (window as any).SpeechRecognition || (window as any).webkitSpeechRecognition;
    if (SpeechRecognition) {
      setIsSupported(true);
      recognitionRef.current = new SpeechRecognition();
      recognitionRef.current.continuous = false;
      recognitionRef.current.interimResults = false;
      
      recognitionRef.current.onresult = async (event: any) => {
        const transcript = event.results[0][0].transcript;
        setMessage(`You: "${transcript}"`);
        setIsListening(false);
        await processInput(transcript);
      };
      
      recognitionRef.current.onerror = (event: any) => {
        console.error("Speech recognition error", event.error);
        setIsListening(false);
        setMessage("I didn't catch that. Try again?");
      };
      
      recognitionRef.current.onend = () => {
        setIsListening(false);
      };
    }
  }, []);

  const processInput = async (text: string) => {
    try {
      setMessage("Processing your request...");
      const response = await customFetch("/api/chat", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ message: text, chatHistory: [], tasksContext: JSON.stringify(tasks) })
      });
      
      if (!response.ok) throw new Error("API failed");
      const data = await response.json();
      
      setMessage(data.reply);
      speakText(data.reply);
    } catch (err) {
      setMessage("Sorry, I had trouble connecting to the network.");
    }
  };

  const speakText = (text: string) => {
    if ("speechSynthesis" in window) {
      // stop any ongoing speech
      window.speechSynthesis.cancel();
      setIsSpeaking(true);
      const utterance = new SpeechSynthesisUtterance(text);
      utterance.rate = 0.95;
      utterance.onend = () => setIsSpeaking(false);
      window.speechSynthesis.speak(utterance);
    }
  };

  const toggleListen = () => {
    if (isListening) {
      recognitionRef.current?.stop();
      setIsListening(false);
    } else {
      window.speechSynthesis.cancel();
      setIsSpeaking(false);
      setIsOpen(true);
      setMessage("Listening...");
      setIsListening(true);
      try {
        recognitionRef.current?.start();
      } catch (err) {
        console.error(err);
      }
    }
  };

  if (!isSupported) return null;

  return (
    <motion.div 
      drag
      dragConstraints={{ left: -1000, right: 0, top: -1000, bottom: 0 }}
      dragElastic={0.1}
      className="fixed bottom-6 right-6 z-50 flex flex-col items-end gap-4"
    >
      {isOpen && (
        <div className="bg-[var(--color-brand-dark)] text-[var(--color-text-on-dark)] p-4 shadow-2xl w-72 origin-bottom-right transition-all">
          <div className="flex justify-between items-center mb-2 border-b border-[#fff]/20 pb-2">
            <h4 className="font-bold text-xs uppercase tracking-widest flex items-center gap-2">
              {isSpeaking ? <Volume2 size={14} className="animate-pulse text-[var(--color-text-on-dark)]" /> : <Mic size={14} />}
              LifeSaver Coach
            </h4>
            <button onClick={() => { setIsOpen(false); window.speechSynthesis.cancel(); setIsSpeaking(false); }} className="hover:text-white/70 cursor-pointer">
              <X size={14} />
            </button>
          </div>
          <p className="text-sm font-mono opacity-80 leading-relaxed min-h-[40px]">
            {message}
          </p>
        </div>
      )}

      <button
        onClick={toggleListen}
        className={`w-14 h-14 bg-[var(--color-brand-dark)] text-[var(--color-text-on-dark)] flex items-center justify-center shadow-xl hover:scale-105 transition-transform rounded-full cursor-pointer ${
          isListening ? "animate-pulse shadow-red-500/20" : ""
        }`}
      >
        {isListening ? <Loader2 size={24} className="animate-spin" /> : <Mic size={24} />}
      </button>
    </motion.div>
  );
}
