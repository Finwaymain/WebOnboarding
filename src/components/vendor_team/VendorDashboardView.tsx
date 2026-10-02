"use client";

import React, { useState, useEffect } from "react";
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
  Eye,
  EyeOff,
  FileText,
  ShieldCheck,
  Building2,
  Filter,
} from "lucide-react";
import VendorAwaitingApprovalView from "./VendorAwaitingApprovalView";

interface VendorDashboardViewProps {
  onBack: () => void;
  vendorData: any;
  showToast: (msg: string) => void;
  apiBase?: string;
  userId?: string | null;
  userCat?: string | null;
  token?: string | null;
  onRefresh?: () => void;
}

export default function VendorDashboardView({
  onBack,
  vendorData,
  showToast,
  apiBase,
  userId,
  userCat,
  token,
  onRefresh,
}: VendorDashboardViewProps) {
  const [copiedCode, setCopiedCode] = useState(false);
  const [copiedSubVendorCode, setCopiedSubVendorCode] = useState(false);
  const [copiedFreelancerCode, setCopiedFreelancerCode] = useState(false);
  const [copiedFreelancerLink, setCopiedFreelancerLink] = useState(false);
  const [copiedSubVendorLink, setCopiedSubVendorLink] = useState(false);
  const [activeMainTab, setActiveMainTab] = useState<"overview" | "sub_vendors" | "freelancers" | "ledger" | "report">("overview");

  // Sub-Vendor approval modal
  const [selectedPendingSubVendor, setSelectedPendingSubVendor] = useState<any | null>(null);
  const [approvalCustRate, setApprovalCustRate] = useState<string>("");
  const [approvalBizRate, setApprovalBizRate] = useState<string>("");
  const [approvalDesignation, setApprovalDesignation] = useState<string>("Marketing Head");
  const [approvalRateVisible, setApprovalRateVisible] = useState<boolean>(true);
  const [approvingLoading, setApprovingLoading] = useState<boolean>(false);

  // Freelancer detail drilldown
  const [selectedMember, setSelectedMember] = useState<any | null>(null);
  const [subTab, setSubTab] = useState<"all" | "verified" | "pending" | "rejected">("all");
  const [searchQuery, setSearchQuery] = useState("");

  // Ledger state
  const [ledgerItems, setLedgerItems] = useState<any[]>([]);
  const [ledgerLoading, setLedgerLoading] = useState<boolean>(false);

  // Report state
  const [reportPeriod, setReportPeriod] = useState<string>("all");
  const [reportData, setReportData] = useState<any | null>(null);

  const toArray = (v: any): any[] => {
    if (Array.isArray(v)) return v;
    if (v && typeof v === "object") return Object.values(v);
    return [];
  };

  const vendorCode = String(vendorData?.vendor_code || "VR------");
  const numPart = vendorCode.replace(/^[A-Za-z]+/, "");
  const subVendorCode = vendorData?.sub_vendor_code || (numPart ? `SV${numPart}` : `SV------`);
  const freelancerCode = vendorData?.freelancer_code || (numPart ? `FR${numPart}` : `FR------`);

  const isHeadVendor = vendorData?.is_head_vendor ?? !vendorData?.parent_vendor;
  const isRateVisible = vendorData?.is_rate_visible ?? true;
  const designation = vendorData?.designation || (isHeadVendor ? "Head Vendor" : "Sub-Vendor");
  const parentVendor = vendorData?.parent_vendor;

  const baseOrigin = typeof window !== "undefined" ? window.location.origin : "https://api.fiinway.com";
  const freelancerShareUrl = `${baseOrigin}/onboarding/referral?code=${freelancerCode}`;
  const subVendorShareUrl = `${baseOrigin}/onboarding/referral?code=${subVendorCode}`;

  const rateCustomer = Number(vendorData?.rate_per_customer ?? 0);
  const rateBusiness = Number(vendorData?.rate_per_business ?? 0);

  const directSubVendors: any[] = toArray(vendorData?.direct_sub_vendors);
  const pendingSubVendors: any[] = toArray(vendorData?.pending_sub_vendors);
  const teamMembers: any[] = toArray(vendorData?.team_members);

  const totalCustomers = Number(vendorData?.total_customers ?? vendorData?.customer_joined ?? 0);
  const totalBusinesses = Number(vendorData?.total_businesses ?? vendorData?.business_joined ?? 0);
  const totalInstall = Number(vendorData?.total_install ?? (totalCustomers + totalBusinesses));

  const verifiedCustomers = Number(vendorData?.verified_customers ?? vendorData?.customer_verified ?? 0);
  const verifiedBusinesses = Number(vendorData?.verified_businesses ?? vendorData?.business_verified ?? 0);
  const totalVerified = Number(vendorData?.total_verified ?? (verifiedCustomers + verifiedBusinesses));

  const pendingCustomers = Number(vendorData?.customer_pending ?? Math.max(0, totalCustomers - verifiedCustomers));
  const pendingBusinesses = Number(vendorData?.business_pending ?? Math.max(0, totalBusinesses - verifiedBusinesses));
  const totalPending = Number(vendorData?.total_pending ?? (pendingCustomers + pendingBusinesses));

  const rejectedCustomers = Number(vendorData?.customer_rejected ?? 0);
  const rejectedBusinesses = Number(vendorData?.business_rejected ?? 0);
  const totalRejected = Number(vendorData?.total_rejected ?? (rejectedCustomers + rejectedBusinesses));

  const totalEarnings = vendorData?.total_earnings ?? vendorData?.total_verified_due ?? 0;
  const paidEarnings = Number(vendorData?.paid_earnings ?? 0);
  const pendingPayout = vendorData?.pending_payout ?? Math.max(0, Number(totalEarnings) - paidEarnings);

  const customerDue = Number(vendorData?.customer_due ?? (verifiedCustomers * rateCustomer));
  const businessDue = Number(vendorData?.business_due ?? (verifiedBusinesses * rateBusiness));
  const totalVerifiedDue = Number(vendorData?.total_verified_due ?? (customerDue + businessDue));

  const customerUpcoming = Number(vendorData?.customer_upcoming ?? (pendingCustomers * rateCustomer));
  const businessUpcoming = Number(vendorData?.business_upcoming ?? (pendingBusinesses * rateBusiness));
  const totalUpcomingIncome = Number(vendorData?.total_upcoming_income ?? (customerUpcoming + businessUpcoming));

  const location = vendorData?.team_location || "Territory";
  const teamType = vendorData?.team_type || "Field Marketing";

  // Fetch Ledger data when ledger tab is selected
  useEffect(() => {
    if (activeMainTab === "ledger" && apiBase && userId) {
      setLedgerLoading(true);
      const query = `id_user=${encodeURIComponent(userId)}&user_cat=${encodeURIComponent(userCat || "driver")}&accesstoken=${encodeURIComponent(token || "")}`;
      fetch(`${apiBase}/vendor-team/payment-ledger?${query}`, {
        headers: { "Content-Type": "application/json", "id_user": userId },
      })
        .then((res) => res.json())
        .then((json) => {
          if (json.success && json.data) {
            setLedgerItems(json.data);
          }
        })
        .catch(() => {})
        .finally(() => setLedgerLoading(false));
    }
  }, [activeMainTab, apiBase, userId, userCat, token]);

  // Fetch Report data when report tab is selected
  useEffect(() => {
    if (activeMainTab === "report" && apiBase && userId) {
      const query = `id_user=${encodeURIComponent(userId)}&user_cat=${encodeURIComponent(userCat || "driver")}&period=${reportPeriod}&accesstoken=${encodeURIComponent(token || "")}`;
      fetch(`${apiBase}/vendor-team/consolidated-report?${query}`, {
        headers: { "Content-Type": "application/json", "id_user": userId },
      })
        .then((res) => res.json())
        .then((json) => {
          if (json.success && json.data) {
            setReportData(json.data);
          }
        })
        .catch(() => {});
    }
  }, [activeMainTab, reportPeriod, apiBase, userId, userCat, token]);

  // BLOCKING CHECK: If vendor application is pending review or not approved, block dashboard access!
  if (!vendorData || vendorData.status === "pending" || !vendorData.vendor_code || vendorData.status !== "approved") {
    return (
      <VendorAwaitingApprovalView
        onBack={onBack}
        applicationData={vendorData}
        onRefresh={onRefresh}
        showToast={showToast}
      />
    );
  }

  const handleCopyCode = () => {
    if (!vendorCode) return;
    if (typeof navigator !== "undefined" && navigator.clipboard) {
      navigator.clipboard.writeText(vendorCode);
    }
    setCopiedCode(true);
    showToast("Vendor code copied to clipboard!");
    setTimeout(() => setCopiedCode(false), 2000);
  };

  const handleCopySubVendorCode = () => {
    if (!subVendorCode) return;
    if (typeof navigator !== "undefined" && navigator.clipboard) {
      navigator.clipboard.writeText(subVendorCode);
    }
    setCopiedSubVendorCode(true);
    showToast("Sub-Vendor joining code copied!");
    setTimeout(() => setCopiedSubVendorCode(false), 2000);
  };

  const handleCopyFreelancerCode = () => {
    if (!freelancerCode) return;
    if (typeof navigator !== "undefined" && navigator.clipboard) {
      navigator.clipboard.writeText(freelancerCode);
    }
    setCopiedFreelancerCode(true);
    showToast("Freelancer joining code copied!");
    setTimeout(() => setCopiedFreelancerCode(false), 2000);
  };

  const handleCopyFreelancerLink = () => {
    if (typeof navigator !== "undefined" && navigator.clipboard) {
      navigator.clipboard.writeText(freelancerShareUrl);
    }
    setCopiedFreelancerLink(true);
    showToast("Freelancer invite link copied!");
    setTimeout(() => setCopiedFreelancerLink(false), 2000);
  };

  const handleCopySubVendorLink = () => {
    if (typeof navigator !== "undefined" && navigator.clipboard) {
      navigator.clipboard.writeText(subVendorShareUrl);
    }
    setCopiedSubVendorLink(true);
    showToast("Sub-Vendor invite link copied!");
    setTimeout(() => setCopiedSubVendorLink(false), 2000);
  };

  const handleOpenApproveModal = (pending: any) => {
    setSelectedPendingSubVendor(pending);
    setApprovalCustRate(rateCustomer > 0 ? (rateCustomer * 0.6).toFixed(2) : "0.00");
    setApprovalBizRate(rateBusiness > 0 ? (rateBusiness * 0.6).toFixed(2) : "0.00");
    setApprovalDesignation(pending.designation || "Marketing Head");
    setApprovalRateVisible(true);
  };

  const handleApproveSubVendorSubmit = async () => {
    if (!selectedPendingSubVendor || !apiBase || !userId) return;

    const cust = parseFloat(approvalCustRate) || 0;
    const biz = parseFloat(approvalBizRate) || 0;

    if (cust > rateCustomer) {
      showToast(`Customer rate cannot exceed your rate of ₹${rateCustomer.toFixed(2)}`);
      return;
    }
    if (biz > rateBusiness) {
      showToast(`Business rate cannot exceed your rate of ₹${rateBusiness.toFixed(2)}`);
      return;
    }

    try {
      setApprovingLoading(true);
      const res = await fetch(`${apiBase}/vendor-team/approve-sub-vendor`, {
        method: "POST",
        headers: { "Content-Type": "application/json", "id_user": userId },
        body: JSON.stringify({
          id_user: userId,
          user_cat: userCat || "driver",
          sub_vendor_id: selectedPendingSubVendor.id,
          rate_per_customer: cust,
          rate_per_business: biz,
          designation: approvalDesignation,
          is_rate_visible: approvalRateVisible,
        }),
      });

      const json = await res.json();
      if (json.success) {
        showToast(json.message || "Sub-Vendor approved successfully!");
        setSelectedPendingSubVendor(null);
        if (onRefresh) onRefresh();
      } else {
        showToast(json.message || "Failed to approve Sub-Vendor.");
      }
    } catch (e: any) {
      showToast(e.message || "Approval request failed.");
    } finally {
      setApprovingLoading(false);
    }
  };

  const handleToggleRateVisibility = async (subVendorId: number, currentVisible: boolean) => {
    if (!apiBase || !userId) return;
    try {
      const res = await fetch(`${apiBase}/vendor-team/toggle-rate-visibility`, {
        method: "POST",
        headers: { "Content-Type": "application/json", "id_user": userId },
        body: JSON.stringify({
          id_user: userId,
          user_cat: userCat || "driver",
          sub_vendor_id: subVendorId,
          is_rate_visible: !currentVisible,
        }),
      });
      const json = await res.json();
      if (json.success) {
        showToast(`Rate visibility turned ${!currentVisible ? "ON" : "OFF"}`);
        if (onRefresh) onRefresh();
      }
    } catch (_) {}
  };

  // ──────────────────────────────────────────────────────────────────────────
  // VIEW: FREELANCER DRILL-DOWN ACQUISITIONS LIST
  // ──────────────────────────────────────────────────────────────────────────
  if (selectedMember) {
    const memberAcquisitions: any[] = selectedMember.acquisitions || [];
    const filteredAcquisitions = memberAcquisitions.filter((item: any) => {
      if (subTab === "verified" && item.verification_status !== "verified") return false;
      if (subTab === "pending" && item.verification_status !== "pending") return false;
      if (subTab === "rejected" && item.verification_status !== "rejected") return false;

      if (searchQuery.trim()) {
        const query = searchQuery.toLowerCase().trim();
        return (
          (item.name || "").toLowerCase().includes(query) ||
          (item.phone || "").toLowerCase().includes(query)
        );
      }
      return true;
    });

    return (
      <div className="min-h-screen bg-[#F8FAFC] pb-12">
        <div className="bg-white border-b border-slate-200 sticky top-0 z-30 shadow-2xs">
          <div className="max-w-md mx-auto px-4 py-3 flex items-center justify-between">
            <div className="flex items-center gap-2.5">
              <button
                onClick={() => setSelectedMember(null)}
                className="p-2 rounded-xl bg-slate-100 hover:bg-slate-200 text-slate-700 transition-colors shrink-0"
              >
                <ChevronLeft className="w-4 h-4 stroke-[2.5]" />
              </button>
              <div>
                <h2 className="text-sm font-bold text-slate-900 leading-tight">Freelancer Details</h2>
                <p className="text-[11px] text-slate-500 font-medium">
                  {selectedMember.name} &bull; {selectedMember.member_code}
                </p>
              </div>
            </div>
            <button
              onClick={() => setSelectedMember(null)}
              className="text-[11px] font-bold text-slate-600 hover:text-slate-900 bg-slate-100 px-2.5 py-1 rounded-lg"
            >
              Close
            </button>
          </div>
        </div>

        <div className="max-w-md mx-auto px-3.5 pt-3 space-y-3">
          <div className="flex items-center gap-1.5 overflow-x-auto pb-1 scrollbar-none">
            <button
              onClick={() => setSubTab("all")}
              className={`text-xs font-bold px-3.5 py-2 rounded-xl shrink-0 ${
                subTab === "all" ? "bg-slate-900 text-white" : "bg-white text-slate-600 border border-slate-200"
              }`}
            >
              All ({memberAcquisitions.length})
            </button>
            <button
              onClick={() => setSubTab("verified")}
              className={`text-xs font-bold px-3.5 py-2 rounded-xl shrink-0 ${
                subTab === "verified" ? "bg-emerald-600 text-white" : "bg-white text-slate-600 border border-slate-200"
              }`}
            >
              Verified ({selectedMember.verified_count ?? 0})
            </button>
            <button
              onClick={() => setSubTab("pending")}
              className={`text-xs font-bold px-3.5 py-2 rounded-xl shrink-0 ${
                subTab === "pending" ? "bg-amber-600 text-white" : "bg-white text-slate-600 border border-slate-200"
              }`}
            >
              Pending ({selectedMember.pending_count ?? 0})
            </button>
            <button
              onClick={() => setSubTab("rejected")}
              className={`text-xs font-bold px-3.5 py-2 rounded-xl shrink-0 ${
                subTab === "rejected" ? "bg-rose-600 text-white" : "bg-white text-slate-600 border border-slate-200"
              }`}
            >
              Rejected ({selectedMember.rejected_count ?? 0})
            </button>
          </div>

          <div className="relative">
            <Search className="w-4 h-4 text-slate-400 absolute left-3.5 top-1/2 -translate-y-1/2" />
            <input
              type="text"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              placeholder="Search by name or number..."
              className="w-full bg-white border border-slate-200 rounded-xl pl-9 pr-4 py-2.5 text-xs text-slate-800 placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-blue-500/20"
            />
          </div>

          <div className="bg-white rounded-2xl border border-slate-200 shadow-2xs overflow-hidden">
            <div className="grid grid-cols-12 bg-slate-50 border-b border-slate-200 px-3 py-2.5 text-[10px] font-bold text-slate-500 uppercase tracking-wider">
              <div className="col-span-3">DATE</div>
              <div className="col-span-5">NAME / NUMBER</div>
              <div className="col-span-4 text-right">STATUS</div>
            </div>

            <div className="divide-y divide-slate-100">
              {filteredAcquisitions.length === 0 ? (
                <div className="p-8 text-center text-xs text-slate-500">No User Records Found</div>
              ) : (
                filteredAcquisitions.map((acq: any, idx: number) => (
                  <div key={idx} className="grid grid-cols-12 items-center px-3 py-3 hover:bg-slate-50/50">
                    <div className="col-span-3 text-[11px] text-slate-600 font-medium">{acq.date}</div>
                    <div className="col-span-5">
                      <div className="text-xs font-bold text-slate-900 truncate">{acq.name}</div>
                      <div className="text-[10px] text-slate-400 font-mono">{acq.phone}</div>
                    </div>
                    <div className="col-span-4 text-right">
                      <span
                        className={`text-[9.5px] font-bold px-2 py-0.5 rounded-full inline-block ${
                          acq.verification_status === "verified"
                            ? "bg-emerald-50 text-emerald-700 border border-emerald-200"
                            : acq.verification_status === "rejected"
                            ? "bg-rose-50 text-rose-700 border border-rose-200"
                            : "bg-amber-50 text-amber-700 border border-amber-200"
                        }`}
                      >
                        {acq.verification_status === "verified" ? "Verified" : acq.verification_status === "rejected" ? "Rejected" : "Pending"}
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

  // ──────────────────────────────────────────────────────────────────────────
  // MAIN VENDOR DASHBOARD
  // ──────────────────────────────────────────────────────────────────────────
  return (
    <div className="min-h-screen bg-[#F8FAFC] pb-12 text-slate-900">
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
              <div className="flex items-center gap-1.5">
                <h2 className="text-sm font-bold text-slate-900 leading-tight">
                  {designation}
                </h2>
                {isHeadVendor ? (
                  <span className="text-[9.5px] font-bold px-1.5 py-0.5 rounded bg-indigo-50 text-indigo-700 border border-indigo-200">
                    👑 Head
                  </span>
                ) : (
                  <span className="text-[9.5px] font-bold px-1.5 py-0.5 rounded bg-amber-50 text-amber-800 border border-amber-200">
                    ↳ L{vendorData?.hierarchy_level ?? 1}
                  </span>
                )}
              </div>
              <p className="text-[10.5px] text-slate-500 font-medium">
                {location} &bull; {teamType}
              </p>
            </div>
          </div>

          <span className="text-[10px] font-bold px-2 py-0.5 rounded-full bg-emerald-50 text-emerald-700 border border-emerald-200">
            Active
          </span>
        </div>
      </div>

      <div className="max-w-md mx-auto px-3.5 pt-3 space-y-3">
        {/* Pending Sub-Vendor Approvals Alert Banner */}
        {pendingSubVendors.length > 0 && (
          <div className="bg-amber-500 text-white rounded-2xl p-3.5 shadow-sm space-y-2 animate-pulse-subtle">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                <AlertCircle className="w-5 h-5 text-amber-100 shrink-0" />
                <div>
                  <h4 className="text-xs font-black tracking-wide">
                    {pendingSubVendors.length} Sub-Vendor Request{pendingSubVendors.length > 1 ? "s" : ""} Awaiting Review
                  </h4>
                  <p className="text-[10.5px] text-amber-100 font-medium">
                    Review and set commission rates to activate their accounts.
                  </p>
                </div>
              </div>
            </div>

            <div className="space-y-1.5 pt-1">
              {pendingSubVendors.map((pending: any, pIdx: number) => (
                <div
                  key={pIdx}
                  className="bg-white/10 backdrop-blur-xs rounded-xl p-2.5 flex items-center justify-between border border-white/20"
                >
                  <div className="min-w-0 flex-1 mr-2">
                    <p className="text-xs font-bold text-white truncate">{pending.name}</p>
                    <p className="text-[10.5px] text-amber-100 truncate">
                      {pending.phone} &bull; {pending.designation}
                    </p>
                  </div>
                  <button
                    onClick={() => handleOpenApproveModal(pending)}
                    className="bg-white text-amber-900 hover:bg-amber-50 font-bold text-xs px-3 py-1.5 rounded-lg shadow-xs shrink-0 transition-transform active:scale-95"
                  >
                    Review & Set Rates
                  </button>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* Vendor Master & Separate Joining Codes Card */}
        <div className="bg-white rounded-2xl p-4 border border-slate-200 shadow-2xs space-y-3.5">
          {/* Top Vendor Master Identity */}
          <div className="flex items-center justify-between border-b border-slate-100 pb-2.5">
            <div>
              <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider block">
                Master Vendor Profile
              </span>
              <div className="flex items-center gap-2 mt-0.5">
                <span className="text-sm font-black text-slate-900 font-mono tracking-wide">
                  {vendorCode}
                </span>
                <span className="text-[10px] font-bold px-2 py-0.5 rounded-full bg-slate-100 text-slate-700">
                  {designation}
                </span>
              </div>
            </div>
            {parentVendor ? (
              <div className="text-right">
                <span className="text-[10px] font-medium text-slate-400 block">Parent</span>
                <span className="text-xs font-bold text-slate-700">{parentVendor.vendor_code}</span>
              </div>
            ) : (
              <span className="text-[10px] font-bold px-2 py-0.5 rounded-md bg-indigo-50 text-indigo-700 border border-indigo-200">
                👑 Top Level
              </span>
            )}
          </div>

          {/* TWO SEPARATE JOINING CODE BOXES */}
          <div className="space-y-2.5">
            {/* 1. Sub-Vendor Joining Code Box */}
            <div className="bg-gradient-to-r from-indigo-50/70 to-blue-50/40 rounded-xl p-3 border border-indigo-100/80 space-y-2">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-1.5">
                  <div className="w-5 h-5 rounded-md bg-indigo-600 text-white flex items-center justify-center font-bold text-[10px]">
                    SV
                  </div>
                  <span className="text-xs font-bold text-indigo-950">Sub-Vendor Joining Code</span>
                </div>
                <span className="text-[9.5px] font-bold text-indigo-700 bg-indigo-100/70 px-1.5 py-0.5 rounded">
                  Auto-Detects Sub-Vendor
                </span>
              </div>

              <div className="flex items-center justify-between gap-2 bg-white rounded-lg p-2 border border-indigo-100">
                <span className="text-base font-black font-mono tracking-widest text-indigo-900">
                  {subVendorCode}
                </span>
                <div className="flex items-center gap-1.5">
                  <button
                    onClick={handleCopySubVendorCode}
                    className="p-1.5 rounded-md hover:bg-slate-100 text-slate-600 hover:text-slate-900 transition-colors flex items-center gap-1 text-[11px] font-bold"
                    title="Copy Sub-Vendor Code"
                  >
                    {copiedSubVendorCode ? <Check className="w-3.5 h-3.5 text-emerald-600" /> : <Copy className="w-3.5 h-3.5" />}
                    <span>{copiedSubVendorCode ? "Copied" : "Copy"}</span>
                  </button>
                  <button
                    onClick={handleCopySubVendorLink}
                    className="bg-indigo-600 hover:bg-indigo-700 text-white text-[11px] font-bold px-2.5 py-1.5 rounded-md shadow-2xs flex items-center gap-1 transition-all"
                  >
                    <Building2 className="w-3 h-3" />
                    <span>{copiedSubVendorLink ? "Link Copied" : "Share Invite"}</span>
                  </button>
                </div>
              </div>
              <p className="text-[10px] text-indigo-700/80 leading-tight">
                Share this code with partners who want to become Sub-Vendors. Applicants automatically land in your review list.
              </p>
            </div>

            {/* 2. Freelancer Joining Code Box */}
            <div className="bg-gradient-to-r from-emerald-50/70 to-teal-50/40 rounded-xl p-3 border border-emerald-100/80 space-y-2">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-1.5">
                  <div className="w-5 h-5 rounded-md bg-[#047857] text-white flex items-center justify-center font-bold text-[10px]">
                    FR
                  </div>
                  <span className="text-xs font-bold text-emerald-950">Freelancer Joining Code</span>
                </div>
                <span className="text-[9.5px] font-bold text-emerald-700 bg-emerald-100/70 px-1.5 py-0.5 rounded">
                  Auto-Detects Freelancer
                </span>
              </div>

              <div className="flex items-center justify-between gap-2 bg-white rounded-lg p-2 border border-emerald-100">
                <span className="text-base font-black font-mono tracking-widest text-emerald-950">
                  {freelancerCode}
                </span>
                <div className="flex items-center gap-1.5">
                  <button
                    onClick={handleCopyFreelancerCode}
                    className="p-1.5 rounded-md hover:bg-slate-100 text-slate-600 hover:text-slate-900 transition-colors flex items-center gap-1 text-[11px] font-bold"
                    title="Copy Freelancer Code"
                  >
                    {copiedFreelancerCode ? <Check className="w-3.5 h-3.5 text-emerald-600" /> : <Copy className="w-3.5 h-3.5" />}
                    <span>{copiedFreelancerCode ? "Copied" : "Copy"}</span>
                  </button>
                  <button
                    onClick={handleCopyFreelancerLink}
                    className="bg-[#047857] hover:bg-[#065f46] text-white text-[11px] font-bold px-2.5 py-1.5 rounded-md shadow-2xs flex items-center gap-1 transition-all"
                  >
                    <Users className="w-3 h-3" />
                    <span>{copiedFreelancerLink ? "Link Copied" : "Share Invite"}</span>
                  </button>
                </div>
              </div>
              <p className="text-[10px] text-emerald-800/80 leading-tight">
                Share this code with field agents/freelancers. They will be registered directly under your team.
              </p>
            </div>
          </div>
        </div>

        {/* Assigned Payout Rates Card */}
        <div className="bg-slate-900 text-white rounded-2xl p-4 shadow-sm space-y-2.5">
          <div className="flex items-center justify-between">
            <span className="text-[11px] font-bold uppercase tracking-wider text-slate-400">
              {isHeadVendor ? "Admin Master Commission Rates" : "Your Assigned Rates"}
            </span>
            <span className="text-[10px] font-semibold bg-emerald-500/20 text-emerald-300 border border-emerald-500/30 px-2 py-0.5 rounded-md">
              {isHeadVendor ? "Master Tier" : isRateVisible ? "Applicable" : "Protected"}
            </span>
          </div>

          {!isHeadVendor && !isRateVisible ? (
            <div className="bg-slate-800/80 border border-slate-700 rounded-xl p-3 text-center space-y-1">
              <EyeOff className="w-4 h-4 text-slate-400 mx-auto" />
              <p className="text-xs font-bold text-slate-300">Rate Hidden by Parent Vendor</p>
              <p className="text-[10px] text-slate-400">Your earnings will be credited automatically upon verification.</p>
            </div>
          ) : (
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
          )}
        </div>

        {/* Multi-Tab Navigation Pills */}
        <div className="flex items-center gap-1.5 overflow-x-auto pb-1 scrollbar-none">
          <button
            onClick={() => setActiveMainTab("overview")}
            className={`text-xs font-bold px-3 py-2 rounded-xl shrink-0 transition-all ${
              activeMainTab === "overview" ? "bg-slate-900 text-white shadow-2xs" : "bg-white text-slate-600 border border-slate-200"
            }`}
          >
            Overview
          </button>
          <button
            onClick={() => setActiveMainTab("sub_vendors")}
            className={`text-xs font-bold px-3 py-2 rounded-xl shrink-0 transition-all ${
              activeMainTab === "sub_vendors" ? "bg-indigo-700 text-white shadow-2xs" : "bg-white text-slate-600 border border-slate-200"
            }`}
          >
            Sub-Vendors ({directSubVendors.length})
          </button>
          <button
            onClick={() => setActiveMainTab("freelancers")}
            className={`text-xs font-bold px-3 py-2 rounded-xl shrink-0 transition-all ${
              activeMainTab === "freelancers" ? "bg-emerald-700 text-white shadow-2xs" : "bg-white text-slate-600 border border-slate-200"
            }`}
          >
            Freelancers ({teamMembers.length})
          </button>
          <button
            onClick={() => setActiveMainTab("ledger")}
            className={`text-xs font-bold px-3 py-2 rounded-xl shrink-0 transition-all ${
              activeMainTab === "ledger" ? "bg-slate-900 text-white shadow-2xs" : "bg-white text-slate-600 border border-slate-200"
            }`}
          >
            Payment Ledger
          </button>
          <button
            onClick={() => setActiveMainTab("report")}
            className={`text-xs font-bold px-3 py-2 rounded-xl shrink-0 transition-all ${
              activeMainTab === "report" ? "bg-slate-900 text-white shadow-2xs" : "bg-white text-slate-600 border border-slate-200"
            }`}
          >
            Reports
          </button>
        </div>

        {/* ── TAB 1: OVERVIEW ── */}
        {activeMainTab === "overview" && (
          <div className="space-y-3">
            {/* Financial Earnings Card */}
            <div className="bg-white rounded-2xl p-4 border border-slate-200 shadow-2xs space-y-3">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <div className="w-8 h-8 rounded-xl bg-emerald-100 text-emerald-700 flex items-center justify-center">
                    <Wallet className="w-4 h-4" />
                  </div>
                  <span className="text-xs font-bold text-slate-800">Verified Earnings</span>
                </div>
                <span className="text-base font-black text-emerald-700">
                  ₹{Number(totalEarnings).toLocaleString()}
                </span>
              </div>

              <div className="grid grid-cols-3 gap-2 pt-1 border-t border-slate-100 text-center">
                <div className="bg-slate-50 rounded-xl p-2">
                  <span className="text-[9px] font-bold text-slate-400 uppercase tracking-wide block truncate">
                    Sub-Vendors
                  </span>
                  <span className="text-sm font-black text-slate-900">
                    {directSubVendors.length}
                  </span>
                </div>
                <div className="bg-slate-50 rounded-xl p-2">
                  <span className="text-[9px] font-bold text-slate-400 uppercase tracking-wide block truncate">
                    Unsettled Due
                  </span>
                  <span className="text-sm font-black text-amber-700">
                    ₹{Number(pendingPayout).toLocaleString()}
                  </span>
                </div>
                <div className="bg-slate-50 rounded-xl p-2">
                  <span className="text-[9px] font-bold text-slate-400 uppercase tracking-wide block truncate">
                    Settled Paid
                  </span>
                  <span className="text-sm font-black text-emerald-700">
                    ₹{Number(paidEarnings).toLocaleString()}
                  </span>
                </div>
              </div>
            </div>

            {/* Status Breakdown */}
            <div className="bg-white rounded-2xl p-4 border border-slate-200 shadow-2xs space-y-3">
              <div className="grid grid-cols-3 gap-2 text-center divide-x divide-slate-100">
                <div className="space-y-1">
                  <div className="flex items-center justify-center gap-1 text-[10px] font-black text-emerald-700 uppercase tracking-wider">
                    <CheckCircle2 className="w-3.5 h-3.5" />
                    <span>VERIFIED</span>
                  </div>
                  <p className="text-2xl font-black text-emerald-700 leading-none">{totalVerified}</p>
                  <div className="pt-1 text-[11px] font-bold text-slate-700 flex items-center justify-center gap-1.5">
                    <span>{verifiedCustomers}</span>
                    <span className="text-slate-300">|</span>
                    <span>{verifiedBusinesses}</span>
                  </div>
                </div>

                <div className="space-y-1 pl-1">
                  <div className="flex items-center justify-center gap-1 text-[10px] font-black text-amber-700 uppercase tracking-wider">
                    <Clock className="w-3.5 h-3.5" />
                    <span>PENDING</span>
                  </div>
                  <p className="text-2xl font-black text-amber-700 leading-none">{totalPending}</p>
                  <div className="pt-1 text-[11px] font-bold text-slate-700 flex items-center justify-center gap-1.5">
                    <span>{pendingCustomers}</span>
                    <span className="text-slate-300">|</span>
                    <span>{pendingBusinesses}</span>
                  </div>
                </div>

                <div className="space-y-1 pl-1">
                  <div className="flex items-center justify-center gap-1 text-[10px] font-black text-rose-700 uppercase tracking-wider">
                    <XCircle className="w-3.5 h-3.5" />
                    <span>REJECTED</span>
                  </div>
                  <p className="text-2xl font-black text-rose-700 leading-none">{totalRejected}</p>
                  <div className="pt-1 text-[11px] font-bold text-slate-700 flex items-center justify-center gap-1.5">
                    <span>{rejectedCustomers}</span>
                    <span className="text-slate-300">|</span>
                    <span>{rejectedBusinesses}</span>
                  </div>
                </div>
              </div>
            </div>

            {/* Dues & Upcoming */}
            <div className="bg-white rounded-2xl p-4 border border-slate-200 shadow-2xs space-y-2">
              <div className="grid grid-cols-2 gap-3 divide-x divide-slate-100">
                <div className="space-y-1">
                  <span className="text-[10px] font-bold text-emerald-800 uppercase tracking-wider block">VERIFIED DUE</span>
                  <div className="flex items-center gap-2">
                    <span className="text-sm font-black text-emerald-700">₹{customerDue.toLocaleString()} (Cust)</span>
                    <span className="text-sm font-black text-blue-700">₹{businessDue.toLocaleString()} (Biz)</span>
                  </div>
                </div>
                <div className="space-y-1 pl-3">
                  <span className="text-[10px] font-bold text-amber-800 uppercase tracking-wider block">UPCOMING DUE</span>
                  <div className="flex items-center gap-2">
                    <span className="text-sm font-black text-amber-700">₹{customerUpcoming.toLocaleString()}</span>
                    <span className="text-sm font-black text-indigo-700">₹{businessUpcoming.toLocaleString()}</span>
                  </div>
                </div>
              </div>
            </div>
          </div>
        )}

        {/* ── TAB 2: SUB-VENDORS CHAIN ── */}
        {activeMainTab === "sub_vendors" && (
          <div className="space-y-2">
            <div className="flex items-center justify-between">
              <h3 className="text-xs font-bold text-slate-700 uppercase tracking-wider">
                Direct Sub-Vendors Under You
              </h3>
              <span className="text-[11px] font-semibold text-slate-500">{directSubVendors.length} vendors</span>
            </div>

            <div className="bg-white rounded-2xl border border-slate-200 shadow-2xs overflow-hidden divide-y divide-slate-100">
              {directSubVendors.length === 0 ? (
                <div className="p-6 text-center space-y-1.5">
                  <Building2 className="w-8 h-8 text-slate-300 mx-auto" />
                  <p className="text-xs font-bold text-slate-700">No Sub-Vendors Added Yet</p>
                  <p className="text-[11px] text-slate-500">
                    Share your code <strong>{vendorCode}</strong> with team leads to register them as Sub-Vendors under you.
                  </p>
                </div>
              ) : (
                directSubVendors.map((sv: any, idx: number) => (
                  <div key={idx} className="p-3.5 space-y-2 hover:bg-slate-50/80 transition-all">
                    <div className="flex items-center justify-between">
                      <div>
                        <div className="flex items-center gap-1.5">
                          <h4 className="text-xs font-bold text-slate-900">{sv.name}</h4>
                          <span className="text-[9.5px] font-bold px-1.5 py-0.5 rounded bg-indigo-50 text-indigo-700 border border-indigo-200">
                            {sv.designation}
                          </span>
                        </div>
                        <p className="text-[10.5px] text-slate-400 font-mono mt-0.5">
                          {sv.vendor_code} &bull; {sv.phone}
                        </p>
                      </div>

                      {/* Rate Visibility Toggle */}
                      <button
                        onClick={() => handleToggleRateVisibility(sv.id, sv.is_rate_visible)}
                        className={`text-[10px] font-bold px-2 py-1 rounded-lg border flex items-center gap-1 transition-colors ${
                          sv.is_rate_visible
                            ? "bg-emerald-50 text-emerald-700 border-emerald-200 hover:bg-emerald-100"
                            : "bg-slate-100 text-slate-600 border-slate-200 hover:bg-slate-200"
                        }`}
                        title="Toggle whether Sub-Vendor can see their assigned rate"
                      >
                        {sv.is_rate_visible ? <Eye className="w-3 h-3" /> : <EyeOff className="w-3 h-3" />}
                        <span>Rate: {sv.is_rate_visible ? "ON" : "OFF"}</span>
                      </button>
                    </div>

                    <div className="grid grid-cols-4 items-center bg-slate-50 border border-slate-100 rounded-xl px-2 py-1.5 text-center text-xs">
                      <div>
                        <span className="text-[9px] text-slate-500 font-medium block">Cust Rate</span>
                        <strong className="text-[11px] font-black text-slate-900">₹{sv.rate_per_customer}</strong>
                      </div>
                      <div className="border-l border-slate-200 pl-1">
                        <span className="text-[9px] text-slate-500 font-medium block">Biz Rate</span>
                        <strong className="text-[11px] font-black text-slate-900">₹{sv.rate_per_business}</strong>
                      </div>
                      <div className="border-l border-slate-200 pl-1">
                        <span className="text-[9px] text-indigo-700 font-bold block">Freelancers</span>
                        <span className="text-[11px] font-black text-indigo-700">{sv.freelancers_count}</span>
                      </div>
                      <div className="border-l border-slate-200 pl-1">
                        <span className="text-[9px] text-emerald-700 font-bold block">Acquired</span>
                        <span className="text-[11px] font-black text-emerald-700">{sv.acquisitions_count}</span>
                      </div>
                    </div>
                  </div>
                ))
              )}
            </div>
          </div>
        )}

        {/* ── TAB 3: FREELANCERS ── */}
        {activeMainTab === "freelancers" && (
          <div className="space-y-2">
            <h3 className="text-xs font-bold text-slate-700 uppercase tracking-wider flex items-center justify-between">
              <span>Freelancers Under You</span>
              <span className="text-[11px] font-semibold text-slate-500">{teamMembers.length} members</span>
            </h3>

            <div className="bg-white rounded-2xl border border-slate-200 shadow-2xs overflow-hidden divide-y divide-slate-100">
              {teamMembers.length === 0 ? (
                <div className="p-6 text-center space-y-1.5">
                  <Users className="w-8 h-8 text-slate-300 mx-auto" />
                  <p className="text-xs font-bold text-slate-700">No Freelancers Registered Yet</p>
                  <p className="text-[11px] text-slate-500">
                    Share your Vendor Code <strong>{vendorCode}</strong> with agents to register them under you.
                  </p>
                </div>
              ) : (
                teamMembers.map((m: any, idx: number) => {
                  const totalAcqs = m.total_users ?? 0;
                  const verAcqs = m.verified_count ?? 0;
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
                        <div>
                          <h4 className="text-xs font-bold text-slate-900">{m.name}</h4>
                          <p className="text-[10.5px] text-slate-400 font-mono mt-0.5">
                            {m.member_code} &bull; {m.phone}
                          </p>
                        </div>
                        <div className="flex items-center gap-1 text-[10px] font-bold text-blue-600 bg-blue-50 px-2 py-1 rounded-lg">
                          <span>View Users</span>
                          <ChevronRight className="w-3 h-3 stroke-[2.5]" />
                        </div>
                      </div>

                      <div className="grid grid-cols-4 items-center bg-slate-50 border border-slate-100 rounded-xl px-2 py-1.5 text-center text-xs">
                        <div>
                          <span className="text-[9px] text-slate-500 font-medium block">Total</span>
                          <strong className="text-[11px] font-black text-slate-900">{totalAcqs}</strong>
                        </div>
                        <div className="border-l border-slate-200 pl-1">
                          <span className="text-[9px] text-emerald-700 font-bold block">Verified</span>
                          <span className="text-[11px] font-black text-emerald-700">{verAcqs}</span>
                        </div>
                        <div className="border-l border-slate-200 pl-1">
                          <span className="text-[9px] text-amber-700 font-bold block">Pending</span>
                          <span className="text-[11px] font-black text-amber-700">{m.pending_count ?? 0}</span>
                        </div>
                        <div className="border-l border-slate-200 pl-1">
                          <span className="text-[9px] text-emerald-700 font-bold block">Earnings</span>
                          <span className="text-[11px] font-black text-emerald-700">₹{Number(m.verified_earnings ?? 0).toLocaleString()}</span>
                        </div>
                      </div>
                    </div>
                  );
                })
              )}
            </div>
          </div>
        )}

        {/* ── TAB 4: PAYMENT LEDGER ── */}
        {activeMainTab === "ledger" && (
          <div className="space-y-2">
            <h3 className="text-xs font-bold text-slate-700 uppercase tracking-wider flex items-center justify-between">
              <span>Transaction Payment Ledger</span>
              <span className="text-[10px] text-slate-500 font-mono">Lineage Tracking</span>
            </h3>

            <div className="bg-white rounded-2xl border border-slate-200 shadow-2xs overflow-hidden">
              <div className="grid grid-cols-12 bg-slate-50 border-b border-slate-200 px-3 py-2 text-[10px] font-bold text-slate-500 uppercase">
                <div className="col-span-3">TRX ID / DATE</div>
                <div className="col-span-5">USER / AGENT</div>
                <div className="col-span-2 text-right">RATE</div>
                <div className="col-span-2 text-right">EARNED</div>
              </div>

              <div className="divide-y divide-slate-100">
                {ledgerLoading ? (
                  <div className="p-6 text-center text-xs text-slate-400">Loading ledger records...</div>
                ) : toArray(ledgerItems).length === 0 ? (
                  <div className="p-6 text-center text-xs text-slate-500">
                    No ledger transactions recorded yet. Verified acquisitions will appear here.
                  </div>
                ) : (
                  toArray(ledgerItems).map((item: any, idx: number) => (
                    <div key={idx} className="grid grid-cols-12 items-center px-3 py-2.5 hover:bg-slate-50/50 text-xs">
                      <div className="col-span-3">
                        <span className="font-mono font-bold text-[10.5px] text-slate-900 block truncate">{item.transaction_id}</span>
                        <span className="text-[9px] text-slate-400 block">{item.date}</span>
                      </div>
                      <div className="col-span-5">
                        <span className="font-bold text-slate-900 block truncate">{item.user_name}</span>
                        <span className="text-[9.5px] text-slate-400 block">
                          {item.freelancer_code} &bull; {item.acquired_user_type}
                        </span>
                      </div>
                      <div className="col-span-2 text-right font-medium text-slate-600">
                        ₹{item.rate_applied}
                      </div>
                      <div className="col-span-2 text-right font-black text-emerald-700">
                        ₹{item.earned_amount}
                      </div>
                    </div>
                  ))
                )}
              </div>
            </div>
          </div>
        )}

        {/* ── TAB 5: CONSOLIDATED REPORT ── */}
        {activeMainTab === "report" && (
          <div className="space-y-3">
            <div className="flex items-center justify-between">
              <h3 className="text-xs font-bold text-slate-700 uppercase tracking-wider">
                Chain Consolidated Report
              </h3>
              <select
                value={reportPeriod}
                onChange={(e) => setReportPeriod(e.target.value)}
                className="bg-white border border-slate-200 rounded-lg text-xs px-2 py-1 font-semibold text-slate-700 focus:outline-none"
              >
                <option value="all">All Time</option>
                <option value="today">Today</option>
                <option value="week">Past 7 Days</option>
                <option value="month">Past 30 Days</option>
              </select>
            </div>

            <div className="grid grid-cols-2 gap-2">
              <div className="bg-white rounded-2xl p-3 border border-slate-200 shadow-2xs space-y-1">
                <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wide">Total Acquired</span>
                <p className="text-xl font-black text-slate-900">{reportData?.total_acquisitions ?? totalInstall}</p>
                <span className="text-[10px] text-slate-500 font-medium">Across all sub-teams</span>
              </div>
              <div className="bg-white rounded-2xl p-3 border border-slate-200 shadow-2xs space-y-1">
                <span className="text-[10px] font-bold text-emerald-600 uppercase tracking-wide">Total Verified</span>
                <p className="text-xl font-black text-emerald-700">{reportData?.total_verified ?? totalVerified}</p>
                <span className="text-[10px] text-emerald-600 font-medium">Eligible for payout</span>
              </div>
              <div className="bg-white rounded-2xl p-3 border border-slate-200 shadow-2xs space-y-1">
                <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wide">Gross Earned</span>
                <p className="text-xl font-black text-slate-900">₹{reportData?.total_earned ?? totalEarnings}</p>
                <span className="text-[10px] text-slate-500 font-medium">Verified acquisitions</span>
              </div>
              <div className="bg-white rounded-2xl p-3 border border-slate-200 shadow-2xs space-y-1">
                <span className="text-[10px] font-bold text-amber-600 uppercase tracking-wide">Pending Due</span>
                <p className="text-xl font-black text-amber-700">₹{reportData?.total_pending_due ?? pendingPayout}</p>
                <span className="text-[10px] text-amber-600 font-medium">Unsettled amount</span>
              </div>
            </div>
          </div>
        )}

      </div>

      {/* ── APPROVAL MODAL FOR SUB-VENDOR REQUEST ── */}
      {selectedPendingSubVendor && (
        <div className="fixed inset-0 z-50 bg-slate-900/60 backdrop-blur-xs flex items-center justify-center p-4">
          <div className="bg-white rounded-2xl max-w-sm w-full p-4 border border-slate-200 shadow-xl space-y-3">
            <div className="flex items-center justify-between pb-2 border-b border-slate-100">
              <div className="flex items-center gap-2">
                <div className="w-7 h-7 rounded-lg bg-indigo-100 text-indigo-700 flex items-center justify-center font-bold">
                  <Building2 className="w-4 h-4" />
                </div>
                <div>
                  <h4 className="text-xs font-bold text-slate-900">Approve Sub-Vendor</h4>
                  <p className="text-[10px] text-slate-500">
                    {selectedPendingSubVendor.name} &bull; {selectedPendingSubVendor.phone}
                  </p>
                </div>
              </div>
              <button
                onClick={() => setSelectedPendingSubVendor(null)}
                className="w-6 h-6 rounded-lg bg-slate-100 text-slate-500 flex items-center justify-center text-xs font-bold"
              >
                ✕
              </button>
            </div>

            {/* Rate Ceiling Info Box */}
            <div className="bg-indigo-50 border border-indigo-100 rounded-xl p-2.5 space-y-1">
              <span className="text-[10px] font-bold uppercase tracking-wider text-indigo-800 block">
                Your Rate Ceiling:
              </span>
              <p className="text-xs text-indigo-950 font-bold">
                Max Cust: ₹{rateCustomer.toFixed(2)} &bull; Max Biz: ₹{rateBusiness.toFixed(2)}
              </p>
              <p className="text-[9.5px] text-indigo-700">
                Sub-Vendor rates cannot exceed your rate. The difference is your profit margin!
              </p>
            </div>

            {/* Designation Selector */}
            <div className="space-y-1">
              <label className="text-[11px] font-bold text-slate-700 block">Sub-Vendor Designation</label>
              <select
                value={approvalDesignation}
                onChange={(e) => setApprovalDesignation(e.target.value)}
                className="w-full bg-slate-50 border border-slate-200 rounded-xl px-3 py-2 text-xs font-semibold text-slate-800 focus:outline-none"
              >
                <option value="Marketing Head">Marketing Head</option>
                <option value="Digital Marketer">Digital Marketer</option>
                <option value="Area Sales Manager">Area Sales Manager</option>
                <option value="Field Coordinator">Field Coordinator</option>
                <option value="Territory Lead">Territory Lead</option>
                <option value="Sub-Vendor">Sub-Vendor (General)</option>
              </select>
            </div>

            {/* Customer Rate Input */}
            <div className="space-y-1">
              <label className="text-[11px] font-bold text-slate-700 block">
                Rate per Verified Customer (₹)
              </label>
              <input
                type="number"
                step="0.01"
                min="0"
                max={rateCustomer}
                value={approvalCustRate}
                onChange={(e) => setApprovalCustRate(e.target.value)}
                className="w-full bg-slate-50 border border-slate-200 rounded-xl px-3 py-2 text-xs font-bold text-slate-800 focus:outline-none"
                placeholder="₹0.00"
              />
              <span className="text-[9.5px] text-slate-400">Max allowed: ₹{rateCustomer.toFixed(2)}</span>
            </div>

            {/* Business Rate Input */}
            <div className="space-y-1">
              <label className="text-[11px] font-bold text-slate-700 block">
                Rate per Verified Business (₹)
              </label>
              <input
                type="number"
                step="0.01"
                min="0"
                max={rateBusiness}
                value={approvalBizRate}
                onChange={(e) => setApprovalBizRate(e.target.value)}
                className="w-full bg-slate-50 border border-slate-200 rounded-xl px-3 py-2 text-xs font-bold text-slate-800 focus:outline-none"
                placeholder="₹0.00"
              />
              <span className="text-[9.5px] text-slate-400">Max allowed: ₹{rateBusiness.toFixed(2)}</span>
            </div>

            {/* Rate Visibility Toggle */}
            <div className="flex items-center justify-between p-2.5 bg-slate-50 border border-slate-200 rounded-xl">
              <div>
                <span className="text-xs font-bold text-slate-800 block">Show Rate to Sub-Vendor</span>
                <span className="text-[9.5px] text-slate-400 block">When OFF, rates are hidden from their view</span>
              </div>
              <button
                type="button"
                onClick={() => setApprovalRateVisible(!approvalRateVisible)}
                className={`w-11 h-6 rounded-full transition-colors relative ${
                  approvalRateVisible ? "bg-emerald-600" : "bg-slate-300"
                }`}
              >
                <div
                  className={`w-4 h-4 rounded-full bg-white absolute top-1 transition-transform ${
                    approvalRateVisible ? "left-6" : "left-1"
                  }`}
                />
              </button>
            </div>

            {/* Actions */}
            <div className="grid grid-cols-2 gap-2 pt-1">
              <button
                onClick={() => setSelectedPendingSubVendor(null)}
                className="w-full py-2.5 rounded-xl border border-slate-200 text-slate-700 text-xs font-bold hover:bg-slate-50"
              >
                Cancel
              </button>
              <button
                onClick={handleApproveSubVendorSubmit}
                disabled={approvingLoading}
                className="w-full py-2.5 rounded-xl bg-indigo-700 text-white text-xs font-bold hover:bg-indigo-800 transition-colors shadow-2xs disabled:opacity-50"
              >
                {approvingLoading ? "Approving..." : "Approve & Activate"}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
