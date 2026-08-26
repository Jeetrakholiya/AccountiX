-- ==============================================================================
-- AccountiX Agency Business OS — Multi-Tenant PostgreSQL Schema with RBAC & Supabase Auth
-- Run this in Supabase SQL Editor (Dashboard > SQL Editor > New Query)
-- ==============================================================================

CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

-- 1. Tenant Companies Table (Agencies)
CREATE TABLE IF NOT EXISTS accountix_companies (
    id TEXT PRIMARY KEY,
    name TEXT NOT NULL,
    plan TEXT DEFAULT 'Pro Agency',
    status TEXT DEFAULT 'Active',
    owner_email TEXT,
    created_at TIMESTAMPTZ DEFAULT NOW()
);

-- 2. Platform Users Table (with Roles: admin, manager, employee)
CREATE TABLE IF NOT EXISTS accountix_users (
    id TEXT PRIMARY KEY,
    email TEXT NOT NULL,
    name TEXT NOT NULL,
    avatar_url TEXT,
    role TEXT DEFAULT 'manager', -- 'admin', 'manager', 'employee'
    company_id TEXT REFERENCES accountix_companies(id) ON DELETE CASCADE,
    staff_id TEXT,
    last_active_at TIMESTAMPTZ DEFAULT NOW(),
    created_at TIMESTAMPTZ DEFAULT NOW()
);

-- 3. Clients Table
CREATE TABLE IF NOT EXISTS accountix_clients (
    id TEXT PRIMARY KEY,
    company_id TEXT REFERENCES accountix_companies(id) ON DELETE CASCADE,
    name TEXT NOT NULL,
    company TEXT,
    mobile TEXT,
    whatsapp TEXT,
    instagram TEXT,
    status TEXT DEFAULT 'Active',
    created_at TIMESTAMPTZ DEFAULT NOW()
);

-- 4. Staff & Team Table
CREATE TABLE IF NOT EXISTS accountix_staff (
    id TEXT PRIMARY KEY,
    company_id TEXT REFERENCES accountix_companies(id) ON DELETE CASCADE,
    name TEXT NOT NULL,
    role TEXT,
    phone TEXT,
    base_salary NUMERIC DEFAULT 0,
    status TEXT DEFAULT 'Active',
    created_at TIMESTAMPTZ DEFAULT NOW()
);

-- 5. Packages & Retainers Table
CREATE TABLE IF NOT EXISTS accountix_packages (
    id TEXT PRIMARY KEY,
    company_id TEXT REFERENCES accountix_companies(id) ON DELETE CASCADE,
    client_id TEXT REFERENCES accountix_clients(id) ON DELETE CASCADE,
    service_type TEXT NOT NULL,
    amount NUMERIC NOT NULL DEFAULT 0,
    start_date DATE,
    end_date DATE,
    assigned_staff_id TEXT REFERENCES accountix_staff(id) ON DELETE SET NULL,
    status TEXT DEFAULT 'Active',
    created_at TIMESTAMPTZ DEFAULT NOW()
);

-- 6. Payments & Receipts Table
CREATE TABLE IF NOT EXISTS accountix_payments (
    id TEXT PRIMARY KEY,
    company_id TEXT REFERENCES accountix_companies(id) ON DELETE CASCADE,
    client_id TEXT REFERENCES accountix_clients(id) ON DELETE CASCADE,
    package_id TEXT REFERENCES accountix_packages(id) ON DELETE SET NULL,
    amount NUMERIC NOT NULL DEFAULT 0,
    date DATE NOT NULL,
    mode TEXT DEFAULT 'UPI',
    note TEXT,
    created_at TIMESTAMPTZ DEFAULT NOW()
);

-- 7. Expenses Table
CREATE TABLE IF NOT EXISTS accountix_expenses (
    id TEXT PRIMARY KEY,
    company_id TEXT REFERENCES accountix_companies(id) ON DELETE CASCADE,
    category TEXT NOT NULL,
    amount NUMERIC NOT NULL DEFAULT 0,
    date DATE NOT NULL,
    mode TEXT DEFAULT 'Bank Transfer',
    note TEXT,
    staff_id TEXT REFERENCES accountix_staff(id) ON DELETE SET NULL,
    created_at TIMESTAMPTZ DEFAULT NOW()
);

-- 8. Daily Attendance Table
CREATE TABLE IF NOT EXISTS accountix_attendance (
    id TEXT PRIMARY KEY,
    company_id TEXT REFERENCES accountix_companies(id) ON DELETE CASCADE,
    staff_id TEXT REFERENCES accountix_staff(id) ON DELETE CASCADE,
    date DATE NOT NULL,
    status TEXT DEFAULT 'Present',
    check_in TEXT,
    created_at TIMESTAMPTZ DEFAULT NOW(),
    UNIQUE (staff_id, date)
);

-- 9. Salary Disbursements Table
CREATE TABLE IF NOT EXISTS accountix_salary_payments (
    id TEXT PRIMARY KEY,
    company_id TEXT REFERENCES accountix_companies(id) ON DELETE CASCADE,
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

-- 10. Tasks Table
CREATE TABLE IF NOT EXISTS accountix_tasks (
    id TEXT PRIMARY KEY,
    company_id TEXT REFERENCES accountix_companies(id) ON DELETE CASCADE,
    title TEXT NOT NULL,
    client_id TEXT REFERENCES accountix_clients(id) ON DELETE CASCADE,
    assigned_to TEXT REFERENCES accountix_staff(id) ON DELETE SET NULL,
    deadline DATE,
    priority TEXT DEFAULT 'Medium',
    status TEXT DEFAULT 'To Do',
    created_at TIMESTAMPTZ DEFAULT NOW()
);

-- 11. Content Studio Deliverables Table
CREATE TABLE IF NOT EXISTS accountix_content (
    id TEXT PRIMARY KEY,
    company_id TEXT REFERENCES accountix_companies(id) ON DELETE CASCADE,
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

-- 12. Sales CRM Leads Table
CREATE TABLE IF NOT EXISTS accountix_leads (
    id TEXT PRIMARY KEY,
    company_id TEXT REFERENCES accountix_companies(id) ON DELETE CASCADE,
    name TEXT NOT NULL,
    business TEXT,
    phone TEXT,
    service TEXT,
    budget NUMERIC DEFAULT 0,
    follow_up_date DATE,
    status TEXT DEFAULT 'New',
    created_at TIMESTAMPTZ DEFAULT NOW()
);

-- 13. Manager Service Catalog & Rate Card
CREATE TABLE IF NOT EXISTS accountix_service_catalog (
    id TEXT PRIMARY KEY,
    company_id TEXT REFERENCES accountix_companies(id) ON DELETE CASCADE,
    name TEXT NOT NULL,
    default_amount NUMERIC NOT NULL DEFAULT 0,
    cycle TEXT DEFAULT 'Monthly Retainer',
    description TEXT,
    created_at TIMESTAMPTZ DEFAULT NOW()
);

-- 14. Agency Settings & Configuration Table
CREATE TABLE IF NOT EXISTS accountix_settings (
    id TEXT PRIMARY KEY DEFAULT 'primary_agency_settings',
    company_id TEXT REFERENCES accountix_companies(id) ON DELETE CASCADE,
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
-- Row Level Security (RLS) & Open Access Policies
-- ==============================================================================
ALTER TABLE accountix_companies ENABLE ROW LEVEL SECURITY;
ALTER TABLE accountix_users ENABLE ROW LEVEL SECURITY;
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
DROP POLICY IF EXISTS "Allow all companies" ON accountix_companies;
DROP POLICY IF EXISTS "Allow all users" ON accountix_users;
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

CREATE POLICY "Allow all companies" ON accountix_companies FOR ALL USING (true) WITH CHECK (true);
CREATE POLICY "Allow all users" ON accountix_users FOR ALL USING (true) WITH CHECK (true);
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

-- Performance Indexes
CREATE INDEX IF NOT EXISTS idx_users_email ON accountix_users(email);
CREATE INDEX IF NOT EXISTS idx_users_role ON accountix_users(role);
CREATE INDEX IF NOT EXISTS idx_clients_company ON accountix_clients(company_id);
CREATE INDEX IF NOT EXISTS idx_packages_client ON accountix_packages(client_id);
CREATE INDEX IF NOT EXISTS idx_payments_client ON accountix_payments(client_id);
CREATE INDEX IF NOT EXISTS idx_attendance_staff ON accountix_attendance(staff_id, date);
