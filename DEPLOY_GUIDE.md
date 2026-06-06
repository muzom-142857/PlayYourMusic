# PlayYourMusic 배포 설명서

> 이 설명서는 Railway에서 서비스를 실행하는 방법을 안내합니다.  
> 모르시는 부분이 있으면 언제든지 물어봐 주세요 😊

---

## 준비물 (미리 받아두어야 할 정보)

아래 값들을 메모장에 미리 복사해 두세요.  
각각 어떻게 구하는지는 아래 단계별 안내에 나와 있습니다.

```
AUTH_URL             = https://playyourmusic.up.railway.app
AUTH_SECRET          = xCkAOvo0xms/LsfyiW2hnwHiRKPcyI0bjNJa3Kz9N1c=
AUTH_TRUST_HOST      = true
GOOGLE_CLIENT_ID     = 
GOOGLE_CLIENT_SECRET = 
GITHUB_CLIENT_ID     = 
GITHUB_CLIENT_SECRET = 
CLOUDFLARE_R2_ACCOUNT_ID        = 
CLOUDFLARE_R2_ACCESS_KEY_ID     = 
CLOUDFLARE_R2_SECRET_ACCESS_KEY = 
CLOUDFLARE_R2_PUBLIC_URL        = 
NEXT_PUBLIC_R2_PUBLIC_URL       = (위와 동일한 값)
```

---

## 1단계 — Google 로그인 설정 (약 10분)

### 1-1. Google Cloud 접속

1. **https://console.cloud.google.com** 접속
2. Google 계정으로 로그인

### 1-2. 새 프로젝트 만들기

1. 화면 왼쪽 위 **"Google Cloud"** 옆 프로젝트 이름 클릭
2. 팝업에서 **"새 프로젝트"** 클릭
3. 프로젝트 이름: `PlayYourMusic` → **만들기**
4. 방금 만든 프로젝트가 선택되어 있는지 확인

### 1-3. OAuth 동의 화면 설정

1. 왼쪽 메뉴 **"API 및 서비스"** → **"OAuth 동의 화면"**
2. User Type: **"외부"** 선택 → **"만들기"**
3. 앱 이름: `PlayYourMusic`
4. 사용자 지원 이메일: 본인 이메일 선택
5. 개발자 연락처 이메일: 본인 이메일 입력
6. **"저장 후 계속"** 3번 클릭 (스코프, 테스트 사용자 단계는 기본값으로 통과)
7. 마지막 화면 **"대시보드로 돌아가기"** 클릭

### 1-4. OAuth 클라이언트 ID 만들기

1. 왼쪽 메뉴 **"사용자 인증 정보"** 클릭
2. 상단 **"+ 사용자 인증 정보 만들기"** → **"OAuth 클라이언트 ID"**
3. 애플리케이션 유형: **"웹 애플리케이션"** 선택
4. 이름: `PlayYourMusic Web`
5. **"승인된 리디렉션 URI"** 섹션 → **"URI 추가"** 클릭 후 아래 두 줄 각각 추가:
   ```
   https://playyourmusic.up.railway.app/api/auth/callback/google
   http://localhost:3000/api/auth/callback/google
   ```
6. **"만들기"** 클릭
7. 팝업에서 **클라이언트 ID**와 **클라이언트 보안 비밀번호** 복사 → 메모장에 저장

### 1-5. 앱 게시 (외부 사용자 로그인 허용)

1. 왼쪽 메뉴 **"OAuth 동의 화면"** 클릭
2. **"앱 게시"** 버튼 클릭 → **"확인"**

---

## 2단계 — GitHub 로그인 설정 (약 3분)

1. **https://github.com/settings/developers** 접속 (GitHub 로그인 필요)
2. **"OAuth Apps"** → **"New OAuth App"** 클릭
3. 아래처럼 입력:

   | 항목 | 입력값 |
   |------|--------|
   | Application name | PlayYourMusic |
   | Homepage URL | `https://playyourmusic.up.railway.app` |
   | Authorization callback URL | `https://playyourmusic.up.railway.app/api/auth/callback/github` |

4. **"Register application"** 클릭
5. **Client ID** 복사 → 메모장에 저장
6. **"Generate a new client secret"** 클릭 → 나타나는 값 복사 → 메모장에 저장  
   ⚠️ 이 값은 한 번만 보여주므로 반드시 바로 저장하세요

---

## 3단계 — Cloudflare R2 이미지 저장소 설정 (약 15분)

### 3-1. Cloudflare 계정 가입

1. **https://cloudflare.com** → **"Sign Up"** (무료 계정)
2. 이메일 인증 완료

### 3-2. R2 버킷 만들기

1. 로그인 후 왼쪽 메뉴 **"R2 Object Storage"** 클릭
2. **"Get started with R2"** → 결제 수단 등록 (월 10GB까지 무료, 초과 시에만 과금)
3. **"Create bucket"** 클릭
4. 버킷 이름: `playyourmusic` → **"Create bucket"**

### 3-3. 공개 URL 설정

1. 방금 만든 `playyourmusic` 버킷 클릭
2. **"Settings"** 탭 클릭
3. **"Public Access"** 섹션 → **"Allow Access"** 클릭 → **"Allow"** 확인
4. **"R2.dev subdomain"** 항목에 나타나는 주소 복사  
   예: `https://pub-abc123def456.r2.dev`  
   → 이 값이 `CLOUDFLARE_R2_PUBLIC_URL`과 `NEXT_PUBLIC_R2_PUBLIC_URL` 양쪽에 쓰입니다

### 3-4. CORS 설정 (업로드 허용)

1. **"Settings"** 탭 → **"CORS Policy"** 섹션 → **"Add CORS policy"**
2. 아래 내용을 그대로 붙여넣기:

```json
[
  {
    "AllowedOrigins": [
      "https://playyourmusic.up.railway.app",
      "http://localhost:3000"
    ],
    "AllowedMethods": ["GET", "PUT"],
    "AllowedHeaders": ["*"],
    "MaxAgeSeconds": 3600
  }
]
```

3. **"Save"** 클릭

### 3-5. API 토큰 발급

1. R2 메인 페이지로 이동 (왼쪽 메뉴 **"R2 Object Storage"**)
2. 오른쪽 위 **"Manage R2 API tokens"** 클릭
3. **"Create API token"** 클릭
4. 토큰 이름: `PlayYourMusic`
5. 권한: **"Object Read & Write"** 선택
6. **"Create API Token"** 클릭
7. 다음 세 가지 값 복사 → 메모장에 저장:
   - **Access Key ID** → `CLOUDFLARE_R2_ACCESS_KEY_ID`
   - **Secret Access Key** → `CLOUDFLARE_R2_SECRET_ACCESS_KEY`  
     ⚠️ 이 값도 한 번만 보여줍니다. 반드시 저장!

### 3-6. Account ID 확인

1. R2 메인 페이지 오른쪽 **"Account ID"** 복사 → `CLOUDFLARE_R2_ACCOUNT_ID`에 저장

---

## 4단계 — Railway 배포 (약 10분)

### 4-1. 프로젝트 생성

1. **https://railway.app** 접속 → 아버지 계정으로 로그인
2. **"New Project"** 클릭
3. **"Deploy from GitHub repo"** 선택
4. GitHub 연동 팝업 → **"Only select repositories"** → `PlayYourMusic` 선택 → **"Install & Authorize"**
5. `muzom-142857/PlayYourMusic` 선택 → **"Deploy Now"**

### 4-2. PostgreSQL 데이터베이스 추가

1. 프로젝트 화면 상단 **"+ New"** 클릭
2. **"Database"** → **"Add PostgreSQL"** 선택
3. 잠시 기다리면 데이터베이스가 생성됩니다

### 4-3. 환경 변수 입력

1. 화면에서 **"playyourmusic"** (Next.js 서비스) 클릭
2. 상단 탭 **"Variables"** 클릭
3. 오른쪽 **"RAW Editor"** 클릭
4. 아래 내용을 복사해서 붙여넣은 뒤, 각 `여기에_입력` 부분을 메모장에 저장해둔 값으로 교체:

```
AUTH_URL=https://playyourmusic.up.railway.app
AUTH_SECRET=xCkAOvo0xms/LsfyiW2hnwHiRKPcyI0bjNJa3Kz9N1c=
AUTH_TRUST_HOST=true

GOOGLE_CLIENT_ID=여기에_입력
GOOGLE_CLIENT_SECRET=여기에_입력

GITHUB_CLIENT_ID=여기에_입력
GITHUB_CLIENT_SECRET=여기에_입력

CLOUDFLARE_R2_ACCOUNT_ID=여기에_입력
CLOUDFLARE_R2_ACCESS_KEY_ID=여기에_입력
CLOUDFLARE_R2_SECRET_ACCESS_KEY=여기에_입력
CLOUDFLARE_R2_BUCKET_NAME=playyourmusic
CLOUDFLARE_R2_PUBLIC_URL=여기에_입력
NEXT_PUBLIC_R2_PUBLIC_URL=여기에_입력
```

5. **"Update Variables"** 클릭 → 자동으로 재배포 시작

> `DATABASE_URL`은 Railway가 자동으로 채워줍니다. 직접 입력하지 않아도 됩니다.

### 4-4. 도메인 확인

1. **"Settings"** 탭 → **"Networking"** 섹션
2. 도메인이 `playyourmusic.up.railway.app`이 아닐 경우 **"Generate Domain"** 클릭
3. 도메인 주소 확인 후, 앞서 Google과 GitHub OAuth에 입력한 URL과 동일한지 확인

### 4-5. 빌드 완료 확인

1. **"Deployments"** 탭에서 빌드 로그 확인
2. **"Build succeeded"** 메시지가 나오면 성공
3. 오류가 있으면 로그를 캡처해서 공유해주세요

### 4-6. 데이터베이스 초기화

빌드가 성공한 후, 딱 한 번만 실행합니다.

1. 서비스 화면 우측 상단 **"..."** → **"Railway Shell"** 클릭
2. 검은 터미널 창이 열리면 아래 두 줄 순서대로 입력:

```bash
pnpm db:migrate
```
엔터 → 완료 메시지 확인 후

```bash
pnpm db:seed
```
엔터 → `Seeded 22 categories.` 메시지 확인

### 4-7. 최종 확인

브라우저에서 아래 주소 접속:

- `https://playyourmusic.up.railway.app` → 홈 화면 정상 표시 확인
- `https://playyourmusic.up.railway.app/api/health` → `{"status":"ok"}` 확인

---

## 문제가 생겼을 때

| 증상 | 확인할 것 |
|------|-----------|
| 빌드 실패 | Deployments 탭 로그 캡처 후 공유 |
| 로그인이 안 됨 | OAuth Redirect URI 오타 확인 |
| 이미지 업로드 실패 | R2 CORS 설정 및 API 토큰 권한 확인 |
| 페이지가 안 열림 | `/api/health` 접속 후 결과 공유 |

---

**수고해 주셔서 감사합니다! 🙏**
