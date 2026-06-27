import React, { useState, useEffect } from "react";
import { User, LogIn, LogOut, Shield, ShieldCheck } from "lucide-react";
import { auth } from "../lib/firebase";
import { GoogleAuthProvider, signInWithPopup, signOut, onAuthStateChanged, User as FirebaseUser } from "firebase/auth";

interface ProfileViewProps {
  showToast: (icon: string, message: string) => void;
}

export default function ProfileView({ showToast }: ProfileViewProps) {
  const [user, setUser] = useState<FirebaseUser | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const unsubscribe = onAuthStateChanged(auth, (currentUser) => {
      setUser(currentUser);
      setLoading(false);
    });
    return unsubscribe;
  }, []);

  const handleLogin = async () => {
    try {
      setLoading(true);
      const provider = new GoogleAuthProvider();
      await signInWithPopup(auth, provider);
      showToast("Check", "Successfully logged in!");
    } catch (error: any) {
      console.error("Login failed:", error);
      showToast("AlertCircle", "Login failed. Please try again.");
    } finally {
      setLoading(false);
    }
  };

  const handleLogout = async () => {
    try {
      await signOut(auth);
      showToast("Check", "Successfully logged out!");
    } catch (error: any) {
      console.error("Logout failed:", error);
      showToast("AlertCircle", "Logout failed.");
    }
  };

  const isRealUser = user && !user.isAnonymous;

  return (
    <div className="space-y-12 animate-fadeIn pb-16">
      {/* Header */}
      <div className="border-b border-[#ede5d0] pb-8 md:pb-12 pt-4">
        <div className="flex items-center space-x-4 mb-4">
          <div className="h-[1px] w-12 bg-[var(--color-brand-dark)]"></div>
          <span className="text-[10px] font-bold uppercase tracking-widest">Identity</span>
        </div>
        <h2 className="text-5xl md:text-6xl font-serif italic font-normal text-[var(--color-brand-dark)]">
          Profile
        </h2>
      </div>

      <div className="max-w-2xl mx-auto">
        {loading ? (
          <div className="text-center py-20 text-[var(--color-brand-dark)]/60 text-sm uppercase tracking-widest font-bold">
            Verifying identity...
          </div>
        ) : isRealUser ? (
          <div className="bg-[#fff] border border-[#ede5d0] rounded-[14px] p-8 shadow-sm flex flex-col items-center text-center">
            {user.photoURL ? (
              <img src={user.photoURL} alt="Profile" referrerPolicy="no-referrer" className="w-24 h-24 rounded-full border-4 border-[#ede5d0] mb-6 object-cover" />
            ) : (
              <div className="w-24 h-24 rounded-full border-4 border-[#ede5d0] mb-6 bg-[var(--color-brand-cream)] flex items-center justify-center text-[var(--color-brand-dark)]">
                <User size={40} />
              </div>
            )}
            
            <h3 className="text-2xl font-serif text-[var(--color-brand-dark)] mb-2">
              {user.displayName || "Explorer"}
            </h3>
            <p className="text-sm text-[var(--color-brand-dark)]/60 mb-8 font-medium">
              {user.email}
            </p>

            <div className="flex items-center gap-2 px-4 py-2 bg-[var(--color-brand-cream)] text-[var(--color-brand-dark)] rounded-full text-[10px] font-bold uppercase tracking-widest mb-10 border border-[#ede5d0]">
              <ShieldCheck size={14} className="text-[var(--color-brand-primary)]" />
              Verified Account
            </div>

            <button
              onClick={handleLogout}
              className="flex items-center gap-2 px-6 py-3 bg-[var(--color-brand-accent)] hover:brightness-95 text-[var(--color-brand-dark)] rounded-[8px] text-sm font-bold uppercase tracking-widest transition-all cursor-pointer"
            >
              <LogOut size={16} />
              Sign Out
            </button>
          </div>
        ) : (
          <div className="bg-[#fff] border border-[#ede5d0] rounded-[14px] p-8 md:p-12 shadow-sm flex flex-col items-center text-center">
            <div className="w-20 h-20 rounded-full bg-[var(--color-brand-cream)] flex items-center justify-center text-[var(--color-brand-dark)] mb-6">
              <Shield size={32} />
            </div>
            <h3 className="text-3xl font-serif text-[var(--color-brand-dark)] mb-4">
              Secure Your Progress
            </h3>
            <p className="text-sm text-[var(--color-brand-dark)]/70 mb-10 max-w-sm leading-relaxed">
              Create an account to securely sync your dashboard, schedule, and habits across all your devices.
            </p>

            <button
              onClick={handleLogin}
              className="flex items-center gap-3 px-8 py-4 bg-[var(--color-brand-dark)] hover:bg-[var(--color-brand-dark)]/90 text-[#fff] rounded-full text-sm font-bold uppercase tracking-widest transition-all shadow-md cursor-pointer"
            >
              <LogIn size={18} />
              Continue with Google
            </button>
            <p className="text-[10px] uppercase tracking-widest text-[var(--color-brand-dark)]/40 mt-6 font-bold">
              Currently using local fallback / anonymous mode
            </p>
          </div>
        )}
      </div>
    </div>
  );
}
