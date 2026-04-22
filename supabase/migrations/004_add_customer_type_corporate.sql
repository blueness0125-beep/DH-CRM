-- ============================================================
-- 004_add_customer_type_corporate.sql
-- customers 테이블에 법인/개인 구분 및 사업자등록번호 컬럼 추가
-- ============================================================

ALTER TABLE customers
  ADD COLUMN IF NOT EXISTS customer_type text NOT NULL DEFAULT 'individual'
    CHECK (customer_type IN ('individual', 'corporate')),
  ADD COLUMN IF NOT EXISTS business_number text;

CREATE INDEX IF NOT EXISTS idx_customers_customer_type ON customers (customer_type);
CREATE INDEX IF NOT EXISTS idx_customers_business_number ON customers (business_number);
