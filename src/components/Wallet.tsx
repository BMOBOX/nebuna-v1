"use client";

import { useState, useEffect } from "react";
import { MdOutlineAccountBalanceWallet } from "react-icons/md";
import { Session } from "next-auth";

export default function Wallet({ user }: { user?: Session["user"] }) {
  const [balance, setBalance] = useState<number | undefined>(user?.wallet);

  useEffect(() => {
    if (!user?.user_id) return;

    async function fetchWallet() {
      try {
        const res = await fetch("/api/wallet", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ userId: user?.user_id }),
        });

        const data = await res.json();
        setBalance(data.wallet);
      } catch (err) {
        console.error("Failed to fetch wallet:", err);
      }
    }

    // Fetch immediately on mount
    fetchWallet();

    // Then fetch periodically
    const interval = setInterval(fetchWallet, 2000); // every 2 seconds

    return () => clearInterval(interval);
  }, [user?.user_id]);

  return (
    <div className="flex items-center gap-3 bg-zinc-900/70 mx-2 backdrop-blur-md border border-zinc-800 rounded-xl px-4 py-2 hover:border-zinc-700 transition hover:cursor-pointer">
      <div className="text-2xl text-purple-400 shrink-0">
        <MdOutlineAccountBalanceWallet />
      </div>

      <div className="w-px bg-zinc-700 h-12" />

      <div className="text-left mx-2">
        <p className="text-white/50 text-md font-light">Wallet</p>
        <p className="text-white font-bold text-md tracking-tight">
          ₹{balance?.toLocaleString() ?? "--"}
        </p>
      </div>
    </div>
  );
}
