-- ==============================================================================
-- AccountiX Agency Business OS & Financial Engine — Supabase PostgreSQL Schema
-- Run this complete script in your Supabase SQL Editor (Dashboard > SQL Editor > New Query)
-- ==============================================================================

-- 1. Enable UUID Extension
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

-- 2. Clients Table
CREATE TABLE IF NOT EXISTS accountix_clients (
    id TEXT PRIMARY KEY,
    name TEXT NOT NULL,
    company TEXT,
    mobile TEXT,
    whatsapp TEXT,
    instagram TEXT,
    status TEXT DEFAULT 'Active',
    created_at TIMESTAMPTZ DEFAULT NOW()
);

-- 3. Staff & Team Table
CREATE TABLE IF NOT EXISTS accountix_staff (
    id TEXT PRIMARY KEY,
    name TEXT NOT NULL,
    role TEXT,
    phone TEXT,
    base_salary NUMERIC DEFAULT 0,
    status TEXT DEFAULT 'Active',
    created_at TIMESTAMPTZ DEFAULT NOW()
);

-- 4. Packages & Retainers Table
CREATE TABLE IF NOT EXISTS accountix_packages (
    id TEXT PRIMARY KEY,
    client_id TEXT REFERENCES accountix_clients(id) ON DELETE CASCADE,
    service_type TEXT NOT NULL,
    amount NUMERIC NOT NULL DEFAULT 0,
    start_date DATE,
    end_date DATE,
    assigned_staff_id TEXT REFERENCES accountix_staff(id) ON DELETE SET NULL,
    status TEXT DEFAULT 'Active',
    created_at TIMESTAMPTZ DEFAULT NOW()
);

-- 5. Payments & Receipts Table
CREATE TABLE IF NOT EXISTS accountix_payments (
    id TEXT PRIMARY KEY,
    client_id TEXT REFERENCES accountix_clients(id) ON DELETE CASCADE,
    package_id TEXT REFERENCES accountix_packages(id) ON DELETE SET NULL,
    amount NUMERIC NOT NULL DEFAULT 0,
    date DATE NOT NULL,
    mode TEXT DEFAULT 'UPI',
    note TEXT,
    created_at TIMESTAMPTZ DEFAULT NOW()
);

-- 6. Expenses Table
CREATE TABLE IF NOT EXISTS accountix_expenses (
    id TEXT PRIMARY KEY,
    category TEXT NOT NULL,
    amount NUMERIC NOT NULL DEFAULT 0,
    date DATE NOT NULL,
    mode TEXT DEFAULT 'Bank Transfer',
    note TEXT,
    staff_id TEXT REFERENCES accountix_staff(id) ON DELETE SET NULL,
    created_at TIMESTAMPTZ DEFAULT NOW()
);

-- 7. Daily Attendance Table
CREATE TABLE IF NOT EXISTS accountix_attendance (
    id TEXT PRIMARY KEY,
    staff_id TEXT REFERENCES accountix_staff(id) ON DELETE CASCADE,
    date DATE NOT NULL,
    status TEXT DEFAULT 'Present',
    check_in TEXT,
    created_at TIMESTAMPTZ DEFAULT NOW(),
    UNIQUE (staff_id, date)
);

-- 8. Salary Disbursements Table
CREATE TABLE IF NOT EXISTS accountix_salary_payments (
    id TEXT PRIMARY KEY,
    staff_id TEXT REFERENCES accountix_staff(id) ON DELETE CASCADE,
    month TEXT NOT NULL,
    base NUMERIC DEFAULT 0,
    incentive NUMERIC DEFAULT 0,
    advance NUMERIC DEFAULT 0,
    deduction NUMERIC DEFAULT 0,
    final_payable NUMERIC DEFAULT 0,
    paid_on DATE NOT NULL,
    created_at TIMESTAMPTZ DEFAULT NOW()
);

-- 9. Tasks Table
CREATE TABLE IF NOT EXISTS accountix_tasks (
    id TEXT PRIMARY KEY,
    title TEXT NOT NULL,
    client_id TEXT REFERENCES accountix_clients(id) ON DELETE CASCADE,
    assigned_to TEXT REFERENCES accountix_staff(id) ON DELETE SET NULL,
    deadline DATE,
    priority TEXT DEFAULT 'Medium',
    status TEXT DEFAULT 'To Do',
    created_at TIMESTAMPTZ DEFAULT NOW()
);

-- 10. Content Studio Deliverables Table
CREATE TABLE IF NOT EXISTS accountix_content (
    id TEXT PRIMARY KEY,
    client_id TEXT REFERENCES accountix_clients(id) ON DELETE CASCADE,
    date DATE NOT NULL,
    type TEXT NOT NULL,
    topic TEXT,
    shoot_by_id TEXT REFERENCES accountix_staff(id) ON DELETE SET NULL,
    assigned_staff_id TEXT REFERENCES accountix_staff(id) ON DELETE SET NULL,
    status TEXT DEFAULT 'Idea',
    drive_link TEXT,
    caption TEXT,
    created_at TIMESTAMPTZ DEFAULT NOW()
);

-- 11. Sales CRM Leads Table
CREATE TABLE IF NOT EXISTS accountix_leads (
    id TEXT PRIMARY KEY,
    name TEXT NOT NULL,
    business TEXT,
    phone TEXT,
    service TEXT,
    budget NUMERIC DEFAULT 0,
    follow_up_date DATE,
    status TEXT DEFAULT 'New',
    created_at TIMESTAMPTZ DEFAULT NOW()
);

-- 12. Manager Service Catalog & Rate Card
CREATE TABLE IF NOT EXISTS accountix_service_catalog (
    id TEXT PRIMARY KEY,
    name TEXT NOT NULL,
    default_amount NUMERIC NOT NULL DEFAULT 0,
    cycle TEXT DEFAULT 'Monthly Retainer',
    description TEXT,
    created_at TIMESTAMPTZ DEFAULT NOW()
);

-- 13. Agency Settings & Configuration Table
CREATE TABLE IF NOT EXISTS accountix_settings (
    id TEXT PRIMARY KEY DEFAULT 'primary_agency_settings',
    agency_name TEXT DEFAULT 'AccountiX',
    tagline TEXT DEFAULT 'Agency Business OS & Financial Engine',
    owner_name TEXT DEFAULT 'Managing Director',
    phone TEXT,
    email TEXT,
    currency_symbol TEXT DEFAULT '₹',
    theme TEXT DEFAULT 'dark',
    updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- ==============================================================================
-- Row Level Security (RLS) & Open Access Policies for Authenticated & Anon Clients
-- ==============================================================================
ALTER TABLE accountix_clients ENABLE ROW LEVEL SECURITY;
ALTER TABLE accountix_staff ENABLE ROW LEVEL SECURITY;
ALTER TABLE accountix_packages ENABLE ROW LEVEL SECURITY;
ALTER TABLE accountix_payments ENABLE ROW LEVEL SECURITY;
ALTER TABLE accountix_expenses ENABLE ROW LEVEL SECURITY;
ALTER TABLE accountix_attendance ENABLE ROW LEVEL SECURITY;
ALTER TABLE accountix_salary_payments ENABLE ROW LEVEL SECURITY;
ALTER TABLE accountix_tasks ENABLE ROW LEVEL SECURITY;
ALTER TABLE accountix_content ENABLE ROW LEVEL SECURITY;
ALTER TABLE accountix_leads ENABLE ROW LEVEL SECURITY;
ALTER TABLE accountix_service_catalog ENABLE ROW LEVEL SECURITY;
ALTER TABLE accountix_settings ENABLE ROW LEVEL SECURITY;

-- Drop existing policies if re-running
DROP POLICY IF EXISTS "Allow all clients" ON accountix_clients;
DROP POLICY IF EXISTS "Allow all staff" ON accountix_staff;
DROP POLICY IF EXISTS "Allow all packages" ON accountix_packages;
DROP POLICY IF EXISTS "Allow all payments" ON accountix_payments;
DROP POLICY IF EXISTS "Allow all expenses" ON accountix_expenses;
DROP POLICY IF EXISTS "Allow all attendance" ON accountix_attendance;
DROP POLICY IF EXISTS "Allow all salary payments" ON accountix_salary_payments;
DROP POLICY IF EXISTS "Allow all tasks" ON accountix_tasks;
DROP POLICY IF EXISTS "Allow all content" ON accountix_content;
DROP POLICY IF EXISTS "Allow all leads" ON accountix_leads;
DROP POLICY IF EXISTS "Allow all service catalog" ON accountix_service_catalog;
DROP POLICY IF EXISTS "Allow all settings" ON accountix_settings;

-- Allow full access for anon/authenticated roles for agency operations
CREATE POLICY "Allow all clients" ON accountix_clients FOR ALL USING (true) WITH CHECK (true);
CREATE POLICY "Allow all staff" ON accountix_staff FOR ALL USING (true) WITH CHECK (true);
CREATE POLICY "Allow all packages" ON accountix_packages FOR ALL USING (true) WITH CHECK (true);
CREATE POLICY "Allow all payments" ON accountix_payments FOR ALL USING (true) WITH CHECK (true);
CREATE POLICY "Allow all expenses" ON accountix_expenses FOR ALL USING (true) WITH CHECK (true);
CREATE POLICY "Allow all attendance" ON accountix_attendance FOR ALL USING (true) WITH CHECK (true);
CREATE POLICY "Allow all salary payments" ON accountix_salary_payments FOR ALL USING (true) WITH CHECK (true);
CREATE POLICY "Allow all tasks" ON accountix_tasks FOR ALL USING (true) WITH CHECK (true);
CREATE POLICY "Allow all content" ON accountix_content FOR ALL USING (true) WITH CHECK (true);
CREATE POLICY "Allow all leads" ON accountix_leads FOR ALL USING (true) WITH CHECK (true);
CREATE POLICY "Allow all service catalog" ON accountix_service_catalog FOR ALL USING (true) WITH CHECK (true);
CREATE POLICY "Allow all settings" ON accountix_settings FOR ALL USING (true) WITH CHECK (true);

-- Indexes for maximum query performance
CREATE INDEX IF NOT EXISTS idx_pkg_client ON accountix_packages(client_id);
CREATE INDEX IF NOT EXISTS idx_pay_client ON accountix_payments(client_id);
CREATE INDEX IF NOT EXISTS idx_att_staff_date ON accountix_attendance(staff_id, date);
CREATE INDEX IF NOT EXISTS idx_cnt_client ON accountix_content(client_id);
CREATE INDEX IF NOT EXISTS idx_tsk_client ON accountix_tasks(client_id);
