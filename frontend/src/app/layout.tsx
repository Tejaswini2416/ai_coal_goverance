import type { Metadata } from "next";
import "@/styles/globals.css";
import React from "react";
import { SyncConflictModal } from "@/components/inspections/sync-conflict-modal";
import { QueryProvider } from "@/components/providers/query-provider";

export const metadata: Metadata = {
  title: "AI-Based Smart Governance for Coal Mines (SIH26024)",
  description: "Ministry of Coal & DGMS Smart Compliance Monitoring & Field Portal",
  manifest: "/manifest.json",
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="en" className="dark" suppressHydrationWarning>
      <body className="bg-[#080d14] text-slate-100 font-sans antialiased min-h-screen" suppressHydrationWarning>
        <QueryProvider>
          {children}
          {/* Global Conflict Resolution Modal */}
          <SyncConflictModal />
        </QueryProvider>
      </body>
    </html>
  );
}
