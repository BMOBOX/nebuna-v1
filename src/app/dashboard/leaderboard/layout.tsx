import type { Metadata } from "next";
import { Geist, Geist_Mono } from "next/font/google";
import "@/app/globals.css";
import { Structure } from "./structure";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/authOptions";

const geistSans = Geist({
  variable: "--font-geist-sans",
  subsets: ["latin"],
});

const geistMono = Geist_Mono({
  variable: "--font-geist-mono",
  subsets: ["latin"],
});

export const metadata: Metadata = {
  title: "Nebuna | Leaderboard",
  description: "View and compete with other traders on the leaderboard.",
};

export default async function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const session = await getServerSession(authOptions);

  return (
    <Structure user={session?.user}>
      {children}
    </Structure>
  );
}
