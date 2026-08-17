"use client";

import { useSearchParams, useRouter } from "next/navigation";
import { Suspense, useEffect, useState, useCallback } from "react";
import AadhaarRegistrationModal from "../../components/AadhaarRegistrationModal";

const API_KEY = "base64:nTfofcBByTDenJQYlsRbH0JjeVFW5lWsIIyXtq8/9sU=";
const getApiBase = () => (typeof window !== "undefined" ? `${window.location.origin}/api/v1` : "https://api.fiinway.com/api/v1");

function JoinFiinwayContent() {
  const searchParams = useSearchParams();
  const router = useRouter();

  const [token, setToken] = useState<string | null>(null);
  const [userId, setUserId] = useState<string | null>(null);
  const [driverId, setDriverId] = useState<string | null>(null);
  const [phone, setPhone] = useState<string | null>(null);

  const [isAadhaarVerified, setIsAadhaarVerified] = useState<boolean>(false);
  const [showAadhaarModal, setShowAadhaarModal] = useState<boolean>(false);
  const [loading, setLoading] = useState<boolean>(true);

  useEffect(() => {
    if (typeof window !== "undefined") {
      const params = new URLSearchParams(window.location.search);
      setToken(params.get("accesstoken") || searchParams.get("accesstoken"));
      setUserId(params.get("user_id") || searchParams.get("user_id") || params.get("id_user"));
      setDriverId(params.get("driver_id") || searchParams.get("driver_id") || params.get("id_driver"));
      setPhone(params.get("phone") || searchParams.get("phone") || params.get("mobile"));
    }
  }, [searchParams]);

  const checkAadhaarStatus = useCallback(async () => {
    try {
      setLoading(true);
      const apiBase = getApiBase();
      let uId = userId;
      let dId = driverId;
      let tok = token;
      let ph = phone;

      if (typeof window !== "undefined") {
        const p = new URLSearchParams(window.location.search);
        uId = uId || p.get("user_id") || p.get("id_user");
        dId = dId || p.get("driver_id") || p.get("id_driver");
        tok = tok || p.get("accesstoken");
        ph = ph || p.get("phone") || p.get("mobile");
      }

      const queryStr = `user_id=${uId || ""}&driver_id=${dId || ""}&phone=${encodeURIComponent(ph || "")}&accesstoken=${encodeURIComponent(tok || "")}&apikey=${encodeURIComponent(API_KEY)}`;
      const res = await fetch(`${apiBase}/referral-dashboard-stats?${queryStr}`, {
        headers: { apikey: API_KEY, accesstoken: tok || "" },
      });
      const json = await res.json();
      if (json.success === "success" && json.data) {
        const isVerified = Boolean(
          json.data.aadhar_submitted === true &&
          json.data.aadhar_number &&
          String(json.data.aadhar_number).trim().length >= 4
        );
        setIsAadhaarVerified(isVerified);
        setShowAadhaarModal(!isVerified);
      } else {
        setIsAadhaarVerified(false);
        setShowAadhaarModal(true);
      }
    } catch (e) {
      console.error("Error checking Aadhaar status:", e);
      setIsAadhaarVerified(false);
      setShowAadhaarModal(true);
    } finally {
      setLoading(false);
    }
  }, [userId, driverId, token, phone]);

  useEffect(() => {
    checkAadhaarStatus();
  }, [checkAadhaarStatus]);

  const handleAadhaarSuccess = (newAadhaar: string) => {
    setIsAadhaarVerified(true);
    setShowAadhaarModal(false);
  };

  const handleGetStarted = () => {
    if (!isAadhaarVerified) {
      setShowAadhaarModal(true);
      return;
    }
    const query = new URLSearchParams(window.location.search).toString();
    router.push(`/referral?${query}`);
  };

  return (
    <div className="min-h-screen bg-[#f8fafc] flex flex-col items-center justify-center p-6 font-sans">
      <div className="max-w-md w-full bg-white rounded-[2rem] p-8 shadow-[0_8px_30px_rgb(0,0,0,0.04)] border border-gray-100/50 flex flex-col items-center text-center relative overflow-hidden">
        {/* Decorative background shapes */}
        <div className="absolute -top-24 -right-24 w-48 h-48 bg-emerald-50 rounded-full blur-3xl opacity-60"></div>
        <div className="absolute -bottom-24 -left-24 w-48 h-48 bg-teal-50 rounded-full blur-3xl opacity-60"></div>

        <div className="relative z-10 w-20 h-20 bg-gradient-to-tr from-emerald-500 to-teal-400 rounded-2xl flex items-center justify-center shadow-lg shadow-emerald-500/20 mb-8 transform -rotate-3 transition-transform hover:rotate-0 duration-300">
          <svg className="w-10 h-10 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M13 10V3L4 14h7v7l9-11h-7z" />
          </svg>
        </div>

        <h1 className="text-3xl font-extrabold text-gray-900 tracking-tight mb-3 relative z-10">
          Join Fiinway Partner
        </h1>
        
        <p className="text-gray-500 font-medium leading-relaxed mb-10 relative z-10 text-[15px]">
          Become a partner today and start earning on your own schedule. Link your Aadhaar to get started.
        </p>

        <button
          onClick={handleGetStarted}
          className="relative z-10 w-full py-4 bg-emerald-600 hover:bg-emerald-700 text-white font-bold rounded-xl transition-all duration-300 shadow-lg shadow-emerald-600/20 active:scale-[0.98] flex items-center justify-center gap-2"
        >
          <span>Get Started & Open Dashboard</span>
          <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M17 8l4 4m0 0l-4 4m4-4H3" />
          </svg>
        </button>
      </div>

      <AadhaarRegistrationModal
        isOpen={showAadhaarModal}
        userId={userId}
        driverId={driverId}
        token={token}
        phone={phone}
        apiBase={getApiBase()}
        apiKey={API_KEY}
        onSuccess={handleAadhaarSuccess}
      />
    </div>
  );
}

export default function JoinFiinway() {
  return (
    <Suspense
      fallback={
        <div className="min-h-screen bg-[#f8fafc] flex items-center justify-center">
          <div className="w-8 h-8 border-[3px] border-emerald-100 border-t-emerald-600 rounded-full animate-spin"></div>
        </div>
      }
    >
      <JoinFiinwayContent />
    </Suspense>
  );
}
