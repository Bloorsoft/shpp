"use client";

import { signIn, signOut, useSession } from "next-auth/react";

export function LoginButton() {
  const { data: session } = useSession();

  if (!session) {
    return (
      <button
        className="bg-blue-500 text-white px-4 py-2 rounded"
        onClick={() => void signIn("google")}
      >
        Connect Google
      </button>
    );
  }

  return (
    <button
      className="bg-red-500 text-white px-4 py-2 rounded text-sm"
      onClick={() => void signOut()}
    >
      Sign Out
    </button>
  );
}