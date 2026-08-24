'use client';

import { useState, useEffect, useCallback } from 'react';

// --- Inline SVG Icons ---
function WalletIcon({ className = "w-5 h-5" }: { className?: string }) {
  return (
    <svg className={className} fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
      <path strokeLinecap="round" strokeLinejoin="round" d="M3 10h18M7 15h1m4 0h1m-7 4h12a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v10a2 2 0 002 2z" />
    </svg>
  );
}

function ArrowUpRightIcon({ className = "w-4 h-4" }: { className?: string }) {
  return (
    <svg className={className} fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2.5}>
      <path strokeLinecap="round" strokeLinejoin="round" d="M7 17L17 7M17 7H7M17 7V17" />
    </svg>
  );
}

function ArrowDownLeftIcon({ className = "w-4 h-4" }: { className?: string }) {
  return (
    <svg className={className} fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2.5}>
      <path strokeLinecap="round" strokeLinejoin="round" d="M17 7L7 17M7 17H17M7 17V7" />
    </svg>
  );
}

function RefreshIcon({ className = "w-4 h-4" }: { className?: string }) {
  return (
    <svg className={className} fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
      <path strokeLinecap="round" strokeLinejoin="round" d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15" />
    </svg>
  );
}

function BuildingIcon({ className = "w-5 h-5" }: { className?: string }) {
  return (
    <svg className={className} fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
      <path strokeLinecap="round" strokeLinejoin="round" d="M19 21V5a2 2 0 00-2-2H7a2 2 0 00-2 2v16m14 0h2m-2 0h-5m-9 0H3m2 0h5m0 0v-5a2 2 0 012-2h2a2 2 0 012 2v5m-4 0h4" />
    </svg>
  );
}

function CreditCardIcon({ className = "w-5 h-5" }: { className?: string }) {
  return (
    <svg className={className} fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
      <path strokeLinecap="round" strokeLinejoin="round" d="M3 10h18M7 15h1m4 0h1m-7 4h12a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v10a2 2 0 002 2z" />
    </svg>
  );
}

function SendIcon({ className = "w-5 h-5" }: { className?: string }) {
  return (
    <svg className={className} fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
      <path strokeLinecap="round" strokeLinejoin="round" d="M12 19l9 2-9-18-9 18 9-2zm0 0v-8" />
    </svg>
  );
}

function QrCodeIcon({ className = "w-5 h-5" }: { className?: string }) {
  return (
    <svg className={className} fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
      <path strokeLinecap="round" strokeLinejoin="round" d="M12 4v1m6 11h2m-6 0h-2v4m0-11v3m0 0h.01M12 12h4.01M16 20h4M4 12h4m12 0h.01M5 8h2a1 1 0 001-1V5a1 1 0 00-1-1H5a1 1 0 00-1 1v2a1 1 0 001 1zm12 0h2a1 1 0 001-1V5a1 1 0 00-1-1h-2a1 1 0 00-1 1v2a1 1 0 001 1zM5 20h2a1 1 0 001-1v-2a1 1 0 00-1-1H5a1 1 0 00-1 1v2a1 1 0 001 1z" />
    </svg>
  );
}

function SparklesIcon({ className = "w-5 h-5" }: { className?: string }) {
  return (
    <svg className={className} fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
      <path strokeLinecap="round" strokeLinejoin="round" d="M5 3v4M3 5h4M6 17v4m-2-2h4m5-16l2.286 6.857L21 12l-5.714 2.143L13 21l-2.286-6.857L5 12l5.714-2.143L13 3z" />
    </svg>
  );
}

function CheckIcon({ className = "w-4 h-4" }: { className?: string }) {
  return (
    <svg className={className} fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2.5}>
      <path strokeLinecap="round" strokeLinejoin="round" d="M5 13l4 4L19 7" />
    </svg>
  );
}

function ChevronRightIcon({ className = "w-5 h-5" }: { className?: string }) {
  return (
    <svg className={className} fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
      <path strokeLinecap="round" strokeLinejoin="round" d="M9 5l7 7-7 7" />
    </svg>
  );
}

function ChevronDownIcon({ className = "w-3.5 h-3.5" }: { className?: string }) {
  return (
    <svg className={className} fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
      <path strokeLinecap="round" strokeLinejoin="round" d="M19 9l-7 7-7-7" />
    </svg>
  );
}

function FilterIcon({ className = "w-3.5 h-3.5" }: { className?: string }) {
  return (
    <svg className={className} fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
      <path strokeLinecap="round" strokeLinejoin="round" d="M3 4a1 1 0 011-1h16a1 1 0 011 1v2.586a1 1 0 01-.293.707l-6.414 6.414a1 1 0 00-.293.707V17l-4 4v-6.586a1 1 0 00-.293-.707L3.293 7.293A1 1 0 013 6.586V4z" />
    </svg>
  );
}

function ClockIcon({ className = "w-10 h-10" }: { className?: string }) {
  return (
    <svg className={className} fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
      <path strokeLinecap="round" strokeLinejoin="round" d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" />
    </svg>
  );
}

function XIcon({ className = "w-5 h-5" }: { className?: string }) {
  return (
    <svg className={className} fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
      <path strokeLinecap="round" strokeLinejoin="round" d="M6 18L18 6M6 6l12 12" />
    </svg>
  );
}

function AlertIcon({ className = "w-5 h-5" }: { className?: string }) {
  return (
    <svg className={className} fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
      <path strokeLinecap="round" strokeLinejoin="round" d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z" />
    </svg>
  );
}

function InvoiceIcon({ className = "w-4 h-4" }: { className?: string }) {
  return (
    <svg className={className} fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
      <path strokeLinecap="round" strokeLinejoin="round" d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
    </svg>
  );
}

function readUrlParams() {
  if (typeof window === 'undefined') {
    return { 
      driverId: null as string | null, 
      userId: null as string | null, 
      accesstoken: null as string | null, 
      userType: 'driver' as 'driver' | 'user',
      isDark: false,
      showHeader: false,
    };
  }
  const params = new URLSearchParams(window.location.search);
  const driverId = params.get('driver_id') || params.get('id_driver');
  const userId = params.get('user_id') || params.get('id_user');
  const userTypeParam = params.get('user_type') || (driverId ? 'driver' : 'user');
  const themeParam = params.get('theme');
  const isDark = themeParam === 'dark' || themeParam === '1' || themeParam === 'true';
  const showHeader = params.get('show_header') === 'true' || params.get('show_app_bar') === 'true';

  return {
    driverId,
    userId: userId || driverId,
    accesstoken: params.get('accesstoken'),
    userType: (userTypeParam === 'user' ? 'user' : 'driver') as 'driver' | 'user',
    isDark,
    showHeader,
  };
}

export default function WalletPage() {
  const [mounted, setMounted] = useState(false);
  const [params, setParams] = useState<{
    driverId: string | null;
    userId: string | null;
    accesstoken: string | null;
    userType: 'driver' | 'user';
    isDark: boolean;
    showHeader: boolean;
  }>({
    driverId: null,
    userId: null,
    accesstoken: null,
    userType: 'driver',
    isDark: false,
    showHeader: false,
  });

  useEffect(() => {
    setParams(readUrlParams());
    setMounted(true);
  }, []);

  const isDriver = params.userType === 'driver';
  const userId = isDriver ? params.driverId : params.userId;
  const accessToken = params.accesstoken;
  const isDark = params.isDark;
  const showHeader = params.showHeader;

  // Active Tab
  const [activeTab, setActiveTab] = useState<'overview' | 'history' | 'withdraw'>('overview');

  // Loading & Refreshing
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);

  // Data States
  const [walletAmount, setWalletAmount] = useState<number>(0);
  const [earnAmount, setEarnAmount] = useState<number>(0);
  const [totalEarn, setTotalEarn] = useState<string>('0');
  const [historyList, setHistoryList] = useState<any[]>([]);
  const [withdrawalsList, setWithdrawalsList] = useState<any[]>([]);
  const [bankDetails, setBankDetails] = useState<any>(null);

  // Filters
  const [historyFilterDays, setHistoryFilterDays] = useState<number>(30);
  const [showFilterDropdown, setShowFilterDropdown] = useState(false);

  // Selected Item Modals
  const [selectedTx, setSelectedTx] = useState<any>(null);
  const [showTopUpModal, setShowTopUpModal] = useState(false);
  const [showWithdrawModal, setShowWithdrawModal] = useState(false);
  const [showBankModal, setShowBankModal] = useState(false);

  // Form Inputs
  const [topUpAmount, setTopUpAmount] = useState('');
  const [selectedPayMethod, setSelectedPayMethod] = useState('RazorPay');
  
  const [withdrawAmount, setWithdrawAmount] = useState('');
  const [withdrawNote, setWithdrawNote] = useState('');
  const [withdrawSubmitting, setWithdrawSubmitting] = useState(false);

  const [bankName, setBankName] = useState('');
  const [branchName, setBranchName] = useState('');
  const [holderName, setHolderName] = useState('');
  const [accountNo, setAccountNo] = useState('');
  const [ifscCode, setIfscCode] = useState('');
  const [bankSubmitting, setBankSubmitting] = useState(false);

  const [toastMessage, setToastMessage] = useState<{ text: string; type: 'success' | 'error' } | null>(null);

  const showToast = (text: string, type: 'success' | 'error' = 'success') => {
    setToastMessage({ text, type });
    setTimeout(() => setToastMessage(null), 4000);
  };

  // Dispatch Action to Flutter Native App via AppBridge
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

  // API Call Headers
  const apiHeaders: Record<string, string> = {
    'Content-Type': 'application/json',
    'apikey': 'base64:nTfofcBByTDenJQYlsRbH0JjeVFW5lWsIIyXtq8/9sU=',
  };
  if (accessToken) {
    apiHeaders['accesstoken'] = accessToken;
  }

  // Fetch All Wallet Data from Real Backend APIs
  const fetchData = useCallback(async (isRef = false) => {
    if (!userId) {
      setLoading(false);
      setRefreshing(false);
      return;
    }

    if (isRef) setRefreshing(true);
    else setLoading(true);

    try {
      // 1. Fetch Wallet Balance & Earnings via show_wallet_amount endpoint
      const showWalletUrl = `/api/v1/show_wallet_amount/${isDriver ? 'driver' : 'smart-value'}`;
      const amtRes = await fetch(showWalletUrl, {
        method: 'POST',
        headers: apiHeaders,
        body: JSON.stringify({
          user_id: userId,
          id_user: userId,
          driver_id: userId,
          user_type: isDriver ? 'driver' : 'customer',
          ac_no: userId,
        }),
      });

      let amtFetched = false;
      if (amtRes.ok) {
        const amtData = await amtRes.json();
        if (amtData.data) {
          const wAmt = Number(amtData.data.amount || amtData.data.wallet_amount || 0);
          const eAmt = Number(amtData.data.earn_amount || amtData.data.earning || 0);
          const tAmt = String(amtData.data.total_earnings || amtData.data.total_earn || '0');
          setWalletAmount(wAmt);
          setEarnAmount(eAmt > 0 ? eAmt : Number(tAmt));
          setTotalEarn(tAmt !== '0' ? tAmt : String(eAmt));
          amtFetched = true;
        }
      }

      // Fallback: GET /api/v1/wallet
      if (!amtFetched) {
        const walletUrl = `/api/v1/wallet?id_user=${userId}&user_cat=${isDriver ? 'driver' : 'user'}`;
        const walletRes = await fetch(walletUrl, { headers: apiHeaders });
        if (walletRes.ok) {
          const wData = await walletRes.json();
          if (wData.success === 'success' && wData.data) {
            setWalletAmount(Number(wData.data.amount || 0));
            setEarnAmount(Number(wData.data.earn_amount || 0));
          }
        }
      }

      // 2. Fetch Transaction History
      const histUrl = `/api/v1/show_transaction_history/smart-value`;
      const histRes = await fetch(histUrl, {
        method: 'POST',
        headers: apiHeaders,
        body: JSON.stringify({
          ac_no: userId,
          user_id: userId,
          user_type: isDriver ? 'driver' : 'customer',
          days: historyFilterDays,
        }),
      });
      
      let fetchedHistory = false;
      if (histRes.ok) {
        const histData = await histRes.json();
        if (histData.res === 'success' && Array.isArray(histData.data)) {
          setHistoryList(histData.data);
          fetchedHistory = true;
        }
      }

      // Legacy Wallet History fallback
      if (!fetchedHistory) {
        const legacyUrl = isDriver 
          ? `/api/v1/wallet-history?id_diver=${userId}` 
          : `/api/v1/wallet-history?id_user=${userId}`;
        const legacyRes = await fetch(legacyUrl, { headers: apiHeaders });
        if (legacyRes.ok) {
          const legacyData = await legacyRes.json();
          if (legacyData.success === 'success' && Array.isArray(legacyData.data)) {
            setHistoryList(legacyData.data);
            if (legacyData.total_earnings) setTotalEarn(String(legacyData.total_earnings));
          }
        }
      }

      // 3. Driver Bank Details & Withdrawals List
      if (isDriver && userId) {
        const bankRes = await fetch(`/api/v1/bank-details?driver_id=${userId}`, { headers: apiHeaders });
        if (bankRes.ok) {
          const bankData = await bankRes.json();
          if (bankData.success === 'success' && bankData.data) {
            setBankDetails(bankData.data);
            setBankName(bankData.data.bank_name || '');
            setBranchName(bankData.data.branch_name || '');
            setHolderName(bankData.data.holder_name || '');
            setAccountNo(bankData.data.account_no || '');
            setIfscCode(bankData.data.other_info || bankData.data.ifsc_code || '');
          }
        }

        const withRes = await fetch(`/api/v1/withdrawals-list?driver_id=${userId}`, { headers: apiHeaders });
        if (withRes.ok) {
          const withData = await withRes.json();
          if (withData.success === 'success' && Array.isArray(withData.data)) {
            setWithdrawalsList(withData.data);
          }
        }
      }
    } catch (err) {
      console.error("Wallet fetchData error:", err);
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  }, [userId, isDriver, historyFilterDays]);

  useEffect(() => {
    if (mounted) {
      fetchData();
      if (typeof window !== 'undefined') {
        (window as any).refreshWalletData = () => fetchData(true);
      }
      const autoRefreshTimer = setInterval(() => {
        fetchData(true);
      }, 3000);

      const onFocus = () => fetchData(true);
      const onVisibilityChange = () => {
        if (document.visibilityState === 'visible') fetchData(true);
      };

      window.addEventListener('focus', onFocus);
      document.addEventListener('visibilitychange', onVisibilityChange);

      return () => {
        clearInterval(autoRefreshTimer);
        window.removeEventListener('focus', onFocus);
        document.removeEventListener('visibilitychange', onVisibilityChange);
      };
    }
  }, [mounted, fetchData]);

  if (!mounted) {
    return (
      <div className="min-h-screen bg-slate-950 flex flex-col items-center justify-center p-4">
        <div className="animate-pulse flex flex-col items-center gap-3">
          <div className="w-10 h-10 rounded-xl bg-slate-800" />
          <div className="h-4 w-32 bg-slate-800 rounded" />
        </div>
      </div>
    );
  }

  // Action Button Handlers
  const handleTopUpClick = () => {
    const handled = triggerNativeAction('topup');
    if (!handled) {
      setShowTopUpModal(true);
    }
  };

  const handleWithdrawClick = () => {
    const handled = triggerNativeAction('withdraw');
    if (!handled) {
      setShowWithdrawModal(true);
    }
  };

  const handleBankClick = () => {
    const handled = triggerNativeAction('bank');
    if (!handled) {
      setShowBankModal(true);
    }
  };

  const handleTransferClick = () => triggerNativeAction('transfer');
  const handlePayoutClick = () => triggerNativeAction('payout');
  const handleScanClick = () => triggerNativeAction('scan');
  const handleMyQrClick = () => triggerNativeAction('my_qr');
  const handleAccountDetailsClick = () => triggerNativeAction('account_details');
  const handleUpgradePlanClick = () => triggerNativeAction('upgrade_plan');

  // Handle Top-Up Submission in Web Modal
  const handleTopUpSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!topUpAmount || Number(topUpAmount) <= 0) {
      showToast("Please enter a valid amount", "error");
      return;
    }

    try {
      const res = await fetch('/api/v1/amount', {
        method: 'POST',
        headers: apiHeaders,
        body: JSON.stringify({
          id_user: userId,
          cat_user: isDriver ? 'driver' : 'user',
          amount: topUpAmount,
          transaction_id: `WEB_${Date.now()}`,
          paymethod: selectedPayMethod,
        }),
      });
      const data = await res.json();
      if (data.success === 'success' || data.success === 'Success') {
        showToast("Wallet Top-up Successful!");
        setShowTopUpModal(false);
        setTopUpAmount('');
        fetchData(true);
      } else {
        showToast(data.error || "Top-up failed. Please try again.", "error");
      }
    } catch (err) {
      showToast("Network error. Please try again.", "error");
    }
  };

  // Handle Withdrawal Submission in Web Modal
  const handleWithdrawSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!withdrawAmount || Number(withdrawAmount) <= 0) {
      showToast("Please enter a valid amount", "error");
      return;
    }
    if (!bankDetails || !bankDetails.account_no) {
      showToast("Please add bank details first", "error");
      return;
    }

    setWithdrawSubmitting(true);
    try {
      const res = await fetch('/api/v1/withdrawals', {
        method: 'POST',
        headers: apiHeaders,
        body: JSON.stringify({
          driver_id: userId,
          amount: withdrawAmount,
          note: withdrawNote,
        }),
      });
      const data = await res.json();
      if (data.success === 'success') {
        showToast("Withdrawal request submitted successfully!");
        setShowWithdrawModal(false);
        setWithdrawAmount('');
        setWithdrawNote('');
        fetchData(true);
      } else {
        showToast(data.error || "Withdrawal failed", "error");
      }
    } catch (err) {
      showToast("Network error", "error");
    } finally {
      setWithdrawSubmitting(false);
    }
  };

  // Handle Add/Edit Bank Submission in Web Modal
  const handleBankSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    const cleanBank = bankName.trim();
    const cleanAcc = accountNo.trim();
    const cleanIfsc = ifscCode.trim().toUpperCase();

    if (!cleanBank || !cleanAcc || !holderName) {
      showToast("Please fill all required bank fields", "error");
      return;
    }

    if (!/^[a-zA-Z\s]+$/.test(cleanBank)) {
      showToast("Bank name must contain only letters and spaces", "error");
      return;
    }
    if (!/^[0-9]{8,22}$/.test(cleanAcc)) {
      showToast("Account number must contain only numbers (9-18 digits)", "error");
      return;
    }
    if (!/^[A-Z0-9]{11}$/.test(cleanIfsc)) {
      showToast("IFSC code must be 11 alphanumeric characters (e.g. SBIN0001234)", "error");
      return;
    }

    setBankSubmitting(true);
    try {
      const res = await fetch('/api/v1/add-bank-details', {
        method: 'POST',
        headers: apiHeaders,
        body: JSON.stringify({
          driver_id: userId,
          bank_name: cleanBank,
          branch_name: branchName,
          holder_name: holderName,
          account_no: cleanAcc,
          other_info: cleanIfsc,
          ifsc_code: cleanIfsc,
        }),
      });
      const data = await res.json();
      if (data.success === 'success') {
        showToast("Bank details saved successfully!");
        setShowBankModal(false);
        fetchData(true);
      } else {
        showToast(data.error || "Failed to save bank details", "error");
      }
    } catch (err) {
      showToast("Network error", "error");
    } finally {
      setBankSubmitting(false);
    }
  };

  const formatCurrency = (val: number | string) => {
    const num = Number(val || 0);
    const sym = typeof window !== 'undefined' && (window as any).CURRENCY_SYMBOL !== undefined ? (window as any).CURRENCY_SYMBOL : '';
    return `${sym}${num.toLocaleString('en-IN', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`;
  };

  const handleDownloadInvoice = (tx: any) => {
    const txId = tx.id || tx.transaction_id || tx.txn_id || tx.ride_id || tx.booking_id || Date.now();
    const rideId = tx.ride_id || tx.id_ride || tx.booking_id || '';
    const amount = tx.parsedAmountStr || String(tx.amount || tx.transaction_amount || tx.montant || '0').replace('-', '');
    const title = encodeURIComponent(tx.parsedCategoryTitle || tx.category_title || tx.categoryTitle || tx.libelle || tx.description || 'Wallet Transaction');
    const user = encodeURIComponent(tx.parsedUserName || tx.counterparty_name || tx.user_name || tx.customer_name || 'Customer');
    const date = encodeURIComponent(tx.creer || tx.created_at || tx.formattedDate || new Date().toISOString());
    const method = encodeURIComponent(tx.payment_method || tx.paymentMethod || (tx.parsedIsNegative ? 'Smart Value Debit' : 'Smart Value Credit'));
    const isDebit = tx.parsedIsNegative ? '1' : '0';
    
    const invoiceUrl = `/invoice/${txId}/download?ride_id=${rideId}&amount=${amount}&title=${title}&user_name=${user}&date=${date}&payment_method=${method}&is_debit=${isDebit}`;
    window.location.href = invoiceUrl;
  };

  // Theme-dependent style classes with exact Flutter Green (#6AA720)
  const themeClasses = {
    bg: isDark ? 'bg-slate-950 text-slate-100' : 'bg-slate-50 text-slate-900',
    headerBg: isDark ? 'bg-slate-950 border-slate-800' : 'bg-white border-slate-200',
    navBg: isDark ? 'bg-slate-900 border-slate-800' : 'bg-slate-200/80 border-slate-300',
    cardBg: isDark ? 'bg-slate-900 border-slate-800' : 'bg-white border-slate-200/90 shadow-sm',
    textMuted: isDark ? 'text-slate-400' : 'text-slate-500',
    textMain: isDark ? 'text-slate-100' : 'text-slate-900',
    modalBg: isDark ? 'bg-slate-900 border-slate-800' : 'bg-white border-slate-200',
    inputBg: isDark ? 'bg-slate-950 border-slate-800 text-white' : 'bg-slate-100 border-slate-300 text-slate-900',
  };

  return (
    <div className={`min-h-screen ${themeClasses.bg} flex flex-col font-sans pb-10 transition-colors duration-200`}>
      {/* Toast Notification */}
      {toastMessage && (
        <div className={`fixed top-4 left-1/2 -translate-x-1/2 z-50 px-5 py-3 rounded-xl shadow-2xl flex items-center gap-3 text-sm font-semibold transition-all ${
          toastMessage.type === 'success' ? 'bg-[#6AA720] text-white' : 'bg-rose-500 text-white'
        }`}>
          {toastMessage.type === 'success' ? <CheckIcon className="w-5 h-5" /> : <AlertIcon className="w-5 h-5" />}
          <span>{toastMessage.text}</span>
        </div>
      )}

      {/* Optional Top Header */}
      {showHeader && (
        <header className={`px-4 pt-3.5 pb-2.5 flex items-center justify-between border-b ${themeClasses.headerBg}`}>
          <div className="flex items-center gap-2.5">
            <div className="w-8 h-8 rounded-lg bg-[#6AA720] flex items-center justify-center text-white shadow-md">
              <WalletIcon className="w-4 h-4" />
            </div>
            <h1 className={`text-lg font-bold tracking-tight ${themeClasses.textMain}`}>Smart Value</h1>
          </div>

          <button 
            onClick={() => fetchData(true)}
            disabled={refreshing}
            className={`p-2 rounded-xl border ${isDark ? 'bg-slate-900 border-slate-800 text-slate-300' : 'bg-slate-100 border-slate-300 text-slate-700'} hover:opacity-80 transition-colors`}
          >
            <RefreshIcon className={`w-4 h-4 ${refreshing ? 'animate-spin' : ''}`} />
          </button>
        </header>
      )}

      {/* Flutter Pill Tabs Navigation & Refresh Action */}
      <div className="px-4 pt-3 flex items-center gap-2">
        <div className={`${themeClasses.navBg} p-1 rounded-xl border flex-1 flex gap-1`}>
          <button
            onClick={() => setActiveTab('overview')}
            className={`flex-1 py-2 rounded-lg text-xs font-semibold transition-all text-center ${
              activeTab === 'overview'
                ? 'bg-[#6AA720] text-white shadow-md font-bold'
                : `${themeClasses.textMuted} hover:text-slate-800`
            }`}
          >
            Overview
          </button>
          <button
            onClick={() => setActiveTab('history')}
            className={`flex-1 py-2 rounded-lg text-xs font-semibold transition-all text-center ${
              activeTab === 'history'
                ? 'bg-[#6AA720] text-white shadow-md font-bold'
                : `${themeClasses.textMuted} hover:text-slate-800`
            }`}
          >
            History
          </button>
          {isDriver && (
            <button
              onClick={() => setActiveTab('withdraw')}
              className={`flex-1 py-2 rounded-lg text-xs font-semibold transition-all text-center ${
                activeTab === 'withdraw'
                  ? 'bg-[#6AA720] text-white shadow-md font-bold'
                  : `${themeClasses.textMuted} hover:text-slate-800`
              }`}
            >
              Withdraw
            </button>
          )}
        </div>

        {/* Circular Refresh Button */}
        <button
          onClick={() => {
            fetchData(true);
            showToast("Wallet Refreshed");
          }}
          disabled={refreshing}
          title="Refresh Wallet"
          className={`p-2.5 rounded-xl border ${
            isDark ? 'bg-slate-900 border-slate-800 text-slate-300 hover:bg-slate-800' : 'bg-white border-slate-300 text-slate-700 hover:bg-slate-100'
          } shadow-sm transition-all active:scale-95 shrink-0 flex items-center justify-center`}
        >
          <RefreshIcon className={`w-4 h-4 text-[#6AA720] ${refreshing ? 'animate-spin' : ''}`} />
        </button>
      </div>

      {/* Main Content Body */}
      <main className="flex-1 px-4 pt-4">
        {loading ? (
          <div className={`py-20 flex flex-col items-center justify-center gap-3 ${themeClasses.textMuted}`}>
            <RefreshIcon className="w-8 h-8 animate-spin text-[#6AA720]" />
            <p className="text-xs font-medium">Loading wallet data...</p>
          </div>
        ) : (
          <>
            {/* OVERVIEW TAB */}
            {activeTab === 'overview' && (
              <div className="space-y-4">
                {/* Balance Hero Card */}
                <div className="rounded-2xl bg-gradient-to-br from-[#6AA720] via-[#5B941B] to-[#4A7C15] p-5 text-white shadow-lg shadow-[#6AA720]/25 space-y-3">
                  <div className="flex items-center gap-3">
                    <div className="p-2.5 bg-white/20 rounded-xl">
                      <WalletIcon className="w-5 h-5 text-white" />
                    </div>
                    <span className="text-xs font-medium text-white/90">Smart Value Balance</span>
                  </div>

                  <div className="text-3xl font-extrabold text-white tracking-tight">
                    {formatCurrency(walletAmount)}
                  </div>

                  <div className="inline-block bg-white/15 px-3 py-1 rounded-full text-xs font-medium text-white/90">
                    Total Earnings: {formatCurrency(totalEarn)}
                  </div>
                </div>

                {/* Primary Action Buttons */}
                <div className="grid grid-cols-2 gap-3">
                  <button
                    onClick={handleTopUpClick}
                    className="py-3.5 px-4 bg-[#6AA720] hover:bg-[#5b921b] text-white font-bold text-xs uppercase tracking-wider rounded-xl shadow-md transition-all active:scale-[0.98]"
                  >
                    TOP UP
                  </button>

                  {isDriver ? (
                    <button
                      onClick={handleWithdrawClick}
                      className="py-3.5 px-4 bg-[#2C5282] hover:bg-[#2b4c77] text-white font-bold text-xs uppercase tracking-wider rounded-xl shadow-md transition-all active:scale-[0.98]"
                    >
                      WITHDRAW
                    </button>
                  ) : (
                    <button
                      onClick={handleTransferClick}
                      className={`py-3.5 px-4 ${isDark ? 'bg-slate-800 text-white border-slate-700' : 'bg-slate-800 text-white border-slate-800'} font-bold text-xs uppercase tracking-wider rounded-xl border shadow-md transition-all active:scale-[0.98]`}
                    >
                      TRANSFER
                    </button>
                  )}
                </div>

                {/* Account & Card Details Shortcut */}
                <div 
                  onClick={handleAccountDetailsClick}
                  className={`${themeClasses.cardBg} rounded-2xl p-3.5 flex items-center justify-between cursor-pointer hover:border-[#6AA720] transition-all`}
                >
                  <div className="flex items-center gap-3">
                    <div className="p-2.5 bg-[#6AA720]/10 text-[#6AA720] rounded-xl">
                      <CreditCardIcon className="w-5 h-5" />
                    </div>
                    <div>
                      <h4 className={`text-xs font-semibold ${themeClasses.textMain}`}>Account & Card Details</h4>
                      <p className={`text-[11px] ${themeClasses.textMuted}`}>View Smart Value card and bank account info</p>
                    </div>
                  </div>
                  <ChevronRightIcon className={`w-5 h-5 ${themeClasses.textMuted}`} />
                </div>

                {/* Quick Actions Grid */}
                <div className="space-y-2.5">
                  <h3 className={`text-sm font-semibold ${themeClasses.textMain}`}>Quick Actions</h3>
                  <div className="grid grid-cols-4 gap-2.5">
                    <button 
                      onClick={handleTransferClick}
                      className={`${themeClasses.cardBg} rounded-xl p-3 flex flex-col items-center justify-center gap-1.5 transition-colors hover:border-[#6AA720]`}
                    >
                      <SendIcon className="w-5 h-5 text-[#6AA720]" />
                      <span className={`text-[11px] font-medium ${themeClasses.textMain}`}>Transfer</span>
                    </button>

                    <button 
                      onClick={handlePayoutClick}
                      className={`${themeClasses.cardBg} rounded-xl p-3 flex flex-col items-center justify-center gap-1.5 transition-colors hover:border-[#6AA720]`}
                    >
                      <BuildingIcon className="w-5 h-5 text-[#6AA720]" />
                      <span className={`text-[11px] font-medium ${themeClasses.textMain}`}>Payout</span>
                    </button>

                    <button 
                      onClick={handleScanClick}
                      className={`${themeClasses.cardBg} rounded-xl p-3 flex flex-col items-center justify-center gap-1.5 transition-colors hover:border-[#6AA720]`}
                    >
                      <QrCodeIcon className="w-5 h-5 text-[#6AA720]" />
                      <span className={`text-[11px] font-medium ${themeClasses.textMain}`}>Scan</span>
                    </button>

                    <button 
                      onClick={handleMyQrClick}
                      className={`${themeClasses.cardBg} rounded-xl p-3 flex flex-col items-center justify-center gap-1.5 transition-colors hover:border-[#6AA720]`}
                    >
                      <QrCodeIcon className="w-5 h-5 text-[#6AA720]" />
                      <span className={`text-[11px] font-medium ${themeClasses.textMain}`}>My QR</span>
                    </button>
                  </div>
                </div>

                {/* Your Smart Value Section */}
                <div className="space-y-2.5">
                  <div className="flex items-center justify-between">
                    <h3 className={`text-sm font-semibold ${themeClasses.textMain}`}>Your Smart Value</h3>
                    <button 
                      onClick={handleUpgradePlanClick}
                      className="text-xs font-medium text-[#6AA720] hover:underline"
                    >
                      Upgrade Plan
                    </button>
                  </div>

                  <div className="grid grid-cols-2 gap-3">
                    <div className={`${themeClasses.cardBg} rounded-2xl p-4 space-y-1`}>
                      <div className="w-7 h-7 rounded-lg bg-[#6AA720]/10 text-[#6AA720] flex items-center justify-center mb-2">
                        <WalletIcon className="w-4 h-4" />
                      </div>
                      <span className={`text-[11px] ${themeClasses.textMuted}`}>Smart Value</span>
                      <p className={`text-sm font-bold ${themeClasses.textMain}`}>{formatCurrency(walletAmount)}</p>
                    </div>

                    <div className={`${themeClasses.cardBg} rounded-2xl p-4 space-y-1`}>
                      <div className="w-7 h-7 rounded-lg bg-[#6AA720]/10 text-[#6AA720] flex items-center justify-center mb-2">
                        <SparklesIcon className="w-4 h-4" />
                      </div>
                      <span className={`text-[11px] ${themeClasses.textMuted}`}>Cashback</span>
                      <p className={`text-sm font-bold ${themeClasses.textMain}`}>{formatCurrency(earnAmount)}</p>
                    </div>
                  </div>
                </div>

                {/* My Benefits Section */}
                <div className="space-y-2.5">
                  <h3 className={`text-sm font-semibold ${themeClasses.textMain}`}>My Benefits</h3>
                  <div className={`${themeClasses.cardBg} rounded-2xl p-4 space-y-3`}>
                    <div className="flex items-center justify-between border-b border-slate-200 dark:border-slate-800 pb-2.5">
                      <span className="text-xs font-bold text-[#6AA720] uppercase tracking-wider">
                        Standard Membership Benefits
                      </span>
                      <span className="text-[10px] font-semibold bg-[#6AA720]/10 text-[#6AA720] px-2 py-0.5 rounded-full border border-[#6AA720]/20">
                        Active
                      </span>
                    </div>

                    <div className="space-y-2">
                      {['Instant Ride Commission Cashbacks', 'Zero Transfer Fee to Smart Value Wallet', 'Priority Customer Support 24/7', 'Marketplace Product Listing Benefits'].map((b, i) => (
                        <div key={i} className={`flex items-center gap-2 text-xs ${themeClasses.textMain}`}>
                          <div className="w-4 h-4 rounded-full bg-[#6AA720]/15 text-[#6AA720] flex items-center justify-center shrink-0">
                            <CheckIcon className="w-3 h-3" />
                          </div>
                          <span>{b}</span>
                        </div>
                      ))}
                    </div>
                  </div>
                </div>
              </div>
            )}

            {/* HISTORY TAB */}
            {activeTab === 'history' && (
              <div className="space-y-4">
                {/* History Filter Bar */}
                <div className="flex items-center justify-between relative">
                  <h3 className={`text-sm font-semibold ${themeClasses.textMain}`}>Transactions</h3>
                  <div className="relative">
                    <button
                      onClick={() => setShowFilterDropdown(!showFilterDropdown)}
                      className={`px-3 py-1.5 border rounded-xl text-xs font-medium flex items-center gap-2 ${
                        isDark ? 'bg-slate-900 border-slate-800 text-slate-300' : 'bg-white border-slate-300 text-slate-700'
                      }`}
                    >
                      <FilterIcon className="w-3.5 h-3.5 text-[#6AA720]" />
                      <span>{historyFilterDays === 0 ? 'All Time' : `Last ${historyFilterDays} Days`}</span>
                      <ChevronDownIcon className="w-3.5 h-3.5 text-slate-400" />
                    </button>

                    {showFilterDropdown && (
                      <div className={`absolute right-0 mt-2 w-40 border rounded-xl shadow-2xl z-40 overflow-hidden py-1 ${themeClasses.modalBg}`}>
                        {[7, 30, 90, 0].map((d) => (
                          <button
                            key={d}
                            onClick={() => {
                              setHistoryFilterDays(d);
                              setShowFilterDropdown(false);
                            }}
                            className={`w-full text-left px-4 py-2 text-xs font-medium transition-colors ${
                              historyFilterDays === d ? 'bg-[#6AA720]/10 text-[#6AA720] font-bold' : `${themeClasses.textMain} hover:bg-slate-100 dark:hover:bg-slate-800`
                            }`}
                          >
                            {d === 0 ? 'All Time' : `Last ${d} Days`}
                          </button>
                        ))}
                      </div>
                    )}
                  </div>
                </div>

                {/* Transactions List */}
                {historyList.length === 0 ? (
                  <div className={`py-16 text-center ${themeClasses.textMuted}`}>
                    <ClockIcon className="w-10 h-10 mx-auto mb-3 text-slate-400" />
                    <p className={`text-sm font-semibold ${themeClasses.textMain}`}>No transactions found</p>
                    <p className="text-xs mt-1">Try changing the date filter above</p>
                  </div>
                ) : (
                  <div className="space-y-2.5">
                    {historyList.map((tx, idx) => {
                      const amountRaw = String(tx.amount || tx.transaction_amount || tx.montant || '0').replace('-', '');
                      const desc = (tx.description || tx.category_title || tx.categoryTitle || '').toLowerCase();
                      const deductionType = String(tx.deduction_type ?? '');
                      
                      const isNegative = deductionType === '0' || 
                                         deductionType === 'debit' ||
                                         tx.type === 'debit' || 
                                         String(tx.amount || '').includes('-') ||
                                         desc.includes('marketplace purchase') ||
                                         desc.includes('transferred to') ||
                                         desc.includes('debited') ||
                                         desc.includes('withdraw') ||
                                         desc.includes('purchased') ||
                                         desc.includes('subscription') ||
                                         desc.includes('admission') ||
                                         desc.includes('fee') ||
                                         desc.includes('deduct') ||
                                         desc.includes('paid to');

                      let categoryTitle = tx.category_title || tx.categoryTitle || tx.libelle;
                      if (!categoryTitle || categoryTitle === 'Wallet Transaction') {
                        if (desc.includes('medical card purchase')) categoryTitle = 'Medical Card Purchase';
                        else if (desc.includes('medical cashback')) categoryTitle = 'Medical Cashback Credited';
                        else if (desc.includes('marketplace purchase')) categoryTitle = 'Marketplace Purchase';
                        else if (desc.includes('marketplace sale')) categoryTitle = 'Marketplace Sale';
                        else categoryTitle = isNegative ? 'Money Transfer' : 'Money Received';
                      }
                      
                      // Extract User Name
                      let userName = tx.counterparty_name || tx.counterpartyName || tx.counterparty || tx.user_name || tx.customer_name || tx.name || '';
                      if (!userName || userName.toLowerCase() === 'customer' || userName === 'Fiinway User' || userName === 'Marketplace') {
                        if (desc.includes('marketplace purchase')) {
                          userName = tx.description ? tx.description.replace('Marketplace Purchase:', '').trim() : 'Marketplace Item';
                        } else if (desc.includes('marketplace sale')) {
                          userName = tx.description ? tx.description.replace('Marketplace Sale:', '').trim() : 'Marketplace Order';
                        } else if (desc.includes('from ')) {
                          userName = desc.split('from ')[1]?.split(' ')[0] || '';
                        } else if (desc.includes('to ')) {
                          userName = desc.split('to ')[1]?.split(' ')[0] || '';
                        }
                      }
                      if (!userName) {
                        userName = isDriver ? (isNegative ? 'Admin Panel' : 'Customer') : (isNegative ? 'Merchant / Recipient' : 'Sender User');
                      }

                      // Extract Business Name for Receipt Modal
                      const businessName = tx.business_name || tx.vendor_name || tx.store_name || tx.company || 'Fiinway Business';

                      return (
                        <div
                          key={tx.id || idx}
                          className={`${themeClasses.cardBg} rounded-2xl p-3.5 flex items-center justify-between transition-all border hover:border-[#6AA720]/40 shadow-sm`}
                        >
                          <div 
                            onClick={() => setSelectedTx({
                              ...tx,
                              parsedUserName: userName,
                              parsedBusinessName: businessName,
                              parsedCategoryTitle: categoryTitle,
                              parsedIsNegative: isNegative,
                              parsedAmountStr: amountRaw,
                            })}
                            className="flex items-center gap-3 flex-1 min-w-0 cursor-pointer active:scale-[0.99]"
                          >
                            <div className={`w-10 h-10 rounded-full flex items-center justify-center shrink-0 ${
                              isNegative ? 'bg-red-500/10 text-red-600' : 'bg-emerald-500/10 text-[#15803D]'
                            }`}>
                              {isNegative ? <ArrowUpRightIcon className="w-5 h-5 text-red-600" /> : <ArrowDownLeftIcon className="w-5 h-5 text-[#15803D]" />}
                            </div>
                            <div className="space-y-0.5 min-w-0 pr-1">
                              <h4 className={`text-xs font-bold ${themeClasses.textMain} truncate`}>
                                {categoryTitle}
                              </h4>
                              <p className={`text-[11px] ${themeClasses.textMuted}`}>
                                {tx.creer || tx.created_at || tx.formattedDate || 'Recently'}
                              </p>
                            </div>
                          </div>

                          <div className="flex items-center gap-3 shrink-0">
                            <div 
                              onClick={() => setSelectedTx({
                                ...tx,
                                parsedUserName: userName,
                                parsedBusinessName: businessName,
                                parsedCategoryTitle: categoryTitle,
                                parsedIsNegative: isNegative,
                                parsedAmountStr: amountRaw,
                              })}
                              className="text-right cursor-pointer"
                            >
                              <p className={`text-sm font-extrabold ${isNegative ? 'text-red-600' : 'text-[#15803D]'}`}>
                                {isNegative ? '-' : '+'}{formatCurrency(amountRaw)}
                              </p>
                            </div>

                            {/* INVOICE DOWNLOAD BUTTON */}
                            <button
                              type="button"
                              onClick={(e) => {
                                e.stopPropagation();
                                handleDownloadInvoice({
                                  ...tx,
                                  parsedUserName: userName,
                                  parsedBusinessName: businessName,
                                  parsedCategoryTitle: categoryTitle,
                                  parsedIsNegative: isNegative,
                                  parsedAmountStr: amountRaw,
                                });
                              }}
                              title="Invoice PDF"
                              className={`w-8 h-8 rounded-xl border flex items-center justify-center transition-all ${
                                isDark 
                                  ? 'bg-slate-800/90 border-slate-700 text-[#88c437] hover:bg-[#6AA720]/20 hover:border-[#6AA720]' 
                                  : 'bg-[#6AA720]/10 border-[#6AA720]/30 text-[#6AA720] hover:bg-[#6AA720] hover:text-white'
                              } shadow-sm active:scale-95`}
                            >
                              <InvoiceIcon className="w-4 h-4" />
                            </button>
                          </div>
                        </div>
                      );
                    })}
                  </div>
                )}
              </div>
            )}

            {/* WITHDRAWALS TAB (Driver Only) */}
            {activeTab === 'withdraw' && isDriver && (
              <div className="space-y-4">
                <div className="flex items-center justify-between">
                  <h3 className={`text-sm font-semibold ${themeClasses.textMain}`}>Withdrawal Requests</h3>
                  <button
                    onClick={handleWithdrawClick}
                    className="px-3 py-1.5 bg-[#6AA720] text-white text-xs font-bold rounded-xl shadow hover:bg-[#5b921b]"
                  >
                    + New Request
                  </button>
                </div>

                {withdrawalsList.length === 0 ? (
                  <div className={`py-16 text-center ${themeClasses.textMuted}`}>
                    <BuildingIcon className="w-10 h-10 mx-auto mb-3 text-slate-400" />
                    <p className={`text-sm font-semibold ${themeClasses.textMain}`}>No withdrawal requests</p>
                    <p className="text-xs mt-1">Click New Request to withdraw your earnings</p>
                  </div>
                ) : (
                  <div className="space-y-2.5">
                    {withdrawalsList.map((item, idx) => {
                      const status = (item.statut || item.status || 'pending').toLowerCase();
                      let statusBadge = <span className="px-2.5 py-1 rounded-full text-[10px] font-bold bg-amber-500/10 text-amber-500 border border-amber-500/20">Pending</span>;
                      if (status === 'success' || status === 'approved') {
                        statusBadge = <span className="px-2.5 py-1 rounded-full text-[10px] font-bold bg-[#6AA720]/10 text-[#6AA720] border border-[#6AA720]/20">Approved</span>;
                      } else if (status === 'rejected' || status === 'failed') {
                        statusBadge = <span className="px-2.5 py-1 rounded-full text-[10px] font-bold bg-rose-500/10 text-rose-500 border border-rose-500/20">Rejected</span>;
                      }

                      return (
                        <div key={item.id || idx} className={`${themeClasses.cardBg} rounded-2xl p-4 space-y-2`}>
                          <div className="flex items-center justify-between">
                            <span className={`text-sm font-extrabold ${themeClasses.textMain}`}>{formatCurrency(item.amount)}</span>
                            {statusBadge}
                          </div>
                          <div className={`text-xs ${themeClasses.textMuted} flex items-center justify-between pt-1 border-t border-slate-200 dark:border-slate-800`}>
                            <span>{item.created_at || item.creer || 'Request'}</span>
                            <span className={`font-medium ${themeClasses.textMain}`}>{item.note || 'Payout'}</span>
                          </div>
                        </div>
                      );
                    })}
                  </div>
                )}
              </div>
            )}
          </>
        )}
      </main>

      {/* FALLBACK WEB MODAL: TOP UP */}
      {showTopUpModal && (
        <div className="fixed inset-0 z-50 bg-slate-950/60 backdrop-blur-sm flex items-end sm:items-center justify-center p-0 sm:p-4">
          <div className={`w-full max-w-lg ${themeClasses.modalBg} border rounded-t-3xl sm:rounded-3xl p-6 space-y-5 shadow-2xl`}>
            <div className="flex items-center justify-between">
              <h3 className={`text-base font-bold ${themeClasses.textMain}`}>Top Up Wallet</h3>
              <button onClick={() => setShowTopUpModal(false)} className={themeClasses.textMuted}>
                <XIcon className="w-5 h-5" />
              </button>
            </div>

            <form onSubmit={handleTopUpSubmit} className="space-y-4">
              <div>
                <label className={`block text-xs font-semibold ${themeClasses.textMuted} mb-1.5`}>Enter Amount (₹)</label>
                <input
                  type="number"
                  placeholder="e.g. 500"
                  value={topUpAmount}
                  onChange={(e) => setTopUpAmount(e.target.value)}
                  className={`w-full ${themeClasses.inputBg} border rounded-xl px-4 py-3 text-lg font-bold focus:outline-none focus:border-[#6AA720]`}
                />
              </div>

              <div>
                <label className={`block text-xs font-semibold ${themeClasses.textMuted} mb-1.5`}>Payment Method</label>
                <div className="grid grid-cols-2 gap-2">
                  {['RazorPay', 'Stripe', 'PayPal', 'PayStack'].map((pm) => (
                    <button
                      key={pm}
                      type="button"
                      onClick={() => setSelectedPayMethod(pm)}
                      className={`p-3 rounded-xl border text-xs font-bold transition-all text-center ${
                        selectedPayMethod === pm 
                          ? 'bg-[#6AA720]/10 border-[#6AA720] text-[#6AA720]' 
                          : `${themeClasses.inputBg} hover:border-slate-400`
                      }`}
                    >
                      {pm}
                    </button>
                  ))}
                </div>
              </div>

              <button
                type="submit"
                className="w-full py-3.5 bg-[#6AA720] hover:bg-[#5b921b] text-white font-bold text-xs uppercase tracking-wider rounded-xl shadow-lg transition-all"
              >
                Proceed to Payment
              </button>
            </form>
          </div>
        </div>
      )}

      {/* FALLBACK WEB MODAL: WITHDRAW */}
      {showWithdrawModal && isDriver && (
        <div className="fixed inset-0 z-50 bg-slate-950/60 backdrop-blur-sm flex items-end sm:items-center justify-center p-0 sm:p-4">
          <div className={`w-full max-w-lg ${themeClasses.modalBg} border rounded-t-3xl sm:rounded-3xl p-6 space-y-5 shadow-2xl`}>
            <div className="flex items-center justify-between">
              <h3 className={`text-base font-bold ${themeClasses.textMain}`}>Withdraw Funds</h3>
              <button onClick={() => setShowWithdrawModal(false)} className={themeClasses.textMuted}>
                <XIcon className="w-5 h-5" />
              </button>
            </div>

            <form onSubmit={handleWithdrawSubmit} className="space-y-4">
              <div>
                <label className={`block text-xs font-semibold ${themeClasses.textMuted} mb-1.5`}>Withdrawal Amount</label>
                <input
                  type="number"
                  placeholder="Enter amount"
                  value={withdrawAmount}
                  onChange={(e) => setWithdrawAmount(e.target.value)}
                  className={`w-full ${themeClasses.inputBg} border rounded-xl px-4 py-3 text-lg font-bold focus:outline-none focus:border-[#6AA720]`}
                />
              </div>

              <div>
                <label className={`block text-xs font-semibold ${themeClasses.textMuted} mb-1.5`}>Note / Reference (Optional)</label>
                <input
                  type="text"
                  placeholder="e.g. Weekly Payout"
                  value={withdrawNote}
                  onChange={(e) => setWithdrawNote(e.target.value)}
                  className={`w-full ${themeClasses.inputBg} border rounded-xl px-4 py-3 text-xs focus:outline-none focus:border-[#6AA720]`}
                />
              </div>

              <div className={`p-3.5 ${themeClasses.inputBg} border rounded-xl text-xs space-y-1`}>
                <span className={themeClasses.textMuted}>Receiving Bank Account:</span>
                <p className={`font-bold ${themeClasses.textMain}`}>
                  {bankDetails?.bank_name ? `${bankDetails.bank_name} (${bankDetails.account_no})` : 'No Bank Linked!'}
                </p>
              </div>

              <button
                type="submit"
                disabled={withdrawSubmitting}
                className="w-full py-3.5 bg-[#6AA720] hover:bg-[#5b921b] text-white font-bold text-xs uppercase tracking-wider rounded-xl shadow-lg transition-all disabled:opacity-50"
              >
                {withdrawSubmitting ? 'Submitting...' : 'Submit Request'}
              </button>
            </form>
          </div>
        </div>
      )}

      {/* FALLBACK WEB MODAL: BANK DETAILS */}
      {showBankModal && isDriver && (
        <div className="fixed inset-0 z-50 bg-slate-950/60 backdrop-blur-sm flex items-end sm:items-center justify-center p-0 sm:p-4">
          <div className={`w-full max-w-lg ${themeClasses.modalBg} border rounded-t-3xl sm:rounded-3xl p-6 space-y-5 shadow-2xl`}>
            <div className="flex items-center justify-between">
              <h3 className={`text-base font-bold ${themeClasses.textMain}`}>Bank Details</h3>
              <button onClick={() => setShowBankModal(false)} className={themeClasses.textMuted}>
                <XIcon className="w-5 h-5" />
              </button>
            </div>

            <form onSubmit={handleBankSubmit} className="space-y-3">
              <input
                type="text"
                placeholder="Bank Name (Words only)"
                value={bankName}
                onChange={(e) => setBankName(e.target.value.replace(/[^a-zA-Z\s]/g, ''))}
                className={`w-full ${themeClasses.inputBg} border rounded-xl px-4 py-2.5 text-xs focus:outline-none focus:border-[#6AA720]`}
              />
              <input
                type="text"
                placeholder="Branch Name"
                value={branchName}
                onChange={(e) => setBranchName(e.target.value)}
                className={`w-full ${themeClasses.inputBg} border rounded-xl px-4 py-2.5 text-xs focus:outline-none focus:border-[#6AA720]`}
              />
              <input
                type="text"
                placeholder="Account Holder Name"
                value={holderName}
                onChange={(e) => setHolderName(e.target.value.replace(/[^a-zA-Z\s]/g, ''))}
                className={`w-full ${themeClasses.inputBg} border rounded-xl px-4 py-2.5 text-xs focus:outline-none focus:border-[#6AA720]`}
              />
              <input
                type="text"
                inputMode="numeric"
                pattern="[0-9]*"
                placeholder="Account Number (Numbers only)"
                value={accountNo}
                onChange={(e) => setAccountNo(e.target.value.replace(/[^0-9]/g, ''))}
                className={`w-full ${themeClasses.inputBg} border rounded-xl px-4 py-2.5 text-xs focus:outline-none focus:border-[#6AA720] font-mono`}
              />
              <input
                type="text"
                maxLength={11}
                placeholder="IFSC Code (11 characters e.g. SBIN0001234)"
                value={ifscCode}
                onChange={(e) => setIfscCode(e.target.value.toUpperCase().replace(/[^A-Z0-9]/g, '').slice(0, 11))}
                className={`w-full ${themeClasses.inputBg} border rounded-xl px-4 py-2.5 text-xs focus:outline-none focus:border-[#6AA720] font-mono uppercase`}
              />

              <button
                type="submit"
                disabled={bankSubmitting}
                className="w-full py-3 bg-[#6AA720] hover:bg-[#5b921b] text-[#ffffff] font-bold text-xs uppercase tracking-wider rounded-xl shadow-lg transition-all mt-2 disabled:opacity-50"
              >
                {bankSubmitting ? 'Saving...' : 'Save Bank Details'}
              </button>
            </form>
          </div>
        </div>
      )}

      {/* TRANSACTION RECEIPT MODAL */}
      {selectedTx && (
        <div className="fixed inset-0 z-50 bg-slate-950/60 backdrop-blur-sm flex items-center justify-center p-4">
          <div className={`w-full max-w-sm ${themeClasses.modalBg} border rounded-3xl p-6 space-y-4 shadow-2xl animate-in fade-in zoom-in duration-150`}>
            <div className="flex items-center justify-between border-b border-slate-200 dark:border-slate-800 pb-3">
              <div className="flex items-center gap-2">
                <div className={`w-6 h-6 rounded-lg flex items-center justify-center ${
                  selectedTx.parsedIsNegative ? 'bg-red-500/10 text-red-600' : 'bg-emerald-600/15 text-[#15803D]'
                }`}>
                  {selectedTx.parsedIsNegative ? <ArrowUpRightIcon className="w-3.5 h-3.5 text-red-600" /> : <ArrowDownLeftIcon className="w-3.5 h-3.5 text-[#15803D]" />}
                </div>
                <h3 className={`text-sm font-bold ${themeClasses.textMain}`}>Transaction Receipt</h3>
              </div>
              <button onClick={() => setSelectedTx(null)} className={themeClasses.textMuted}>
                <XIcon className="w-5 h-5" />
              </button>
            </div>

            <div className="text-center py-2.5 bg-slate-50 dark:bg-slate-950/50 rounded-2xl p-3 border border-slate-200/60 dark:border-slate-800">
              <span className={`text-[11px] ${themeClasses.textMuted} font-semibold uppercase tracking-wider`}>
                {selectedTx.parsedIsNegative ? 'Deducted From Smart Value' : 'Credited To Smart Value'}
              </span>
              <h2 className={`text-2xl font-black mt-1 ${selectedTx.parsedIsNegative ? 'text-red-600' : 'text-[#15803D]'}`}>
                {selectedTx.parsedIsNegative ? '-' : '+'}{formatCurrency(selectedTx.parsedAmountStr || selectedTx.amount || '0')}
              </h2>
            </div>

            <div className="space-y-2 text-xs">
              <div className="flex justify-between py-1.5 border-b border-slate-200 dark:border-slate-800">
                <span className={themeClasses.textMuted}>{selectedTx.parsedIsNegative ? 'To' : 'From'}</span>
                <span className={`font-bold ${themeClasses.textMain}`}>{selectedTx.parsedUserName || selectedTx.counterparty || 'User'}</span>
              </div>
            
              <div className="flex justify-between py-1.5 border-b border-slate-200 dark:border-slate-800">
                <span className={themeClasses.textMuted}>Category / Service</span>
                <span className={`font-semibold ${themeClasses.textMain}`}>{selectedTx.parsedCategoryTitle || selectedTx.category_title || 'Wallet'}</span>
              </div>
             
              <div className="flex justify-between py-1.5 border-b border-slate-200 dark:border-slate-800">
                <span className={themeClasses.textMuted}>Payment Method</span>
                <span className={`font-semibold ${themeClasses.textMain}`}>{selectedTx.payment_method || selectedTx.paymentMethod || 'Smart Value Wallet'}</span>
              </div>
              <div className="flex justify-between py-1.5 border-b border-slate-200 dark:border-slate-800">
                <span className={themeClasses.textMuted}>Status</span>
                <span className="font-bold text-[#15803D] uppercase bg-emerald-500/10 px-2 py-0.5 rounded-full border border-emerald-500/20">
                  {selectedTx.payment_status || 'Success'}
                </span>
              </div>
              <div className="flex justify-between py-1.5 border-b border-slate-200 dark:border-slate-800">
                <span className={themeClasses.textMuted}>Txn ID</span>
                <span className="font-mono text-[11px] text-slate-600 dark:text-slate-400">
                  {(() => {
                    const raw = String(selectedTx.id || selectedTx.txn_id || selectedTx.transaction_id || '');
                    if (!raw) return '0000001';
                    if (!isNaN(Number(raw))) return raw.padStart(7, '0');
                    return raw;
                  })()}
                </span>
              </div>
              <div className="flex justify-between py-1.5">
                <span className={themeClasses.textMuted}>Date & Time</span>
                <span className={`font-semibold ${themeClasses.textMain}`}>{selectedTx.creer || selectedTx.created_at || 'N/A'}</span>
              </div>
            </div>

            <div className="flex items-center gap-2 pt-1">
              <button
                type="button"
                onClick={() => handleDownloadInvoice(selectedTx)}
                className="flex-1 py-3 bg-[#6AA720] hover:bg-[#5b921b] text-white text-xs font-bold rounded-xl shadow-md transition-all flex items-center justify-center gap-2 uppercase tracking-wider"
              >
                <InvoiceIcon className="w-4 h-4" />
                <span>Invoice PDF</span>
              </button>
              <button
                type="button"
                onClick={() => setSelectedTx(null)}
                className="px-4 py-3 bg-slate-200 dark:bg-slate-800 hover:bg-slate-300 dark:hover:bg-slate-700 text-slate-800 dark:text-slate-200 text-xs font-bold rounded-xl transition-colors uppercase tracking-wider"
              >
                Close
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
