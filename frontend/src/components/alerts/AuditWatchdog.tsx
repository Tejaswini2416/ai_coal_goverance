"use client";

import React from "react";
import { useAuditVerify } from "@/lib/api/useAuditVerify";
import { useAuthStore } from "@/lib/store/auth-store";
import { UserRole } from "@/lib/types/domain";
import { EmergencyAlertModal } from "./EmergencyAlertModal";

export function AuditWatchdog() {
  const { userRole } = useAuthStore();
  const isMinister = userRole === UserRole.MINISTRY_AUDITOR;

  // Initiates 15s cryptographic verification polling strictly for the Minister
  useAuditVerify();

  // Completely omit tamper alerting for Colliery Managers and other field personas
  if (!isMinister) {
    return null;
  }

  return <EmergencyAlertModal />;
}
