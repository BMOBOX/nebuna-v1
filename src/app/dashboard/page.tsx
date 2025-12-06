"use client";
import Search from "@/components/Search";
import Sidebar from "@/components/Sidebar";
import { useSession } from "next-auth/react";
import { redirect } from "next/navigation";
import React, { useEffect } from "react";

function Page() {
  const { data: session, status } = useSession();

  useEffect(() => {
    if (status === "unauthenticated") {
      redirect("/signin");
    }
  }, [status]);

  if (status === "loading") return null;

  return <div className="flex">hi</div>;
}

export default Page;
