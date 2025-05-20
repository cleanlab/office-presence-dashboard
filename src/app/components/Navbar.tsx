"use client";

import { useSession, signOut, signIn } from "next-auth/react";
import Link from "next/link";
import React from "react";

export default function Navbar() {
  const { data: session, status } = useSession();

  const handleSignIn = () => {
    signIn("google", { callbackUrl: "/" });
  };

  const handleSignOut = () => {
    signOut({ callbackUrl: "/login" });
  };

  return (
    <nav className="w-full bg-white border-b p-4 flex justify-between items-center">
      <Link href="/">
        <span className="text-xl font-semibold cursor-pointer">
          Office Presence Dashboard
        </span>
      </Link>
      <div>
        {status === "loading" ? (
          <span>Loading...</span>
        ) : session ? (
          <div className="flex items-center space-x-4">
            <span className="text-gray-700">{session.user?.email}</span>
            <button
              onClick={handleSignOut}
              className="px-4 py-2 bg-red-500 text-white rounded hover:bg-red-600"
            >
              Logout
            </button>
          </div>
        ) : (
          <button
            onClick={handleSignIn}
            className="px-4 py-2 bg-blue-500 text-white rounded hover:bg-blue-600"
          >
            Login with Google
          </button>
        )}
      </div>
    </nav>
  );
}
