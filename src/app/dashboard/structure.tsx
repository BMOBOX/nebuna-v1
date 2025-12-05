"use client";

import Search from "@/components/Search";
import Sidebar from "@/components/Sidebar";
import { Session } from "next-auth";

export function Structure({
  children,
  user,
}: {
  children: React.ReactNode;
  user?: Session["user"];
}) {
  return (
    <>
      <div className="flex justify-between h-screen w-screen">
        {/* Left Sidebar */}
        <div className="w-64">
          <Sidebar user={user} />
        </div>

        {/* Right Section fills remaining space */}
        <div className="flex flex-col p-4">
          {/* Search aligned to far right */}
          <div className="flex-1 flex justify-end items-start">
            <Search />
          </div>
          {children}
        </div>
      </div>
    </>
  );
}
