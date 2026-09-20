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
  Wallet,
  MapPin,
  Layers,
  Phone,
  UserCheck,
  Search,
  XCircle,
  AlertCircle,
  Store,
  ChevronRight,
  User,
  Download,
  TrendingUp,
  Smartphone,
  Info,
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
  const [copiedFreelancerCode, setCopiedFreelancerCode] = useState(false);
  const [selectedMember, setSelectedMember] = useState<any | null>(null);
  const [subTab, setSubTab] = useState<"all" | "verified" | "pending" | "rejected">("all");
  const [searchQuery, setSearchQuery] = useState("");
  const [rejectionRemarkModal, setRejectionRemarkModal] = useState<{
    open: boolean;
    name: string;
    remark: string;
    phone?: string;
    date?: string;
  } | null>(null);

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

  const handleCopyFreelancerCode = (code: string) => {
    if (!code) return;
    if (typeof navigator !== "undefined" && navigator.clipboard) {
      navigator.clipboard.writeText(code);
    }
    setCopiedFreelancerCode(true);
    showToast(`Freelancer code ${code} copied!`);
    setTimeout(() => setCopiedFreelancerCode(false), 2000);
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

  const rateCustomer = Number(vendorData?.rate_per_customer ?? 0);
  const rateBusiness = Number(vendorData?.rate_per_business ?? 0);
  const freelancersCount = vendorData?.freelancers_count ?? (vendorData?.team_members?.length ?? 0);

  // App Install / Total registrations
  const totalCustomers = Number(vendorData?.total_customers ?? vendorData?.customer_joined ?? 0);
  const totalBusinesses = Number(vendorData?.total_businesses ?? vendorData?.business_joined ?? 0);
  const totalInstall = Number(vendorData?.total_install ?? (totalCustomers + totalBusinesses));

  // Verified / Pending / Rejected
  const verifiedCustomers = Number(vendorData?.verified_customers ?? vendorData?.customer_verified ?? 0);
  const verifiedBusinesses = Number(vendorData?.verified_businesses ?? vendorData?.business_verified ?? 0);
  const totalVerified = Number(vendorData?.total_verified ?? (verifiedCustomers + verifiedBusinesses));

  const pendingCustomers = Number(vendorData?.customer_pending ?? Math.max(0, totalCustomers - verifiedCustomers));
  const pendingBusinesses = Number(vendorData?.business_pending ?? Math.max(0, totalBusinesses - verifiedBusinesses));
  const totalPending = Number(vendorData?.total_pending ?? (pendingCustomers + pendingBusinesses));

  const rejectedCustomers = Number(vendorData?.customer_rejected ?? 0);
  const rejectedBusinesses = Number(vendorData?.business_rejected ?? 0);
  const totalRejected = Number(vendorData?.total_rejected ?? (rejectedCustomers + rejectedBusinesses));

  // Dues & Upcoming
  const customerDue = Number(vendorData?.customer_due ?? (verifiedCustomers * rateCustomer));
  const businessDue = Number(vendorData?.business_due ?? (verifiedBusinesses * rateBusiness));
  const totalVerifiedDue = Number(vendorData?.total_verified_due ?? (customerDue + businessDue));

  const customerUpcoming = Number(vendorData?.customer_upcoming ?? (pendingCustomers * rateCustomer));
  const businessUpcoming = Number(vendorData?.business_upcoming ?? (pendingBusinesses * rateBusiness));
  const totalUpcomingIncome = Number(vendorData?.total_upcoming_income ?? (customerUpcoming + businessUpcoming));

  const totalEarnings = vendorData?.total_earnings ?? totalVerifiedDue;
  const paidEarnings = Number(vendorData?.paid_earnings ?? 0);
  const pendingPayout = vendorData?.pending_payout ?? Math.max(0, totalEarnings - paidEarnings);
  const teamMembers = vendorData?.team_members || [];
  const location = vendorData?.team_location || "Territory";
  const teamType = vendorData?.team_type || "Field Marketing";

  // ──────────────────────────────────────────────────────────────────────────
  // VIEW 2: FREELANCER ACQUISITIONS DRILL-DOWN (Reference Screen)
  // ──────────────────────────────────────────────────────────────────────────
  if (selectedMember) {
    const memberAcquisitions: any[] = selectedMember.acquisitions || [];

    const filteredAcquisitions = memberAcquisitions.filter((item: any) => {
      // Tab filter
      if (subTab === "verified" && item.verification_status !== "verified") return false;
      if (subTab === "pending" && item.verification_status !== "pending") return false;
      if (subTab === "rejected" && item.verification_status !== "rejected") return false;

      // Search filter
      if (searchQuery.trim()) {
        const query = searchQuery.toLowerCase().trim();
        const nameMatch = (item.name || "").toLowerCase().includes(query);
        const phoneMatch = (item.phone || "").toLowerCase().includes(query);
        const zoneMatch = (item.zone || "").toLowerCase().includes(query);
        return nameMatch || phoneMatch || zoneMatch;
      }
      return true;
    });

    const totalVerified = selectedMember.verified_count ?? 0;
    const totalPending = selectedMember.pending_count ?? 0;
    const totalRejected = selectedMember.rejected_count ?? 0;
    const totalUsers = selectedMember.total_users ?? (totalVerified + totalPending + totalRejected);

    return (
      <div className="min-h-screen bg-[#F8FAFC] pb-12">
        {/* Sticky Header */}
        <div className="bg-white border-b border-slate-200 sticky top-0 z-30 shadow-2xs">
          <div className="max-w-md mx-auto px-4 py-3 flex items-center justify-between">
            <div className="flex items-center gap-2.5">
              <button
                onClick={() => setSelectedMember(null)}
                className="p-2 rounded-xl bg-slate-100 hover:bg-slate-200 text-slate-700 transition-colors shrink-0"
                title="Back to Team Manager"
              >
                <ChevronLeft className="w-4 h-4 stroke-[2.5]" />
              </button>
              <div>
                <h2 className="text-sm font-bold text-slate-900 leading-tight">
                  Freelancer Details
                </h2>
                <p className="text-[11px] text-slate-500 font-medium">
                  {selectedMember.name} &bull; {selectedMember.member_code}
                </p>
              </div>
            </div>

            <button
              onClick={() => setSelectedMember(null)}
              className="text-[11px] font-bold text-slate-600 hover:text-slate-900 bg-slate-100 px-2.5 py-1 rounded-lg transition-colors"
            >
              Close
            </button>
          </div>
        </div>

        <div className="max-w-md mx-auto px-4 pt-4 space-y-4">
          
          {/* Freelancer Profile Card (matches screenshot top card) */}
          <div className="bg-white rounded-2xl p-4 border border-slate-200 shadow-2xs">
            <div className="flex items-start gap-3">
              <div className="w-14 h-14 rounded-2xl bg-gradient-to-br from-emerald-100 to-emerald-200 text-emerald-800 flex items-center justify-center font-bold text-xl shrink-0 overflow-hidden shadow-2xs border border-emerald-300">
                {selectedMember.photo ? (
                  <img
                    src={selectedMember.photo}
                    alt={selectedMember.name}
                    className="w-full h-full object-cover"
                  />
                ) : (
                  <User className="w-7 h-7 text-emerald-700" />
                )}
              </div>

              <div className="flex-1 min-w-0">
                <div className="flex items-center justify-between gap-1.5">
                  <h3 className="text-base font-bold text-slate-900 truncate">
                    {selectedMember.name}
                  </h3>
                  <span className="text-[10px] font-bold px-2 py-0.5 rounded-full bg-emerald-50 text-emerald-700 border border-emerald-200 shrink-0">
                    Active
                  </span>
                </div>

                <div className="flex items-center gap-1.5 mt-0.5">
                  <span className="text-xs text-slate-500">Freelancer Code:</span>
                  <span className="text-xs font-bold text-slate-800 font-mono">
                    {selectedMember.member_code}
                  </span>
                  <button
                    onClick={() => handleCopyFreelancerCode(selectedMember.member_code)}
                    className="p-1 text-slate-400 hover:text-slate-700"
                    title="Copy code"
                  >
                    {copiedFreelancerCode ? (
                      <Check className="w-3.5 h-3.5 text-emerald-600" />
                    ) : (
                      <Copy className="w-3.5 h-3.5" />
                    )}
                  </button>
                </div>

                <div className="flex items-center gap-3 text-[11px] text-slate-500 mt-1">
                  <span>Zone: <strong className="text-slate-700 font-semibold">{selectedMember.zone || location}</strong></span>
                  <span>Joined: <strong className="text-slate-700 font-semibold">{selectedMember.joined_at || "Recent"}</strong></span>
                </div>
              </div>
            </div>

            {/* Metrics 4-Box Row (matches screenshot Row 1) */}
            <div className="grid grid-cols-4 gap-2 mt-4 pt-3 border-t border-slate-100 text-center">
              <div className="bg-blue-50/60 border border-blue-100 rounded-xl p-2">
                <div className="w-5 h-5 rounded-md bg-blue-100 text-blue-700 flex items-center justify-center mx-auto mb-1">
                  <Users className="w-3 h-3" />
                </div>
                <span className="text-base font-black text-slate-900 block leading-none">
                  {totalUsers}
                </span>
                <span className="text-[9px] text-slate-500 font-medium leading-tight block mt-1">
                  Total Users
                </span>
              </div>

              <div className="bg-emerald-50/60 border border-emerald-100 rounded-xl p-2">
                <div className="w-5 h-5 rounded-md bg-emerald-100 text-emerald-700 flex items-center justify-center mx-auto mb-1">
                  <CheckCircle2 className="w-3 h-3" />
                </div>
                <span className="text-base font-black text-emerald-700 block leading-none">
                  {totalVerified}
                </span>
                <span className="text-[9px] text-slate-500 font-medium leading-tight block mt-1">
                  Verified
                </span>
              </div>

              <div className="bg-amber-50/60 border border-amber-100 rounded-xl p-2">
                <div className="w-5 h-5 rounded-md bg-amber-100 text-amber-700 flex items-center justify-center mx-auto mb-1">
                  <Clock className="w-3 h-3" />
                </div>
                <span className="text-base font-black text-amber-700 block leading-none">
                  {totalPending}
                </span>
                <span className="text-[9px] text-slate-500 font-medium leading-tight block mt-1">
                  Pending
                </span>
              </div>

              <div className="bg-rose-50/60 border border-rose-100 rounded-xl p-2">
                <div className="w-5 h-5 rounded-md bg-rose-100 text-rose-700 flex items-center justify-center mx-auto mb-1">
                  <XCircle className="w-3 h-3" />
                </div>
                <span className="text-base font-black text-rose-700 block leading-none">
                  {totalRejected}
                </span>
                <span className="text-[9px] text-slate-500 font-medium leading-tight block mt-1">
                  Rejected
                </span>
              </div>
            </div>

            {/* Metrics 3-Box Row (matches screenshot Row 2) */}
            <div className="grid grid-cols-3 gap-2 mt-2">
              <div className="bg-slate-50 border border-slate-200/80 rounded-xl p-2.5 flex items-center gap-2">
                <div className="w-7 h-7 rounded-lg bg-blue-100 text-blue-700 flex items-center justify-center shrink-0">
                  <User className="w-3.5 h-3.5" />
                </div>
                <div className="min-w-0">
                  <span className="text-sm font-black text-slate-900 block leading-none">
                    {selectedMember.customers_total ?? 0}
                  </span>
                  <span className="text-[9.5px] text-slate-500 font-medium truncate block mt-0.5">
                    User Downloads
                  </span>
                </div>
              </div>

              <div className="bg-slate-50 border border-slate-200/80 rounded-xl p-2.5 flex items-center gap-2">
                <div className="w-7 h-7 rounded-lg bg-emerald-100 text-emerald-700 flex items-center justify-center shrink-0">
                  <Store className="w-3.5 h-3.5" />
                </div>
                <div className="min-w-0">
                  <span className="text-sm font-black text-slate-900 block leading-none">
                    {selectedMember.businesses_total ?? 0}
                  </span>
                  <span className="text-[9.5px] text-slate-500 font-medium truncate block mt-0.5">
                    Business Added
                  </span>
                </div>
              </div>

              <div className="bg-slate-50 border border-slate-200/80 rounded-xl p-2.5 flex items-center gap-2">
                <div className="w-7 h-7 rounded-lg bg-purple-100 text-purple-700 flex items-center justify-center shrink-0">
                  <Wallet className="w-3.5 h-3.5" />
                </div>
                <div className="min-w-0">
                  <span className="text-sm font-black text-purple-700 block leading-none truncate">
                    ₹{Number(selectedMember.total_earnings ?? 0).toLocaleString()}
                  </span>
                  <span className="text-[9.5px] text-slate-500 font-medium truncate block mt-0.5">
                    Total Earning
                  </span>
                </div>
              </div>
            </div>

          </div>

          {/* Filter Tabs (matches screenshot tabs) */}
          <div className="flex items-center gap-1.5 overflow-x-auto pb-0.5">
            <button
              onClick={() => setSubTab("all")}
              className={`text-xs font-bold px-3.5 py-2 rounded-xl transition-all shrink-0 ${
                subTab === "all"
                  ? "bg-blue-600 text-white shadow-xs"
                  : "bg-white text-slate-600 border border-slate-200 hover:bg-slate-50"
              }`}
            >
              User List ({totalUsers})
            </button>
            <button
              onClick={() => setSubTab("verified")}
              className={`text-xs font-bold px-3.5 py-2 rounded-xl transition-all shrink-0 ${
                subTab === "verified"
                  ? "bg-emerald-600 text-white shadow-xs"
                  : "bg-white text-slate-600 border border-slate-200 hover:bg-slate-50"
              }`}
            >
              Verified ({totalVerified})
            </button>
            <button
              onClick={() => setSubTab("pending")}
              className={`text-xs font-bold px-3.5 py-2 rounded-xl transition-all shrink-0 ${
                subTab === "pending"
                  ? "bg-amber-600 text-white shadow-xs"
                  : "bg-white text-slate-600 border border-slate-200 hover:bg-slate-50"
              }`}
            >
              Pending ({totalPending})
            </button>
            <button
              onClick={() => setSubTab("rejected")}
              className={`text-xs font-bold px-3.5 py-2 rounded-xl transition-all shrink-0 ${
                subTab === "rejected"
                  ? "bg-rose-600 text-white shadow-xs"
                  : "bg-white text-slate-600 border border-slate-200 hover:bg-slate-50"
              }`}
            >
              Rejected ({totalRejected})
            </button>
          </div>

          {/* Search Bar (matches screenshot search bar) */}
          <div className="relative">
            <Search className="w-4 h-4 text-slate-400 absolute left-3.5 top-1/2 -translate-y-1/2" />
            <input
              type="text"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              placeholder="Search by name or number..."
              className="w-full bg-white border border-slate-200 rounded-xl pl-9 pr-4 py-2.5 text-xs text-slate-800 placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 transition-all shadow-2xs"
            />
            {searchQuery && (
              <button
                onClick={() => setSearchQuery("")}
                className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600 text-xs"
              >
                Clear
              </button>
            )}
          </div>

          {/* Table / List Container (matches screenshot table layout) */}
          <div className="bg-white rounded-2xl border border-slate-200 shadow-2xs overflow-hidden">
            
            {/* Table Header */}
            <div className="grid grid-cols-12 bg-slate-50/80 border-b border-slate-200 px-3 py-2.5 text-[10px] font-bold text-slate-500 uppercase tracking-wider">
              <div className="col-span-3">DATE</div>
              <div className="col-span-4">NAME / NUMBER</div>
              <div className="col-span-2 text-center">ZONE</div>
              <div className="col-span-3 text-right">STATUS</div>
            </div>

            {/* Table Body */}
            {filteredAcquisitions.length === 0 ? (
              <div className="p-8 text-center space-y-2">
                <UserCheck className="w-8 h-8 text-slate-300 mx-auto" />
                <p className="text-xs font-bold text-slate-700">No User Records Found</p>
                <p className="text-[11px] text-slate-400 max-w-xs mx-auto">
                  {searchQuery
                    ? `No registered users matched "${searchQuery}".`
                    : `No records in the "${subTab}" category for this freelancer.`}
                </p>
              </div>
            ) : (
              <div className="divide-y divide-slate-100">
                {filteredAcquisitions.map((acq: any, idx: number) => {
                  const isVerified = acq.verification_status === "verified";
                  const isRejected = acq.verification_status === "rejected";
                  const isPending = !isVerified && !isRejected;

                  return (
                    <div
                      key={idx}
                      className="grid grid-cols-12 items-center px-3 py-3 hover:bg-slate-50/50 transition-colors gap-1"
                    >
                      {/* DATE */}
                      <div className="col-span-3 text-[11px] text-slate-600 font-medium">
                        {acq.date || "Recent"}
                      </div>

                      {/* NAME / NUMBER */}
                      <div className="col-span-4 min-w-0 pr-1">
                        <p className="text-xs font-bold text-slate-900 truncate">
                          {acq.name || "Customer User"}
                        </p>
                        <p className="text-[10.5px] font-mono text-slate-500 tracking-tight truncate">
                          {acq.phone || "---"}
                        </p>
                      </div>

                      {/* ZONE */}
                      <div className="col-span-2 text-center text-[10.5px] font-bold text-slate-700 uppercase truncate">
                        {acq.zone || selectedMember.zone || "DELHI"}
                      </div>

                      {/* STATUS + COUNTDOWN */}
                      <div className="col-span-3 text-right">
                        {isVerified && (
                          <span className="text-[9.5px] font-black px-2 py-0.5 rounded-md bg-emerald-50 text-emerald-700 border border-emerald-200 inline-block uppercase tracking-wider">
                            VERIFIED
                          </span>
                        )}

                        {isPending && (
                          <div>
                            <span className="text-[9.5px] font-black px-2 py-0.5 rounded-md bg-amber-50 text-amber-700 border border-amber-200 inline-block uppercase tracking-wider">
                              PENDING
                            </span>
                            <span className="text-[9.5px] text-amber-600 font-bold block mt-0.5 leading-none">
                              {acq.hours_left !== null && acq.hours_left !== undefined
                                ? `${acq.hours_left} hour left`
                                : "72 hour left"}
                            </span>
                          </div>
                        )}

                        {isRejected && (
                          <div className="inline-flex items-center gap-1 justify-end">
                            <span className="text-[9.5px] font-black px-1.5 py-0.5 rounded-md bg-rose-50 text-rose-700 border border-rose-200 uppercase tracking-wider">
                              REJECT
                            </span>
                            <button
                              type="button"
                              onClick={(e) => {
                                e.stopPropagation();
                                setRejectionRemarkModal({
                                  open: true,
                                  name: acq.name || "Customer User",
                                  remark: acq.rejection_reason || acq.remarks || "No specific rejection reason provided by Admin.",
                                  phone: acq.phone,
                                  date: acq.date,
                                });
                              }}
                              className="w-4 h-4 rounded-full bg-rose-100 hover:bg-rose-200 text-rose-700 flex items-center justify-center transition-colors shadow-2xs cursor-pointer shrink-0"
                              title="View rejection remark from Admin"
                            >
                              <Info className="w-2.5 h-2.5 stroke-[2.5]" />
                            </button>
                          </div>
                        )}
                      </div>
                    </div>
                  );
                })}
              </div>
            )}

          </div>

        </div>

        {/* Admin Rejection Remark Modal (User Request 1) */}
        {rejectionRemarkModal?.open && (
          <div className="fixed inset-0 z-50 bg-slate-900/60 backdrop-blur-xs flex items-center justify-center p-4 animate-fade-in">
            <div className="bg-white rounded-2xl max-w-sm w-full p-4 border border-slate-200 shadow-xl space-y-3 animate-scale-in">
              <div className="flex items-center justify-between pb-2 border-b border-slate-100">
                <div className="flex items-center gap-2">
                  <div className="w-7 h-7 rounded-lg bg-rose-100 text-rose-700 flex items-center justify-center shrink-0">
                    <AlertCircle className="w-4 h-4" />
                  </div>
                  <div>
                    <h4 className="text-xs font-bold text-slate-900">Rejection Remark</h4>
                    <p className="text-[10px] text-slate-500">
                      {rejectionRemarkModal.name} {rejectionRemarkModal.phone ? `• ${rejectionRemarkModal.phone}` : ""}
                    </p>
                  </div>
                </div>
                <button
                  onClick={() => setRejectionRemarkModal(null)}
                  className="w-6 h-6 rounded-lg bg-slate-100 hover:bg-slate-200 text-slate-500 hover:text-slate-800 flex items-center justify-center text-xs font-bold transition-colors"
                >
                  ✕
                </button>
              </div>

              <div className="bg-rose-50/70 border border-rose-100 rounded-xl p-3 space-y-1">
                <span className="text-[9.5px] font-bold uppercase tracking-wider text-rose-800 block">
                  Admin Feedback / Reason:
                </span>
                <p className="text-xs text-slate-800 leading-relaxed font-medium">
                  {rejectionRemarkModal.remark}
                </p>
              </div>

              {rejectionRemarkModal.date && (
                <p className="text-[10px] text-slate-400 text-right">
                  Acquisition Date: {rejectionRemarkModal.date}
                </p>
              )}

              <button
                onClick={() => setRejectionRemarkModal(null)}
                className="w-full py-2 rounded-xl bg-slate-900 text-white text-xs font-bold hover:bg-slate-800 transition-colors shadow-2xs"
              >
                Close
              </button>
            </div>
          </div>
        )}
      </div>
    );
  }

  // ──────────────────────────────────────────────────────────────────────────
  // VIEW 1: MAIN TEAM MANAGER DASHBOARD
  // ──────────────────────────────────────────────────────────────────────────
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
            Approved 
          </span>
        </div>
      </div>

      <div className="max-w-md mx-auto px-3.5 pt-3 space-y-3">
        
        {/* Vendor Hero Code Card */}
        <div className="bg-white rounded-2xl p-4 border border-slate-200 shadow-2xs space-y-3">
          <div className="text-center space-y-1">
            <span className="text-[10px] font-bold text-slate-500 uppercase tracking-wider block">
              Your  Vendor Code
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

          <div className="grid grid-cols-3 gap-2 pt-1 border-t border-slate-100 text-center">
            <div className="bg-slate-50 rounded-xl p-2">
              <span className="text-[9px] font-bold text-slate-400 uppercase tracking-wide block truncate">
                Freelancer Count
              </span>
              <span className="text-sm font-black text-slate-900">
                {teamMembers.length}
              </span>
            </div>
            <div className="bg-slate-50 rounded-xl p-2">
              <span className="text-[9px] font-bold text-slate-400 uppercase tracking-wide block truncate">
                (Total) Unsettled Due
              </span>
              <span className="text-sm font-black text-amber-700">
                ₹{Number(pendingPayout).toLocaleString()}
              </span>
            </div>
            <div className="bg-slate-50 rounded-xl p-2">
              <span className="text-[9px] font-bold text-slate-400 uppercase tracking-wide block truncate">
                Paid by Admin
              </span>
              <span className="text-sm font-black text-emerald-700">
                ₹{Number(paidEarnings).toLocaleString()}
              </span>
            </div>
          </div>
        </div>

        {/* ── Box 1: Status Breakdown (Verified, Pending, Reject) ── */}
        <div className="bg-white rounded-2xl p-4 border border-slate-200 shadow-2xs space-y-3">
          <div className="grid grid-cols-3 gap-2 text-center divide-x divide-slate-100">
            {/* TOTAL VERIFIED */}
            <div className="space-y-1">
              <div className="flex items-center justify-center gap-1 text-[10px] font-black text-emerald-700 uppercase tracking-wider">
                <CheckCircle2 className="w-3.5 h-3.5" />
                <span>TOTAL VERIFIED</span>
              </div>
              <p className="text-2xl font-black text-emerald-700 leading-none">
                {totalVerified}
              </p>
              <div className="pt-1 text-[11px] font-bold text-slate-700 flex items-center justify-center gap-1.5">
                <span>{verifiedCustomers}</span>
                <span className="text-slate-300">|</span>
                <span>{verifiedBusinesses}</span>
              </div>
              <div className="text-[9px] font-semibold text-slate-400 flex items-center justify-center gap-2">
                <span>User</span>
                <span>|</span>
                <span>Buss</span>
              </div>
            </div>

            {/* TOTAL PENDING */}
            <div className="space-y-1 pl-1">
              <div className="flex items-center justify-center gap-1 text-[10px] font-black text-amber-700 uppercase tracking-wider">
                <Clock className="w-3.5 h-3.5" />
                <span>TOTAL PENDING</span>
              </div>
              <p className="text-2xl font-black text-amber-700 leading-none">
                {totalPending}
              </p>
              <div className="pt-1 text-[11px] font-bold text-slate-700 flex items-center justify-center gap-1.5">
                <span>{pendingCustomers}</span>
                <span className="text-slate-300">|</span>
                <span>{pendingBusinesses}</span>
              </div>
              <div className="text-[9px] font-semibold text-slate-400 flex items-center justify-center gap-2">
                <span>User</span>
                <span>|</span>
                <span>Buss</span>
              </div>
            </div>

            {/* TOTAL REJECT */}
            <div className="space-y-1 pl-1">
              <div className="flex items-center justify-center gap-1 text-[10px] font-black text-rose-700 uppercase tracking-wider">
                <XCircle className="w-3.5 h-3.5" />
                <span>TOTAL REJECT</span>
              </div>
              <p className="text-2xl font-black text-rose-700 leading-none">
                {totalRejected}
              </p>
              <div className="pt-1 text-[11px] font-bold text-slate-700 flex items-center justify-center gap-1.5">
                <span>{rejectedCustomers}</span>
                <span className="text-slate-300">|</span>
                <span>{rejectedBusinesses}</span>
              </div>
              <div className="text-[9px] font-semibold text-slate-400 flex items-center justify-center gap-2">
                <span>User</span>
                <span>|</span>
                <span>Buss</span>
              </div>
            </div>
          </div>
        </div>

        {/* ── Box 2: APP INSTALL (Total Registration count) ── */}
        <div className="bg-white rounded-2xl p-4 border border-slate-200 shadow-2xs space-y-3">
          <div className="flex items-center justify-between border-b border-slate-100 pb-2">
            <div className="flex items-center gap-2">
              <div className="w-6 h-6 rounded-lg bg-indigo-50 text-indigo-700 flex items-center justify-center">
                <Download className="w-3.5 h-3.5" />
              </div>
              <span className="text-xs font-black text-slate-800 uppercase tracking-wider">
                APP INSTALL
              </span>
            </div>
            <div className="flex items-center gap-1 text-[10px] font-bold text-slate-400 uppercase tracking-wider">
              <Smartphone className="w-3 h-3" />
              <span>Total Registration count</span>
            </div>
          </div>

          <div className="grid grid-cols-3 gap-2 text-center divide-x divide-slate-100">
            <div>
              <span className="text-[11px] font-bold text-slate-600 block">User</span>
              <p className="text-xl font-black text-slate-900 mt-0.5">{totalCustomers}</p>
            </div>
            <div className="pl-1">
              <span className="text-[11px] font-bold text-slate-600 block">Business</span>
              <p className="text-xl font-black text-slate-900 mt-0.5">{totalBusinesses}</p>
            </div>
            <div className="pl-1">
              <span className="text-[11px] font-bold text-indigo-700 block">TOTAL INSTALL</span>
              <p className="text-xl font-black text-indigo-700 mt-0.5">{totalInstall}</p>
            </div>
          </div>
        </div>

        {/* ── Box 3: Verified Due & Upcoming Income (Customer Due & Business Due) ── */}
        <div className="bg-white rounded-2xl p-4 border border-slate-200 shadow-2xs space-y-3">
          <div className="grid grid-cols-2 gap-3 divide-x divide-slate-100">
            {/* VERIFIED DUE */}
            <div className="space-y-1.5">
              <div className="flex items-center gap-1.5 text-[11px] font-black text-emerald-800 uppercase tracking-wider">
                <UserCheck className="w-3.5 h-3.5 text-emerald-600" />
                <span>VERIFIED DUE</span>
              </div>
              <div className="flex items-center gap-2 pt-0.5">
                <div className="flex-1 bg-emerald-50/60 rounded-xl p-2 text-center border border-emerald-100">
                  <span className="text-sm font-black text-emerald-700 block">₹{customerDue.toLocaleString()}</span>
                  <span className="text-[9.5px] font-bold text-emerald-800 uppercase tracking-tight">Customer</span>
                </div>
                <div className="flex-1 bg-blue-50/60 rounded-xl p-2 text-center border border-blue-100">
                  <span className="text-sm font-black text-blue-700 block">₹{businessDue.toLocaleString()}</span>
                  <span className="text-[9.5px] font-bold text-blue-800 uppercase tracking-tight">Business</span>
                </div>
              </div>
              <div className="text-[10px] text-slate-500 font-medium text-center pt-0.5">
                Total Due: <strong className="text-slate-900 font-bold">₹{totalVerifiedDue.toLocaleString()}</strong>
              </div>
            </div>

            {/* UPCOMING INCOME */}
            <div className="space-y-1.5 pl-3">
              <div className="flex items-center gap-1.5 text-[11px] font-black text-amber-800 uppercase tracking-wider">
                <TrendingUp className="w-3.5 h-3.5 text-amber-600" />
                <span>INCOME</span>
              </div>
              <div className="flex items-center gap-2 pt-0.5">
                <div className="flex-1 bg-amber-50/60 rounded-xl p-2 text-center border border-amber-100">
                  <span className="text-sm font-black text-amber-700 block">₹{customerUpcoming.toLocaleString()}</span>
                  <span className="text-[9.5px] font-bold text-amber-800 uppercase tracking-tight">Customer</span>
                </div>
                <div className="flex-1 bg-indigo-50/60 rounded-xl p-2 text-center border border-indigo-100">
                  <span className="text-sm font-black text-indigo-700 block">₹{businessUpcoming.toLocaleString()}</span>
                  <span className="text-[9.5px] font-bold text-indigo-800 uppercase tracking-tight">Business</span>
                </div>
              </div>
              <div className="text-[10px] text-slate-500 font-medium text-center pt-0.5">
                Total Upcoming: <strong className="text-slate-900 font-bold">₹{totalUpcomingIncome.toLocaleString()}</strong>
              </div>
            </div>
          </div>
        </div>

        {/* Team Freelancers List (Clickable to view detailed acquisitions) */}
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
              teamMembers.map((m: any, idx: number) => {
                const totalAcqs = m.total_users ?? ((m.customers_total ?? 0) + (m.businesses_total ?? 0));
                const verAcqs = m.verified_count ?? ((m.customers_verified ?? 0) + (m.businesses_verified ?? 0));
                const pendAcqs = m.pending_count ?? 0;
                const rejAcqs = m.rejected_count ?? 0;
                const custCount = m.customers_total ?? 0;
                const bizCount = m.businesses_total ?? 0;

                return (
                  <div
                    key={idx}
                    onClick={() => {
                      setSelectedMember(m);
                      setSubTab("all");
                      setSearchQuery("");
                    }}
                    className="p-3.5 space-y-2 hover:bg-slate-50/80 cursor-pointer transition-all active:scale-[0.99]"
                  >
                    <div className="flex items-center justify-between">
                      <div className="flex items-center gap-2 min-w-0 flex-1 mr-2">
                       
                        <div className="min-w-0 flex-1">
                          <h4 className="text-xs font-bold text-slate-900 flex items-center gap-1.5 truncate">
                            <span className="truncate">{m.name}</span>
                            
                          </h4>
                          <p className="text-[10.5px] text-slate-400 font-mono flex items-center gap-1.5 mt-0.5 truncate">
                            <span className="font-bold text-slate-700">{m.member_code}</span>
                            {m.phone && <span className="truncate">&bull; {m.phone}</span>}
                          </p>
                        </div>
                      </div>

                      {/* Top Right: User & Business count badges + View Details */}
                      <div className="flex items-center gap-1.5 shrink-0">
                        <div className="text-center px-1.5 py-0.5 rounded-lg bg-blue-50 border border-blue-100 shrink-0 min-w-[32px]">
                          <span className="text-[11px] font-black text-blue-700 block leading-tight">{custCount}</span>
                          <span className="text-[7.5px] font-bold text-blue-600 block uppercase tracking-tight">User</span>
                        </div>
                        <div className="text-center px-1.5 py-0.5 rounded-lg bg-purple-50 border border-purple-100 shrink-0 min-w-[32px]">
                          <span className="text-[11px] font-black text-purple-700 block leading-tight">{bizCount}</span>
                          <span className="text-[7.5px] font-bold text-purple-600 block uppercase tracking-tight">Busin</span>
                        </div>
                        <div className="flex items-center gap-0.5 px-2 py-1 rounded-lg bg-blue-50 text-blue-600 hover:bg-blue-100 transition-colors whitespace-nowrap shrink-0">
                          <span className="text-[10px] font-bold">More</span>
                          <ChevronRight className="w-3 h-3 stroke-[2.5]" />
                        </div>
                      </div>
                    </div>

                    {/* Stats row (matches Image 2 bottom row: Total | Ver | Pend | Rej | Joined) */}
                    <div className="grid grid-cols-5 items-center bg-slate-50 border border-slate-100 rounded-xl px-2 py-1.5 text-center text-xs">
                      <div>
                        <span className="text-[9px] text-slate-500 font-medium block leading-tight">Total</span>
                        <strong className="text-[11px] font-black text-slate-900 leading-tight">{totalAcqs}</strong>
                      </div>
                      <div className="border-l border-slate-200 pl-1">
                        <span className="text-[9px] text-emerald-700 font-bold block leading-tight">Ver: {verAcqs}</span>
                        <span className="text-[9.5px] font-black text-emerald-700 block leading-tight">₹{Number(m.verified_earnings ?? 0).toLocaleString()}</span>
                      </div>
                      <div className="border-l border-slate-200 pl-1">
                        <span className="text-[9px] text-amber-700 font-bold block leading-tight">Pend: {pendAcqs}</span>
                        <span className="text-[9.5px] font-black text-amber-700 block leading-tight">₹{Number(m.pending_earnings ?? 0).toLocaleString()}</span>
                      </div>
                      <div className="border-l border-slate-200 pl-1">
                        <span className="text-[9px] text-rose-700 font-bold block leading-tight">Rej: <strong className="font-black">{rejAcqs}</strong></span>
                      </div>
                      <div className="border-l border-slate-200 pl-1">
                        <span className="text-[8.5px] text-slate-400 font-medium block leading-tight">Joined</span>
                        <span className="text-[8.5px] text-slate-600 font-bold block leading-tight truncate">{m.joined_at || "Recent"}</span>
                      </div>
                    </div>
                  </div>
                );
              })
            )}
          </div>
        </div>

      </div>
    </div>
  );
}
