"use client";

import React, { useState, useEffect } from "react";
import {
  Bell,
  CheckCircle2,
  AlertTriangle,
  ShieldAlert,
  Flame,
  CalendarDays,
  Send,
  X,
  Clock,
  Check,
} from "lucide-react";
import { AppNotification } from "@/lib/types/domain";
import {
  fetchNotifications,
  acknowledgeNotification,
  markNotificationRead,
} from "@/lib/api/notifications";
import { useAuthStore } from "@/lib/store/auth-store";
import { formatDate } from "@/lib/utils/dates";

interface NotificationCenterModalProps {
  isOpen: boolean;
  onClose: () => void;
}

const CATEGORY_ICONS: Record<string, any> = {
  GEOFENCE_BREACH: ShieldAlert,
  ATTENDANCE_HAZARD: Flame,
  INSPECTION_OVERDUE: CalendarDays,
  CAPA_NOTICE: AlertTriangle,
  GENERAL: Bell,
};

export function NotificationCenterModal({ isOpen, onClose }: NotificationCenterModalProps) {
  const { activeMineSiteId } = useAuthStore();
  const [notifications, setNotifications] = useState<AppNotification[]>([]);
  const [loading, setLoading] = useState(true);
  const [selectedNotif, setSelectedNotif] = useState<AppNotification | null>(null);
  const [actionNote, setActionNote] = useState("");
  const [isSubmitting, setIsSubmitting] = useState(false);

  const loadData = async () => {
    setLoading(true);
    try {
      const data = await fetchNotifications(activeMineSiteId);
      setNotifications(data);
    } catch (err) {
      console.error("Failed to load notifications", err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if (isOpen) {
      loadData();
    }
  }, [isOpen, activeMineSiteId]);

  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === "Escape") onClose();
    };
    if (isOpen) {
      window.addEventListener("keydown", handleKeyDown);
    }
    return () => window.removeEventListener("keydown", handleKeyDown);
  }, [isOpen, onClose]);

  const handleAcknowledge = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedNotif || !actionNote.trim()) return;

    setIsSubmitting(true);
    try {
      await acknowledgeNotification(selectedNotif.id, actionNote);
      setSelectedNotif(null);
      setActionNote("");
      await loadData();
    } catch (err) {
      console.error("Failed to acknowledge notification", err);
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleMarkRead = async (notifId: string, closeAfter: boolean = false) => {
    try {
      await markNotificationRead(notifId);
      await loadData();
      if (closeAfter) {
        onClose();
      }
    } catch (err) {
      console.error("Failed to mark read", err);
    }
  };

  if (!isOpen) return null;

  return (
    <div
      onClick={(e) => {
        if (e.target === e.currentTarget) onClose();
      }}
      className="fixed inset-0 z-50 bg-slate-950/80 backdrop-blur-sm flex items-center justify-center p-4 animate-in fade-in duration-200"
    >
      <div className="bg-slate-900 border border-slate-800 rounded-2xl w-full max-w-2xl shadow-2xl flex flex-col max-h-[80vh] overflow-hidden">
        {/* Header */}
        <div className="flex items-center justify-between px-6 py-4 border-b border-slate-800 bg-slate-950/50 shrink-0">
          <div className="flex items-center gap-2.5">
            <div className="p-2 rounded-xl bg-rose-500/20 text-rose-400 border border-rose-500/30">
              <Bell className="w-4 h-4" />
            </div>
            <div>
              <h3 className="font-bold text-slate-100 text-sm">
                Multi-Channel Governance Notification Center
              </h3>
              <p className="text-[11px] text-slate-400">
                In-app alerts, SMS push &amp; Ministry escalation feeds
              </p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="text-slate-400 hover:text-slate-200 p-1 rounded-lg hover:bg-slate-800 transition-colors"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Content Body - Scrollable Area */}
        <div className="flex-1 overflow-y-auto max-h-[55vh] min-h-[160px] p-6 space-y-4 overscroll-contain touch-pan-y">
          {loading ? (
            <div className="p-12 text-center text-xs text-slate-400">Loading alerts...</div>
          ) : notifications.length === 0 ? (
            <div className="p-12 text-center text-xs text-slate-400">
              No active notifications for this scope.
            </div>
          ) : (
            notifications.map((notif) => {
              const Icon = CATEGORY_ICONS[notif.category] || Bell;
              const isUrgent = notif.severity === "CRITICAL" || notif.severity === "URGENT";

              return (
                <div
                  key={notif.id}
                  className={`p-4 rounded-xl border transition-all ${
                    notif.is_acknowledged
                      ? "bg-slate-950/60 border-slate-800 text-slate-400"
                      : isUrgent
                      ? "bg-rose-500/10 border-rose-500/30 text-slate-200 shadow-md shadow-rose-950/30"
                      : "bg-slate-900 border-slate-700 text-slate-200 shadow-md"
                  }`}
                >
                  <div className="flex items-start justify-between gap-3">
                    <div className="flex items-start gap-3">
                      <div
                        className={`p-2 rounded-lg shrink-0 mt-0.5 ${
                          isUrgent ? "bg-rose-500/20 text-rose-400" : "bg-slate-800 text-slate-300"
                        }`}
                      >
                        <Icon className="w-4 h-4" />
                      </div>

                      <div className="space-y-1">
                        <div className="flex flex-wrap items-center gap-2">
                          <h4 className="font-bold text-xs text-slate-100">{notif.title}</h4>
                          <span
                            className={`text-[9px] font-mono px-1.5 py-0.5 rounded border font-semibold uppercase ${
                              isUrgent
                                ? "bg-rose-500/20 text-rose-300 border-rose-500/40"
                                : "bg-slate-800 text-slate-400 border-slate-700"
                            }`}
                          >
                            {notif.channel}
                          </span>
                          {notif.escalation_level > 0 && (
                            <span className="text-[9px] font-bold px-1.5 py-0.5 rounded bg-amber-500/20 text-amber-300 border border-amber-500/30">
                              Level {notif.escalation_level} Escalated
                            </span>
                          )}
                        </div>

                        <p className="text-xs text-slate-300 leading-relaxed">{notif.message}</p>

                        <div className="flex items-center gap-3 text-[10px] text-slate-500 pt-1 font-mono">
                          <span>{formatDate(notif.created_at)}</span>
                          {notif.recipient_role && (
                            <span>Role: {notif.recipient_role}</span>
                          )}
                        </div>

                        {/* Acknowledgement Status / Note */}
                        {notif.is_acknowledged ? (
                          <div className="mt-2.5 p-2.5 rounded-lg bg-emerald-500/10 border border-emerald-500/30 text-emerald-300 text-xs flex items-start gap-2">
                            <CheckCircle2 className="w-3.5 h-3.5 shrink-0 mt-0.5 text-emerald-400" />
                            <div>
                              <div className="font-semibold text-[11px]">
                                Acknowledged by {notif.acknowledged_by_name || "Authorized Officer"}
                              </div>
                              {notif.acknowledgement_note && (
                                <div className="text-[11px] text-emerald-400/90 mt-0.5 italic">
                                  &ldquo;{notif.acknowledgement_note}&rdquo;
                                </div>
                              )}
                            </div>
                          </div>
                        ) : (
                          <div className="pt-2 flex flex-wrap items-center gap-2">
                            <button
                              onClick={() => setSelectedNotif(notif)}
                              className="px-3 py-1 rounded-lg bg-emerald-500 hover:bg-emerald-400 text-slate-950 font-bold text-[11px] shadow-sm transition-all"
                            >
                              Acknowledge & Record Action
                            </button>
                            {!notif.is_read && (
                              <button
                                onClick={() => handleMarkRead(notif.id, true)}
                                className="px-2.5 py-1 rounded-lg bg-slate-800 hover:bg-slate-700 text-slate-300 text-[11px] font-medium transition-colors"
                                title="Mark read and dismiss modal"
                              >
                                Mark Read &amp; Close
                              </button>
                            )}
                          </div>
                        )}
                      </div>
                    </div>
                  </div>
                </div>
              );
            })
          )}
        </div>

        {/* Modal Sub-Dialog: Action Note */}
        {selectedNotif && (
          <div className="p-4 border-t border-slate-800 bg-slate-950">
            <form onSubmit={handleAcknowledge} className="space-y-2.5 text-xs">
              <div className="flex items-center justify-between">
                <span className="font-bold text-slate-200">
                  Acknowledge Alert: {selectedNotif.title}
                </span>
                <button
                  type="button"
                  onClick={() => setSelectedNotif(null)}
                  className="text-slate-400 hover:text-slate-200 text-xs"
                >
                  Cancel
                </button>
              </div>

              <textarea
                required
                rows={2}
                placeholder="Enter mandatory corrective action taken (e.g. Auxiliary fan #2 started, Dumper halted, Seam cleared)..."
                value={actionNote}
                onChange={(e) => setActionNote(e.target.value)}
                className="w-full bg-slate-900 border border-slate-700 rounded-xl px-3 py-2 text-slate-200 focus:outline-none focus:border-emerald-500"
              />

              <div className="flex justify-end">
                <button
                  type="submit"
                  disabled={isSubmitting}
                  className="flex items-center gap-1.5 px-4 py-2 rounded-xl bg-emerald-500 hover:bg-emerald-400 text-slate-950 font-bold shadow-md shadow-emerald-950 transition-all disabled:opacity-50"
                >
                  <Send className="w-3.5 h-3.5" />
                  <span>Submit Statutory Acknowledgment</span>
                </button>
              </div>
            </form>
          </div>
        )}

        {/* Footer Bar */}
        <div className="px-6 py-3 border-t border-slate-800 bg-slate-950/60 flex items-center justify-between">
          <span className="text-[10px] text-slate-400 font-mono">
            Press <kbd className="px-1.5 py-0.5 rounded bg-slate-800 border border-slate-700 text-slate-300">Esc</kbd> or click outside to dismiss
          </span>
          <button
            onClick={onClose}
            className="px-4 py-1.5 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-200 text-xs font-semibold transition-all border border-slate-700"
          >
            Close Notification Center
          </button>
        </div>
      </div>
    </div>
  );
}
