"use client";

import React, { useState } from "react";
import { X, Briefcase, MapPin, Layers, FileText, CheckCircle2, AlertCircle, Building2 } from "lucide-react";

interface VendorApplicationModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSuccess: (data: any) => void;
  apiBase: string;
  userId: string;
  userCat: string;
  token: string;
  apiKey: string;
  initialCode?: string;
}

export default function VendorApplicationModal({
  isOpen,
  onClose,
  onSuccess,
  apiBase,
  userId,
  userCat,
  token,
  apiKey,
  initialCode = "",
}: VendorApplicationModalProps) {
  const [parentCode, setParentCode] = useState(initialCode);
  const [designation, setDesignation] = useState("Marketing Head");
  const [teamLocation, setTeamLocation] = useState("");
  const [teamType, setTeamType] = useState("Field Marketing Team");
  const [remarks, setRemarks] = useState("");
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);

  React.useEffect(() => {
    if (initialCode) {
      setParentCode(initialCode.toUpperCase());
    }
  }, [initialCode]);

  if (!isOpen) return null;

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!teamLocation.trim()) {
      setError("Please enter your team location or territory.");
      return;
    }
    if (!teamType.trim()) {
      setError("Please specify your team type.");
      return;
    }

    try {
      setSubmitting(true);
      setError(null);

      const headers: Record<string, string> = {
        "Content-Type": "application/json",
        "apikey": apiKey,
        "accesstoken": token,
        "id_user": userId,
        "user_cat": userCat,
      };

      const codeUpper = parentCode.trim().toUpperCase();
      let roleType = "sub_vendor";
      if (codeUpper.startsWith("FR")) {
        roleType = "freelancer";
      } else if (codeUpper.startsWith("SV")) {
        roleType = "sub_vendor";
      }

      const hasParent = Boolean(codeUpper);

      const url = hasParent
        ? `${apiBase}/vendor-team/join`
        : `${apiBase}/vendor-team/apply`;

      const payload = hasParent
        ? {
            id_user: userId,
            user_cat: userCat,
            vendor_code: codeUpper,
            role_type: roleType,
            designation: designation.trim(),
            team_location: teamLocation.trim(),
            team_type: teamType.trim(),
            remarks: remarks.trim(),
          }
        : {
            id_user: userId,
            user_cat: userCat,
            designation: "Head Vendor",
            team_location: teamLocation.trim(),
            team_type: teamType.trim(),
            remarks: remarks.trim(),
          };

      const res = await fetch(url, {
        method: "POST",
        headers,
        body: JSON.stringify(payload),
      });

      const json = await res.json();
      if (json.success === true) {
        onSuccess(json.data || payload);
        onClose();
      } else {
        setError(json.message || json.error || "Failed to submit application. Please check details.");
      }
    } catch (err: any) {
      setError("Network error. Please check your connection and try again.");
    } finally {
      setSubmitting(false);
    }
  };

  const predefinedTypes = [
    "Field Marketing Team",
    "Campus Ambassador Network",
    "Agency / Business Onboarding",
    "Direct Consumer Sales",
  ];

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-xs">
      <div className="bg-white rounded-2xl max-w-md w-full p-6 shadow-xl border border-slate-100 relative animate-in fade-in zoom-in-95 duration-200 max-h-[90vh] overflow-y-auto">
        
        {/* Close Button */}
        <button
          onClick={onClose}
          disabled={submitting}
          className="absolute top-4 right-4 w-8 h-8 rounded-full bg-slate-100 hover:bg-slate-200 text-slate-500 hover:text-slate-800 flex items-center justify-center transition-colors"
        >
          <X className="w-4 h-4" />
        </button>

        {/* Header */}
        <div className="flex items-center gap-3 mb-2">
          <div className="w-10 h-10 rounded-xl bg-emerald-100 text-emerald-800 flex items-center justify-center font-bold shrink-0">
            <Building2 className="w-5 h-5" />
          </div>
          <div>
            <h3 className="text-base font-bold text-slate-900 leading-tight">
              Apply for Vendor / Sub-Vendor
            </h3>
            <span className="text-[11px] font-semibold text-emerald-700 bg-emerald-50 px-2 py-0.5 rounded-full inline-block mt-0.5">
              Multi-Level Partner Network
            </span>
          </div>
        </div>

        <p className="text-xs text-slate-500 mb-4 leading-relaxed">
          Manage your own team of Sub-Vendors and Freelancers. Earn custom commission on every verified customer and business user acquired.
        </p>

        {error && (
          <div className="mb-4 p-3 rounded-xl bg-red-50 border border-red-200 text-red-700 text-xs flex items-center gap-2">
            <AlertCircle className="w-4 h-4 shrink-0" />
            <span>{error}</span>
          </div>
        )}

        <form onSubmit={handleSubmit} className="space-y-3.5">
          {/* Parent Vendor Code (Optional) */}
          <div>
            <label className="block text-xs font-bold text-slate-700 mb-1 flex items-center justify-between">
              <span>Joining Code (Optional)</span>
              <span className="text-[10px] text-slate-400 font-normal">Leave blank if Top-Level Vendor</span>
            </label>
            <input
              type="text"
              placeholder="e.g. SV10001 (Sub-Vendor) or FR10001 (Freelancer) or VR10001"
              value={parentCode}
              onChange={(e) => setParentCode(e.target.value.toUpperCase())}
              className="w-full text-xs px-3.5 py-2.5 rounded-xl border border-slate-200 font-mono focus:outline-hidden focus:border-indigo-600 bg-slate-50/50"
            />
            {parentCode.startsWith("SV") && (
              <div className="mt-1.5 p-2 rounded-lg bg-indigo-50 border border-indigo-200 text-indigo-800 text-[11px] font-bold flex items-center gap-1.5">
                <CheckCircle2 className="w-3.5 h-3.5 text-indigo-600 shrink-0" />
                <span>Auto-detected: <strong>Sub-Vendor Joining Code</strong>. You will be mapped under this Parent Vendor for approval.</span>
              </div>
            )}
            {parentCode.startsWith("FR") && (
              <div className="mt-1.5 p-2 rounded-lg bg-emerald-50 border border-emerald-200 text-emerald-800 text-[11px] font-bold flex items-center gap-1.5">
                <CheckCircle2 className="w-3.5 h-3.5 text-emerald-600 shrink-0" />
                <span>Auto-detected: <strong>Freelancer Joining Code</strong>. You will directly join this Vendor's field team.</span>
              </div>
            )}
            {parentCode.startsWith("VR") && (
              <div className="mt-1.5 p-2 rounded-lg bg-slate-100 border border-slate-200 text-slate-700 text-[11px] font-medium flex items-center gap-1.5">
                <span>Vendor Master Code: Linked to parent vendor.</span>
              </div>
            )}
          </div>

          {/* Designation */}
          <div>
            <label className="block text-xs font-bold text-slate-700 mb-1">
              Your Designation / Role Title <span className="text-red-500">*</span>
            </label>
            <select
              value={designation}
              onChange={(e) => setDesignation(e.target.value)}
              className="w-full text-xs px-3.5 py-2.5 rounded-xl border border-slate-200 focus:outline-hidden focus:border-emerald-600 bg-slate-50/50 font-medium text-slate-800"
            >
              <option value="Marketing Head">Marketing Head</option>
              <option value="Digital Marketer">Digital Marketer</option>
              <option value="Area Sales Manager">Area Sales Manager</option>
              <option value="Field Coordinator">Field Coordinator</option>
              <option value="Business Development Lead">Business Development Lead</option>
              <option value="Head Vendor">Head Vendor (Direct)</option>
              <option value="Sub-Vendor">Sub-Vendor (General)</option>
            </select>
          </div>

          {/* Team Location */}
          <div>
            <label className="block text-xs font-bold text-slate-700 mb-1 flex items-center gap-1.5">
              <MapPin className="w-3.5 h-3.5 text-slate-400" />
              Team Territory / City / Location <span className="text-red-500">*</span>
            </label>
            <input
              type="text"
              required
              placeholder="e.g. Jaipur & Suburbs, Lucknow Division..."
              value={teamLocation}
              onChange={(e) => setTeamLocation(e.target.value)}
              className="w-full text-xs px-3.5 py-2.5 rounded-xl border border-slate-200 focus:outline-hidden focus:border-emerald-600 bg-slate-50/50"
            />
          </div>

          {/* Team Type */}
          <div>
            <label className="block text-xs font-bold text-slate-700 mb-1 flex items-center gap-1.5">
              <Layers className="w-3.5 h-3.5 text-slate-400" />
              Team Type & Structure <span className="text-red-500">*</span>
            </label>
            <div className="flex flex-wrap gap-1.5 mb-1.5">
              {predefinedTypes.map((type) => (
                <button
                  type="button"
                  key={type}
                  onClick={() => setTeamType(type)}
                  className={`text-[10.5px] font-semibold px-2 py-0.5 rounded-lg border transition-all ${
                    teamType === type
                      ? "bg-emerald-50 border-emerald-500 text-emerald-800"
                      : "bg-slate-50 border-slate-200 text-slate-600 hover:bg-slate-100"
                  }`}
                >
                  {type}
                </button>
              ))}
            </div>
            <input
              type="text"
              required
              placeholder="Or specify custom team type..."
              value={teamType}
              onChange={(e) => setTeamType(e.target.value)}
              className="w-full text-xs px-3.5 py-2.5 rounded-xl border border-slate-200 focus:outline-hidden focus:border-emerald-600 bg-slate-50/50"
            />
          </div>

          {/* Remarks */}
          <div>
            <label className="block text-xs font-bold text-slate-700 mb-1 flex items-center gap-1.5">
              <FileText className="w-3.5 h-3.5 text-slate-400" />
              Additional Notes / Remarks (Optional)
            </label>
            <textarea
              rows={2}
              placeholder="Brief details about your team size, target territory..."
              value={remarks}
              onChange={(e) => setRemarks(e.target.value)}
              className="w-full text-xs px-3.5 py-2 rounded-xl border border-slate-200 focus:outline-hidden focus:border-emerald-600 bg-slate-50/50 resize-none"
            />
          </div>

          {/* Submit Button */}
          <button
            type="submit"
            disabled={submitting}
            className="w-full mt-2 bg-[#047857] hover:bg-[#065f46] text-white font-bold text-xs py-3 rounded-xl shadow-xs flex items-center justify-center gap-2 transition-all active:scale-[0.99] disabled:opacity-50"
          >
            {submitting ? (
              <>
                <div className="w-3.5 h-3.5 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                <span>Submitting Application...</span>
              </>
            ) : (
              <>
                <CheckCircle2 className="w-4 h-4" />
                <span>Submit Application</span>
              </>
            )}
          </button>
        </form>
      </div>
    </div>
  );
}
