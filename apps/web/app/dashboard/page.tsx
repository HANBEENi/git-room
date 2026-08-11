import { getServerSession } from "next-auth";
import { redirect } from "next/navigation";
import { authOptions } from "@/lib/auth";
import { fetchViewerContributions, renderRoomSVG } from "@git-room/shared";
import { getOctokit, TIL_REPO_NAME } from "@git-room/shared/github";
import { SignOutButton } from "@/components/AuthButtons";
import RoomView from "@/components/RoomView";
import TilForm from "@/components/TilForm";
import TilDocForm from "@/components/TilDocForm";
import CreateRepoButton from "@/components/CreateRepoButton";

export default async function Dashboard() {
  const session = (await getServerSession(authOptions)) as any;
  if (!session?.accessToken || !session?.login) {
    redirect("/");
  }

  const { daysSinceLastCommit, currentStreak } = await fetchViewerContributions(session.accessToken);
  const { svg, room } = renderRoomSVG({
    username: session.login,
    daysSinceLastCommit,
    currentStreak,
  });

  let hasRepo = false;
  let repoUrl = `https://github.com/${session.login}/${TIL_REPO_NAME}`;
  try {
    const octokit = getOctokit(session.accessToken);
    await octokit.rest.repos.get({ owner: session.login, repo: TIL_REPO_NAME });
    hasRepo = true;
  } catch {
    hasRepo = false;
  }

  const badgeUrl = `https://<your-domain>/api/room?user=${session.login}`;

  return (
    <main className="container">
      <div className="row" style={{ justifyContent: "space-between", marginBottom: 20 }}>
        <h1 style={{ margin: 0 }}>🧹 @{session.login}의 방</h1>
        <SignOutButton />
      </div>

      <div className="card" style={{ marginBottom: 16 }}>
        <RoomView svg={svg} label={room.label} days={daysSinceLastCommit} />
        <p className="stat">🔥 현재 연속 커밋: {currentStreak}일</p>
      </div>

      <div style={{ display: "grid", gap: 16, marginBottom: 16 }}>
        <TilForm />
        <TilDocForm />
        <CreateRepoButton hasRepo={hasRepo} repoUrl={repoUrl} />
      </div>

      <div className="card">
        <h3 style={{ marginTop: 0 }}>📌 내 README에 이 방 붙여넣기</h3>
        <div className="code-block">{`![My Git Room](${badgeUrl})`}</div>
      </div>
    </main>
  );
}
