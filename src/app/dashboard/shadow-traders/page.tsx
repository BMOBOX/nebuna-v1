import { redirect } from "next/navigation";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/authOptions";
import { Structure } from "./structure";

export default async function ShadowTradersPage() {
  const session = await getServerSession(authOptions);

  if (!session) {
    redirect("/signin");
  }

  return (
    <Structure user={session.user}>
      <div className="h-full" />
    </Structure>
  );
}
