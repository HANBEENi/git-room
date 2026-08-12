"use client";

import { useState } from "react";
import { renderRoomSVG, type RoomStage } from "@git-room/shared";

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

export default function RoomDevClient() {
  const [days, setDays] = useState(0);
  const { svg, room } = renderRoomSVG({ username: "preview", daysSinceLastCommit: days });

  return (
    <div className="container">
      <div className="card">
        <h1>🧪 방 상태 미리보기 (dev)</h1>
        <p className="subtitle">
          방치 단계 버튼을 눌러 SVG를 바로 확인합니다. 날씨/시간대 미리보기는 아직 구현 전이라
          버튼이 없습니다.
        </p>

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

        <div className="room-frame" dangerouslySetInnerHTML={{ __html: svg }} />
        <p className="stat" style={{ marginTop: 8 }}>
          stage: {room.stage} (index {room.stageIndex}) · {room.label} · {days}일째 미커밋
        </p>
      </div>
    </div>
  );
}
