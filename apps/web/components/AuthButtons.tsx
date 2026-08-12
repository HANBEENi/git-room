"use client";

import { signIn, signOut } from "next-auth/react";

export function SignInButton() {
  return (
    <button className="btn" onClick={() => signIn("github", { callbackUrl: "/dashboard" })}>
      🐙 GitHub으로 로그인
    </button>
  );
}

export function SignOutButton() {
  return (
    <button className="btn secondary" onClick={() => signOut({ callbackUrl: "/" })}>
      로그아웃
    </button>
  );
}
