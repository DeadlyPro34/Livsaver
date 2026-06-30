import React, { useState, useEffect } from "react";
import { User, LogIn, LogOut, Shield, ShieldCheck, Coins, Gift, Crown, AlertTriangle, X, Check } from "lucide-react";
import { auth } from "../lib/firebase";
import { GoogleAuthProvider, signInWithPopup, signOut, onAuthStateChanged, User as FirebaseUser } from "firebase/auth";
import { motion, AnimatePresence } from "motion/react";
import { useLanguage } from "../lib/LanguageContext";
import { getTranslation } from "../lib/i18n";

interface ProfileViewProps {
  showToast: (icon: string, message: string) => void;
  points: number;
  tier: "free" | "pro";
  userId?: string;
}

export default function ProfileView({ showToast, points, tier, userId }: ProfileViewProps) {
  const [user, setUser] = useState<FirebaseUser | null>(null);
  const [loading, setLoading] = useState(true);
  const [showPricingModal, setShowPricingModal] = useState(false);
  const [currencyCode, setCurrencyCode] = useState("USD");
  const [exchangeRate, setExchangeRate] = useState(1);
  const { language } = useLanguage();
  const isRealUser = user && !user.isAnonymous;

  useEffect(() => {
    // Determine currency based on IP
    fetch("https://ipapi.co/json/")
      .then(res => res.json())
      .then(data => {
        if (data && data.currency) {
          setCurrencyCode(data.currency);
          if (data.currency !== "USD") {
            fetch("https://open.er-api.com/v6/latest/USD")
              .then(res => res.json())
              .then(ratesData => {
                if (ratesData && ratesData.rates && ratesData.rates[data.currency]) {
                  setExchangeRate(ratesData.rates[data.currency]);
                }
              }).catch(console.error);
          }
        }
      }).catch(console.error);
  }, []);

  const formatPrice = (usdPrice: number) => {
    if (usdPrice === 0) return "Free";
    const converted = usdPrice * exchangeRate;
    try {
      return new Intl.NumberFormat(undefined, { style: "currency", currency: currencyCode }).format(converted);
    } catch {
      return `${currencyCode} ${converted.toFixed(2)}`;
    }
  };

  const handleRazorpayPayment = (planPrice: number, planName: string) => {
    if (!isRealUser) {
      showToast("Shield", "Please sign in with Google to subscribe.");
      return;
    }

    if (!window.Razorpay) {
      showToast("X", "Payment system is loading, please try again in a moment.");
      return;
    }

    const options = {
      key: import.meta.env.VITE_RAZORPAY_KEY_ID,
      amount: Math.round(planPrice * 100), // amount in paise
      currency: "INR",
      name: "LifeSaver AI",
      description: planName,
      prefill: {
        name: user?.displayName || "",
        email: user?.email || "",
      },
      theme: {
        color: "#1a1a2e",
      },
      handler: async function (response: any) {
        if (response.razorpay_payment_id && userId) {
          const { setDoc, doc } = await import("firebase/firestore");
          const { db } = await import("../lib/firebase");
          await setDoc(
            doc(db, "users", userId),
            {
              tier: "pro",
              razorpay_payment_id: response.razorpay_payment_id,
              subscribedAt: new Date().toISOString(),
              plan: planName,
            },
            { merge: true }
          );
          setShowPricingModal(false);
          showToast("Crown", "Payment successful! Welcome to Pro.");
        }
      },
      modal: {
        ondismiss: () => {
          showToast("X", "Payment cancelled.");
        },
      },
    };

    const rzp = new window.Razorpay(options);
    rzp.open();
  };

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
      const currentUser = auth.currentUser;
      if (currentUser?.isAnonymous) {
        showToast("AlertTriangle", "Signing in creates a new account. Previous data will not carry over.");
        await new Promise(res => setTimeout(res, 2000)); // let toast show
      }
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

  return (
    <motion.div 
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      exit={{ opacity: 0, y: -20 }}
      transition={{ duration: 0.4, ease: "easeOut" }}
      className="space-y-12 pb-16"
    >
      {/* Header */}
      <div className="border-b border-[var(--color-brand-dark)]/20 pb-8 md:pb-12 pt-4">
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
          <div className="bg-[var(--color-brand-white)] border border-[var(--color-brand-dark)]/20 rounded-[14px] p-8 shadow-sm flex flex-col items-center text-center">
            {user.photoURL ? (
              <img src={user.photoURL} alt="Profile" referrerPolicy="no-referrer" className="w-24 h-24 rounded-full border-4 border-[var(--color-brand-dark)]/20 mb-6 object-cover" />
            ) : (
              <div className="w-24 h-24 rounded-full border-4 border-[var(--color-brand-dark)]/20 mb-6 bg-[var(--color-brand-cream)] flex items-center justify-center text-[var(--color-brand-dark)]">
                <User size={40} />
              </div>
            )}
            
            <h3 className="text-2xl font-serif text-[var(--color-brand-dark)] mb-2">
              {user.displayName || "Explorer"}
            </h3>
            <p className="text-sm text-[var(--color-brand-dark)]/60 mb-8 font-medium">
              {user.email}
            </p>

            <div className="flex items-center gap-2 px-4 py-2 bg-[var(--color-brand-cream)] text-[var(--color-brand-dark)] rounded-full text-[10px] font-bold uppercase tracking-widest mb-10 border border-[var(--color-brand-dark)]/20">
              <ShieldCheck size={14} className="text-[var(--color-brand-primary)]" />
              Verified Account
            </div>

            <button
              onClick={handleLogout}
              className="flex items-center gap-2 px-6 py-3 bg-[var(--color-brand-accent)] hover:brightness-95 text-[var(--color-text-on-cream)] rounded-[8px] text-sm font-bold uppercase tracking-widest transition-all cursor-pointer"
            >
              <LogOut size={16} />
              Sign Out
            </button>
          </div>
        ) : (
          <div className="bg-[var(--color-brand-white)] border border-[var(--color-brand-dark)]/20 rounded-[14px] p-8 md:p-12 shadow-sm flex flex-col items-center text-center">
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
              className="flex items-center gap-3 px-8 py-4 bg-[var(--color-brand-dark)] hover:bg-[var(--color-brand-dark)]/90 text-[var(--color-text-on-dark)] rounded-full text-sm font-bold uppercase tracking-widest transition-all shadow-md cursor-pointer"
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

      {!isRealUser && (
        <div className="bg-[var(--color-brand-cream)] border border-[var(--color-brand-dark)]/20 p-4 rounded-[14px] flex items-start gap-4">
          <AlertTriangle size={24} className="text-[var(--color-brand-dark)] shrink-0 mt-1" />
          <p className="text-sm text-[var(--color-brand-dark)] font-medium leading-relaxed">
            Warning: Your data is currently stored anonymously. If you clear your browser data or use a different device, your tasks and points will be lost. Sign in to permanently save your progress.
          </p>
        </div>
      )}

      {/* Rewards & Tier Section */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        <div className="bg-[var(--color-brand-white)] border border-[var(--color-brand-dark)]/20 rounded-[14px] p-6 shadow-sm flex flex-col items-center text-center relative overflow-hidden group">
          <div className="absolute top-0 right-0 p-4 text-[var(--color-brand-dark)]/10 group-hover:text-[var(--color-brand-dark)]/20 transition-colors">
            <Coins size={100} className="-rotate-12 transform translate-x-4 -translate-y-4" />
          </div>
          <div className="w-16 h-16 rounded-full bg-[var(--color-brand-cream)] flex items-center justify-center text-[var(--color-brand-dark)] mb-4 z-10">
            <Gift size={24} />
          </div>
          <h4 className="text-[10px] font-bold uppercase tracking-widest text-[var(--color-brand-dark)]/60 mb-2 z-10">{getTranslation(language, 'yourPoints')}</h4>
          <div className="text-5xl font-black text-[var(--color-brand-dark)] tracking-tighter tabular-nums mb-4 z-10">{points}</div>
          <p className="text-xs text-[var(--color-brand-dark)]/70 mb-6 z-10">{getTranslation(language, 'accumulatePoints')}</p>
          
          <button 
            onClick={() => showToast("Gift", points >= 1000 ? "Redeeming $5 Google Voucher..." : "Need 1000 points to redeem a voucher.")}
            className="mt-auto px-6 py-3 border border-[var(--color-brand-dark)] hover:bg-[var(--color-brand-dark)] hover:text-[var(--color-text-on-dark)] text-[var(--color-brand-dark)] rounded-[10px] text-xs font-bold uppercase tracking-widest transition-colors z-10 w-full"
          >
            {getTranslation(language, 'redeemVoucher')}
          </button>
        </div>

        <div className={`bg-[var(--color-brand-white)] border ${tier === 'pro' ? 'border-[var(--color-brand-dark)] border-2' : 'border-[var(--color-brand-dark)]/20'} rounded-[14px] p-6 shadow-sm flex flex-col items-center text-center relative overflow-hidden`}>
          <div className="w-16 h-16 rounded-full bg-[var(--color-brand-dark)] flex items-center justify-center text-[var(--color-text-on-dark)] mb-4">
            <Crown size={24} />
          </div>
          <h4 className="text-[10px] font-bold uppercase tracking-widest text-[var(--color-brand-dark)]/60 mb-2">{getTranslation(language, 'membershipTier')}</h4>
          <div className="text-3xl font-serif italic text-[var(--color-brand-dark)] mb-4">
            {tier === "pro" ? getTranslation(language, "pro") : getTranslation(language, "free")}
          </div>
          <p className="text-xs text-[var(--color-brand-dark)]/70 mb-6">
            {tier === "pro" ? "You have access to unlimited AI insights and analytics." : "Upgrade to unlock AI prioritization, advanced insights, and more."}
          </p>
          
          {tier === "free" && (
            <button 
              onClick={() => setShowPricingModal(true)}
              className="mt-auto px-6 py-3 bg-[var(--color-brand-primary)] hover:brightness-105 text-[var(--color-brand-dark)] rounded-[10px] text-xs font-bold uppercase tracking-widest transition-colors w-full"
            >
              {getTranslation(language, "upgrade")}
            </button>
          )}
        </div>
      </div>

      {/* Pricing Modal */}
      <AnimatePresence>
        {showPricingModal && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-[var(--color-brand-dark)]/40 backdrop-blur-sm"
          >
            <motion.div
              initial={{ scale: 0.95, y: 20 }}
              animate={{ scale: 1, y: 0 }}
              exit={{ scale: 0.95, y: 20 }}
              className="bg-[color:var(--color-bg-base)] rounded-[20px] w-full max-w-4xl max-h-[90vh] overflow-y-auto overscroll-contain shadow-2xl border border-[color:var(--color-brand-dark)]/20 relative"
              data-lenis-prevent="true"
            >
              <button
                onClick={() => setShowPricingModal(false)}
                className="absolute top-4 right-4 p-2 bg-[var(--color-brand-white)] rounded-full text-[var(--color-brand-dark)] hover:bg-[var(--color-brand-cream)] transition-colors z-10 shadow-sm"
              >
                <X size={20} />
              </button>

              <div className="p-8 md:p-12">
                <div className="text-center mb-10">
                  <h2 className="text-4xl md:text-5xl font-serif italic font-normal text-[var(--color-brand-dark)] mb-4">
                    {getTranslation(language, 'choosePlan')}
                  </h2>
                  <p className="text-[var(--color-brand-dark)]/70 text-sm max-w-lg mx-auto leading-relaxed">
                    Unlock powerful AI insights and build better habits with our premium features. Prices are localized to your currency ({currencyCode}).
                  </p>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                  {/* Free Plan */}
                  <div className="bg-[var(--color-brand-white)] rounded-[16px] p-6 border border-[var(--color-brand-dark)]/20 flex flex-col relative opacity-80">
                    <h3 className="text-xl font-bold text-[var(--color-brand-dark)] mb-2">Free</h3>
                    <div className="text-3xl font-black text-[var(--color-brand-dark)] mb-6 tracking-tighter">
                      {formatPrice(0)}
                    </div>
                    <ul className="space-y-4 mb-8 flex-1 text-sm text-[var(--color-brand-dark)]/80">
                      <li className="flex items-start gap-2"><Check size={16} className="text-[var(--color-brand-primary)] mt-0.5 shrink-0" /> Basic Task Management</li>
                      <li className="flex items-start gap-2"><Check size={16} className="text-[var(--color-brand-primary)] mt-0.5 shrink-0" /> Local Storage</li>
                      <li className="flex items-start gap-2"><Check size={16} className="text-[var(--color-brand-primary)] mt-0.5 shrink-0" /> Limited Focus Sessions</li>
                    </ul>
                    <button className="w-full py-3 px-4 border border-[color:var(--color-brand-dark)] text-[color:var(--color-brand-dark)] rounded-[10px] text-xs font-bold uppercase tracking-widest bg-[color:var(--color-brand-cream)] cursor-not-allowed">
                      {getTranslation(language, "current")}
                    </button>
                  </div>

                  {/* Pro Monthly */}
                  <div className="bg-[var(--color-brand-white)] rounded-[16px] p-6 border-2 border-[var(--color-brand-dark)] shadow-lg flex flex-col relative transform md:-translate-y-4">
                    <div className="absolute -top-3 left-1/2 -translate-x-1/2 bg-[var(--color-brand-dark)] text-[var(--color-text-on-dark)] px-3 py-1 rounded-full text-[10px] font-bold uppercase tracking-widest">
                      Most Popular
                    </div>
                    <h3 className="text-xl font-bold text-[var(--color-brand-dark)] mb-2">Pro {getTranslation(language, "monthly")}</h3>
                    <div className="text-3xl font-black text-[var(--color-brand-dark)] mb-1 tracking-tighter">
                      {formatPrice(4.99)}<span className="text-sm font-normal text-[var(--color-brand-dark)]/50">/mo</span>
                    </div>
                    <ul className="space-y-4 mb-8 mt-6 flex-1 text-sm text-[var(--color-brand-dark)]/80">
                      <li className="flex items-start gap-2"><Check size={16} className="text-[var(--color-brand-primary)] mt-0.5 shrink-0" /> AI Task Prioritization</li>
                      <li className="flex items-start gap-2"><Check size={16} className="text-[var(--color-brand-primary)] mt-0.5 shrink-0" /> Voice Assistant</li>
                      <li className="flex items-start gap-2"><Check size={16} className="text-[var(--color-brand-primary)] mt-0.5 shrink-0" /> Unlimited Cloud Sync</li>
                      <li className="flex items-start gap-2"><Check size={16} className="text-[var(--color-brand-primary)] mt-0.5 shrink-0" /> Advanced Analytics</li>
                    </ul>
                    <button 
                      onClick={() => handleRazorpayPayment(499, "Pro Monthly")}
                      className="w-full py-3 px-4 bg-[var(--color-brand-dark)] text-[var(--color-text-on-dark)] hover:bg-[var(--color-brand-dark)]/90 rounded-[10px] text-xs font-bold uppercase tracking-widest transition-colors flex items-center justify-center gap-2"
                    >
                      Pay with Razorpay
                    </button>
                  </div>

                  {/* Pro Yearly */}
                  <div className="bg-[var(--color-brand-white)] rounded-[16px] p-6 border border-[var(--color-brand-primary)] shadow-sm flex flex-col relative">
                     <div className="absolute -top-3 left-1/2 -translate-x-1/2 bg-[var(--color-brand-primary)] text-[var(--color-brand-dark)] px-3 py-1 rounded-full text-[10px] font-bold uppercase tracking-widest">
                      Save 20%
                    </div>
                    <h3 className="text-xl font-bold text-[var(--color-brand-dark)] mb-2">Pro {getTranslation(language, "yearly")}</h3>
                    <div className="text-3xl font-black text-[var(--color-brand-dark)] mb-1 tracking-tighter">
                      {formatPrice(47.90)}<span className="text-sm font-normal text-[var(--color-brand-dark)]/50">/yr</span>
                    </div>
                    <ul className="space-y-4 mb-8 mt-6 flex-1 text-sm text-[var(--color-brand-dark)]/80">
                      <li className="flex items-start gap-2"><Check size={16} className="text-[var(--color-brand-primary)] mt-0.5 shrink-0" /> All Pro Features</li>
                      <li className="flex items-start gap-2"><Check size={16} className="text-[var(--color-brand-primary)] mt-0.5 shrink-0" /> Priority Support</li>
                      <li className="flex items-start gap-2"><Check size={16} className="text-[var(--color-brand-primary)] mt-0.5 shrink-0" /> Early Access to Beta</li>
                    </ul>
                    <button 
                      onClick={() => handleRazorpayPayment(4790, "Pro Yearly")}
                      className="w-full py-3 px-4 bg-[var(--color-brand-primary)] text-[var(--color-brand-dark)] hover:brightness-105 rounded-[10px] text-xs font-bold uppercase tracking-widest transition-colors flex items-center justify-center gap-2"
                    >
                      Pay with Razorpay
                    </button>
                  </div>
                </div>
              </div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>

    </motion.div>
  );
}
