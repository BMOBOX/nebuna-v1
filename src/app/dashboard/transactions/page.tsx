"use client";
import { useSession } from "next-auth/react";
import { redirect } from "next/navigation";
import { useEffect } from "react";

export default function Page() {
  useEffect(() => {}, [status]);

  return <div className="shadcn-theme dark min-h-screen"></div>;
}
