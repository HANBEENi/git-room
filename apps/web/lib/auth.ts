import type { NextAuthOptions } from "next-auth";
import GitHubProvider from "next-auth/providers/github";

// repo 스코프: 대시보드에서 TIL 레포 생성 + 파일 커밋을 하려면 필요.
// (공개 레포만 다룰 거라면 "public_repo"로 좁혀도 됨)
export const authOptions: NextAuthOptions = {
  providers: [
    GitHubProvider({
      clientId: process.env.GITHUB_ID as string,
      clientSecret: process.env.GITHUB_SECRET as string,
      authorization: { params: { scope: "read:user repo" } },
    }),
  ],
  callbacks: {
    async jwt({ token, account, profile }) {
      if (account) {
        token.accessToken = account.access_token;
      }
      if (profile) {
        token.login = (profile as any).login;
      }
      return token;
    },
    async session({ session, token }) {
      (session as any).accessToken = token.accessToken;
      (session as any).login = token.login;
      return session;
    },
  },
  pages: {
    signIn: "/",
  },
};
