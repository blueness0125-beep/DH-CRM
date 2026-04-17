# Blue Moon Intelligence Implementation Rules

## Project Overview
- **Architecture:** Next.js (App Router) + Supabase (DB/Auth/Storage)
- **UI Stack:** shadcn/ui, Tailwind CSS, Lucide React
- **Deploy:** Vercel
- **3-Layer Pattern:** Route Handlers -> Services -> Repositories (Supabase queries)

## Design System
1. **Brand Color:** `#00008B` (dark blue)
2. **Font:** Pretendard (self-hosted)
3. **shadcn/ui First:** 새로운 UI 요소는 shadcn/ui 컴포넌트 우선 활용

## Coding Standards
- **Next.js:** App Router, 서버/클라이언트 컴포넌트 명확히 분리
- **3계층 구조:** `lib/services/`, `lib/repositories/` 분리
- **Validation:** Zod 스키마 사용

## Security
- `.env` 파일 외부로 API 키 유출 금지
- Supabase RLS 정책 필수 적용
- SSN 뒷자리 등 민감 정보 암호화 저장

## 작업 이력 관리 (CRITICAL)
- 세션 시작 시 반드시 `작업 이력.md`를 읽어 현재 개발 현황을 파악할 것
- 코드 파일(`.ts`, `.tsx`, `.js`, `.sql` 등)을 수정한 모든 작업 후 반드시 `작업 이력.md`를 업데이트할 것
- 커밋 시 코드 변경과 `작업 이력.md` 업데이트를 항상 함께 포함할 것
- 업데이트 내용: 작업 날짜, 변경 파일, 주요 변경 사항, 해결한 문제, 남은 이슈
