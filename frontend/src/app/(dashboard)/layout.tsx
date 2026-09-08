import React from "react";
import { AppSidebar } from "@/components/layout/app-sidebar";
import { TopNavbar } from "@/components/layout/top-navbar";
import { OfflineStatusBar } from "@/components/layout/OfflineStatusBar";
import { SafetyDirectivesFooter } from "@/components/layout/SafetyDirectivesFooter";
import { AuditWatchdog } from "@/components/alerts/AuditWatchdog";

export default function DashboardLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <div className="flex min-h-screen bg-[#080d14]">
      {/* Sidebar */}
      <AppSidebar />

      {/* Main Content Area */}
      <div className="flex-1 flex flex-col min-w-0">
        <TopNavbar />
        {/* Global Zero-Connectivity Pit Offline Banner */}
        <OfflineStatusBar />
        <main className="flex-1 p-6 md:p-8 overflow-y-auto max-w-7xl w-full mx-auto">
          {children}
        </main>
        {/* Persistent Statutory Safety Rules & Guidelines Footer */}
        <SafetyDirectivesFooter />
      </div>

      {/* Global Real-Time Cryptographic Ledger Watchdog & Emergency Alert Modal */}
      <AuditWatchdog />
    </div>
  );
}
