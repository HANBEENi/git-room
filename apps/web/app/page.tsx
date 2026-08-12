import { getServerSession } from "next-auth";
import Link from "next/link";
import { authOptions } from "@/lib/auth";
import { SignInButton } from "@/components/AuthButtons";

export default async function Home() {
  const session = (await getServerSession(authOptions)) as any;
  const exampleUser = "octocat";

  return (
    <main className="container">
      <h1>🧹 Git-Room</h1>
      <p className="subtitle">커밋을 안 하면, 방이 더러워집니다.</p>

      <div className="card" style={{ marginBottom: 20 }}>
        <p style={{ marginTop: 0 }}>
          잔디를 안 심은 기간에 비례해서 방에 쓰레기와 먼지, 거미줄이 쌓여요. 매일 커밋 한 번으로
          방을 깨끗하게 유지해보세요.
        </p>
        <div className="row">
          {session ? (
            <Link className="btn" href="/dashboard">
              내 방 보러가기 →
            </Link>
          ) : (
            <SignInButton />
          )}
        </div>
      </div>

      <div className="card">
        <h3 style={{ marginTop: 0 }}>📌 README에 내 방 위젯 넣기</h3>
        <p className="stat">로그인 없이도 아무 GitHub 유저네임으로 바로 사용 가능합니다.</p>
        <div className="room-frame" style={{ marginBottom: 12 }}>
          {/* eslint-disable-next-line @next/next/no-img-element */}
          <img src={`/api/room?user=${exampleUser}`} alt="Git-Room 예시" width="100%" />
        </div>
        <div className="code-block">{`![My Git Room](https://<your-domain>/api/room?user=YOUR_GITHUB_USERNAME)`}</div>
      </div>
    </main>
  );
}
