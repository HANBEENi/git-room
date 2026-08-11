import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { ensureTilRepo, getOctokit, TIL_REPO_NAME } from "@/lib/github";

export async function POST() {
  const session = (await getServerSession(authOptions)) as any;
  if (!session?.accessToken || !session?.login) {
    return Response.json({ error: "로그인이 필요합니다." }, { status: 401 });
  }

  try {
    const octokit = getOctokit(session.accessToken);
    const { created } = await ensureTilRepo(octokit, session.login);
    return Response.json({
      ok: true,
      created,
      repoUrl: `https://github.com/${session.login}/${TIL_REPO_NAME}`,
    });
  } catch (err: any) {
    return Response.json({ error: err.message ?? "레포 생성 실패" }, { status: 500 });
  }
}
