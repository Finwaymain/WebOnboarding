"use client";

import React, { useState } from "react";
import {
  ChevronLeft,
  Clock,
  Lock,
  RefreshCw,
  Building2,
  MapPin,
  Briefcase,
  Layers,
  ShieldCheck,
  CheckCircle2,
  AlertCircle,
  HelpCircle,
} from "lucide-react";

interface VendorAwaitingApprovalViewProps {
  onBack: () => void;
  applicationData?: any;
  onRefresh?: () => void;
  showToast?: (msg: string) => void;
}

export default function VendorAwaitingApprovalView({
  onBack,
  applicationData,
  onRefresh,
  showToast,
}: VendorAwaitingApprovalViewProps) {
  const [refreshing, setRefreshing] = useState(false);

  const handleRefresh = async () => {
    setRefreshing(true);
    if (showToast) showToast("Checking application status...");
    if (onRefresh) {
      await onRefresh();
    }
    setTimeout(() => {
      setRefreshing(false);
      if (showToast) showToast("Status refreshed. Application is still in review.");
    }, 1200);
  };

  const formatSafeDate = (raw?: any) => {
    if (!raw) return "Recent";
    try {
      const str = String(raw).trim().replace(" ", "T");
      const d = new Date(str);
      if (isNaN(d.getTime())) return "Recent";
      return d.toLocaleDateString("en-IN", {
        day: "numeric",
        month: "short",
        year: "numeric",
      });
    } catch {
      return "Recent";
    }
  };

  const designation = applicationData?.designation || "Sub-Vendor";
  const location = applicationData?.team_location || "Regional Territory";
  const teamType = applicationData?.team_type || "Field Marketing";
  const parentVendorCode = applicationData?.parent_vendor?.vendor_code || applicationData?.parent_code || "Parent Vendor";
  const submissionDate = formatSafeDate(applicationData?.created_at);

  return (
    <div className="min-h-screen bg-[#F8FAFC] pb-12 text-slate-900 font-sans">
      {/* Sticky Top Header */}
      <div className="bg-white border-b border-slate-200 sticky top-0 z-30 shadow-2xs">
        <div className="max-w-md mx-auto px-4 py-3 flex items-center justify-between">
          <div className="flex items-center gap-2.5">
            <button
              onClick={onBack}
              className="p-2 rounded-xl bg-slate-100 hover:bg-slate-200 text-slate-700 transition-colors shrink-0"
              title="Back"
            >
              <ChevronLeft className="w-4 h-4 stroke-[2.5]" />
            </button>
            <div>
              <h2 className="text-sm font-bold text-slate-900 leading-tight">
                Sub-Vendor Application
              </h2>
              <p className="text-[10.5px] text-amber-700 font-semibold flex items-center gap-1">
                <span className="w-1.5 h-1.5 rounded-full bg-amber-500 animate-ping inline-block" />
                Awaiting Approval
              </p>
            </div>
          </div>

          <span className="text-[10px] font-bold px-2.5 py-1 rounded-full bg-amber-100 text-amber-900 border border-amber-300">
            In Review
          </span>
        </div>
      </div>

      <div className="max-w-md mx-auto px-4 pt-5 space-y-4">
        {/* Main Status Hero Banner */}
        <div className="bg-gradient-to-br from-amber-50 via-white to-orange-50/60 rounded-3xl p-6 border border-amber-200/80 shadow-xs text-center space-y-3 relative overflow-hidden">
          <div className="w-16 h-16 rounded-2xl bg-amber-100 text-amber-700 border border-amber-300/80 mx-auto flex items-center justify-center shadow-inner relative">
            <Clock className="w-8 h-8 text-amber-700" />
            <div className="absolute -bottom-1 -right-1 w-6 h-6 rounded-full bg-amber-500 text-white flex items-center justify-center border-2 border-white shadow-xs">
              <Lock className="w-3 h-3" />
            </div>
          </div>

          <div className="space-y-1">
            <span className="text-[10px] font-black uppercase tracking-wider text-amber-800 bg-amber-200/70 px-2.5 py-0.5 rounded-full inline-block">
              APPLICATION UNDER REVIEW
            </span>
            <h3 className="text-lg font-black text-slate-900 tracking-tight">
              Awaiting Parent Vendor Review
            </h3>
            <p className="text-xs text-slate-600 font-medium max-w-xs mx-auto leading-relaxed">
              Your Sub-Vendor profile is pending review. The dashboard will automatically unlock once your parent vendor configures your payout rates.
            </p>
          </div>
        </div>

        {/* Application Details Summary Card */}
        <div className="bg-white rounded-2xl p-4 border border-slate-200 shadow-2xs space-y-3">
          <h4 className="text-xs font-bold text-slate-800 uppercase tracking-wider flex items-center gap-1.5">
            <Building2 className="w-3.5 h-3.5 text-slate-500" />
            <span>Application Summary</span>
          </h4>

          <div className="divide-y divide-slate-100 text-xs">
            <div className="py-2.5 flex items-center justify-between">
              <span className="text-slate-500 font-medium">Applied Role</span>
              <span className="font-bold text-slate-900 bg-slate-100 px-2 py-0.5 rounded-md">
                {designation}
              </span>
            </div>

            <div className="py-2.5 flex items-center justify-between">
              <span className="text-slate-500 font-medium">Parent Vendor</span>
              <span className="font-bold text-indigo-700 font-mono">
                {parentVendorCode}
              </span>
            </div>

            <div className="py-2.5 flex items-center justify-between">
              <span className="text-slate-500 font-medium">Target Territory</span>
              <span className="font-semibold text-slate-800">
                {location}
              </span>
            </div>

            <div className="py-2.5 flex items-center justify-between">
              <span className="text-slate-500 font-medium">Team Category</span>
              <span className="font-semibold text-slate-800">
                {teamType}
              </span>
            </div>

            <div className="py-2.5 flex items-center justify-between">
              <span className="text-slate-500 font-medium">Submitted On</span>
              <span className="font-medium text-slate-600">
                {submissionDate}
              </span>
            </div>
          </div>
        </div>

        {/* What Happens Next Steps Card */}
        <div className="bg-white rounded-2xl p-4 border border-slate-200 shadow-2xs space-y-3">
          <h4 className="text-xs font-bold text-slate-800 uppercase tracking-wider flex items-center gap-1.5">
            <ShieldCheck className="w-3.5 h-3.5 text-emerald-600" />
            <span>Next Steps to Activation</span>
          </h4>

          <div className="space-y-3 text-xs">
            <div className="flex items-start gap-3">
              <div className="w-5 h-5 rounded-full bg-amber-100 text-amber-800 flex items-center justify-center font-bold text-[10px] shrink-0 mt-0.5">
                1
              </div>
              <div>
                <p className="font-bold text-slate-900">Parent Review & Rate Setup</p>
                <p className="text-[11px] text-slate-500 mt-0.5 leading-snug">
                  Your parent vendor receives an alert to review your application and assign your Customer & Business commission rates.
                </p>
              </div>
            </div>

            <div className="flex items-start gap-3">
              <div className="w-5 h-5 rounded-full bg-slate-100 text-slate-700 flex items-center justify-center font-bold text-[10px] shrink-0 mt-0.5">
                2
              </div>
              <div>
                <p className="font-bold text-slate-900">Joining Codes Activation</p>
                <p className="text-[11px] text-slate-500 mt-0.5 leading-snug">
                  Upon approval, your unique <strong>Sub-Vendor Code (SV...)</strong> and <strong>Freelancer Code (FR...)</strong> are activated.
                </p>
              </div>
            </div>

            <div className="flex items-start gap-3">
              <div className="w-5 h-5 rounded-full bg-slate-100 text-slate-700 flex items-center justify-center font-bold text-[10px] shrink-0 mt-0.5">
                3
              </div>
              <div>
                <p className="font-bold text-slate-900">Full Dashboard Unlocked</p>
                <p className="text-[11px] text-slate-500 mt-0.5 leading-snug">
                  You can immediately start recruiting downline sub-vendors and freelancers, and monitor all earnings in real-time.
                </p>
              </div>
            </div>
          </div>
        </div>

        {/* Action Buttons */}
        <div className="space-y-2 pt-2">
          <button
            onClick={handleRefresh}
            disabled={refreshing}
            className="w-full bg-slate-900 hover:bg-slate-800 active:scale-[0.99] text-white font-bold text-xs py-3.5 rounded-xl shadow-sm flex items-center justify-center gap-2 transition-all disabled:opacity-75"
          >
            <RefreshCw className={`w-3.5 h-3.5 ${refreshing ? "animate-spin" : ""}`} />
            <span>{refreshing ? "Checking Status..." : "Check Approval Status"}</span>
          </button>

          <button
            onClick={onBack}
            className="w-full bg-white hover:bg-slate-50 active:scale-[0.99] text-slate-700 font-bold text-xs py-3 rounded-xl border border-slate-200 shadow-2xs flex items-center justify-center gap-1.5 transition-all"
          >
            <span>Back to Partner Home</span>
          </button>
        </div>
      </div>
    </div>
  );
}
