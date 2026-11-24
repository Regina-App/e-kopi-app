-- ==============================================================================
-- 001_initial_schema.sql
-- E-Kopi Schema: Master Tables, Core Entities, Requests, Ledgers, Security, Triggers & Seeds
-- ==============================================================================

-- Enable UUID extension if not already enabled
CREATE EXTENSION IF NOT EXISTS "pgcrypto";

-- -----------------------------------------------------------------------------
-- 1. COMPANIES
-- -----------------------------------------------------------------------------
CREATE TABLE IF NOT EXISTS companies (
    id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
    name varchar NOT NULL,
    is_active boolean DEFAULT true,
    created_at timestamptz DEFAULT now()
);

-- -----------------------------------------------------------------------------
-- 2. SITES
-- -----------------------------------------------------------------------------
CREATE TABLE IF NOT EXISTS sites (
    id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
    name varchar NOT NULL,
    company_id uuid REFERENCES companies(id) ON DELETE SET NULL,
    is_active boolean DEFAULT true,
    created_at timestamptz DEFAULT now()
);

-- -----------------------------------------------------------------------------
-- 3. DEPARTMENTS
-- -----------------------------------------------------------------------------
CREATE TABLE IF NOT EXISTS departments (
    id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
    name varchar NOT NULL,
    is_active boolean DEFAULT true,
    created_at timestamptz DEFAULT now()
);

-- -----------------------------------------------------------------------------
-- 4. POSITIONS
-- -----------------------------------------------------------------------------
CREATE TABLE IF NOT EXISTS positions (
    id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
    name varchar NOT NULL,
    is_active boolean DEFAULT true,
    created_at timestamptz DEFAULT now()
);

-- -----------------------------------------------------------------------------
-- 5. CREWS
-- -----------------------------------------------------------------------------
CREATE TABLE IF NOT EXISTS crews (
    id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
    name varchar NOT NULL,
    is_active boolean DEFAULT true,
    created_at timestamptz DEFAULT now()
);

-- -----------------------------------------------------------------------------
-- 6. ADMINS
-- -----------------------------------------------------------------------------
CREATE TABLE IF NOT EXISTS admins (
    id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
    name varchar NOT NULL,
    email varchar UNIQUE NOT NULL,
    pin_hash varchar NOT NULL,
    role varchar NOT NULL CHECK (role IN ('super_admin', 'admin')),
    is_active boolean DEFAULT true,
    force_pin_change boolean DEFAULT true,
    created_at timestamptz DEFAULT now(),
    updated_at timestamptz DEFAULT now()
);

-- -----------------------------------------------------------------------------
-- 7. EMPLOYEES
-- -----------------------------------------------------------------------------
CREATE TABLE IF NOT EXISTS employees (
    id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
    nik varchar(16) UNIQUE NOT NULL,
    full_name varchar NOT NULL,
    birth_place varchar,
    birth_date date,
    address text,
    email varchar,
    phone varchar,
    company_id uuid REFERENCES companies(id) ON DELETE SET NULL,
    site_id uuid REFERENCES sites(id) ON DELETE SET NULL,
    department_id uuid REFERENCES departments(id) ON DELETE SET NULL,
    position_id uuid REFERENCES positions(id) ON DELETE SET NULL,
    is_crew_member boolean DEFAULT false,
    crew_id uuid REFERENCES crews(id) ON DELETE SET NULL,
    start_date date NOT NULL,
    bank_name varchar DEFAULT 'Mandiri',
    account_number varchar,
    account_holder varchar,
    status varchar NOT NULL CHECK (status IN ('pending', 'approved', 'rejected')) DEFAULT 'pending',
    approved_by uuid REFERENCES admins(id) ON DELETE SET NULL,
    approved_at timestamptz,
    rejection_reason text,
    is_active boolean DEFAULT false,
    is_deleted boolean DEFAULT false,
    created_at timestamptz DEFAULT now(),
    updated_at timestamptz DEFAULT now()
);

-- -----------------------------------------------------------------------------
-- 8. ADMIN PERMISSIONS
-- -----------------------------------------------------------------------------
CREATE TABLE IF NOT EXISTS admin_permissions (
    id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
    admin_id uuid NOT NULL REFERENCES admins(id) ON DELETE CASCADE,
    permission_key varchar NOT NULL,
    granted boolean DEFAULT false,
    CONSTRAINT uq_admin_permission UNIQUE (admin_id, permission_key)
);

-- -----------------------------------------------------------------------------
-- 9. SESSIONS
-- -----------------------------------------------------------------------------
CREATE TABLE IF NOT EXISTS sessions (
    id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
    employee_id uuid NOT NULL REFERENCES employees(id) ON DELETE CASCADE,
    refresh_token_hash varchar NOT NULL,
    expires_at timestamptz NOT NULL,
    is_revoked boolean DEFAULT false,
    device_info text,
    created_at timestamptz DEFAULT now()
);

-- -----------------------------------------------------------------------------
-- 10. OTP CODES
-- -----------------------------------------------------------------------------
CREATE TABLE IF NOT EXISTS otp_codes (
    id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
    employee_id uuid NOT NULL REFERENCES employees(id) ON DELETE CASCADE,
    code_hash varchar NOT NULL,
    channel varchar NOT NULL CHECK (channel IN ('email', 'sms')),
    target varchar NOT NULL,
    attempts int DEFAULT 0,
    expires_at timestamptz NOT NULL,
    is_used boolean DEFAULT false,
    created_at timestamptz DEFAULT now()
);

-- -----------------------------------------------------------------------------
-- 11. LEAVE REQUESTS
-- -----------------------------------------------------------------------------
CREATE TABLE IF NOT EXISTS leave_requests (
    id varchar PRIMARY KEY,
    employee_id uuid NOT NULL REFERENCES employees(id) ON DELETE RESTRICT,
    selected_dates jsonb NOT NULL,
    total_days int NOT NULL,
    reason text NOT NULL,
    emergency_contact varchar NOT NULL,
    status varchar NOT NULL CHECK (status IN ('pending', 'approved', 'rejected', 'cancelled')) DEFAULT 'pending',
    processed_by uuid REFERENCES admins(id) ON DELETE SET NULL,
    processed_at timestamptz,
    admin_notes text,
    approval_source varchar CHECK (approval_source IN ('panel', 'email')),
    verification_code varchar UNIQUE,
    year int NOT NULL,
    created_at timestamptz DEFAULT now()
);

-- -----------------------------------------------------------------------------
-- 12. LEAVE BALANCE LEDGER
-- -----------------------------------------------------------------------------
CREATE TABLE IF NOT EXISTS leave_balance_ledger (
    id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
    employee_id uuid NOT NULL REFERENCES employees(id) ON DELETE RESTRICT,
    year int NOT NULL,
    type varchar NOT NULL CHECK (type IN ('allocation', 'usage', 'reservation', 'release', 'accumulation')),
    amount int NOT NULL,
    reference_type varchar,
    reference_id varchar,
    description text,
    created_by uuid,
    created_at timestamptz DEFAULT now()
);

-- -----------------------------------------------------------------------------
-- 13. LOAN REQUESTS
-- -----------------------------------------------------------------------------
CREATE TABLE IF NOT EXISTS loan_requests (
    id varchar PRIMARY KEY,
    employee_id uuid NOT NULL REFERENCES employees(id) ON DELETE RESTRICT,
    loan_amount bigint NOT NULL,
    tenor int NOT NULL,
    interest_per_month bigint NOT NULL,
    principal_per_month bigint NOT NULL,
    installment_per_month bigint NOT NULL,
    total_obligation bigint NOT NULL,
    status varchar NOT NULL CHECK (status IN ('pending', 'approved', 'rejected', 'cancelled', 'completed')) DEFAULT 'pending',
    is_takeover boolean DEFAULT false,
    previous_loan_id varchar REFERENCES loan_requests(id) ON DELETE SET NULL,
    previous_remaining bigint,
    net_disbursement bigint,
    processed_by uuid REFERENCES admins(id) ON DELETE SET NULL,
    processed_at timestamptz,
    admin_notes text,
    approval_source varchar CHECK (approval_source IN ('panel', 'email')),
    first_time_borrower boolean DEFAULT true,
    created_at timestamptz DEFAULT now()
);

-- -----------------------------------------------------------------------------
-- 14. LOAN INSTALLMENTS
-- -----------------------------------------------------------------------------
CREATE TABLE IF NOT EXISTS loan_installments (
    id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
    loan_id varchar NOT NULL REFERENCES loan_requests(id) ON DELETE CASCADE,
    installment_number int NOT NULL,
    due_date date NOT NULL,
    principal_amount bigint NOT NULL,
    interest_amount bigint NOT NULL,
    total_amount bigint NOT NULL,
    status varchar NOT NULL CHECK (status IN ('scheduled', 'confirmed', 'skipped')) DEFAULT 'scheduled',
    confirmed_at date,
    confirmed_by uuid REFERENCES admins(id) ON DELETE SET NULL,
    created_at timestamptz DEFAULT now()
);

-- -----------------------------------------------------------------------------
-- 15. LOAN TAKEOVERS
-- -----------------------------------------------------------------------------
CREATE TABLE IF NOT EXISTS loan_takeovers (
    id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
    old_loan_id varchar NOT NULL REFERENCES loan_requests(id) ON DELETE RESTRICT,
    new_loan_id varchar NOT NULL REFERENCES loan_requests(id) ON DELETE RESTRICT,
    remaining_obligation bigint NOT NULL,
    settlement_amount bigint NOT NULL,
    created_at timestamptz DEFAULT now()
);

-- -----------------------------------------------------------------------------
-- 16. LEAVE LETTERS
-- -----------------------------------------------------------------------------
CREATE TABLE IF NOT EXISTS leave_letters (
    id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
    leave_request_id varchar NOT NULL UNIQUE REFERENCES leave_requests(id) ON DELETE CASCADE,
    file_path varchar,
    snapshot_data jsonb,
    generated_at timestamptz DEFAULT now()
);

-- -----------------------------------------------------------------------------
-- 17. EMAIL APPROVAL TOKENS
-- -----------------------------------------------------------------------------
CREATE TABLE IF NOT EXISTS email_approval_tokens (
    id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
    request_type varchar NOT NULL CHECK (request_type IN ('leave', 'loan')),
    request_id varchar NOT NULL,
    token varchar UNIQUE NOT NULL,
    action varchar NOT NULL CHECK (action IN ('approve', 'reject')),
    is_used boolean DEFAULT false,
    expires_at timestamptz NOT NULL,
    used_at timestamptz,
    used_by uuid,
    created_at timestamptz DEFAULT now()
);

-- -----------------------------------------------------------------------------
-- 18. AUDIT LOGS
-- -----------------------------------------------------------------------------
CREATE TABLE IF NOT EXISTS audit_logs (
    id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
    actor_type varchar NOT NULL CHECK (actor_type IN ('employee', 'admin', 'system')),
    actor_id uuid,
    action varchar NOT NULL,
    target_type varchar,
    target_id varchar,
    old_values jsonb,
    new_values jsonb,
    ip_address varchar,
    user_agent text,
    created_at timestamptz DEFAULT now()
);

-- -----------------------------------------------------------------------------
-- 19. APP SETTINGS
-- -----------------------------------------------------------------------------
CREATE TABLE IF NOT EXISTS app_settings (
    key varchar PRIMARY KEY,
    value jsonb NOT NULL,
    updated_at timestamptz DEFAULT now(),
    updated_by uuid
);

-- ==============================================================================
-- FUNCTIONS AND TRIGGERS
-- ==============================================================================

-- 1. Generate Leave ID: 'CT-YYYYMMDD-XXXX'
CREATE OR REPLACE FUNCTION generate_leave_id()
RETURNS text AS $$
BEGIN
    RETURN 'CT-' || TO_CHAR(now(), 'YYYYMMDD') || '-' || upper(substr(md5(random()::text), 1, 4));
END;
$$ LANGUAGE plpgsql;

-- 2. Generate Loan ID: 'KOP-YYYYMMDD-XXXX'
CREATE OR REPLACE FUNCTION generate_loan_id()
RETURNS text AS $$
BEGIN
    RETURN 'KOP-' || TO_CHAR(now(), 'YYYYMMDD') || '-' || upper(substr(md5(random()::text), 1, 4));
END;
$$ LANGUAGE plpgsql;

-- 3. Generate Verification Code: 8 uppercase hex characters
CREATE OR REPLACE FUNCTION generate_verification_code()
RETURNS text AS $$
BEGIN
    RETURN upper(substr(md5(random()::text), 1, 8));
END;
$$ LANGUAGE plpgsql;

-- 4. Trigger before insert on leave_requests to auto-set id and verification_code
CREATE OR REPLACE FUNCTION set_leave_request_defaults()
RETURNS trigger AS $$
BEGIN
    IF NEW.id IS NULL OR NEW.id = '' THEN
        NEW.id := generate_leave_id();
    END IF;
    IF NEW.verification_code IS NULL OR NEW.verification_code = '' THEN
        NEW.verification_code := generate_verification_code();
    END IF;
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

DROP TRIGGER IF EXISTS trg_leave_requests_before_insert ON leave_requests;
CREATE TRIGGER trg_leave_requests_before_insert
BEFORE INSERT ON leave_requests
FOR EACH ROW
EXECUTE FUNCTION set_leave_request_defaults();

-- 5. Trigger before insert on loan_requests to auto-set id
CREATE OR REPLACE FUNCTION set_loan_request_defaults()
RETURNS trigger AS $$
BEGIN
    IF NEW.id IS NULL OR NEW.id = '' THEN
        NEW.id := generate_loan_id();
    END IF;
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

DROP TRIGGER IF EXISTS trg_loan_requests_before_insert ON loan_requests;
CREATE TRIGGER trg_loan_requests_before_insert
BEFORE INSERT ON loan_requests
FOR EACH ROW
EXECUTE FUNCTION set_loan_request_defaults();

-- 6. Trigger to auto-update updated_at timestamp
CREATE OR REPLACE FUNCTION set_updated_at()
RETURNS trigger AS $$
BEGIN
    NEW.updated_at = now();
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

DROP TRIGGER IF EXISTS trg_employees_updated_at ON employees;
CREATE TRIGGER trg_employees_updated_at
BEFORE UPDATE ON employees
FOR EACH ROW
EXECUTE FUNCTION set_updated_at();

DROP TRIGGER IF EXISTS trg_admins_updated_at ON admins;
CREATE TRIGGER trg_admins_updated_at
BEFORE UPDATE ON admins
FOR EACH ROW
EXECUTE FUNCTION set_updated_at();

DROP TRIGGER IF EXISTS trg_app_settings_updated_at ON app_settings;
CREATE TRIGGER trg_app_settings_updated_at
BEFORE UPDATE ON app_settings
FOR EACH ROW
EXECUTE FUNCTION set_updated_at();

-- ==============================================================================
-- INDEXES
-- ==============================================================================

CREATE INDEX IF NOT EXISTS idx_employees_nik ON employees (nik);
CREATE INDEX IF NOT EXISTS idx_employees_email ON employees (email);
CREATE INDEX IF NOT EXISTS idx_employees_status ON employees (status);
CREATE INDEX IF NOT EXISTS idx_employees_company_id ON employees (company_id);
CREATE INDEX IF NOT EXISTS idx_employees_is_deleted ON employees (is_deleted);

CREATE INDEX IF NOT EXISTS idx_leave_requests_employee_id ON leave_requests (employee_id);
CREATE INDEX IF NOT EXISTS idx_leave_requests_status ON leave_requests (status);
CREATE INDEX IF NOT EXISTS idx_leave_requests_year ON leave_requests (year);

CREATE INDEX IF NOT EXISTS idx_loan_requests_employee_id ON loan_requests (employee_id);
CREATE INDEX IF NOT EXISTS idx_loan_requests_status ON loan_requests (status);

CREATE INDEX IF NOT EXISTS idx_audit_logs_actor_id ON audit_logs (actor_id);
CREATE INDEX IF NOT EXISTS idx_audit_logs_created_at ON audit_logs (created_at);

CREATE INDEX IF NOT EXISTS idx_sessions_employee_id ON sessions (employee_id);
CREATE INDEX IF NOT EXISTS idx_sessions_expires_at ON sessions (expires_at);

CREATE INDEX IF NOT EXISTS idx_otp_codes_employee_id ON otp_codes (employee_id);

CREATE INDEX IF NOT EXISTS idx_leave_balance_ledger_employee_year ON leave_balance_ledger (employee_id, year);

-- ==============================================================================
-- ROW LEVEL SECURITY (RLS)
-- ==============================================================================

ALTER TABLE employees ENABLE ROW LEVEL SECURITY;
ALTER TABLE leave_requests ENABLE ROW LEVEL SECURITY;
ALTER TABLE loan_requests ENABLE ROW LEVEL SECURITY;
ALTER TABLE leave_balance_ledger ENABLE ROW LEVEL SECURITY;
ALTER TABLE loan_installments ENABLE ROW LEVEL SECURITY;
ALTER TABLE sessions ENABLE ROW LEVEL SECURITY;
ALTER TABLE otp_codes ENABLE ROW LEVEL SECURITY;

-- Policy on employees: authenticated users can SELECT their own row
DROP POLICY IF EXISTS "Allow authenticated employees to select own row" ON employees;
CREATE POLICY "Allow authenticated employees to select own row"
ON employees
FOR SELECT
TO authenticated
USING (id = auth.uid());

-- ==============================================================================
-- SEED DATA
-- ==============================================================================

-- 1. Super Admin Seed
INSERT INTO admins (
    email,
    name,
    role,
    force_pin_change,
    pin_hash,
    is_active
) VALUES (
    'mohammadrizal6666@gmail.com',
    'Super Admin',
    'super_admin',
    true,
    'e3e83be127cf5c7c59f6e45e9333d2b0c3ef8ee14e16016e52579c2ff764067b',
    true
)
ON CONFLICT (email) DO UPDATE SET
    name = EXCLUDED.name,
    role = EXCLUDED.role,
    force_pin_change = EXCLUDED.force_pin_change,
    pin_hash = EXCLUDED.pin_hash,
    is_active = EXCLUDED.is_active;

-- 2. Super Admin Permissions (14 permissions)
DO $$
DECLARE
    v_admin_id uuid;
BEGIN
    SELECT id INTO v_admin_id FROM admins WHERE email = 'mohammadrizal6666@gmail.com';
    IF v_admin_id IS NOT NULL THEN
        INSERT INTO admin_permissions (admin_id, permission_key, granted)
        VALUES
            (v_admin_id, 'dashboard', true),
            (v_admin_id, 'pengajuan_cuti', true),
            (v_admin_id, 'pengajuan_koperasi', true),
            (v_admin_id, 'riwayat', true),
            (v_admin_id, 'database_karyawan', true),
            (v_admin_id, 'kuota_cuti', true),
            (v_admin_id, 'import_export', true),
            (v_admin_id, 'laporan', true),
            (v_admin_id, 'pengaturan_koperasi', true),
            (v_admin_id, 'master_perusahaan', true),
            (v_admin_id, 'pengaturan_surat', true),
            (v_admin_id, 'email', true),
            (v_admin_id, 'audit_log', true),
            (v_admin_id, 'manajemen_admin', true)
        ON CONFLICT (admin_id, permission_key) DO UPDATE SET
            granted = EXCLUDED.granted;
    END IF;
END $$;

-- 3. Default App Settings
INSERT INTO app_settings (key, value)
VALUES
    ('leave_quota', '12'::jsonb),
    ('min_work_months', '12'::jsonb),
    ('interest_rate', '0.025'::jsonb),
    ('max_tenor', '4'::jsonb),
    ('max_loan', '10000000'::jsonb),
    ('loan_period_start', '8'::jsonb),
    ('loan_period_end', '28'::jsonb),
    ('loan_deduction_day', '5'::jsonb)
ON CONFLICT (key) DO UPDATE SET
    value = EXCLUDED.value,
    updated_at = now();
