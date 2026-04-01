"use client";

import Image from "next/image";
import React, { useState, useRef, useEffect } from "react";
import { IoMdNotificationsOutline } from "react-icons/io";
import { MdLogout } from "react-icons/md";
import { useSession, signOut } from "next-auth/react";
import { Session } from "next-auth";
import { motion, AnimatePresence } from "framer-motion";

function Profile({ user }: { user?: Session["user"] }) {
  const [isOpen, setIsOpen] = useState(false);
  const menuRef = useRef<HTMLDivElement>(null);
  const buttonRef = useRef<HTMLDivElement>(null);

  const { data: session } = useSession();

  const userName = user?.username ?? "Guest";
  const userEmail = user?.email ?? "No email available";
  const userImage = session?.user?.image ?? "/favicon.ico";

  // Toggle dropdown
  const toggleWindow = () => {
    setIsOpen((prev) => !prev);
  };

  // Close when clicking outside
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (
        menuRef.current &&
        !menuRef.current.contains(event.target as Node) &&
        buttonRef.current &&
        !buttonRef.current.contains(event.target as Node)
      ) {
        setIsOpen(false);
      }
    };

    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, []);

  return (
    <div className="relative flex items-center justify-between ml-1 mr-1 pb-2">
      {/* Profile Button */}
      <motion.div
        ref={buttonRef}
        className="flex items-center w-full gap-2 p-2 rounded-lg cursor-pointer hover:bg-zinc-900 transition-colors duration-200"
        onClick={toggleWindow}
        whileHover={{ scale: 1.02 }}
        whileTap={{ scale: 0.98 }}
      >
        <div>
          <Image
            src={userImage}
            alt={"Profile"}
            width={40}
            height={40}
            className="rounded-full"
          />
        </div>

        <div className="flex flex-col min-w-0 justify-center grow">
          <p className="text-md font-bold truncate leading-tight text-cyan-50">
            {userName}
          </p>
          <p className="text-xs font-medium text-gray-400 truncate">
            {userEmail}
          </p>
        </div>

        <motion.div
          animate={{ rotate: isOpen ? 180 : 0 }}
          transition={{ duration: 0.2 }}
        >
          <Image
            src="/unfold_more.svg"
            alt="Arrow Down"
            width={25}
            height={25}
          />
        </motion.div>
      </motion.div>

      {/* Floating Window */}
      <AnimatePresence>
        {isOpen && (
          <motion.div
            ref={menuRef}
            className="absolute top-auto bottom-0 left-full ml-2 bg-zinc-900 text-white shadow-lg rounded-lg p-3 w-60 z-50"
            initial={{ opacity: 0, x: -20, scale: 0.9 }}
            animate={{ opacity: 1, x: 0, scale: 1 }}
            exit={{ opacity: 0, x: -20, scale: 0.9 }}
            transition={{ type: "spring", stiffness: 400, damping: 15, bounce: 0.4 }}
          >
          {/* User Info */}
          <div className="flex items-center gap-2">
            <Image
              src={userImage}
              alt={"Profile"}
              width={32}
              height={32}
              className="rounded-full w-8 h-8"
            />
            <div className="flex flex-col min-w-0 justify-center">
              <p className="text-sm font-bold truncate">{userName}</p>
              <p className="text-xs text-gray-400 truncate">{userEmail}</p>
            </div>
          </div>

          <hr className="my-2 border-zinc-700" />

          <div className="flex gap-1.5 p-2 cursor-pointer rounded hover:bg-zinc-700">
            <Image src="/profile.webp" alt="Account" width={20} height={20} />
            <button className="w-full text-left text-sm cursor-pointer">
              Account
            </button>
          </div>

          <div className="flex gap-1.5 p-2 cursor-pointer rounded hover:bg-zinc-700">
            <IoMdNotificationsOutline className="text-lg" />
            <button className="w-full text-left text-sm cursor-pointer">
              Notifications
            </button>
          </div>

          <hr className="my-2 border-zinc-700" />

          <div
            className="flex gap-1.5 p-2 cursor-pointer rounded hover:bg-red-400/2 transition-all duration-300 group relative overflow-hidden"
            onClick={() => signOut()}
          >
            <MdLogout className="text-lg text-red-500 group-hover:scale-110 transition-transform" />
            <span className="text-sm font-medium text-red-500 group-hover:text-red-400 transition-colors">
              Logout
            </span>

            {/* Tiny red pulse on hover */}
            <div className="absolute inset-0 bg-red-500 opacity-0 group-hover:opacity-10 transition-opacity" />
          </div>
        </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}

export default Profile;
