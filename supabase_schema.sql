-- ==============================================================================
-- AccountiX Agency Business OS & Persistent Storage Schema with Supabase Auth & RLS
-- Run this in Supabase SQL Editor (Dashboard > SQL Editor > New Query)
-- ==============================================================================

-- Enable UUID Extension
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";
CREATE EXTENSION IF NOT EXISTS "pgcrypto";

-- ==============================================================================
-- 1. Universal User Data Table (Persistent Storage with RLS)
-- ==============================================================================
CREATE TABLE IF NOT EXISTS user_data (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
    title TEXT,
    content TEXT,
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- ==============================================================================
-- 2. AccountiX Core Application Tables (User-Owned & RLS Protected)
-- ==============================================================================

-- 2.1 User Profiles Table (Linked to auth.users)
CREATE TABLE IF NOT EXISTS accountix_user_profile (
    id UUID PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
    user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
    email TEXT NOT NULL,
    name TEXT NOT NULL,
    avatar_url TEXT,
    role TEXT DEFAULT 'manager', -- 'admin', 'manager', 'employee'
    company_name TEXT DEFAULT 'My Agency',
    title TEXT DEFAULT 'Agency Managing Director',
    plan TEXT DEFAULT 'Enterprise Suite',
    last_active_at TIMESTAMPTZ DEFAULT NOW(),
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- 2.2 Agency Settings Table
CREATE TABLE IF NOT EXISTS accountix_settings (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
    agency_name TEXT DEFAULT 'AccountiX',
    tagline TEXT DEFAULT 'Agency Business OS & Financial Engine',
    owner_name TEXT DEFAULT 'Managing Director',
    phone TEXT,
    email TEXT,
    currency_symbol TEXT DEFAULT '₹',
    theme TEXT DEFAULT 'dark',
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW(),
    UNIQUE (user_id)
);

-- 2.3 Clients Table
CREATE TABLE IF NOT EXISTS accountix_clients (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
    name TEXT NOT NULL,
    company TEXT,
    mobile TEXT,
    whatsapp TEXT,
    instagram TEXT,
    status TEXT DEFAULT 'Active',
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- 2.4 Staff & Team Table
CREATE TABLE IF NOT EXISTS accountix_staff (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
    name TEXT NOT NULL,
    role TEXT,
    phone TEXT,
    base_salary NUMERIC DEFAULT 0,
    status TEXT DEFAULT 'Active',
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- 2.5 Packages & Retainers Table
CREATE TABLE IF NOT EXISTS accountix_packages (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
    client_id UUID REFERENCES accountix_clients(id) ON DELETE CASCADE,
    service_type TEXT NOT NULL,
    amount NUMERIC NOT NULL DEFAULT 0,
    start_date DATE,
    end_date DATE,
    assigned_staff_id UUID REFERENCES accountix_staff(id) ON DELETE SET NULL,
    status TEXT DEFAULT 'Active',
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- 2.6 Payments & Invoices Table
CREATE TABLE IF NOT EXISTS accountix_payments (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
    client_id UUID REFERENCES accountix_clients(id) ON DELETE CASCADE,
    package_id UUID REFERENCES accountix_packages(id) ON DELETE SET NULL,
    amount NUMERIC NOT NULL DEFAULT 0,
    date DATE NOT NULL,
    mode TEXT DEFAULT 'UPI (GPay / PhonePe / Paytm)',
    note TEXT,
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- 2.7 Expenses Table
CREATE TABLE IF NOT EXISTS accountix_expenses (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
    category TEXT NOT NULL,
    amount NUMERIC NOT NULL DEFAULT 0,
    date DATE NOT NULL,
    mode TEXT DEFAULT 'Bank Transfer (NEFT/IMPS/RTGS)',
    note TEXT,
    staff_id UUID REFERENCES accountix_staff(id) ON DELETE SET NULL,
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- 2.8 Daily Attendance Table
CREATE TABLE IF NOT EXISTS accountix_attendance (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
    staff_id UUID REFERENCES accountix_staff(id) ON DELETE CASCADE,
    date DATE NOT NULL,
    status TEXT DEFAULT 'Present',
    check_in TEXT,
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- 2.9 Salary Disbursements Table
CREATE TABLE IF NOT EXISTS accountix_salary_payments (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
    staff_id UUID REFERENCES accountix_staff(id) ON DELETE CASCADE,
    month TEXT NOT NULL,
    base NUMERIC DEFAULT 0,
    incentive NUMERIC DEFAULT 0,
    advance NUMERIC DEFAULT 0,
    deduction NUMERIC DEFAULT 0,
    final_payable NUMERIC DEFAULT 0,
    paid_on DATE NOT NULL,
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- 2.10 Tasks Table (Kanban)
CREATE TABLE IF NOT EXISTS accountix_tasks (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
    title TEXT NOT NULL,
    client_id UUID REFERENCES accountix_clients(id) ON DELETE SET NULL,
    assigned_to UUID REFERENCES accountix_staff(id) ON DELETE SET NULL,
    deadline DATE,
    priority TEXT DEFAULT 'Medium',
    status TEXT DEFAULT 'To Do',
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- 2.11 Content Studio Deliverables Table
CREATE TABLE IF NOT EXISTS accountix_content (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
    client_id UUID REFERENCES accountix_clients(id) ON DELETE SET NULL,
    date DATE NOT NULL,
    type TEXT NOT NULL,
    topic TEXT,
    shoot_by_id UUID REFERENCES accountix_staff(id) ON DELETE SET NULL,
    assigned_staff_id UUID REFERENCES accountix_staff(id) ON DELETE SET NULL,
    status TEXT DEFAULT 'Idea',
    drive_link TEXT,
    caption TEXT,
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- 2.12 Sales CRM Leads Table
CREATE TABLE IF NOT EXISTS accountix_leads (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
    name TEXT NOT NULL,
    business TEXT,
    phone TEXT,
    service TEXT,
    budget NUMERIC DEFAULT 0,
    follow_up_date DATE,
    status TEXT DEFAULT 'New',
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- 2.13 Service Catalog Rate Card Table
CREATE TABLE IF NOT EXISTS accountix_service_catalog (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
    name TEXT NOT NULL,
    default_amount NUMERIC NOT NULL DEFAULT 0,
    cycle TEXT DEFAULT 'Monthly Retainer',
    description TEXT,
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- ==============================================================================
-- 3. Row Level Security (RLS) Configuration & Strict User Isolation
-- ==============================================================================

-- Enable RLS on all tables
ALTER TABLE user_data ENABLE ROW LEVEL SECURITY;
ALTER TABLE accountix_user_profile ENABLE ROW LEVEL SECURITY;
ALTER TABLE accountix_settings ENABLE ROW LEVEL SECURITY;
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

-- ------------------------------------------------------------------------------
-- RLS Policies: user_data
-- ------------------------------------------------------------------------------
DROP POLICY IF EXISTS "Users can view own data" ON user_data;
DROP POLICY IF EXISTS "Users can insert own data" ON user_data;
DROP POLICY IF EXISTS "Users can update own data" ON user_data;
DROP POLICY IF EXISTS "Users can delete own data" ON user_data;

CREATE POLICY "Users can view own data" ON user_data FOR SELECT USING (auth.uid() = user_id);
CREATE POLICY "Users can insert own data" ON user_data FOR INSERT WITH CHECK (auth.uid() = user_id);
CREATE POLICY "Users can update own data" ON user_data FOR UPDATE USING (auth.uid() = user_id) WITH CHECK (auth.uid() = user_id);
CREATE POLICY "Users can delete own data" ON user_data FOR DELETE USING (auth.uid() = user_id);

-- ------------------------------------------------------------------------------
-- RLS Policies: accountix_user_profile
-- ------------------------------------------------------------------------------
DROP POLICY IF EXISTS "Users can view own profile" ON accountix_user_profile;
DROP POLICY IF EXISTS "Users can insert own profile" ON accountix_user_profile;
DROP POLICY IF EXISTS "Users can update own profile" ON accountix_user_profile;
DROP POLICY IF EXISTS "Users can delete own profile" ON accountix_user_profile;

CREATE POLICY "Users can view own profile" ON accountix_user_profile FOR SELECT USING (auth.uid() = user_id);
CREATE POLICY "Users can insert own profile" ON accountix_user_profile FOR INSERT WITH CHECK (auth.uid() = user_id);
CREATE POLICY "Users can update own profile" ON accountix_user_profile FOR UPDATE USING (auth.uid() = user_id) WITH CHECK (auth.uid() = user_id);
CREATE POLICY "Users can delete own profile" ON accountix_user_profile FOR DELETE USING (auth.uid() = user_id);

-- ------------------------------------------------------------------------------
-- RLS Policies: accountix_settings
-- ------------------------------------------------------------------------------
DROP POLICY IF EXISTS "Users can view own settings" ON accountix_settings;
DROP POLICY IF EXISTS "Users can insert own settings" ON accountix_settings;
DROP POLICY IF EXISTS "Users can update own settings" ON accountix_settings;
DROP POLICY IF EXISTS "Users can delete own settings" ON accountix_settings;

CREATE POLICY "Users can view own settings" ON accountix_settings FOR SELECT USING (auth.uid() = user_id);
CREATE POLICY "Users can insert own settings" ON accountix_settings FOR INSERT WITH CHECK (auth.uid() = user_id);
CREATE POLICY "Users can update own settings" ON accountix_settings FOR UPDATE USING (auth.uid() = user_id) WITH CHECK (auth.uid() = user_id);
CREATE POLICY "Users can delete own settings" ON accountix_settings FOR DELETE USING (auth.uid() = user_id);

-- ------------------------------------------------------------------------------
-- RLS Policies: accountix_clients
-- ------------------------------------------------------------------------------
DROP POLICY IF EXISTS "Users can view own clients" ON accountix_clients;
DROP POLICY IF EXISTS "Users can insert own clients" ON accountix_clients;
DROP POLICY IF EXISTS "Users can update own clients" ON accountix_clients;
DROP POLICY IF EXISTS "Users can delete own clients" ON accountix_clients;

CREATE POLICY "Users can view own clients" ON accountix_clients FOR SELECT USING (auth.uid() = user_id);
CREATE POLICY "Users can insert own clients" ON accountix_clients FOR INSERT WITH CHECK (auth.uid() = user_id);
CREATE POLICY "Users can update own clients" ON accountix_clients FOR UPDATE USING (auth.uid() = user_id) WITH CHECK (auth.uid() = user_id);
CREATE POLICY "Users can delete own clients" ON accountix_clients FOR DELETE USING (auth.uid() = user_id);

-- ------------------------------------------------------------------------------
-- RLS Policies: accountix_staff
-- ------------------------------------------------------------------------------
DROP POLICY IF EXISTS "Users can view own staff" ON accountix_staff;
DROP POLICY IF EXISTS "Users can insert own staff" ON accountix_staff;
DROP POLICY IF EXISTS "Users can update own staff" ON accountix_staff;
DROP POLICY IF EXISTS "Users can delete own staff" ON accountix_staff;

CREATE POLICY "Users can view own staff" ON accountix_staff FOR SELECT USING (auth.uid() = user_id);
CREATE POLICY "Users can insert own staff" ON accountix_staff FOR INSERT WITH CHECK (auth.uid() = user_id);
CREATE POLICY "Users can update own staff" ON accountix_staff FOR UPDATE USING (auth.uid() = user_id) WITH CHECK (auth.uid() = user_id);
CREATE POLICY "Users can delete own staff" ON accountix_staff FOR DELETE USING (auth.uid() = user_id);

-- ------------------------------------------------------------------------------
-- RLS Policies: accountix_packages
-- ------------------------------------------------------------------------------
DROP POLICY IF EXISTS "Users can view own packages" ON accountix_packages;
DROP POLICY IF EXISTS "Users can insert own packages" ON accountix_packages;
DROP POLICY IF EXISTS "Users can update own packages" ON accountix_packages;
DROP POLICY IF EXISTS "Users can delete own packages" ON accountix_packages;

CREATE POLICY "Users can view own packages" ON accountix_packages FOR SELECT USING (auth.uid() = user_id);
CREATE POLICY "Users can insert own packages" ON accountix_packages FOR INSERT WITH CHECK (auth.uid() = user_id);
CREATE POLICY "Users can update own packages" ON accountix_packages FOR UPDATE USING (auth.uid() = user_id) WITH CHECK (auth.uid() = user_id);
CREATE POLICY "Users can delete own packages" ON accountix_packages FOR DELETE USING (auth.uid() = user_id);

-- ------------------------------------------------------------------------------
-- RLS Policies: accountix_payments
-- ------------------------------------------------------------------------------
DROP POLICY IF EXISTS "Users can view own payments" ON accountix_payments;
DROP POLICY IF EXISTS "Users can insert own payments" ON accountix_payments;
DROP POLICY IF EXISTS "Users can update own payments" ON accountix_payments;
DROP POLICY IF EXISTS "Users can delete own payments" ON accountix_payments;

CREATE POLICY "Users can view own payments" ON accountix_payments FOR SELECT USING (auth.uid() = user_id);
CREATE POLICY "Users can insert own payments" ON accountix_payments FOR INSERT WITH CHECK (auth.uid() = user_id);
CREATE POLICY "Users can update own payments" ON accountix_payments FOR UPDATE USING (auth.uid() = user_id) WITH CHECK (auth.uid() = user_id);
CREATE POLICY "Users can delete own payments" ON accountix_payments FOR DELETE USING (auth.uid() = user_id);

-- ------------------------------------------------------------------------------
-- RLS Policies: accountix_expenses
-- ------------------------------------------------------------------------------
DROP POLICY IF EXISTS "Users can view own expenses" ON accountix_expenses;
DROP POLICY IF EXISTS "Users can insert own expenses" ON accountix_expenses;
DROP POLICY IF EXISTS "Users can update own expenses" ON accountix_expenses;
DROP POLICY IF EXISTS "Users can delete own expenses" ON accountix_expenses;

CREATE POLICY "Users can view own expenses" ON accountix_expenses FOR SELECT USING (auth.uid() = user_id);
CREATE POLICY "Users can insert own expenses" ON accountix_expenses FOR INSERT WITH CHECK (auth.uid() = user_id);
CREATE POLICY "Users can update own expenses" ON accountix_expenses FOR UPDATE USING (auth.uid() = user_id) WITH CHECK (auth.uid() = user_id);
CREATE POLICY "Users can delete own expenses" ON accountix_expenses FOR DELETE USING (auth.uid() = user_id);

-- ------------------------------------------------------------------------------
-- RLS Policies: accountix_attendance
-- ------------------------------------------------------------------------------
DROP POLICY IF EXISTS "Users can view own attendance" ON accountix_attendance;
DROP POLICY IF EXISTS "Users can insert own attendance" ON accountix_attendance;
DROP POLICY IF EXISTS "Users can update own attendance" ON accountix_attendance;
DROP POLICY IF EXISTS "Users can delete own attendance" ON accountix_attendance;

CREATE POLICY "Users can view own attendance" ON accountix_attendance FOR SELECT USING (auth.uid() = user_id);
CREATE POLICY "Users can insert own attendance" ON accountix_attendance FOR INSERT WITH CHECK (auth.uid() = user_id);
CREATE POLICY "Users can update own attendance" ON accountix_attendance FOR UPDATE USING (auth.uid() = user_id) WITH CHECK (auth.uid() = user_id);
CREATE POLICY "Users can delete own attendance" ON accountix_attendance FOR DELETE USING (auth.uid() = user_id);

-- ------------------------------------------------------------------------------
-- RLS Policies: accountix_salary_payments
-- ------------------------------------------------------------------------------
DROP POLICY IF EXISTS "Users can view own salary payments" ON accountix_salary_payments;
DROP POLICY IF EXISTS "Users can insert own salary payments" ON accountix_salary_payments;
DROP POLICY IF EXISTS "Users can update own salary payments" ON accountix_salary_payments;
DROP POLICY IF EXISTS "Users can delete own salary payments" ON accountix_salary_payments;

CREATE POLICY "Users can view own salary payments" ON accountix_salary_payments FOR SELECT USING (auth.uid() = user_id);
CREATE POLICY "Users can insert own salary payments" ON accountix_salary_payments FOR INSERT WITH CHECK (auth.uid() = user_id);
CREATE POLICY "Users can update own salary payments" ON accountix_salary_payments FOR UPDATE USING (auth.uid() = user_id) WITH CHECK (auth.uid() = user_id);
CREATE POLICY "Users can delete own salary payments" ON accountix_salary_payments FOR DELETE USING (auth.uid() = user_id);

-- ------------------------------------------------------------------------------
-- RLS Policies: accountix_tasks
-- ------------------------------------------------------------------------------
DROP POLICY IF EXISTS "Users can view own tasks" ON accountix_tasks;
DROP POLICY IF EXISTS "Users can insert own tasks" ON accountix_tasks;
DROP POLICY IF EXISTS "Users can update own tasks" ON accountix_tasks;
DROP POLICY IF EXISTS "Users can delete own tasks" ON accountix_tasks;

CREATE POLICY "Users can view own tasks" ON accountix_tasks FOR SELECT USING (auth.uid() = user_id);
CREATE POLICY "Users can insert own tasks" ON accountix_tasks FOR INSERT WITH CHECK (auth.uid() = user_id);
CREATE POLICY "Users can update own tasks" ON accountix_tasks FOR UPDATE USING (auth.uid() = user_id) WITH CHECK (auth.uid() = user_id);
CREATE POLICY "Users can delete own tasks" ON accountix_tasks FOR DELETE USING (auth.uid() = user_id);

-- ------------------------------------------------------------------------------
-- RLS Policies: accountix_content
-- ------------------------------------------------------------------------------
DROP POLICY IF EXISTS "Users can view own content" ON accountix_content;
DROP POLICY IF EXISTS "Users can insert own content" ON accountix_content;
DROP POLICY IF EXISTS "Users can update own content" ON accountix_content;
DROP POLICY IF EXISTS "Users can delete own content" ON accountix_content;

CREATE POLICY "Users can view own content" ON accountix_content FOR SELECT USING (auth.uid() = user_id);
CREATE POLICY "Users can insert own content" ON accountix_content FOR INSERT WITH CHECK (auth.uid() = user_id);
CREATE POLICY "Users can update own content" ON accountix_content FOR UPDATE USING (auth.uid() = user_id) WITH CHECK (auth.uid() = user_id);
CREATE POLICY "Users can delete own content" ON accountix_content FOR DELETE USING (auth.uid() = user_id);

-- ------------------------------------------------------------------------------
-- RLS Policies: accountix_leads
-- ------------------------------------------------------------------------------
DROP POLICY IF EXISTS "Users can view own leads" ON accountix_leads;
DROP POLICY IF EXISTS "Users can insert own leads" ON accountix_leads;
DROP POLICY IF EXISTS "Users can update own leads" ON accountix_leads;
DROP POLICY IF EXISTS "Users can delete own leads" ON accountix_leads;

CREATE POLICY "Users can view own leads" ON accountix_leads FOR SELECT USING (auth.uid() = user_id);
CREATE POLICY "Users can insert own leads" ON accountix_leads FOR INSERT WITH CHECK (auth.uid() = user_id);
CREATE POLICY "Users can update own leads" ON accountix_leads FOR UPDATE USING (auth.uid() = user_id) WITH CHECK (auth.uid() = user_id);
CREATE POLICY "Users can delete own leads" ON accountix_leads FOR DELETE USING (auth.uid() = user_id);

-- ------------------------------------------------------------------------------
-- RLS Policies: accountix_service_catalog
-- ------------------------------------------------------------------------------
DROP POLICY IF EXISTS "Users can view own catalog" ON accountix_service_catalog;
DROP POLICY IF EXISTS "Users can insert own catalog" ON accountix_service_catalog;
DROP POLICY IF EXISTS "Users can update own catalog" ON accountix_service_catalog;
DROP POLICY IF EXISTS "Users can delete own catalog" ON accountix_service_catalog;

CREATE POLICY "Users can view own catalog" ON accountix_service_catalog FOR SELECT USING (auth.uid() = user_id);
CREATE POLICY "Users can insert own catalog" ON accountix_service_catalog FOR INSERT WITH CHECK (auth.uid() = user_id);
CREATE POLICY "Users can update own catalog" ON accountix_service_catalog FOR UPDATE USING (auth.uid() = user_id) WITH CHECK (auth.uid() = user_id);
CREATE POLICY "Users can delete own catalog" ON accountix_service_catalog FOR DELETE USING (auth.uid() = user_id);

-- ==============================================================================
-- 4. High-Performance Foreign Key & User Indexes
-- ==============================================================================
CREATE INDEX IF NOT EXISTS idx_user_data_user_id ON user_data(user_id);
CREATE INDEX IF NOT EXISTS idx_user_profile_user_id ON accountix_user_profile(user_id);
CREATE INDEX IF NOT EXISTS idx_settings_user_id ON accountix_settings(user_id);
CREATE INDEX IF NOT EXISTS idx_clients_user_id ON accountix_clients(user_id);
CREATE INDEX IF NOT EXISTS idx_staff_user_id ON accountix_staff(user_id);
CREATE INDEX IF NOT EXISTS idx_packages_user_id ON accountix_packages(user_id);
CREATE INDEX IF NOT EXISTS idx_payments_user_id ON accountix_payments(user_id);
CREATE INDEX IF NOT EXISTS idx_expenses_user_id ON accountix_expenses(user_id);
CREATE INDEX IF NOT EXISTS idx_attendance_user_id ON accountix_attendance(user_id);
CREATE INDEX IF NOT EXISTS idx_salary_payments_user_id ON accountix_salary_payments(user_id);
CREATE INDEX IF NOT EXISTS idx_tasks_user_id ON accountix_tasks(user_id);
CREATE INDEX IF NOT EXISTS idx_content_user_id ON accountix_content(user_id);
CREATE INDEX IF NOT EXISTS idx_leads_user_id ON accountix_leads(user_id);
CREATE INDEX IF NOT EXISTS idx_service_catalog_user_id ON accountix_service_catalog(user_id);
