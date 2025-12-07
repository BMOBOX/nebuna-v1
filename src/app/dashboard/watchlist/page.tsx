"use client";
import { useSession } from "next-auth/react";
import { redirect } from "next/navigation";
import { useEffect } from "react";

export default function Page() {
  const { data: session, status } = useSession();
  useEffect(() => {
    if (status === "unauthenticated") {
      redirect("/signin");
    }
  }, [status]);

  if (status === "loading") return null;
  return <div className="shadcn-theme dark min-h-screen"></div>;
}
