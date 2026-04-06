-- ============================================================
-- 001_create_tables.sql
-- 보험 고객 관리 시스템 - 전체 테이블, 인덱스, RLS, 함수, 트리거
-- ============================================================

-- ============================================================
-- 1. TABLES
-- ============================================================

-- 가족 그룹
CREATE TABLE family_groups (
    id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
    name text,
    created_at timestamptz DEFAULT now()
);

-- 고객
CREATE TABLE customers (
    id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
    sequence_code text UNIQUE,
    name text NOT NULL,
    birth_date date,
    ssn_back text,
    gender text CHECK (gender IN ('M', 'F')),
    phone text,
    phone_2 text,
    email text,
    home_address text,
    home_address_detail text,
    home_zonecode text,
    work_address text,
    work_address_detail text,
    work_zonecode text,
    work_company_name text,
    job_category text,
    job_name text,
    job_risk_grade text,
    bank_name text,
    bank_account text,
    bank_holder text,
    memo text,
    family_group_id uuid REFERENCES family_groups(id) ON DELETE SET NULL,
    is_primary boolean DEFAULT false,
    created_at timestamptz DEFAULT now(),
    updated_at timestamptz DEFAULT now(),
    created_by uuid
);

-- 고객 관계
CREATE TABLE customer_relationships (
    id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
    customer_id uuid NOT NULL REFERENCES customers(id) ON DELETE CASCADE,
    related_customer_id uuid NOT NULL REFERENCES customers(id) ON DELETE CASCADE,
    relationship_type text NOT NULL,
    note text,
    created_at timestamptz DEFAULT now(),
    UNIQUE (customer_id, related_customer_id)
);

-- 자동차 보험
CREATE TABLE car_insurances (
    id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
    customer_id uuid NOT NULL REFERENCES customers(id) ON DELETE CASCADE,
    car_number text,
    insurance_company text,
    expiry_date date,
    premium integer,
    memo text,
    created_at timestamptz DEFAULT now(),
    updated_at timestamptz DEFAULT now()
);

-- 보험 상품
CREATE TABLE insurance_products (
    id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
    customer_id uuid NOT NULL REFERENCES customers(id) ON DELETE CASCADE,
    product_type text NOT NULL,
    company text,
    contract_date date,
    expiry_date date,
    premium integer,
    status text DEFAULT 'active' CHECK (status IN ('active', 'expired', 'cancelled')),
    memo text,
    created_at timestamptz DEFAULT now(),
    updated_at timestamptz DEFAULT now()
);

-- 상담 이력
CREATE TABLE contact_logs (
    id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
    customer_id uuid NOT NULL REFERENCES customers(id) ON DELETE CASCADE,
    contact_type text NOT NULL CHECK (contact_type IN ('전화', '방문', '문자', '카톡', '이메일', '기타')),
    content text NOT NULL,
    contacted_at timestamptz DEFAULT now(),
    created_by uuid,
    created_at timestamptz DEFAULT now()
);

-- 고객 메모
CREATE TABLE customer_memos (
    id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
    customer_id uuid NOT NULL REFERENCES customers(id) ON DELETE CASCADE,
    content text NOT NULL,
    is_pinned boolean DEFAULT false,
    created_by uuid,
    created_at timestamptz DEFAULT now(),
    updated_at timestamptz DEFAULT now()
);

-- ============================================================
-- 2. INDEXES
-- ============================================================

CREATE INDEX idx_customers_name ON customers (name);
CREATE INDEX idx_customers_phone ON customers (phone);
CREATE INDEX idx_customers_family_group_id ON customers (family_group_id);
CREATE INDEX idx_customers_birth_date ON customers (birth_date);

CREATE INDEX idx_car_insurances_customer_id ON car_insurances (customer_id);
CREATE INDEX idx_car_insurances_expiry_date ON car_insurances (expiry_date);

CREATE INDEX idx_insurance_products_customer_id ON insurance_products (customer_id);
CREATE INDEX idx_insurance_products_expiry_date ON insurance_products (expiry_date);

CREATE INDEX idx_contact_logs_customer_id ON contact_logs (customer_id);
CREATE INDEX idx_contact_logs_contacted_at ON contact_logs (contacted_at DESC);

CREATE INDEX idx_customer_memos_customer_id ON customer_memos (customer_id);

-- ============================================================
-- 3. ROW LEVEL SECURITY
-- ============================================================

ALTER TABLE family_groups ENABLE ROW LEVEL SECURITY;
ALTER TABLE customers ENABLE ROW LEVEL SECURITY;
ALTER TABLE customer_relationships ENABLE ROW LEVEL SECURITY;
ALTER TABLE car_insurances ENABLE ROW LEVEL SECURITY;
ALTER TABLE insurance_products ENABLE ROW LEVEL SECURITY;
ALTER TABLE contact_logs ENABLE ROW LEVEL SECURITY;
ALTER TABLE customer_memos ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Authenticated users full access" ON family_groups
    FOR ALL USING (auth.role() = 'authenticated');

CREATE POLICY "Authenticated users full access" ON customers
    FOR ALL USING (auth.role() = 'authenticated');

CREATE POLICY "Authenticated users full access" ON customer_relationships
    FOR ALL USING (auth.role() = 'authenticated');

CREATE POLICY "Authenticated users full access" ON car_insurances
    FOR ALL USING (auth.role() = 'authenticated');

CREATE POLICY "Authenticated users full access" ON insurance_products
    FOR ALL USING (auth.role() = 'authenticated');

CREATE POLICY "Authenticated users full access" ON contact_logs
    FOR ALL USING (auth.role() = 'authenticated');

CREATE POLICY "Authenticated users full access" ON customer_memos
    FOR ALL USING (auth.role() = 'authenticated');

-- ============================================================
-- 4. FUNCTIONS & TRIGGERS
-- ============================================================

CREATE OR REPLACE FUNCTION fn_update_timestamp()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = now();
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER trg_customers_updated_at
    BEFORE UPDATE ON customers
    FOR EACH ROW
    EXECUTE FUNCTION fn_update_timestamp();

CREATE TRIGGER trg_car_insurances_updated_at
    BEFORE UPDATE ON car_insurances
    FOR EACH ROW
    EXECUTE FUNCTION fn_update_timestamp();

CREATE TRIGGER trg_insurance_products_updated_at
    BEFORE UPDATE ON insurance_products
    FOR EACH ROW
    EXECUTE FUNCTION fn_update_timestamp();

CREATE TRIGGER trg_customer_memos_updated_at
    BEFORE UPDATE ON customer_memos
    FOR EACH ROW
    EXECUTE FUNCTION fn_update_timestamp();
