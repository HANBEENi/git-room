import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { getRoomState } from "@/lib/room-state";

export async function GET() {
  const session = (await getServerSession(authOptions)) as any;
  if (!session?.login) {
    return Response.json({ error: "로그인이 필요합니다." }, { status: 401 });
  }

  try {
    const state = await getRoomState(session.login);
    return Response.json(state);
  } catch (err: any) {
    return Response.json({ error: err.message ?? "방 상태 조회 실패" }, { status: 500 });
  }
}
