# SKILL.md — Claude Code 워크플로우

## /build
빌드 전 전체 검증:
```bash
pnpm type-check && pnpm lint && pnpm build
```

## /migrate
DB 스키마 변경 후:
```bash
pnpm db:migrate     # 새 마이그레이션 생성 및 적용 (개발)
pnpm db:generate    # Prisma 클라이언트 재생성 (필수)
```
`src/generated/prisma/` 는 `.gitignore`에 있으므로 배포 시 `pnpm db:generate`가 빌드 명령에 포함됨.

## /seed
초기 데이터 삽입 (카테고리 22개):
```bash
pnpm db:seed
```

## /deploy
Railway 배포:
1. `git push origin main` → Railway 자동 빌드
2. Railway Shell에서 마이그레이션: `pnpm db:migrate`
3. 필요 시 시드: `pnpm db:seed`
4. 헬스체크 확인: `curl https://<your-domain>/api/health`

## /add-component
shadcn/ui 컴포넌트 추가:
```bash
pnpm dlx shadcn@latest add <컴포넌트명>
# 예: pnpm dlx shadcn@latest add calendar accordion
```

## /add-api
새 API route 추가 패턴:
```
src/app/api/<resource>/route.ts          # GET (list), POST (create)
src/app/api/<resource>/[id]/route.ts     # GET, PATCH, DELETE
```
보안 체크리스트:
- `auth()` 인증 확인
- 플레이리스트 관련: `isPublic || userId === session.user.id` visibility 체크
- 소유권 확인: `resource.userId === session.user.id`

## /add-page
새 페이지 추가:
```
src/app/[locale]/<page>/
  page.tsx      # Server Component (setRequestLocale 필수)
  loading.tsx   # Suspense 스켈레톤
  error.tsx     # 에러 바운더리 ("use client")
```
`generateMetadata`로 SEO 메타데이터 추가 권장.

## /check-types
```bash
pnpm type-check 2>&1 | head -50
```

## /prisma-studio
```bash
pnpm db:studio
```

## /og-preview
OG 이미지 확인 (서버 실행 중):
```
http://localhost:3000/api/og?id=<playlistId>
```

## /health
서비스 헬스체크:
```bash
curl http://localhost:3000/api/health
```
