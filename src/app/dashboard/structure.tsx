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
    <div className="flex h-screen w-screen bg-background text-foreground">
      {/* === LEFT SIDEBAR === */}
      <aside className="w-64 shrink-0 border-r border-border">
        <Sidebar user={user} />
      </aside>

      {/* === MAIN CONTENT AREA === */}
      <main className="flex-1 flex flex-col overflow-hidden">
        {/* Top bar with Search on the far right */}
        <header className="flex items-center justify-end p-4">
          <Search />
        </header>

        {/* Page content – takes all remaining space */}
        <section className="flex-1 overflow-y-auto p-6">{children}</section>
      </main>
    </div>
  );
}
