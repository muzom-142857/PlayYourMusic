# SKILL.md — Claude Code 워크플로우

## /build
프로덕션 빌드 실행 및 타입 체크:
```bash
pnpm type-check && pnpm lint && pnpm build
```

## /migrate
데이터베이스 마이그레이션:
```bash
pnpm db:migrate       # 새 마이그레이션 적용 (개발)
pnpm db:generate      # Prisma 클라이언트 재생성
```
schema 변경 후 반드시 `pnpm db:generate` 실행.

## /seed
초기 데이터 삽입:
```bash
pnpm db:seed          # 카테고리/무드 데이터 삽입
```

## /deploy
Railway 배포:
1. `git push origin main` → Railway 자동 감지
2. Railway Shell에서 마이그레이션: `pnpm db:migrate`
3. 필요 시 시드: `pnpm db:seed`

## /add-component
shadcn/ui 컴포넌트 추가:
```bash
pnpm dlx shadcn@latest add <컴포넌트명>
# 예: pnpm dlx shadcn@latest add calendar
```

## /add-api
새 API route 추가 패턴:
```
src/app/api/<resource>/route.ts      # GET, POST
src/app/api/<resource>/[id]/route.ts # GET, PATCH, DELETE
```
항상 `auth()` 로 인증 확인 후 처리.

## /add-page
새 페이지 추가:
```
src/app/[locale]/<page>/page.tsx
```
반드시 `setRequestLocale(locale)` 호출 + `generateStaticParams` for locales.

## /check-types
```bash
pnpm type-check 2>&1 | head -50
```

## /prisma-studio
```bash
pnpm db:studio
```
브라우저에서 DB 데이터 확인/수정.
