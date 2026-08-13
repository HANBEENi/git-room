"use client";

import { useState } from "react";
import { renderRoomSVG, type RoomStage, type TimeOfDay, type Season } from "@git-room/shared";

const STAGE_PREVIEWS: { stage: RoomStage; days: number; label: string }[] = [
  { stage: "clean", days: 0, label: "00 깨끗한 방 · 0일" },
  { stage: "light", days: 1, label: "01 종이 · 1~2일" },
  { stage: "moderate", days: 3, label: "02 쓰레기+먼지 · 3~6일" },
  { stage: "neglected", days: 7, label: "03 거미줄 · 7~10일" },
  { stage: "cluttered", days: 11, label: "04 옷가지 · 11~15일" },
  { stage: "infested", days: 16, label: "05 날파리 · 16~19일" },
  { stage: "moldy", days: 20, label: "06 곰팡이 · 20~25일" },
  { stage: "gloomy", days: 26, label: "07 빛 안 듦 · 26~29일" },
  { stage: "abandoned", days: 30, label: "08 버려짐 · 30~39일" },
  { stage: "cracked", days: 40, label: "09 금 감 · 40~89일" },
  { stage: "withered", days: 90, label: "10 화분 시듦 · 3개월~" },
  { stage: "ruined", days: 180, label: "11 폐허 · 6개월~" },
  { stage: "wasteland", days: 365, label: "12 쓰레기 뒤덮임 · 1년~" },
];

// 각 시간대/계절을 대표하는 시각(hour)/월(month) — getTimeOfDay·getSeason 판정 구간 안의 값
const TIME_PREVIEWS: { time: TimeOfDay; hour: number; label: string }[] = [
  { time: "dawn", hour: 6, label: "새벽녘" },
  { time: "morning", hour: 9, label: "아침" },
  { time: "day", hour: 13, label: "낮" },
  { time: "sunset", hour: 18, label: "노을" },
  { time: "night", hour: 22, label: "밤" },
];

const SEASON_PREVIEWS: { season: Season; month: number; label: string }[] = [
  { season: "spring", month: 4, label: "봄" },
  { season: "summer", month: 7, label: "여름" },
  { season: "fall", month: 10, label: "가을" },
  { season: "winter", month: 1, label: "겨울" },
];

export default function RoomDevClient() {
  const [days, setDays] = useState(0);
  const [hour, setHour] = useState(13);
  const [month, setMonth] = useState(4);

  const now = new Date(2026, month - 1, 15, hour, 0, 0);
  const { svg, room } = renderRoomSVG({ username: "preview", daysSinceLastCommit: days, now });

  return (
    <div className="container">
      <div className="card">
        <h1>🧪 방 상태 미리보기 (dev)</h1>
        <p className="subtitle">
          방치 단계 · 시간대 · 계절 버튼을 눌러 SVG를 바로 확인합니다. 날씨는 아직 구현 전이라
          버튼이 없습니다.
        </p>

        <p className="stat">방치 단계</p>
        <div className="row" style={{ marginBottom: 16 }}>
          {STAGE_PREVIEWS.map((s) => (
            <button
              key={s.stage}
              className={`btn ${s.stage === room.stage ? "" : "secondary"}`}
              onClick={() => setDays(s.days)}
            >
              {s.label}
            </button>
          ))}
        </div>

        <p className="stat">시간대</p>
        <div className="row" style={{ marginBottom: 16 }}>
          {TIME_PREVIEWS.map((t) => (
            <button
              key={t.time}
              className={`btn ${t.hour === hour ? "" : "secondary"}`}
              onClick={() => setHour(t.hour)}
            >
              {t.label}
            </button>
          ))}
        </div>

        <p className="stat">계절</p>
        <div className="row" style={{ marginBottom: 16 }}>
          {SEASON_PREVIEWS.map((s) => (
            <button
              key={s.season}
              className={`btn ${s.month === month ? "" : "secondary"}`}
              onClick={() => setMonth(s.month)}
            >
              {s.label}
            </button>
          ))}
        </div>

        <div className="room-frame" dangerouslySetInnerHTML={{ __html: svg }} />
        <p className="stat" style={{ marginTop: 8 }}>
          stage: {room.stage} (index {room.stageIndex}) · {room.label} · {days}일째 미커밋
        </p>
      </div>
    </div>
  );
}
