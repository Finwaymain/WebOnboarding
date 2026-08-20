"use client";

import { useSearchParams } from "next/navigation";
import { Suspense, useEffect, useRef, useState } from "react";
import {
  CreditCard,
  CheckCircle2,
  Shield,
  Upload,
  ArrowLeft,
  ChevronRight,
  FileText,
  Clock,
  Wallet,
  Sparkles,
  Award,
  Info,
  Check,
  Star,
  Building2,
  Calendar,
  Lock,
  QrCode,
  FileCheck,
  UserCheck
} from "lucide-react";

type FlowStep = 'select_plan' | 'book_plan' | 'my_card' | 'file_claim' | 'claim_submitted' | 'cashback_collected' | 'profile';

interface Plan {
  id: string;
  title: string;
  badge?: string;
  claimLimit: string;
  price: number;
  period?: string;
  benefits: string[];
  gradient: string;
  buttonBg: string;
}

// Default plan shape — will be replaced by live API data
const DEFAULT_PLANS: Plan[] = [];


function MedicalCashbackContent() {
  const [token, setToken] = useState<string | null>(null);
  const [driverId, setDriverId] = useState<string | null>(null);
  const [userId, setUserId] = useState<string | null>(null);

  // Plans loaded from API
  const [plans, setPlans] = useState<Plan[]>(DEFAULT_PLANS);
  const [plansLoading, setPlansLoading] = useState(true);

  // Flow step navigation: select_plan -> book_plan -> my_card -> file_claim -> claim_submitted -> cashback_collected
  const [step, setStep] = useState<FlowStep>('select_plan');
  const [selectedPlan, setSelectedPlan] = useState<Plan | null>(null);

  // Step 2 Form
  const [aadhaarNumber, setAadhaarNumber] = useState('');
  const [paymentMethod, setPaymentMethod] = useState<'wallet' | 'upi' | 'card' | 'netbanking'>('wallet');
  const [isProcessingPayment, setIsProcessingPayment] = useState(false);

  // Wallet M-PIN Popup State
  const [showMPinModal, setShowMPinModal] = useState(false);
  const [mPin, setMPin] = useState('');
  const [mPinError, setMPinError] = useState('');

  // Step 4 Claim Form
  const [prescriptionFile, setPrescriptionFile] = useState<string | null>(null);
  const [diagnosticFile, setDiagnosticFile] = useState<string | null>(null);
  const [cashMemoFile, setCashMemoFile] = useState<string | null>(null);
  const [claimAmount, setClaimAmount] = useState('');
  const [isSubmittingClaim, setIsSubmittingClaim] = useState(false);

  const [userProfile, setUserProfile] = useState<{
    id: string;
    name: string;
    phone: string;
    wallet_balance: number;
    user_type: string;
  } | null>(null);
  const [activeCardData, setActiveCardData] = useState<any>(null);
  const [userClaims, setUserClaims] = useState<any[]>([]);
  const [totalMedicalExpenses, setTotalMedicalExpenses] = useState<number>(0);

  // File refs for real file picker
  const prescriptionInputRef = useRef<HTMLInputElement>(null);
  const diagnosticInputRef = useRef<HTMLInputElement>(null);
  const cashMemoInputRef = useRef<HTMLInputElement>(null);
  const [prescriptionFileObj, setPrescriptionFileObj] = useState<File | null>(null);
  const [diagnosticFileObj, setDiagnosticFileObj] = useState<File | null>(null);
  const [cashMemoFileObj, setCashMemoFileObj] = useState<File | null>(null);

  // Custom UI Alert Modal State
  const [alertState, setAlertState] = useState<{
    isOpen: boolean;
    title: string;
    message: string;
    type: 'error' | 'warning' | 'info' | 'success';
    buttonText?: string;
    onConfirm?: () => void;
  }>({
    isOpen: false,
    title: '',
    message: '',
    type: 'warning'
  });

  const showAlert = (
    message: string,
    type: 'error' | 'warning' | 'info' | 'success' = 'warning',
    title?: string,
    onConfirm?: () => void
  ) => {
    setAlertState({
      isOpen: true,
      title: title || (type === 'error' ? 'Notice' : type === 'success' ? 'Success' : type === 'warning' ? 'Attention Required' : 'Information'),
      message,
      type,
      onConfirm
    });
  };

  const closeAlert = () => {
    const callback = alertState.onConfirm;
    setAlertState(prev => ({ ...prev, isOpen: false }));
    if (callback) callback();
  };

  const [razorpayKey, setRazorpayKey] = useState<string>('');

  useEffect(() => {
    if (typeof window !== 'undefined') {
      const params = new URLSearchParams(window.location.search);
      const accToken = params.get("accesstoken");
      const dId = params.get("driver_id");
      const uId = params.get("user_id");
      setToken(accToken);
      setDriverId(dId);
      setUserId(uId);

      const initialStep = params.get("step") as FlowStep;
      if (initialStep && ['select_plan', 'book_plan', 'my_card', 'file_claim', 'claim_submitted', 'cashback_collected', 'profile'].includes(initialStep)) {
        if (initialStep === 'file_claim' && (!data.data?.card || data.data?.card.status !== 'active')) {
          showAlert('Without purchasing a Medical Cashback Card you cannot file a claim. Please select a plan first.', 'warning', 'Card Required', () => {
            setStep('select_plan');
          });
        } else {
          setStep(initialStep);
        }
      }

      fetchUserData(accToken, uId, dId);
      fetchPlans();
      fetchPaymentSettings();
    }
  }, []);

  const fetchPaymentSettings = async () => {
    try {
      const res = await fetch('https://api.fiinway.com/api/v1/medical-cashback/payment-settings', {
        headers: { 'apikey': 'base64:nTfofcBByTDenJQYlsRbH0JjeVFW5lWsIIyXtq8/9sU=' }
      });
      const data = await res.json();
      if (data.success === 'Success' && data.data?.razorpay?.key) {
        setRazorpayKey(data.data.razorpay.key);
      }
    } catch (e) {
      console.error('Failed to fetch payment settings:', e);
    }
  };

  const fetchPlans = async () => {
    setPlansLoading(true);
    try {
      const res = await fetch('https://api.fiinway.com/api/v1/medical-cashback/plans', {
        headers: { 'apikey': 'base64:nTfofcBByTDenJQYlsRbH0JjeVFW5lWsIIyXtq8/9sU=' }
      });
      const data = await res.json();
      if (data.success === 'Success' && Array.isArray(data.data)) {
        const gradients = [
          'from-[#0F172A] via-[#1E3A8A] to-[#0F172A]',
          'from-[#1E3A8A] via-[#2563EB] to-[#1D4ED8]',
          'from-[#064E3B] via-[#047857] to-[#065F46]'
        ];
        const mapped: Plan[] = data.data.map((p: any, i: number) => ({
          id: p.id || p.title?.toLowerCase().replace(/\s+/g, '_'),
          title: p.title,
          badge: p.badge || (i === 0 ? '\u2605 Most Popular' : undefined),
          claimLimit: `\u20b9${Number(p.claim_limit).toLocaleString('en-IN')} / ${p.period || 'Year'}`,
          price: Number(p.price),
          period: p.period,
          benefits: Array.isArray(p.benefits) ? p.benefits : [],
          gradient: gradients[i % gradients.length],
          buttonBg: 'bg-indigo-600 hover:bg-indigo-700'
        }));
        setPlans(mapped);
        setSelectedPlan(mapped[0]);
      }
    } catch (e) {
      console.error('Failed to fetch plans:', e);
    } finally {
      setPlansLoading(false);
    }
  };

  const fetchUserData = async (t?: string | null, u?: string | null, d?: string | null) => {
    try {
      const queryParams = new URLSearchParams();
      if (t) queryParams.set('accesstoken', t);
      if (u) queryParams.set('user_id', u);
      if (d) queryParams.set('driver_id', d);

      const res = await fetch(`https://api.fiinway.com/api/v1/medical-cashback/my-card?${queryParams.toString()}`, {
        headers: {
          'apikey': 'base64:nTfofcBByTDenJQYlsRbH0JjeVFW5lWsIIyXtq8/9sU='
        }
      });
      const data = await res.json();
      if (data.success === 'Success' && data.data) {
        if (data.data.user_profile) {
          setUserProfile(data.data.user_profile);
        }
        if (data.data.card) {
          setActiveCardData(data.data.card);
        }
        if (data.data.claims) {
          setUserClaims(data.data.claims);
        }
        if (data.data.total_tracked_expenses !== undefined) {
          const totalExp = parseFloat(data.data.total_tracked_expenses) || 0;
          setTotalMedicalExpenses(totalExp);
          // Pre-fill claim amount with total tracked expenses if not already set
          if (totalExp > 0) {
            setClaimAmount(String(totalExp));
          }
        }
      }
    } catch (e) {
      console.error('Failed to fetch user profile:', e);
    }
  };

  const handleSelectPlan = (plan: Plan) => {
    setSelectedPlan(plan);
    setStep('book_plan');
    window.scrollTo({ top: 0, behavior: 'smooth' });
  };

  const handleNavigateToClaim = () => {
    if (!activeCardData || activeCardData.status !== 'active') {
      showAlert('Without purchasing a Medical Cashback Card you cannot file a claim. Please select a plan first.', 'warning', 'Card Required', () => {
        setStep('select_plan');
        window.scrollTo({ top: 0, behavior: 'smooth' });
      });
      return;
    }

    const claimsSubmitted = userClaims.filter((c: any) => ['under_review', 'pending', 'approved', 'need_reupload'].includes(c.status)).length;
    const maxClaims = parseInt(activeCardData.max_claims || 1, 10);

    if (maxClaims > 0 && (claimsSubmitted >= maxClaims || parseInt(activeCardData.claims_count || 0, 10) >= maxClaims || activeCardData.status === 'exhausted')) {
      showAlert(`You have reached the maximum allowed claims (${claimsSubmitted}/${maxClaims}) for your current card plan. Please purchase a new card plan to continue.`, 'warning', 'Max Claims Reached', () => {
        setStep('select_plan');
        window.scrollTo({ top: 0, behavior: 'smooth' });
      });
      return;
    }

    setStep('file_claim');
    window.scrollTo({ top: 0, behavior: 'smooth' });
  };

  const handlePayment = () => {
    const cleanAadhaar = aadhaarNumber.replace(/\s+/g, '');
    if (!cleanAadhaar || !/^\d{12}$/.test(cleanAadhaar)) {
      showAlert('Please enter a valid 12-digit Aadhaar Number (numeric digits 0-9 only).', 'error', 'Invalid Aadhaar');
      return;
    }
    if (paymentMethod === 'wallet') {
      setMPin('');
      setMPinError('');
      setShowMPinModal(true);
      return;
    }

    // Razorpay / Online Payment Checkout Handler
    if (typeof window !== 'undefined') {
      const triggerRazorpayCheckout = () => {
        const keyToUse = razorpayKey || 'rzp_test_demo_key_id';
        const options: any = {
          key: keyToUse,
          amount: Math.round(selectedPlan.price * 100),
          currency: 'INR',
          name: 'Fiinway Healthcare',
          description: `Medical Cashback Card Purchase — ${selectedPlan.title}`,
          prefill: {
            name: userProfile?.name || '',
            contact: userProfile?.phone || ''
          },
          theme: {
            color: '#1E3A8A'
          },
          handler: function (response: any) {
            executePurchaseCardApi(undefined, response.razorpay_payment_id);
          }
        };
        try {
          const rzp = new (window as any).Razorpay(options);
          rzp.open();
        } catch (e) {
          executePurchaseCardApi();
        }
      };

      if ((window as any).Razorpay) {
        triggerRazorpayCheckout();
      } else {
        const script = document.createElement('script');
        script.src = 'https://checkout.razorpay.com/v1/checkout.js';
        script.onload = () => triggerRazorpayCheckout();
        script.onerror = () => executePurchaseCardApi();
        document.body.appendChild(script);
      }
    } else {
      executePurchaseCardApi();
    }
  };

  const [submittedClaimId, setSubmittedClaimId] = useState('CLM12567890');

  const executePurchaseCardApi = async (enteredPin?: string, razorpayPaymentId?: string) => {
    if (paymentMethod === 'wallet') {
      const pinToValidate = (enteredPin !== undefined ? enteredPin : mPin).trim();
      if (!pinToValidate || !/^\d{4}$/.test(pinToValidate)) {
        setMPinError('M-PIN must be exactly 4 digits');
        return;
      }
    }
    setIsProcessingPayment(true);
    setMPinError('');
    try {
      const res = await fetch('https://api.fiinway.com/api/v1/medical-cashback/purchase-card', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'apikey': 'base64:nTfofcBByTDenJQYlsRbH0JjeVFW5lWsIIyXtq8/9sU=',
          'accesstoken': token || ''
        },
        body: JSON.stringify({
          user_id: userId,
          driver_id: driverId,
          card_type: selectedPlan.title,
          price: selectedPlan.price,
          aadhaar_number: aadhaarNumber.replace(/\s+/g, ''),
          payment_method: paymentMethod,
          m_pin: enteredPin || mPin,
          razorpay_payment_id: razorpayPaymentId || ''
        })
      });
      const data = await res.json();
      if (data.success === 'Success') {
        setShowMPinModal(false);
        setStep('my_card');
        window.scrollTo({ top: 0, behavior: 'smooth' });
        fetchUserData(token, userId, driverId);
        showAlert('Your Healthcare Cashback Card has been activated successfully!', 'success', 'Card Activated 🎉');
      } else {
        if (showMPinModal) {
          setMPinError(data.error || 'Incorrect M-PIN or payment failed.');
        } else {
          showAlert(data.error || 'Failed to process card purchase', 'error', 'Payment Failed');
        }
      }
    } catch (err) {
      console.error(err);
      setShowMPinModal(false);
      setStep('my_card');
    } finally {
      setIsProcessingPayment(false);
    }
  };

  const handleSubmitClaim = async () => {
    if (!activeCardData || activeCardData.status !== 'active') {
      showAlert('Without purchasing a Medical Cashback Card you cannot file a claim. Please select a plan first.', 'warning', 'Card Required', () => {
        setStep('select_plan');
      });
      return;
    }
    if (!claimAmount || parseFloat(claimAmount) <= 0) {
      showAlert('Please enter a valid cashback expense amount.', 'warning', 'Invalid Amount');
      return;
    }
    setIsSubmittingClaim(true);
    try {
      // Use FormData for multipart so files actually upload
      const formData = new FormData();
      if (userId) formData.append('user_id', userId);
      if (driverId) formData.append('driver_id', driverId);
      formData.append('amount', claimAmount);
      if (prescriptionFileObj) formData.append('prescription', prescriptionFileObj);
      if (diagnosticFileObj) formData.append('diagnostic', diagnosticFileObj);
      if (cashMemoFileObj) formData.append('cash_memo', cashMemoFileObj);

      const res = await fetch('https://api.fiinway.com/api/v1/medical-cashback/submit-claim', {
        method: 'POST',
        headers: {
          'apikey': 'base64:nTfofcBByTDenJQYlsRbH0JjeVFW5lWsIIyXtq8/9sU=',
          'accesstoken': token || ''
          // NOTE: Do NOT set Content-Type when using FormData — browser sets it with boundary
        },
        body: formData
      });
      const data = await res.json();
      if (data.success === 'Success' && data.claim_id) {
        setSubmittedClaimId(data.claim_id);
        setStep('claim_submitted');
        window.scrollTo({ top: 0, behavior: 'smooth' });
        fetchUserData(token, userId, driverId);
      } else {
        showAlert(data.error || 'Failed to submit claim. Please verify documents and try again.', 'error', 'Claim Submission Failed');
      }
    } catch (err: any) {
      console.error(err);
      showAlert(err?.message || 'Failed to submit claim. Please check your connection and try again.', 'error', 'Connection Error');
    } finally {
      setIsSubmittingClaim(false);
    }
  };

  return (
    <div className="min-h-screen bg-[#F8FAFC] flex flex-col font-sans pb-24 text-slate-900 selection:bg-indigo-100">
      
      {/* ========================================================================= */}
      {/* SCREEN 1: SELECT MEDICAL PLAN */}
      {/* ========================================================================= */}
      {step === 'select_plan' && (
        <div className="max-w-md mx-auto w-full px-4 pt-4 animate-in fade-in slide-in-from-right-4 duration-300">
          
          {/* Header */}
          <div className="flex items-center justify-between py-2 mb-3">
            <div className="flex items-center gap-3">
              <button 
                onClick={() => {
                  if (typeof window !== 'undefined' && window.history.length > 1) {
                    window.history.back();
                  }
                }} 
                className="p-2 rounded-xl bg-white border border-slate-200 text-slate-700 shadow-2xs hover:bg-slate-50"
              >
                <ArrowLeft className="w-4 h-4" />
              </button>
              <div>
                <h1 className="text-base font-extrabold text-slate-900 leading-tight">Select Medical Plan</h1>
                <p className="text-[11px] text-slate-500 font-semibold">Choose card limit & healthcare benefit</p>
              </div>
            </div>
            <div className="flex items-center gap-2">
            
              {activeCardData && (
                <button 
                  onClick={() => setStep('my_card')} 
                  className="text-[11px] font-bold text-[#1E3A8A] bg-blue-50 border border-blue-200 px-2.5 py-1 rounded-full hover:bg-blue-100 transition-all flex items-center gap-1"
                >
                  <CreditCard className="w-3.5 h-3.5" /> My Card
                </button>
              )}
            </div>
          </div>

          {/* Cards List — live from API */}
          <div className="space-y-4 mb-6">
            {plansLoading ? (
              <div className="text-center py-12">
                <div className="w-8 h-8 border-4 border-blue-600 border-t-transparent rounded-full animate-spin mx-auto mb-3"></div>
                <p className="text-xs font-bold text-slate-400">Loading plans...</p>
              </div>
            ) : plans.length === 0 ? (
              <div className="text-center py-12 text-slate-400 text-xs font-bold">No plans available</div>
            ) : (
              plans.map((plan) => (
              <div 
                key={plan.id}
                className="bg-white rounded-3xl border border-slate-200 shadow-md overflow-hidden transition-all hover:shadow-lg relative group"
              >
                {/* Most Popular Badge */}
                {plan.badge && (
                  <div className="absolute top-3 right-3 bg-blue-600 text-white text-[10px] font-black px-2.5 py-0.5 rounded-full shadow-2xs z-10 flex items-center gap-1">
                    <Star className="w-3 h-3 fill-amber-300 text-amber-300" /> {plan.badge}
                  </div>
                )}

                {/* Card Header Gradient */}
                <div className={`bg-gradient-to-br ${plan.gradient} p-5 text-white relative`}>
                  <div className="flex items-center gap-2 mb-2">
                    <CreditCard className="w-5 h-5 opacity-90" />
                    <h2 className="text-sm font-black tracking-wider uppercase">{plan.title}</h2>
                  </div>
                  <div className="flex items-baseline justify-between pt-1">
                    <div>
                      <p className="text-[10px] text-slate-300 font-semibold uppercase tracking-wide">Claim Up To</p>
                      <p className="text-xl font-black tracking-tight text-white">{plan.claimLimit}</p>
                    </div>
                    <div className="bg-white/20 backdrop-blur-md px-3.5 py-1.5 rounded-2xl border border-white/30 text-right">
                      <span className="text-lg font-black text-white">₹{plan.price}</span>
                    </div>
                  </div>
                </div>

                {/* Benefits List */}
                <div className="p-4 bg-white space-y-2">
                  <p className="text-[11px] font-bold text-slate-700 uppercase tracking-wider">Key Benefits</p>
                  <ul className="space-y-1.5">
                    {plan.benefits.map((b, idx) => (
                      <li key={idx} className="flex items-start gap-2 text-xs text-slate-600 font-medium">
                        <Check className="w-3.5 h-3.5 text-emerald-600 mt-0.5 shrink-0" />
                        <span>{b}</span>
                      </li>
                    ))}
                  </ul>

                  <button
                    onClick={() => handleSelectPlan(plan)}
                    className="w-full mt-3 bg-white hover:bg-slate-50 text-[#1E3A8A] font-extrabold text-xs py-2.5 rounded-xl border border-blue-200 transition-all flex items-center justify-center gap-1.5 shadow-2xs"
                  >
                    Plan Details <ChevronRight className="w-3.5 h-3.5" />
                  </button>
                </div>
              </div>
              ))
            )}
          </div>

          
         
        </div>
      )}

      {/* ========================================================================= */}
      {/* SCREEN 2: ENTER AADHAAR & PAYMENT */}
      {/* ========================================================================= */}
      {step === 'book_plan' && selectedPlan && (
        <div className="max-w-md mx-auto w-full px-4 pt-4 animate-in fade-in slide-in-from-right-4 duration-300">
          
          {/* Header */}
          <div className="flex items-center gap-3 py-2 mb-3">
            <button 
              onClick={() => setStep('select_plan')} 
              className="p-2 rounded-xl bg-white border border-slate-200 text-slate-700 shadow-2xs hover:bg-slate-50"
            >
              <ArrowLeft className="w-4 h-4" />
            </button>
            <div>
              <h1 className="text-base font-extrabold text-slate-900 leading-tight">Book Your Plan</h1>
              <p className="text-[11px] text-slate-500 font-medium">Just a few steps to activate your card</p>
            </div>
          </div>

          {/* Stepper Progress */}
          <div className="flex items-center justify-center gap-3 mb-5">
            <div className="flex items-center gap-1.5">
              <span className="w-6 h-6 rounded-full bg-blue-600 text-white text-xs font-bold flex items-center justify-center">1</span>
            </div>
            <div className="w-16 h-1 bg-blue-600 rounded-full"></div>
            <div className="flex items-center gap-1.5">
              <span className="w-6 h-6 rounded-full bg-blue-600 text-white text-xs font-bold flex items-center justify-center">2</span>
            </div>
          </div>

          {/* Enter Aadhaar Number Box — strictly numeric input only */}
          <div className="bg-white p-4 rounded-2xl border border-slate-200 shadow-2xs space-y-3 mb-4">
            <label className="text-xs font-extrabold text-slate-900 block">Enter Aadhaar Number</label>
            <p className="text-[11px] text-slate-500 font-medium">Please enter your 12-digit numeric Aadhaar number to continue</p>
            
            <div className="relative">
              <div className="absolute left-3.5 top-3 text-amber-600">
                <FileText className="w-5 h-5" />
              </div>
              <input
                type="tel"
                inputMode="numeric"
                pattern="[0-9]*"
                maxLength={12}
                value={aadhaarNumber}
                onChange={(e) => {
                  const numericOnly = e.target.value.replace(/[^0-9]/g, '');
                  setAadhaarNumber(numericOnly);
                }}
                placeholder="12-Digit Aadhaar Number"
                className="w-full bg-slate-50 border border-slate-200 rounded-xl pl-11 pr-10 py-2.5 text-sm font-extrabold text-slate-900 tracking-wider focus:outline-none focus:ring-2 focus:ring-blue-600"
              />
              <CheckCircle2 className={`w-4 h-4 absolute right-3.5 top-3.5 ${aadhaarNumber.length === 12 ? 'text-emerald-600' : 'text-slate-300'}`} />
            </div>

            <div className="flex items-center justify-center gap-1.5 text-[11px] text-slate-500 font-semibold pt-1">
              <Shield className="w-3.5 h-3.5 text-emerald-600" />
              <span>Your details are 100% secure with us</span>
            </div>
          </div>

          {/* Order Summary Box */}
          <div className="bg-white p-4 rounded-2xl border border-slate-200 shadow-2xs space-y-2.5 mb-4">
            <h3 className="text-xs font-extrabold text-slate-900 border-b border-slate-100 pb-2">Order Summary</h3>
            <div className="flex justify-between text-xs font-semibold">
              <span className="text-slate-500">Selected Plan</span>
              <span className="text-slate-900 font-extrabold">{selectedPlan.title}</span>
            </div>
            <div className="flex justify-between text-xs font-semibold">
              <span className="text-slate-500">Card Limit</span>
              <span className="text-slate-900 font-extrabold">{selectedPlan.claimLimit}</span>
            </div>
            <div className="flex justify-between text-xs font-semibold pt-1 border-t border-slate-100">
              <span className="text-slate-600">Price</span>
              <span className="text-sm font-black text-blue-700">₹{selectedPlan.price}</span>
            </div>
          </div>

          {/* Payment Details Radio Box */}
          <div className="bg-white p-4 rounded-2xl border border-slate-200 shadow-2xs space-y-3 mb-6">
            <h3 className="text-xs font-extrabold text-slate-900 border-b border-slate-100 pb-2">Payment Details</h3>

            {/* Fiinway Wallet Balance Option */}
            <label className={`flex items-center justify-between p-3 rounded-xl border transition-all cursor-pointer ${paymentMethod === 'wallet' ? 'bg-emerald-50/70 border-emerald-600' : 'bg-white border-slate-200'}`}>
              <div className="flex items-center gap-2.5">
                <input
                  type="radio"
                  name="payment"
                  checked={paymentMethod === 'wallet'}
                  onChange={() => setPaymentMethod('wallet')}
                  className="w-4 h-4 accent-emerald-600"
                />
                <div>
                  <span className="text-xs font-extrabold text-slate-900 block">Fiinway Wallet Balance</span>
                  <span className="text-[10px] text-slate-500 font-semibold">Requires 4-digit M-PIN authorization</span>
                </div>
              </div>
              <span className="text-[10px] font-extrabold text-emerald-700 bg-emerald-100 px-2 py-0.5 rounded-md">Instant</span>
            </label>

            {/* Razorpay Online Payment Option */}
            <label className={`flex items-center justify-between p-3.5 rounded-xl border transition-all cursor-pointer ${paymentMethod === 'razorpay' || paymentMethod === 'upi' || paymentMethod === 'card' || paymentMethod === 'netbanking' ? 'bg-blue-50/70 border-blue-600' : 'bg-white border-slate-200'}`}>
              <div className="flex items-center gap-2.5">
                <input
                  type="radio"
                  name="payment"
                  checked={paymentMethod === 'razorpay' || paymentMethod === 'upi' || paymentMethod === 'card' || paymentMethod === 'netbanking'}
                  onChange={() => setPaymentMethod('razorpay')}
                  className="w-4 h-4 accent-blue-600"
                />
                <div>
                  <span className="text-xs font-black text-slate-900 block flex items-center gap-1.5">
                    Razorpay Online Pay
                  </span>
                  <span className="text-[10px] text-slate-500 font-semibold">UPI, GPay, PhonePe, Paytm, Cards & NetBanking</span>
                </div>
              </div>
              <span className="text-[10px] font-black text-blue-700 bg-blue-100 px-2.5 py-0.5 rounded-md border border-blue-200">Razorpay</span>
            </label>
          </div>

          {/* Action Button */}
          <button
            onClick={handlePayment}
            disabled={isProcessingPayment}
            className="w-full bg-[#1E3A8A] hover:bg-[#1e293b] text-white font-extrabold text-sm py-3.5 rounded-2xl shadow-lg transition-all flex items-center justify-center gap-2 disabled:opacity-50"
          >
            {isProcessingPayment ? (
              <span>Activating Card...</span>
            ) : (
              <>
                <span>Proceed to Pay ₹{selectedPlan.price}</span>
              </>
            )}
          </button>
          
          <div className="flex items-center justify-center gap-1 text-[11px] text-slate-400 font-semibold mt-3">
            <Lock className="w-3.5 h-3.5" />
            <span>Secure Payment</span>
          </div>
        </div>
      )}

      {/* ========================================================================= */}
      {/* SCREEN 3: PLAN BENEFITS & USAGE / MY MEDICAL CARD */}
      {/* ========================================================================= */}
      {step === 'my_card' && (
        <div className="max-w-md mx-auto w-full px-4 pt-4 animate-in fade-in slide-in-from-right-4 duration-300">
          
          {/* Header */}
          <div className="flex items-center justify-between py-2 mb-3">
            <div className="flex items-center gap-3">
              <button 
                onClick={() => setStep('select_plan')} 
                className="p-2 rounded-xl bg-white border border-slate-200 text-slate-700 shadow-2xs hover:bg-slate-50"
              >
                <ArrowLeft className="w-4 h-4" />
              </button>
              <div>
                <h1 className="text-base font-extrabold text-slate-900 leading-tight">My Medical Card</h1>
              </div>
            </div>

            <button 
              onClick={() => setStep('profile')}
              className="text-xs font-extrabold text-blue-700 bg-blue-50 px-3 py-1.5 rounded-xl border border-blue-200 hover:bg-blue-100 flex items-center gap-1"
            >
              👤 Profile
            </button>
          </div>

          {/* Digital Card Preview Container */}
          {activeCardData ? (
            <div className="bg-gradient-to-br from-[#0F172A] via-[#1E3A8A] to-[#0F172A] rounded-3xl p-5 text-white shadow-xl relative overflow-hidden mb-4 border border-blue-900">
              <div className="flex items-center justify-between mb-4">
                <span className="text-xs font-black tracking-widest uppercase text-slate-300">FIINWAY HEALTH</span>
                <span className="text-xs font-black bg-white/20 backdrop-blur-md px-2.5 py-1 rounded-full text-white">{activeCardData.card_type}</span>
              </div>

              <div className="space-y-1 mb-6">
                <p className="text-[10px] text-slate-300 font-semibold uppercase tracking-wide">Card Limit</p>
                <p className="text-xl font-black text-white tracking-tight">₹{parseFloat(activeCardData.claim_limit).toLocaleString('en-IN')}</p>
              </div>

              <div className="flex items-end justify-between pt-2">
                <div>
                  <p className="text-[9px] text-slate-400 font-bold uppercase tracking-wider">Card Holder</p>
                  <p className="text-sm font-bold text-white">{userProfile?.name || 'Member'}</p>
                </div>
                <div className="w-9 h-7 rounded-md bg-gradient-to-tr from-amber-300 to-amber-500 border border-amber-200 opacity-90 shadow-2xs"></div>
              </div>

              <div className="mt-4 pt-3 border-t border-white/10 flex items-center justify-between text-[11px] font-bold">
                <div className="flex items-center gap-1.5 text-emerald-400">
                  <CheckCircle2 className="w-3.5 h-3.5" />
                  <span>Card {activeCardData.status === 'active' ? 'Active' : activeCardData.status}</span>
                </div>
                <span className="text-slate-300">Valid Till {new Date(activeCardData.expires_at).toLocaleDateString('en-IN', { day: '2-digit', month: 'short', year: 'numeric' })}</span>
              </div>
            </div>
          ) : (
            <div className="bg-slate-100 rounded-3xl p-8 text-center mb-4 border border-slate-200">
              <CreditCard className="w-10 h-10 text-slate-400 mx-auto mb-2" />
              <p className="text-sm font-extrabold text-slate-600">No Active Card</p>
              <p className="text-xs text-slate-400 font-medium mt-1">Purchase a plan to get started</p>
              <button onClick={() => setStep('select_plan')} className="mt-3 text-xs font-bold text-blue-700 underline">Browse Plans</button>
            </div>
          )}

          {/* Buttons: Plan Benefits / Plan Details */}
          <div className="grid grid-cols-2 gap-2.5 mb-5">
            <button className="bg-white hover:bg-slate-50 text-slate-800 font-extrabold text-xs py-2.5 rounded-xl border border-slate-200 shadow-2xs flex items-center justify-center gap-1.5">
              <Award className="w-4 h-4 text-blue-600" /> Plan Benefits
            </button>
            <button className="bg-white hover:bg-slate-50 text-slate-800 font-extrabold text-xs py-2.5 rounded-xl border border-slate-200 shadow-2xs flex items-center justify-center gap-1.5">
              <Info className="w-4 h-4 text-blue-600" /> Plan Details
            </button>
          </div>

          {/* Usage Summary Section - Live Data */}
          {activeCardData && (() => {
            const totalLimit = parseFloat(activeCardData.claim_limit) || 0;
            const used = parseFloat(activeCardData.used_amount) || 0;
            const remaining = parseFloat(activeCardData.remaining_amount) || totalLimit;
            const usedPct = totalLimit > 0 ? Math.round((used / totalLimit) * 100) : 0;
            const remainPct = 100 - usedPct;
            return (
              <div className="bg-white p-4 rounded-2xl border border-slate-200 shadow-2xs space-y-3 mb-4">
                <div className="flex items-center justify-between">
                  <h3 className="text-xs font-extrabold text-slate-900">Usage Summary</h3>
                  <span className="text-[11px] font-bold text-blue-700">{activeCardData.claims_count}/{activeCardData.max_claims} Claims Used</span>
                </div>

                <div className="grid grid-cols-3 gap-2">
                  <div className="bg-blue-50 p-2.5 rounded-xl border border-blue-100 text-center">
                    <p className="text-[10px] font-bold text-blue-700">Total Limit</p>
                    <p className="text-xs font-black text-blue-900 mt-0.5">₹{totalLimit.toLocaleString('en-IN')}</p>
                  </div>
                  <div className="bg-emerald-50 p-2.5 rounded-xl border border-emerald-100 text-center">
                    <p className="text-[10px] font-bold text-emerald-700">Used</p>
                    <p className="text-xs font-black text-emerald-900 mt-0.5">₹{used.toLocaleString('en-IN')}</p>
                  </div>
                  <div className="bg-amber-50 p-2.5 rounded-xl border border-amber-100 text-center">
                    <p className="text-[10px] font-bold text-amber-700">Remaining</p>
                    <p className="text-xs font-black text-amber-900 mt-0.5">₹{remaining.toLocaleString('en-IN')}</p>
                  </div>
                </div>

                <div className="space-y-1 pt-1">
                  <div className="h-2 w-full bg-slate-100 rounded-full overflow-hidden flex">
                    <div className="h-full bg-emerald-500 transition-all" style={{ width: `${usedPct}%` }}></div>
                    <div className="h-full bg-amber-400 transition-all" style={{ width: `${remainPct}%` }}></div>
                  </div>
                  <div className="flex justify-between text-[10px] font-bold text-slate-500">
                    <span>{usedPct}% Used</span>
                    <span>{remainPct}% Remaining</span>
                  </div>
                </div>
              </div>
            );
          })()}

          {/* Live Claims History Section — Full detailed card breakdown */}
          <div className="bg-white p-4 rounded-2xl border border-slate-200 shadow-2xs space-y-3 mb-5">
            <div className="flex items-center justify-between border-b border-slate-100 pb-2.5">
              <div>
                <h3 className="text-xs font-extrabold text-slate-900">My Claims History</h3>
                <p className="text-[10px] text-slate-400 font-semibold">Track review & payout status</p>
              </div>
              <span className="text-xs font-extrabold text-blue-700 bg-blue-50 px-2.5 py-0.5 rounded-full border border-blue-200">
                {userClaims.length} Claims
              </span>
            </div>

            {userClaims.length === 0 ? (
              <div className="text-center py-6">
                <FileText className="w-9 h-9 text-slate-300 mx-auto mb-2" />
                <p className="text-xs font-bold text-slate-500">No claims submitted yet</p>
                <p className="text-[10px] text-slate-400 font-medium mt-0.5">Submit your medical bills to earn cashback</p>
              </div>
            ) : (
              <div className="space-y-3">
                {userClaims.map((claim: any) => {
                  const claimDate = claim.creer ? new Date(claim.creer).toLocaleString('en-IN', { day: '2-digit', month: 'short', year: 'numeric', hour: '2-digit', minute: '2-digit' }) : '—';
                  return (
                    <div key={claim.id} className="p-3 rounded-2xl bg-slate-50 border border-slate-200 space-y-2">
                      <div className="flex items-center justify-between">
                        <div className="flex items-center gap-2">
                          <div className={`w-7 h-7 rounded-lg flex items-center justify-center text-xs ${
                            claim.status === 'approved' ? 'bg-emerald-100 text-emerald-700' :
                            claim.status === 'rejected' ? 'bg-red-100 text-red-700' :
                            claim.status === 'need_reupload' ? 'bg-blue-100 text-blue-700' :
                            'bg-amber-100 text-amber-700'
                          }`}>🏥</div>
                          <span className="text-xs font-black text-slate-900">{claim.claim_id}</span>
                        </div>
                        <span className={`text-[10px] font-black px-2.5 py-0.5 rounded-full uppercase tracking-wider ${
                          claim.status === 'approved' ? 'text-emerald-700 bg-emerald-100 border border-emerald-200' :
                          claim.status === 'rejected' ? 'text-red-700 bg-red-100 border border-red-200' :
                          claim.status === 'need_reupload' ? 'text-blue-700 bg-blue-100 border border-blue-200' :
                          'text-amber-700 bg-amber-100 border border-amber-200'
                        }`}>
                          {claim.status === 'approved' ? 'Approved' :
                           claim.status === 'rejected' ? 'Rejected' :
                           claim.status === 'need_reupload' ? 'Need Reupload' :
                           'Under Review'}
                        </span>
                      </div>

                      <div className="grid grid-cols-2 gap-2 text-xs pt-1 border-t border-slate-200/60">
                        <div>
                          <span className="text-[10px] text-slate-400 font-bold block">Expense Amount</span>
                          <span className="font-extrabold text-slate-800">₹{parseFloat(claim.expense_amount).toLocaleString('en-IN')}</span>
                        </div>
                        <div>
                          <span className="text-[10px] text-slate-400 font-bold block">Card Type</span>
                          <span className="font-bold text-slate-800">{claim.card_type}</span>
                        </div>
                        {claim.status === 'approved' && (
                          <div>
                            <span className="text-[10px] text-emerald-600 font-bold block">Cashback Credited</span>
                            <span className="font-black text-emerald-700">₹{parseFloat(claim.approved_amount || claim.expense_amount).toLocaleString('en-IN')}</span>
                          </div>
                        )}
                        <div>
                          <span className="text-[10px] text-slate-400 font-bold block">Submitted On</span>
                          <span className="font-semibold text-slate-600 text-[10px]">{claimDate}</span>
                        </div>
                      </div>

                      {/* Rejection Reason Banner */}
                      {claim.status === 'rejected' && (
                        <div className="bg-red-50 p-2.5 rounded-xl border border-red-200 text-[11px] text-red-900 font-semibold space-y-0.5 mt-1">
                          <span className="font-black text-red-700 block">✖ Claim Rejected:</span>
                          <p className="text-[11px] text-red-800">{claim.rejection_reason || claim.approval_reason || 'Verification failed for uploaded medical documents.'}</p>
                        </div>
                      )}

                      {/* Reupload Request Banner */}
                      {claim.status === 'need_reupload' && (
                        <div className="bg-blue-50 p-2.5 rounded-xl border border-blue-200 text-[11px] text-blue-900 font-semibold flex items-center justify-between mt-1">
                          <div>
                            <span className="font-black text-blue-700 block">ℹ Reupload Required:</span>
                            <p className="text-[10px] text-blue-800">{claim.reupload_reason || 'Please reupload clear medical bills.'}</p>
                          </div>
                          <button 
                            onClick={() => setStep('file_claim')}
                            className="text-[10px] font-black text-white bg-blue-600 hover:bg-blue-700 px-3 py-1.5 rounded-lg shrink-0 shadow-xs"
                          >
                            Reupload
                          </button>
                        </div>
                      )}
                    </div>
                  );
                })}
              </div>
            )}
          </div>

          {/* Bottom Action CTA: File a Claim — Placed directly below My Claims */}
          <button
            onClick={handleNavigateToClaim}
            className="w-full bg-[#1E3A8A] hover:bg-[#1e293b] text-white font-extrabold text-sm py-3.5 rounded-2xl shadow-lg transition-all flex items-center justify-center gap-2 mb-4"
          >
            <FileText className="w-4 h-4" /> File a Claim for Cashback
          </button>
        </div>
      )}

      {/* ========================================================================= */}
      {/* SCREEN 4: FILE A CLAIM */}
      {/* ========================================================================= */}
      {step === 'file_claim' && (
        <div className="max-w-md mx-auto w-full px-4 pt-4 animate-in fade-in slide-in-from-right-4 duration-300">
          
          {/* Header */}
          <div className="flex items-center justify-between py-2 mb-3">
            <div className="flex items-center gap-3">
              <button 
                onClick={() => setStep('my_card')} 
                className="p-2 rounded-xl bg-white border border-slate-200 text-slate-700 shadow-2xs hover:bg-slate-50"
              >
                <ArrowLeft className="w-4 h-4" />
              </button>
              <div>
                <h1 className="text-base font-extrabold text-slate-900 leading-tight">Claim Cashback</h1>
              </div>
            </div>

            <span className="text-[10px] font-bold text-emerald-700 bg-emerald-50 border border-emerald-200 px-2.5 py-1 rounded-full flex items-center gap-1">
              <CheckCircle2 className="w-3 h-3" /> 100% Secure
            </span>
          </div>

          {/* Stepper Steps */}
          <div className="grid grid-cols-4 gap-1 text-center text-[9px] font-bold text-slate-600 mb-5">
            <div className="space-y-1">
              <span className="w-5 h-5 mx-auto rounded-full bg-blue-600 text-white flex items-center justify-center text-[10px]">1</span>
              <span>Prescription</span>
            </div>
            <div className="space-y-1">
              <span className="w-5 h-5 mx-auto rounded-full bg-blue-600 text-white flex items-center justify-center text-[10px]">2</span>
              <span>Diagnostic</span>
            </div>
            <div className="space-y-1">
              <span className="w-5 h-5 mx-auto rounded-full bg-blue-600 text-white flex items-center justify-center text-[10px]">3</span>
              <span>Cash Memo</span>
            </div>
            <div className="space-y-1">
              <span className="w-5 h-5 mx-auto rounded-full bg-blue-600 text-white flex items-center justify-center text-[10px]">4</span>
              <span>Amount</span>
            </div>
          </div>

          {/* Step 1: Upload Prescription */}
          <div className="bg-white p-4 rounded-2xl border border-slate-200 shadow-2xs space-y-3 mb-3">
            <div className="flex items-center gap-2">
              <span className="w-5 h-5 rounded-full bg-blue-600 text-white text-xs font-bold flex items-center justify-center shrink-0">1</span>
              <div>
                <h3 className="text-xs font-extrabold text-slate-900">Upload Prescription</h3>
                <p className="text-[10px] text-slate-500 font-medium">Upload clear prescription image</p>
              </div>
            </div>

            {/* Hidden real file input for prescription */}
            <input
              ref={prescriptionInputRef}
              type="file"
              accept="image/*,application/pdf"
              className="hidden"
              onChange={(e) => {
                const f = e.target.files?.[0];
                if (f) { setPrescriptionFileObj(f); setPrescriptionFile(f.name); }
              }}
            />
            <div
              className="border-2 border-dashed border-slate-200 rounded-xl p-4 text-center bg-slate-50 hover:bg-blue-50/50 transition-all cursor-pointer"
              onClick={() => prescriptionInputRef.current?.click()}
            >
              <Upload className="w-5 h-5 text-blue-600 mx-auto mb-1" />
              <span className="text-xs font-bold text-blue-700">Tap to Upload Prescription</span>
              <p className="text-[10px] text-slate-400 mt-0.5">JPG, PNG or PDF</p>
            </div>

            {prescriptionFile && (
              <div className="flex items-center justify-between bg-emerald-50/80 p-2.5 rounded-xl border border-emerald-200 text-xs font-bold text-slate-800">
                <div className="flex items-center gap-2">
                  <FileText className="w-4 h-4 text-emerald-600" />
                  <span>{prescriptionFile}</span>
                </div>
                <CheckCircle2 className="w-4 h-4 text-emerald-600" />
              </div>
            )}
          </div>

          {/* Step 2: Upload Diagnostic Document */}
          <div className="bg-white p-4 rounded-2xl border border-slate-200 shadow-2xs space-y-3 mb-3">
            <div className="flex items-center gap-2">
              <span className="w-5 h-5 rounded-full bg-blue-600 text-white text-xs font-bold flex items-center justify-center shrink-0">2</span>
              <div>
                <h3 className="text-xs font-extrabold text-slate-900">Upload Diagnostic Document</h3>
                <p className="text-[10px] text-slate-500 font-medium">Upload diagnostic/lab report (if any)</p>
              </div>
            </div>

            {/* Hidden real file input for diagnostic */}
            <input
              ref={diagnosticInputRef}
              type="file"
              accept="image/*,application/pdf"
              className="hidden"
              onChange={(e) => {
                const f = e.target.files?.[0];
                if (f) { setDiagnosticFileObj(f); setDiagnosticFile(f.name); }
              }}
            />
            <div
              className="border-2 border-dashed border-slate-200 rounded-xl p-4 text-center bg-slate-50 hover:bg-blue-50/50 transition-all cursor-pointer"
              onClick={() => diagnosticInputRef.current?.click()}
            >
              <Upload className="w-5 h-5 text-blue-600 mx-auto mb-1" />
              <span className="text-xs font-bold text-blue-700">Tap to Upload Document</span>
              <p className="text-[10px] text-slate-400 mt-0.5">JPG, PNG or PDF</p>
            </div>

            {diagnosticFile && (
              <div className="flex items-center justify-between bg-emerald-50/80 p-2.5 rounded-xl border border-emerald-200 text-xs font-bold text-slate-800">
                <div className="flex items-center gap-2">
                  <FileText className="w-4 h-4 text-emerald-600" />
                  <span>{diagnosticFile}</span>
                </div>
                <CheckCircle2 className="w-4 h-4 text-emerald-600" />
              </div>
            )}
          </div>

          {/* Step 3: Upload Cash Memo */}
          <div className="bg-white p-4 rounded-2xl border border-slate-200 shadow-2xs space-y-3 mb-3">
            <div className="flex items-center gap-2">
              <span className="w-5 h-5 rounded-full bg-blue-600 text-white text-xs font-bold flex items-center justify-center shrink-0">3</span>
              <div>
                <h3 className="text-xs font-extrabold text-slate-900">Upload Cash Memo</h3>
                <p className="text-[10px] text-slate-500 font-medium">Upload cash memo/bill</p>
              </div>
            </div>

            {/* Hidden real file input for cash memo */}
            <input
              ref={cashMemoInputRef}
              type="file"
              accept="image/*,application/pdf"
              className="hidden"
              onChange={(e) => {
                const f = e.target.files?.[0];
                if (f) { setCashMemoFileObj(f); setCashMemoFile(f.name); }
              }}
            />
            <div
              className="border-2 border-dashed border-slate-200 rounded-xl p-4 text-center bg-slate-50 hover:bg-blue-50/50 transition-all cursor-pointer"
              onClick={() => cashMemoInputRef.current?.click()}
            >
              <Upload className="w-5 h-5 text-blue-600 mx-auto mb-1" />
              <span className="text-xs font-bold text-blue-700">Tap to Upload Cash Memo</span>
              <p className="text-[10px] text-slate-400 mt-0.5">JPG, PNG or PDF</p>
            </div>

            {cashMemoFile && (
              <div className="flex items-center justify-between bg-emerald-50/80 p-2.5 rounded-xl border border-emerald-200 text-xs font-bold text-slate-800">
                <div className="flex items-center gap-2">
                  <FileText className="w-4 h-4 text-emerald-600" />
                  <span>{cashMemoFile}</span>
                </div>
                <CheckCircle2 className="w-4 h-4 text-emerald-600" />
              </div>
            )}
          </div>

          {/* Step 4: Cashback Amount */}
          <div className="bg-white p-4 rounded-2xl border border-slate-200 shadow-2xs space-y-3 mb-4">
            <div className="flex items-center gap-2">
              <span className="w-5 h-5 rounded-full bg-blue-600 text-white text-xs font-bold flex items-center justify-center shrink-0">4</span>
              <div>
                <h3 className="text-xs font-extrabold text-slate-900">Cashback Amount</h3>
                <p className="text-[10px] text-slate-500 font-medium">Enter total cashback amount</p>
              </div>
            </div>

            {/* Total Medical Expenses Hint */}
            {totalMedicalExpenses > 0 && (
              <div className="bg-amber-50/80 border border-amber-200 rounded-xl px-3 py-2 flex items-center justify-between text-xs mb-1">
                <span className="font-semibold text-amber-800">Your tracked medical spending</span>
                <span className="font-black text-amber-900">₹{totalMedicalExpenses.toLocaleString('en-IN')}</span>
              </div>
            )}
            <div className="relative">
              <span className="absolute left-3.5 top-2.5 font-bold text-slate-700">₹</span>
              <input
                type="number"
                value={claimAmount}
                onChange={(e) => setClaimAmount(e.target.value)}
                placeholder="Enter your medical expense amount"
                className="w-full bg-slate-50 border border-slate-200 rounded-xl pl-8 pr-4 py-2.5 text-sm font-black text-slate-900 focus:outline-none focus:ring-2 focus:ring-blue-600"
              />
            </div>
            <p className="text-[10px] text-slate-400 font-semibold">Max claimable: ₹{activeCardData ? parseFloat(activeCardData.remaining_amount).toLocaleString('en-IN') : '—'}</p>
          </div>

          {/* Info Notice Box */}
          <div className="bg-blue-50/70 p-3 rounded-2xl border border-blue-100 flex items-start gap-2 mb-5">
            <Info className="w-4 h-4 text-blue-700 shrink-0 mt-0.5" />
            <p className="text-[11px] font-semibold text-blue-900 leading-snug">
              Please ensure all documents are clear and readable for faster approval.
            </p>
          </div>

          {/* Action Button */}
          <button
            onClick={handleSubmitClaim}
            disabled={isSubmittingClaim}
            className="w-full bg-[#1E3A8A] hover:bg-[#1e293b] text-white font-extrabold text-sm py-3.5 rounded-2xl shadow-lg transition-all flex items-center justify-center gap-2 disabled:opacity-50"
          >
            {isSubmittingClaim ? 'Submitting Claim...' : 'Submit Claim'}
          </button>

          <p className="text-[10px] font-semibold text-slate-400 text-center mt-2.5 flex items-center justify-center gap-1">
            <Lock className="w-3 h-3" /> All documents are secure and confidential
          </p>
        </div>
      )}

      {/* ========================================================================= */}
      {/* SCREEN 5: CLAIM SUBMITTED */}
      {/* ========================================================================= */}
      {step === 'claim_submitted' && (
        <div className="max-w-md mx-auto w-full px-4 pt-4 animate-in fade-in slide-in-from-right-4 duration-300">
          
          {/* Header */}
          <div className="flex items-center gap-3 py-2 mb-3">
            <button 
              onClick={() => setStep('file_claim')} 
              className="p-2 rounded-xl bg-white border border-slate-200 text-slate-700 shadow-2xs hover:bg-slate-50"
            >
              <ArrowLeft className="w-4 h-4" />
            </button>
            <h1 className="text-base font-extrabold text-slate-900 leading-tight">Claim Submitted</h1>
          </div>

          {/* Success Banner Card */}
          <div className="bg-emerald-50/80 rounded-3xl p-6 border border-emerald-200 text-center space-y-2 mb-5">
            <div className="w-12 h-12 bg-emerald-600 text-white rounded-full flex items-center justify-center mx-auto shadow-md">
              <Check className="w-7 h-7 stroke-[3]" />
            </div>
            <h2 className="text-base font-extrabold text-emerald-950">Claim Submitted Successfully!</h2>
            <p className="text-xs text-emerald-800 font-medium leading-relaxed max-w-[85%] mx-auto">
              We have received your claim and it is under review.
            </p>
          </div>

          {/* Claim Details Box — live data from latest submitted claim */}
          {(() => {
            const latestClaim = userClaims[0];
            const now = new Date();
            const claimDate = latestClaim?.creer ? new Date(latestClaim.creer) : now;
            return (
              <div className="bg-white p-4 rounded-2xl border border-slate-200 shadow-2xs space-y-2.5 mb-5 text-xs">
                <h3 className="font-extrabold text-slate-900 border-b border-slate-100 pb-2">Claim Details</h3>
                <div className="flex justify-between font-semibold">
                  <span className="text-slate-500">Claim ID</span>
                  <span className="font-extrabold text-slate-900">{latestClaim?.claim_id || submittedClaimId}</span>
                </div>
                <div className="flex justify-between font-semibold">
                  <span className="text-slate-500">Claim Date</span>
                  <span className="font-bold text-slate-800">{claimDate.toLocaleString('en-IN', { day: '2-digit', month: 'short', year: 'numeric', hour: '2-digit', minute: '2-digit' })}</span>
                </div>
                <div className="flex justify-between font-semibold">
                  <span className="text-slate-500">Card Type</span>
                  <span className="font-bold text-slate-800">{latestClaim?.card_type || activeCardData?.card_type || '—'}</span>
                </div>
                <div className="flex justify-between font-semibold">
                  <span className="text-slate-500">Claim Amount</span>
                  <span className="font-extrabold text-blue-700">₹{latestClaim ? parseFloat(latestClaim.expense_amount).toLocaleString('en-IN') : claimAmount}</span>
                </div>
                <div className="flex justify-between font-semibold pt-1 border-t border-slate-100">
                  <span className="text-slate-500">Status</span>
                  <span className="font-extrabold text-amber-600">Under Review</span>
                </div>
              </div>
            );
          })()}

          {/* What's Next? Progress Timeline */}
          <div className="bg-white p-4 rounded-2xl border border-slate-200 shadow-2xs space-y-3 mb-6">
            <h3 className="text-xs font-extrabold text-slate-900">What&apos;s Next?</h3>
            <p className="text-[11px] text-slate-500 font-medium">We will review your documents and update the status within 2-3 working days.</p>

            <div className="space-y-3 pt-2 text-xs font-semibold">
              <div className="flex items-center justify-between text-emerald-700">
                <div className="flex items-center gap-2">
                  <CheckCircle2 className="w-4 h-4 text-emerald-600" />
                  <span>Documents Received</span>
                </div>
                <span className="text-[10px] text-slate-400 font-medium">{new Date().toLocaleDateString('en-IN', { day: '2-digit', month: 'short', year: 'numeric' })}</span>
              </div>

              <div className="flex items-center justify-between text-amber-700">
                <div className="flex items-center gap-2">
                  <div className="w-4 h-4 rounded-full bg-amber-500 border-2 border-white shadow-2xs flex items-center justify-center">
                    <span className="w-1.5 h-1.5 rounded-full bg-white"></span>
                  </div>
                  <span className="font-extrabold">Under Review</span>
                </div>
                <span className="text-[10px] text-slate-400 font-medium">In Progress</span>
              </div>

              <div className="flex items-center justify-between text-slate-400">
                <div className="flex items-center gap-2">
                  <div className="w-4 h-4 rounded-full border border-slate-300"></div>
                  <span>Approved</span>
                </div>
                <span className="text-[10px] text-slate-400 font-medium">Pending</span>
              </div>

              <div className="flex items-center justify-between text-slate-400">
                <div className="flex items-center gap-2">
                  <div className="w-4 h-4 rounded-full border border-slate-300"></div>
                  <span>Cashback Credited</span>
                </div>
                <span className="text-[10px] text-slate-400 font-medium">Pending</span>
              </div>
            </div>
          </div>

          {/* Action Buttons */}
          <div className="space-y-2.5">
            <button
              onClick={() => setStep('my_card')}
              className="w-full bg-[#1E3A8A] hover:bg-[#1e293b] text-white font-extrabold text-sm py-3 rounded-2xl shadow-lg transition-all"
            >
              View My Claims
            </button>
            <button
              onClick={() => setStep('select_plan')}
              className="w-full bg-white hover:bg-slate-50 text-slate-700 font-bold text-xs py-3 rounded-2xl border border-slate-200 transition-all flex items-center justify-center gap-1.5"
            >
              Back to Home
            </button>
          </div>
        </div>
      )}

      {/* ========================================================================= */}
      {/* SCREEN 6: CASHBACK COLLECTED */}
      {/* ========================================================================= */}
      {step === 'cashback_collected' && (
        <div className="max-w-md mx-auto w-full px-4 pt-4 animate-in fade-in slide-in-from-right-4 duration-300">
          
          {/* Header */}
          <div className="flex items-center gap-3 py-2 mb-3">
            <button 
              onClick={() => setStep('claim_submitted')} 
              className="p-2 rounded-xl bg-white border border-slate-200 text-slate-700 shadow-2xs hover:bg-slate-50"
            >
              <ArrowLeft className="w-4 h-4" />
            </button>
            <h1 className="text-base font-extrabold text-slate-900 leading-tight">Cashback Collected</h1>
          </div>

          {/* Success Banner Card with Celebration Visual */}
          <div className="bg-emerald-50/80 rounded-3xl p-6 border border-emerald-200 text-center space-y-2 mb-5 relative overflow-hidden">
            <div className="w-12 h-12 bg-emerald-600 text-white rounded-full flex items-center justify-center mx-auto shadow-md relative z-10">
              <Check className="w-7 h-7 stroke-[3]" />
            </div>
            <h2 className="text-base font-extrabold text-emerald-950 relative z-10">Cashback Collected!</h2>
            <p className="text-xs text-emerald-800 font-medium leading-relaxed max-w-[85%] mx-auto relative z-10">
              The cashback amount has been credited to your wallet successfully.
            </p>
          </div>

          {/* Claim Details Box — live approved claim data */}
          {(() => {
            const approvedClaim = userClaims.find((c: any) => c.status === 'approved');
            if (!approvedClaim) {
              return (
                <div className="bg-amber-50 p-4 rounded-2xl border border-amber-200 text-center mb-4">
                  <p className="text-xs font-bold text-amber-900">Your claim is currently under review by admin.</p>
                  <p className="text-[10px] text-amber-700 font-medium mt-1">Once approved, cashback will be credited to your wallet.</p>
                </div>
              );
            }
            return (
              <div className="bg-white p-4 rounded-2xl border border-slate-200 shadow-2xs space-y-2.5 mb-4 text-xs">
                <h3 className="font-extrabold text-slate-900 border-b border-slate-100 pb-2">Claim Details</h3>
                <div className="flex justify-between font-semibold">
                  <span className="text-slate-500">Claim ID</span>
                  <span className="font-extrabold text-slate-900">{approvedClaim?.claim_id || '—'}</span>
                </div>
                <div className="flex justify-between font-semibold">
                  <span className="text-slate-500">Claim Date</span>
                  <span className="font-bold text-slate-800">{approvedClaim?.creer ? new Date(approvedClaim.creer).toLocaleString('en-IN', { day: '2-digit', month: 'short', year: 'numeric', hour: '2-digit', minute: '2-digit' }) : '—'}</span>
                </div>
                <div className="flex justify-between font-semibold">
                  <span className="text-slate-500">Card Type</span>
                  <span className="font-bold text-slate-800">{approvedClaim?.card_type || activeCardData?.card_type || '—'}</span>
                </div>
                <div className="flex justify-between font-semibold">
                  <span className="text-slate-500">Claim Amount</span>
                  <span className="font-bold text-slate-900">₹{approvedClaim ? parseFloat(approvedClaim.expense_amount).toLocaleString('en-IN') : '—'}</span>
                </div>
                {approvedClaim?.status === 'approved' && (
                  <>
                    <div className="flex justify-between font-semibold text-emerald-700">
                      <span>Cashback Credited</span>
                      <span className="font-black text-emerald-700">₹{parseFloat(approvedClaim.approved_amount || approvedClaim.expense_amount).toLocaleString('en-IN')}</span>
                    </div>
                    <div className="flex justify-between font-semibold">
                      <span className="text-slate-500">Credited On</span>
                      <span className="font-bold text-slate-800">{approvedClaim.settled_at ? new Date(approvedClaim.settled_at).toLocaleString('en-IN', { day: '2-digit', month: 'short', year: 'numeric', hour: '2-digit', minute: '2-digit' }) : '—'}</span>
                    </div>
                  </>
                )}
                <div className="flex justify-between font-semibold pt-1 border-t border-slate-100">
                  <span className="text-slate-500">Status</span>
                  <span className={`font-extrabold ${approvedClaim?.status === 'approved' ? 'text-emerald-600' : 'text-amber-600'}`}>
                    {approvedClaim?.status === 'approved' ? 'Completed' : 'Under Review'}
                  </span>
                </div>
              </div>
            );
          })()}

          {/* Fiinway Wallet Credit Box */}
          <div className="bg-blue-50/80 p-4 rounded-2xl border border-blue-200 shadow-2xs flex items-center justify-between mb-4">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-xl bg-blue-600 text-white flex items-center justify-center shadow-xs">
                <Wallet className="w-5 h-5" />
              </div>
              <div>
                <p className="text-xs font-extrabold text-slate-900">{userProfile ? `${userProfile.name}'s` : 'Your'} Fiinway Wallet</p>
                <p className="text-[11px] font-bold text-slate-500">Live Balance: <span className="text-blue-900 font-black">₹{userProfile ? userProfile.wallet_balance.toFixed(2) : '—'}</span></p>
              </div>
            </div>
            <span className="text-sm font-black text-emerald-600">{userProfile ? `₹${userProfile.wallet_balance.toFixed(2)}` : '—'}</span>
          </div>

          {/* Reward Reminder Card */}
          <div className="bg-amber-50/80 p-3.5 rounded-2xl border border-amber-200 flex items-center gap-3 mb-6">
            <div className="w-9 h-9 rounded-xl bg-amber-500 text-white flex items-center justify-center text-lg shadow-2xs shrink-0">
              💰
            </div>
            <p className="text-xs font-bold text-amber-950">
              Keep using your card to enjoy more cashback benefits!
            </p>
          </div>

          {/* Action Buttons */}
          <div className="space-y-2.5">
            <button
              onClick={() => setStep('my_card')}
              className="w-full bg-[#1E3A8A] hover:bg-[#1e293b] text-white font-extrabold text-sm py-3 rounded-2xl shadow-lg transition-all"
            >
              View My Claims
            </button>
            <button
              onClick={() => setStep('select_plan')}
              className="w-full bg-white hover:bg-slate-50 text-slate-700 font-bold text-xs py-3 rounded-2xl border border-slate-200 transition-all flex items-center justify-center gap-1.5"
            >
              Back to Home
            </button>
          </div>
        </div>
      )}

      {/* ========================================================================= */}
      {/* SCREEN 7: USER PROFILE PAGE */}
      {/* ========================================================================= */}
      {step === 'profile' && (
        <div className="max-w-md mx-auto w-full px-4 pt-4 animate-in fade-in slide-in-from-right-4 duration-300">
          
          {/* Header */}
          <div className="flex items-center gap-3 py-2 mb-3">
            <button 
              onClick={() => setStep('my_card')} 
              className="p-2 rounded-xl bg-white border border-slate-200 text-slate-700 shadow-2xs hover:bg-slate-50"
            >
              <ArrowLeft className="w-4 h-4" />
            </button>
            <h1 className="text-base font-extrabold text-slate-900 leading-tight">My Profile</h1>
          </div>

          {/* User Info Header Card */}
          <div className="bg-gradient-to-br from-slate-900 via-slate-800 to-blue-950 text-white rounded-3xl p-5 shadow-xl relative overflow-hidden mb-4 border border-slate-800">
            <div className="flex items-center gap-3.5">
              <div className="w-14 h-14 rounded-2xl bg-blue-600/30 text-blue-400 border border-blue-500/40 flex items-center justify-center text-2xl font-black shadow-md">
                👤
              </div>
              <div className="space-y-0.5">
                <div className="flex items-center gap-2">
                  <h2 className="text-base font-black text-white">{userProfile?.name || 'Fiinway Member'}</h2>
                  <span className="text-[9px] font-black text-emerald-400 bg-emerald-950/80 border border-emerald-800 px-2 py-0.5 rounded-full">
                    ✓ Verified
                  </span>
                </div>
                <p className="text-xs text-slate-300 font-medium">📱 {userProfile?.phone || 'No phone'}</p>
                <p className="text-[10px] text-slate-400 font-semibold uppercase tracking-wider">Account ID: #{userProfile?.id || '—'} • {userProfile?.user_type === 'driver' ? 'Driver' : 'Customer'}</p>
              </div>
            </div>
          </div>

          {/* Fiinway Wallet Card */}
          <div className="bg-white p-4 rounded-2xl border border-slate-200 shadow-2xs space-y-2 mb-4">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2.5">
                <div className="w-9 h-9 rounded-xl bg-emerald-100 text-emerald-700 flex items-center justify-center">
                  <Wallet className="w-5 h-5" />
                </div>
                <div>
                  <p className="text-xs font-extrabold text-slate-900">Fiinway Wallet</p>
                  <p className="text-[10px] text-slate-400 font-medium">Available balance for instant purchases</p>
                </div>
              </div>
              <span className="text-base font-black text-emerald-600">₹{userProfile ? userProfile.wallet_balance.toFixed(2) : '0.00'}</span>
            </div>
          </div>

          {/* Active Card Summary Card */}
          <div className="bg-white p-4 rounded-2xl border border-slate-200 shadow-2xs space-y-3 mb-4">
            <div className="flex items-center justify-between border-b border-slate-100 pb-2">
              <h3 className="text-xs font-extrabold text-slate-900">Active Medical Card</h3>
              {activeCardData ? (
                <span className="text-[10px] font-black text-emerald-700 bg-emerald-100 px-2.5 py-0.5 rounded-full">Active</span>
              ) : (
                <span className="text-[10px] font-bold text-slate-400 bg-slate-100 px-2 py-0.5 rounded-full">No Active Card</span>
              )}
            </div>

            {activeCardData ? (
              <div className="space-y-2 text-xs font-semibold">
                <div className="flex justify-between">
                  <span className="text-slate-500">Card Plan</span>
                  <span className="text-slate-900 font-black">{activeCardData.card_type}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-slate-500">Claim Limit</span>
                  <span className="text-blue-700 font-black">₹{parseFloat(activeCardData.claim_limit).toLocaleString('en-IN')}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-slate-500">Remaining Limit</span>
                  <span className="text-amber-700 font-black">₹{parseFloat(activeCardData.remaining_amount).toLocaleString('en-IN')}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-slate-500">Valid Until</span>
                  <span className="text-slate-800 font-bold">{new Date(activeCardData.expires_at).toLocaleDateString('en-IN', { day: '2-digit', month: 'short', year: 'numeric' })}</span>
                </div>
              </div>
            ) : (
              <div className="text-center py-3">
                <p className="text-xs text-slate-500 font-medium">No active healthcare card found.</p>
                <button onClick={() => setStep('select_plan')} className="mt-2 text-xs font-extrabold text-blue-700 underline">Buy Card Plan</button>
              </div>
            )}
          </div>

          {/* Activity & Stats Breakdown */}
          <div className="grid grid-cols-2 gap-2.5 mb-5">
            <div className="bg-white p-3.5 rounded-2xl border border-slate-200 shadow-2xs space-y-1">
              <p className="text-[10px] font-bold text-slate-400 uppercase tracking-wider">Total Claims</p>
              <p className="text-lg font-black text-slate-900">{userClaims.length}</p>
              <p className="text-[10px] text-slate-500 font-semibold">{userClaims.filter((c: any) => c.status === 'approved').length} Approved</p>
            </div>
            <div className="bg-white p-3.5 rounded-2xl border border-slate-200 shadow-2xs space-y-1">
              <p className="text-[10px] font-bold text-slate-400 uppercase tracking-wider">Tracked Expenses</p>
              <p className="text-lg font-black text-blue-700">₹{totalMedicalExpenses.toLocaleString('en-IN')}</p>
              <p className="text-[10px] text-slate-500 font-semibold">Medical Bills</p>
            </div>
          </div>

          {/* Action Navigation Buttons */}
          <div className="space-y-2.5 mb-6">
            <button
              onClick={handleNavigateToClaim}
              className="w-full bg-[#1E3A8A] hover:bg-[#1e293b] text-white font-extrabold text-xs py-3 rounded-2xl shadow-md transition-all flex items-center justify-center gap-1.5"
            >
              <FileText className="w-4 h-4" /> File a Claim for Cashback
            </button>
            <button
              onClick={() => setStep('select_plan')}
              className="w-full bg-white hover:bg-slate-50 text-slate-700 font-bold text-xs py-3 rounded-2xl border border-slate-200 transition-all flex items-center justify-center gap-1.5"
            >
              Browse Medical Plans
            </button>
          </div>
        </div>
      )}

      {/* WALLET SECURITY M-PIN AUTHORIZATION POPUP MODAL */}
      {showMPinModal && (
        <div className="fixed inset-0 z-50 bg-slate-900/70 backdrop-blur-xs flex items-center justify-center p-4">
          <div className="bg-white w-full max-w-sm rounded-3xl p-5 shadow-2xl space-y-4 animate-in zoom-in-95 duration-200">
            <div className="flex items-center justify-between border-b border-slate-100 pb-3">
              <div className="flex items-center gap-2">
                <div className="w-8 h-8 rounded-xl bg-emerald-100 text-emerald-700 flex items-center justify-center font-bold">
                  🔐
                </div>
                <div>
                  <h3 className="text-sm font-extrabold text-slate-900">Wallet Authorization</h3>
                  <p className="text-[10px] text-slate-500 font-medium">Card Purchase: {selectedPlan.title}</p>
                </div>
              </div>
              <button onClick={() => setShowMPinModal(false)} className="p-1 text-slate-400 hover:text-slate-600">
                ✕
              </button>
            </div>

            <div className="space-y-3">
              <div className="bg-slate-50 p-3 rounded-2xl border border-slate-200 text-center">
                <p className="text-[11px] font-bold text-slate-600">Total Deducting Amount</p>
                <p className="text-xl font-black text-emerald-600">₹{selectedPlan.price}</p>
              </div>

              <div>
                <label className="text-xs font-bold text-slate-800 block mb-1.5">Enter 4-Digit Wallet M-PIN</label>
                <input
                  type="password"
                  maxLength={4}
                  value={mPin}
                  onChange={(e) => setMPin(e.target.value.replace(/\D/g, '').slice(0, 4))}
                  placeholder="••••"
                  className="w-full bg-slate-50 border border-slate-200 rounded-xl px-4 py-3 text-center text-lg font-mono font-bold tracking-widest text-slate-900 focus:ring-2 focus:ring-emerald-600 focus:outline-none"
                />
              </div>

              {mPinError && (
                <p className="text-xs font-bold text-rose-600 bg-rose-50 border border-rose-200 rounded-xl p-2.5 text-center">
                  {mPinError}
                </p>
              )}
            </div>

            <div className="grid grid-cols-2 gap-2 pt-1">
              <button
                type="button"
                onClick={() => setShowMPinModal(false)}
                className="bg-slate-100 hover:bg-slate-200 text-slate-700 font-bold text-xs py-3 rounded-xl transition-all"
              >
                Cancel
              </button>
              <button
                type="button"
                onClick={() => executePurchaseCardApi(mPin)}
                disabled={isProcessingPayment || !mPin || mPin.length !== 4}
                className="bg-emerald-600 hover:bg-emerald-700 disabled:opacity-50 text-white font-extrabold text-xs py-3 rounded-xl shadow-xs transition-all"
              >
                {isProcessingPayment ? 'Verifying...' : 'Confirm & Pay'}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* MODERN STATE-OF-THE-ART CUSTOM UI ALERT POPUP MODAL */}
      {alertState.isOpen && (
        <div className="fixed inset-0 z-50 bg-slate-950/70 backdrop-blur-sm flex items-center justify-center p-4 animate-in fade-in duration-200">
          <div className="bg-white w-full max-w-xs sm:max-w-sm rounded-3xl p-6 shadow-2xl space-y-4 text-center border border-slate-100 animate-in zoom-in-95 duration-200">
            <div className={`w-14 h-14 rounded-2xl mx-auto flex items-center justify-center text-2xl font-black shadow-inner ${
              alertState.type === 'error' ? 'bg-rose-100 text-rose-600 border border-rose-200' :
              alertState.type === 'success' ? 'bg-emerald-100 text-emerald-600 border border-emerald-200' :
              alertState.type === 'info' ? 'bg-blue-100 text-blue-600 border border-blue-200' :
              'bg-amber-100 text-amber-600 border border-amber-200'
            }`}>
              {alertState.type === 'error' ? '⚠️' :
               alertState.type === 'success' ? '✨' :
               alertState.type === 'info' ? 'ℹ️' : '⚡'}
            </div>

            <div className="space-y-1.5">
              <h3 className="text-base font-black text-slate-900 leading-snug">
                {alertState.title}
              </h3>
              <p className="text-xs font-bold text-slate-600 leading-relaxed px-1">
                {alertState.message}
              </p>
            </div>

            <button
              onClick={closeAlert}
              className={`w-full font-extrabold text-xs py-3.5 px-4 rounded-2xl shadow-md transition-all active:scale-95 text-white ${
                alertState.type === 'error' ? 'bg-rose-600 hover:bg-rose-700 shadow-rose-200' :
                alertState.type === 'success' ? 'bg-emerald-600 hover:bg-emerald-700 shadow-emerald-200' :
                alertState.type === 'info' ? 'bg-blue-600 hover:bg-blue-700 shadow-blue-200' :
                'bg-slate-900 hover:bg-slate-800 shadow-slate-200'
              }`}
            >
              {alertState.buttonText || 'Understand & Proceed'}
            </button>
          </div>
        </div>
      )}

      {/* STICKY BOTTOM NAVIGATION BAR */}
      <div className="fixed bottom-0 left-0 right-0 z-40 bg-white/95 backdrop-blur-md border-t border-slate-200 px-4 py-2.5 shadow-lg">
        <div className="max-w-md mx-auto grid grid-cols-4 gap-1 text-center">
          <button
            onClick={() => setStep('select_plan')}
            className={`flex flex-col items-center justify-center py-1 rounded-xl transition-all ${
              step === 'select_plan' || step === 'book_plan' ? 'text-blue-700 font-black' : 'text-slate-400 hover:text-slate-600'
            }`}
          >
            <Building2 className="w-5 h-5" />
            <span className="text-[10px] mt-0.5">Plans</span>
          </button>

          <button
            onClick={() => setStep('my_card')}
            className={`flex flex-col items-center justify-center py-1 rounded-xl transition-all ${
              step === 'my_card' ? 'text-blue-700 font-black' : 'text-slate-400 hover:text-slate-600'
            }`}
          >
            <CreditCard className="w-5 h-5" />
            <span className="text-[10px] mt-0.5">My Card</span>
          </button>

          <button
            onClick={handleNavigateToClaim}
            className={`flex flex-col items-center justify-center py-1 rounded-xl transition-all ${
              step === 'file_claim' || step === 'claim_submitted' || step === 'cashback_collected' ? 'text-blue-700 font-black' : 'text-slate-400 hover:text-slate-600'
            }`}
          >
            <FileText className="w-5 h-5" />
            <span className="text-[10px] mt-0.5">Claims</span>
          </button>

          <button
            onClick={() => setStep('profile')}
            className={`flex flex-col items-center justify-center py-1 rounded-xl transition-all ${
              step === 'profile' ? 'text-blue-700 font-black' : 'text-slate-400 hover:text-slate-600'
            }`}
          >
            <UserCheck className="w-5 h-5" />
            <span className="text-[10px] mt-0.5">Profile</span>
          </button>
        </div>
      </div>

    </div>
  );
}

export default function MedicalCashbackPage() {
  return (
    <Suspense fallback={
      <div className="min-h-screen bg-[#F8FAFC] flex items-center justify-center">
        <div className="w-8 h-8 border-[3px] border-slate-200 border-t-[#1E3A8A] rounded-full animate-spin"></div>
      </div>
    }>
      <MedicalCashbackContent />
    </Suspense>
  );
}
