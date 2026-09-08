"use client";

import React, { useState } from "react";
import { useRouter } from "next/navigation";
import { useAuthStore } from "@/lib/store/auth-store";
import { UserRole } from "@/lib/types/domain";
import { API_BASE_URL } from "@/lib/api/client";
import { HardHat, ShieldCheck, Eye, EyeOff, Loader2, AlertCircle } from "lucide-react";

const DEMO_CREDENTIALS: Record<
  string,
  { role: UserRole; name: string; password: string; tenantPath?: string; mineSiteId?: string; mineName?: string }
> = {
  "auditor.hq@coal.gov.in": {
    role: UserRole.MINISTRY_AUDITOR,
    name: "Dr. R. K. Sharma (MOC Auditor)",
    password: "demo1234",
    tenantPath: "MOC",
    mineSiteId: "11111111-1111-4111-a111-111111111111",
    mineName: "Telangana & Pan-India Coal Basins",
  },
  "inspector.dgms@dgms.gov.in": {
    role: UserRole.DGMS_INSPECTOR,
    name: "Er. K. Venkat Rao (DGMS South Central Zone)",
    password: "demo1234",
    tenantPath: "MOC",
    mineSiteId: "11111111-1111-4111-a111-111111111111",
    mineName: "South Central Mining Zone (SCCL)",
  },
  "manager.gdk11a@scclmines.com": {
    role: UserRole.COLLIERY_MANAGER,
    name: "N. Ramesh (Colliery Manager - GDK 11A)",
    password: "demo1234",
    tenantPath: "MOC.SCCL.RAMAGUNDAM_1.GDK_11A",
    mineSiteId: "11111111-1111-4111-a111-111111111111",
    mineName: "Godavarikhani No. 11A Incline (GDK-11A)",
  },
  "sirdar.kasipet@scclmines.com": {
    role: UserRole.FIELD_WORKER,
    name: "K. Shankaraiah (Mining Sirdar - Kasipet)",
    password: "demo1234",
    tenantPath: "MOC.SCCL.MANDAMARRI.KASIPET_UG",
    mineSiteId: "44444444-4444-4444-a444-444444444444",
    mineName: "Kasipet Underground Mine",
  },
  "contractor.singareni@scclmines.com": {
    role: UserRole.CONTRACTOR_ADMIN,
    name: "T. Rajesh (Singareni HEMM Fleet Operations)",
    password: "demo1234",
    tenantPath: "MOC.SCCL.RAMAGUNDAM_2.RG_OCP3",
    mineSiteId: "22222222-2222-4222-a222-222222222222",
    mineName: "Ramagundam Opencast Project-III (RG-OCP 3)",
  },
};

const ROLE_COLORS: Partial<Record<UserRole, string>> = {
  [UserRole.MINISTRY_AUDITOR]: "text-amber-400 border-amber-500/30 bg-amber-500/10",
  [UserRole.DGMS_INSPECTOR]: "text-blue-400 border-blue-500/30 bg-blue-500/10",
  [UserRole.COLLIERY_MANAGER]: "text-purple-400 border-purple-500/30 bg-purple-500/10",
  [UserRole.AREA_ADMIN]: "text-cyan-400 border-cyan-500/30 bg-cyan-500/10",
  [UserRole.REGULATORY_OFFICER]: "text-indigo-400 border-indigo-500/30 bg-indigo-500/10",
  [UserRole.FIELD_WORKER]: "text-slate-400 border-slate-500/30 bg-slate-500/10",
  [UserRole.MINING_SIRDAR]: "text-orange-400 border-orange-500/30 bg-orange-500/10",
  [UserRole.CONTRACTOR_ADMIN]: "text-yellow-400 border-yellow-500/30 bg-yellow-500/10",
};

export default function LoginPage() {
  const router = useRouter();
  const { setAuth } = useAuthStore();
  const [email, setEmail] = useState("auditor.hq@coal.gov.in");
  const [password, setPassword] = useState("demo1234");
  const [showPassword, setShowPassword] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);
    setLoading(true);

    const cred = DEMO_CREDENTIALS[email];

    try {
      // 1. Attempt authenticating against FastAPI backend
      const res = await fetch(`${API_BASE_URL}/auth/login`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email, password }),
      });

      if (res.ok) {
        const data = await res.json();
        setAuth({
          accessToken: data.access_token,
          refreshToken: data.refresh_token,
          userRole: data.role as UserRole,
          userEmail: email,
          userName: cred?.name || email.split("@")[0],
          tenantPath: data.tenant_path || cred?.tenantPath || "MOC.SCCL.RAMAGUNDAM_1.GDK_11A",
          mineSiteId: cred?.mineSiteId || "11111111-1111-4111-a111-111111111111",
          mineName: cred?.mineName || "Godavarikhani No. 11A Incline (SCCL)",
        });
        router.push("/overview");
        return;
      }
    } catch (apiErr) {
      console.warn("Backend login offline, falling back to local credentials mode", apiErr);
    }

    // 2. Demo fallback authentication
    if (!cred || cred.password !== password) {
      setError("Invalid credentials. Use a demo account below.");
      setLoading(false);
      return;
    }

    setAuth({
      accessToken: `demo-jwt-${Date.now()}`,
      refreshToken: `demo-refresh-${Date.now()}`,
      userRole: cred.role,
      userEmail: email,
      userName: cred.name,
      tenantPath: cred.tenantPath || "MOC.SCCL.RAMAGUNDAM_1.GDK_11A",
      mineSiteId: cred.mineSiteId || "11111111-1111-4111-a111-111111111111",
      mineName: cred.mineName || "Godavarikhani No. 11A Incline (SCCL)",
    });

    router.push("/overview");
  };

  const handleQuickLogin = (emailKey: string) => {
    setEmail(emailKey);
    setPassword("demo1234");
    setError(null);
  };

  return (
    <div className="min-h-screen bg-[#080d14] flex">
      {/* Left Panel: Branding */}
      <div className="hidden lg:flex flex-col justify-between w-[480px] bg-gradient-to-b from-slate-900 via-emerald-950/30 to-slate-950 border-r border-slate-800 p-10 shrink-0">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-xl bg-gradient-to-tr from-emerald-600 to-teal-400 flex items-center justify-center shadow-lg shadow-emerald-950">
            <HardHat className="w-6 h-6 text-slate-950 stroke-[2.5]" />
          </div>
          <div>
            <div className="font-black text-slate-100 tracking-tight">COAL GOV AI</div>
            <div className="text-[10px] font-mono text-emerald-400 uppercase tracking-widest">SIH26024 • Ministry of Coal</div>
          </div>
        </div>

        <div className="space-y-8">
          <div>
            <h1 className="text-3xl font-black text-slate-100 leading-tight">
              AI-Based Smart Governance &amp; Compliance Portal
            </h1>
            <p className="text-sm text-slate-400 mt-4 leading-relaxed">
              Enterprise-grade compliance monitoring for coal mines — PostGIS spatial verification, 
              SHA-256 tamper-proof audit ledger, offline field inspections &amp; AI predictive hazard modeling.
            </p>
          </div>

          <div className="space-y-3">
            {[
              { icon: "🛡️", text: "DGMS &amp; MoEF Statutory Compliance" },
              { icon: "🗺️", text: "PostGIS Geofence Leasehold Verification" },
              { icon: "🔒", text: "SHA-256 Tamper-Evident Audit Chain" },
              { icon: "📡", text: "PWA Offline-First Field Inspections" },
              { icon: "🤖", text: "AI Risk Scoring &amp; Predictive Hazards" },
            ].map((feat, i) => (
              <div key={i} className="flex items-center gap-3 text-sm text-slate-300">
                <span className="text-lg">{feat.icon}</span>
                <span dangerouslySetInnerHTML={{ __html: feat.text }} />
              </div>
            ))}
          </div>
        </div>

        <div className="text-[11px] text-slate-500">
          Ministry of Coal, Government of India &bull; Problem Statement SIH26024
        </div>
      </div>

      {/* Right Panel: Login Form */}
      <div className="flex-1 flex flex-col items-center justify-center p-6 md:p-12">
        <div className="w-full max-w-md space-y-8">
          {/* Mobile Logo */}
          <div className="lg:hidden flex items-center gap-3 mb-2">
            <div className="w-9 h-9 rounded-xl bg-gradient-to-tr from-emerald-600 to-teal-400 flex items-center justify-center shadow-md">
              <HardHat className="w-5 h-5 text-slate-950" />
            </div>
            <div>
              <div className="font-black text-slate-100">COAL GOV AI</div>
              <div className="text-[10px] text-emerald-400 font-mono uppercase tracking-widest">SIH26024</div>
            </div>
          </div>

          <div>
            <h2 className="text-2xl font-black text-slate-100">Sign In</h2>
            <p className="text-xs text-slate-400 mt-1">
              Access the coal mines governance &amp; compliance portal
            </p>
          </div>

          {/* Error Banner */}
          {error && (
            <div className="flex items-center gap-2.5 p-3.5 rounded-xl bg-rose-500/10 border border-rose-500/30 text-rose-400 text-xs">
              <AlertCircle className="w-4 h-4 shrink-0" />
              <span>{error}</span>
            </div>
          )}

          {/* Login Form */}
          <form onSubmit={handleLogin} className="space-y-5">
            <div className="space-y-1.5">
              <label htmlFor="email" className="block text-xs font-semibold text-slate-300">
                Government Email
              </label>
              <input
                id="email"
                type="email"
                autoComplete="email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                placeholder="you@coal.gov.in"
                required
                className="w-full bg-slate-900 border border-slate-700 focus:border-emerald-500 text-slate-100 placeholder-slate-500 rounded-xl px-4 py-3 text-sm outline-none transition-colors focus:ring-1 focus:ring-emerald-500/30"
              />
            </div>

            <div className="space-y-1.5">
              <label htmlFor="password" className="block text-xs font-semibold text-slate-300">
                Password
              </label>
              <div className="relative">
                <input
                  id="password"
                  type={showPassword ? "text" : "password"}
                  autoComplete="current-password"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  placeholder="••••••••"
                  required
                  className="w-full bg-slate-900 border border-slate-700 focus:border-emerald-500 text-slate-100 placeholder-slate-500 rounded-xl px-4 py-3 pr-11 text-sm outline-none transition-colors focus:ring-1 focus:ring-emerald-500/30"
                />
                <button
                  type="button"
                  onClick={() => setShowPassword(!showPassword)}
                  className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-200 transition-colors"
                >
                  {showPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                </button>
              </div>
            </div>

            <button
              id="login-submit-btn"
              type="submit"
              disabled={loading}
              className="w-full flex items-center justify-center gap-2.5 bg-emerald-500 hover:bg-emerald-400 disabled:opacity-60 disabled:cursor-not-allowed text-slate-950 font-bold text-sm py-3 rounded-xl transition-all shadow-lg shadow-emerald-950/60 active:scale-[0.98]"
            >
              {loading ? (
                <>
                  <Loader2 className="w-4 h-4 animate-spin" />
                  <span>Authenticating…</span>
                </>
              ) : (
                <>
                  <ShieldCheck className="w-4 h-4" />
                  <span>Sign In Securely</span>
                </>
              )}
            </button>
          </form>

          {/* Quick Demo Accounts */}
          <div>
            <p className="text-[11px] font-semibold text-slate-500 uppercase tracking-widest mb-3 text-center">
              Demo Accounts (all use password: demo1234)
            </p>
            <div className="grid grid-cols-1 gap-2">
              {Object.entries(DEMO_CREDENTIALS).map(([emailKey, cred]) => (
                <button
                  key={emailKey}
                  id={`quick-login-${cred.role.toLowerCase()}`}
                  type="button"
                  onClick={() => handleQuickLogin(emailKey)}
                  className={`w-full text-left px-3.5 py-2.5 rounded-xl border text-xs transition-all hover:scale-[1.01] active:scale-[0.99] ${
                    email === emailKey
                      ? ROLE_COLORS[cred.role]
                      : "border-slate-800 bg-slate-900/50 text-slate-400 hover:border-slate-700 hover:text-slate-200"
                  }`}
                >
                  <div className="font-semibold">{cred.role.replace(/_/g, " ")}</div>
                  <div className="text-[10px] opacity-70 font-mono mt-0.5">{emailKey}</div>
                </button>
              ))}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
