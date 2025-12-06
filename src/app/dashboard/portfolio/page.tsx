"use client";
import Transactions from "@/components/Transactions";
import { useSession } from "next-auth/react";
import router from "next/router";
import { useEffect } from "react";

export default function Page() {
  const { data: session, status } = useSession();
  useEffect(() => {
    if (status === "unauthenticated") {
      router.replace("/signin");
    }
  }, [status, router]);

  if (status === "loading") return null;
  return (
    <div className="shadcn-theme dark min-h-screen">
      <h1 className="text-3xl font-bold tracking-tight mb-6">Portfolio</h1>
    </div>
  );
}
