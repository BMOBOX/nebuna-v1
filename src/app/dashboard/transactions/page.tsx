"use client";
import Transactions from "@/components/Transactions";
import { transaction } from "nebuna";
import { useSession } from "next-auth/react";
import { redirect } from "next/navigation";
import { useEffect } from "react";

function Page() {
  const { data: session, status } = useSession();

  useEffect(() => {
    if (status === "unauthenticated") {
      redirect("/signin");
    }
    if (status === "authenticated") {
      redirect("/dashboard/portfolio");
    }
  }, [status]);

  if (status === "loading") return null;

  return null;
}
