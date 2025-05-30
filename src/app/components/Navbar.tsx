"use client";

import { useSession, signOut, signIn } from "next-auth/react";
import Link from "next/link";
import React from "react";

export default function Navbar() {
  const { data: session, status } = useSession();

  return (
    <nav className="sticky top-0 z-10 bg-white bg-opacity-90 backdrop-blur-sm shadow-md">
      <div className="px-4 sm:px-6 lg:px-8 flex h-16 items-center justify-between">
        <Link href="/">
          <span className="text-2xl font-bold text-gray-900 cursor-pointer">
            <span className="office-presence-text">Cleanlab Office Presence Dashboard</span>
            <span className="cleanlab-text hidden">Cleanlab</span>
            <style jsx>{`
              @media (max-width: 900px) {
                .office-presence-text {
                  display: none;
                }
                .cleanlab-text {
                  display: inline;
                }
              }
            `}</style>
          </span>
        </Link>
        <div>
          {status === "loading" ? (
            <span className="text-gray-500">Loading...</span>
          ) : session ? (
            <div className="flex items-center space-x-4">
              <span className="text-gray-700 truncate max-w-xs">
                {session.user?.email}
              </span>
              <button
                onClick={() => signOut({ callbackUrl: "/login" })}
                className="px-4 py-2 bg-red-500 text-white rounded-lg hover:bg-red-600 transition cursor-pointer"
              >
                Logout
              </button>
            </div>
          ) : (
            <button
              onClick={() => signIn("google", { callbackUrl: "/" })}
              className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition cursor-pointer"
            >
              Login
            </button>
          )}
        </div>
      </div>
    </nav>
  );
}
