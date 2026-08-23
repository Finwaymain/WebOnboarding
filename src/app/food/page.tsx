"use client";

import { useSearchParams } from "next/navigation";
import { Suspense, useEffect, useState } from "react";
import {
  Utensils,
  Sparkles,
  Flame,
  ArrowLeft,
  CheckCircle2,
  BellRing,
  Bike,
  Wallet
} from "lucide-react";

function FoodContent() {
  const searchParams = useSearchParams();
  const [theme, setTheme] = useState<string>("light");
  const [notified, setNotified] = useState(false);

  useEffect(() => {
    const qTheme = searchParams.get("theme");
    if (qTheme) {
      setTheme(qTheme);
    } else if (window.matchMedia && window.matchMedia("(prefers-color-scheme: dark)").matches) {
      setTheme("dark");
    }
  }, [searchParams]);

  const isDark = theme === "dark";

  const handleClose = () => {
    if ((window as any).AppBridge) {
      (window as any).AppBridge.postMessage("close");
    } else if (window.history.length > 1) {
      window.history.back();
    }
  };

  const handleNotify = () => {
    setNotified(true);
    setTimeout(() => {
      setNotified(false);
    }, 3000);
  };

  return (
    <div
      className={`min-h-screen font-sans ${
        isDark ? "bg-slate-950 text-slate-100" : "bg-slate-50 text-slate-900"
      }`}
    >
      {/* Header Bar */}
      <div
        className={`sticky top-0 z-30 px-4 py-3.5 flex items-center justify-between border-b backdrop-blur-md ${
          isDark
            ? "bg-slate-950/80 border-slate-800 text-white"
            : "bg-white/80 border-slate-200 text-slate-900"
        }`}
      >
        <button
          onClick={handleClose}
          className={`p-2 rounded-xl border transition-colors ${
            isDark
              ? "bg-slate-900 border-slate-800 text-slate-300 hover:bg-slate-800"
              : "bg-slate-100 border-slate-200 text-slate-700 hover:bg-slate-200"
          }`}
        >
          <ArrowLeft className="w-5 h-5" />
        </button>
        <div className="flex items-center gap-2">
          <div className="w-7 h-7 rounded-lg bg-[#6AA720] flex items-center justify-center text-white">
            <Utensils className="w-4 h-4" />
          </div>
          <span className="font-bold text-base tracking-wide">Fiinway Food</span>
        </div>
        <div className="w-9" />
      </div>

      <div className="max-w-lg mx-auto p-4 space-y-5 pb-12">
        {/* Hero Banner */}
        <div className="relative overflow-hidden rounded-3xl bg-gradient-to-br from-[#6AA720] via-[#5b921b] to-[#15803D] p-6 text-white shadow-lg">
          <div className="absolute -right-8 -top-8 w-36 h-36 bg-white/10 rounded-full blur-2xl pointer-events-none" />
          <div className="absolute -left-8 -bottom-8 w-36 h-36 bg-black/10 rounded-full blur-xl pointer-events-none" />

          <div className="relative z-10 space-y-3">
            <div className="inline-flex items-center gap-1.5 px-3 py-1 bg-white/20 backdrop-blur-md rounded-full text-xs font-extrabold uppercase tracking-wider text-white">
              <Sparkles className="w-3.5 h-3.5" />
              <span>Coming Soon</span>
            </div>

            <h1 className="text-2xl sm:text-3xl font-extrabold leading-tight">
              Delicious Meals Delivered at Lightning Speed 🚀
            </h1>

            <p className="text-xs sm:text-sm text-emerald-50 font-medium leading-relaxed">
              We are curating the finest restaurants, cloud kitchens, and cafes in your area to bring fresh, hot cuisines straight to your doorstep.
            </p>
          </div>
        </div>

        {/* Feature Highlights Grid */}
        <div className="grid grid-cols-1 gap-3">
          <div
            className={`p-4 rounded-2xl border transition-all ${
              isDark ? "bg-slate-900/90 border-slate-800" : "bg-white border-slate-200"
            } shadow-sm flex items-start gap-3.5`}
          >
            <div className="w-11 h-11 rounded-xl bg-orange-500/10 text-orange-500 flex items-center justify-center shrink-0">
              <Flame className="w-6 h-6" />
            </div>
            <div className="space-y-0.5 min-w-0">
              <h3 className="font-bold text-sm">Top Restaurants & Cuisines</h3>
              <p className={`text-xs ${isDark ? "text-slate-400" : "text-slate-600"}`}>
                From mouth-watering local street eats to gourmet dine-out menus.
              </p>
            </div>
          </div>

          <div
            className={`p-4 rounded-2xl border transition-all ${
              isDark ? "bg-slate-900/90 border-slate-800" : "bg-white border-slate-200"
            } shadow-sm flex items-start gap-3.5`}
          >
            <div className="w-11 h-11 rounded-xl bg-emerald-500/10 text-[#6AA720] flex items-center justify-center shrink-0">
              <Bike className="w-6 h-6" />
            </div>
            <div className="space-y-0.5 min-w-0">
              <h3 className="font-bold text-sm">Ultra-Fast Priority Delivery</h3>
              <p className={`text-xs ${isDark ? "text-slate-400" : "text-slate-600"}`}>
                Real-time tracking with dedicated Fiinway Delivery Captains.
              </p>
            </div>
          </div>

          <div
            className={`p-4 rounded-2xl border transition-all ${
              isDark ? "bg-slate-900/90 border-slate-800" : "bg-white border-slate-200"
            } shadow-sm flex items-start gap-3.5`}
          >
            <div className="w-11 h-11 rounded-xl bg-blue-500/10 text-blue-500 flex items-center justify-center shrink-0">
              <Wallet className="w-6 h-6" />
            </div>
            <div className="space-y-0.5 min-w-0">
              <h3 className="font-bold text-sm">Smart Value Cashback Rewards</h3>
              <p className={`text-xs ${isDark ? "text-slate-400" : "text-slate-600"}`}>
                Pay with Fiinway Smart Value Wallet & get exclusive cashback discounts on every order.
              </p>
            </div>
          </div>
        </div>

        {/* Notify Me Card */}
        <div
          className={`p-5 rounded-2xl border text-center space-y-3 ${
            isDark ? "bg-slate-900/60 border-slate-800" : "bg-white border-slate-200"
          }`}
        >
          <div className="w-12 h-12 mx-auto rounded-full bg-[#6AA720]/10 text-[#6AA720] flex items-center justify-center">
            <BellRing className="w-6 h-6" />
          </div>
          <div className="space-y-1">
            <h4 className="font-bold text-sm">Be the first to know when we launch!</h4>
            <p className={`text-xs ${isDark ? "text-slate-400" : "text-slate-600"}`}>
              We are currently in beta onboarding with restaurant partners in your city.
            </p>
          </div>

          {notified ? (
            <div className="inline-flex items-center gap-1.5 px-4 py-2.5 bg-emerald-600/10 text-[#15803D] rounded-xl text-xs font-bold">
              <CheckCircle2 className="w-4 h-4" />
              <span>You will be notified on launch!</span>
            </div>
          ) : (
            <button
              onClick={handleNotify}
              className="w-full py-3 bg-[#6AA720] hover:bg-[#5b921b] text-white text-xs font-bold rounded-xl shadow-md transition-all uppercase tracking-wider active:scale-[0.98]"
            >
              Notify Me On Launch
            </button>
          )}
        </div>
      </div>
    </div>
  );
}

export default function FoodPage() {
  return (
    <Suspense
      fallback={
        <div className="min-h-screen flex items-center justify-center bg-slate-50 dark:bg-slate-950 text-slate-600 dark:text-slate-300">
          Loading...
        </div>
      }
    >
      <FoodContent />
    </Suspense>
  );
}
