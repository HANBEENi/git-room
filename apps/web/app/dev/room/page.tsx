import { notFound } from "next/navigation";
import RoomDevClient from "./room-dev-client";

// 방 상태 미리보기용 개발 전용 페이지. 배포된 서비스 화면에는 노출할 필요가
// 없어서 프로덕션 빌드에서는 404 처리.
export default function RoomDevPage() {
  if (process.env.NODE_ENV === "production") {
    notFound();
  }

  return <RoomDevClient />;
}
