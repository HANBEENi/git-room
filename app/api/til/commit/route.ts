import { NextRequest } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { commitTilDoc, ensureTilRepo, getOctokit, TIL_REPO_NAME } from "@/lib/github";

/** 경로 세그먼트로 안전하게 쓸 수 있도록 정리 (".."·선행/후행 슬래시·빈 세그먼트 제거). */
function sanitizePathSegment(segment: string): string {
  return segment
    .split("/")
    .map((part) => part.trim())
    .filter((part) => part.length > 0 && part !== "." && part !== "..")
    .join("/");
}

export async function POST(req: NextRequest) {
  const session = (await getServerSession(authOptions)) as any;
  if (!session?.accessToken || !session?.login) {
    return Response.json({ error: "로그인이 필요합니다." }, { status: 401 });
  }

  const body = await req.json().catch(() => null);
  const folder: string = sanitizePathSegment(body?.folder ?? "");
  const fileName: string = sanitizePathSegment(body?.fileName ?? "").replace(/\.md$/i, "");
  const content: string | undefined = body?.body;

  if (!fileName) {
    return Response.json({ error: "파일명을 입력해주세요." }, { status: 400 });
  }
  if (!content || content.trim().length === 0) {
    return Response.json({ error: "문서 내용이 비어있습니다." }, { status: 400 });
  }

  const path = folder ? `${folder}/${fileName}.md` : `${fileName}.md`;

  try {
    const octokit = getOctokit(session.accessToken);
    await ensureTilRepo(octokit, session.login);
    await commitTilDoc(octokit, session.login, path, content, `TIL doc: ${fileName}`);
    return Response.json({
      ok: true,
      path,
      url: `https://github.com/${session.login}/${TIL_REPO_NAME}/blob/HEAD/${path}`,
    });
  } catch (err: any) {
    return Response.json({ error: err.message ?? "커밋 실패" }, { status: 500 });
  }
}
