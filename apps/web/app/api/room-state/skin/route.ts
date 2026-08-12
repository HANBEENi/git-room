import { NextRequest } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { setSelectedSkin } from "@/lib/room-state";

export async function POST(req: NextRequest) {
  const session = (await getServerSession(authOptions)) as any;
  if (!session?.login) {
    return Response.json({ error: "로그인이 필요합니다." }, { status: 401 });
  }

  const body = await req.json().catch(() => null);
  const skinId: string | undefined = body?.skinId;

  if (!skinId) {
    return Response.json({ error: "skinId가 필요합니다." }, { status: 400 });
  }

  try {
    const state = await setSelectedSkin(session.login, skinId);
    return Response.json(state);
  } catch (err: any) {
    return Response.json({ error: err.message ?? "스킨 변경 실패" }, { status: 400 });
  }
}
