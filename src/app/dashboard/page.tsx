"use client";

import { useSearchParams } from "next/navigation";
import { Suspense, useEffect, useState, useCallback, useRef } from "react";

const API_KEY = "base64:nTfofcBByTDenJQYlsRbH0JjeVFW5lWsIIyXtq8/9sU=";
const getApiBase = () => (typeof window !== "undefined" ? `${window.location.origin}/api/v1` : "https://fiinway.online/api/v1");

function fmtMoney(v: string | number) {
  const n = Number(v || 0);
  return `₹${n.toLocaleString("en-IN", { maximumFractionDigits: 0 })}`;
}

function DashboardContent() {
  const searchParams = useSearchParams();
  const [token, setToken] = useState<string | null>(null);
  const [driverId, setDriverId] = useState<string | null>(null);
  const [isInitialized, setIsInitialized] = useState(false);

  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [data, setData] = useState<any>(null);
  const [togglingOnline, setTogglingOnline] = useState(false);
  const [toast, setToast] = useState("");

  // Pull-to-refresh state
  const [refreshing, setRefreshing] = useState(false);
  const [pullDistance, setPullDistance] = useState(0);
  const startYRef = useRef(0);
  const isPullingRef = useRef(false);

  useEffect(() => {
    if (typeof window !== "undefined") {
      const urlParams = new URLSearchParams(window.location.search);
      const t = urlParams.get("accesstoken") || searchParams.get("accesstoken");
      const d = urlParams.get("driver_id") || searchParams.get("driver_id");
      setToken(t);
      setDriverId(d);
      setIsInitialized(true);
    }
  }, [searchParams]);

  const fetchStats = useCallback(async () => {
    if (!token || !driverId) return;
    try {
      const apiBase = getApiBase();
      const url = `${apiBase}/driver-dashboard-stats/?driver_id=${driverId}&apikey=${encodeURIComponent(API_KEY)}&accesstoken=${encodeURIComponent(token)}`;
      const res = await fetch(url, {
        headers: { apikey: API_KEY, accesstoken: token },
      });
      const json = await res.json();
      if (json.success === "success" && json.data) {
        setData(json.data);
        setError("");
      } else {
        setError(json.error || "Failed to load dashboard.");
      }
    } catch (e) {
      setError("Network error while loading dashboard.");
    } finally {
      setLoading(false);
      setRefreshing(false);
      setPullDistance(0);
    }
  }, [token, driverId]);

  useEffect(() => {
    if (!token || !driverId) {
      if (isInitialized) {
        setLoading(false);
      }
      return;
    }
    fetchStats();
  }, [token, driverId, fetchStats, isInitialized]);

  const handleTouchStart = (e: React.TouchEvent) => {
    if (window.scrollY === 0) {
      startYRef.current = e.touches[0].clientY;
      isPullingRef.current = true;
    }
  };

  const handleTouchMove = (e: React.TouchEvent) => {
    if (!isPullingRef.current || window.scrollY > 0) return;
    const currentY = e.touches[0].clientY;
    const diff = currentY - startYRef.current;
    if (diff > 0) {
      setPullDistance(Math.min(diff * 0.4, 70));
    }
  };

  const handleTouchEnd = async () => {
    if (!isPullingRef.current) return;
    isPullingRef.current = false;
    if (pullDistance >= 50) {
      setRefreshing(true);
      fetchStats();
    } else {
      setPullDistance(0);
    }
  };

  const showToast = (msg: string) => {
    setToast(msg);
    setTimeout(() => setToast(""), 2000);
  };

  const handleToggleOnline = async () => {
    if (!data || togglingOnline) return;
    const nextOnline = data.online === "yes" ? "no" : "yes";
    setTogglingOnline(true);
    setData((prev: any) => ({ ...prev, online: nextOnline }));
    try {
      const apiBase = getApiBase();
      const res = await fetch(`${apiBase}/change-status/`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          apikey: API_KEY,
          accesstoken: token || "",
        },
        body: JSON.stringify({ id_driver: driverId, online: nextOnline }),
      });
      const json = await res.json();
      if (json.success !== "success") {
        setData((prev: any) => ({ ...prev, online: nextOnline === "yes" ? "no" : "yes" }));
        showToast("Couldn't update your status. Try again.");
      }
    } catch (e) {
      setData((prev: any) => ({ ...prev, online: nextOnline === "yes" ? "no" : "yes" }));
      showToast("Couldn't update your status. Try again.");
    } finally {
      setTogglingOnline(false);
    }
  };

  const goTo = (url: string) => {
    window.location.href = url;
  };

  if (!isInitialized || loading) {
    return (
      <div className="min-h-screen bg-[#F5F5FA] flex items-center justify-center">
        <div className="w-8 h-8 border-[3px] border-indigo-100 border-t-indigo-600 rounded-full animate-spin"></div>
      </div>
    );
  }

  if (!token || !driverId) {
    return (
      <div className="min-h-screen bg-[#F5F5FA] flex items-center justify-center p-6 font-sans">
        <div className="bg-red-50/80 text-red-700 px-5 py-4 rounded-2xl font-medium shadow-sm border border-red-100/50">
          Unauthorized access. Missing session token or driver id.
        </div>
      </div>
    );
  }

  if (error || !data) {
    return (
      <div className="min-h-screen bg-[#F5F5FA] flex items-center justify-center p-6 font-sans">
        <div className="bg-red-50/80 text-red-700 px-5 py-4 rounded-2xl font-medium shadow-sm border border-red-100/50">
          {error || "Something went wrong."}
        </div>
      </div>
    );
  }

  const isOnline = data.online === "yes";
  const pendingCount = Number(data.pending_requests || 0);
  const active = data.active_service;

  return (
    <div
      className="min-h-screen bg-[#F5F5FA] font-sans pb-28 overscroll-y-contain"
      onTouchStart={handleTouchStart}
      onTouchMove={handleTouchMove}
      onTouchEnd={handleTouchEnd}
    >
      {/* Pull down indicator */}
      {(pullDistance > 0 || refreshing) && (
        <div
          className="flex items-center justify-center transition-all duration-200 overflow-hidden"
          style={{ height: refreshing ? 50 : pullDistance }}
        >
          <div className="flex items-center gap-2 text-indigo-600 text-xs font-semibold py-2">
            <div className="w-4 h-4 border-2 border-indigo-600 border-t-transparent rounded-full animate-spin"></div>
            <span>{refreshing ? "Refreshing..." : "Pull down to refresh"}</span>
          </div>
        </div>
      )}

      {/* Header */}
      <div className="bg-gradient-to-br from-[#5B4FE9] to-[#4338CA] px-5 pt-8 pb-16 rounded-b-[32px] shadow-[0_8px_24px_rgba(67,56,202,0.25)]">
        <div className="max-w-md mx-auto flex items-center justify-between">
          <div className="flex items-center gap-3">
            {data.photo ? (
              <img src={data.photo} alt="" className="w-11 h-11 rounded-full object-cover border-2 border-white/40" />
            ) : (
              <div className="w-11 h-11 rounded-full bg-white/20 flex items-center justify-center text-white font-bold text-lg">
                {(data.name || "D").charAt(0)}
              </div>
            )}
            <div>
              <p className="text-white/70 text-[12px] font-medium">Good day,</p>
              <h1 className="text-white text-[18px] font-bold leading-tight">{data.name}</h1>
            </div>
          </div>
          <div className="w-10 h-10 rounded-full bg-white/15 flex items-center justify-center">
            <svg className="w-5 h-5 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M15 17h5l-1.4-1.4A2 2 0 0118 14.2V11a6 6 0 10-12 0v3.2c0 .5-.2 1-.6 1.4L4 17h5m6 0v1a3 3 0 11-6 0v-1m6 0H9"></path></svg>
          </div>
        </div>

        <div className="max-w-md mx-auto mt-6 bg-white/10 backdrop-blur-md rounded-2xl px-4 py-3 flex items-center justify-between border border-white/10">
          <div className="flex items-center gap-2">
            <span className={`w-2.5 h-2.5 rounded-full ${isOnline ? "bg-emerald-400" : "bg-white/40"}`}></span>
            <span className="text-white font-semibold text-[14px]">
              {isOnline ? "You are online" : "You are offline"}
            </span>
          </div>
          <button
            onClick={handleToggleOnline}
            disabled={togglingOnline}
            aria-pressed={isOnline}
            className={`w-12 h-7 rounded-full flex items-center px-0.5 transition-colors duration-200 disabled:opacity-60 ${isOnline ? "bg-emerald-400 justify-end" : "bg-white/25 justify-start"}`}
          >
            <span className="w-6 h-6 rounded-full bg-white shadow-sm"></span>
          </button>
        </div>
      </div>

      {/* Body */}
      <div className="max-w-md mx-auto px-5 -mt-9">
        {/* Stat grid */}
        <div className="grid grid-cols-2 gap-3">
          <StatCard label="Today's Earnings" value={fmtMoney(data.today_earnings)} icon="wallet" tint="emerald" />
          <StatCard label="Today's Bookings" value={String(data.today_bookings)} icon="calendar" tint="indigo" />
          <StatCard label="Wallet Balance" value={fmtMoney(data.wallet_balance)} icon="bank" tint="amber" />
          <StatCard label="Your Rating" value={`${data.rating} ★`} sub={`${data.rating_count} reviews`} icon="star" tint="violet" />
        </div>

        {/* Pending requests */}
        {pendingCount > 0 && (
          <button
            onClick={() => goTo(`/onboarding/more?accesstoken=${token}&driver_id=${driverId}`)}
            className="w-full mt-4 bg-white rounded-2xl border border-slate-200/70 p-4 flex items-center justify-between shadow-[0_2px_12px_rgb(0,0,0,0.03)] active:scale-[0.99] transition-transform"
          >
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-xl bg-amber-50 text-amber-600 flex items-center justify-center font-bold">{pendingCount}</div>
              <div className="text-left">
                <p className="text-[14px] font-bold text-slate-900">Pending Requests</p>
                <p className="text-[12px] text-slate-500">New service requests waiting for your response</p>
              </div>
            </div>
            <svg className="w-4 h-4 text-slate-400" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2.5" d="M9 5l7 7-7 7"></path></svg>
          </button>
        )}

        {/* Active service */}
        {active && (
          <div className="w-full mt-4 bg-white rounded-2xl border border-slate-200/70 p-4 shadow-[0_2px_12px_rgb(0,0,0,0.03)]">
            <div className="flex items-center justify-between mb-2">
              <p className="text-[14px] font-bold text-slate-900">Active Service</p>
              <span className="px-2.5 py-1 rounded-lg bg-indigo-50 text-indigo-700 text-[10px] font-black uppercase tracking-wider">
                {active.statut === "on ride" ? "In Progress" : "Confirmed"}
              </span>
            </div>
            <p className="text-[13px] text-slate-500">{active.depart_name || "Service in progress"}</p>
          </div>
        )}

        {/* Quick actions */}
        <div className="mt-6">
          <p className="text-[11px] font-bold text-slate-400 uppercase tracking-wider mb-3 px-1">Quick Actions</p>
          <div className="grid grid-cols-4 gap-3">
            <QuickAction label="My Services" icon="briefcase" onClick={() => goTo(`/onboarding/more?accesstoken=${token}&driver_id=${driverId}`)} />
            <QuickAction label="Bookings" icon="calendar" onClick={() => goTo(`/onboarding/more?accesstoken=${token}&driver_id=${driverId}`)} />
            <QuickAction label="Wallet" icon="wallet" onClick={() => showToast("Coming soon")} />
            <QuickAction label="Documents" icon="doc" onClick={() => showToast("Coming soon")} />
          </div>
        </div>
      </div>

      {/* Bottom nav */}
      <div className="fixed bottom-0 left-0 right-0 bg-white border-t border-slate-200/70 px-6 py-2.5">
        <div className="max-w-md mx-auto flex items-center justify-between">
          <NavItem label="Home" icon="home" active />
          <NavItem label="Jobs" icon="briefcase" onClick={() => goTo(`/onboarding/more?accesstoken=${token}&driver_id=${driverId}`)} />
          <NavItem label="Earnings" icon="wallet" onClick={() => showToast("Coming soon")} />
          <NavItem label="Profile" icon="user" onClick={() => showToast("Coming soon")} />
        </div>
      </div>

      {toast && (
        <div className="fixed bottom-24 left-1/2 -translate-x-1/2 bg-slate-900 text-white text-[13px] font-semibold px-4 py-2.5 rounded-full shadow-lg z-50">
          {toast}
        </div>
      )}
    </div>
  );
}

function StatCard({ label, value, sub, icon, tint }: { label: string; value: string; sub?: string; icon: string; tint: "emerald" | "indigo" | "amber" | "violet" }) {
  const tints: Record<string, string> = {
    emerald: "bg-emerald-50 text-emerald-600",
    indigo: "bg-indigo-50 text-indigo-600",
    amber: "bg-amber-50 text-amber-600",
    violet: "bg-violet-50 text-violet-600",
  };
  return (
    <div className="bg-white rounded-2xl border border-slate-200/70 p-4 shadow-[0_2px_12px_rgb(0,0,0,0.04)]">
      <div className={`w-9 h-9 rounded-xl flex items-center justify-center mb-3 ${tints[tint]}`}>
        <Icon name={icon} className="w-4.5 h-4.5" />
      </div>
      <p className="text-[17px] font-black text-slate-900 tabular-nums leading-tight">{value}</p>
      <p className="text-[11px] font-semibold text-slate-400 mt-0.5">{label}</p>
      {sub && <p className="text-[10px] text-slate-400 mt-0.5">{sub}</p>}
    </div>
  );
}

function QuickAction({ label, icon, onClick }: { label: string; icon: string; onClick: () => void }) {
  return (
    <button onClick={onClick} className="flex flex-col items-center gap-2 active:scale-95 transition-transform">
      <div className="w-12 h-12 rounded-2xl bg-white border border-slate-200/70 flex items-center justify-center text-slate-600 shadow-[0_2px_8px_rgb(0,0,0,0.03)]">
        <Icon name={icon} className="w-5 h-5" />
      </div>
      <span className="text-[10.5px] font-semibold text-slate-600 text-center leading-tight">{label}</span>
    </button>
  );
}

function NavItem({ label, icon, active, onClick }: { label: string; icon: string; active?: boolean; onClick?: () => void }) {
  return (
    <button onClick={onClick} className="flex flex-col items-center gap-1 py-1.5 px-2">
      <Icon name={icon} className={`w-5 h-5 ${active ? "text-indigo-600" : "text-slate-400"}`} />
      <span className={`text-[10px] font-bold ${active ? "text-indigo-600" : "text-slate-400"}`}>{label}</span>
    </button>
  );
}

function Icon({ name, className }: { name: string; className?: string }) {
  const paths: Record<string, string> = {
    wallet: "M21 12a2 2 0 00-2-2H5a2 2 0 00-2 2m18 0v6a2 2 0 01-2 2H5a2 2 0 01-2-2v-6m18 0V8a2 2 0 00-2-2H5a2 2 0 00-2 2v4m14 3h.01",
    calendar: "M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z",
    bank: "M3 21h18M4 21V9l8-6 8 6v12M9 21v-6h6v6",
    star: "M12 17.3l-5.5 3 1.5-6-4.5-4 6-.5L12 4l2.5 5.8 6 .5-4.5 4 1.5 6z",
    briefcase: "M3 7h18v12a2 2 0 01-2 2H5a2 2 0 01-2-2V7zm4 0V5a2 2 0 012-2h6a2 2 0 012 2v2",
    doc: "M7 3h7l5 5v13a1 1 0 01-1 1H7a1 1 0 01-1-1V4a1 1 0 011-1zM13 3v6h6",
    home: "M4 12l8-8 8 8M6 10v10a1 1 0 001 1h4v-6h4v6h4a1 1 0 001-1V10",
    user: "M20 21a8 8 0 10-16 0M12 11a4 4 0 100-8 4 4 0 000 8z",
  };
  return (
    <svg className={className} fill="none" stroke="currentColor" viewBox="0 0 24 24">
      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d={paths[name] || paths.doc}></path>
    </svg>
  );
}

export default function DashboardPage() {
  return (
    <Suspense
      fallback={
        <div className="min-h-screen bg-[#F5F5FA] flex items-center justify-center">
          <div className="w-8 h-8 border-[3px] border-indigo-100 border-t-indigo-600 rounded-full animate-spin"></div>
        </div>
      }
    >
      <DashboardContent />
    </Suspense>
  );
}
