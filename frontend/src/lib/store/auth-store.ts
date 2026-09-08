import { create } from "zustand";
import { UserRole } from "../types/domain";

interface AuthState {
  accessToken: string | null;
  refreshToken: string | null;
  userRole: UserRole;
  userName: string;
  userEmail: string;
  activeTenantPath: string;
  activeMineSiteId: string;
  activeMineName: string;
  isSimulatedAuth: boolean;
  setAuth: (payload: {
    accessToken: string;
    refreshToken: string;
    userRole: UserRole;
    userEmail: string;
    userName?: string;
    tenantPath?: string;
    mineSiteId?: string;
    mineName?: string;
  }) => void;
  setActiveTenant: (path: string, mineSiteId: string, mineName: string) => void;
  setActiveMine: (mineSiteId: string, mineName: string, area?: string) => void;
  switchRole: (role: UserRole) => void;
  logout: () => void;
}

const isDemoAllowed =
  typeof window !== "undefined" &&
  (process.env.NEXT_PUBLIC_DEMO_MODE === "true" || !process.env.NODE_ENV || process.env.NODE_ENV === "development");

export const useAuthStore = create<AuthState>((set, get) => ({
  accessToken: "demo-jwt-token-sih26024",
  refreshToken: "demo-refresh-token-sih26024",
  userRole: UserRole.MINISTRY_AUDITOR,
  userName: "Dr. R. K. Sharma (MOC Auditor)",
  userEmail: "auditor.hq@coal.gov.in",
  activeTenantPath: "MOC",
  activeMineSiteId: "11111111-1111-4111-a111-111111111111",
  activeMineName: "Godavarikhani No. 11A Incline (SCCL)",
  isSimulatedAuth: true,

  setAuth: ({ accessToken, refreshToken, userRole, userEmail, userName, tenantPath, mineSiteId, mineName }) =>
    set({
      accessToken,
      refreshToken,
      userRole,
      userEmail,
      userName: userName || userEmail.split("@")[0],
      activeTenantPath: tenantPath || "MOC.SCCL.RAMAGUNDAM_1.GDK_11A",
      activeMineSiteId: mineSiteId || "11111111-1111-4111-a111-111111111111",
      activeMineName: mineName || "Godavarikhani No. 11A Incline (SCCL)",
      isSimulatedAuth: false,
    }),

  setActiveTenant: (path, mineSiteId, mineName) =>
    set({
      activeTenantPath: path,
      activeMineSiteId: mineSiteId,
      activeMineName: mineName,
    }),
  setActiveMine: (mineSiteId: string, mineName: string, area?: string) =>
    set({
      activeMineSiteId: mineSiteId,
      activeMineName: mineName,
    }),

  switchRole: (role) => {
    // In production, prohibit arbitrary role switching unless explicit demo mode is set
    if (!isDemoAllowed && !get().isSimulatedAuth) {
      console.warn("Unauthorized role switch attempt blocked in strict production mode.");
      return;
    }

    let name = "User";
    let email = "user@coal.gov.in";
    let mineName = "Godavarikhani No. 11A Incline (SCCL)";
    let mineId = "11111111-1111-4111-a111-111111111111";
    let path = "MOC";

    if (role === UserRole.MINISTRY_AUDITOR || role === UserRole.REGULATORY_OFFICER) {
      name = "Dr. R. K. Sharma (MOC Auditor)";
      email = "auditor.hq@coal.gov.in";
      path = "MOC";
      mineName = "Telangana & Pan-India Coal Basins";
    } else if (role === UserRole.DGMS_INSPECTOR) {
      name = "Er. K. Venkat Rao (DGMS Inspector)";
      email = "inspector.dgms@dgms.gov.in";
      path = "MOC";
      mineName = "South Central Mining Zone (SCCL)";
    } else if (role === UserRole.COLLIERY_MANAGER || role === UserRole.AREA_ADMIN) {
      name = "N. Ramesh (Colliery Manager)";
      email = "manager.gdk11a@scclmines.com";
      path = "MOC.SCCL.RAMAGUNDAM_1.GDK_11A";
      mineName = "Godavarikhani No. 11A Incline (SCCL)";
    } else if (role === UserRole.FIELD_WORKER || role === UserRole.MINING_SIRDAR) {
      name = "K. Shankaraiah (Mining Sirdar)";
      email = "sirdar.kasipet@scclmines.com";
      path = "MOC.SCCL.MANDAMARRI.KASIPET_UG";
      mineName = "Kasipet Underground Mine";
      mineId = "44444444-4444-4444-a444-444444444444";
    } else if (role === UserRole.CONTRACTOR_ADMIN) {
      name = "T. Rajesh (Contractor Fleet Admin)";
      email = "contractor.singareni@scclmines.com";
      path = "MOC.SCCL.RAMAGUNDAM_2.RG_OCP3";
      mineName = "Ramagundam Opencast Project-III (RG-OCP 3)";
      mineId = "22222222-2222-4222-a222-222222222222";
    } else {
      name = "SCCL Corporate Admin (Kothagudem)";
      email = "admin@scclmines.com";
      path = "MOC.SCCL";
      mineName = "The Singareni Collieries Company Limited";
    }

    set({
      userRole: role,
      userName: name,
      userEmail: email,
      activeTenantPath: path,
      activeMineName: mineName,
      activeMineSiteId: mineId,
    });
  },

  logout: () =>
    set({
      accessToken: null,
      refreshToken: null,
      userRole: UserRole.MINISTRY_AUDITOR,
      userName: "",
      userEmail: "",
      isSimulatedAuth: true,
    }),
}));
