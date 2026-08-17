"use client";

import { useSearchParams } from "next/navigation";
import { Suspense, useEffect, useState } from "react";

function SmartValueContent() {
  const [token, setToken] = useState<string | null>(null);
  const [driverId, setDriverId] = useState<string | null>(null);
  const [userId, setUserId] = useState<string | null>(null);
  const [isInitialized, setIsInitialized] = useState(false);
  const [balance] = useState(12450.75); // Mock balance

  useEffect(() => {
    if (typeof window !== 'undefined') {
      const params = new URLSearchParams(window.location.search);
      setToken(params.get("accesstoken"));
      setDriverId(params.get("driver_id"));
      setUserId(params.get("user_id"));
      setIsInitialized(true);
    }
  }, []);

  if (!isInitialized) {
    return (
      <div className="min-h-screen bg-[#F7F7F9] flex items-center justify-center p-6 font-sans">
        <div className="w-8 h-8 border-[3px] border-slate-200 border-t-slate-900 rounded-full animate-spin"></div>
      </div>
    );
  }

  if (!token) {
    return (
      <div className="min-h-screen bg-[#F7F7F9] flex items-center justify-center p-6 font-sans">
        <div className="bg-red-50/80 text-red-700 px-5 py-4 rounded-2xl font-medium shadow-sm border border-red-100/50 backdrop-blur-md">
          Unauthorized access. Missing valid session token.
        </div>
      </div>
    );
  }

  const actions = [
    { title: "Partner Dashboard", icon: <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M3 12l2-2m0 0l7-7 7 7M5 10v10a1 1 0 001 1h3m10-11l2 2m-2-2v10a1 1 0 01-1 1h-3m-6 0a1 1 0 001-1v-4a1 1 0 011-1h2a1 1 0 011 1v4a1 1 0 001 1m-6 0h6" />, action: "partner_dashboard" },
    { title: "Refer & Earn", icon: <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M17 20h5v-2a3 3 0 00-5.356-1.857M17 20H7m10 0v-2c0-.656-.126-1.283-.356-1.857M7 20H2v-2a3 3 0 015.356-1.857M7 20v-2c0-.656.126-1.283.356-1.857m0 0a5.002 5.002 0 019.288 0M15 7a3 3 0 11-6 0 3 3 0 016 0zm6 3a2 2 0 11-4 0 2 2 0 014 0zM7 10a2 2 0 11-4 0 2 2 0 014 0z" />, action: "refer" },
    { title: "Account Details", icon: <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z" />, action: "account" },
    { title: "Transfer Money", icon: <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M8 7h12m0 0l-4-4m4 4l-4 4m0 6H4m0 0l4 4m-4-4l4-4" />, action: "transfer" },
    { title: "My QR Code", icon: <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M12 4v1m6 11h2m-6 0h-2v4m0-11v3m0 0h.01M12 12h4.01M16 20h4M4 12h4m12 0h.01M5 8h2a1 1 0 001-1V5a1 1 0 00-1-1H5a1 1 0 00-1 1v2a1 1 0 001 1zm14 0h2a1 1 0 001-1V5a1 1 0 00-1-1h-2a1 1 0 00-1 1v2a1 1 0 001 1zM5 20h2a1 1 0 001-1v-2a1 1 0 00-1-1H5a1 1 0 00-1 1v2a1 1 0 001 1z" />, action: "qr" },
    { title: "Set M-PIN", icon: <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M12 15v2m-6 4h12a2 2 0 002-2v-6a2 2 0 00-2-2H6a2 2 0 00-2 2v6a2 2 0 002 2zm10-10V7a4 4 0 00-8 0v4h8z" />, action: "mpin" },
  ];

  const handleActionClick = (item: any) => {
    if (item.action === "partner_dashboard") {
      window.location.href = `/onboarding/dashboard?accesstoken=${token || ""}&driver_id=${driverId || ""}`;
    } else if (item.action === "refer") {
      window.location.href = `/onboarding/referral?accesstoken=${token || ""}&driver_id=${driverId || ""}`;
    } else {
      alert(`Opening ${item.title}...`);
    }
  };

  return (
    <div className="min-h-screen bg-[#F7F7F9] flex flex-col p-5 font-sans pb-24 selection:bg-slate-200">
      <div className="max-w-md mx-auto w-full mt-4">
        
        {/* Header Section */}
        <div className="mb-10 animate-in fade-in slide-in-from-top-4 duration-700">
          <div className="flex justify-between items-center mb-6">
            <h1 className="text-[32px] font-black text-slate-900 tracking-tight leading-tight">Smart Value.</h1>
            <div className="w-12 h-12 bg-slate-900 text-white rounded-full flex items-center justify-center shadow-lg">
              <span className="font-bold text-lg">{userId ? userId.charAt(0) : (driverId ? driverId.charAt(0) : 'U')}</span>
            </div>
          </div>
          
          {/* Balance Card - Premium Design */}
          <div className="relative overflow-hidden bg-slate-900 rounded-[28px] p-8 shadow-[0_20px_40px_rgb(0,0,0,0.15)] transform transition-transform hover:scale-[1.02] duration-500">
            {/* Decorative background elements */}
            <div className="absolute top-0 right-0 -mr-16 -mt-16 w-64 h-64 rounded-full bg-gradient-to-br from-slate-700/40 to-slate-800/10 blur-2xl"></div>
            <div className="absolute bottom-0 left-0 -ml-16 -mb-16 w-48 h-48 rounded-full bg-gradient-to-tr from-indigo-500/20 to-slate-800/10 blur-xl"></div>
            
            <div className="relative z-10">
              <p className="text-slate-400 font-bold text-[13px] tracking-widest uppercase mb-2">Total Balance</p>
              <div className="flex items-baseline gap-1 mb-8">
                <span className="text-white text-[44px] font-black tracking-tighter">{balance.toLocaleString('en-US', { minimumFractionDigits: 2 })}</span>
              </div>
              
              <div className="flex gap-4">
                <button className="flex-1 bg-white text-slate-900 font-bold py-3.5 rounded-xl text-[14px] shadow-lg transition-transform active:scale-[0.97] hover:bg-slate-50">
                  Add Money
                </button>
                <button className="flex-1 bg-slate-800 text-white font-bold py-3.5 rounded-xl text-[14px] shadow-lg transition-transform active:scale-[0.97] hover:bg-slate-700 border border-slate-700/50">
                  Withdraw
                </button>
              </div>
            </div>
          </div>
        </div>

        {/* Quick Actions Grid */}
        <div className="animate-in fade-in slide-in-from-bottom-4 duration-700 delay-150">
          <h2 className="text-[15px] font-bold text-slate-900 uppercase tracking-wider mb-5">Quick Actions</h2>
          <div className="grid grid-cols-2 gap-4">
            {actions.map((item, idx) => (
              <div 
                key={idx}
                className="group relative bg-white p-5 rounded-[22px] border border-slate-200/50 hover:border-slate-800 transition-all duration-300 cursor-pointer shadow-[0_2px_12px_rgb(0,0,0,0.02)] hover:shadow-[0_8px_24px_rgb(0,0,0,0.08)] active:scale-[0.98] flex flex-col justify-between min-h-[120px]"
                onClick={() => handleActionClick(item)}
              >
                <div className="w-10 h-10 rounded-full bg-slate-50 border border-slate-100 flex items-center justify-center text-slate-600 group-hover:bg-slate-900 group-hover:text-white transition-colors duration-300 mb-4">
                  <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    {item.icon}
                  </svg>
                </div>
                <div className="flex justify-between items-end">
                  <span className="font-bold text-[15px] text-slate-800 leading-snug group-hover:text-slate-900 max-w-[80px]">
                    {item.title}
                  </span>
                  <div className="w-6 h-6 rounded-full flex items-center justify-center">
                    <svg className="w-3.5 h-3.5 text-slate-400 group-hover:text-slate-900 transition-colors duration-300" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2.5" d="M9 5l7 7-7 7"></path>
                    </svg>
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>
        
      </div>
    </div>
  );
}

export default function SmartValuePage() {
  return (
    <Suspense fallback={
      <div className="min-h-screen bg-[#F7F7F9] flex items-center justify-center">
        <div className="w-8 h-8 border-[3px] border-slate-200 border-t-slate-900 rounded-full animate-spin"></div>
      </div>
    }>
      <SmartValueContent />
    </Suspense>
  );
}
