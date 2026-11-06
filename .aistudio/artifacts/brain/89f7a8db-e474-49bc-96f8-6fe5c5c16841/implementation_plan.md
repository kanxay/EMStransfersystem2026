# EMSCPS - ລະບົບນຳສົ່ງຄົນເຈັບ ໂຮງໝໍແຂວງຈຳປາສັກ

A comprehensive, production-grade web application tailored for Champasak Provincial Hospital and district hospitals across Champasak Province, enabling seamless emergency patient referrals, clinical record tracking, ambulance intake workflow, and statistical analytics.

### User Review & Critical Decisions

> [!IMPORTANT]
> The following decisions were confirmed by the user during initial clarification:
> - **Hospital Directory Starting State**: Start with an empty hospital list for manual administrative entry via the Settings tab (with an optional 1-click template loader if the administrator wishes).
> - **Database Configuration & Fallback**: Support direct connection to Turso database via `@libsql/client/web` using `VITE_TURSO_DATABASE_URL` and `VITE_TURSO_AUTH_TOKEN`. If credentials are not yet set in environment variables, automatically run in resilient Local Offline Storage mode with an intuitive connection status banner and the ability to transition smoothly to Turso.
> - **Referral Document & PDF**: Generate a formal, downloadable Lao-language medical referral document directly in the browser (complete with patient vitals, lab results, GCS breakdown, and signatures) as well as a native browser print-ready view formatted for A4.
> - **Terminology & Language**: Strictly use standard Lao medical terminology: "ຄົນເຈັບ" (never "ຜູ້ປ່ວຍ") and render with high-legibility Noto Sans Lao typography across both desktop and mobile devices.

---

### 1. Overview & Core Concept

**EMSCPS** (Emergency Medical Services Champasak Provincial System) bridges the communication between district hospitals in Champasak and Champasak Provincial Hospital (ໂຮງໝໍແຂວງຈຳປາສັກ). It streamlines the transfer of acute and critical patients by capturing detailed clinical status, vital signs, Glasgow Coma Scale (GCS), initial therapies, and ambulance logistics.

- **Target Audience / Personas**:
  - **District Hospital Staff (User Role)**: Medical officers, ER nurses, and referral coordinators who submit urgent patient transfer forms, view previously sent referrals, and download referral documents.
  - **Champasak Provincial Hospital Emergency Dept & Admin (Admin Role)**: Triage physicians and ER supervisors monitoring incoming referrals in real time, updating triage status (`ສົ່ງແລ້ວ`, `ກຳລັງມາ`, `ຮອດແລ້ວ`, `ຮັບເຂົ້າຮັກສາ`, `ສົ່ງກັບ`), analyzing diagnosis patterns, and managing district hospital accounts.

---

### 2. User Experience & Visual Design

#### A. Layout & Visual Identity
- **Design Tone**: Clean, calm, high-reliability clinical design. Dominated by hospital slate white/gray (`#F8FAFC`, `#FFFFFF`), deep maritime navy (`#0B3B60`) for trust, and clinical teal (`#0D9488`) for active states and critical progress indicators.
- **Typography**: Complete Lao script support with Google Fonts **Noto Sans Lao** (weights 400, 500, 600, 700) paired with tabular numerals (`tabular-nums`) for vital signs, lab values, and timestamps.
- **Zero-Pill Restraint**: Status metadata rendered as clean text with subtle colored accents or segmented control tabs, avoiding loud candy pills.
- **Responsive Viewport Presence**: Full desktop experience (1440px baseline) for administrative ER monitoring stations, and a touch-optimized step-by-step layout for tablet/smartphone triage in ambulances and rural health centers.

#### B. Key User Flows
```
[Login Page]
  │
  ├─── Admin Login (Passcode: "admin2026")
  │      ▼
  │    [Admin Workspace]
  │      ├── Tab 1: Dashboard
  │      │     ├── Date/Province/Hospital/Status Filters
  │      │     ├── Metric Cards (Total, In-Transit, Arrived, Admitted)
  │      │     ├── Trend Line / Bar Chart of Daily Referrals & Diagnosis Distribution
  │      │     ├── Referral Grid (Card View & Data Table View)
  │      │     ├── Real-time Status Changer Modal & Full Clinical Detail Modal
  │      │     ├── Downloadable PDF Referral Document & Print Action
  │      │     └── Export CSV (UTF-8 BOM formatted for Microsoft Excel)
  │      └── Tab 2: Settings (ຕັ້ງຄ່າໂຮງໝໍ)
  │            ├── "+ ເພີ່ມໂຮງໝໍ" (Province, Name in Lao, Password)
  │            ├── District Hospital Directory Table (Edit, Delete, Password Toggle)
  │            └── Backup CSV Export of Hospital Directory
  │
  └─── User Login (District Hospital Staff)
         ├── Dropdown of District Hospitals ("ຊື່ໂຮງໝໍ - ແຂວງ")
         └── Password Input (hospital password)
               ▼
             [Referral Portal]
               ├── My Referrals History (Edit & Download PDF for own hospital)
               └── "+ ສ້າງໃບນຳສົ່ງໃໝ່" (5-Step Form Wizard)
                     ├── Step 1: ຂໍ້ມູນຄົນເຈັບ (Patient Demographics & Origin)
                     ├── Step 2: ປະຫວັດ (Diagnosis, Past History, Current Illness)
                     ├── Step 3: ຜົນກວດ (Lab Results: CBC, Chem, Dengue & Imaging)
                     ├── Step 4: ອາການກ່ອນນຳສົ່ງ (Vitals & Auto GCS: E+V+M = 3-15)
                     ├── Step 5: ການນຳສົ່ງ (Pre-hospital Treatment, Reason, Contact)
                     └── Completion Review & Download Official PDF
```

#### C. Multi-Step Form Wizard (5 Steps)
1. **Step 1: ຂໍ້ມູນຄົນເຈັບ**: Admission date, referral date/time, sending hospital (auto-filled), contact phone, patient full name (*required*), age (*required*), sex (*required*), occupation, village, district, province, health insurance/social security type.
2. **Step 2: ປະຫວັດ**: Primary diagnosis (*required*), past medical history, current medications, history of present illness.
3. **Step 3: ຜົນກວດ**: Blood results (WBC, HCT, HB, PLT, Glucose, Creatinine, Urea, K+, Na+, Dengue) and diagnostic imaging notes (Chest X-ray, Ultrasound, CT-Scan).
4. **Step 4: ອາການກ່ອນການນຳສົ່ງ**: Referring department/unit, Blood Pressure (BP), Pulse Rate (PR), Temperature (T), SpO2, Respiratory Rate (RR), Body Weight. Detailed Neurological assessment: Eye Opening (E: 1-4), Verbal Response (V: 1-5), Motor Response (M: 1-6) with **Automatic GCS calculation (3-15)** and clinical severity indicator; Limb motor weakness, Right pupil, Left pupil, Lung auscultation, Heart auscultation, other symptoms.
5. **Step 5: ການນຳສົ່ງ**: Initial treatment provided, reason for referral (*required*), recipient physician/coordinator (*required*), transport method (e.g., EMS Ambulance, Hospital Vehicle, Private), attending physician name & phone number.
- **Auto-drafting**: Form state continuously persists to `localStorage`. If connection drops or tab closes, a prompt restores previous inputs seamlessly.

---

### 3. Key Product Decisions & Trade-Offs

- **Database Engine & Dual-Mode Adapter**:
  - *Chosen*: `@libsql/client/web` communicating with Turso database. Automatically creates `hospitals` and `referrals` tables on initialization via `CREATE TABLE IF NOT EXISTS`.
  - *Resilience*: If `VITE_TURSO_DATABASE_URL` is empty, the app runs an in-memory / `localStorage` mock engine replicating identical SQL schema queries, allowing users to test the full system right away.
- **Sequential Referral ID Generation**:
  - Referrals follow an incremental, standardized code: `cps001`, `cps002`, `cps003`, etc.
- **PDF Generation & Printing**:
  - Generates a cleanly structured official medical document with hospital header, Lao government crest / title, clinical sections, and signatures using custom printable CSS + downloadable PDF helper.
- **Excel CSV Compatibility**:
  - Export CSV files prepend `\uFEFF` (UTF-8 Byte Order Mark) so that Lao characters display cleanly in Microsoft Excel without corrupting encoding.
- **Security & Session Persistence**:
  - Authentication state stores role (`admin` or `user`), selected hospital ID, and token in `localStorage`.
  - Admin passcode is easily configurable in code (`admin2026`).

---

### 4. Technical Architecture & Data Strategy

```
┌────────────────────────────────────────────────────────────────────────┐
│                          EMSCPS Client (Vite + React)                  │
├────────────────────────────────────────────────────────────────────────┤
│  State & Persistence Layer                                             │
│  ┌───────────────────────┐      ┌───────────────────────────────────┐  │
│  │   Turso Client Web    │ <──> │  Offline Storage Fallback Engine  │  │
│  │  (@libsql/client/web) │      │      (localStorage Sync)          │  │
│  └───────────┬───────────┘      └─────────────────┬─────────────────┘  │
│              │                                    │                    │
│              └─────────────────┬──────────────────┘                    │
│                                ▼                                       │
│                       Database Service Interface                       │
│     (getHospitals, saveReferral, updateStatus, getStats, exportCSV)    │
├────────────────────────────────────────────────────────────────────────┤
│  Application Views                                                     │
│  ┌─────────────────┐  ┌──────────────────────┐  ┌───────────────────┐  │
│  │   Auth / Login  │  │   User Referral Form │  │  Admin Workspace  │  │
│  │  (Admin / User) │  │   (5-Step Wizard)    │  │(Dashboard/Setting)│  │
│  └─────────────────┘  └──────────────────────┘  └───────────────────┘  │
│                                │                          │            │
│                                ▼                          ▼            │
│                       ┌─────────────────┐        ┌──────────────────┐  │
│                       │ Auto-GCS Engine │        │ Analytics Charts │  │
│                       │ & Draft Restore │        │ & CSV/PDF Engine │  │
│                       └─────────────────┘        └──────────────────┘  │
└────────────────────────────────────────────────────────────────────────┘
```

#### Database Schema Overview

**`hospitals` Table**:
- `id` INTEGER PRIMARY KEY AUTOINCREMENT
- `province` TEXT NOT NULL
- `name` TEXT NOT NULL
- `password` TEXT NOT NULL

**`referrals` Table**:
- `id` TEXT PRIMARY KEY (e.g. `cps001`, `cps002`)
- `hospital_id` INTEGER NOT NULL
- `created_at` TEXT NOT NULL
- `updated_at` TEXT NOT NULL
- `status` TEXT DEFAULT 'ສົ່ງແລ້ວ' (`ສົ່ງແລ້ວ`, `ກຳລັງມາ`, `ຮອດແລ້ວ`, `ຮັບເຂົ້າຮັກສາ`, `ສົ່ງກັບ`)
- `arrived_at` TEXT
- `outcome` TEXT
- `recorded_by` TEXT
- *Patient Demographics*: `admission_date`, `referral_time`, `origin_phone`, `patient_name`, `age`, `gender`, `occupation`, `village`, `district`, `province`, `insurance_type`
- *History*: `diagnosis`, `past_medical_history`, `current_medications`, `present_illness`
- *Labs & Imaging*: `lab_wbc`, `lab_hct`, `lab_hb`, `lab_plt`, `lab_glucose`, `lab_creatinine`, `lab_urea`, `lab_k`, `lab_na`, `lab_dengue`, `imaging_xray`, `imaging_ultrasound`, `imaging_ct`
- *Physical Exam & Vitals*: `referring_unit`, `bp`, `pulse_rate`, `temp`, `spo2`, `respiratory_rate`, `weight`, `gcs_e`, `gcs_v`, `gcs_m`, `gcs_score`, `limb_weakness`, `pupil_right`, `pupil_left`, `lung_exam`, `heart_exam`, `other_symptoms`
- *Transfer Details*: `initial_treatment`, `referral_reason`, `target_coordinator`, `transport_vehicle`, `attending_doctor_name`, `attending_doctor_phone`

---

### 5. Verification Plan

- **Compilation & Linting**: Run `compile_applet` and `lint_applet` to verify TypeScript types, imports, and zero build warnings.
- **Auth Flow Testing**: Verify both Admin login (`admin2026`) and User login (with district hospital credentials).
- **Form Validation & GCS Calculation**: Verify GCS math (`E + V + M`), input bounds, and draft restoration after page reload.
- **Admin Management**: Verify district hospital creation, editing, deletion, and CSV backups.
- **Dashboard & Analytics**: Verify filter bars, dynamic trend charts, status changes, and PDF generation.
