"use client";

import React from "react";
import { useAuditVerify } from "@/lib/api/useAuditVerify";
import { EmergencyAlertModal } from "./EmergencyAlertModal";

export function AuditWatchdog() {
  // Initiates 15s cryptographic verification polling
  useAuditVerify();

  return <EmergencyAlertModal />;
}
