-- ============================================================
-- 006_add_consultation_date.sql
-- 상담일지에 상담 날짜 컬럼 추가
-- ============================================================

ALTER TABLE consultation_logs
  ADD COLUMN IF NOT EXISTS consultation_date DATE DEFAULT CURRENT_DATE;
