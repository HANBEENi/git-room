"use client";

import { useState } from "react";

const NEW_FOLDER_VALUE = "__new__";

export default function TilDocForm() {
  const [note, setNote] = useState("");
  const [generating, setGenerating] = useState(false);
  const [committing, setCommitting] = useState(false);
  const [notice, setNotice] = useState<{ type: "success" | "error"; text: string } | null>(null);

  const [fileName, setFileName] = useState("");
  const [body, setBody] = useState("");
  const [folders, setFolders] = useState<string[]>([]);
  const [selectedFolder, setSelectedFolder] = useState("");
  const [newFolder, setNewFolder] = useState("");
  const [previewing, setPreviewing] = useState(false);

  async function generate() {
    if (!note.trim()) return;
    setGenerating(true);
    setNotice(null);
    try {
      const [genRes, foldersRes] = await Promise.all([
        fetch("/api/til/generate", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ note }),
        }),
        fetch("/api/til/folders"),
      ]);
      const genData = await genRes.json();
      if (!genRes.ok) throw new Error(genData.error ?? "문서 생성에 실패했습니다.");

      const foldersData = await foldersRes.json().catch(() => ({ folders: [] }));

      setFileName(genData.fileName);
      setBody(genData.body);
      setFolders(foldersData.folders ?? []);
      setSelectedFolder("");
      setNewFolder("");
      setPreviewing(true);
    } catch (err: any) {
      setNotice({ type: "error", text: err.message ?? "오류가 발생했습니다." });
    } finally {
      setGenerating(false);
    }
  }

  async function commit() {
    setCommitting(true);
    setNotice(null);
    try {
      const folder = selectedFolder === NEW_FOLDER_VALUE ? newFolder.trim() : selectedFolder;
      const res = await fetch("/api/til/commit", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ folder, fileName, body }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error ?? "커밋에 실패했습니다.");

      setNotice({
        type: "success",
        text: `✅ 문서가 커밋됐어요. ${data.path}`,
      });
      setPreviewing(false);
      setNote("");
    } catch (err: any) {
      setNotice({ type: "error", text: err.message ?? "오류가 발생했습니다." });
    } finally {
      setCommitting(false);
    }
  }

  function cancel() {
    setPreviewing(false);
    setNotice(null);
  }

  if (previewing) {
    return (
      <div className="card">
        <h3 style={{ marginTop: 0 }}>📝 문서 미리보기</h3>

        <label className="stat">파일명</label>
        <input
          type="text"
          value={fileName}
          onChange={(e) => setFileName(e.target.value)}
          style={{ marginBottom: 10 }}
        />

        <label className="stat">폴더</label>
        <select
          value={selectedFolder}
          onChange={(e) => setSelectedFolder(e.target.value)}
          style={{ marginBottom: 10 }}
        >
          <option value="">(루트에 저장)</option>
          {folders.map((f) => (
            <option key={f} value={f}>
              {f}
            </option>
          ))}
          <option value={NEW_FOLDER_VALUE}>+ 새 폴더 만들기</option>
        </select>

        {selectedFolder === NEW_FOLDER_VALUE && (
          <input
            type="text"
            placeholder="새 폴더 이름 (예: javascript)"
            value={newFolder}
            onChange={(e) => setNewFolder(e.target.value)}
            style={{ marginBottom: 10 }}
          />
        )}

        <label className="stat">내용</label>
        <textarea rows={12} value={body} onChange={(e) => setBody(e.target.value)} />

        <div className="row" style={{ marginTop: 10 }}>
          <button className="btn" onClick={commit} disabled={committing}>
            {committing ? "커밋 중..." : "🧹 커밋하기"}
          </button>
          <button className="btn secondary" onClick={cancel} disabled={committing}>
            취소
          </button>
        </div>
        {notice && <div className={`notice ${notice.type}`}>{notice.text}</div>}
      </div>
    );
  }

  return (
    <div className="card">
      <h3 style={{ marginTop: 0 }}>🤖 AI로 깊게 정리하기</h3>
      <textarea
        rows={3}
        placeholder="예: Next.js App Router의 서버 컴포넌트와 클라이언트 컴포넌트 차이를 배웠다."
        value={note}
        onChange={(e) => setNote(e.target.value)}
      />
      <div className="row" style={{ marginTop: 10 }}>
        <button className="btn" onClick={generate} disabled={generating || !note.trim()}>
          {generating ? "문서 만드는 중..." : "✨ AI로 문서 만들기"}
        </button>
      </div>
      {notice && <div className={`notice ${notice.type}`}>{notice.text}</div>}
    </div>
  );
}
