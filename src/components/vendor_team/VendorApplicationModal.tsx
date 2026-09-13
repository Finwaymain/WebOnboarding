"use client";

import React, { useState } from "react";
import { X, Briefcase, MapPin, Layers, FileText, CheckCircle2, AlertCircle } from "lucide-react";

interface VendorApplicationModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSuccess: (data: any) => void;
  apiBase: string;
  userId: string;
  userCat: string;
  token: string;
  apiKey: string;
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
}: VendorApplicationModalProps) {
  const [teamLocation, setTeamLocation] = useState("");
  const [teamType, setTeamType] = useState("Field Marketing Team");
  const [remarks, setRemarks] = useState("");
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);

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

      const payload = {
        id_user: userId,
        user_cat: userCat,
        team_location: teamLocation.trim(),
        team_type: teamType.trim(),
        remarks: remarks.trim(),
      };

      const res = await fetch(`${apiBase}/vendor-team/apply`, {
        method: "POST",
        headers,
        body: JSON.stringify(payload),
      });

      const json = await res.json();
      if (json.success === true) {
        onSuccess(json.data || payload);
        onClose();
      } else {
        setError(json.message || "Failed to submit application. Please try again.");
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
      <div className="bg-white rounded-2xl max-w-md w-full p-6 shadow-xl border border-slate-100 relative animate-in fade-in zoom-in-95 duration-200">
        
        {/* Close Button */}
        <button
          onClick={onClose}
          disabled={submitting}
          className="absolute top-4 right-4 p-2 rounded-xl text-slate-400 hover:text-slate-600 hover:bg-slate-100 transition-colors"
          title="Close"
        >
          <X className="w-5 h-5" />
        </button>

        {/* Header */}
        <div className="flex items-center gap-3 mb-5">
          <div className="w-11 h-11 rounded-xl bg-emerald-100 text-emerald-700 flex items-center justify-center shrink-0">
            <Briefcase className="w-6 h-6" />
          </div>
          <div>
            <span className="text-[10px] font-bold uppercase tracking-wider text-emerald-700 bg-emerald-50 px-2 py-0.5 rounded-md border border-emerald-200">
              Team Manager Role
            </span>
            <h3 className="text-lg font-bold text-slate-900 leading-snug">
              Apply as Marketing Vendor
            </h3>
          </div>
        </div>

        <p className="text-xs text-slate-500 mb-4 leading-relaxed">
          Lead a team of freelancers under your unique Vendor Code. Company Admin will review your application and configure your custom payout rates for verified customers & businesses.
        </p>

        {error && (
          <div className="mb-4 p-3 rounded-xl bg-red-50 border border-red-200 text-red-700 text-xs flex items-center gap-2">
            <AlertCircle className="w-4 h-4 shrink-0" />
            <span>{error}</span>
          </div>
        )}

        <form onSubmit={handleSubmit} className="space-y-4">
          {/* Team Location */}
          <div>
            <label className="block text-xs font-bold text-slate-700 mb-1.5 flex items-center gap-1.5">
              <MapPin className="w-3.5 h-3.5 text-slate-400" />
              Team Territory / City / Location <span className="text-red-500">*</span>
            </label>
            <input
              type="text"
              required
              placeholder="e.g. Jaipur & Suburbs, Lucknow Division..."
              value={teamLocation}
              onChange={(e) => setTeamLocation(e.target.value)}
              className="w-full text-xs px-3.5 py-2.5 rounded-xl border border-slate-200 focus:outline-hidden focus:border-emerald-600 focus:ring-1 focus:ring-emerald-600 bg-slate-50/50"
            />
          </div>

          {/* Team Type */}
          <div>
            <label className="block text-xs font-bold text-slate-700 mb-1.5 flex items-center gap-1.5">
              <Layers className="w-3.5 h-3.5 text-slate-400" />
              Team Type & Structure <span className="text-red-500">*</span>
            </label>
            <div className="flex flex-wrap gap-1.5 mb-2">
              {predefinedTypes.map((type) => (
                <button
                  type="button"
                  key={type}
                  onClick={() => setTeamType(type)}
                  className={`text-[11px] font-semibold px-2.5 py-1 rounded-lg border transition-all ${
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
              className="w-full text-xs px-3.5 py-2.5 rounded-xl border border-slate-200 focus:outline-hidden focus:border-emerald-600 focus:ring-1 focus:ring-emerald-600 bg-slate-50/50"
            />
          </div>

          {/* Remarks */}
          <div>
            <label className="block text-xs font-bold text-slate-700 mb-1.5 flex items-center gap-1.5">
              <FileText className="w-3.5 h-3.5 text-slate-400" />
              Additional Remarks / Experience (Optional)
            </label>
            <textarea
              rows={2}
              placeholder="e.g. 20+ campus agents ready to onboard customers..."
              value={remarks}
              onChange={(e) => setRemarks(e.target.value)}
              className="w-full text-xs px-3.5 py-2.5 rounded-xl border border-slate-200 focus:outline-hidden focus:border-emerald-600 focus:ring-1 focus:ring-emerald-600 bg-slate-50/50"
            />
          </div>

          {/* Submit Button */}
          <button
            type="submit"
            disabled={submitting}
            className="w-full mt-2 bg-[#047857] hover:bg-[#065f46] text-white font-bold text-xs py-3.5 rounded-xl shadow-xs flex items-center justify-center gap-2 transition-all active:scale-[0.99] disabled:opacity-50"
          >
            {submitting ? (
              <>
                <div className="w-3.5 h-3.5 rounded-full border-2 border-white/30 border-t-white animate-spin" />
                <span>Submitting Application...</span>
              </>
            ) : (
              <>
                <CheckCircle2 className="w-4 h-4" />
                <span>Submit Vendor Application</span>
              </>
            )}
          </button>
        </form>

      </div>
    </div>
  );
}
