# 🧹 Git-Room

커밋을 안 하면, 방이 더러워집니다.

기존 잔디 서비스가 "캐릭터 성장"으로 동기부여했다면, Git-Room은 **방치했을 때의 시각적 부채감**으로
동기부여합니다. 미커밋 기간에 비례해서 방에 종이 → 쓰레기봉투/먼지 → 거미줄/어둠이 쌓입니다.

세 가지 형태로 제공됩니다.

1. **README 위젯** — 로그인 없이 아무 GitHub 유저네임으로 바로 쓰는 동적 SVG 뱃지 (웹)
2. **웹 대시보드** — GitHub OAuth 로그인 후 내 방을 확인하고, TIL 한 줄을 입력하면 실제 레포에 자동 커밋
3. **모바일 앱** — iOS 우선(추후 Android)으로 방 상태를 확인하는 Expo 앱. 최종 목표는 홈 화면 위젯에서
   방 상태를 상시 노출하는 것 (아직 미구현)

## 방 상태 단계

| 미커밋 기간 | 상태 |
|---|---|
| 0일 (오늘 커밋함) | ✨ 깨끗한 방 |
| 1~2일 | 📄 종이 몇 장 |
| 3~6일 | 🧹 쓰레기봉투 + 먼지 |
| 7일+ | 🕸️ 거미줄 + 꽉 찬 쓰레기통 + 어두운 방 |

## 프로젝트 구조 (Turborepo 모노레포)

웹과 모바일이 방 상태 계산 · GitHub 데이터 조회 · GitHub 커밋 로직을 `packages/shared`에서 공유합니다.

```
git-room/
  apps/
    web/                # Next.js 웹 대시보드 + README 위젯 API
    mobile/              # Expo(React Native) 앱 — iOS 우선
  packages/
    shared/              # @git-room/shared — 웹·모바일 공용 순수 로직
      src/room-svg.ts     # 단계별 방 SVG 렌더러
      src/contributions.ts # 잔디 데이터 조회 (공개 스크래핑 / GraphQL)
      src/github.ts        # Octokit 기반 레포 생성·커밋 로직
  turbo.json
  pnpm-workspace.yaml
```

각 앱의 세부 구조는 [docs/PROJECT_OVERVIEW.md](docs/PROJECT_OVERVIEW.md)를 참고하세요.

## 로컬 실행

이 레포는 [pnpm](https://pnpm.io) workspace를 사용합니다.

### 1) 의존성 설치 (루트에서 한 번만)

```bash
pnpm install
```

### 2) 웹 앱 실행

#### GitHub OAuth App 생성

[github.com/settings/developers](https://github.com/settings/developers) → **New OAuth App**

- Homepage URL: `http://localhost:3000`
- Authorization callback URL: `http://localhost:3000/api/auth/callback/github`

생성 후 Client ID / Client Secret을 발급받습니다.

#### 환경 변수 설정

`apps/web/.env.example`을 `apps/web/.env.local`로 복사 후 값 채우기:

```bash
cp apps/web/.env.example apps/web/.env.local
```

```
GITHUB_ID=발급받은 Client ID
GITHUB_SECRET=발급받은 Client Secret
NEXTAUTH_SECRET=openssl rand -base64 32 로 생성한 값
NEXTAUTH_URL=http://localhost:3000
GEMINI_API_KEY=발급받은 Gemini API 키 (AI 문서화 기능에 사용, https://aistudio.google.com/apikey 에서 무료 발급)
```

#### 실행

```bash
pnpm dev --filter @git-room/web
```

`http://localhost:3000` 접속.

### 3) 모바일 앱 실행 (Expo, iOS 우선)

```bash
pnpm dev --filter @git-room/mobile
```

Expo CLI가 뜨면 `i`(iOS 시뮬레이터, Xcode 필요) 또는 Expo Go 앱으로 QR코드를 스캔해 실행합니다.
현재는 GitHub 유저네임을 입력하면 공개 잔디 데이터를 조회해 방 상태를 보여주는 화면만 있습니다
(웹의 README 위젯과 동일한 `packages/shared` 로직을 재사용).

### 4) 전체 앱 동시 실행

```bash
pnpm dev
```

루트에서 `turbo run dev`로 모든 앱의 dev 서버를 동시에 띄웁니다.

## 배포 (Vercel 예시, 웹)

1. 이 프로젝트를 GitHub 레포로 push
2. Vercel에서 Import → **Root Directory를 `apps/web`으로 지정**, 위 4개 환경 변수를 Vercel 프로젝트 설정에 등록
   - `NEXTAUTH_URL`은 배포 도메인(`https://your-app.vercel.app`)으로 변경
3. GitHub OAuth App의 Authorization callback URL도 배포 도메인 기준으로 하나 더 추가
   (`https://your-app.vercel.app/api/auth/callback/github`)

## README에 위젯 삽입

로그인 불필요. 자신의 레포 README.md에 아래처럼 추가:

```md
![My Git Room](https://<your-domain>/api/room?user=YOUR_GITHUB_USERNAME)
```

`/api/room`은 GitHub의 공개 잔디 그래프 페이지를 서버에서 조회해 마지막 커밋일 기준으로
방 SVG를 그려서 반환합니다. 별도 토큰이 필요 없어 누구나 자신의 유저네임만으로 사용할 수 있습니다.

## TIL 자동 커밋 흐름 (대시보드)

1. GitHub으로 로그인 (OAuth scope: `read:user repo`)
2. `my-daily-learning` 레포가 없으면 "레포 만들기" 버튼으로 자동 생성 (`README.md` auto-init)
3. 오늘 배운 것 한 줄 입력 → "커밋해서 방 청소하기" → `README.md`의 `## Log` 섹션에 날짜와 함께 자동 커밋
4. 다음 잔디 반영 및 방 상태 갱신까지는 GitHub 잔디 그래프 특성상 몇 분 정도 지연될 수 있음

## AI 문서화 흐름 (대시보드)

한 줄 TIL과 별개로, 메모를 AI(Gemini)가 확장해서 폴더별 마크다운 파일로 정리해주는 기능도 제공합니다.

1. "🤖 AI로 깊게 정리하기" 카드에 메모 입력 → "AI로 문서 만들기" 클릭
2. Gemini(`gemini-flash-lite-latest`)가 제목/파일명/본문(마크다운)을 생성해 미리보기로 보여줌 (내용·파일명 수정 가능)
3. 저장할 폴더를 레포의 기존 폴더 중에서 고르거나 새 폴더 이름을 입력
4. "커밋하기" → `my-daily-learning` 레포의 해당 폴더에 새 `.md` 파일로 커밋
5. 이 기능을 쓰려면 `apps/web/.env.local`에 `GEMINI_API_KEY`가 설정되어 있어야 함

## 알려진 제한 사항 / 다음 스텝

- `/api/room`은 GitHub의 비공식 공개 HTML 마크업을 파싱합니다. GitHub이 마크업을 바꾸면
  깨질 수 있어, 실패 시 기본(깨끗한) 방으로 안전하게 폴백하도록 처리했습니다. 프로덕션에서는
  GitHub GraphQL API + 서버 보관용 토큰을 쓰는 방식으로 교체하는 것을 권장합니다.
- 현재 방 그래픽은 SVG 도형으로 직접 그린 플레이스홀더 아트입니다. 실제 픽셀아트 에셋으로
  교체하려면 `packages/shared/src/room-svg.ts`의 `renderRoomSVG` 내부 레이어(창문/책상/장식)를
  이미지 스프라이트 합성 방식으로 바꾸면 됩니다.
- 현재 TIL 커밋은 `README.md` 한 파일에 로그를 누적하는 방식입니다. 날짜별 파일 분리, 태그,
  검색 등은 추후 확장 포인트입니다.
- 데이터베이스(Supabase/Firebase)는 아직 미도입입니다. 도입 시점이 오면 서버리스 방식으로 붙일 예정입니다.
- 모바일 앱은 아직 GitHub 로그인/TIL 커밋 기능이 없습니다 (공개 위젯 조회만 가능). 로그인은
  `expo-auth-session` 기반 GitHub OAuth로 추가할 예정입니다.
- 홈 화면 위젯(iOS WidgetKit / Android App Widgets)은 아직 구현 전입니다. 네이티브 코드가 필요해
  별도 작업으로 진행할 예정입니다.
