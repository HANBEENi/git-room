import { NextRequest } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { generateTilDoc } from "@/lib/gemini";

export async function POST(req: NextRequest) {
  const session = (await getServerSession(authOptions)) as any;
  if (!session?.accessToken || !session?.login) {
    return Response.json({ error: "로그인이 필요합니다." }, { status: 401 });
  }

  const body = await req.json().catch(() => null);
  const note: string | undefined = body?.note?.trim();

  if (!note || note.length < 1) {
    return Response.json({ error: "정리할 메모를 입력해주세요." }, { status: 400 });
  }

  try {
    const doc = await generateTilDoc(note);
    return Response.json({ ok: true, ...doc });
  } catch (err: any) {
    return Response.json({ error: err.message ?? "문서 생성 실패" }, { status: 500 });
  }
}
