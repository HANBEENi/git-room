// lib/room-svg.ts
// 방치(미커밋) 일수에 따라 13단계로 변하는 픽셀아트풍 "내 방" SVG 렌더러.
// 00 0일: 깨끗한 방          07 26~29일: 빛이 안 드는 방
// 01 1~2일: 종이 굴러다님    08 30~39일: 버려진 방
// 02 3~6일: 쓰레기+먼지      09 40~89일: 금이 간 방
// 03 7~10일: 거미줄+쓰레기통 10 3개월~: 화분이 시든 방
// 04 11~15일: 옷가지 널브러짐 11 6개월~: 폐허가 된 방
// 05 16~19일: 날파리         12 1년~: 화면 전체 쓰레기로 뒤덮임
// 06 20~25일: 곰팡이+조명 깜빡

// 사용자 입력(username)이 SVG <text> 노드에 그대로 들어가므로 XML 특수문자를 escape.
// (/api/room?user= 는 인증 없이 임의 문자열을 그대로 받는 공개 엔드포인트)
function escapeXml(value: string): string {
  return value
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;")
    .replace(/'/g, "&apos;");
}

export type RoomStage =
  | "clean"
  | "light"
  | "moderate"
  | "neglected"
  | "cluttered"
  | "infested"
  | "moldy"
  | "gloomy"
  | "abandoned"
  | "cracked"
  | "withered"
  | "ruined"
  | "wasteland";

interface StageDef {
  stage: RoomStage;
  minDays: number;
  label: string;
  emoji: string;
}

// 순서대로 정의, minDays 이상이면 그 단계로 판정 (아래 STAGES 배열의 인덱스가 곧 stageIndex)
const STAGES: StageDef[] = [
  { stage: "clean", minDays: 0, label: "깨끗한 방", emoji: "✨" },
  { stage: "light", minDays: 1, label: "종이가 굴러다니는 방", emoji: "📄" },
  { stage: "moderate", minDays: 3, label: "쓰레기가 쌓이는 방", emoji: "🧹" },
  { stage: "neglected", minDays: 7, label: "거미줄 낀 방", emoji: "🕸️" },
  { stage: "cluttered", minDays: 11, label: "옷가지가 널브러진 방", emoji: "👕" },
  { stage: "infested", minDays: 16, label: "날파리 꼬인 방", emoji: "🪰" },
  { stage: "moldy", minDays: 20, label: "곰팡이 핀 방", emoji: "🦠" },
  { stage: "gloomy", minDays: 26, label: "빛이 안 드는 방", emoji: "🌑" },
  { stage: "abandoned", minDays: 30, label: "버려진 방", emoji: "📦" },
  { stage: "cracked", minDays: 40, label: "금이 간 방", emoji: "🧱" },
  { stage: "withered", minDays: 90, label: "화분이 시든 방", emoji: "🥀" },
  { stage: "ruined", minDays: 180, label: "폐허가 된 방", emoji: "🏚️" },
  { stage: "wasteland", minDays: 365, label: "쓰레기로 뒤덮인 방", emoji: "💀" },
];

export interface RoomState {
  stage: RoomStage;
  stageIndex: number;
  daysSinceLastCommit: number;
  label: string;
  emoji: string;
}

export function getRoomState(daysSinceLastCommit: number): RoomState {
  const days = Math.max(0, Math.floor(daysSinceLastCommit));

  let index = 0;
  for (let i = 0; i < STAGES.length; i++) {
    if (days >= STAGES[i].minDays) index = i;
  }

  const def = STAGES[index];
  return {
    stage: def.stage,
    stageIndex: index,
    daysSinceLastCommit: days,
    label: def.label,
    emoji: def.emoji,
  };
}

// 시간대/계절 — 창밖 풍경에만 영향을 준다 (방치 단계는 그대로 wall/floor 톤을 좌우함).
// /api/room은 인증 없는 이미지 요청이라 "요청자가 사는 시간대"를 서버가 알 수 없어서,
// 기본값은 서버 시각(now 인자를 안 넘기면 new Date())을 쓴다. 나중에 로그인된
// 대시보드/모바일에서 클라이언트의 실제 로컬 시간을 넘겨주면 그 사람 기준으로 정확해진다.
export type TimeOfDay = "dawn" | "morning" | "day" | "sunset" | "night";

export function getTimeOfDay(now: Date = new Date()): TimeOfDay {
  const hour = now.getHours();
  if (hour >= 5 && hour < 7) return "dawn";
  if (hour >= 7 && hour < 11) return "morning";
  if (hour >= 11 && hour < 17) return "day";
  if (hour >= 17 && hour < 20) return "sunset";
  return "night";
}

// 북반구(한국 등) 기준. 남반구 대응은 위치 정보가 필요해서 이번 범위에는 포함하지 않음.
export type Season = "spring" | "summer" | "fall" | "winter";

export function getSeason(now: Date = new Date()): Season {
  const month = now.getMonth() + 1;
  if (month >= 3 && month <= 5) return "spring";
  if (month >= 6 && month <= 8) return "summer";
  if (month >= 9 && month <= 11) return "fall";
  return "winter";
}

interface Palette {
  wall: string;
  wallShade: string;
  floor: string;
  floorShade: string;
  window: string;
  glow: string;
}

// 0~3단계(clean~neglected)는 손으로 고른 색, 4단계(cluttered) 이후는 neglected 색에서
// wasteland 색까지 선형 보간한다 — 13단계를 전부 손으로 고르면 색 톤이 들쭉날쭉해지기 쉬워서,
// 두 끝점만 정해두고 계산으로 채운다.
const BASE_PALETTE: Record<"clean" | "light" | "moderate" | "neglected", Palette> = {
  clean: {
    wall: "#fdeedc",
    wallShade: "#f6dcc0",
    floor: "#c98a54",
    floorShade: "#b97940",
    window: "#bfe8ff",
    glow: "#fff6d8",
  },
  light: {
    wall: "#f0e2cf",
    wallShade: "#e3cfb2",
    floor: "#b97e4c",
    floorShade: "#a76d3d",
    window: "#a9cfe0",
    glow: "#fdf0c8",
  },
  moderate: {
    wall: "#ddccb8",
    wallShade: "#c9b598",
    floor: "#9c7145",
    floorShade: "#8a6138",
    window: "#8fb2c2",
    glow: "#e9dcac",
  },
  neglected: {
    wall: "#4a4640",
    wallShade: "#3a3730",
    floor: "#3f3226",
    floorShade: "#332821",
    window: "#3c4a52",
    glow: "#5c5748",
  },
};

const WASTELAND_PALETTE: Palette = {
  wall: "#0e0c0b",
  wallShade: "#080706",
  floor: "#080503",
  floorShade: "#040302",
  window: "#0d1014",
  glow: "#161310",
};

function mixHex(a: string, b: string, t: number): string {
  const pa = parseInt(a.slice(1), 16);
  const pb = parseInt(b.slice(1), 16);
  const channel = (shift: number) => {
    const av = (pa >> shift) & 0xff;
    const bv = (pb >> shift) & 0xff;
    return Math.round(av + (bv - av) * t);
  };
  const rgb = [channel(16), channel(8), channel(0)];
  return `#${rgb.map((v) => v.toString(16).padStart(2, "0")).join("")}`;
}

function getPalette(stageIndex: number): Palette {
  if (stageIndex === 0) return BASE_PALETTE.clean;
  if (stageIndex === 1) return BASE_PALETTE.light;
  if (stageIndex === 2) return BASE_PALETTE.moderate;
  if (stageIndex === 3) return BASE_PALETTE.neglected;

  const t = (stageIndex - 3) / (STAGES.length - 1 - 3);
  const from = BASE_PALETTE.neglected;
  const to = WASTELAND_PALETTE;
  return {
    wall: mixHex(from.wall, to.wall, t),
    wallShade: mixHex(from.wallShade, to.wallShade, t),
    floor: mixHex(from.floor, to.floor, t),
    floorShade: mixHex(from.floorShade, to.floorShade, t),
    window: mixHex(from.window, to.window, t),
    glow: mixHex(from.glow, to.glow, t),
  };
}

// 단계가 깊어질수록 창문 조명은 어두워지고, 먼지/암전 레이어는 짙어진다.
const WINDOW_GLOW_OPACITY = [
  0.9, 0.5, 0.28, 0.22, 0.18, 0.15, 0.12, 0.1, 0.08, 0.07, 0.06, 0.05, 0.04,
];
const DUST_OPACITY = [0, 0, 0.1, 0.16, 0.19, 0.21, 0.24, 0.28, 0.32, 0.36, 0.4, 0.45, 0.52];
const DARK_OVERLAY_OPACITY = [0, 0, 0, 0.28, 0.32, 0.36, 0.4, 0.46, 0.52, 0.56, 0.6, 0.66, 0.72];

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

function cobweb(x: number, y: number, flip = false, scale = 1) {
  const s = flip ? -1 : 1;
  return `<g transform="translate(${x} ${y}) scale(${s * scale} ${scale})" stroke="#e8e8e8" stroke-width="1" fill="none" opacity="0.85">
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

function clothesPile(x: number, y: number) {
  return `<g transform="translate(${x} ${y})">
    <ellipse cx="14" cy="18" rx="16" ry="5" fill="#00000022"/>
    <path d="M0 14 Q4 2 16 4 Q26 6 24 16 Q14 22 0 14 Z" fill="#6b4f5e"/>
    <path d="M4 12 Q10 8 18 10" stroke="#523c48" stroke-width="2" fill="none"/>
  </g>`;
}

function fly(x: number, y: number) {
  return `<g transform="translate(${x} ${y})" opacity="0.8">
    <circle r="1.6" fill="#1c1c1c"/>
    <path d="M-4 -3 Q0 0 -4 3" stroke="#1c1c1c" stroke-width="0.6" fill="none"/>
    <path d="M4 -3 Q0 0 4 3" stroke="#1c1c1c" stroke-width="0.6" fill="none"/>
  </g>`;
}

function moldSpot(x: number, y: number, scale = 1) {
  return `<g transform="translate(${x} ${y}) scale(${scale})" opacity="0.55">
    <ellipse cx="0" cy="0" rx="10" ry="6" fill="#4b5a3a"/>
    <ellipse cx="7" cy="3" rx="5" ry="4" fill="#3c4a2e"/>
    <ellipse cx="-5" cy="4" rx="4" ry="3" fill="#3c4a2e"/>
  </g>`;
}

function crack(x: number, y: number) {
  return `<path transform="translate(${x} ${y})" d="M0 0 L4 10 L-2 18 L5 30 L0 42" stroke="#000000" stroke-width="1.2" fill="none" opacity="0.5"/>`;
}

function witheredPlant(x: number, y: number) {
  return `<g transform="translate(${x} ${y})">
    <path d="M4 34 L20 34 L18 20 L6 20 Z" fill="#8a5a3c"/>
    <path d="M12 20 Q6 10 8 0" stroke="#6b5a3a" stroke-width="2" fill="none"/>
    <path d="M12 20 Q18 8 14 -2" stroke="#6b5a3a" stroke-width="2" fill="none"/>
    <path d="M12 18 Q10 6 4 4" stroke="#7a6540" stroke-width="1.5" fill="none"/>
    <ellipse cx="8" cy="-1" rx="4" ry="2" fill="#7a6a3f" opacity="0.8"/>
    <ellipse cx="14" cy="-3" rx="3" ry="2" fill="#6a5a35" opacity="0.8"/>
  </g>`;
}

function windowGrime(opacity: number) {
  return `<rect x="26" y="30" width="58" height="44" fill="#5a5240" opacity="${opacity}" style="mix-blend-mode:multiply"/>`;
}

interface SkyTheme {
  top: string;
  bottom: string;
  celestial: "sun" | "moon" | null;
  showStars: boolean;
}

const SKY_THEMES: Record<TimeOfDay, SkyTheme> = {
  dawn: { top: "#f6b98c", bottom: "#ffe3b0", celestial: "sun", showStars: false },
  morning: { top: "#bfe8ff", bottom: "#eaf7ff", celestial: "sun", showStars: false },
  day: { top: "#8fd3ff", bottom: "#d8f1ff", celestial: "sun", showStars: false },
  sunset: { top: "#7d5aa6", bottom: "#f2905c", celestial: "sun", showStars: false },
  night: { top: "#0c1830", bottom: "#1f2f4d", celestial: "moon", showStars: true },
};

// 계절별로 창밖 하단에 살짝 보이는 풍경 실루엣. mixT(0=선명, 1=거의 안 보임)만큼 옅어진다.
const SEASON_WINDOW_SCENERY: Record<Season, (mixT: number) => string> = {
  spring: (t) => `<g opacity="${1 - t * 0.7}">
    <circle cx="34" cy="66" r="2" fill="#ffc2d6"/>
    <circle cx="40" cy="70" r="1.6" fill="#ffd6e6"/>
    <circle cx="46" cy="64" r="1.8" fill="#ffc2d6"/>
    <circle cx="60" cy="68" r="2" fill="#ffd6e6"/>
    <circle cx="68" cy="63" r="1.6" fill="#ffc2d6"/>
  </g>`,
  summer: (t) =>
    `<path d="M26 74 Q40 54 55 74 Z" fill="${mixHex("#3f7d3a", "#000000", t * 0.5)}" opacity="${1 - t * 0.5}"/>`,
  fall: (t) =>
    `<path d="M26 74 Q40 56 55 74 Z" fill="${mixHex("#c97a34", "#000000", t * 0.5)}" opacity="${1 - t * 0.5}"/>`,
  winter: (t) => `<g opacity="${1 - t * 0.4}">
    <path d="M26 70 Q40 62 55 70 L55 74 L26 74 Z" fill="#f4f8ff"/>
    <circle cx="36" cy="40" r="1" fill="#ffffff"/>
    <circle cx="50" cy="46" r="1" fill="#ffffff"/>
    <circle cx="64" cy="38" r="1" fill="#ffffff"/>
  </g>`,
};

let windowSkyGradientCounter = 0;

/** 창문 안쪽에 시간대(하늘색+해/달/별)와 계절(풍경 실루엣)을 겹쳐 그린 레이어. */
function windowSkyLayer(time: TimeOfDay, season: Season, mixT: number, flicker: string) {
  const theme = SKY_THEMES[time];
  const top = mixHex(theme.top, "#242220", mixT);
  const bottom = mixHex(theme.bottom, "#242220", mixT);
  const gradientId = `skyGradient${windowSkyGradientCounter++}`;

  const stars = theme.showStars
    ? [
        [32, 36],
        [40, 44],
        [50, 34],
        [60, 40],
        [70, 38],
        [78, 46],
      ]
        .map(
          ([sx, sy]) =>
            `<circle cx="${sx}" cy="${sy}" r="0.8" fill="#ffffff" opacity="${0.8 * (1 - mixT)}"/>`,
        )
        .join("")
    : "";

  const celestial =
    theme.celestial === "sun"
      ? `<circle cx="70" cy="42" r="7" fill="#fff3c4" opacity="${1 - mixT}">${flicker}</circle>`
      : theme.celestial === "moon"
        ? `<g opacity="${1 - mixT}"><circle cx="70" cy="40" r="6" fill="#f4f1e6">${flicker}</circle><circle cx="72" cy="38" r="1.4" fill="#d8d4c4" opacity="0.6"/></g>`
        : "";

  return `<defs>
    <clipPath id="${gradientId}Clip"><rect x="26" y="30" width="58" height="44"/></clipPath>
    <linearGradient id="${gradientId}" x1="0" y1="0" x2="0" y2="1">
      <stop offset="0%" stop-color="${top}"/>
      <stop offset="100%" stop-color="${bottom}"/>
    </linearGradient>
  </defs>
  <g clip-path="url(#${gradientId}Clip)">
    <rect x="26" y="30" width="58" height="44" fill="url(#${gradientId})"/>
    ${stars}
    ${celestial}
    ${SEASON_WINDOW_SCENERY[season](mixT)}
  </g>`;
}

function flowerPot(x: number, y: number) {
  return `<g transform="translate(${x} ${y})">
    <path d="M4 20 L20 20 L18 8 L6 8 Z" fill="#a8562e"/>
    <path d="M12 8 Q6 -2 8 -10" stroke="#4a7a3a" stroke-width="2" fill="none"/>
    <path d="M12 8 Q18 -4 14 -12" stroke="#4a7a3a" stroke-width="2" fill="none"/>
    <circle cx="8" cy="-11" r="3" fill="#ffc2d6"/>
    <circle cx="14" cy="-13" r="2.6" fill="#ffb0cc"/>
  </g>`;
}

function fanUnit(x: number, y: number) {
  return `<g transform="translate(${x} ${y})">
    <rect x="0" y="10" width="4" height="20" fill="#888888"/>
    <circle cx="2" cy="6" r="10" fill="#e6e6e6" stroke="#b0b0b0" stroke-width="1"/>
    <path d="M2 6 L2 -1 M2 6 L8 9 M2 6 L-4 9" stroke="#b0b0b0" stroke-width="1.4"/>
  </g>`;
}

function kotatsu(x: number, y: number) {
  return `<g transform="translate(${x} ${y})">
    <rect x="0" y="10" width="30" height="6" fill="#8a4a2e"/>
    <rect x="4" y="16" width="4" height="10" fill="#5a3220"/>
    <rect x="22" y="16" width="4" height="10" fill="#5a3220"/>
    <rect x="-2" y="4" width="34" height="8" rx="2" fill="#c94a3a"/>
  </g>`;
}

/** 계절별 실내 소품 하나 (화분/선풍기/코타츠). 가을은 조명 톤만 바뀌고 별도 소품 없음. */
function seasonProp(season: Season, x: number, y: number): string {
  if (season === "spring") return flowerPot(x, y);
  if (season === "summer") return fanUnit(x, y);
  if (season === "winter") return kotatsu(x, y);
  return "";
}

export function renderRoomSVG(opts: {
  username?: string;
  daysSinceLastCommit: number;
  currentStreak?: number;
  /** 시간대/계절 계산 기준 시각. 생략하면 서버 시각(new Date())을 쓴다. */
  now?: Date;
}) {
  const days = Math.max(0, Math.floor(opts.daysSinceLastCommit));
  const room = getRoomState(days);
  const idx = room.stageIndex;
  const p = getPalette(idx);
  const timeOfDay = getTimeOfDay(opts.now);
  const season = getSeason(opts.now);
  const W = 320;
  const H = 220;

  let decor = "";
  let overlay = "";
  const title = room.label;

  switch (room.stage) {
    case "clean":
      decor += sparkle(40, 30) + sparkle(260, 50) + sparkle(150, 20);
      break;
    case "light":
      decor += crumpledPaper(70, 168, -8);
      if (days === 2) decor += crumpledPaper(96, 172, 20);
      break;
    case "moderate":
      decor += crumpledPaper(60, 168, -8) + crumpledPaper(84, 172, 14);
      decor += trashBag(220, 150, 0.9);
      break;
    case "neglected":
      decor += fullTrashCan(214, 150);
      decor += cobweb(4, 4) + cobweb(W - 4, 4, true);
      decor += smoke(228, 148);
      break;
    case "cluttered":
      decor += fullTrashCan(214, 150);
      decor += cobweb(4, 4) + cobweb(W - 4, 4, true);
      decor += smoke(228, 148);
      decor += clothesPile(100, 172);
      overlay += windowGrime(0.15);
      break;
    case "infested":
      decor += fullTrashCan(214, 150) + trashBag(56, 158, 0.7);
      decor += cobweb(4, 4) + cobweb(W - 4, 4, true);
      decor += smoke(228, 148);
      decor += clothesPile(100, 172);
      decor += fly(140, 60) + fly(160, 80) + fly(120, 100);
      overlay += windowGrime(0.2);
      break;
    case "moldy":
      decor += fullTrashCan(214, 150) + trashBag(56, 158, 0.7);
      decor += cobweb(4, 4) + cobweb(W - 4, 4, true);
      decor += smoke(228, 148);
      decor += clothesPile(100, 172);
      decor += fly(140, 60) + fly(160, 80) + fly(120, 100);
      decor += moldSpot(250, 30, 0.8) + moldSpot(285, 95, 0.6);
      overlay += windowGrime(0.28);
      break;
    case "gloomy":
      decor += fullTrashCan(214, 150) + trashBag(56, 158, 0.7);
      decor += cobweb(4, 4) + cobweb(W - 4, 4, true) + cobweb(105, 4, false, 0.6);
      decor += smoke(228, 148);
      decor += clothesPile(100, 172);
      decor += fly(140, 60) + fly(160, 80) + fly(120, 100);
      decor += moldSpot(250, 30, 0.8) + moldSpot(285, 95, 0.6);
      overlay += windowGrime(0.42);
      break;
    case "abandoned":
      decor += fullTrashCan(214, 150) + fullTrashCan(44, 150) + trashBag(56, 158, 0.7);
      decor += cobweb(4, 4) + cobweb(W - 4, 4, true) + cobweb(105, 4, false, 0.6);
      decor += smoke(228, 148) + smoke(58, 146);
      decor += clothesPile(100, 172);
      decor += fly(140, 60) + fly(160, 80) + fly(120, 100);
      decor += moldSpot(250, 30, 0.8) + moldSpot(285, 95, 0.6);
      overlay += windowGrime(0.5);
      break;
    case "cracked":
      decor += fullTrashCan(214, 150) + fullTrashCan(44, 150) + trashBag(120, 160, 0.7);
      decor += cobweb(4, 4) + cobweb(W - 4, 4, true) + cobweb(105, 4, false, 0.6);
      decor += smoke(228, 148) + smoke(58, 146);
      decor += clothesPile(150, 172);
      decor += fly(140, 60) + fly(160, 80) + fly(120, 100) + fly(200, 70);
      decor += moldSpot(250, 30, 0.8) + moldSpot(285, 95, 0.6);
      decor += crack(112, 30) + crack(300, 60);
      overlay += windowGrime(0.55);
      break;
    case "withered":
      decor += fullTrashCan(214, 150) + fullTrashCan(44, 150) + trashBag(120, 160, 0.7);
      decor += cobweb(4, 4) + cobweb(W - 4, 4, true) + cobweb(105, 4, false, 0.6);
      decor += smoke(228, 148) + smoke(58, 146);
      decor += clothesPile(150, 172);
      decor += fly(140, 60) + fly(160, 80) + fly(120, 100) + fly(200, 70);
      decor += moldSpot(250, 30, 0.8) + moldSpot(285, 95, 0.6);
      decor += crack(112, 30) + crack(300, 60);
      decor += witheredPlant(96, 146);
      overlay += windowGrime(0.65);
      break;
    case "ruined":
      decor += fullTrashCan(214, 150) + fullTrashCan(44, 150) + fullTrashCan(130, 155);
      decor +=
        cobweb(4, 4) +
        cobweb(W - 4, 4, true) +
        cobweb(105, 4, false, 0.6) +
        cobweb(220, 4, true, 0.5);
      decor += smoke(228, 148) + smoke(58, 146);
      decor += fly(140, 60) + fly(160, 80) + fly(120, 100) + fly(200, 70) + fly(90, 55);
      decor += moldSpot(250, 30, 0.8) + moldSpot(285, 95, 0.6) + moldSpot(30, 90, 0.5);
      decor += crack(112, 30) + crack(300, 60) + crack(180, 20);
      decor += witheredPlant(96, 146);
      overlay += windowGrime(0.8);
      break;
    case "wasteland":
      decor +=
        fullTrashCan(214, 150) +
        fullTrashCan(44, 150) +
        fullTrashCan(130, 155) +
        fullTrashCan(270, 158);
      decor +=
        cobweb(4, 4) +
        cobweb(W - 4, 4, true) +
        cobweb(105, 4, false, 0.6) +
        cobweb(220, 4, true, 0.5);
      decor += smoke(228, 148) + smoke(58, 146) + smoke(140, 150);
      decor +=
        fly(140, 60) + fly(160, 80) + fly(120, 100) + fly(200, 70) + fly(90, 55) + fly(240, 100);
      decor += moldSpot(250, 30, 0.8) + moldSpot(285, 95, 0.6) + moldSpot(30, 90, 0.5);
      decor += crack(112, 30) + crack(300, 60) + crack(180, 20);
      decor += witheredPlant(96, 146);
      decor += crumpledPaper(150, 165, 30) + crumpledPaper(180, 172, -20);
      overlay += windowGrime(0.9);
      break;
  }

  if (DUST_OPACITY[idx] > 0) overlay += dustLayer(DUST_OPACITY[idx]);
  if (DARK_OVERLAY_OPACITY[idx] > 0) {
    overlay += `<rect x="0" y="0" width="${W}" height="${H}" fill="#000000" opacity="${DARK_OVERLAY_OPACITY[idx]}"/>`;
  }

  decor += seasonProp(season, 98, 140);

  const glowOpacity = WINDOW_GLOW_OPACITY[idx];
  // 06단계(moldy)부터는 "조명이 깜빡거린다"는 설정을 SVG 자체 애니메이션으로 표현
  const flicker =
    idx >= 6
      ? `<animate attributeName="opacity" values="1;0.25;1" dur="2.2s" repeatCount="indefinite"/>`
      : "";
  // 방치 단계가 깊을수록 창밖 하늘도 점점 칙칙해진다 (glowOpacity가 낮을수록 mixT가 커짐)
  const skyMixT = 1 - glowOpacity / WINDOW_GLOW_OPACITY[0];
  const skyLayer = windowSkyLayer(timeOfDay, season, skyMixT, flicker);

  const isDark = idx >= 3;
  const textColor = isDark ? "#e8e2d5" : "#4a3826";
  const subTextColor = isDark ? "#cfc8ba" : "#6a5640";
  const screenColor = idx <= 1 ? "#7fd8ff" : "#3a4b52";

  const svg = `<svg xmlns="http://www.w3.org/2000/svg" width="${W}" height="${H}" viewBox="0 0 ${W} ${H}" font-family="Verdana, Geneva, sans-serif">
  <rect width="${W}" height="${H}" fill="${p.wall}"/>
  <rect x="0" y="0" width="${W}" height="${H}" fill="${p.wallShade}" opacity="0.25"/>
  <rect x="0" y="150" width="${W}" height="70" fill="${p.floor}"/>
  <rect x="0" y="150" width="${W}" height="6" fill="${p.floorShade}"/>

  <!-- 창문 -->
  <rect x="20" y="24" width="70" height="56" rx="4" fill="#5b4a36"/>
  ${skyLayer}
  <rect x="53" y="30" width="4" height="44" fill="#5b4a36"/>
  <rect x="26" y="50" width="58" height="4" fill="#5b4a36"/>

  <!-- 책상 + 모니터 -->
  <rect x="150" y="128" width="120" height="10" fill="#8a5a34"/>
  <rect x="150" y="138" width="10" height="40" fill="#6d4526"/>
  <rect x="260" y="138" width="10" height="40" fill="#6d4526"/>
  <rect x="170" y="92" width="60" height="38" rx="3" fill="#2b2b2b"/>
  <rect x="175" y="97" width="50" height="28" rx="2" fill="${screenColor}"/>
  <rect x="195" y="130" width="10" height="8" fill="#2b2b2b"/>
  <rect x="185" y="138" width="30" height="4" fill="#1c1c1c"/>

  <!-- 의자 -->
  <rect x="190" y="150" width="8" height="30" fill="#4a3626"/>
  <rect x="222" y="150" width="8" height="30" fill="#4a3626"/>
  <rect x="186" y="140" width="48" height="8" rx="2" fill="#6d4526"/>

  ${decor}
  ${overlay}

  <text x="12" y="212" font-size="11" fill="${textColor}" opacity="0.85">${opts.username ? "@" + escapeXml(opts.username) + " · " : ""}${title} ${room.emoji}</text>
  <text x="${W - 10}" y="212" font-size="10" fill="${subTextColor}" text-anchor="end" opacity="0.75">${days === 0 ? "오늘 커밋함" : days + "일째 미커밋"}</text>
</svg>`;

  return { svg, room };
}
