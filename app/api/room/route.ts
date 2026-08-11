import { NextRequest } from "next/server";
import { fetchPublicContributions } from "@/lib/contributions";
import { renderRoomSVG } from "@/lib/room-svg";

export const runtime = "nodejs";

// GET /api/room?user=octocat
// README에 아래처럼 삽입:
// ![My Git Room](https://<your-domain>/api/room?user=octocat)
export async function GET(req: NextRequest) {
  const username = req.nextUrl.searchParams.get("user")?.trim();

  if (!username) {
    return new Response("Missing ?user= query param", { status: 400 });
  }

  try {
    const { daysSinceLastCommit, currentStreak } = await fetchPublicContributions(username);
    const { svg } = renderRoomSVG({ username, daysSinceLastCommit, currentStreak });

    return new Response(svg, {
      status: 200,
      headers: {
        "Content-Type": "image/svg+xml",
        // GitHub이 README에서 이미지를 캐시/프록시하므로 너무 길지 않게 설정
        "Cache-Control": "public, max-age=1800, s-maxage=1800, stale-while-revalidate=3600",
      },
    });
  } catch (err: any) {
    const { svg } = renderRoomSVG({ username, daysSinceLastCommit: 0 });
    // 실패해도 깨진 이미지 대신 기본 방 SVG를 반환(README에서 보기 흉하지 않도록)
    return new Response(svg, {
      status: 200,
      headers: { "Content-Type": "image/svg+xml", "Cache-Control": "no-store" },
    });
  }
}
