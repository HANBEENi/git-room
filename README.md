# 🧹 Git-Room

커밋을 안 하면, 방이 더러워집니다.

기존 잔디 서비스가 "캐릭터 성장"으로 동기부여했다면, Git-Room은 **방치했을 때의 시각적 부채감**으로
동기부여합니다. 미커밋 기간에 비례해서 방에 종이 → 쓰레기봉투/먼지 → 거미줄/어둠이 쌓입니다.

두 가지 형태로 제공됩니다.

1. **README 위젯** — 로그인 없이 아무 GitHub 유저네임으로 바로 쓰는 동적 SVG 뱃지
2. **웹 대시보드** — GitHub OAuth 로그인 후 내 방을 확인하고, TIL 한 줄을 입력하면 실제 레포에 자동 커밋

## 방 상태 단계

| 미커밋 기간 | 상태 |
|---|---|
| 0일 (오늘 커밋함) | ✨ 깨끗한 방 |
| 1~2일 | 📄 종이 몇 장 |
| 3~6일 | 🧹 쓰레기봉투 + 먼지 |
| 7일+ | 🕸️ 거미줄 + 꽉 찬 쓰레기통 + 어두운 방 |

## 프로젝트 구조

```
git-room/
  app/
    page.tsx                  # 랜딩 페이지 (로그인 + 뱃지 사용법)
    dashboard/page.tsx         # 로그인 후 내 방 + TIL 폼
    api/
      room/route.ts            # GET /api/room?user=xxx  → 공개 README 뱃지 (토큰 불필요)
      auth/[...nextauth]/      # GitHub OAuth
      til/route.ts             # POST → TIL 한 줄을 레포에 커밋
      create-repo/route.ts     # POST → my-daily-learning 레포 자동 생성
  lib/
    room-svg.ts                # 단계별 방 SVG 렌더러
    contributions.ts           # 잔디 데이터 조회 (공개 스크래핑 / GraphQL)
    github.ts                  # Octokit 기반 레포 생성·커밋 로직
    auth.ts                    # NextAuth 설정
  components/                  # 클라이언트 UI 컴포넌트
```

## 로컬 실행

### 1) 의존성 설치

```bash
npm install
```

### 2) GitHub OAuth App 생성

[github.com/settings/developers](https://github.com/settings/developers) → **New OAuth App**

- Homepage URL: `http://localhost:3000`
- Authorization callback URL: `http://localhost:3000/api/auth/callback/github`

생성 후 Client ID / Client Secret을 발급받습니다.

### 3) 환경 변수 설정

`.env.example`을 `.env.local`로 복사 후 값 채우기:

```bash
cp .env.example .env.local
```

```
GITHUB_ID=발급받은 Client ID
GITHUB_SECRET=발급받은 Client Secret
NEXTAUTH_SECRET=openssl rand -base64 32 로 생성한 값
NEXTAUTH_URL=http://localhost:3000
GEMINI_API_KEY=발급받은 Gemini API 키 (AI 문서화 기능에 사용, https://aistudio.google.com/apikey 에서 무료 발급)
```

### 4) 실행

```bash
npm run dev
```

`http://localhost:3000` 접속.

## 배포 (Vercel 예시)

1. 이 프로젝트를 GitHub 레포로 push
2. Vercel에서 Import → 위 4개 환경 변수를 Vercel 프로젝트 설정에 등록
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

한 줄 TIL과 별개로, 메모를 AI(Claude)가 확장해서 폴더별 마크다운 파일로 정리해주는 기능도 제공합니다.

1. "🤖 AI로 깊게 정리하기" 카드에 메모 입력 → "AI로 문서 만들기" 클릭
2. Gemini(`gemini-flash-lite-latest`)가 제목/파일명/본문(마크다운)을 생성해 미리보기로 보여줌 (내용·파일명 수정 가능)
3. 저장할 폴더를 레포의 기존 폴더 중에서 고르거나 새 폴더 이름을 입력
4. "커밋하기" → `my-daily-learning` 레포의 해당 폴더에 새 `.md` 파일로 커밋
5. 이 기능을 쓰려면 `.env.local`에 `GEMINI_API_KEY`가 설정되어 있어야 함

## 알려진 제한 사항 / 다음 스텝

- `/api/room`은 GitHub의 비공식 공개 HTML 마크업을 파싱합니다. GitHub이 마크업을 바꾸면
  깨질 수 있어, 실패 시 기본(깨끗한) 방으로 안전하게 폴백하도록 처리했습니다. 프로덕션에서는
  GitHub GraphQL API + 서버 보관용 토큰을 쓰는 방식으로 교체하는 것을 권장합니다.
- 현재 방 그래픽은 SVG 도형으로 직접 그린 플레이스홀더 아트입니다. 실제 픽셀아트 에셋으로
  교체하려면 `lib/room-svg.ts`의 `renderRoomSVG` 내부 레이어(창문/책상/장식)를 이미지 스프라이트
  합성 방식으로 바꾸면 됩니다.
- 현재 TIL 커밋은 `README.md` 한 파일에 로그를 누적하는 방식입니다. 날짜별 파일 분리, 태그,
  검색 등은 추후 확장 포인트입니다.
