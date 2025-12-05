import { Session } from "next-auth";
import { useSession } from "next-auth/react";
import { MdOutlineAccountBalanceWallet } from "react-icons/md";

export default function Wallet({ user }: { user?: Session["user"] }) {
  const { data: session } = useSession();
  // Dummy balance, replace with actual state if needed
  const walletBalance: undefined | number = session?.user.wallet;

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
          ₹{user?.wallet}
        </p>
      </div>
    </div>
  );
}
