import { NextRequest } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { commitTil, ensureTilRepo, getOctokit } from "@git-room/shared/github";

export async function POST(req: NextRequest) {
  const session = (await getServerSession(authOptions)) as any;
  if (!session?.accessToken || !session?.login) {
    return Response.json({ error: "로그인이 필요합니다." }, { status: 401 });
  }

  const body = await req.json().catch(() => null);
  const message: string | undefined = body?.message?.trim();

  if (!message || message.length < 1) {
    return Response.json({ error: "오늘 배운 내용을 입력해주세요." }, { status: 400 });
  }
  if (message.length > 300) {
    return Response.json({ error: "300자 이내로 입력해주세요." }, { status: 400 });
  }

  try {
    const octokit = getOctokit(session.accessToken);
    await ensureTilRepo(octokit, session.login); // 없으면 자동 생성
    await commitTil(octokit, session.login, message);
    return Response.json({ ok: true });
  } catch (err: any) {
    return Response.json({ error: err.message ?? "커밋 실패" }, { status: 500 });
  }
}
