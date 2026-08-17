"use client";

import React, { useState } from "react";
import { ShieldCheck, AlertCircle, Loader2, CheckCircle2, Lock } from "lucide-react";

interface AadhaarModalProps {
  isOpen?: boolean;
  userId?: string | null;
  driverId?: string | null;
  token?: string | null;
  phone?: string | null;
  apiBase?: string;
  apiKey?: string;
  onSuccess: (aadharNumber: string) => void;
}

export default function AadhaarRegistrationModal({
  isOpen = true,
  userId,
  driverId,
  token,
  phone,
  apiBase = "/api/v1",
  apiKey = "",
  onSuccess,
}: AadhaarModalProps) {
  const [aadhaarInput, setAadhaarInput] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [successMsg, setSuccessMsg] = useState("");

  if (!isOpen) return null;

  // Format Aadhaar with spaces (XXXX XXXX XXXX) for visual clarity
  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const raw = e.target.value.replace(/[^0-9]/g, "");
    if (raw.length <= 12) {
      setAadhaarInput(raw);
      setError("");
    }
  };

  const formattedValue = aadhaarInput
    .replace(/(\d{4})/g, "$1 ")
    .trim();

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    const cleanAadhaar = aadhaarInput.trim();

    if (cleanAadhaar.length !== 12) {
      setError("Please enter a valid 12-digit Aadhaar number.");
      return;
    }

    setLoading(true);
    setError("");
    setSuccessMsg("");

    try {
      const payload = {
        user_id: userId || "",
        driver_id: driverId || "",
        id_user: userId || "",
        id_conducteur: driverId || "",
        phone: phone || "",
        accesstoken: token || "",
        aadhar_number: cleanAadhaar,
      };

      const res = await fetch(`${apiBase}/user/submit-aadhar`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          apikey: apiKey,
          accesstoken: token || "",
        },
        body: JSON.stringify(payload),
      });

      const data = await res.json();

      if (data.success || data.status || data.res === "success") {
        setSuccessMsg("Aadhaar registered & verified successfully!");
        setTimeout(() => {
          onSuccess(cleanAadhaar);
        }, 1200);
      } else {
        // Show specific error (e.g., Aadhaar linked to different mobile number)
        setError(
          data.message ||
            "This Aadhaar card number is already registered with a different mobile number."
        );
      }
    } catch (err: any) {
      console.error("Aadhaar submission error:", err);
      setError("Network error occurred. Please check your connection and try again.");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="fixed inset-0 z-[9999] flex items-center justify-center p-4 bg-slate-900/80 backdrop-blur-md transition-opacity">
      <div className="bg-white w-full max-w-md rounded-3xl p-6 sm:p-8 shadow-2xl border border-slate-100 relative overflow-hidden animate-in fade-in zoom-in-95 duration-200">
        {/* Top Decorative Header */}
        <div className="flex flex-col items-center text-center mb-6">
          <div className="w-16 h-16 rounded-2xl bg-emerald-100 text-emerald-600 flex items-center justify-center mb-4 shadow-inner">
            <ShieldCheck className="w-9 h-9" />
          </div>

          <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-amber-50 border border-amber-200 text-amber-800 text-[11px] font-bold uppercase tracking-wider mb-2">
            <Lock className="w-3.5 h-3.5 text-amber-600" />
            Verification Required
          </div>

          <h2 className="text-xl font-extrabold text-slate-900 tracking-tight">
            Register Your Aadhaar
          </h2>
          <p className="text-xs font-medium text-slate-500 mt-1 max-w-xs leading-relaxed">
            To join as a partner and access your earnings dashboard, please link your 12-digit Aadhaar number linked to your mobile.
          </p>
        </div>

        {/* Success Message Banner */}
        {successMsg && (
          <div className="mb-5 p-4 rounded-2xl bg-emerald-50 border border-emerald-200 text-emerald-800 flex items-center gap-3 text-xs font-bold animate-in fade-in">
            <CheckCircle2 className="w-5 h-5 text-emerald-600 shrink-0" />
            <span>{successMsg}</span>
          </div>
        )}

        {/* Error Message Banner */}
        {error && (
          <div className="mb-5 p-4 rounded-2xl bg-red-50 border border-red-200 text-red-700 flex items-start gap-3 text-xs font-semibold leading-snug animate-in fade-in">
            <AlertCircle className="w-5 h-5 text-red-600 shrink-0 mt-0.5" />
            <div>
              <p className="font-bold text-red-900 mb-0.5">Verification Error</p>
              <p>{error}</p>
            </div>
          </div>
        )}

        {/* Form */}
        <form onSubmit={handleSubmit} className="space-y-5">
          <div>
            <label className="block text-xs font-bold text-slate-700 uppercase tracking-wide mb-2">
              12-Digit Aadhaar Number
            </label>
            <div className="relative">
              <input
                type="text"
                inputMode="numeric"
                maxLength={14}
                value={formattedValue}
                onChange={handleInputChange}
                placeholder="1234 5678 9012"
                disabled={loading || !!successMsg}
                className="w-full px-4 py-3.5 text-lg font-mono font-bold tracking-wider text-slate-900 bg-slate-50 border border-slate-200 rounded-2xl focus:bg-white focus:outline-none focus:ring-2 focus:ring-emerald-500 focus:border-transparent placeholder:text-slate-300 disabled:opacity-60 transition-all"
              />
              <span className="absolute right-4 top-1/2 -translate-y-1/2 text-xs font-bold font-mono text-slate-400">
                {aadhaarInput.length}/12
              </span>
            </div>
            <p className="text-[11px] text-slate-400 mt-1.5">
              Must be the Aadhaar card linked to your registered phone number.
            </p>
          </div>

          <button
            type="submit"
            disabled={loading || aadhaarInput.length !== 12 || !!successMsg}
            className="w-full py-4 bg-gradient-to-r from-emerald-600 to-teal-600 hover:from-emerald-700 hover:to-teal-700 text-white font-bold text-sm rounded-2xl shadow-lg shadow-emerald-600/20 disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-2 transition-all active:scale-[0.99]"
          >
            {loading ? (
              <>
                <Loader2 className="w-4 h-4 animate-spin" />
                <span>Verifying Aadhaar...</span>
              </>
            ) : (
              <span>Register & Access Partner Dashboard</span>
            )}
          </button>
        </form>

        <div className="mt-6 pt-4 border-t border-slate-100 text-center">
          <p className="text-[10px] text-slate-400 font-medium">
            🔒 Your Aadhaar details are encrypted and securely verified in accordance with privacy policies.
          </p>
        </div>
      </div>
    </div>
  );
}
