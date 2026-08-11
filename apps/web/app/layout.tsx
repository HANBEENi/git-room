import type { Metadata } from "next";
import Providers from "@/components/Providers";
import "./globals.css";

export const metadata: Metadata = {
  title: "Git-Room 🧹 — 커밋 안 하면 방이 더러워져요",
  description: "GitHub 잔디를 심지 않으면 방에 먼지와 거미줄이 쌓이는 커밋 동기부여 서비스",
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="ko">
      <body>
        <Providers>{children}</Providers>
      </body>
    </html>
  );
}
