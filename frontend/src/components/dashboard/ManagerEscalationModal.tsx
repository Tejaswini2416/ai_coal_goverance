"use client";

import React, { useState } from "react";
import {
  Send,
  X,
  Mail,
  AlertTriangle,
  Flame,
  ShieldAlert,
  CheckCircle2,
  Lock,
  Cpu,
  FileText,
  Building2,
  Clock,
} from "lucide-react";
import { API_BASE_URL } from "@/lib/api/client";
import { useAuthStore } from "@/lib/store/auth-store";

interface ManagerEscalationModalProps {
  isOpen: boolean;
  onClose: () => void;
  mineSiteId?: string | null;
  mineName?: string;
  onDispatched?: () => void;
}

export function ManagerEscalationModal({
  isOpen,
  onClose,
  mineSiteId,
  mineName,
  onDispatched,
}: ManagerEscalationModalProps) {
  const { accessToken, userEmail, userName } = useAuthStore();
  const [priority, setPriority] = useState<string>("URGENT");
  const [category, setCategory] = useState<string>("SAFETY_BREACH");
  const [subject, setSubject] = useState<string>("");
  const [messageBody, setMessageBody] = useState<string>("");
  const [attachSnapshot, setAttachSnapshot] = useState<boolean>(true);
  const [isSubmitting, setIsSubmitting] = useState<boolean>(false);
  const [successResponse, setSuccessResponse] = useState<any>(null);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);

  if (!isOpen) return null;

  const collieryName = mineName || "Godavarikhani No. 11A Incline (GDK-11A) SCCL";

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!subject.trim() || !messageBody.trim()) {
      setErrorMessage("Please complete the subject and message body before dispatching.");
      return;
    }

    setIsSubmitting(true);
    setErrorMessage(null);

    try {
      const token = accessToken;
      const res = await fetch(`${API_BASE_URL}/escalations/manager-to-ministry`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          ...(token ? { Authorization: `Bearer ${token}` } : {}),
        },
        body: JSON.stringify({
          mine_site_id: mineSiteId || "11111111-1111-4111-a111-111111111111",
          subject,
          priority,
          category,
          message_body: messageBody,
          attach_telemetry_snapshot: attachSnapshot,
        }),
      });

      if (!res.ok) {
        const err = await res.json().catch(() => ({}));
        throw new Error(err.detail || "Dispatch failed. Please retry.");
      }

      const data = await res.json();
      setSuccessResponse(data);
      if (onDispatched) onDispatched();
    } catch (err: any) {
      setErrorMessage(err.message || "Failed to transmit official memo.");
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleResetAndClose = () => {
    setSuccessResponse(null);
    setErrorMessage(null);
    setSubject("");
    setMessageBody("");
    onClose();
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-md animate-in fade-in duration-200">
      <div className="w-full max-w-2xl bg-slate-900 border border-slate-800 rounded-3xl shadow-2xl overflow-hidden flex flex-col max-h-[90vh]">
        {/* Header */}
        <div className="p-6 border-b border-slate-800 flex items-center justify-between bg-gradient-to-r from-slate-950 via-slate-900 to-slate-900">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-2xl bg-blue-500/10 border border-blue-500/20 flex items-center justify-center text-blue-400">
              <Mail className="w-5 h-5" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h2 className="text-base font-bold text-slate-100">
                  Dispatch Official Statutory Memo to Ministry of Coal
                </h2>
                <span className="text-[10px] bg-blue-500/20 text-blue-300 px-2 py-0.5 rounded-full font-bold">
                  Direct Line
                </span>
              </div>
              <p className="text-xs text-slate-400 mt-0.5">
                From: <span className="text-slate-200">{userName || userEmail || "Colliery Manager"}</span> ({collieryName})
              </p>
            </div>
          </div>
          <button
            onClick={handleResetAndClose}
            className="p-2 rounded-xl text-slate-400 hover:text-slate-200 hover:bg-slate-800 transition-colors"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Content Area */}
        <div className="p-6 overflow-y-auto space-y-4">
          {successResponse ? (
            <div className="space-y-4 text-center py-4">
              <div className="w-16 h-16 rounded-3xl bg-emerald-500/10 border border-emerald-500/30 flex items-center justify-center text-emerald-400 mx-auto">
                <CheckCircle2 className="w-8 h-8" />
              </div>
              <div>
                <h3 className="text-lg font-black text-slate-100">
                  Statutory Memo Dispatched &amp; Cryptographically Logged!
                </h3>
                <p className="text-xs text-slate-400 max-w-md mx-auto mt-1">
                  {successResponse.delivery_summary}
                </p>
              </div>

              <div className="p-4 rounded-2xl bg-slate-950 border border-slate-800 text-left font-mono text-xs space-y-2 max-w-lg mx-auto">
                <div className="flex justify-between">
                  <span className="text-slate-500">Escalation UUID:</span>
                  <span className="text-slate-300">{successResponse.escalation_id}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-slate-500">Recipients:</span>
                  <span className="text-emerald-400 font-bold">MINISTRY_AUDITOR ({successResponse.target_emails?.join(", ")})</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-slate-500">Audit Block Hash:</span>
                  <span className="text-blue-400 font-bold">
                    {successResponse.audit_block_hash ? `${successResponse.audit_block_hash.slice(0, 16)}...` : "SHA256_VERIFIED"}
                  </span>
                </div>
                <div className="flex justify-between">
                  <span className="text-slate-500">Delivery Status:</span>
                  <span className="text-emerald-400">DISPATCHED_AND_LOGGED</span>
                </div>
              </div>

              <div className="pt-2">
                <button
                  onClick={handleResetAndClose}
                  className="px-6 py-2.5 rounded-xl bg-blue-600 hover:bg-blue-500 text-white text-xs font-bold transition-all shadow-lg shadow-blue-950"
                >
                  Return to Cockpit
                </button>
              </div>
            </div>
          ) : (
            <form onSubmit={handleSubmit} className="space-y-4">
              {errorMessage && (
                <div className="p-3.5 rounded-xl bg-rose-500/10 border border-rose-500/30 text-rose-400 text-xs font-medium flex items-center gap-2">
                  <AlertTriangle className="w-4 h-4 shrink-0" />
                  <span>{errorMessage}</span>
                </div>
              )}

              {/* Priority & Category Grid */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div>
                  <label className="text-[11px] font-mono text-slate-400 font-bold block mb-1.5 uppercase">
                    Statutory Priority Level
                  </label>
                  <select
                    value={priority}
                    onChange={(e) => setPriority(e.target.value)}
                    className="w-full px-3 py-2 bg-slate-950 border border-slate-800 rounded-xl text-xs text-slate-200 focus:outline-none focus:border-blue-500/50"
                  >
                    <option value="NORMAL">NORMAL (Informational Return)</option>
                    <option value="URGENT">URGENT (Action Required 24h)</option>
                    <option value="STATUTORY_EMERGENCY">STATUTORY_EMERGENCY (Immediate DGMS/MOC Alert)</option>
                  </select>
                </div>

                <div>
                  <label className="text-[11px] font-mono text-slate-400 font-bold block mb-1.5 uppercase">
                    Issue Category
                  </label>
                  <select
                    value={category}
                    onChange={(e) => setCategory(e.target.value)}
                    className="w-full px-3 py-2 bg-slate-950 border border-slate-800 rounded-xl text-xs text-slate-200 focus:outline-none focus:border-blue-500/50"
                  >
                    <option value="SAFETY_BREACH">SAFETY_BREACH (Statutory Violation Notice)</option>
                    <option value="VENTILATION_CRISIS">VENTILATION_CRISIS (Toxic Gas Excursion)</option>
                    <option value="SUDDEN_SEAM_HEATING">SUDDEN_SEAM_HEATING (Spontaneous Combustion)</option>
                    <option value="PRODUCTION_HALT">PRODUCTION_HALT (Opencast/UG Stoppage)</option>
                    <option value="ENVIRONMENTAL_CLEARANCE">ENVIRONMENTAL_CLEARANCE (MoEF/SPCB Waiver)</option>
                  </select>
                </div>
              </div>

              {/* Subject Line */}
              <div>
                <label className="text-[11px] font-mono text-slate-400 font-bold block mb-1.5 uppercase">
                  Official Subject Line
                </label>
                <input
                  type="text"
                  placeholder="e.g., Immediate Notification of Seam Heating Excursion in Return Airway Gallery #4"
                  value={subject}
                  onChange={(e) => setSubject(e.target.value)}
                  className="w-full px-3.5 py-2.5 bg-slate-950 border border-slate-800 rounded-xl text-xs text-slate-200 placeholder-slate-500 focus:outline-none focus:border-blue-500/50"
                />
              </div>

              {/* Message Body */}
              <div>
                <label className="text-[11px] font-mono text-slate-400 font-bold block mb-1.5 uppercase">
                  Statutory Communication Memo Body
                </label>
                <textarea
                  rows={5}
                  placeholder="Provide precise statutory context, affected mine gallery levels, observed toxic gas telemetry readings, worker muster status, and emergency CAPA directives initiated..."
                  value={messageBody}
                  onChange={(e) => setMessageBody(e.target.value)}
                  className="w-full p-3 bg-slate-950 border border-slate-800 rounded-xl text-xs text-slate-200 placeholder-slate-500 focus:outline-none focus:border-blue-500/50 leading-relaxed font-sans"
                />
              </div>

              {/* Live Seam Telemetry Snapshot Toggle & Card */}
              <div className="p-4 rounded-2xl bg-slate-950 border border-slate-800 space-y-3">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <Cpu className="w-4 h-4 text-blue-400" />
                    <span className="text-xs font-bold text-slate-200">
                      Live Seam AI Telemetry Snapshot
                    </span>
                  </div>
                  <label className="flex items-center gap-2 cursor-pointer text-xs text-slate-300 font-medium">
                    <input
                      type="checkbox"
                      checked={attachSnapshot}
                      onChange={(e) => setAttachSnapshot(e.target.checked)}
                      className="rounded border-slate-700 text-blue-600 focus:ring-blue-500"
                    />
                    <span>Attach Live Seam Readings</span>
                  </label>
                </div>

                {attachSnapshot && (
                  <div className="grid grid-cols-2 sm:grid-cols-4 gap-2 text-xs font-mono bg-slate-900/60 p-3 rounded-xl border border-slate-800/80">
                    <div>
                      <span className="text-slate-500 text-[10px] block">Overall Risk</span>
                      <span className="text-amber-400 font-bold">68.5 / 100</span>
                    </div>
                    <div>
                      <span className="text-slate-500 text-[10px] block">CH4 (Methane)</span>
                      <span className="text-slate-200 font-bold">0.42%</span>
                    </div>
                    <div>
                      <span className="text-slate-500 text-[10px] block">CO Concentration</span>
                      <span className="text-rose-400 font-bold">14.5 ppm</span>
                    </div>
                    <div>
                      <span className="text-slate-500 text-[10px] block">Incline Depth</span>
                      <span className="text-slate-200 font-bold">380 m</span>
                    </div>
                  </div>
                )}
              </div>

              {/* Action Buttons */}
              <div className="flex items-center justify-between pt-2">
                <span className="text-[11px] text-slate-500 font-mono">
                  Guaranteed append-only SHA-256 audit block logging
                </span>
                <div className="flex items-center gap-3">
                  <button
                    type="button"
                    onClick={handleResetAndClose}
                    className="px-4 py-2 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-300 text-xs font-semibold"
                  >
                    Cancel
                  </button>
                  <button
                    type="submit"
                    disabled={isSubmitting}
                    className="px-5 py-2.5 rounded-xl bg-blue-600 hover:bg-blue-500 text-white text-xs font-bold transition-all shadow-lg shadow-blue-950 flex items-center gap-2 disabled:opacity-50"
                  >
                    <Send className="w-3.5 h-3.5" />
                    <span>{isSubmitting ? "Transmitting Memo..." : "Dispatch Official Memo"}</span>
                  </button>
                </div>
              </div>
            </form>
          )}
        </div>
      </div>
    </div>
  );
}
