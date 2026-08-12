/** @type {import('next').NextConfig} */
const nextConfig = {
  // @git-room/shared는 빌드 산출물 없이 워크스페이스 심링크로 TS 소스를 그대로 참조하므로,
  // Next가 이를 외부 패키지로 취급하지 않고 직접 transpile하도록 명시.
  transpilePackages: ["@git-room/shared"],
  images: {
    remotePatterns: [{ protocol: "https", hostname: "avatars.githubusercontent.com" }],
  },
};

export default nextConfig;
