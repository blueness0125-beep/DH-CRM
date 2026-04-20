-- ============================================================
-- 003_car_insurance_contracts_table.sql
-- car_insurance_data 의 flat 계약 컬럼을 1:N 테이블로 분리
-- ============================================================

-- 1) 신규 테이블 생성
CREATE TABLE IF NOT EXISTS car_insurance_contracts (
  id               UUID        PRIMARY KEY DEFAULT gen_random_uuid(),
  car_insurance_id TEXT        NOT NULL REFERENCES car_insurance_data("등록번호") ON DELETE CASCADE,
  "계약일"          TEXT        NOT NULL,
  "보험사"          TEXT        NOT NULL,
  "채널"            TEXT        NOT NULL,
  "가입보험료"       INTEGER,
  "차량번호"         TEXT,
  "증권번호"         TEXT,
  "시작일"          TEXT,
  "만기일"          TEXT,
  "피보험자"         TEXT,
  "계약자"          TEXT,
  "설계자"          TEXT,
  created_at       TIMESTAMPTZ DEFAULT NOW()
);

-- 2) RLS 활성화
ALTER TABLE car_insurance_contracts ENABLE ROW LEVEL SECURITY;

CREATE POLICY "auth_users_only" ON car_insurance_contracts
  FOR ALL
  USING (auth.uid() IS NOT NULL)
  WITH CHECK (auth.uid() IS NOT NULL);

-- 3) 기존 flat 컬럼 데이터 이전
INSERT INTO car_insurance_contracts (
  car_insurance_id, "계약일", "보험사", "채널", "가입보험료",
  "차량번호", "증권번호", "시작일", "만기일", "피보험자", "계약자", "설계자"
)
SELECT
  "등록번호", "계약일", "보험사", "채널", "가입보험료",
  "차량번호", "증권번호", "시작일", "만기일", "피보험자", "계약자", "설계자"
FROM car_insurance_data
WHERE "계약일" IS NOT NULL;

-- 4) 구 flat 컬럼 제거
ALTER TABLE car_insurance_data
  DROP COLUMN IF EXISTS "계약일",
  DROP COLUMN IF EXISTS "보험사",
  DROP COLUMN IF EXISTS "채널",
  DROP COLUMN IF EXISTS "가입보험료",
  DROP COLUMN IF EXISTS "차량번호",
  DROP COLUMN IF EXISTS "증권번호",
  DROP COLUMN IF EXISTS "시작일",
  DROP COLUMN IF EXISTS "만기일",
  DROP COLUMN IF EXISTS "피보험자",
  DROP COLUMN IF EXISTS "계약자",
  DROP COLUMN IF EXISTS "설계자";
