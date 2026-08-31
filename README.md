# ⚡ AccountiX — Agency Business OS & Financial Engine

> **Executive ERP, Financial Operating System & Production Studio for Modern Marketing Agencies (SMMA, Creative & Performance Agencies) with Supabase Cloud Sync.**

---

## 🌟 Overview & Purpose

**AccountiX** is an executive-grade business operating system engineered specifically for agency founders, managing directors, operations leads, and account managers.

### 💎 Key Architectural Highlights:
1. **☁️ Supabase PostgreSQL Cloud Sync**: Real-time cloud synchronization across team devices with optimistic UI and 100% offline fallback to `localStorage`.
2. **💰 Realized Cashflow Engine**: Strictly separates **Actual Cash Collected** from uncollected contracted promises to provide the owner with true Net Take-Home Cash.
3. **🔄 Multi-Package Retainer Renewals**: Add single or multiple service packages into a single contract cycle with live fee calculations, assigned specialists, and automated multi-service WhatsApp notices.
4. **🏷️ Manager Pricing Catalog & Rate Card**: Centralized service rate card that dynamically populates client onboarding, proposals, and renewals.
5. **🕒 Attendance Timesheet Matrix**: Complete 31-day roll call matrix with color-coded status pills (`P`, `½`, `A`), automated timestamp logging, and monthly attendance rate analytics.
6. **🎬 Content Studio & Production Kanban**: Visual drag-and-drop workflow tracking shoots, video editing, and client WhatsApp preview approvals.
7. **📈 Sales CRM Pipeline**: Lead tracking with one-click conversion to active clients and WhatsApp follow-up triggers.
8. **🔍 In-App Financial Audit & Integrity Hub**: Automated ledger checks, reconciliations, chronological activity trail, and 1-click printable audit certificates.
9. **🖨️ 1-Click Print & PDF Tax Invoices**: Generates GST/agency tax invoices and statements ready for browser printing or PDF saving.

---

## 🚀 Fullstack Architecture (Frontend + Express Backend + Supabase)

AccountiX is built with a complete modern fullstack architecture:

```
+-----------------------------------------------------------------------------+
|                          ACCOUNTIX FULLSTACK SYSTEM                         |
+-----------------------------------------------------------------------------+
|  🎨 FRONTEND SPA         |  ⚡ BACKEND REST API       |  🗄️ DATABASE LAYER   |
|  • HTML5 / Vanilla JS    |  • Express.js (Node.js)    |  • Supabase (Postgres)  |
|  • Role Portals (Admin,  |  • Auth & 2-Step Verify    |  • Persistent JSON File |
|    Manager, Employee)    |  • Security Audit Logger   |  • Real-time Sync & RLS |
|  • Rich Visual Design    |  • Multi-Tenant CRUD APIs  |  • 100% Offline Support |
+-----------------------------------------------------------------------------+
```

### ⚡ Running the Fullstack Application:
```bash
# 1. Install dependencies
npm install

# 2. Start the Backend Server (runs on http://localhost:5000)
npm start

# Or with live auto-reload:
npm run dev
```

- **Frontend URL**: `http://localhost:5000`
- **Backend API Health Check**: `http://localhost:5000/api/health`
- **REST Endpoints**:
  - `POST /api/auth/login` (Email + Password authentication)
  - `POST /api/auth/register` (2-Time Password verification)
  - `GET /api/admin/logs` (Live login & security audit trail)
  - `GET /api/state` & `POST /api/state/sync` (Multi-tenant state synchronization)
  - `GET /api/:entity` (CRUD for companies, clients, staff, packages, payments, etc.)

---

## ⚡ 1-Time Supabase Cloud Database Setup (Zero Config for End Users)

> 💡 **You ONLY configure this once as the platform owner.** Your customers, agency owners, and staff members **NEVER** need to know about Supabase or enter any keys.

### Step 1: Get Your Free Supabase Credentials (60 Seconds)
1. Go to [supabase.com](https://supabase.com) and create a free project.
2. In your Supabase Dashboard, go to **Project Settings > API** to find your:
   - **Project URL** (e.g. `https://xyzcompany.supabase.co`)
   - **anon public API Key** (e.g. `eyJhbGciOi...`)

### Step 2: Run the SQL Tables Script
1. In your Supabase Dashboard, click **SQL Editor** > **New Query**.
2. Copy and paste the contents of [`supabase_schema.sql`](file:///a:/AccountiX/supabase_schema.sql).
3. Click **Run** to generate all persistent tables and RLS security policies.

### Step 3: Add to Vercel (Automatic for All Users Worldwide)
1. Open your **Vercel Dashboard** > **Project Settings** > **Environment Variables**.
2. Add these 2 variables:
   - `SUPABASE_URL` = `https://xyzcompany.supabase.co`
   - `SUPABASE_ANON_KEY` = `your_anon_key_here`
3. Click **Save** and **Redeploy**.
4. **THAT'S IT!** Now every single user, phone, and laptop that opens AccountiX automatically connects to your shared database with **zero configuration required!**

### 2. Switching Themes
- Click the **`☀️ / 🌙`** toggle button on the top navigation bar or go to **Settings**.
- Supports **Executive Obsidian (Dark Mode)** and **Clean Slate (Official Light Mode)**.

### 3. Transitioning to Live Production Mode
When you are ready to onboard real clients:
1. Go to **Settings**.
2. Under **🚀 Production Launch Controls**, click **`🧹 Start Clean Production Database`**.
3. This clears all demo clients, leads, and deliverables while preserving your team roster, rate card, and Supabase cloud connection.

---

## ⌨️ Global Keyboard Shortcuts

| Shortcut | Action |
|---|---|
| <kbd>Ctrl</kbd> / <kbd>Cmd</kbd> + <kbd>K</kbd> | Focus Global Instant Search |
| <kbd>Ctrl</kbd> / <kbd>Cmd</kbd> + <kbd>Shift</kbd> + <kbd>P</kbd> | Quick Record Payment Modal |
| <kbd>Ctrl</kbd> / <kbd>Cmd</kbd> + <kbd>Shift</kbd> + <kbd>E</kbd> | Quick Add Expense Modal |
| <kbd>Ctrl</kbd> / <kbd>Cmd</kbd> + <kbd>Shift</kbd> + <kbd>C</kbd> | Quick Onboard New Client |
| <kbd>Esc</kbd> | Close Any Open Modal / Dialog |

---

## 🗂️ Database Schema (`supabase_schema.sql`)

| Table Name | Description |
|---|---|
| `accountix_clients` | Client master accounts, contact info, and social handles |
| `accountix_staff` | Team members, specialist roles, base salary |
| `accountix_packages` | Retainers & contracted service packages per client |
| `accountix_payments` | Inflow transactions, receipts, payment modes |
| `accountix_expenses` | Outflow expenses, categories, operational costs |
| `accountix_attendance` | Daily attendance roll call records & timestamps |
| `accountix_salary_payments` | Disbursed salary ledgers with incentives & deductions |
| `accountix_tasks` | Operational deliverables & assigned tasks |
| `accountix_content` | Video shoots, reels, editing & approval pipeline |
| `accountix_leads` | Sales CRM prospective clients & pipeline stages |
| `accountix_service_catalog` | Manager rate cards & deliverable packages |
| `accountix_settings` | Agency profile, currency, and theme settings |

---

## 🔒 Security & Privacy

- **Row Level Security (RLS)**: Pre-configured RLS policies for all tables.
- **Client-Side Encryption Ready**: Works seamlessly over HTTPS with encrypted Supabase auth headers.
- **Offline Data Resilience**: Persistent local backup cache automatically activates if network drops.

---

*AccountiX — Built for High-Performance Modern Agencies.*
