// lib/room-svg.ts
// 방치(미커밋) 일수에 따라 4단계로 변하는 픽셀아트풍 "내 방" SVG 렌더러.
// 0일: 깨끗한 방(햇살/반짝임)
// 1~2일: 구겨진 종이 1~2장, 조명 어두워짐
// 3~5일: 쓰레기봉투 + 얇은 먼지
// 7일+ : 거미줄 + 꽉 찬 쓰레기통 + 어두운 방 + 연기

export type RoomStage = "clean" | "light" | "moderate" | "neglected";

export interface RoomState {
  stage: RoomStage;
  daysSinceLastCommit: number;
  label: string;
  emoji: string;
}

export function getRoomState(daysSinceLastCommit: number): RoomState {
  if (daysSinceLastCommit <= 0) {
    return { stage: "clean", daysSinceLastCommit, label: "깨끗한 방", emoji: "✨" };
  }
  if (daysSinceLastCommit <= 2) {
    return { stage: "light", daysSinceLastCommit, label: "종이가 굴러다니는 방", emoji: "📄" };
  }
  if (daysSinceLastCommit <= 6) {
    return { stage: "moderate", daysSinceLastCommit, label: "쓰레기가 쌓이는 방", emoji: "🧹" };
  }
  return { stage: "neglected", daysSinceLastCommit, label: "거미줄 낀 방", emoji: "🕸️" };
}

// 벽/바닥 톤은 단계별로 점점 어두워진다.
const PALETTE: Record<RoomStage, { wall: string; wallShade: string; floor: string; floorShade: string; window: string; glow: string }> = {
  clean: { wall: "#fdeedc", wallShade: "#f6dcc0", floor: "#c98a54", floorShade: "#b97940", window: "#bfe8ff", glow: "#fff6d8" },
  light: { wall: "#f0e2cf", wallShade: "#e3cfb2", floor: "#b97e4c", floorShade: "#a76d3d", window: "#a9cfe0", glow: "#fdf0c8" },
  moderate: { wall: "#ddccb8", wallShade: "#c9b598", floor: "#9c7145", floorShade: "#8a6138", window: "#8fb2c2", glow: "#e9dcac" },
  neglected: { wall: "#4a4640", wallShade: "#3a3730", floor: "#3f3226", floorShade: "#332821", window: "#3c4a52", glow: "#5c5748" },
};

function crumpledPaper(x: number, y: number, rotate: number) {
  return `<g transform="translate(${x} ${y}) rotate(${rotate})">
    <path d="M0 8 L6 0 L14 2 L18 10 L12 16 L2 14 Z" fill="#f5f1e6" stroke="#d8d0bd" stroke-width="1"/>
  </g>`;
}

function trashBag(x: number, y: number, scale = 1) {
  return `<g transform="translate(${x} ${y}) scale(${scale})">
    <ellipse cx="14" cy="26" rx="14" ry="6" fill="#00000022"/>
    <path d="M2 8 Q14 -4 26 8 L23 30 Q14 36 5 30 Z" fill="#3a3f46"/>
    <path d="M8 6 Q14 -2 20 6" stroke="#2a2e34" stroke-width="2" fill="none"/>
    <path d="M6 14 Q14 18 22 14" stroke="#00000033" stroke-width="2" fill="none"/>
  </g>`;
}

function dustLayer(opacity: number) {
  return `<rect x="0" y="0" width="320" height="220" fill="#8a7a5c" opacity="${opacity}" style="mix-blend-mode:multiply"/>`;
}

function cobweb(x: number, y: number, flip = false) {
  const s = flip ? -1 : 1;
  return `<g transform="translate(${x} ${y}) scale(${s} 1)" stroke="#e8e8e8" stroke-width="1" fill="none" opacity="0.85">
    <path d="M0 0 L34 0 M0 0 L0 34 M0 0 L28 28"/>
    <path d="M0 8 Q10 8 8 0"/>
    <path d="M0 18 Q17 18 18 0"/>
    <path d="M0 28 Q24 28 28 0"/>
  </g>`;
}

function smoke(x: number, y: number) {
  return `<g opacity="0.55">
    <path d="M${x} ${y} Q${x - 8} ${y - 14} ${x} ${y - 26} Q${x + 8} ${y - 38} ${x} ${y - 50}"
      stroke="#cfcfcf" stroke-width="4" fill="none" stroke-linecap="round"/>
  </g>`;
}

function fullTrashCan(x: number, y: number) {
  return `<g transform="translate(${x} ${y})">
    <path d="M2 10 L26 10 L23 40 L5 40 Z" fill="#5a5a5a"/>
    <rect x="0" y="6" width="28" height="6" rx="2" fill="#707070"/>
    ${crumpledPaper(-2, -8, -10)}
    ${crumpledPaper(10, -12, 15)}
    ${trashBag(4, -22, 0.55)}
  </g>`;
}

function sparkle(x: number, y: number) {
  return `<path transform="translate(${x} ${y})" d="M6 0 L7.5 4.5 L12 6 L7.5 7.5 L6 12 L4.5 7.5 L0 6 L4.5 4.5 Z" fill="#ffe9a8"/>`;
}

export function renderRoomSVG(opts: { username?: string; daysSinceLastCommit: number; currentStreak?: number }) {
  const days = Math.max(0, Math.floor(opts.daysSinceLastCommit));
  const room = getRoomState(days);
  const p = PALETTE[room.stage];
  const W = 320;
  const H = 220;

  let decor = "";
  let overlay = "";
  let title = room.label;

  if (room.stage === "clean") {
    decor += sparkle(40, 30) + sparkle(260, 50) + sparkle(150, 20);
  } else if (room.stage === "light") {
    decor += crumpledPaper(70, 168, -8);
    if (days === 2) decor += crumpledPaper(96, 172, 20);
  } else if (room.stage === "moderate") {
    decor += crumpledPaper(60, 168, -8) + crumpledPaper(84, 172, 14);
    decor += trashBag(220, 150, 0.9);
    overlay += dustLayer(0.08 + 0.02 * (days - 3));
  } else {
    decor += fullTrashCan(214, 150);
    decor += cobweb(4, 4) + cobweb(W - 4, 4, true);
    decor += smoke(228, 148);
    overlay += dustLayer(0.16);
    overlay += `<rect x="0" y="0" width="${W}" height="${H}" fill="#000000" opacity="0.28"/>`;
  }

  const svg = `<svg xmlns="http://www.w3.org/2000/svg" width="${W}" height="${H}" viewBox="0 0 ${W} ${H}" font-family="Verdana, Geneva, sans-serif">
  <rect width="${W}" height="${H}" fill="${p.wall}"/>
  <rect x="0" y="0" width="${W}" height="${H}" fill="${p.wallShade}" opacity="0.25"/>
  <rect x="0" y="150" width="${W}" height="70" fill="${p.floor}"/>
  <rect x="0" y="150" width="${W}" height="6" fill="${p.floorShade}"/>

  <!-- 창문 -->
  <rect x="20" y="24" width="70" height="56" rx="4" fill="#5b4a36"/>
  <rect x="26" y="30" width="58" height="44" fill="${p.window}"/>
  <rect x="53" y="30" width="4" height="44" fill="#5b4a36"/>
  <rect x="26" y="50" width="58" height="4" fill="#5b4a36"/>
  <circle cx="70" cy="42" r="10" fill="${p.glow}" opacity="${room.stage === "clean" ? 0.9 : room.stage === "light" ? 0.5 : 0.25}"/>

  <!-- 책상 + 모니터 -->
  <rect x="150" y="128" width="120" height="10" fill="#8a5a34"/>
  <rect x="150" y="138" width="10" height="40" fill="#6d4526"/>
  <rect x="260" y="138" width="10" height="40" fill="#6d4526"/>
  <rect x="170" y="92" width="60" height="38" rx="3" fill="#2b2b2b"/>
  <rect x="175" y="97" width="50" height="28" rx="2" fill="${room.stage === "clean" || room.stage === "light" ? "#7fd8ff" : "#3a4b52"}"/>
  <rect x="195" y="130" width="10" height="8" fill="#2b2b2b"/>
  <rect x="185" y="138" width="30" height="4" fill="#1c1c1c"/>

  <!-- 의자 -->
  <rect x="190" y="150" width="8" height="30" fill="#4a3626"/>
  <rect x="222" y="150" width="8" height="30" fill="#4a3626"/>
  <rect x="186" y="140" width="48" height="8" rx="2" fill="#6d4526"/>

  ${decor}
  ${overlay}

  <text x="12" y="212" font-size="11" fill="${room.stage === "neglected" ? "#e8e2d5" : "#4a3826"}" opacity="0.85">${opts.username ? "@" + opts.username + " · " : ""}${title} ${room.emoji}</text>
  <text x="${W - 10}" y="212" font-size="10" fill="${room.stage === "neglected" ? "#cfc8ba" : "#6a5640"}" text-anchor="end" opacity="0.75">${days === 0 ? "오늘 커밋함" : days + "일째 미커밋"}</text>
</svg>`;

  return { svg, room };
}
