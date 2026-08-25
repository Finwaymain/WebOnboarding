"use client";

import { useSearchParams } from "next/navigation";
import { Suspense, useEffect, useState, useCallback } from "react";
import {
  ChevronLeft,
  Users,
  Download,
  CheckCircle2,
  ShieldCheck,
  User,
  Briefcase,
  Wallet,
  TrendingUp,
  Share2,
  Copy,
  Check,
  Clock,
  X,
  MessageCircle,
  Send,
  MessageSquare,
  ExternalLink
} from "lucide-react";
import AadhaarRegistrationModal from "../../components/AadhaarRegistrationModal";

const API_KEY = "base64:nTfofcBByTDenJQYlsRbH0JjeVFW5lWsIIyXtq8/9sU=";
const getApiBase = () => (typeof window !== "undefined" ? `${window.location.origin}/api/v1` : "https://api.fiinway.com/api/v1");

function readUrlParams() {
  if (typeof window === "undefined") {
    return {
      token: null,
      userId: null,
      driverId: null,
      userCat: null,
      phone: null,
      view: "home" as "home" | "dashboard",
    };
  }
  const params = new URLSearchParams(window.location.search);
  const rawDriverId = params.get("driver_id") || params.get("id_driver") || params.get("id_conducteur");
  const rawUserId = params.get("user_id") || params.get("id_user") || params.get("userId") || params.get("id");
  const explicitCat = params.get("user_cat") || params.get("user_type");
  
  const token = params.get("accesstoken") || params.get("token") || params.get("access_token");
  const phone = params.get("phone") || params.get("mobile");
  const viewParam = params.get("view");
  const view = (viewParam === "dashboard") ? "dashboard" : "home";

  let driverId: string | null = null;
  let userId: string | null = null;
  let userCat: string | null = null;

  if (explicitCat === "driver" || explicitCat === "conducteur" || explicitCat === "business" || explicitCat === "provider" || (rawDriverId && !rawUserId)) {
    driverId = rawDriverId || rawUserId;
    userCat = "driver";
  } else if (rawUserId || explicitCat === "customer" || explicitCat === "user" || explicitCat === "consumer") {
    userId = rawUserId || rawDriverId;
    userCat = "customer";
  } else if (rawDriverId) {
    driverId = rawDriverId;
    userCat = "driver";
  }

  return { token, userId, driverId, userCat, phone, view };
}

function ReferralDashboardContent() {
  const searchParams = useSearchParams();
  const [token, setToken] = useState<string | null>(null);
  const [userId, setUserId] = useState<string | null>(null);
  const [driverId, setDriverId] = useState<string | null>(null);
  const [userCat, setUserCat] = useState<string | null>(null);
  const [phone, setPhone] = useState<string | null>(null);

  // Navigation mode: "home" (Main Partner & Earn Screen) or "dashboard" (2-tab Partner Dashboard)
  const [viewMode, setViewMode] = useState<"home" | "dashboard">("home");
  const [activeTab, setActiveTab] = useState<"consumer" | "business">("consumer");
  const [loading, setLoading] = useState<boolean>(true);
  const [stats, setStats] = useState<any>(null);
  const [toast, setToast] = useState<string>("");
  const [copied, setCopied] = useState<boolean>(false);
  const [showAadhaarModal, setShowAadhaarModal] = useState<boolean>(false);
  const [showShareModal, setShowShareModal] = useState<boolean>(false);

  useEffect(() => {
    const parsed = readUrlParams();
    setToken(parsed.token);
    setUserId(parsed.userId);
    setDriverId(parsed.driverId);
    setUserCat(parsed.userCat);
    setPhone(parsed.phone);
    if (parsed.view === "dashboard") {
      setViewMode("dashboard");
    }
  }, [searchParams]);

  const fetchReferralStats = useCallback(async () => {
    try {
      setLoading(true);
      const apiBase = getApiBase();
      const parsed = readUrlParams();
      const uId = userId || parsed.userId || "";
      const dId = driverId || parsed.driverId || "";
      const uCat = userCat || parsed.userCat || (dId ? "driver" : "customer");
      const tok = token || parsed.token || "";
      const ph = phone || parsed.phone || "";

      const headers: Record<string, string> = {
        "Content-Type": "application/json",
        "apikey": API_KEY,
        "accesstoken": tok,
        "user_id": uId || dId,
        "driver_id": dId || uId,
        "user_type": uCat,
      };

      const queryStr = `user_id=${encodeURIComponent(uId)}&driver_id=${encodeURIComponent(dId)}&id_user=${encodeURIComponent(uId)}&id_driver=${encodeURIComponent(dId)}&user_cat=${encodeURIComponent(uCat)}&user_type=${encodeURIComponent(uCat)}&phone=${encodeURIComponent(ph)}&accesstoken=${encodeURIComponent(tok)}&apikey=${encodeURIComponent(API_KEY)}`;

      const payload = {
        user_id: uId,
        id_user: uId,
        driver_id: dId,
        id_driver: dId,
        user_cat: uCat,
        user_type: uCat,
        phone: ph,
        accesstoken: tok,
      };

      let res = await fetch(`${apiBase}/referral-dashboard-stats?${queryStr}`, {
        method: "POST",
        headers,
        body: JSON.stringify(payload),
      });

      if (!res.ok) {
        res = await fetch(`${apiBase}/referral-dashboard-stats?${queryStr}`, {
          method: "GET",
          headers,
        });
      }

      const json = await res.json();
      if (json.success === "success" && json.data) {
        setStats(json.data);
        try {
          localStorage.setItem("fiinway_partner_stats", JSON.stringify(json.data));
        } catch (_) {}

        const isVerified = json.data.aadhar_submitted === true || 
          (json.data.aadhar_number && json.data.aadhar_number.toString().trim().length === 12);

        if (!isVerified) {
          setShowAadhaarModal(true);
        } else {
          setShowAadhaarModal(false);
        }
      }
    } catch (e) {
      console.error("Error fetching partner stats:", e);
    } finally {
      setLoading(false);
    }
  }, [userId, driverId, userCat, token, phone]);

  useEffect(() => {
    fetchReferralStats();
  }, [fetchReferralStats]);

  const handleOpenDashboard = () => {
    const isVerified = stats?.aadhar_submitted === true || 
      (stats?.aadhar_number && stats.aadhar_number.toString().trim().length === 12);

    if (!isVerified) {
      showToast("Aadhaar verification is compulsory to access Partner Dashboard!");
      setShowAadhaarModal(true);
      return;
    }
    setViewMode("dashboard");
  };

  const handleAadhaarSuccess = (newAadhaar: string) => {
    setShowAadhaarModal(false);
    setStats((prev: any) => ({
      ...prev,
      aadhar_number: newAadhaar,
      aadhar_submitted: true,
    }));
    showToast("Aadhaar verified and linked successfully!");
    fetchReferralStats();
  };

  const showToast = (msg: string) => {
    setToast(msg);
    setTimeout(() => setToast(""), 2200);
  };

  const isDriver = (userCat === "driver" || userCat === "conducteur" || Boolean(driverId));
  const referralCode = (stats?.referral_code && stats.referral_code !== "Loading..." && stats.referral_code !== "---") 
    ? stats.referral_code 
    : (loading ? "Loading..." : (stats?.referral_code || ""));

  const walletBalance = stats?.wallet_balance ?? 0;

  const [copiedLink, setCopiedLink] = useState<boolean>(false);

  const handleCopyCode = () => {
    if (!referralCode || referralCode === "---") return;
    if (typeof navigator !== "undefined" && navigator.clipboard) {
      navigator.clipboard.writeText(referralCode);
    } else if (typeof document !== "undefined") {
      const el = document.createElement("textarea");
      el.value = referralCode;
      document.body.appendChild(el);
      el.select();
      document.execCommand("copy");
      document.body.removeChild(el);
    }
    setCopied(true);
    showToast("Partner code copied to clipboard!");
    setTimeout(() => setCopied(false), 2000);
  };

  const shareUrl = stats?.share_url || `https://api.fiinway.com/ref/${referralCode}`;

  const handleCopyShareLink = () => {
    if (!shareUrl) return;
    if (typeof navigator !== "undefined" && navigator.clipboard) {
      navigator.clipboard.writeText(shareUrl);
    } else if (typeof document !== "undefined") {
      const el = document.createElement("textarea");
      el.value = shareUrl;
      document.body.appendChild(el);
      el.select();
      document.execCommand("copy");
      document.body.removeChild(el);
    }
    setCopiedLink(true);
    showToast("Referral link copied to clipboard!");
    setTimeout(() => setCopiedLink(false), 2000);
  };

  const handleCopyShareMessage = () => {
    navigator.clipboard.writeText(shareText);
    showToast("Invite message copied to clipboard!");
  };

  const handleBack = () => {
    if (viewMode === "dashboard") {
      setViewMode("home");
    } else {
      if (typeof window !== "undefined" && (window as any).AppBridge) {
        (window as any).AppBridge.postMessage("goBack");
      } else if (typeof window !== "undefined") {
        window.history.back();
      }
    }
  };

  if (loading && !stats) {
    return (
      <div className="min-h-screen bg-[#F8FAFC] flex flex-col items-center justify-center p-6 text-center">
        <div className="w-14 h-14 rounded-2xl bg-emerald-100 text-emerald-600 flex items-center justify-center mb-4 animate-bounce">
          <ShieldCheck className="w-8 h-8" />
        </div>
        <h3 className="text-base font-bold text-slate-800">Loading Partner Dashboard...</h3>
        <p className="text-xs text-slate-500 mt-1">Please wait while we verify and load your partner profile.</p>
        <div className="mt-6 flex items-center gap-2 text-emerald-600 font-semibold text-xs">
          <div className="w-2 h-2 rounded-full bg-emerald-600 animate-ping" />
          Securing connection
        </div>
      </div>
    );
  }

  const consumer = stats?.consumer || {
    total_referrals: 0,
    installed: 0,
    registered: 0,
    verified: 0,
    consumer_users: 0,
    business_users: 0,
    active_users: 0,
    total_transactions: 0,
    total_referral_income: 0,
    avg_monthly_income: 0,
    recent_earnings: [],
    history: [],
  };

  const business = stats?.business || {
    business_referrals: 0,
    total_earnings: 0,
    summary: {
      app_installed: 0,
      registered: 0,
      verified: 0,
      active_business: 0,
      active_services: 0,
      total_transactions: 0,
    },
    recent_business_users: [],
  };

  return (
    <div className="min-h-screen bg-[#F8FAFC] text-slate-900 font-sans pb-10">
      {/* ──────────────────────────────────────────────────────────────────────────
          SCREEN 1: MAIN PARTNER & EARN SCREEN (Clean Executive Style, No Header)
         ────────────────────────────────────────────────────────────────────────── */}
      {viewMode === "home" && (
        <div className="max-w-md mx-auto space-y-4 p-4 pt-4">

          {/* Executive Top Banner Card */}
          <div className="bg-[#047857] rounded-2xl p-5 text-white shadow-sm relative overflow-hidden flex items-center justify-between">
            <div className="space-y-1">
              <span className="text-[10px] font-bold uppercase tracking-wider text-emerald-200 bg-emerald-800/60 px-2.5 py-0.5 rounded-full inline-block">
                FIINWAY PARTNER PROGRAM
              </span>
              <h2 className="text-xl font-bold tracking-tight text-white">Partner & Earn</h2>
              <p className="text-xs font-medium text-emerald-100">
                Share your unique code to build your network & earn.
              </p>
            </div>
            <div className="w-12 h-12 rounded-xl bg-emerald-800/40 border border-emerald-600/50 flex items-center justify-center text-2xl shrink-0">
              🤝
            </div>
          </div>

          {/* Partner Code & Copy Link Box */}
          <div className="bg-white rounded-2xl p-5 border border-slate-200 shadow-2xs space-y-4">
            <div className="text-center space-y-1">
              <p className="text-xs font-semibold text-slate-500 uppercase tracking-wide">Your Unique Partner Code</p>
              <div className="flex items-center justify-center gap-2.5 pt-1">
                <span className="text-2xl font-bold text-slate-900 tracking-widest font-mono bg-slate-100 border border-slate-200 px-4 py-2 rounded-xl">
                  {referralCode}
                </span>
                <button
                  onClick={handleCopyCode}
                  className="px-3.5 py-2.5 rounded-xl bg-slate-100 border border-slate-200 text-slate-800 hover:bg-slate-200 transition-colors flex items-center gap-1.5 text-xs font-extrabold shadow-2xs active:scale-95"
                  title="Copy Code"
                >
                  {copied ? <Check className="w-4 h-4 text-emerald-600" /> : <Copy className="w-4 h-4" />}
                  <span>{copied ? "Copied" : "Copy Code"}</span>
                </button>
              </div>
            </div>

            {/* Referral Link Box */}
            <div className="bg-slate-50 border border-slate-200 rounded-xl p-3 space-y-1.5">
              <span className="text-[10px] font-bold text-slate-500 uppercase tracking-wide block">Your Referral Link</span>
              <div className="flex items-center justify-between gap-2 bg-white border border-slate-200 rounded-lg px-3 py-2">
                <span className="text-xs font-mono font-semibold text-slate-700 truncate select-all">
                  {shareUrl}
                </span>
              </div>
            </div>

            <button
              onClick={handleCopyShareLink}
              className="w-full bg-[#047857] hover:bg-[#065f46] text-white font-bold text-sm py-3.5 rounded-xl shadow-sm flex items-center justify-center gap-2 transition-all active:scale-[0.99]"
            >
              {copiedLink ? <Check className="w-4 h-4" /> : <Copy className="w-4 h-4" />}
              <span>{copiedLink ? "Link Copied to Clipboard!" : "Copy Referral Link"}</span>
            </button>
          </div>

          {/* Your Partner Stats */}
          <div className="space-y-2.5">
            <h3 className="text-xs font-bold text-slate-700 uppercase tracking-wider">Your Network Summary</h3>
            <div className="grid grid-cols-4 gap-2">
              {/* Stat 1: Total Partners */}
              <div className="bg-white rounded-xl p-3 border border-slate-200 shadow-2xs text-center space-y-1">
                <div className="w-7 h-7 rounded-lg bg-slate-100 text-slate-700 mx-auto flex items-center justify-center">
                  <Users className="w-3.5 h-3.5" />
                </div>
                <h4 className="text-base font-bold text-slate-900 leading-none">{consumer.total_referrals}</h4>
                <p className="text-[10px] font-medium text-slate-500 leading-tight">Partners</p>
              </div>

              {/* Stat 2: App Installed */}
              <div className="bg-white rounded-xl p-3 border border-slate-200 shadow-2xs text-center space-y-1">
                <div className="w-7 h-7 rounded-lg bg-slate-100 text-slate-700 mx-auto flex items-center justify-center">
                  <Download className="w-3.5 h-3.5" />
                </div>
                <h4 className="text-base font-bold text-slate-900 leading-none">{consumer.installed}</h4>
                <p className="text-[10px] font-medium text-slate-500 leading-tight">Installed</p>
              </div>

              {/* Stat 3: Registered */}
              <div className="bg-white rounded-xl p-3 border border-slate-200 shadow-2xs text-center space-y-1">
                <div className="w-7 h-7 rounded-lg bg-slate-100 text-slate-700 mx-auto flex items-center justify-center">
                  <CheckCircle2 className="w-3.5 h-3.5" />
                </div>
                <h4 className="text-base font-bold text-slate-900 leading-none">{consumer.registered}</h4>
                <p className="text-[10px] font-medium text-slate-500 leading-tight">Registered</p>
              </div>

              {/* Stat 4: Active Users */}
              <div className="bg-white rounded-xl p-3 border border-slate-200 shadow-2xs text-center space-y-1">
                <div className="w-7 h-7 rounded-lg bg-slate-100 text-slate-700 mx-auto flex items-center justify-center">
                  <ShieldCheck className="w-3.5 h-3.5" />
                </div>
                <h4 className="text-base font-bold text-slate-900 leading-none">{consumer.active_users}</h4>
                <p className="text-[10px] font-medium text-slate-500 leading-tight">Active</p>
              </div>
            </div>
          </div>

          {/* Your Earnings */}
          <div className="space-y-2.5">
            <h3 className="text-xs font-bold text-slate-700 uppercase tracking-wider">Your Earnings Balance</h3>
            <div className="bg-white rounded-2xl p-4 border border-slate-200 shadow-2xs flex items-center justify-between">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-xl bg-slate-100 border border-slate-200 text-slate-800 flex items-center justify-center text-xl shrink-0">
                  👛
                </div>
                <div>
                  <p className="text-[11px] font-semibold text-slate-500">Partner Wallet Balance</p>
                  <p className="text-xl font-bold text-slate-900">₹{walletBalance.toLocaleString()}</p>
                </div>
              </div>

              <button
                onClick={handleOpenDashboard}
                className="bg-slate-900 hover:bg-slate-800 text-white text-xs font-semibold px-4 py-2 rounded-xl shadow-xs transition-all active:scale-[0.98]"
              >
                View History
              </button>
            </div>
          </div>
        </div>
      )}

      {/* ──────────────────────────────────────────────────────────────────────────
          SCREEN 2: PARTNER DASHBOARD (Clean Professional View)
         ────────────────────────────────────────────────────────────────────────── */}
      {viewMode === "dashboard" && (
        <div>
          {/* Segmented Pill Tabs with Back Button on Left */}
          <div className="bg-slate-100 p-2 border-b border-slate-200 sticky top-0 z-30 shadow-2xs">
            <div className="max-w-md mx-auto flex items-center gap-2">
              <button
                onClick={handleBack}
                className="p-2 rounded-xl bg-white border border-slate-200 text-slate-700 hover:bg-slate-50 transition-colors shrink-0 shadow-2xs"
                title="Back"
              >
                <ChevronLeft className="w-4 h-4 stroke-[2.5]" />
              </button>

              <div className="flex-1 grid grid-cols-2 text-center text-xs font-semibold bg-slate-200/70 p-1 rounded-xl">
                <button
                  onClick={() => setActiveTab("consumer")}
                  className={`py-2 rounded-lg transition-all ${
                    activeTab === "consumer"
                      ? "bg-white text-slate-900 font-bold shadow-xs border border-slate-200"
                      : "text-slate-600 hover:text-slate-900"
                  }`}
                >
                  Consumer Network
                </button>

                <button
                  onClick={() => setActiveTab("business")}
                  className={`py-2 rounded-lg transition-all ${
                    activeTab === "business"
                      ? "bg-white text-slate-900 font-bold shadow-xs border border-slate-200"
                      : "text-slate-600 hover:text-slate-900"
                  }`}
                >
                  Business Partners
                </button>
              </div>
            </div>
          </div>

          {/* Body Content */}
          <div className="max-w-md mx-auto p-4 space-y-4">
            {/* CONSUMER TAB VIEW */}
            {activeTab === "consumer" && (
              <div className="space-y-4">
                {/* Top 4 Stat Grid */}
                <div className="grid grid-cols-4 gap-2">
                  <div className="col-span-1 bg-white rounded-xl p-2.5 border border-slate-200 shadow-2xs flex flex-col justify-between">
                    <div className="w-7 h-7 rounded-lg bg-slate-100 text-slate-700 flex items-center justify-center">
                      <Users className="w-3.5 h-3.5" />
                    </div>
                    <div className="mt-2">
                      <p className="text-[9px] font-semibold text-slate-500 uppercase tracking-tight leading-tight">Total</p>
                      <p className="text-base font-bold text-slate-900 leading-tight mt-0.5">{consumer.total_referrals}</p>
                    </div>
                  </div>

                  <div className="col-span-1 bg-white rounded-xl p-2.5 border border-slate-200 shadow-2xs flex flex-col justify-between">
                    <div className="w-7 h-7 rounded-lg bg-slate-100 text-slate-700 flex items-center justify-center">
                      <Download className="w-3.5 h-3.5" />
                    </div>
                    <div className="mt-2">
                      <p className="text-[9px] font-semibold text-slate-500 uppercase tracking-tight leading-tight">Installed</p>
                      <p className="text-sm font-bold text-slate-900 leading-tight mt-0.5">{consumer.installed}</p>
                    </div>
                  </div>

                  <div className="col-span-1 bg-white rounded-xl p-2.5 border border-slate-200 shadow-2xs flex flex-col justify-between">
                    <div className="w-7 h-7 rounded-lg bg-slate-100 text-slate-700 flex items-center justify-center">
                      <CheckCircle2 className="w-3.5 h-3.5" />
                    </div>
                    <div className="mt-2">
                      <p className="text-[9px] font-semibold text-slate-500 uppercase tracking-tight leading-tight">Registered</p>
                      <p className="text-sm font-bold text-slate-900 leading-tight mt-0.5">{consumer.registered}</p>
                    </div>
                  </div>

                  <div className="col-span-1 bg-white rounded-xl p-2.5 border border-slate-200 shadow-2xs flex flex-col justify-between">
                    <div className="w-7 h-7 rounded-lg bg-slate-100 text-slate-700 flex items-center justify-center">
                      <ShieldCheck className="w-3.5 h-3.5" />
                    </div>
                    <div className="mt-2">
                      <p className="text-[9px] font-semibold text-slate-500 uppercase tracking-tight leading-tight">Verified</p>
                      <p className="text-sm font-bold text-slate-900 leading-tight mt-0.5">{consumer.verified}</p>
                    </div>
                  </div>
                </div>

                {/* Middle Row 3 Stat Cards */}
                <div className="grid grid-cols-3 gap-2.5">
                  <div className="bg-white rounded-xl p-3 border border-slate-200 shadow-2xs flex items-center gap-2">
                    <div className="w-7 h-7 rounded-lg bg-slate-100 text-slate-700 flex items-center justify-center shrink-0">
                      <User className="w-3.5 h-3.5" />
                    </div>
                    <div>
                      <p className="text-[9px] font-semibold text-slate-500 uppercase tracking-tight leading-none">Consumers</p>
                      <p className="text-sm font-bold text-slate-900 leading-tight mt-1">{consumer.total_referrals}</p>
                    </div>
                  </div>

                  <div className="bg-white rounded-xl p-3 border border-slate-200 shadow-2xs flex items-center gap-2">
                    <div className="w-7 h-7 rounded-lg bg-slate-100 text-slate-700 flex items-center justify-center shrink-0">
                      <CheckCircle2 className="w-3.5 h-3.5" />
                    </div>
                    <div>
                      <p className="text-[9px] font-semibold text-slate-500 uppercase tracking-tight leading-none">Active</p>
                      <p className="text-sm font-bold text-slate-900 leading-tight mt-1">{consumer.active_users}</p>
                    </div>
                  </div>

                  <div className="bg-white rounded-xl p-3 border border-slate-200 shadow-2xs flex items-center gap-2">
                    <div className="w-7 h-7 rounded-lg bg-slate-100 text-slate-700 flex items-center justify-center shrink-0">
                      <Clock className="w-3.5 h-3.5" />
                    </div>
                    <div>
                      <p className="text-[9px] font-semibold text-slate-500 uppercase tracking-tight leading-none">Inactive</p>
                      <p className="text-sm font-bold text-slate-900 leading-tight mt-1">{consumer.inactive_users ?? Math.max(0, consumer.total_referrals - consumer.active_users)}</p>
                    </div>
                  </div>
                </div>

                {/* Bottom Row 3 Financial Cards */}
                <div className="grid grid-cols-3 gap-2.5">
                  <div className="bg-white rounded-xl p-3 border border-slate-200 shadow-2xs space-y-1.5">
                    <div className="w-7 h-7 rounded-lg bg-slate-100 text-slate-700 flex items-center justify-center">
                      <Wallet className="w-3.5 h-3.5" />
                    </div>
                    <div>
                      <p className="text-[9px] font-semibold text-slate-500 uppercase tracking-tight leading-none">Transactions</p>
                      <p className="text-sm font-bold text-slate-900 leading-tight mt-1">{(consumer.total_transactions || 0).toLocaleString()}</p>
                    </div>
                  </div>

                  <div className="bg-white rounded-xl p-3 border border-slate-200 shadow-2xs space-y-1.5">
                    <div className="w-7 h-7 rounded-lg bg-slate-100 text-slate-700 flex items-center justify-center text-sm">
                      🪙
                    </div>
                    <div>
                      <p className="text-[9px] font-semibold text-slate-500 uppercase tracking-tight leading-none">Total Income</p>
                      <p className="text-sm font-bold text-slate-900 leading-tight mt-1">₹{(consumer.total_referral_income || 0).toLocaleString()}</p>
                    </div>
                  </div>

                  <div className="bg-white rounded-xl p-3 border border-slate-200 shadow-2xs space-y-1.5">
                    <div className="w-7 h-7 rounded-lg bg-slate-100 text-slate-700 flex items-center justify-center">
                      <TrendingUp className="w-3.5 h-3.5" />
                    </div>
                    <div>
                      <p className="text-[9px] font-semibold text-slate-500 uppercase tracking-tight leading-none">Avg. Monthly</p>
                      <p className="text-sm font-bold text-slate-900 leading-tight mt-1">₹{(consumer.avg_monthly_income || 0).toLocaleString()}</p>
                    </div>
                  </div>
                </div>

                {/* Recent Consumer Earnings Section */}
                <div className="bg-white rounded-2xl p-4 border border-slate-200 shadow-2xs space-y-3">
                  <h3 className="text-xs font-bold text-slate-700 uppercase tracking-wider">
                    Recent Consumer Earnings
                  </h3>

                  {consumer.recent_earnings && consumer.recent_earnings.length > 0 ? (
                    <div className="divide-y divide-slate-100">
                      {consumer.recent_earnings.map((item: any, idx: number) => (
                        <div key={idx} className="py-2.5 flex items-center justify-between first:pt-0 last:pb-0">
                          <div className="flex items-center gap-3">
                            <div className="w-8 h-8 rounded-lg bg-slate-100 flex items-center justify-center text-sm">
                              {item.icon || "👤"}
                            </div>
                            <div>
                              <p className="text-xs font-semibold text-slate-800">
                                {item.category} – <span className="font-bold text-slate-900">{item.user_name}</span>
                              </p>
                              <p className="text-[10px] text-slate-500 mt-0.5">{item.date}</p>
                            </div>
                          </div>
                          <span className="text-xs font-bold text-[#047857]">
                            +₹{item.amount}
                          </span>
                        </div>
                      ))}
                    </div>
                  ) : (
                    <div className="text-center py-6 border border-dashed border-slate-200 rounded-xl space-y-1">
                      <Clock className="w-6 h-6 text-slate-300 mx-auto" />
                      <p className="text-xs font-semibold text-slate-600">No consumer earnings history yet</p>
                      <p className="text-[10px] text-slate-500">Share your partner code with consumers to earn bonuses!</p>
                    </div>
                  )}
                </div>

                {/* Referred Consumers Network History Section */}
                <div className="bg-white rounded-2xl p-4 border border-slate-200 shadow-2xs space-y-3">
                  <div className="flex items-center justify-between">
                    <h3 className="text-xs font-bold text-slate-700 uppercase tracking-wider">
                      Referred Consumers ({consumer.history ? consumer.history.length : 0})
                    </h3>
                  </div>

                  {consumer.history && consumer.history.length > 0 ? (
                    <div className="space-y-2">
                      {consumer.history.map((user: any, idx: number) => (
                        <div key={idx} className="bg-slate-50 rounded-xl p-3 border border-slate-200/70 flex items-center justify-between">
                          <div className="flex items-center gap-3">
                            <div className="w-8 h-8 rounded-lg bg-slate-200 text-slate-700 flex items-center justify-center text-sm font-semibold">
                              👤
                            </div>
                            <div>
                              <h4 className="text-xs font-bold text-slate-900">{user.name}</h4>
                              <p className="text-[10px] text-slate-500 font-medium">Consumer • Joined {user.date}</p>
                            </div>
                          </div>

                          <div className="text-right space-y-0.5">
                            <span className={`inline-block px-2 py-0.5 rounded text-[9px] font-semibold ${user.verified ? 'bg-emerald-100 text-emerald-800' : 'bg-slate-200 text-slate-700'}`}>
                              {user.status}
                            </span>
                            <p className="text-[10px] font-bold text-[#047857]">
                              +₹{user.referral_earned} earned
                            </p>
                          </div>
                        </div>
                      ))}
                    </div>
                  ) : (
                    <div className="text-center py-6 border border-dashed border-slate-200 rounded-xl space-y-1">
                      <Users className="w-6 h-6 text-slate-300 mx-auto" />
                      <p className="text-xs font-semibold text-slate-600">No referred consumers yet</p>
                      <p className="text-[10px] text-slate-500">Share your partner code to start building your consumer network!</p>
                    </div>
                  )}
                </div>
              </div>
            )}

            {/* BUSINESS TAB VIEW (Exact same UI as Consumer Network) */}
            {activeTab === "business" && (
              <div className="space-y-4">
                {/* Top 4 Stat Grid */}
                <div className="grid grid-cols-4 gap-2">
                  <div className="col-span-1 bg-white rounded-xl p-2.5 border border-slate-200 shadow-2xs flex flex-col justify-between">
                    <div className="w-7 h-7 rounded-lg bg-slate-100 text-slate-700 flex items-center justify-center">
                      <Briefcase className="w-3.5 h-3.5" />
                    </div>
                    <div className="mt-2">
                      <p className="text-[9px] font-semibold text-slate-500 uppercase tracking-tight leading-tight">Total</p>
                      <p className="text-base font-bold text-slate-900 leading-tight mt-0.5">{business.total_referrals}</p>
                    </div>
                  </div>

                  <div className="col-span-1 bg-white rounded-xl p-2.5 border border-slate-200 shadow-2xs flex flex-col justify-between">
                    <div className="w-7 h-7 rounded-lg bg-slate-100 text-slate-700 flex items-center justify-center">
                      <Download className="w-3.5 h-3.5" />
                    </div>
                    <div className="mt-2">
                      <p className="text-[9px] font-semibold text-slate-500 uppercase tracking-tight leading-tight">Installed</p>
                      <p className="text-sm font-bold text-slate-900 leading-tight mt-0.5">{business.installed}</p>
                    </div>
                  </div>

                  <div className="col-span-1 bg-white rounded-xl p-2.5 border border-slate-200 shadow-2xs flex flex-col justify-between">
                    <div className="w-7 h-7 rounded-lg bg-slate-100 text-slate-700 flex items-center justify-center">
                      <CheckCircle2 className="w-3.5 h-3.5" />
                    </div>
                    <div className="mt-2">
                      <p className="text-[9px] font-semibold text-slate-500 uppercase tracking-tight leading-tight">Registered</p>
                      <p className="text-sm font-bold text-slate-900 leading-tight mt-0.5">{business.registered}</p>
                    </div>
                  </div>

                  <div className="col-span-1 bg-white rounded-xl p-2.5 border border-slate-200 shadow-2xs flex flex-col justify-between">
                    <div className="w-7 h-7 rounded-lg bg-slate-100 text-slate-700 flex items-center justify-center">
                      <ShieldCheck className="w-3.5 h-3.5" />
                    </div>
                    <div className="mt-2">
                      <p className="text-[9px] font-semibold text-slate-500 uppercase tracking-tight leading-tight">Verified</p>
                      <p className="text-sm font-bold text-slate-900 leading-tight mt-0.5">{business.verified}</p>
                    </div>
                  </div>
                </div>

                {/* Middle Row 3 Stat Cards */}
                <div className="grid grid-cols-3 gap-2.5">
                  <div className="bg-white rounded-xl p-3 border border-slate-200 shadow-2xs flex items-center gap-2">
                    <div className="w-7 h-7 rounded-lg bg-slate-100 text-slate-700 flex items-center justify-center shrink-0">
                      <Briefcase className="w-3.5 h-3.5" />
                    </div>
                    <div>
                      <p className="text-[9px] font-semibold text-slate-500 uppercase tracking-tight leading-none">Partners</p>
                      <p className="text-sm font-bold text-slate-900 leading-tight mt-1">{business.total_referrals}</p>
                    </div>
                  </div>

                  <div className="bg-white rounded-xl p-3 border border-slate-200 shadow-2xs flex items-center gap-2">
                    <div className="w-7 h-7 rounded-lg bg-slate-100 text-slate-700 flex items-center justify-center shrink-0">
                      <CheckCircle2 className="w-3.5 h-3.5" />
                    </div>
                    <div>
                      <p className="text-[9px] font-semibold text-slate-500 uppercase tracking-tight leading-none">Active</p>
                      <p className="text-sm font-bold text-slate-900 leading-tight mt-1">{business.active_users}</p>
                    </div>
                  </div>

                  <div className="bg-white rounded-xl p-3 border border-slate-200 shadow-2xs flex items-center gap-2">
                    <div className="w-7 h-7 rounded-lg bg-slate-100 text-slate-700 flex items-center justify-center shrink-0">
                      <Clock className="w-3.5 h-3.5" />
                    </div>
                    <div>
                      <p className="text-[9px] font-semibold text-slate-500 uppercase tracking-tight leading-none">Inactive</p>
                      <p className="text-sm font-bold text-slate-900 leading-tight mt-1">{business.inactive_users ?? Math.max(0, business.total_referrals - business.active_users)}</p>
                    </div>
                  </div>
                </div>

                {/* Bottom Row 3 Financial Cards */}
                <div className="grid grid-cols-3 gap-2.5">
                  <div className="bg-white rounded-xl p-3 border border-slate-200 shadow-2xs space-y-1.5">
                    <div className="w-7 h-7 rounded-lg bg-slate-100 text-slate-700 flex items-center justify-center">
                      <Wallet className="w-3.5 h-3.5" />
                    </div>
                    <div>
                      <p className="text-[9px] font-semibold text-slate-500 uppercase tracking-tight leading-none">Transactions</p>
                      <p className="text-sm font-bold text-slate-900 leading-tight mt-1">{(business.total_transactions || 0).toLocaleString()}</p>
                    </div>
                  </div>

                  <div className="bg-white rounded-xl p-3 border border-slate-200 shadow-2xs space-y-1.5">
                    <div className="w-7 h-7 rounded-lg bg-slate-100 text-slate-700 flex items-center justify-center text-sm">
                      🪙
                    </div>
                    <div>
                      <p className="text-[9px] font-semibold text-slate-500 uppercase tracking-tight leading-none">Total Income</p>
                      <p className="text-sm font-bold text-slate-900 leading-tight mt-1">₹{(business.total_referral_income || 0).toLocaleString()}</p>
                    </div>
                  </div>

                  <div className="bg-white rounded-xl p-3 border border-slate-200 shadow-2xs space-y-1.5">
                    <div className="w-7 h-7 rounded-lg bg-slate-100 text-slate-700 flex items-center justify-center">
                      <TrendingUp className="w-3.5 h-3.5" />
                    </div>
                    <div>
                      <p className="text-[9px] font-semibold text-slate-500 uppercase tracking-tight leading-none">Avg. Monthly</p>
                      <p className="text-sm font-bold text-slate-900 leading-tight mt-1">₹{(business.avg_monthly_income || 0).toLocaleString()}</p>
                    </div>
                  </div>
                </div>

                {/* Recent Business Earnings Section */}
                <div className="bg-white rounded-2xl p-4 border border-slate-200 shadow-2xs space-y-3">
                  <h3 className="text-xs font-bold text-slate-700 uppercase tracking-wider">
                    Recent Business Partner Earnings
                  </h3>

                  {business.recent_earnings && business.recent_earnings.length > 0 ? (
                    <div className="divide-y divide-slate-100">
                      {business.recent_earnings.map((item: any, idx: number) => (
                        <div key={idx} className="py-2.5 flex items-center justify-between first:pt-0 last:pb-0">
                          <div className="flex items-center gap-3">
                            <div className="w-8 h-8 rounded-lg bg-slate-100 flex items-center justify-center text-sm">
                              {item.icon || "🚕"}
                            </div>
                            <div>
                              <p className="text-xs font-semibold text-slate-800">
                                {item.category} – <span className="font-bold text-slate-900">{item.user_name}</span>
                              </p>
                              <p className="text-[10px] text-slate-500 mt-0.5">{item.date}</p>
                            </div>
                          </div>
                          <span className="text-xs font-bold text-[#047857]">
                            +₹{item.amount}
                          </span>
                        </div>
                      ))}
                    </div>
                  ) : (
                    <div className="text-center py-6 border border-dashed border-slate-200 rounded-xl space-y-1">
                      <Clock className="w-6 h-6 text-slate-300 mx-auto" />
                      <p className="text-xs font-semibold text-slate-600">No business partner earnings history yet</p>
                      <p className="text-[10px] text-slate-500">Share your partner code with drivers & service partners to earn bonuses!</p>
                    </div>
                  )}
                </div>

                {/* Referred Business Partners Network History Section */}
                <div className="bg-white rounded-2xl p-4 border border-slate-200 shadow-2xs space-y-3">
                  <div className="flex items-center justify-between">
                    <h3 className="text-xs font-bold text-slate-700 uppercase tracking-wider">
                      Referred Business Partners ({business.history ? business.history.length : 0})
                    </h3>
                  </div>

                  {business.history && business.history.length > 0 ? (
                    <div className="space-y-2">
                      {business.history.map((user: any, idx: number) => (
                        <div key={idx} className="bg-slate-50 rounded-xl p-3 border border-slate-200/70 flex items-center justify-between">
                          <div className="flex items-center gap-3">
                            <div className="w-8 h-8 rounded-lg bg-slate-200 text-slate-700 flex items-center justify-center text-sm font-semibold">
                              🚕
                            </div>
                            <div>
                              <h4 className="text-xs font-bold text-slate-900">{user.name}</h4>
                              <p className="text-[10px] text-slate-500 font-medium">Business Partner • Joined {user.date}</p>
                            </div>
                          </div>

                          <div className="text-right space-y-0.5">
                            <span className={`inline-block px-2 py-0.5 rounded text-[9px] font-semibold ${user.verified ? 'bg-emerald-100 text-emerald-800' : 'bg-slate-200 text-slate-700'}`}>
                              {user.status}
                            </span>
                            <p className="text-[10px] font-bold text-[#047857]">
                              +₹{user.referral_earned} earned
                            </p>
                          </div>
                        </div>
                      ))}
                    </div>
                  ) : (
                    <div className="text-center py-6 border border-dashed border-slate-200 rounded-xl space-y-1">
                      <Briefcase className="w-6 h-6 text-slate-300 mx-auto" />
                      <p className="text-xs font-semibold text-slate-600">No referred business partners yet</p>
                      <p className="text-[10px] text-slate-500">Share your partner code to start building your business network!</p>
                    </div>
                  )}
                </div>
              </div>
            )}
          </div>
        </div>
      )}

      {/* Toast Notification */}
      {toast && (
        <div className="fixed bottom-6 left-1/2 -translate-x-1/2 bg-slate-900 text-white text-xs font-semibold px-4 py-2.5 rounded-full shadow-lg z-50 animate-fade-in">
          {toast}
        </div>
      )}

      {/* Aadhaar Verification Modal */}
      {showAadhaarModal && (
        <AadhaarRegistrationModal
          userId={userId}
          driverId={driverId}
          userCat={userCat}
          phone={phone}
          token={token}
          apiBase={getApiBase()}
          apiKey={API_KEY}
          onSuccess={handleAadhaarSuccess}
        />
      )}
    </div>
  );
}

export default function ReferralDashboardPage() {
  return (
    <Suspense
      fallback={
        <div className="min-h-screen bg-[#F8FAFC] flex items-center justify-center text-slate-500 text-xs font-semibold">
          Loading partner dashboard...
        </div>
      }
    >
      <ReferralDashboardContent />
    </Suspense>
  );
}
