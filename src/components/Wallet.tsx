"use client";

import { useState, useEffect } from "react";
import { useSession } from "next-auth/react";
import { MdOutlineAccountBalanceWallet } from "react-icons/md";
import { Session } from "next-auth";

export default function Wallet({ user }: { user?: Session["user"] }) {
  const { data: session } = useSession();
  const [balance, setBalance] = useState<number | undefined>(user?.wallet);

  useEffect(() => {
    // Update immediately on mount
    setBalance(user?.wallet);

    const interval = setInterval(async () => {
      try {
        // Fetch latest wallet from backend
        const res = await fetch("/api/wallet"); // your API endpoint
        const data = await res.json();
        setBalance(data.wallet); // assuming { wallet: number }
      } catch (err) {
        console.error("Failed to fetch wallet:", err);
      }
    }, 1000); // every 5 seconds

    return () => clearInterval(interval);
  }, [user]);

  return (
    <div className="flex items-center gap-3 bg-zinc-900/70 mx-2 backdrop-blur-md border border-zinc-800 rounded-xl px-4 py-2 hover:border-zinc-700 transition hover:cursor-pointer">
      {/* Icon */}
      <div className="text-2xl text-purple-400 shrink-0">
        <MdOutlineAccountBalanceWallet />
      </div>

      {/* Vertical Separator */}
      <div className="w-px bg-zinc-700 h-12" />

      {/* Balance */}
      <div className="text-left mx-2">
        <p className="text-white/50 text-md font-light">Wallet</p>
        <p className="text-white font-bold text-md tracking-tight">
          ₹{balance ?? "--"}
        </p>
      </div>
    </div>
  );
}
