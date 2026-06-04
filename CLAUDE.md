# PlayYourMusic — Claude Code 가이드

## 프로젝트 개요

플레이리스트 중심 음악 공유 플랫폼. YouTube·Spotify·Apple Music·SoundCloud 등 여러 스트리밍 서비스의 트랙을 하나의 플레이리스트로 묶어 공유·발견할 수 있다.

- **타겟**: 진지한 음악 리스너, 플레이리스트 큐레이터
- **차별점**: 플랫폼 독립 + 소셜 (팔로우, 좋아요, 댓글) + Pinterest 스타일 UI

---

## 기술 스택

| 항목 | 기술 |
|------|------|
| Framework | Next.js 16 (App Router) |
| Language | TypeScript strict (`any` 금지) |
| Package manager | pnpm |
| Database | PostgreSQL (Railway) |
| ORM | Prisma v7 (`src/generated/prisma/client`) |
| Auth | Auth.js v5 (next-auth beta) |
| Storage | Cloudflare R2 (presigned URL 업로드) |
| UI | Tailwind CSS v4 + shadcn/ui (new-york) |
| Animation | Framer Motion |
| Client state | Zustand |
| Server state | TanStack Query v5 |
| i18n | next-intl v4 (ko/en, `[locale]` prefix) |
| PWA | @serwist/next (프로덕션만 적용) |
| Player | 멀티플랫폼 어댑터 패턴 |
| Color extraction | node-vibrant |

---

## 주요 규칙

- **`any` 타입 절대 금지** — ESLint `@typescript-eslint/no-explicit-any: error`
- **`console.log` 프로덕션 금지** — `console.warn/error`만 허용
- **패키지 설치**: `pnpm add` (npm, yarn 사용 금지)
- **Prisma v7 어댑터**: `new PrismaClient({ adapter: new PrismaPg({ connectionString }) })` — `new PrismaClient()` 불가
- **Prisma 클라이언트**: `@/generated/prisma/client` (index 없음, 직접 경로 사용)
- **shadcn 컴포넌트**: `pnpm dlx shadcn@latest add <컴포넌트>` — `src/components/ui/` 직접 수정 금지
- **API 응답**: `NextResponse.json()` 사용, 항상 타입 명시
- **서버/클라이언트 분리**: DB 접근은 Server Component 또는 API Route에서만
- **보안**: API route에서 플레이리스트 visibility 체크 필수 (`isPublic || userId === session.user.id`)

---

## 디렉토리 구조 (핵심)

```
src/
  app/
    [locale]/          # 모든 페이지는 locale 아래 (page.tsx, loading.tsx, error.tsx)
    api/               # API routes (playlists, tracks, users, search, og, health, upload)
    layout.tsx         # Root HTML (font, viewport)
  components/
    ui/                # shadcn/ui — 수정 금지
    player/            # GlobalPlayer + 플랫폼 어댑터 (YouTube, Spotify, SoundCloud, Apple, External)
    playlist/          # MasonryGrid, PlaylistCard, TrackList, AddTrackModal, PlaylistForm 등
    layout/            # Header, Sidebar, BottomNav
    common/            # Providers, ColorThemeProvider, PageTransition, Skeleton, AnimatedList 등
  lib/
    db.ts              # Prisma 싱글톤
    auth.ts            # Auth.js 설정
    r2.ts              # Cloudflare R2
    platform-detector.ts
    metadata-fetcher.ts
    recommendations.ts
  store/               # playerStore, themeStore (Zustand)
  hooks/               # usePlayer, useColorExtraction, useInfiniteScroll, useFollowUser
  types/               # 공유 DTO 타입 (index.ts)
  i18n/                # next-intl routing + request config
  messages/            # ko.json, en.json
prisma/
  schema.prisma        # DB 스키마
  seed.ts              # 카테고리 시드 데이터
prisma.config.ts       # Prisma v7 설정 (dotenv)
railway.toml           # Railway 배포 설정
```

---

## 개발 명령어

```bash
pnpm dev              # 개발 서버 (localhost:3000)
pnpm build            # 프로덕션 빌드
pnpm type-check       # TypeScript 검사
pnpm lint             # ESLint
pnpm format           # Prettier

pnpm db:generate      # Prisma 클라이언트 재생성 (schema 변경 후 필수)
pnpm db:migrate       # 마이그레이션 적용
pnpm db:push          # 스키마 push (프로토타이핑)
pnpm db:seed          # 카테고리/무드 시드 데이터
pnpm db:studio        # Prisma Studio GUI
```

---

## 환경 변수

`.env.local.example` 참조. 로컬 개발 시 `.env.local` 생성.  
Railway 배포 시 Railway 환경 변수 패널에서 설정.

클라이언트에서 접근하는 변수는 `NEXT_PUBLIC_` 접두어 필수:
- `NEXT_PUBLIC_R2_PUBLIC_URL` — 이미지 업로드 후 공개 URL 구성용

---

## 플레이어 아키텍처

`src/store/playerStore.ts` — Zustand로 전역 플레이어 상태 관리.  
`src/components/player/adapters/` — 플랫폼별 어댑터 (YouTube, Spotify, SoundCloud, AppleMusic, External).  
플랫폼 감지: `src/lib/platform-detector.ts` → `detectPlatform(url)`.

GlobalPlayer는 `src/app/[locale]/layout.tsx`에 배치 → 페이지 이동 시에도 재생 유지.

---

## DB 스키마 변경 시

1. `prisma/schema.prisma` 수정
2. `pnpm db:migrate` (dev 환경)
3. `pnpm db:generate` (Prisma 클라이언트 재생성)
4. 관련 타입을 `src/types/index.ts`에서 확인

---

## 배포 (Railway)

### 최초 배포
1. Railway 프로젝트에 **PostgreSQL 서비스** 추가
2. 환경 변수 설정 (`.env.local.example` 참조) — `DATABASE_URL`은 Railway가 자동 주입
3. `git push origin main` → Railway 자동 빌드 (`railway.toml` 참조)
4. Railway Shell에서:
   ```bash
   pnpm db:migrate   # 마이그레이션 적용
   pnpm db:seed      # 카테고리/무드 초기 데이터
   ```

### 헬스체크
`GET /api/health` — DB 연결 확인, Railway healthcheck 엔드포인트로 설정됨

### PWA 아이콘
배포 전 `public/icons/icon-192.png`, `icon-512.png` 추가 필요 (→ `public/icons/README.md` 참조)

### OG 이미지
`GET /api/og?id=<playlistId>` — 동적 소셜 공유 카드 생성 (1200×630)
