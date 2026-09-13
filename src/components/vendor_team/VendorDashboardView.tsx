"use client";

import React, { useState } from "react";
import {
  ChevronLeft,
  Users,
  Briefcase,
  Share2,
  Copy,
  Check,
  CheckCircle2,
  Clock,
  TrendingUp,
  Wallet,
  ShieldCheck,
  MapPin,
  Layers,
  Phone,
  UserCheck
} from "lucide-react";

interface VendorDashboardViewProps {
  onBack: () => void;
  vendorData: any;
  showToast: (msg: string) => void;
}

export default function VendorDashboardView({
  onBack,
  vendorData,
  showToast,
}: VendorDashboardViewProps) {
  const [copiedCode, setCopiedCode] = useState(false);
  const [copiedLink, setCopiedLink] = useState(false);
  const [activeTab, setActiveTab] = useState<"members" | "rates">("members");

  const vendorCode = vendorData?.vendor_code || "TM------";
  const shareUrl = vendorData?.share_url || `https://api.fiinway.com/join/${vendorCode}`;

  const handleCopyCode = () => {
    if (!vendorCode) return;
    if (typeof navigator !== "undefined" && navigator.clipboard) {
      navigator.clipboard.writeText(vendorCode);
    }
    setCopiedCode(true);
    showToast("Vendor code copied to clipboard!");
    setTimeout(() => setCopiedCode(false), 2000);
  };

  const handleCopyLink = () => {
    if (!shareUrl) return;
    if (typeof navigator !== "undefined" && navigator.clipboard) {
      navigator.clipboard.writeText(shareUrl);
    }
    setCopiedLink(true);
    showToast("Freelancer invite link copied!");
    setTimeout(() => setCopiedLink(false), 2000);
  };

  const handleNativeShare = async () => {
    const text = `Join my field marketing team on Fiinway! Use Vendor Code: ${vendorCode}\nRegister here: ${shareUrl}`;
    if (typeof navigator !== "undefined" && navigator.share) {
      try {
        await navigator.share({
          title: "Join as Freelancer under Team Manager",
          text,
          url: shareUrl,
        });
      } catch (_) {}
    } else {
      handleCopyLink();
    }
  };

  const rateCustomer = vendorData?.rate_per_customer ?? 0;
  const rateBusiness = vendorData?.rate_per_business ?? 0;
  const freelancersCount = vendorData?.freelancers_count ?? (vendorData?.team_members?.length ?? 0);
  const totalCustomers = vendorData?.total_customers ?? 0;
  const verifiedCustomers = vendorData?.verified_customers ?? 0;
  const totalBusinesses = vendorData?.total_businesses ?? 0;
  const verifiedBusinesses = vendorData?.verified_businesses ?? 0;
  const totalEarnings = vendorData?.total_earnings ?? 0;
  const paidEarnings = vendorData?.paid_earnings ?? 0;
  const pendingPayout = vendorData?.pending_payout ?? Math.max(0, totalEarnings - paidEarnings);
  const teamMembers = vendorData?.team_members || [];
  const location = vendorData?.team_location || "Territory";
  const teamType = vendorData?.team_type || "Field Marketing";

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
                Team Manager Dashboard
              </h2>
              <p className="text-[11px] text-slate-500 font-medium">
                {location} &bull; {teamType}
              </p>
            </div>
          </div>

          <span className="text-[10px] font-bold px-2.5 py-1 rounded-full bg-emerald-50 text-emerald-700 border border-emerald-200">
            Approved Vendor
          </span>
        </div>
      </div>

      <div className="max-w-md mx-auto px-4 pt-4 space-y-4">
        
        {/* Vendor Hero Code Card */}
        <div className="bg-white rounded-2xl p-5 border border-slate-200 shadow-2xs space-y-4">
          <div className="text-center space-y-1">
            <span className="text-[10px] font-bold text-slate-500 uppercase tracking-wider block">
              Your Team Manager Vendor Code
            </span>
            <div className="flex items-center justify-center gap-2.5 pt-1">
              <span className="text-2xl font-black text-slate-900 tracking-widest font-mono bg-slate-100 border border-slate-200 px-4 py-2 rounded-xl">
                {vendorCode}
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
              Freelancer Invite Link
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
              <span>Invite Freelancers</span>
            </button>
          </div>

          <p className="text-[11px] text-slate-500 text-center leading-relaxed">
            Freelancers who sign up with this code become part of your team, receive an <strong>FR...</strong> code, and all their user acquisitions credit to your vendor earnings.
          </p>
        </div>

        {/* Assigned Payout Rates */}
        <div className="bg-slate-900 text-white rounded-2xl p-4 shadow-sm space-y-3">
          <div className="flex items-center justify-between">
            <span className="text-[11px] font-bold uppercase tracking-wider text-slate-400">
              Admin Configured Payout Rates
            </span>
            <span className="text-[10px] font-semibold bg-emerald-500/20 text-emerald-300 border border-emerald-500/30 px-2 py-0.5 rounded-md">
              Approved
            </span>
          </div>

          <div className="grid grid-cols-2 gap-3 pt-1">
            <div className="bg-slate-800/80 border border-slate-700 rounded-xl p-3">
              <span className="text-[10.5px] font-medium text-slate-400 block">Per Verified Customer</span>
              <span className="text-xl font-extrabold text-emerald-400">
                ₹{Number(rateCustomer).toFixed(2)}
              </span>
            </div>
            <div className="bg-slate-800/80 border border-slate-700 rounded-xl p-3">
              <span className="text-[10.5px] font-medium text-slate-400 block">Per Verified Business</span>
              <span className="text-xl font-extrabold text-blue-400">
                ₹{Number(rateBusiness).toFixed(2)}
              </span>
            </div>
          </div>
        </div>

        {/* Financial Earnings Card */}
        <div className="bg-white rounded-2xl p-4 border border-slate-200 shadow-2xs space-y-3">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <div className="w-8 h-8 rounded-xl bg-emerald-100 text-emerald-700 flex items-center justify-center">
                <Wallet className="w-4 h-4" />
              </div>
              <span className="text-xs font-bold text-slate-800">Verified Team Earnings</span>
            </div>
            <span className="text-xs font-black text-emerald-700 text-base">
              ₹{Number(totalEarnings).toLocaleString()}
            </span>
          </div>

          <div className="grid grid-cols-2 gap-2 pt-1 border-t border-slate-100">
            <div className="bg-slate-50 rounded-xl p-2.5">
              <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wide block">
                Unsettled Due
              </span>
              <span className="text-sm font-extrabold text-amber-700">
                ₹{Number(pendingPayout).toLocaleString()}
              </span>
            </div>
            <div className="bg-slate-50 rounded-xl p-2.5">
              <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wide block">
                Paid by Admin
              </span>
              <span className="text-sm font-extrabold text-slate-700">
                ₹{Number(paidEarnings).toLocaleString()}
              </span>
            </div>
          </div>
        </div>

        {/* Team Performance Overview */}
        <div className="space-y-2">
          <h3 className="text-xs font-bold text-slate-700 uppercase tracking-wider">
            Team Acquisition Metrics
          </h3>

          <div className="grid grid-cols-3 gap-2">
            <div className="bg-white rounded-xl p-3 border border-slate-200 shadow-2xs text-center space-y-1">
              <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wide block">
                Freelancers
              </span>
              <p className="text-xl font-black text-slate-900">
                {freelancersCount}
              </p>
              <span className="text-[10px] font-medium text-slate-500">In your team</span>
            </div>

            <div className="bg-white rounded-xl p-3 border border-slate-200 shadow-2xs text-center space-y-1">
              <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wide block">
                Customers
              </span>
              <p className="text-xl font-black text-slate-900">
                {totalCustomers}
              </p>
              <span className="text-[10px] font-bold text-emerald-600">{verifiedCustomers} verified</span>
            </div>

            <div className="bg-white rounded-xl p-3 border border-slate-200 shadow-2xs text-center space-y-1">
              <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wide block">
                Businesses
              </span>
              <p className="text-xl font-black text-slate-900">
                {totalBusinesses}
              </p>
              <span className="text-[10px] font-bold text-blue-600">{verifiedBusinesses} verified</span>
            </div>
          </div>
        </div>

        {/* Team Freelancers List */}
        <div className="space-y-2">
          <h3 className="text-xs font-bold text-slate-700 uppercase tracking-wider flex items-center justify-between">
            <span>Freelancers under You</span>
            <span className="text-[11px] font-semibold text-slate-500">{teamMembers.length} members</span>
          </h3>

          <div className="bg-white rounded-2xl border border-slate-200 shadow-2xs overflow-hidden divide-y divide-slate-100">
            {teamMembers.length === 0 ? (
              <div className="p-6 text-center space-y-1.5">
                <Users className="w-8 h-8 text-slate-300 mx-auto" />
                <p className="text-xs font-bold text-slate-700">No Freelancers Registered Yet</p>
                <p className="text-[11px] text-slate-500">
                  Share your Vendor Code <strong>{vendorCode}</strong> with team members to register them under you.
                </p>
              </div>
            ) : (
              teamMembers.map((m: any, idx: number) => (
                <div key={idx} className="p-3.5 space-y-2">
                  <div className="flex items-center justify-between">
                    <div>
                      <h4 className="text-xs font-bold text-slate-900">{m.name}</h4>
                      <p className="text-[11px] text-slate-400 font-mono flex items-center gap-1.5 mt-0.5">
                        <span className="font-bold text-slate-700">{m.member_code}</span>
                        {m.phone && <span>&bull; {m.phone}</span>}
                      </p>
                    </div>

                    <span className="text-[10px] font-bold px-2 py-0.5 rounded-md bg-emerald-50 text-emerald-700 border border-emerald-200">
                      Active
                    </span>
                  </div>

                  <div className="flex items-center justify-between bg-slate-50 rounded-xl px-3 py-2 text-xs">
                    <span className="text-slate-600">
                      Customers: <strong className="text-slate-900 font-bold">{m.customers_count ?? 0}</strong>
                    </span>
                    <span className="text-slate-600">
                      Businesses: <strong className="text-slate-900 font-bold">{m.businesses_count ?? 0}</strong>
                    </span>
                    <span className="text-slate-400 text-[10.5px]">
                      Joined {m.joined_date || "Recently"}
                    </span>
                  </div>
                </div>
              ))
            )}
          </div>
        </div>

      </div>
    </div>
  );
}
