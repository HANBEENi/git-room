import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { getOctokit, listRepoFolders } from "@git-room/shared/github";

export async function GET() {
  const session = (await getServerSession(authOptions)) as any;
  if (!session?.accessToken || !session?.login) {
    return Response.json({ error: "로그인이 필요합니다." }, { status: 401 });
  }

  try {
    const octokit = getOctokit(session.accessToken);
    const folders = await listRepoFolders(octokit, session.login);
    return Response.json({ folders });
  } catch (err: any) {
    return Response.json({ error: err.message ?? "폴더 목록 조회 실패" }, { status: 500 });
  }
}
