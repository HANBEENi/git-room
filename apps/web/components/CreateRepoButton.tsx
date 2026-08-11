"use client";

import { useState } from "react";

export default function CreateRepoButton({ hasRepo, repoUrl }: { hasRepo: boolean; repoUrl: string }) {
  const [loading, setLoading] = useState(false);
  const [notice, setNotice] = useState<{ type: "success" | "error"; text: string } | null>(null);
  const [url, setUrl] = useState(repoUrl);
  const [created, setCreated] = useState(hasRepo);

  async function create() {
    setLoading(true);
    setNotice(null);
    try {
      const res = await fetch("/api/create-repo", { method: "POST" });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error ?? "실패했습니다.");
      setUrl(data.repoUrl);
      setCreated(true);
      setNotice({ type: "success", text: "✅ my-daily-learning 레포가 준비됐어요." });
    } catch (err: any) {
      setNotice({ type: "error", text: err.message ?? "오류가 발생했습니다." });
    } finally {
      setLoading(false);
    }
  }

  return (
    <div className="card">
      <h3 style={{ marginTop: 0 }}>📁 TIL 전용 레포</h3>
      {created ? (
        <p className="stat">
          <a href={url} target="_blank" rel="noreferrer">
            {url}
          </a>{" "}
          에 기록 중입니다.
        </p>
      ) : (
        <>
          <p className="stat">잔디 심을 레포가 없다면, 버튼 한 번으로 자동 생성해드려요.</p>
          <button className="btn secondary" onClick={create} disabled={loading}>
            {loading ? "생성 중..." : "my-daily-learning 레포 만들기"}
          </button>
        </>
      )}
      {notice && <div className={`notice ${notice.type}`}>{notice.text}</div>}
    </div>
  );
}
