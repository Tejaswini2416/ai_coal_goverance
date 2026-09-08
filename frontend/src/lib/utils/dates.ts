/**
 * Statutory date formatting and countdown helpers
 */

export function formatDate(isoString?: string | null): string {
  if (!isoString) return "-";
  try {
    const d = new Date(isoString);
    return d.toLocaleDateString("en-IN", {
      day: "2-digit",
      month: "short",
      year: "numeric",
      hour: "2-digit",
      minute: "2-digit",
    });
  } catch {
    return isoString;
  }
}

export function formatShortDate(dateStr?: string | null): string {
  if (!dateStr) return "-";
  try {
    const d = new Date(dateStr);
    return d.toLocaleDateString("en-IN", {
      day: "2-digit",
      month: "short",
      year: "numeric",
    });
  } catch {
    return dateStr;
  }
}

export function getDaysRemaining(expiryDateStr: string): number {
  const expiry = new Date(expiryDateStr).getTime();
  const now = new Date().getTime();
  return Math.ceil((expiry - now) / (1000 * 60 * 60 * 24));
}

export function getExpiryBadgeClass(days: number): string {
  if (days <= 1) return "bg-rose-500/20 text-rose-400 border border-rose-500/30 animate-pulse";
  if (days <= 7) return "bg-amber-500/20 text-amber-400 border border-amber-500/30";
  if (days <= 15) return "bg-yellow-500/20 text-yellow-400 border border-yellow-500/30";
  if (days <= 30) return "bg-blue-500/20 text-blue-400 border border-blue-500/30";
  return "bg-emerald-500/20 text-emerald-400 border border-emerald-500/30";
}
