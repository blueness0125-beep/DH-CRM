-- ============================================================
-- 005_consultation_logs.sql
-- 상담일지 테이블 + Supabase Storage RLS 정책
-- ============================================================

-- 상담일지 본문
CREATE TABLE consultation_logs (
  id          UUID        DEFAULT gen_random_uuid() PRIMARY KEY,
  customer_id UUID        NOT NULL REFERENCES customers(id) ON DELETE CASCADE,
  content     TEXT        NOT NULL,
  created_at  TIMESTAMPTZ DEFAULT NOW(),
  updated_at  TIMESTAMPTZ DEFAULT NOW()
);

-- 첨부파일 메타데이터
CREATE TABLE consultation_log_attachments (
  id                   UUID        DEFAULT gen_random_uuid() PRIMARY KEY,
  consultation_log_id  UUID        NOT NULL REFERENCES consultation_logs(id) ON DELETE CASCADE,
  file_name            TEXT        NOT NULL,
  file_path            TEXT        NOT NULL,
  file_type            TEXT,
  file_size            INTEGER,
  created_at           TIMESTAMPTZ DEFAULT NOW()
);

-- 인덱스
CREATE INDEX idx_consultation_logs_customer_id ON consultation_logs(customer_id);
CREATE INDEX idx_consultation_logs_created_at  ON consultation_logs(created_at DESC);
CREATE INDEX idx_consultation_log_attachments_log_id ON consultation_log_attachments(consultation_log_id);

-- RLS
ALTER TABLE consultation_logs            ENABLE ROW LEVEL SECURITY;
ALTER TABLE consultation_log_attachments ENABLE ROW LEVEL SECURITY;

CREATE POLICY "authenticated_all" ON consultation_logs
  FOR ALL TO authenticated USING (true) WITH CHECK (true);

CREATE POLICY "authenticated_all" ON consultation_log_attachments
  FOR ALL TO authenticated USING (true) WITH CHECK (true);

-- updated_at 트리거 (001_create_tables.sql의 update_updated_at_column 함수 사용)
CREATE TRIGGER set_consultation_logs_updated_at
  BEFORE UPDATE ON consultation_logs
  FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

-- ============================================================
-- Storage RLS (consultation-attachments 버킷)
-- 버킷은 대시보드에서 수동 생성 완료. 아래 정책만 실행.
-- ============================================================
CREATE POLICY "Authenticated can upload to consultation-attachments"
  ON storage.objects FOR INSERT TO authenticated
  WITH CHECK (bucket_id = 'consultation-attachments');

CREATE POLICY "Authenticated can read consultation-attachments"
  ON storage.objects FOR SELECT TO authenticated
  USING (bucket_id = 'consultation-attachments');

CREATE POLICY "Authenticated can delete from consultation-attachments"
  ON storage.objects FOR DELETE TO authenticated
  USING (bucket_id = 'consultation-attachments');
