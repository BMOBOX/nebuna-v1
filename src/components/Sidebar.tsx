"use client";
import { MdOutlineAccountBalanceWallet } from "react-icons/md";
import React from "react";
import Profile from "@/components/Profile";
import { FaWallet, FaExchangeAlt, FaStar, FaChartLine } from "react-icons/fa";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { useSession } from "next-auth/react";
import Wallet from "./Wallet";
import { Session } from "next-auth";

function Sidebar({ user }: { user?: Session["user"] }) {
  const pathname = usePathname();

  const navItems = [
    { name: "Portfolio", icon: <FaWallet />, href: "dashboard/portfolio" },
    {
      name: "Transactions",
      icon: <FaExchangeAlt />,
      href: "dashboard/transactions",
    },
    { name: "Watchlist", icon: <FaStar />, href: "dashboard/watchlist" },
    { name: "Market", icon: <FaChartLine />, href: "dashboard/market" },
  ];

  return (
    <aside className="flex flex-col justify-between h-screen w-64 bg-zinc-950 border-r border-zinc-900">
      {/* Top section */}
      <div>
        <div className="px-6 py-6">
          <h1 className="text-xl font-bold text-white">Nebuna Inc.</h1>
          <p className="text-sm text-gray-400 mt-1">
            Zero risk, Infinite potential
          </p>
        </div>

        {/* ULTRA COMPACT WALLET – Perfect for Navbar */}
        <Wallet user={user} />

        {/* Navigation */}
        <nav className="flex flex-col mt-8 px-2 gap-2">
          {navItems.map((item) => {
            const isActive = pathname === item.href;
            return (
              <Link
                key={item.name}
                href={`/${item.href}`}
                className={`flex items-center gap-3 px-4 py-3 rounded-lg transition-colors ${
                  isActive
                    ? "bg-zinc-800 text-white font-semibold"
                    : "text-gray-300 hover:bg-zinc-900 hover:text-white"
                }`}
              >
                <span className="text-lg">{item.icon}</span>
                <span>{item.name}</span>
              </Link>
            );
          })}
        </nav>
      </div>

      {/* Profile at Bottom */}
      <div>
        <hr className="my-2 border-zinc-700" />
        <Profile user={user} />
      </div>
    </aside>
  );
}

export default Sidebar;
