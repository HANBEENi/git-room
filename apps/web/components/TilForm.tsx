"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";

export default function TilForm() {
  const [message, setMessage] = useState("");
  const [loading, setLoading] = useState(false);
  const [notice, setNotice] = useState<{ type: "success" | "error"; text: string } | null>(null);
  const router = useRouter();

  async function submit() {
    if (!message.trim()) return;
    setLoading(true);
    setNotice(null);
    try {
      const res = await fetch("/api/til", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ message }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error ?? "실패했습니다.");
      setNotice({ type: "success", text: "✅ 오늘의 TIL이 커밋되었어요. 방이 곧 깨끗해집니다!" });
      setMessage("");
      router.refresh();
    } catch (err: any) {
      setNotice({ type: "error", text: err.message ?? "오류가 발생했습니다." });
    } finally {
      setLoading(false);
    }
  }

  return (
    <div className="card">
      <h3 style={{ marginTop: 0 }}>✍️ 오늘 배운 것 한 줄</h3>
      <textarea
        rows={3}
        placeholder="예: Next.js App Router의 서버 컴포넌트와 클라이언트 컴포넌트 차이를 배웠다."
        value={message}
        onChange={(e) => setMessage(e.target.value)}
        maxLength={300}
      />
      <div className="row" style={{ marginTop: 10 }}>
        <button className="btn" onClick={submit} disabled={loading || !message.trim()}>
          {loading ? "커밋 중..." : "🧹 커밋해서 방 청소하기"}
        </button>
        <span className="stat">{message.length}/300</span>
      </div>
      {notice && <div className={`notice ${notice.type}`}>{notice.text}</div>}
    </div>
  );
}
