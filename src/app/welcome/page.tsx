"use client";

import { useSearchParams } from "next/navigation";
import { Suspense, useState, useEffect, useRef } from "react";
import {
  ChevronRight,
  ArrowRight,
  CheckCircle2,
  Users,
  Calendar,
  CreditCard,
  TrendingUp,
  Wrench,
  Store,
  ShieldCheck,
  Headphones,
  Copy,
  Check
} from "lucide-react";

function WelcomeContent() {
  const searchParams = useSearchParams();
  const [appType, setAppType] = useState<"user" | "driver">("user");
  const [currentSlide, setCurrentSlide] = useState(1);
  const [driverId, setDriverId] = useState<string | null>(null);
  const [userId, setUserId] = useState<string | null>(null);
  const [token, setToken] = useState<string | null>(null);

  // Touch Swipe State
  const touchStartX = useRef<number>(0);
  const touchEndX = useRef<number>(0);

  useEffect(() => {
    if (typeof window !== "undefined") {
      const params = new URLSearchParams(window.location.search);
      const t =
        params.get("type") ||
        params.get("user_type") ||
        params.get("role") ||
        searchParams.get("type") ||
        searchParams.get("user_type");

      if (t === "driver" || t === "conducteur" || t === "business") {
        setAppType("driver");
      } else {
        setAppType("user");
      }

      setDriverId(params.get("driver_id") || searchParams.get("driver_id"));
      setUserId(params.get("user_id") || searchParams.get("user_id"));
      setToken(params.get("accesstoken") || searchParams.get("accesstoken"));
    }
  }, [searchParams]);

  const handleNext = () => {
    if (currentSlide < 5) {
      setCurrentSlide((prev) => prev + 1);
    } else {
      finishWelcome("finishWelcome");
    }
  };

  const finishWelcome = (mode: string = "finishWelcome") => {
    if (typeof window !== "undefined" && (window as any).AppBridge) {
      (window as any).AppBridge.postMessage(mode);
    } else if (typeof window !== "undefined" && (window as any).flutter_inappwebview) {
      (window as any).flutter_inappwebview.callHandler(mode);
    } else {
      if (mode === "login") {
        window.location.href = "/login";
      } else {
        window.location.href = "/onboarding";
      }
    }
  };

  const handleTouchStart = (e: React.TouchEvent) => {
    touchStartX.current = e.touches[0].clientX;
  };

  const handleTouchMove = (e: React.TouchEvent) => {
    touchEndX.current = e.touches[0].clientX;
  };

  const handleTouchEnd = () => {
    const diff = touchStartX.current - touchEndX.current;
    if (diff > 50 && currentSlide < 5) {
      setCurrentSlide((prev) => prev + 1);
    } else if (diff < -50 && currentSlide > 1) {
      setCurrentSlide((prev) => prev - 1);
    }
  };

  return (
    <div
      className="min-h-screen bg-[#F8FAFC] text-slate-900 font-sans flex flex-col justify-between select-none overflow-x-hidden p-4 pt-6 pb-6"
      onTouchStart={handleTouchStart}
      onTouchMove={handleTouchMove}
      onTouchEnd={handleTouchEnd}
    >
      {/* ──────────────────────────────────────────────────────────────────────────
          DRIVER WELCOME UI (Fiinway Business)
         ────────────────────────────────────────────────────────────────────────── */}
      {appType === "driver" && (
        <div className="max-w-md mx-auto w-full flex-1 flex flex-col justify-between space-y-6">
          {/* Top Bar */}
          <div className="flex items-center justify-between pt-2 pb-2">
            <div className="flex items-center gap-2.5">
              <img
                src="/ic_launcher.png"
                onError={(e) => {
                  (e.target as HTMLElement).setAttribute("src", "/onboarding-assets/ic_launcher.png");
                }}
                alt="Fiinway Business"
                className="w-9 h-9 object-contain rounded-xl shadow-xs"
              />
              <span className="text-xs font-black tracking-wider text-slate-800 uppercase">
                Fiinway Business
              </span>
            </div>
            <div className="flex items-center gap-1 bg-slate-100 px-2.5 py-1 rounded-full text-[11px] font-extrabold text-slate-600">
              <span>Step {currentSlide}</span>
              <span className="text-slate-400">/ 5</span>
            </div>
          </div>

          {/* Driver Slide 1 */}
          {currentSlide === 1 && (
            <div className="space-y-6 my-auto text-center">
              <div className="w-20 h-20 rounded-3xl bg-gradient-to-tr from-emerald-600 to-teal-500 text-white font-black text-4xl flex items-center justify-center mx-auto shadow-xl">
                💼
              </div>
              <div className="space-y-2">
                <h1 className="text-2xl font-black text-[#1E1B4B]">Welcome Driver & Partner</h1>
                <p className="text-xs font-semibold text-slate-500 max-w-[85%] mx-auto leading-relaxed">
                  Earn more on your schedule. Accept rides, parcel deliveries, and service requests in one super app.
                </p>
              </div>

              <div className="bg-emerald-50 rounded-2xl p-4 border border-emerald-100 space-y-2 text-left">
                <div className="flex items-center gap-2 text-xs font-bold text-emerald-800">
                  <CheckCircle2 className="w-4 h-4 text-emerald-600 shrink-0" /> 0% Commission Intro Offer
                </div>
                <div className="flex items-center gap-2 text-xs font-bold text-emerald-800">
                  <CheckCircle2 className="w-4 h-4 text-emerald-600 shrink-0" /> Daily Instant Wallet Payouts
                </div>
                <div className="flex items-center gap-2 text-xs font-bold text-emerald-800">
                  <CheckCircle2 className="w-4 h-4 text-emerald-600 shrink-0" /> Guaranteed Partner Referral Bonuses
                </div>
              </div>
            </div>
          )}

          {/* Driver Slide 2 */}
          {currentSlide === 2 && (
            <div className="space-y-6 my-auto text-center">
              <div className="text-6xl animate-pulse">🚗 🛵 🚚</div>
              <div className="space-y-2">
                <h2 className="text-2xl font-black text-[#1E1B4B]">Multiple Ways to Earn</h2>
                <p className="text-xs font-semibold text-slate-500 max-w-[85%] mx-auto leading-relaxed">
                  Choose your vehicle or service category. Get continuous trip requests around your location.
                </p>
              </div>

              <div className="grid grid-cols-2 gap-3 text-left">
                <div className="bg-white p-3.5 rounded-2xl border border-slate-100 shadow-2xs space-y-1">
                  <span className="text-xl">🚕</span>
                  <p className="text-xs font-extrabold text-slate-800">Taxi & Auto Rides</p>
                  <p className="text-[10px] text-slate-400 font-medium">City & Outstation rides</p>
                </div>
                <div className="bg-white p-3.5 rounded-2xl border border-slate-100 shadow-2xs space-y-1">
                  <span className="text-xl">🛵</span>
                  <p className="text-xs font-extrabold text-slate-800">Parcel & Delivery</p>
                  <p className="text-[10px] text-slate-400 font-medium">Instant package drops</p>
                </div>
              </div>
            </div>
          )}

          {/* Driver Slide 3 */}
          {currentSlide === 3 && (
            <div className="space-y-6 my-auto text-center">
              <div className="w-20 h-20 rounded-3xl bg-blue-50 text-blue-600 flex items-center justify-center text-4xl mx-auto border border-blue-100 shadow-xs">
                📍
              </div>
              <div className="space-y-2">
                <h2 className="text-2xl font-black text-[#1E1B4B]">Real-Time Navigation</h2>
                <p className="text-xs font-semibold text-slate-500 max-w-[85%] mx-auto leading-relaxed">
                  Turn-by-turn map guidance and instant pickup notifications to minimize idle time.
                </p>
              </div>

              <div className="bg-white p-4 rounded-2xl border border-slate-100 shadow-2xs text-left space-y-2">
                <div className="flex items-center gap-3">
                  <div className="w-8 h-8 rounded-xl bg-emerald-50 text-emerald-600 flex items-center justify-center">
                    🎧
                  </div>
                  <div>
                    <p className="text-xs font-bold text-slate-800">24/7 Driver Support</p>
                    <p className="text-[10px] text-slate-400 font-medium">Dedicated support helpline anytime</p>
                  </div>
                </div>
              </div>
            </div>
          )}

          {/* Driver Slide 4 */}
          {currentSlide === 4 && (
            <div className="space-y-6 my-auto text-center">
              <div className="w-20 h-20 rounded-3xl bg-amber-50 text-amber-600 flex items-center justify-center text-4xl mx-auto border border-amber-100 shadow-xs">
                👛
              </div>
              <div className="space-y-2">
                <h2 className="text-2xl font-black text-[#1E1B4B]">Transparent Wallet & Earnings</h2>
                <p className="text-xs font-semibold text-slate-500 max-w-[85%] mx-auto leading-relaxed">
                  Track every rupee earned per trip. Withdraw earnings directly to your bank account anytime.
                </p>
              </div>

              <div className="bg-gradient-to-r from-emerald-50 to-teal-50 rounded-2xl p-4 border border-emerald-100 text-left flex items-center justify-between">
                <div>
                  <p className="text-[10px] font-bold text-slate-500 uppercase">Average Daily Earnings</p>
                  <p className="text-xl font-black text-slate-900 mt-0.5">₹1,500 - ₹3,500/day</p>
                </div>
                <span className="text-2xl">💰</span>
              </div>
            </div>
          )}

          {/* Driver Slide 5 */}
          {currentSlide === 5 && (
            <div className="space-y-6 my-auto text-center">
              <div className="w-20 h-20 rounded-3xl bg-gradient-to-tr from-emerald-600 to-teal-500 text-white flex items-center justify-center text-4xl mx-auto shadow-xl">
                🚀
              </div>
              <div className="space-y-2">
                <h2 className="text-2xl font-black text-[#1E1B4B]">Ready to Start Earning?</h2>
                <p className="text-xs font-semibold text-slate-500 max-w-[85%] mx-auto leading-relaxed">
                  Complete your quick online profile & document verification to get activated today.
                </p>
              </div>

              <button
                onClick={() => finishWelcome("finishWelcome")}
                className="w-full bg-emerald-600 hover:bg-emerald-700 text-white font-bold text-base py-4 rounded-2xl shadow-lg flex items-center justify-center gap-2 transition-all active:scale-[0.99]"
              >
                Register as Driver Partner <ArrowRight className="w-5 h-5" />
              </button>
            </div>
          )}

          {/* Driver Footer Navigation */}
          <div className="flex items-center justify-between pt-4 border-t border-slate-100 z-20">
            {currentSlide < 5 ? (
              <button
                onClick={() => finishWelcome("finishWelcome")}
                className="text-xs font-bold text-slate-400 hover:text-slate-600 px-3 py-2 transition-colors"
              >
                Skip
              </button>
            ) : (
              <div className="w-12"></div>
            )}

            {/* Dots */}
            <div className="flex items-center gap-1.5">
              {[1, 2, 3, 4, 5].map((idx) => (
                <span
                  key={idx}
                  onClick={() => setCurrentSlide(idx)}
                  className={`h-2 rounded-full transition-all cursor-pointer ${
                    currentSlide === idx ? "w-6 bg-emerald-600" : "w-2 bg-slate-200 hover:bg-slate-300"
                  }`}
                ></span>
              ))}
            </div>

            {currentSlide < 5 ? (
              <button
                onClick={handleNext}
                className="bg-emerald-600 hover:bg-emerald-700 text-white text-xs font-bold px-4 py-2 rounded-full shadow-xs flex items-center gap-1 transition-all active:scale-[0.98]"
              >
                Next <ChevronRight className="w-4 h-4" />
              </button>
            ) : (
              <div className="w-12"></div>
            )}
          </div>
        </div>
      )}

      {/* ──────────────────────────────────────────────────────────────────────────
          USER WELCOME UI (Fiinway User App - 5 Screens)
         ────────────────────────────────────────────────────────────────────────── */}
      {appType === "user" && (
        <div className="max-w-md mx-auto w-full flex-1 flex flex-col justify-between space-y-6">
          {/* USER SLIDE 1 */}
          {currentSlide === 1 && (
            <div className="max-w-md mx-auto w-full flex-1 flex flex-col justify-between space-y-6">
              {/* Top Logo */}
              <div className="flex flex-col items-center pt-4 space-y-2">
                <img
                  src="/ic_launcher.png"
                  onError={(e) => {
                    (e.target as HTMLElement).setAttribute("src", "/onboarding-assets/ic_launcher.png");
                  }}
                  alt="Fiinway"
                  className="w-16 h-16 object-contain rounded-2xl shadow-lg"
                />
                <h1 className="text-2xl font-black text-[#1E1B4B] tracking-tight">Fiinway</h1>
                <span className="text-[10px] font-extrabold text-emerald-700 tracking-widest uppercase bg-emerald-50 px-3 py-1 rounded-full border border-emerald-100">
                  SERVE • CONNECT • EARN
                </span>
              </div>

              {/* Main Titles */}
              <div className="text-center space-y-1.5">
                <h2 className="text-2xl font-black text-[#1E1B4B]">Welcome to Fiinway</h2>
                <p className="text-xs font-semibold text-slate-500">
                  One Super App for all your daily needs.
                </p>
              </div>

              {/* Illustration Box */}
              <div className="bg-gradient-to-b from-emerald-50/60 to-slate-100/50 rounded-3xl p-6 border border-emerald-100/60 shadow-xs flex items-center justify-center relative my-2 overflow-hidden min-h-[220px]">
                <div className="relative z-10 text-center space-y-4">
                  <div className="text-6xl animate-bounce">🛋️📱</div>
                  <div className="flex justify-center gap-3">
                    <span className="px-3 py-1.5 bg-white rounded-2xl shadow-xs text-xs font-bold text-slate-700 flex items-center gap-1">
                      🚗 Transport
                    </span>
                    <span className="px-3 py-1.5 bg-white rounded-2xl shadow-xs text-xs font-bold text-slate-700 flex items-center gap-1">
                      🛒 Shopping
                    </span>
                  </div>
                  <div className="flex justify-center gap-3">
                    <span className="px-3 py-1.5 bg-white rounded-2xl shadow-xs text-xs font-bold text-slate-700 flex items-center gap-1">
                      🩺 Healthcare
                    </span>
                    <span className="px-3 py-1.5 bg-white rounded-2xl shadow-xs text-xs font-bold text-slate-700 flex items-center gap-1">
                      🛵 Delivery
                    </span>
                  </div>
                </div>
              </div>

              {/* Action Buttons */}
              <div className="space-y-4 pt-2">
                <button
                  onClick={handleNext}
                  className="w-full bg-[#0F172A] hover:bg-slate-800 text-white font-bold text-base py-4 rounded-2xl shadow-lg flex items-center justify-center gap-2 transition-all active:scale-[0.99]"
                >
                  Get Started <ArrowRight className="w-5 h-5" />
                </button>

                <div className="text-center">
                  <button
                    onClick={() => finishWelcome("login")}
                    className="text-xs font-extrabold text-slate-600 hover:text-emerald-700 transition-colors"
                  >
                    Already have an account? <span className="text-emerald-600 underline">Login</span>
                  </button>
                </div>
              </div>
            </div>
          )}

          {/* USER SLIDE 2 */}
          {currentSlide === 2 && (
            <div className="max-w-md mx-auto w-full flex-1 flex flex-col justify-between space-y-4">
              <div className="text-center space-y-1.5 pt-2">
                <h2 className="text-2xl font-black text-[#1E1B4B]">30+ Services All in One App</h2>
                <p className="text-xs font-semibold text-slate-500 max-w-[85%] mx-auto leading-snug">
                  From travel to healthcare, from food to home services, everything is here.
                </p>
              </div>

              {/* 12 Service Grid */}
              <div className="grid grid-cols-3 gap-2.5 my-2">
                {[
                  { icon: "🚕", title: "Transport", bg: "bg-emerald-50 text-emerald-700" },
                  { icon: "🛵", title: "Delivery", bg: "bg-orange-50 text-orange-700" },
                  { icon: "🍟", title: "Food & Kitchen", bg: "bg-amber-50 text-amber-700" },
                  { icon: "🏠", title: "Home Services", bg: "bg-blue-50 text-blue-700" },
                  { icon: "🩺", title: "Healthcare", bg: "bg-rose-50 text-rose-700" },
                  { icon: "💇", title: "Beauty & Salon", bg: "bg-pink-50 text-pink-700" },
                  { icon: "🎓", title: "Education", bg: "bg-indigo-50 text-indigo-700" },
                  { icon: "✈️", title: "Travel", bg: "bg-purple-50 text-purple-700" },
                  { icon: "🧹", title: "Cleaning", bg: "bg-teal-50 text-teal-700" },
                  { icon: "🛍️", title: "Shopping", bg: "bg-violet-50 text-violet-700" },
                  { icon: "👛", title: "Finance", bg: "bg-emerald-50 text-emerald-700" },
                  { icon: "•••", title: "More Services", bg: "bg-slate-100 text-slate-700" },
                ].map((item, idx) => (
                  <div
                    key={idx}
                    className="bg-white rounded-2xl p-3 border border-slate-100 shadow-2xs text-center flex flex-col items-center justify-center space-y-1.5"
                  >
                    <div className={`w-10 h-10 rounded-xl ${item.bg} flex items-center justify-center text-xl`}>
                      {item.icon}
                    </div>
                    <span className="text-[10px] font-extrabold text-slate-800 leading-tight">
                      {item.title}
                    </span>
                  </div>
                ))}
              </div>

              {/* Bottom Banner */}
              <div className="bg-gradient-to-r from-[#1E1B4B] to-slate-900 rounded-3xl p-4 text-white shadow-md flex items-center justify-between">
                <div className="space-y-0.5 max-w-[75%]">
                  <h3 className="text-xs font-black tracking-tight leading-snug">
                    One App. Unlimited Possibilities.
                  </h3>
                  <p className="text-[11px] font-bold text-amber-400">Endless Benefits.</p>
                </div>
                <div className="text-3xl">🛍️</div>
              </div>
            </div>
          )}

          {/* USER SLIDE 3 */}
          {currentSlide === 3 && (
            <div className="max-w-md mx-auto w-full flex-1 flex flex-col justify-between space-y-4">
              <div className="text-center space-y-1.5 pt-2">
                <h2 className="text-2xl font-black text-[#1E1B4B]">Book, Connect & Get Things Done</h2>
                <p className="text-xs font-semibold text-slate-500 max-w-[85%] mx-auto leading-snug">
                  Book services, track in real-time and get the best experience.
                </p>
              </div>

              {/* 3D Smartphone Illustration Box */}
              <div className="bg-gradient-to-b from-sky-50/70 to-blue-50/30 rounded-3xl p-6 border border-sky-100 shadow-xs flex items-center justify-center my-2 relative overflow-hidden min-h-[220px]">
                <div className="relative text-center space-y-3">
                  <div className="w-24 h-40 rounded-3xl bg-[#1E1B4B] border-4 border-slate-700 mx-auto shadow-2xl p-2 flex flex-col justify-between text-white">
                    <div className="w-8 h-2 rounded-full bg-slate-700 mx-auto"></div>
                    <div className="text-center">
                      <img
                        src="/ic_launcher.png"
                        onError={(e) => {
                          (e.target as HTMLElement).setAttribute("src", "/onboarding-assets/ic_launcher.png");
                        }}
                        alt="Fiinway"
                        className="w-8 h-8 object-contain rounded-xl mx-auto shadow-xs"
                      />
                      <p className="text-[8px] font-black mt-1">FIINWAY</p>
                    </div>
                    <div className="w-6 h-1 rounded-full bg-slate-700 mx-auto mb-1"></div>
                  </div>

                  <div className="absolute top-0 -left-6 text-3xl animate-pulse">🚕</div>
                  <div className="absolute top-8 -right-6 text-3xl animate-pulse">🛵</div>
                  <div className="absolute bottom-2 -left-6 text-3xl animate-pulse">✈️</div>
                  <div className="absolute bottom-6 -right-6 text-3xl animate-pulse">🧰</div>
                </div>
              </div>

              {/* 4 Feature Badges */}
              <div className="grid grid-cols-4 gap-2">
                <div className="bg-white rounded-2xl p-2.5 border border-slate-100 shadow-2xs text-center space-y-1">
                  <div className="w-7 h-7 rounded-xl bg-emerald-50 text-emerald-600 mx-auto flex items-center justify-center text-xs">
                    📝
                  </div>
                  <p className="text-[9px] font-bold text-slate-800 leading-tight">Easy Booking</p>
                </div>

                <div className="bg-white rounded-2xl p-2.5 border border-slate-100 shadow-2xs text-center space-y-1">
                  <div className="w-7 h-7 rounded-xl bg-emerald-50 text-emerald-600 mx-auto flex items-center justify-center text-xs">
                    📍
                  </div>
                  <p className="text-[9px] font-bold text-slate-800 leading-tight">Live Tracking</p>
                </div>

                <div className="bg-white rounded-2xl p-2.5 border border-slate-100 shadow-2xs text-center space-y-1">
                  <div className="w-7 h-7 rounded-xl bg-emerald-50 text-emerald-600 mx-auto flex items-center justify-center text-xs">
                    💳
                  </div>
                  <p className="text-[9px] font-bold text-slate-800 leading-tight">Secure Payment</p>
                </div>

                <div className="bg-white rounded-2xl p-2.5 border border-slate-100 shadow-2xs text-center space-y-1">
                  <div className="w-7 h-7 rounded-xl bg-emerald-50 text-emerald-600 mx-auto flex items-center justify-center text-xs">
                    🎧
                  </div>
                  <p className="text-[9px] font-bold text-slate-800 leading-tight">Quick Support</p>
                </div>
              </div>
            </div>
          )}

          {/* USER SLIDE 4 */}
          {currentSlide === 4 && (
            <div className="max-w-md mx-auto w-full flex-1 flex flex-col justify-between space-y-4">
              <div className="text-center space-y-1.5 pt-2">
                <h2 className="text-2xl font-black text-[#1E1B4B]">Save More Every Time</h2>
                <p className="text-xs font-semibold text-slate-500 max-w-[85%] mx-auto leading-snug">
                  Exclusive offers, cashback, loyalty rewards and much more.
                </p>
              </div>

              {/* 4 Card Banners */}
              <div className="space-y-2.5 my-2">
                <div className="bg-emerald-50/80 rounded-2xl p-3.5 border border-emerald-100 flex items-center justify-between shadow-2xs">
                  <div>
                    <h3 className="text-xs font-black text-slate-900">Exciting Offers & Discounts</h3>
                  </div>
                  <div className="w-9 h-9 rounded-xl bg-emerald-600 text-white flex items-center justify-center text-lg font-black shadow-xs">
                    %
                  </div>
                </div>

                <div className="bg-purple-50/80 rounded-2xl p-3.5 border border-purple-100 flex items-center justify-between shadow-2xs">
                  <div>
                    <h3 className="text-xs font-black text-slate-900">Cashback on Every Booking</h3>
                  </div>
                  <div className="w-9 h-9 rounded-xl bg-purple-600 text-white flex items-center justify-center text-lg shadow-xs">
                    👛
                  </div>
                </div>

                <div className="bg-amber-50/80 rounded-2xl p-3.5 border border-amber-100 flex items-center justify-between shadow-2xs">
                  <div>
                    <h3 className="text-xs font-black text-slate-900">Loyalty Rewards Just for You</h3>
                  </div>
                  <div className="w-9 h-9 rounded-xl bg-amber-500 text-white flex items-center justify-center text-lg shadow-xs">
                    🎁
                  </div>
                </div>

                <div className="bg-blue-50/80 rounded-2xl p-3.5 border border-blue-100 flex items-center justify-between shadow-2xs">
                  <div>
                    <h3 className="text-xs font-black text-slate-900">Partner & Earn Upto ₹500</h3>
                  </div>
                  <div className="w-9 h-9 rounded-xl bg-blue-600 text-white flex items-center justify-center text-lg shadow-xs">
                    🪙
                  </div>
                </div>
              </div>
            </div>
          )}

          {/* USER SLIDE 5 */}
          {currentSlide === 5 && (
            <div className="max-w-md mx-auto w-full flex-1 flex flex-col justify-between space-y-4">
              <div className="text-center space-y-1.5 pt-2">
                <h2 className="text-2xl font-black text-[#1E1B4B]">Everything You Need Right in Your Pocket</h2>
                <p className="text-xs font-semibold text-slate-500 max-w-[85%] mx-auto leading-snug">
                  Explore, choose and enjoy services that make life easier.
                </p>
              </div>

              {/* Circular Wheel Illustration */}
              <div className="bg-gradient-to-b from-indigo-50/60 to-purple-50/30 rounded-3xl p-6 border border-indigo-100 shadow-xs flex items-center justify-center my-2 relative min-h-[200px]">
                <div className="relative flex items-center justify-center">
                  <img
                    src="/ic_launcher.png"
                    onError={(e) => {
                      (e.target as HTMLElement).setAttribute("src", "/onboarding-assets/ic_launcher.png");
                    }}
                    alt="Fiinway"
                    className="w-20 h-20 object-contain rounded-2xl shadow-xl z-10"
                  />
                  <div className="absolute w-44 h-44 rounded-full border-2 border-dashed border-emerald-300 animate-spin-slow"></div>

                  <span className="absolute -top-10 text-2xl bg-white p-2 rounded-full shadow-xs">🚕</span>
                  <span className="absolute -bottom-10 text-2xl bg-white p-2 rounded-full shadow-xs">🛵</span>
                  <span className="absolute -left-10 text-2xl bg-white p-2 rounded-full shadow-xs">🏠</span>
                  <span className="absolute -right-10 text-2xl bg-white p-2 rounded-full shadow-xs">🩺</span>
                </div>
              </div>

              {/* Dark Bottom Card */}
              <div className="bg-gradient-to-r from-[#1E1B4B] via-slate-900 to-[#1E1B4B] rounded-3xl p-5 text-white shadow-xl space-y-3">
                <div className="flex items-center gap-3">
                  <div className="text-4xl">🙋‍♂️</div>
                  <div>
                    <h3 className="text-sm font-black tracking-tight leading-snug">
                      Fiinway is with you for every need, everyday!
                    </h3>
                  </div>
                </div>

                <button
                  onClick={() => finishWelcome("finishWelcome")}
                  className="w-full bg-emerald-500 hover:bg-emerald-600 text-white font-bold text-base py-3.5 rounded-2xl shadow-lg flex items-center justify-center gap-2 transition-all active:scale-[0.99]"
                >
                  Let's Explore <ArrowRight className="w-5 h-5" />
                </button>
              </div>
            </div>
          )}

          {/* USER FOOTER NAVIGATION (Slides 2, 3, 4, 5) */}
          {currentSlide > 1 && (
            <div className="max-w-md mx-auto w-full flex items-center justify-between pt-4 border-t border-slate-100 z-20">
              {currentSlide < 5 ? (
                <button
                  onClick={() => finishWelcome("finishWelcome")}
                  className="text-xs font-bold text-slate-400 hover:text-slate-600 px-3 py-2 transition-colors"
                >
                  Skip
                </button>
              ) : (
                <div className="w-12"></div>
              )}

              <div className="flex items-center gap-1.5">
                {[1, 2, 3, 4, 5].map((idx) => (
                  <span
                    key={idx}
                    onClick={() => setCurrentSlide(idx)}
                    className={`h-2 rounded-full transition-all cursor-pointer ${
                      currentSlide === idx ? "w-6 bg-emerald-600" : "w-2 bg-slate-200 hover:bg-slate-300"
                    }`}
                  ></span>
                ))}
              </div>

              {currentSlide < 5 ? (
                <button
                  onClick={handleNext}
                  className="bg-emerald-600 hover:bg-emerald-700 text-white text-xs font-bold px-4 py-2 rounded-full shadow-xs flex items-center gap-1 transition-all active:scale-[0.98]"
                >
                  Next <ChevronRight className="w-4 h-4" />
                </button>
              ) : (
                <div className="w-12"></div>
              )}
            </div>
          )}
        </div>
      )}
    </div>
  );
}

export default function WelcomePage() {
  return (
    <Suspense
      fallback={
        <div className="min-h-screen bg-[#F8FAFC] flex items-center justify-center">
          <div className="w-8 h-8 border-[3px] border-emerald-100 border-t-emerald-600 rounded-full animate-spin"></div>
        </div>
      }
    >
      <WelcomeContent />
    </Suspense>
  );
}
