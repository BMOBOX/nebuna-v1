"use client";

import { useState, useEffect } from "react";
import { MdOutlineAccountBalanceWallet } from "react-icons/md";
import { Session } from "next-auth";
import { motion } from "framer-motion";

export default function Wallet({ user }: { user?: Session["user"] }) {
  const [balance, setBalance] = useState<number | undefined>(user?.wallet);

  // Animation variants
  const walletVariants = {
    hidden: { opacity: 0, scale: 0.5 },
    visible: {
      opacity: 1,
      scale: 1,
      transition: {
        type: "spring" as const,
        stiffness: 400,
        damping: 10,
        bounce: 0.5,
      },
    },
  };

  // Balance animation when value changes
  const [prevBalance, setPrevBalance] = useState<number | undefined>(balance);

  useEffect(() => {
    if (balance !== prevBalance && balance !== undefined) {
      setPrevBalance(balance);
    }
  }, [balance, prevBalance]);

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
    const interval = setInterval(fetchWallet, 60000); // every

    return () => clearInterval(interval);
  }, [user?.user_id]);

  return (
    <motion.div
      className="flex items-center gap-3 bg-zinc-900/70 mx-2 backdrop-blur-md border border-zinc-800 rounded-xl px-4 py-2 hover:border-zinc-700 transition hover:cursor-pointer"
      variants={walletVariants}
      initial="hidden"
      animate="visible"
      whileHover={{ scale: 1.02 }}
      whileTap={{ scale: 0.98 }}
    >
      <div className="text-2xl text-purple-400 shrink-0">
        <MdOutlineAccountBalanceWallet />
      </div>

      <div className="w-px bg-zinc-700 h-12" />

      <div className="text-left mx-2">
        <p className="text-white/50 text-md font-light">Wallet</p>
        <motion.p
          className="text-white font-bold text-md tracking-tight"
          key={balance}
          initial={{ opacity: 0, y: -5 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.2 }}
        >
          ₹{balance?.toLocaleString() ?? "--"}
        </motion.p>
      </div>
    </motion.div>
  );
}
