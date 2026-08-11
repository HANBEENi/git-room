export default function RoomView({ svg, label, days }: { svg: string; label: string; days: number }) {
  return (
    <div>
      <div className="room-frame" dangerouslySetInnerHTML={{ __html: svg }} />
      <p className="stat" style={{ marginTop: 8 }}>
        {label} · {days === 0 ? "오늘 커밋 완료" : `${days}일째 미커밋`}
      </p>
    </div>
  );
}
