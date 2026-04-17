-- ============================================================
-- 002_car_insurance_contract_columns.sql
-- car_insurance_data 테이블에 계약 체결 정보 컬럼 추가
-- ============================================================

ALTER TABLE car_insurance_data
  ADD COLUMN IF NOT EXISTS "계약일"     text,
  ADD COLUMN IF NOT EXISTS "보험사"     text,
  ADD COLUMN IF NOT EXISTS "채널"       text,
  ADD COLUMN IF NOT EXISTS "가입보험료"  integer,
  ADD COLUMN IF NOT EXISTS "차량번호"   text,
  ADD COLUMN IF NOT EXISTS "증권번호"   text,
  ADD COLUMN IF NOT EXISTS "시작일"     text,
  ADD COLUMN IF NOT EXISTS "만기일"     text,
  ADD COLUMN IF NOT EXISTS "피보험자"   text,
  ADD COLUMN IF NOT EXISTS "계약자"     text,
  ADD COLUMN IF NOT EXISTS "설계자"     text;
