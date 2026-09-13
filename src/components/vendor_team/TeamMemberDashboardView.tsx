"use client";

import React, { useState } from "react";
import {
  ChevronLeft,
  Users,
  ShieldCheck,
  Share2,
  Copy,
  Check,
  CheckCircle2,
  Clock,
  Briefcase,
  MapPin,
  Lock,
  UserCheck
} from "lucide-react";

interface TeamMemberDashboardViewProps {
  onBack: () => void;
  memberData: any;
  showToast: (msg: string) => void;
}

export default function TeamMemberDashboardView({
  onBack,
  memberData,
  showToast,
}: TeamMemberDashboardViewProps) {
  const [copiedCode, setCopiedCode] = useState(false);
  const [copiedLink, setCopiedLink] = useState(false);

  const memberCode = memberData?.member_code || "FR------";
  const shareUrl = memberData?.share_url || `https://api.fiinway.com/ref/${memberCode}`;

  const handleCopyCode = () => {
    if (!memberCode) return;
    if (typeof navigator !== "undefined" && navigator.clipboard) {
      navigator.clipboard.writeText(memberCode);
    }
    setCopiedCode(true);
    showToast("Freelancer code copied to clipboard!");
    setTimeout(() => setCopiedCode(false), 2000);
  };

  const handleCopyLink = () => {
    if (!shareUrl) return;
    if (typeof navigator !== "undefined" && navigator.clipboard) {
      navigator.clipboard.writeText(shareUrl);
    }
    setCopiedLink(true);
    showToast("Shareable link copied to clipboard!");
    setTimeout(() => setCopiedLink(false), 2000);
  };

  const handleNativeShare = async () => {
    const text = `Join Fiinway using my Freelancer Code: ${memberCode}\nDownload & Register here: ${shareUrl}`;
    if (typeof navigator !== "undefined" && navigator.share) {
      try {
        await navigator.share({
          title: "Join Fiinway with Freelancer Code",
          text,
          url: shareUrl,
        });
      } catch (_) {}
    } else {
      handleCopyLink();
    }
  };

  const custCount = memberData?.acquired_customers_count ?? 0;
  const bizCount = memberData?.acquired_businesses_count ?? 0;
  const totalCount = memberData?.total_acquisitions_count ?? (custCount + bizCount);
  const location = memberData?.team_location || "Regional Territory";
  const teamType = memberData?.team_type || "Field Marketing";
  const recentAcquisitions = memberData?.recent_acquisitions || [];

  return (
    <div className="min-h-screen bg-[#F8FAFC] pb-12">
      {/* Sticky Header */}
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
                My Team Dashboard
              </h2>
              <p className="text-[11px] text-slate-500 font-medium">
                Freelancer Field Network
              </p>
            </div>
          </div>

          <span className="text-[10px] font-bold px-2.5 py-1 rounded-full bg-emerald-50 text-emerald-700 border border-emerald-200">
            Active Member
          </span>
        </div>
      </div>

      <div className="max-w-md mx-auto px-4 pt-4 space-y-4">
        
        {/* Freelancer Code Card */}
        <div className="bg-white rounded-2xl p-5 border border-slate-200 shadow-2xs space-y-4">
          <div className="text-center space-y-1">
            <span className="text-[10px] font-bold text-slate-500 uppercase tracking-wider block">
              Your Freelancer Member Code
            </span>
            <div className="flex items-center justify-center gap-2.5 pt-1">
              <span className="text-2xl font-black text-slate-900 tracking-widest font-mono bg-slate-100 border border-slate-200 px-4 py-2 rounded-xl">
                {memberCode}
              </span>
              <button
                onClick={handleCopyCode}
                className="px-3.5 py-2.5 rounded-xl bg-slate-100 border border-slate-200 text-slate-800 hover:bg-slate-200 transition-colors flex items-center gap-1.5 text-xs font-extrabold shadow-2xs active:scale-95"
                title="Copy Code"
              >
                {copiedCode ? <Check className="w-4 h-4 text-emerald-600" /> : <Copy className="w-4 h-4" />}
                <span>{copiedCode ? "Copied" : "Copy"}</span>
              </button>
            </div>
          </div>

          {/* Share Link */}
          <div className="bg-slate-50 border border-slate-200 rounded-xl p-3 space-y-1.5">
            <span className="text-[10px] font-bold text-slate-500 uppercase tracking-wide block">
              Freelancer Registration Link
            </span>
            <div className="flex items-center justify-between gap-2 bg-white border border-slate-200 rounded-lg px-3 py-2">
              <span className="text-xs font-mono font-semibold text-slate-700 truncate select-all">
                {shareUrl}
              </span>
            </div>
          </div>

          <div className="grid grid-cols-2 gap-2">
            <button
              onClick={handleCopyLink}
              className="w-full bg-slate-100 hover:bg-slate-200 text-slate-800 font-bold text-xs py-3 rounded-xl shadow-2xs flex items-center justify-center gap-1.5 transition-all active:scale-[0.98]"
            >
              {copiedLink ? <Check className="w-3.5 h-3.5 text-emerald-600" /> : <Copy className="w-3.5 h-3.5" />}
              <span>{copiedLink ? "Link Copied" : "Copy Link"}</span>
            </button>

            <button
              onClick={handleNativeShare}
              className="w-full bg-[#047857] hover:bg-[#065f46] text-white font-bold text-xs py-3 rounded-xl shadow-2xs flex items-center justify-center gap-1.5 transition-all active:scale-[0.98]"
            >
              <Share2 className="w-3.5 h-3.5" />
              <span>Share Code</span>
            </button>
          </div>

          <p className="text-[11px] text-slate-500 text-center leading-relaxed">
            Share your freelancer code when onboarding new customers and business drivers. All registrations are credited to your team member record.
          </p>
        </div>

        {/* Privacy Guard Callout */}
        <div className="bg-slate-50 border border-slate-200 rounded-2xl p-3.5 flex items-start gap-3">
          <div className="w-8 h-8 rounded-xl bg-slate-200 text-slate-700 flex items-center justify-center shrink-0 mt-0.5">
            <Lock className="w-4 h-4" />
          </div>
          <div>
            <h4 className="text-xs font-bold text-slate-800 flex items-center gap-1.5">
              Privacy Guard Active
            </h4>
            <p className="text-[11px] text-slate-500 leading-relaxed mt-0.5">
              You have access to your personal acquisition numbers and active status. Financial rates and payout settlements are configured directly by Company Admin and your Team Manager.
            </p>
          </div>
        </div>

        {/* Performance Counters */}
        <div className="space-y-2">
          <h3 className="text-xs font-bold text-slate-700 uppercase tracking-wider">
            Your User Acquisition Stats
          </h3>

          <div className="grid grid-cols-2 gap-2.5">
            {/* Customers Added */}
            <div className="bg-white rounded-xl p-3.5 border border-slate-200 shadow-2xs space-y-1.5">
              <div className="flex items-center gap-2">
                <div className="w-7 h-7 rounded-lg bg-emerald-50 text-emerald-700 flex items-center justify-center">
                  <Users className="w-4 h-4" />
                </div>
                <span className="text-xs font-bold text-slate-800">Customers Added</span>
              </div>
              <p className="text-2xl font-black text-slate-900">
                {custCount}
              </p>
              <p className="text-[10.5px] text-slate-500 font-medium">
                Consumer App registrations
              </p>
            </div>

            {/* Businesses Added */}
            <div className="bg-white rounded-xl p-3.5 border border-slate-200 shadow-2xs space-y-1.5">
              <div className="flex items-center gap-2">
                <div className="w-7 h-7 rounded-lg bg-blue-50 text-blue-700 flex items-center justify-center">
                  <Briefcase className="w-4 h-4" />
                </div>
                <span className="text-xs font-bold text-slate-800">Businesses Added</span>
              </div>
              <p className="text-2xl font-black text-slate-900">
                {bizCount}
              </p>
              <p className="text-[10.5px] text-slate-500 font-medium">
                Drivers & Business Partners
              </p>
            </div>
          </div>

          {/* Territory & Total */}
          <div className="bg-white rounded-xl p-3.5 border border-slate-200 shadow-2xs flex items-center justify-between">
            <div className="flex items-center gap-2.5">
              <div className="w-8 h-8 rounded-lg bg-slate-100 text-slate-700 flex items-center justify-center">
                <MapPin className="w-4 h-4" />
              </div>
              <div>
                <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wide block">
                  Territory & Team
                </span>
                <span className="text-xs font-bold text-slate-800">
                  {location} &bull; {teamType}
                </span>
              </div>
            </div>

            <div className="text-right">
              <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wide block">
                Total Joined
              </span>
              <span className="text-base font-black text-emerald-700">
                {totalCount} Users
              </span>
            </div>
          </div>
        </div>

        {/* Recent Acquisitions List */}
        <div className="space-y-2">
          <h3 className="text-xs font-bold text-slate-700 uppercase tracking-wider flex items-center justify-between">
            <span>Recent Registrations</span>
            <span className="text-[11px] font-semibold text-slate-500">{recentAcquisitions.length} tracked</span>
          </h3>

          <div className="bg-white rounded-2xl border border-slate-200 shadow-2xs overflow-hidden divide-y divide-slate-100">
            {recentAcquisitions.length === 0 ? (
              <div className="p-6 text-center space-y-1.5">
                <UserCheck className="w-8 h-8 text-slate-300 mx-auto" />
                <p className="text-xs font-bold text-slate-700">No Acquisitions Yet</p>
                <p className="text-[11px] text-slate-500">
                  Share your code <strong>{memberCode}</strong> to start onboarding customers and business drivers!
                </p>
              </div>
            ) : (
              recentAcquisitions.map((acq: any, idx: number) => (
                <div key={idx} className="p-3 flex items-center justify-between">
                  <div className="flex items-center gap-2.5">
                    <div className={`w-8 h-8 rounded-lg flex items-center justify-center text-xs font-bold ${
                      acq.user_type === 'business'
                        ? 'bg-blue-50 text-blue-700'
                        : 'bg-emerald-50 text-emerald-700'
                    }`}>
                      {acq.user_type === 'business' ? 'BIZ' : 'CUST'}
                    </div>
                    <div>
                      <p className="text-xs font-bold text-slate-800">
                        {acq.user_name || (acq.user_type === 'business' ? 'Business Partner' : 'Customer User')}
                      </p>
                      <p className="text-[10.5px] text-slate-400 flex items-center gap-1">
                        <Clock className="w-3 h-3" />
                        {acq.joined_date || "Recently"}
                      </p>
                    </div>
                  </div>

                  <span className={`text-[10px] font-bold px-2 py-0.5 rounded-md ${
                    acq.verification_status === 'verified'
                      ? 'bg-emerald-50 text-emerald-700 border border-emerald-200'
                      : 'bg-amber-50 text-amber-700 border border-amber-200'
                  }`}>
                    {acq.verification_status === 'verified' ? 'Verified' : 'In Review'}
                  </span>
                </div>
              ))
            )}
          </div>
        </div>

      </div>
    </div>
  );
}
