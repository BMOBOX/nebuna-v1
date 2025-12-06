import type { Metadata } from "next";
import { Geist, Geist_Mono } from "next/font/google";
import "@/app/globals.css";
import { Structure } from "./structure";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/authOptions";
import { supabase } from "@/lib/supabase"; // make sure this exists

const geistSans = Geist({
  variable: "--font-geist-sans",
  subsets: ["latin"],
});

const geistMono = Geist_Mono({
  variable: "--font-geist-mono",
  subsets: ["latin"],
});

export const metadata: Metadata = {
  title: "Nebuna | From paper to profit",
  description:
    "Experience paper trading with real-time data, live charts, and a clean user interface.",
};

export default async function RootLayout({
  children,
  params,
}: {
  children: React.ReactNode;
  params: Promise<{ stock: string }>; // dynamic route like /stocks/[stock]
}) {
  const params_ = await params; // stock name from URL

  const session = await getServerSession(authOptions);

  let watchlist = false;
  let orders: any[] = [];

  if (session?.user?.user_id) {
    try {
      // Fetch watchlist
      const res = await fetch(
        `${process.env.NEXT_PUBLIC_URL}/api/watchlist/get`,
        {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ userId: session.user.user_id }),
        }
      );

      // Fetch orders for the specific stock only
      const orders_res = await fetch(
        `${process.env.NEXT_PUBLIC_URL}/api/stocks`,
        {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            userId: session.user.user_id,
            symbol: params_.stock,
          }),
        }
      );

      const orders_data = await orders_res.json();
      orders = orders_data?.order || [];

      if (res.ok) {
        const data = await res.json();
        watchlist = data.watchlist.find(
          (item: any) => item.symbol === params_.stock
        );
      }
    } catch (err) {
      console.error("Fetch watchlist/orders failed:", err);
    }
  }

  return (
    <Structure watchlist_={watchlist} orders_={orders}>
      {children}
    </Structure>
  );
}
