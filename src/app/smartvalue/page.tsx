"use client";

import { Suspense, useEffect, useState, useCallback } from "react";

function SmartValueContent() {
  const [token, setToken] = useState<string | null>(null);
  const [driverId, setDriverId] = useState<string | null>(null);
  const [userId, setUserId] = useState<string | null>(null);
  const [userType, setUserType] = useState<'driver' | 'user'>('user');
  const [isInitialized, setIsInitialized] = useState(false);
  const [balance, setBalance] = useState<number>(0);
  const [earnings, setEarnings] = useState<number>(0);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);

  useEffect(() => {
    if (typeof window !== 'undefined') {
      const params = new URLSearchParams(window.location.search);
      const tok = params.get("accesstoken");
      const dId = params.get("driver_id") || params.get("id_driver");
      const uId = params.get("user_id") || params.get("id_user");
      const uType = (params.get("user_type") === 'driver' || dId) ? 'driver' : 'user';

      setToken(tok);
      setDriverId(dId);
      setUserId(uId || dId);
      setUserType(uType);
      setIsInitialized(true);
    }
  }, []);

  const triggerNativeAction = (actionName: string, extraData: Record<string, any> = {}) => {
    if (typeof window !== 'undefined' && (window as any).AppBridge) {
      try {
        (window as any).AppBridge.postMessage(JSON.stringify({
          action: actionName,
          ...extraData
        }));
        return true;
      } catch (err) {
        console.error("AppBridge postMessage error:", err);
      }
    }
    return false;
  };

  const fetchWalletBalance = useCallback(async (isSilent = false) => {
    const activeId = userType === 'driver' ? driverId : userId;
    if (!activeId) {
      setLoading(false);
      setRefreshing(false);
      return;
    }

    if (!isSilent) setLoading(true);
    else setRefreshing(true);

    const apiHeaders: Record<string, string> = {
      'Content-Type': 'application/json',
      'apikey': 'base64:nTfofcBByTDenJQYlsRbH0JjeVFW5lWsIIyXtq8/9sU=',
    };
    if (token) apiHeaders['accesstoken'] = token;

    try {
      // 1. Fetch via show_wallet_amount
      const showWalletUrl = `/api/v1/show_wallet_amount/${userType === 'driver' ? 'driver' : 'smart-value'}`;
      const amtRes = await fetch(showWalletUrl, {
        method: 'POST',
        headers: apiHeaders,
        body: JSON.stringify({
          user_id: activeId,
          id_user: activeId,
          driver_id: activeId,
          user_type: userType === 'driver' ? 'driver' : 'customer',
          ac_no: activeId,
        }),
      });

      let fetched = false;
      if (amtRes.ok) {
        const amtData = await amtRes.json();
        if (amtData.data) {
          const wAmt = Number(amtData.data.amount || amtData.data.wallet_amount || 0);
          const eAmt = Number(amtData.data.earn_amount || amtData.data.total_earnings || 0);
          setBalance(wAmt > 0 ? wAmt : eAmt);
          setEarnings(eAmt);
          fetched = true;
        }
      }

      // Fallback: GET /api/v1/wallet
      if (!fetched) {
        const walletUrl = `/api/v1/wallet?id_user=${activeId}&user_cat=${userType === 'driver' ? 'driver' : 'user'}`;
        const walletRes = await fetch(walletUrl, { headers: apiHeaders });
        if (walletRes.ok) {
          const wData = await walletRes.json();
          if (wData.success === 'success' && wData.data) {
            setBalance(Number(wData.data.amount || 0));
            setEarnings(Number(wData.data.earn_amount || 0));
          }
        }
      }
    } catch (err) {
      console.error("SmartValue fetchWalletBalance error:", err);
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  }, [userType, driverId, userId, token]);

  useEffect(() => {
    if (isInitialized) {
      fetchWalletBalance();

      if (typeof window !== 'undefined') {
        (window as any).refreshWalletData = () => fetchWalletBalance(true);
      }

      const interval = setInterval(() => {
        fetchWalletBalance(true);
      }, 3000);

      const onFocus = () => fetchWalletBalance(true);
      const onVisibilityChange = () => {
        if (document.visibilityState === 'visible') fetchWalletBalance(true);
      };

      window.addEventListener('focus', onFocus);
      document.addEventListener('visibilitychange', onVisibilityChange);

      return () => {
        clearInterval(interval);
        window.removeEventListener('focus', onFocus);
        document.removeEventListener('visibilitychange', onVisibilityChange);
      };
    }
  }, [isInitialized, fetchWalletBalance]);

  if (!isInitialized) {
    return (
      <div className="min-h-screen bg-[#F7F7F9] flex items-center justify-center p-6 font-sans">
        <div className="w-8 h-8 border-[3px] border-slate-200 border-t-slate-900 rounded-full animate-spin"></div>
      </div>
    );
  }

  const actions = [
    { title: userType === 'driver' ? "Partner Dashboard" : "All Services", icon: <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M3 12l2-2m0 0l7-7 7 7M5 10v10a1 1 0 001 1h3m10-11l2 2m-2-2v10a1 1 0 01-1 1h-3m-6 0a1 1 0 001-1v-4a1 1 0 011-1h2a1 1 0 011 1v4a1 1 0 001 1m-6 0h6" />, action: "dashboard" },
    { title: "Refer & Earn", icon: <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M17 20h5v-2a3 3 0 00-5.356-1.857M17 20H7m10 0v-2c0-.656-.126-1.283-.356-1.857M7 20H2v-2a3 3 0 015.356-1.857M7 20v-2c0-.656.126-1.283.356-1.857m0 0a5.002 5.002 0 019.288 0M15 7a3 3 0 11-6 0 3 3 0 016 0zm6 3a2 2 0 11-4 0 2 2 0 014 0zM7 10a2 2 0 11-4 0 2 2 0 014 0z" />, action: "refer" },
    { title: "Account Details", icon: <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z" />, action: "account" },
    { title: "Transfer Money", icon: <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M8 7h12m0 0l-4-4m4 4l-4 4m0 6H4m0 0l4 4m-4-4l4-4" />, action: "transfer" },
    { title: "My QR Code", icon: <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M12 4v1m6 11h2m-6 0h-2v4m0-11v3m0 0h.01M12 12h4.01M16 20h4M4 12h4m12 0h.01M5 8h2a1 1 0 001-1V5a1 1 0 00-1-1H5a1 1 0 00-1 1v2a1 1 0 001 1zm14 0h2a1 1 0 001-1V5a1 1 0 00-1-1h-2a1 1 0 00-1 1v2a1 1 0 001 1zM5 20h2a1 1 0 001-1v-2a1 1 0 00-1-1H5a1 1 0 00-1 1v2a1 1 0 001 1z" />, action: "qr" },
    { title: "Set M-PIN", icon: <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M12 15v2m-6 4h12a2 2 0 002-2v-6a2 2 0 00-2-2H6a2 2 0 00-2 2v6a2 2 0 002 2zm10-10V7a4 4 0 00-8 0v4h8z" />, action: "mpin" },
  ];

  const handleActionClick = (item: any) => {
    if (item.action === "dashboard") {
      if (userType === 'driver') {
        window.location.href = `/onboarding/dashboard?accesstoken=${token || ""}&driver_id=${driverId || ""}`;
      } else {
        window.location.href = `/onboarding/wallet?accesstoken=${token || ""}&user_id=${userId || ""}&user_type=user`;
      }
    } else if (item.action === "refer") {
      window.location.href = `/onboarding/referral?accesstoken=${token || ""}&driver_id=${driverId || ""}&user_id=${userId || ""}`;
    } else if (item.action === "transfer") {
      triggerNativeAction('transfer');
    } else if (item.action === "account") {
      triggerNativeAction('account_details');
    } else if (item.action === "qr") {
      triggerNativeAction('my_qr');
    } else if (item.action === "mpin") {
      triggerNativeAction('mpin');
    } else {
      triggerNativeAction(item.action);
    }
  };

  const handleTopUp = () => {
    const handled = triggerNativeAction('topup');
    if (!handled) {
      window.location.href = `/onboarding/wallet?accesstoken=${token || ""}&user_id=${userId || ""}&driver_id=${driverId || ""}&user_type=${userType}`;
    }
  };

  const handleWithdraw = () => {
    const handled = triggerNativeAction('withdraw');
    if (!handled) {
      window.location.href = `/onboarding/wallet?accesstoken=${token || ""}&user_id=${userId || ""}&driver_id=${driverId || ""}&user_type=${userType}`;
    }
  };

  return (
    <div className="min-h-screen bg-[#F7F7F9] flex flex-col p-5 font-sans pb-24 selection:bg-slate-200">
      <div className="max-w-md mx-auto w-full mt-4">
        
        {/* Header Section */}
        <div className="mb-8 animate-in fade-in slide-in-from-top-4 duration-700">
          <div className="flex justify-between items-center mb-6">
            <div>
              <h1 className="text-[30px] font-black text-slate-900 tracking-tight leading-tight">Smart Value.</h1>
              <p className="text-xs text-slate-500 font-medium">Instant Universal Digital Wallet</p>
            </div>
            <button 
              onClick={() => fetchWalletBalance()} 
              className={`w-10 h-10 bg-slate-100 border border-slate-200 text-slate-700 rounded-full flex items-center justify-center shadow-sm hover:bg-slate-200 active:scale-95 transition-all ${refreshing ? 'animate-spin' : ''}`}
              title="Refresh Wallet"
            >
              <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15" />
              </svg>
            </button>
          </div>
          
          {/* Balance Card - Premium Design */}
          <div className="relative overflow-hidden bg-slate-900 rounded-[28px] p-8 shadow-[0_20px_40px_rgb(0,0,0,0.15)] transform transition-transform hover:scale-[1.01] duration-500">
            {/* Decorative background elements */}
            <div className="absolute top-0 right-0 -mr-16 -mt-16 w-64 h-64 rounded-full bg-gradient-to-br from-slate-700/40 to-slate-800/10 blur-2xl"></div>
            <div className="absolute bottom-0 left-0 -ml-16 -mb-16 w-48 h-48 rounded-full bg-gradient-to-tr from-[#6AA720]/20 to-slate-800/10 blur-xl"></div>
            
            <div className="relative z-10">
              <div className="flex items-center justify-between mb-2">
                <p className="text-slate-400 font-bold text-[12px] tracking-widest uppercase">Total Balance</p>
                {refreshing && <span className="text-[11px] text-[#6AA720] font-bold animate-pulse">Syncing...</span>}
              </div>
              <div className="flex items-baseline gap-1 mb-6">
                <span className="text-white text-[40px] font-black tracking-tighter">
                  ₹{loading ? '...' : balance.toLocaleString('en-IN', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
                </span>
              </div>

              {earnings > 0 && (
                <div className="mb-6 p-3 bg-white/5 border border-white/10 rounded-xl flex items-center justify-between">
                  <span className="text-xs text-slate-400 font-medium">Smart Earnings</span>
                  <span className="text-xs text-[#6AA720] font-bold">₹{earnings.toLocaleString('en-IN', { minimumFractionDigits: 2 })}</span>
                </div>
              )}
              
              <div className="flex gap-3">
                <button 
                  onClick={handleTopUp}
                  className="flex-1 bg-[#6AA720] hover:bg-[#5b921b] text-white font-bold py-3 rounded-xl text-[13px] shadow-lg transition-transform active:scale-[0.97]"
                >
                  + Add Money
                </button>
                <button 
                  onClick={handleWithdraw}
                  className="flex-1 bg-slate-800 hover:bg-slate-700 text-white font-bold py-3 rounded-xl text-[13px] shadow-lg transition-transform active:scale-[0.97] border border-slate-700"
                >
                  Withdraw / Payout
                </button>
              </div>
            </div>
          </div>
        </div>

        {/* Quick Actions Grid */}
        <div className="animate-in fade-in slide-in-from-bottom-4 duration-700 delay-150">
          <h2 className="text-[14px] font-bold text-slate-900 uppercase tracking-wider mb-4">Quick Actions</h2>
          <div className="grid grid-cols-2 gap-3.5">
            {actions.map((item, idx) => (
              <div 
                key={idx}
                className="group relative bg-white p-4 rounded-[20px] border border-slate-200/60 hover:border-slate-800 transition-all duration-300 cursor-pointer shadow-[0_2px_10px_rgb(0,0,0,0.02)] hover:shadow-[0_8px_20px_rgb(0,0,0,0.06)] active:scale-[0.98] flex flex-col justify-between min-h-[115px]"
                onClick={() => handleActionClick(item)}
              >
                <div className="w-9 h-9 rounded-full bg-slate-50 border border-slate-100 flex items-center justify-center text-slate-600 group-hover:bg-slate-900 group-hover:text-white transition-colors duration-300 mb-3">
                  <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    {item.icon}
                  </svg>
                </div>
                <div className="flex justify-between items-end">
                  <span className="font-bold text-[14px] text-slate-800 leading-snug group-hover:text-slate-900 max-w-[85px]">
                    {item.title}
                  </span>
                  <div className="w-5 h-5 rounded-full flex items-center justify-center">
                    <svg className="w-3 h-3 text-slate-400 group-hover:text-slate-900 transition-colors duration-300" fill="none" stroke="currentColor" viewBox="0 0 24 24">
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
