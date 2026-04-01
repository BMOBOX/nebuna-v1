"use client";
import Link from "next/link";
import { Roboto, Inter } from "next/font/google";
import { useRouter } from "next/navigation";
import { motion } from "framer-motion";

const roboto = Roboto({
  weight: ["400", "700"],
  subsets: ["latin"],
});

const inter = Inter({
  subsets: ["latin"],
  weight: ["400", "500", "700"],
});

function Header({ showLogo }: { showLogo: boolean }) {
  const navItems = [
    { name: "Home", href: "#" },
    { name: "Features", href: "#" },
    { name: "Pricing", href: "#" },
    { name: "Contact", href: "#" },
  ];

  const logo = showLogo;

  const router = useRouter();

  // Header animation variants
  const headerVariants = {
    hidden: { y: -100, opacity: 0, scale: 0.9 },
    visible: {
      y: 0,
      opacity: 1,
      scale: 1,
      transition: {
        type: "spring" as const,
        stiffness: 300,
        damping: 15,
        bounce: 0.4,
      },
    },
  };

  // Nav item animation variants
  const navItemVariants = {
    hidden: { opacity: 0, y: -10 },
    visible: (i: number) => ({
      opacity: 1,
      y: 0,
      transition: {
        delay: 0.1 + i * 0.05,
        duration: 0.3,
      },
    }),
  };

  // Button animation variants
  const buttonVariants = {
    rest: { scale: 1 },
    hover: { scale: 1.05 },
    tap: { scale: 0.98 },
  };

  return (
    <motion.header
      className={`fixed z-50 top-0 left-0 w-full ${
        logo && "border-b border-gray-900"
      } backdrop-blur-lg`}
      variants={headerVariants}
      initial="hidden"
      animate="visible"
    >
      <div className="flex items-center justify-between py-4 px-32">
        <div>
          <Link href="/" className={`${roboto.className} text-xl font-bold`}>
            Nebuna
          </Link>
        </div>
        {logo && (
          <>
            <motion.nav className={`${inter.className} flex items-center`}>
              <ul className="flex gap-4 px-4 rounded-lg">
                {navItems.map((item, i) => (
                  <motion.li
                    key={item.name}
                    custom={i}
                    variants={navItemVariants}
                    initial="hidden"
                    animate="visible"
                    className="flex items-center px-3 font-medium rounded-lg text-xs text-gray-400 h-8 cursor-pointer hover:bg-zinc-900 hover:text-white"
                  >
                    <Link href={item.href} aria-label={`nav-${item.name}`}>
                      {item.name}
                    </Link>
                  </motion.li>
                ))}
              </ul>
            </motion.nav>
            <div className={`flex items-center gap-2 text-xs ${inter.className}`}>
              <motion.button
                className="text-gray-400 font-medium px-3 cursor-pointer h-8 hover:bg-zinc-900 rounded-lg hover:text-white"
                onClick={() => router.push("/signin")}
                variants={buttonVariants}
                initial="rest"
                whileHover="hover"
                whileTap="tap"
              >
                Sign in
              </motion.button>
              <motion.div
                className="flex rounded-lg h-8 px-3 font-medium items-center justify-center p-px hover:shadow-lg bg-gray-200 hover:bg-white"
                variants={buttonVariants}
                initial="rest"
                whileHover="hover"
                whileTap="tap"
              >
                <button
                  className="cursor-pointer text-black rounded-xl h-full w-full"
                  onClick={() => router.push("/signup")}
                >
                  Sign Up
                </button>
              </motion.div>
            </div>
          </>
        )}
      </div>
    </motion.header>
  );
}

export default Header;
