# ⛏️ Coal Mines AI Governance & Statutory Compliance Monitoring System

> **Problem Statement ID: SIH26024** | *Ministry of Coal & DGMS Digital Governance Initiative*  
> An enterprise-grade, offline-first, AI-assisted platform for statutory safety governance, multi-tier compliance monitoring, explainable predictive risk forecasting, cryptographic audit transparency, and resilient field operations across Indian coal mines.

---

[![Python 3.11+](https://img.shields.io/badge/Python-3.11+-blue.svg?logo=python)](https://www.python.org/)
[![FastAPI](https://img.shields.io/badge/FastAPI-0.111.1-009688.svg?logo=fastapi)](https://fastapi.tiangolo.com/)
[![Next.js 14](https://img.shields.io/badge/Next.js-14.2.35-black.svg?logo=next.js)](https://nextjs.org/)
[![MongoDB Beanie](https://img.shields.io/badge/MongoDB-Beanie%20ODM-47A248.svg?logo=mongodb)](https://beanie-odm.dev/)
[![Celery & Redis](https://img.shields.io/badge/Celery-5.4.0-37814A.svg?logo=celery)](https://docs.celeryq.dev/)
[![Dexie.js v5](https://img.shields.io/badge/Dexie.js-v4%2Fv5%20Offline-orange.svg)](https://dexie.org/)
[![Scikit-Learn](https://img.shields.io/badge/Scikit--Learn-IsolationForest-F7931E.svg?logo=scikitlearn)](https://scikit-learn.org/)
[![Test Suite](https://img.shields.io/badge/Tests-96%2F96%20Passing%20(100%25)-brightgreen.svg)]()
[![Routes](https://img.shields.io/badge/App%20Router-22%20Routes%20Compiled-blueviolet.svg)]()

---

## 📌 Executive Summary

Coal mining operations in India operate under rigorous statutory safety, environmental, and operational mandates governed by the **Directorate General of Mines Safety (DGMS)**, **Coal Mines Regulations (CMR 2017)**, **Mines Act 1952**, **Mines Rules 1955**, **CPCB/SPCB**, and **MoEF&CC**.

This platform delivers an end-to-end digital governance architecture engineered for zero-connectivity underground inclines, hierarchical administration (**Ministry ➔ Subsidiary ➔ Area ➔ Mine Site**), dynamic multi-mine GIS positioning, automated CMR 2017 composite risk scoring, forward-looking 72-hour AI hazard forecasting, strict corrective action workflows (CAPA), tamper-evident cryptographic audit ledger protection with Web Audio emergency sirens, and multi-recipient emergency SMS dispatch.

---

## 🌟 Key Capabilities & Architectural Innovations

### 1. 🛡️ Cryptographic SHA-256 Audit Ledger, Tamper Interception & Web Audio Siren
- **Canonical SHA-256 Block Chaining**: Deterministic block hashing: $H_n = \text{SHA256}(H_{n-1} \parallel \text{Seq} \parallel \text{Actor} \parallel \text{CanonicalPayload})$ using key-sorted JSON serialization.
- **Repository-Level Tamper Interception**: Any mutation attempt on statutory records (shift gas telemetry, worker muster, inspection logs, or CAPA notices) marked `COMMITTED` or `APPROVED` is intercepted before execution, rejected with `HTTP 403 Forbidden`, and committed as an emergency tamper violation block.
- **Audible Emergency Siren (`frontend/src/lib/utils/audio.ts`)**: Synthesizes an alternating dual-tone emergency siren (800Hz–1200Hz) via the HTML5 Web Audio API without external audio files. Safe for browser autoplay policies.
- **Audible Pop-Up Alert Modal (`EmergencyAlertModal.tsx`)**: Mounted globally in the dashboard layout for `MINISTRY_AUDITOR` and `DGMS_INSPECTOR`. Triggers the audible siren and displays the affected mine, altered field, sequence number, and real-time hash divergence.
- **Interactive Forensic Timeline (`/audit-ledger`)**: Visualizes the cryptographic block sequence with previous/current hash badges. Includes a **`[ 🚨 Simulate Database Tampering Attack ]`** button executing `POST /api/v1/audit-ledger/simulate-tamper` for live jury and regulatory demonstrations.

### 2. 📱 Multi-Recipient SMS Emergency Alert Dispatch
- **SMS Infrastructure (`app/services/sms_service.py`, `alert_dispatch_service.py`)**: Integrates Fast2SMS (10-digit Indian numbers) and Twilio (E.164 format) with structured fallback console logging (`[MOCK SMS STATUTORY EMERGENCY DISPATCH]`).
- **Diagnostic Testing Endpoint (`POST /api/v1/escalations/test-sms`)**: On-demand diagnostic endpoint supporting `TAMPER_ALERT`, `WORKER_EMERGENCY`, `PREDICTIVE_GAS_WARNING`, or custom phone dispatches.
- **Automated Statutory Dispatch Triggers**:
  - **Tamper Ledger Divergence**: SMS dispatched to Ministry Auditor (`+917842295449`), DGMS Inspector (`+918919912916`), and Colliery Manager (`+919876543212`):
    `🚨 DGMS STATUTORY ALERT: Unauthorized record tampering attempt detected at {mine_name}. Ledger block #{seq} invalidated. Ref: SIH26024`
  - **Worker Emergency Stop Grievance**: SMS dispatched to Colliery Manager and Shift Sirdar (`+919876543215`):
    `⚠️ EMERGENCY PIT ALERT: Immediate safety threat reported at {mine_name}, Gallery {location_desc}. Worker hazard halt triggered. Check portal immediately.`
  - **72-Hour Spontaneous Combustion Warning**: SMS dispatched to Colliery Manager and DGMS Inspector:
    `🔴 CMR 2017 EARLY WARNING: AI forecast predicts spontaneous heating (CO rate > 3ppm/hr) at {mine_name} in {hours}h. Proactive ventilation adjustment required.`

### 3. 📊 Colliery Manager Triple-Tab Data Logs Portal (`/data-logs`)
- **Tab 1: Atmospheric Configuration**: Time-series sensor streams ($\text{CH}_4, \text{CO}, \text{O}_2$, air velocity, temperature) with statutory threshold status badges (`NORMAL`, `EXCURSION_WARNING`, `STATUTORY_BREACH`) and SHA-256 fingerprint badges. Includes an interactive "Edit" button that demonstrates immutable tamper rejection (HTTP 403).
- **Tab 2: Worker Muster**: Shift biometric timestamps, underground gallery deployment, CO gas exposure, and statutory overtime violation warnings ($>8\text{h}$).
- **Tab 3: Mine Casts & Extraction**: Opencast bench excavation tonnage, daily quota achievement %, dumper trips count, explosives used (kg ANFO), and blasting safety clearances.

### 4. 🔮 72-Hour Predictive AI Safety & Hazard Forecaster (`/analytics`)
- **Forward Sequence Modeling**: Projects atmospheric safety trends across $t+24\text{h}$, $t+48\text{h}$, and $t+72\text{h}$ using historical telemetry velocity and acceleration.
- **Dual-Line Visualizer with 95% Confidence Intervals**: Displays transition from actual historical sensor data to projected forecasts with shaded 95% Confidence Interval bands ($\pm 1.96 \cdot \text{SE} \cdot \sqrt{t/24}$).
- **Statutory Tripwire Warning Engine**: Real-time hazard tripwires for methane excursions ($\text{CH}_4 \ge 0.75\%$) and spontaneous combustion ($\frac{d\text{CO}}{dt} \ge 3\text{ ppm/hr}$).

### 5. 🤖 Unsupervised ML Anomaly Detection & Anti-Fraud Worker (`ml_risk_worker.py`)
- **Isolation Forest Multi-Variate Anomaly Detection**: Trains an ensemble `IsolationForest` on normal operational envelopes across $[\text{CH}_4, \text{CO}, \frac{d\text{CO}}{dt}, \text{AirVelocity}, \text{OvertimeHours}]$ to flag uncharacteristic micro-spikes and complex multi-sensor hazards.
- **Rubber-Stamping / Forged Flatline Detector**: Statistically identifies fabricated telemetry entries where consecutive shifts submit identical flatlined readings (variance $\approx 0$), raising automatic regulatory alerts for investigation.
- **Celery Scoring Orchestration (`tasks.py`)**: Background task `tasks.compute_mine_risk_score` unifies DB telemetry, active CAPA violations, underground station depths, overdue maintenance, and fires urgent alerts to Colliery Managers when risk reaches HIGH or CRITICAL.

### 6. 👷 Worker Welfare & Statutory Leave Portal (`WorkerDashboard.tsx`)
- **Hazard & Emergency Stop Reporting**: Categorized grievance reporting (Ventilation, Strata/Roof Support, Machinery, Welfare). Selecting `urgency == "EMERGENCY_STOP"` halts work and dispatches high-priority pit alerts to Colliery Manager and Sirdar.
- **Statutory Leave Applications (Mines Rules 1955 Chapter VII)**: Enables workers to apply for `CASUAL`, `SICK_MEDICAL`, `EARNED_STATUTORY`, and `ACCIDENT_COMPENSATORY` leaves, track application status and balances, and allows Colliery Managers to review and approve/reject shift leaves.

### 7. 📑 Form B / Form E Attendance Spreadsheet Exports (`/attendance`)
- **Native Excel Generation**: Built using `openpyxl>=3.1.5` at `GET /api/v1/attendance/export`.
- **Formatted Statutory Output**: Streams formatted **DGMS Form B / Form E Coal Mines Muster** in `.xlsx` or `.csv` with shift filters, zone filters, and toxic gas exposure highlights.
- **1-Click Download**: Integrated directly into the attendance cockpit.

### 8. 🗺️ Location-Reactive Data Hydration & Leaflet GIS Map (`/map`)
- **Global Tenant Store (`useTenantStore`)**: Selecting any mine site from the top navbar immediately triggers TanStack Query cache invalidation across all mine queries (`telemetry`, `data-logs`, `muster`, `risk-score`) and synchronizes the URL query parameter `?mine_id=...`.
- **Smooth Leaflet Camera Flight (`leasehold-map.tsx`)**: Invokes `map.flyTo(center, 14, { duration: 1.5 })`, converts GeoJSON coordinates to `[lat, lng]`, outlines active opencast pit perimeters, and renders underground RFID station beacons.
- **Contractor GIS Cockpit (`ContractorPitMap.tsx`)**: Displays all 4 Telangana sites simultaneously with auto-bounds fitting (`fitBounds`), fleet vehicle markers for dumpers/shovels, speed violations, and bench extraction limits.

### 9. 📶 Universal Offline-First Architecture & Auto-Reconciliation (Dexie.js v5)
- **IndexedDB Stores**: Dedicated tables for `offlineInspections`, `offlineWorkerReports`, `offlineLeaves`, `offlineManagerActions`, `cachedMines`, and `cachedDataLogs`.
- **Deterministic Auto-Sync Engine (`sync-engine.ts`)**: Background listener on `window.addEventListener("online")` with execution locking (`isSyncing = true`) and client UUID idempotency keys to flush queued mutations without duplication.
- **Visual Network Banner (`OfflineStatusBar.tsx`)**: Real-time status bar displaying offline mode, pending sync counts, and manual `[ 🔄 Sync Now ]` action.

### 10. ⚖️ Persistent Statutory Safety Directives Footer (`SafetyDirectivesFooter.tsx`)
- Mounted globally at the bottom of every dashboard page: displays mandatory statutory rules under **CMR 2017** (Reg 153 gas limits, Reg 154 ventilation, Reg 123 SSR roof support, Reg 130 haul roads, Rule 29B PPE).

---

## 🧠 Explainable CMR 2017 AI Safety Risk Engine

The composite risk calculator evaluates mine safety using a weighted, explainable multi-pillar statutory formula:

$$S_{\text{risk}} = \min\left(100, \; w_g \cdot G + w_c \cdot C + w_m \cdot M + w_e \cdot E + P_{\text{stale}}\right)$$

| Pillar | Weight | Evaluated Parameters | Statutory Regulation |
| :--- | :---: | :--- | :--- |
| **$G$ — Gas & Atmosphere** | **35%** | $\text{CH}_4$ (Methane %), $\text{CO}$ (PPM), $\frac{d\text{CO}}{dt}$ rate of rise, $\text{O}_2$ deficiency | CMR 2017 Reg 153 |
| **$C$ — CAPA Violations** | **25%** | Unrectified statutory violation notices, severity weights, overdue rectifications | CMR 2017 Statutory Orders |
| **$M$ — Mine Depth & Seam** | **20%** | Incline depth (meters), Gassy Seam Degree (Degree I, II, or III) | DGMS Circulars |
| **$E$ — Equipment & Slope** | **20%** | Overdue HEMM maintenance, Opencast Bench Factor of Safety ($\text{FoS}$), 24h rainfall (mm) | CMR 2017 Reg 130 |
| **$P_{\text{stale}}$ — Data Staleness** | **0–15 pt** | Penalty applied when sensor telemetry or shift logs exceed 2, 6, 12, or 24 hours | Data Governance Standard |

---

## 👥 Five Statutory Active Personas

Legacy roles have been pruned to enforce strictly the 5 active statutory roles:

| Persona | Primary Statutory Role | Dedicated Cockpit Features |
| :--- | :--- | :--- |
| 🏛️ **`MINISTRY_AUDITOR`** | National Macro Governance & Oversight | Pan-India subsidiary compliance heatmap, statutory tamper alert monitor, emergency audible siren, macro risk analytics. |
| 🧭 **`DGMS_INSPECTOR`** | Statutory Safety Enforcement (DGMS) | Field audit schedules, GPS geofence breach detection, violation notice issuance, Form-IV PDF generation, audible siren alert. |
| 🛡️ **`COLLIERY_MANAGER`** | Mine Operations & Statutory Authority | Live pit risk score meter, triple-tab data logs, official Ministry memo dispatch, worker leave approval, SMS alert recipient. |
| ⛑️ **`FIELD_WORKER` / `MINING_SIRDAR`** | Ground Safety & Hazard Logging | Biometric shift presence, underground gallery gas monitors, emergency stop hazard reporting, statutory leave applications. |
| 🚚 **`CONTRACTOR_ADMIN`** | Heavy Machinery & Haulage Logistics | Opencast bench excavation assignments, shift tonnage progress vs target, heavy fleet fitness certificates, speed tracking. |

---

## 🏗️ System Architecture

```mermaid
flowchart TB
    subgraph CLIENT_TIER["1. Client & Field Tier (Next.js 14 App Router)"]
        WEB["🖥️ Persona Cockpits\n(Ministry • DGMS Inspector • Manager • Worker • Contractor)"]
        TENANT_STORE["🌐 useTenantStore\n(Centralized Mine State & Query Invalidation)"]
        OFFLINE_DB["📱 Offline IndexedDB (Dexie.js v5)\n(Inspections • Leaves • Issues • Data Logs)"]
        LEAFLET_GIS["🗺️ Dynamic Leaflet GIS\n(GeoJSON Boundaries • UG Stations • Fleet)"]
        WEB_AUDIO["🔊 Web Audio API Synthesizer\n(800Hz - 1200Hz Dual-Tone Siren)"]
    end

    subgraph GATEWAY_TIER["2. API Gateway & Security Middleware (FastAPI)"]
        API_GATEWAY["⚡ FastAPI Gateway (/api/v1)"]
        MID_REQ["RequestId Middleware"]
        MID_TENANT["TenantScope Middleware\n(MOC ➔ SCCL ➔ Area ➔ Mine Site)"]
        MID_AUTH["JWT Auth & Role-Based Access Control"]
    end

    subgraph SERVICE_TIER["3. Core Domain & Business Logic Services"]
        AUTH_SRV["🔐 Auth & Tenant Service"]
        GEO_SRV["📍 Geofence Service (Surface GPS & Underground RFID)"]
        INSP_SRV["📋 Inspection & Offline Sync Engine"]
        CAPA_SRV["🔄 CAPA State Machine Engine"]
        AUDIT_SRV["⛓️ Tamper-Evident SHA-256 Audit Ledger"]
        ALERT_SRV["🚨 Multi-Recipient Alert Dispatch Service"]
        SMS_SRV["📱 Fast2SMS / Twilio SMS Service"]
        RISK_SRV["🧠 Explainable CMR 2017 Risk Engine"]
        PRED_SRV["🔮 72-Hour Predictive AI Forecaster"]
        LOGS_SRV["📊 Data Logs & Provenance Engine"]
        ESCAL_SRV["✉️ Manager Escalation Memo Service"]
        ATTEND_SRV["👷 Worker Attendance & Statutory Leave Engine"]
        EXCEL_SRV["📑 openpyxl Form-B / Form-E Muster Export Engine"]
        PDF_SRV["📄 Statutory Form IV PDF Engine"]
    end

    subgraph WORKER_TIER["4. Async AI & Background Workers (Celery)"]
        CELERY["⚙️ Celery Task Workers"]
        AI_RISK["🤖 AI Risk Scorer & ML IsolationForest Worker"]
        COMP_CRON["⏰ Statutory Permit Expiry Cron (30/15/7/1-Day)"]
        DOC_OCR["📄 Document Processor & OCR Worker"]
    end

    subgraph DATA_TIER["5. Persistence & Storage Tier"]
        REDIS[("⚡ Redis (Cache, Celery Broker, Token Deny-list)")]
        MONGO[("🍃 MongoDB / Beanie ODM (mongomock fallback)")]
        MINIO[("🪣 MinIO / S3 Object Store (Evidence & PDFs)")]
    end

    WEB & TENANT_STORE & OFFLINE_DB & LEAFLET_GIS & WEB_AUDIO --> API_GATEWAY
    API_GATEWAY --> MID_REQ --> MID_TENANT --> MID_AUTH
    MID_AUTH --> SERVICE_TIER
    SERVICE_TIER -. Tasks .-> CELERY
    CELERY --> AI_RISK & COMP_CRON & DOC_OCR
    SERVICE_TIER & CELERY --> REDIS & MONGO & MINIO
```

---

## 💻 Tech Stack

| Layer | Technologies |
| :--- | :--- |
| **Backend API** | [FastAPI 0.111](https://fastapi.tiangolo.com/), Python 3.11+, Pydantic v2, Structlog, Uvicorn |
| **Database & ODM** | [MongoDB 7.0+](https://www.mongodb.com/) via [Beanie ODM](https://beanie-odm.dev/) & Motor (`mongomock-motor` in-memory fallback for local dev) |
| **Machine Learning** | [scikit-learn](https://scikit-learn.org/) (IsolationForest anomaly detection), NumPy, custom trend forecaster |
| **Spreadsheets & Reports** | [openpyxl](https://openpyxl.readthedocs.io/) (DGMS Form-B/Form-E Excel), ReportLab (Form-IV PDF) |
| **Task Queue & Cache** | [Celery 5.4](https://docs.celeryq.dev/), [Redis 5.0](https://redis.io/) |
| **Storage** | [MinIO](https://min.io/) / AWS S3 (Presigned URLs via boto3) |
| **Frontend Framework** | [Next.js 14.2](https://nextjs.org/) (App Router), [React 18](https://react.dev/), [Tailwind CSS 3.4](https://tailwindcss.com/), [Lucide Icons](https://lucide.dev/) |
| **Audio Synthesis** | HTML5 Web Audio API (Dual-tone 800Hz–1200Hz oscillator siren) |
| **State & Offline Storage** | [Zustand](https://github.com/pmndrs/zustand), [TanStack React Query v5](https://tanstack.com/query), [Dexie.js](https://dexie.org/) (IndexedDB) |
| **Mapping & GIS** | [Leaflet](https://leafletjs.com/), [React-Leaflet](https://react-leaflet.js.org/) |
| **Testing** | [pytest 8.2](https://docs.pytest.org/), pytest-asyncio, HTTPX |

---

## 📁 Repository Structure

```text
ai-coal-goverance/
├── app/                                    # Backend Application (FastAPI)
│   ├── api/v1/                             # API Endpoints (18 Sub-routers)
│   │   ├── attendance.py                   # Worker check-in, muster & Form-B Excel export
│   │   ├── audit.py                        # Audit ledger verification & tamper simulation
│   │   ├── auth.py                         # Authentication & JWT token refresh
│   │   ├── compliance.py                   # Statutory permits & alert acknowledgment
│   │   ├── dashboard.py                    # Role-tailored dashboard summaries
│   │   ├── documents.py                    # S3 presigned upload & OCR triggering
│   │   ├── escalations.py                  # Manager memo dispatch & test-sms endpoint
│   │   ├── inspections.py                  # Inspection logging & Form-IV generation
│   │   ├── logs.py                         # Shift gas, muster & extraction data logs
│   │   ├── notifications.py                # Notification center & acknowledgments
│   │   ├── reports.py                      # Form IV PDF generation & export
│   │   ├── risk.py                         # Composite risk score & 72h forecast endpoints
│   │   ├── router.py                       # Main API v1 routing registry
│   │   ├── schedules.py                    # Preventive safety audit calendars
│   │   ├── sync.py                         # Offline batch push/pull & conflict resolution
│   │   ├── tenants.py                      # Hierarchy & Telangana mine site management
│   │   ├── underground_stations.py         # Depth & RFID beacon stations
│   │   ├── violations.py                   # CAPA workflow state transitions
│   │   └── worker.py                       # Worker issues & statutory leave applications
│   ├── domain/                             # Core Domain Logic (Pure Python)
│   │   ├── enums.py                        # 5 Active statutory roles & domain enums
│   │   ├── predictive_ai.py                # 72-hour AI safety forecaster
│   │   └── risk_scorer.py                  # Explainable CMR 2017 composite risk engine
│   ├── infrastructure/                     # Infrastructure layer
│   │   ├── cache/                          # Redis connection & token denylist
│   │   ├── database/                       # MongoDB Beanie ODM connection & models
│   │   │   ├── connection.py               # Beanie init & mongomock fallback
│   │   │   ├── models.py                   # 14 Beanie document models with phone_number
│   │   │   └── seeds/                      # Master data seed scripts
│   │   │       └── telangana_mines.py      # Telangana SCCL 4-mine master seed & credentials
│   │   ├── repositories/                   # Concrete repository implementations
│   │   └── storage/                        # MinIO / S3 object storage service
│   ├── middleware/                         # Request ID, Tenant Scoping, Auth
│   ├── services/                           # Domain Services
│   │   ├── alert_dispatch_service.py       # Multi-recipient statutory emergency routing
│   │   ├── audit_service.py                # SHA-256 chained ledger & tamper interceptor
│   │   ├── sms_service.py                  # Fast2SMS & Twilio SMS dispatcher
│   │   ├── pdf_report_service.py           # Form IV statutory PDF generation
│   │   ├── sync_service.py                 # Offline reconciliation engine
│   │   └── ...
│   ├── workers/                            # Celery workers & Beat cron schedules
│   │   ├── celery_app.py                   # Celery application configuration
│   │   ├── tasks.py                        # Risk scoring & ML anomaly orchestration task
│   │   ├── ml_risk_worker.py               # Scikit-learn IsolationForest & fraud detector
│   │   ├── compliance_monitor.py           # Statutory permit expiry daily cron
│   │   └── document_processor.py           # OCR & document indexing task
│   ├── config.py                           # App settings via Pydantic Settings
│   ├── dependencies.py                     # FastAPI dependency injections
│   └── main.py                             # FastAPI application factory
├── frontend/                               # Next.js 14 Dashboard
│   ├── src/
│   │   ├── app/                            # App Router routes (22 routes)
│   │   │   ├── (dashboard)/                # Authenticated dashboard pages
│   │   │   │   ├── analytics/              # 72h Predictive AI forecaster & charts
│   │   │   │   ├── attendance/             # Attendance muster & Excel (.xlsx) download
│   │   │   │   ├── audit-ledger/           # SHA-256 ledger & attack simulation button
│   │   │   │   ├── capa/                   # CAPA state machine & notice tracking
│   │   │   │   ├── compliance/             # Statutory permit calendar & CTOs
│   │   │   │   ├── contractor/             # Contractor sub-pages (production, risk-score, mines)
│   │   │   │   │   ├── mines/              # Contractor leaseholds & fleet map
│   │   │   │   │   ├── production/         # Excavation targets & tonnage meters
│   │   │   │   │   └── risk-score/         # Fleet & contractor risk analysis
│   │   │   │   ├── data-logs/              # Colliery shift logs (Atmosphere, Muster, Extraction)
│   │   │   │   ├── inspections/            # Inspection records & Form IV downloads
│   │   │   │   │   └── new/                # New statutory inspection wizard
│   │   │   │   ├── map/                    # Dynamic Leaflet GIS boundary & UG stations
│   │   │   │   ├── notifications/          # Alert inbox & acknowledgement center
│   │   │   │   ├── overview/               # Multi-persona dashboard hub
│   │   │   │   ├── risk-analysis/          # Multi-mine comparative risk breakdown
│   │   │   │   ├── schedules/              # Scheduled audit calendars
│   │   │   │   └── worker/issues/          # Dedicated worker grievance & hazard portal
│   │   │   └── login/                      # Role-based login page
│   │   ├── components/                     # Modular UI components
│   │   │   ├── alerts/                     # EmergencyAlertModal & AuditWatchdog
│   │   │   ├── audit/                      # Cryptographic chain verification banner
│   │   │   ├── capa/                       # CAPA board & status transition modals
│   │   │   ├── dashboard/                  # 5 Persona dashboards (Inspector, Manager, Worker, Govt, Contractor)
│   │   │   ├── geospatial/                 # Leaflet GIS maps & underground levels
│   │   │   ├── layout/                     # Sidebar, top-navbar, MineSelector, OfflineStatusBar, SafetyDirectivesFooter
│   │   │   └── scorecard/                  # Dynamic risk meters & KPI grids
│   │   └── lib/                            # API clients, Dexie DB, Zustand stores, Web Audio API
│   │       ├── api/                        # Typed API clients (logs, worker, dashboard, tenants)
│   │       ├── db/                         # Dexie.js v5 offline database (CoalGovOfflineDB)
│   │       ├── store/                      # Zustand stores (auth, tenant, sync, audit-alert)
│   │       ├── sync/                       # Two-way offline sync manager & engine
│   │       ├── types/                      # TypeScript domain definitions (5 roles)
│   │       └── utils/                      # audio.ts (Web Audio siren), hashes, coords, dates
│   ├── public/                             # Static assets
│   ├── package.json                        # Frontend dependencies
│   └── tsconfig.json                       # TypeScript config
├── scripts/
│   └── verify_db.py                        # Database & Redis health check & seeding CLI
├── tests/                                  # Full test suite (96 tests)
│   ├── unit/                               # 16 Unit test modules (80 tests)
│   └── integration/                        # 4 Integration test modules (16 tests)
├── .env.example                            # Environment variables template
├── pyproject.toml                          # Python packaging config
└── requirements.txt                        # Python pip dependencies
```

---

## 🔑 Demo Seed Accounts & Verified Mobile Directory

All seed accounts use the default password: **`demo1234`**

| Role | Email | Name & Organization | Verified Mobile | Hierarchy Scope |
| :--- | :--- | :--- | :--- | :--- |
| **`MINISTRY_AUDITOR`** | `auditor.hq@coal.gov.in` | Dr. R. K. Sharma *(Ministry Auditor)* | `+917842295449` | `MOC` (Pan-India HQ) |
| **`DGMS_INSPECTOR`** | `inspector.dgms@dgms.gov.in` | Er. K. Venkat Rao *(DGMS South Central Zone)* | `+918919912916` | `MOC` (Statutory Jurisdiction) |
| **`COLLIERY_MANAGER`** | `manager.gdk11a@scclmines.com` | N. Ramesh *(Colliery Manager - GDK 11A)* | `+919876543212` | `MOC.SCCL.RAMAGUNDAM_1.GDK_11A` |
| **`COLLIERY_MANAGER`** | `manager.rgocp3@scclmines.com` | Ch. Srinivas *(Colliery Manager - RG-OCP 3)* | `+919876543213` | `MOC.SCCL.RAMAGUNDAM_2.RG_OCP3` |
| **`COLLIERY_MANAGER`** | `manager.kocp@scclmines.com` | B. Venkateswarlu *(Manager - KOCP)* | `+919876543214` | `MOC.SCCL.KOTHAGUDEM.KOCP` |
| **`FIELD_WORKER`** | `sirdar.kasipet@scclmines.com` | K. Shankaraiah *(Mining Sirdar - Kasipet)* | `+919876543215` | `MOC.SCCL.MANDAMARRI.KASIPET_UG` |
| **`CONTRACTOR_ADMIN`** | `contractor.singareni@scclmines.com` | T. Rajesh *(Singareni Fleet Logistics)* | `+919876543216` | `MOC.SCCL.RAMAGUNDAM_2.RG_OCP3` |

### 4 Distinct Telangana SCCL Collieries Seeded

1. **Godavarikhani No. 11A Incline (GDK-11A)**:
   - Type: Underground Incline | Seam: Degree III Gassy Seam | Depth: 380m | Center: `[18.7610, 79.4985]`
   - RFID Stations: `STATION-GDK-SHAFT-BOTTOM` (-380m), `STATION-GDK-SEAM3-FACE` (-340m, RFID: `RFID-TEL-GDK-01`)
   - Sensor Baselines: $\text{CH}_4$: 0.62%, $\text{CO}$: 14.2 ppm, Air Velocity: 1.4 m/s | Risk Score: 64
2. **Ramagundam OCP-III (RG-OCP 3)**:
   - Type: Opencast Pit | Depth: 120m | Center: `[18.7562, 79.5134]`
   - Geotechnical: Bench FoS: 1.32 | Fleet: 34 Dumpers | Daily Output: 18,400 T / Target: 20,000 T | Risk Score: 28
3. **Kasipet Underground Mine**:
   - Type: Underground Incline | Seam: Degree II Gassy Seam | Depth: 260m | Center: `[19.0321, 79.4412]`
   - RFID Stations: `STATION-KASIPET-INCLINE-1`, `STATION-KASIPET-RETURN-AIRWAY`
   - Sensor Baselines: $\text{CH}_4$: 0.41%, $\text{CO}$: 8.5 ppm, Air Velocity: 2.1 m/s | Risk Score: 45
4. **Kothagudem OCP (KOCP)**:
   - Type: Opencast Pit | Depth: 195m | Center: `[17.5518, 80.6189]`
   - Geotechnical: Bench FoS: 1.18 (Critical Slope Warning) | Fleet: 22 Dumpers | Output: 12,100 T / 15,000 T | Risk Score: 72

---

## 🌐 Complete API Reference (FastAPI `/api/v1`)

| Category | Endpoint | Method | Role Access | Description |
| :--- | :--- | :---: | :---: | :--- |
| **Auth** | `/auth/token` | `POST` | Public | OAuth2 password flow login (returns JWT token & user profile) |
| **Auth** | `/auth/refresh` | `POST` | Authenticated | Refreshes active JWT session token |
| **Dashboard** | `/dashboard/summary` | `GET` | All | Role-tailored metrics, active alerts, and quick actions |
| **Data Logs** | `/data-logs/atmospheric` | `GET` | All | Shift telemetry time-series ($\text{CH}_4, \text{CO}, \text{O}_2$, air speed, temp) |
| **Data Logs** | `/data-logs/muster` | `GET` | All | Shift biometric muster & underground gallery deployments |
| **Data Logs** | `/data-logs/extraction` | `GET` | All | Daily opencast tonnage, explosives (ANFO kg), and dumper logs |
| **Audit Ledger** | `/audit-ledger` | `GET` | Auditor, Inspector | Cryptographic SHA-256 chained transaction blocks |
| **Audit Ledger** | `/audit-ledger/verify-chain` | `GET` | Auditor, Inspector | Recomputes block hashes $H_n$ and validates complete chain integrity |
| **Audit Ledger** | `/audit-ledger/simulate-tamper` | `POST` | All | Triggers simulated block tamper for live siren and UI demonstration |
| **Audit Ledger** | `/audit-ledger/attempt-tamper-mutation`| `POST`| All | Demonstrates repository-level pre-mutation block rejection (HTTP 403) |
| **Risk & AI** | `/risk/score` | `GET` | All | Current explainable CMR 2017 composite risk score & sub-pillar metrics |
| **Risk & AI** | `/risk/forecast-72h` | `GET` | All | 72-hour forward AI hazard forecast with 95% confidence intervals |
| **Inspections** | `/inspections` | `GET` / `POST` | Inspector, Auditor | Log statutory safety audits and view field inspection history |
| **Inspections** | `/inspections/{id}/form-iv` | `GET` | Inspector, Auditor | Generates and downloads official DGMS Form-IV PDF certificate |
| **Violations** | `/violations/capa` | `GET` / `POST` | All | CAPA state machine (DRAFT ➔ ISSUED ➔ RECTIFIED ➔ VERIFIED ➔ CLOSED) |
| **Worker** | `/worker/issues` | `GET` / `POST` | Field Worker, Sirdar| Hazard and grievance reporting (includes EMERGENCY_STOP trigger) |
| **Worker** | `/worker/leave-applications` | `GET` / `POST` | All | Mines Rules 1955 Chapter VII leave requests and approvals |
| **Attendance** | `/attendance/muster` | `GET` / `POST` | All | Biometric clock-in/out records and toxic gas exposure history |
| **Attendance** | `/attendance/export` | `GET` | All | Native Excel generation for DGMS Form B / Form E muster (`.xlsx`) |
| **Escalations**| `/escalations/memo` | `POST` | Colliery Manager | Official management escalation memo dispatch to Ministry & DGMS |
| **Escalations**| `/escalations/test-sms` | `POST` | All | Diagnostic emergency SMS dispatch to verified regulatory phones |
| **Tenants** | `/tenants/mines` | `GET` | All | Telangana SCCL colliery catalog with GeoJSON lease boundaries |
| **Stations** | `/underground-stations` | `GET` / `POST` | All | Subsurface depth stations and RFID beacon monitors |
| **Schedules** | `/schedules` | `GET` / `POST` | All | Preventive safety audit calendars and statutory deadlines |
| **Compliance**| `/compliance/schedules` | `GET` | All | Statutory operating permits (CTO/CTE, Forest Clearances) |
| **Sync** | `/sync/push` & `/sync/pull` | `POST` | All | Offline-first batch reconciliation and sync engine |

---

## ⚙️ Quickstart & Developer Setup Guide

### 1. Prerequisites
- **Python 3.11+**
- **Node.js 18+ & npm**
- **MongoDB 7.0+** *(Built-in in-memory fallback to `mongomock-motor` activates automatically when local MongoDB is not running)*
- **Redis 7.0+** *(Optional for local development; needed for production Celery tasks)*

---

### 2. Backend Setup (FastAPI)

1. **Activate Python virtual environment:**
   ```powershell
   # Windows PowerShell:
   .venv\Scripts\activate

   # Linux / macOS:
   source .venv/bin/activate
   ```

2. **Install dependencies:**
   ```bash
   pip install -r requirements.txt
   ```

3. **Configure environment variables:**
   ```bash
   cp .env.example .env
   ```
   *(Defaults are pre-configured for instant out-of-the-box local operation).*

4. **Verify database & seed master records:**
   ```bash
   python scripts/verify_db.py --seed
   ```
   *(To wipe and reseed anytime: `python scripts/verify_db.py --reseed`)*

5. **Start the FastAPI Backend Server:**
   ```bash
   uvicorn app.main:app --host 127.0.0.1 --port 8000 --reload
   ```
   - **Interactive Swagger UI:** `http://127.0.0.1:8000/docs`
   - **ReDoc Documentation:** `http://127.0.0.1:8000/redoc`

---

### 3. Async Worker Setup (Celery & ML Anomaly Detector)

*(Optional for local UI testing; runs scheduled background risk calculations, permit expiry crons, and Isolation Forest ML scoring)*

```bash
# Start Celery Worker:
celery -A app.workers.celery_app.celery_app worker --loglevel=info -Q scoring,compliance,documents

# Start Celery Beat (Scheduled permit scans):
celery -A app.workers.celery_app.celery_app beat --loglevel=info
```

---

### 4. Frontend Setup (Next.js 14 App Router)

1. **Navigate to the frontend directory:**
   ```bash
   cd frontend
   ```

2. **Install Node dependencies:**
   ```bash
   npm install
   ```

3. **Configure environment:**
   Ensure `frontend/.env.local` contains:
   ```env
   NEXT_PUBLIC_API_URL=http://localhost:8000/api/v1
   ```

4. **Run development server:**
   ```bash
   npm run dev
   ```
   Open `http://localhost:3000` in your web browser.

---

## 🧪 Testing & Verification

### Run Complete Pytest Suite
```bash
.venv\Scripts\pytest -q
```
- **Test Results:** **`96 passed in ~44s (100% pass rate)`**
- **Coverage:** Unit tests for risk scorer, ML anomaly detector, audit chain, tamper interception, CAPA state machine, geofence tracking, attendance Excel export, PDF generation, and full integration API workflows.

### Run Frontend Production Build
```bash
cd frontend
npm run build
```
- **Build Status:** **`Exit Code 0`**
- **Output:** **`22/22 static & dynamic routes compiled`** without TypeScript or linting errors.

---

## 🎮 Interactive Live Demo Walkthrough (Jury Evaluation Script)

1. **Demonstrate Colliery Shift Data Logs & Tamper Rejection (`/data-logs`)**:
   - Log in as Colliery Manager: `manager.gdk11a@scclmines.com` / `demo1234`.
   - In the sidebar, select **Data Logs**.
   - Browse the 3 dedicated tabs: **Atmospheric Configuration**, **Worker Muster**, and **Mine Casts & Extraction**.
   - Under Atmospheric Configuration, click **"Edit"** on any sensor reading.
   - Modify a telemetry value (e.g. CO ppm from 14.2 to 4.0) and submit.
   - **Result:** Immediate **`HTTP 403 Forbidden`** statutory rejection banner, creation of an immutable SHA-256 tamper violation audit block, and instant dispatch of emergency alerts to the Ministry and DGMS inspector dashboards.

2. **Demonstrate Audible Emergency Siren & Live Database Attack Simulation (`/audit-ledger`)**:
   - Navigate to **Audit Ledger** in the sidebar.
   - Click the red **`[ 🚨 Simulate Database Tampering Attack ]`** button.
   - **Result:** The browser's Web Audio API synthesizes a continuous 800Hz–1200Hz dual-tone emergency siren.
   - The animated `EmergencyAlertModal` surfaces showing the affected colliery, modified field, sequence number, and SHA-256 cryptographic divergence.
   - Test the **Mute Siren** button and click **"Inspect Audit Chain"** to trace the broken cryptographic link.

3. **Demonstrate Diagnostic Statutory SMS Dispatch (`POST /api/v1/escalations/test-sms`)**:
   - In Swagger UI (`http://127.0.0.1:8000/docs`) or via terminal:
     ```bash
     curl -X POST "http://127.0.0.1:8000/api/v1/escalations/test-sms" \
          -H "Content-Type: application/json" \
          -d "{\"event_type\": \"TAMPER_ALERT\", \"mine_name\": \"Godavarikhani No. 11A Incline\"}"
     ```
   - **Result:** SMS is routed to Ministry Auditor (`+917842295449`), DGMS Inspector (`+918919912916`), and Colliery Manager (`+919876543212`).

4. **Demonstrate 72-Hour Predictive AI Forecaster (`/analytics`)**:
   - Navigate to **Analytics & AI Forecast** in the sidebar.
   - View forward sequence projections at $t+24\text{h}$, $t+48\text{h}$, and $t+72\text{h}$ for Methane ($\text{CH}_4$), Carbon Monoxide ($\text{CO}$), and Air Velocity.
   - Inspect the shaded 95% Confidence Interval bands and the automated CMR 2017 hazard tripwire triggers.

5. **Demonstrate Official DGMS Form B / Form E Excel Export (`/attendance`)**:
   - Navigate to **Attendance & Muster**.
   - Click **`[ 📥 Export Statutory Muster (.xlsx) ]`**.
   - **Result:** Downloads a formatted `.xlsx` spreadsheet matching official DGMS Form B / Form E standards, including shift rosters, surface/underground deployments, and toxic gas exposure flags.

6. **Demonstrate Location-Reactive Leaflet GIS Map (`/map`)**:
   - In the top navigation header, open the **Mine Selector** dropdown.
   - Switch between **GDK-11A**, **Ramagundam OCP-3**, **Kasipet**, and **Kothagudem OCP**.
   - **Result:** The Leaflet map smoothly animates (`flyTo`) to the mine's coordinates, renders the GeoJSON leasehold boundary polygon, and loads mine-specific underground station beacons and fleet tracking.

7. **Demonstrate Universal Offline Pit Mode & Dexie.js Sync (`/worker/issues`)**:
   - In browser DevTools Network tab, switch throttling to **Offline**.
   - Observe the persistent amber **"OFFLINE MODE: Operating on local pit cache"** status banner.
   - Submit a worker hazard report or statutory leave application.
   - Inspect IndexedDB (`CoalGovOfflineDB` in Application tab); verify the record is persisted locally with `is_synced: 0`.
   - Restore network connectivity to **Online**; observe the banner change to **"SYNCING: Reconciling offline records..."** as records auto-flush to MongoDB with UUID idempotency keys.

---

## 📜 Statutory Compliance & Legal References

- **Coal Mines Regulations (CMR 2017)**:
  - **Regulation 123**: Systematic Support Rules (SSR) & Underground Strata Control.
  - **Regulation 130**: Opencast Haul Road Gradients, Bench Height-to-Width Ratios & Berm Safety.
  - **Regulation 153**: Inflammable & Noxious Gas Monitoring Standards ($\text{CH}_4 < 0.75\%$ in returns, $< 1.25\%$ in general body air; $\text{CO} < 50\text{ ppm}$).
  - **Regulation 154**: Mechanical Ventilation Standards & Continuous Airflow Velocity.
- **Mines Act, 1952**:
  - **Section 22A**: Emergency Powers of DGMS Inspectors to halt hazardous operations.
  - **Section 48**: Mandatory Statutory Shift Muster Registers & Overtime Limits.
- **Mines Rules, 1955**:
  - **Chapter VII**: Statutory Annual Leave Entitlements, Sick Leave, and Compensatory Days Off.
  - **Form B & Form E**: Statutory Register of Employees & Daily Attendance Muster.
  - **Rule 29B**: Mandatory Personal Protective Equipment (PPE) Compliance.

---

## 📄 License & Attribution

Developed under the **Smart India Hackathon (SIH26024)** initiative for the **Ministry of Coal, Government of India**.  
Distributed under the MIT License.
