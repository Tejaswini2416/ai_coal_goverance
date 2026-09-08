"use client";

import React from "react";
import { useAuditVerify } from "@/lib/api/useAuditVerify";
import { AuditTamperAlertModal } from "./AuditTamperAlertModal";

export function AuditWatchdog() {
  // Initiates 15s cryptographic verification polling
  useAuditVerify();

  return <AuditTamperAlertModal />;
}
