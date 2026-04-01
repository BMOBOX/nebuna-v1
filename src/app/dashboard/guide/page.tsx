"use client";

import { motion, useScroll, useTransform } from "framer-motion";
import Link from "next/link";
import { useState } from "react";
import { 
  FaWallet, FaExchangeAlt, FaStar, FaTrophy, FaEye, FaSearch, 
  FaChartLine, FaRobot, FaQuestionCircle, FaArrowLeft, FaCheckCircle,
  FaPlay, FaClock, FaSignal, FaUsers, FaGraduationCap, FaLightbulb,
  FaChevronDown, FaChevronUp, FaQuoteLeft
} from "react-icons/fa";

export default function GuidePage() {
  const [openFAQ, setOpenFAQ] = useState<number | null>(null);
  const { scrollYProgress } = useScroll();
  const backgroundY = useTransform(scrollYProgress, [0, 1], ["0%", "50%"]);

  const features = [
    {
      icon: <FaWallet />,
      title: "Portfolio",
      description: "View your holdings, track your investment performance, and see your portfolio value in real-time.",
      link: "/dashboard/portfolio",
      color: "from-blue-500 to-cyan-500",
    },
    {
      icon: <FaExchangeAlt />,
      title: "Transactions",
      description: "Review your complete trading history including all buy and sell orders.",
      link: "/dashboard/transactions",
      color: "from-purple-500 to-pink-500",
    },
    {
      icon: <FaStar />,
      title: "Watchlist",
      description: "Create a personalized watchlist of stocks you want to track without investing.",
      link: "/dashboard/watchlist",
      color: "from-yellow-500 to-orange-500",
    },
    {
      icon: <FaTrophy />,
      title: "Leaderboard",
      description: "Compete with other traders and see how your portfolio performance ranks.",
      link: "/dashboard/leaderboard",
      color: "from-green-500 to-emerald-500",
    },
    {
      icon: <FaEye />,
      title: "Shadow Traders",
      description: "Follow and copy the trades of successful traders in real-time.",
      link: "/dashboard/shadow-traders",
      color: "from-red-500 to-rose-500",
    },
    {
      icon: <FaSearch />,
      title: "Stock Search",
      description: "Search for any stock by symbol or name to view details and make trades.",
      link: "/dashboard",
      color: "from-indigo-500 to-violet-500",
    },
  ];

  const howToSteps = [
    {
      number: "01",
      title: "Search for a Stock",
      description: "Use the search bar in the top right to find any stock by its ticker symbol or company name.",
      icon: <FaSearch />,
    },
    {
      number: "02",
      title: "View Stock Details",
      description: "Click on a stock to see detailed information including charts, price history, and company data.",
      icon: <FaChartLine />,
    },
    {
      number: "03",
      title: "Buy or Sell",
      description: "Execute trades using your virtual wallet. Choose the number of shares and confirm your order.",
      icon: <FaExchangeAlt />,
    },
    {
      number: "04",
      title: "Track Your Portfolio",
      description: "Monitor your holdings and performance in the Portfolio section. Watch your virtual portfolio grow!",
      icon: <FaWallet />,
    },
  ];

  const faqs = [
    {
      question: "How do I start trading?",
      answer: "Simply search for any stock using the search bar, click on it to view details, and use the Buy button to purchase shares with your virtual wallet. You start with $100,000 in virtual money!",
    },
    {
      question: "Is this real money?",
      answer: "No! Nebuna is a paper trading simulator. You trade with virtual money, so there's no real financial risk. However, stock prices are real-time market prices.",
    },
    {
      question: "How do I track my performance?",
      answer: "Visit the Portfolio section to see your holdings, total value, and performance over time. You can also compare your results on the Leaderboard!",
    },
    {
      question: "What are Shadow Traders?",
      answer: "Shadow Traders allows you to follow successful traders and automatically copy their trades. It's a great way to learn from experienced investors!",
    },
    {
      question: "Can I reset my portfolio?",
      answer: "Currently, each session starts fresh with $100,000. Your trading history is saved so you can review your past decisions.",
    },
    {
      question: "How do I add stocks to my watchlist?",
      answer: "When viewing a stock detail page, click the Star icon to add it to your watchlist. You can then track these stocks from the Watchlist section.",
    },
  ];

  const tips = [
    {
      title: "Start Small",
      emoji: "🌱",
      content: "Begin with small positions to minimize risk while you learn the ropes. You can always add more later!",
    },
    {
      title: "Diversify",
      emoji: "🌈",
      content: "Don't put all your virtual eggs in one basket. Spread your investments across different sectors.",
    },
    {
      title: "Keep a Journal",
      emoji: "📓",
      content: "Track your decisions and learn from both successes and mistakes. This helps improve over time.",
    },
    {
      title: "Stay Informed",
      emoji: "📰",
      content: "Pay attention to market news and trends. Understanding the broader market helps make better decisions.",
    },
  ];

  const containerVariants = {
    hidden: { opacity: 0 },
    visible: {
      opacity: 1,
      transition: { staggerChildren: 0.1, delayChildren: 0.2 },
    },
  };

  const itemVariants = {
    hidden: { opacity: 0, y: 30 },
    visible: {
      opacity: 1,
      y: 0,
      transition: { type: "spring" as const, stiffness: 100, damping: 12 },
    },
  };

  return (
    <div className="min-h-screen bg-zinc-950 text-white overflow-x-hidden">
      {/* Animated Background */}
      <motion.div 
        className="fixed inset-0 pointer-events-none"
        style={{ y: backgroundY }}
      >
        <div className="absolute top-20 left-10 w-72 h-72 bg-blue-500/10 rounded-full blur-3xl" />
        <div className="absolute top-40 right-20 w-96 h-96 bg-purple-500/10 rounded-full blur-3xl" />
        <div className="absolute bottom-20 left-1/3 w-80 h-80 bg-pink-500/10 rounded-full blur-3xl" />
      </motion.div>

      {/* Progress Bar */}
      <motion.div
        className="fixed top-0 left-0 right-0 h-1 bg-gradient-to-r from-blue-500 via-purple-500 to-pink-500 z-50"
        style={{ scaleX: scrollYProgress, transformOrigin: "0%" }}
      />

      <motion.div
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        transition={{ duration: 0.5 }}
        className="relative z-10 max-w-6xl mx-auto px-6 py-12"
      >
        {/* Back Button */}
        <motion.div
          initial={{ opacity: 0, x: -20 }}
          animate={{ opacity: 1, x: 0 }}
          transition={{ delay: 0.1 }}
          className="mb-8"
        >
          <Link
            href="/dashboard"
            className="inline-flex items-center gap-2 text-gray-400 hover:text-white transition-colors bg-zinc-900/50 px-4 py-2 rounded-lg"
          >
            <FaArrowLeft />
            <span>Back to Dashboard</span>
          </Link>
        </motion.div>

        {/* Hero Section */}
        <motion.div
          initial={{ opacity: 0, y: 30 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.2 }}
          className="text-center mb-20"
        >
          <motion.div
            initial={{ scale: 0.8, opacity: 0 }}
            animate={{ scale: 1, opacity: 1 }}
            transition={{ delay: 0.3, type: "spring" }}
            className="inline-flex items-center gap-2 bg-gradient-to-r from-blue-500/20 to-purple-500/20 px-4 py-2 rounded-full mb-6"
          >
            <FaGraduationCap className="text-blue-400" />
            <span className="text-blue-400 font-medium">Complete Guide</span>
          </motion.div>
          
          <motion.h1
            initial={{ opacity: 0, scale: 0.9 }}
            animate={{ opacity: 1, scale: 1 }}
            transition={{ delay: 0.4 }}
            className="text-5xl md:text-7xl font-bold mb-6"
          >
            <span className="bg-gradient-to-r from-blue-400 via-purple-500 to-pink-500 bg-clip-text text-transparent">
              Nebuna Guide
            </span>
          </motion.h1>
          
          <motion.p
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ delay: 0.5 }}
            className="text-xl text-gray-400 max-w-3xl mx-auto"
          >
            Your complete guide to mastering paper trading. Learn how to navigate the platform, execute trades, and build your investment skills risk-free.
          </motion.p>
        </motion.div>

        {/* What is Nebuna */}
        <motion.section
          initial={{ opacity: 0, y: 50 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          transition={{ duration: 0.6 }}
          className="mb-24"
        >
          <div className="flex items-center gap-3 mb-8">
            <div className="w-12 h-12 bg-gradient-to-br from-blue-500 to-purple-500 rounded-xl flex items-center justify-center">
              <FaQuestionCircle className="text-white w-6 h-6" />
            </div>
            <h2 className="text-3xl font-bold">What is Nebuna?</h2>
          </div>
          
          <div className="bg-gradient-to-br from-zinc-900/80 to-zinc-800/50 border border-zinc-700/50 rounded-3xl p-8 md:p-12">
            <p className="text-gray-300 leading-relaxed text-lg mb-8">
              <span className="text-blue-400 font-semibold text-xl">Nebuna</span> is a <span className="text-purple-400 font-semibold">paper trading platform</span> that allows you to practice stock trading without risking real money. 
              You start with a virtual wallet of <span className="text-green-400 font-semibold">$100,000</span> and can trade stocks in real-time using actual market prices.
            </p>
            
            <h3 className="text-xl font-semibold mb-6 text-white">Why use Nebuna?</h3>
            <div className="grid md:grid-cols-2 gap-4">
              {[
                { title: "Learn Trading", desc: "Understand how the stock market works" },
                { title: "Test Strategies", desc: "Try different trading strategies risk-free" },
                { title: "Build Confidence", desc: "Gain experience before trading real money" },
                { title: "Practice Analysis", desc: "Technical and fundamental analysis practice" },
              ].map((item, index) => (
                <motion.div
                  key={index}
                  initial={{ opacity: 0, x: -20 }}
                  whileInView={{ opacity: 1, x: 0 }}
                  viewport={{ once: true }}
                  transition={{ delay: index * 0.1 }}
                  className="flex items-start gap-3 bg-zinc-800/50 p-4 rounded-xl"
                >
                  <FaCheckCircle className="text-green-400 mt-1 shrink-0" />
                  <div>
                    <span className="font-semibold text-white">{item.title}</span>
                    <p className="text-gray-400 text-sm">{item.desc}</p>
                  </div>
                </motion.div>
              ))}
            </div>
          </div>
        </motion.section>

        {/* How to Trade */}
        <motion.section
          variants={containerVariants}
          initial="hidden"
          whileInView="visible"
          viewport={{ once: true }}
          className="mb-24"
        >
          <div className="flex items-center gap-3 mb-8">
            <div className="w-12 h-12 bg-gradient-to-br from-purple-500 to-pink-500 rounded-xl flex items-center justify-center">
              <FaChartLine className="text-white w-6 h-6" />
            </div>
            <h2 className="text-3xl font-bold">How to Trade</h2>
          </div>
          
          <div className="grid md:grid-cols-2 lg:grid-cols-4 gap-6">
            {howToSteps.map((step, index) => (
              <motion.div
                key={index}
                variants={itemVariants}
                whileHover={{ scale: 1.02, y: -5 }}
                className="relative bg-gradient-to-br from-zinc-900/80 to-zinc-800/50 border border-zinc-700/50 rounded-2xl p-6 group"
              >
                {/* Decorative gradient */}
                <div className={`absolute inset-0 bg-gradient-to-br ${index % 2 === 0 ? 'from-blue-500/10' : 'from-purple-500/10'} to-transparent rounded-2xl opacity-0 group-hover:opacity-100 transition-opacity`} />
                
                <div className="absolute top-4 right-4 w-16 h-16 bg-gradient-to-br from-zinc-700/50 to-zinc-800/50 rounded-full flex items-center justify-center">
                  <span className="text-2xl font-bold text-zinc-600">{step.number}</span>
                </div>
                
                <div className="relative z-10">
                  <div className="w-12 h-12 bg-gradient-to-br from-blue-500/20 to-purple-500/20 rounded-xl flex items-center justify-center mb-4 text-blue-400">
                    {step.icon}
                  </div>
                  <h3 className="text-lg font-semibold mb-2">{step.title}</h3>
                  <p className="text-gray-400 text-sm">{step.description}</p>
                </div>
                
                {index < howToSteps.length - 1 && (
                  <div className="hidden lg:block absolute top-1/2 -right-3 transform -translate-y-1/2">
                    <FaChevronDown className="text-zinc-600" />
                  </div>
                )}
              </motion.div>
            ))}
          </div>
        </motion.section>

        {/* Video Tutorial */}
        <motion.section
          initial={{ opacity: 0, y: 50 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          className="mb-24"
        >
          <div className="flex items-center gap-3 mb-8">
            <div className="w-12 h-12 bg-gradient-to-br from-red-500 to-orange-500 rounded-xl flex items-center justify-center">
              <FaPlay className="text-white w-6 h-6" />
            </div>
            <h2 className="text-3xl font-bold">Video Tutorial</h2>
          </div>
          
          {/* Google Drive Video Embed */}
          <motion.div
            initial={{ opacity: 0, scale: 0.95 }}
            whileInView={{ opacity: 1, scale: 1 }}
            viewport={{ once: true }}
            className="relative aspect-video max-w-4xl mx-auto rounded-2xl overflow-hidden border-2 border-zinc-800 hover:border-zinc-700 transition-colors"
          >
            <iframe
              className="absolute inset-0 w-full h-full"
              src="https://drive.google.com/file/d/1SIpFG2KBPrGagKeuB2rI2aDud9ssX-Gr/preview"
              title="Paper Trading Tutorial"
              allow="autoplay"
            />
          </motion.div>
          
          <p className="text-center text-gray-500 mt-4 text-sm">
            Watch this tutorial to learn the basics of Nebuna paper trading
          </p>
        </motion.section>

        {/* Features Overview */}
        <motion.section
          variants={containerVariants}
          initial="hidden"
          whileInView="visible"
          viewport={{ once: true }}
          className="mb-24"
        >
          <div className="flex items-center gap-3 mb-8">
            <div className="w-12 h-12 bg-gradient-to-br from-pink-500 to-rose-500 rounded-xl flex items-center justify-center">
              <FaRobot className="text-white w-6 h-6" />
            </div>
            <h2 className="text-3xl font-bold">Platform Features</h2>
          </div>
          
          <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-6">
            {features.map((feature, index) => (
              <motion.div
                key={index}
                variants={itemVariants}
                whileHover={{ scale: 1.03, y: -5 }}
                className="bg-gradient-to-br from-zinc-900/80 to-zinc-800/50 border border-zinc-700/50 rounded-2xl p-6 hover:border-zinc-600 transition-all group"
              >
                <div className={`w-14 h-14 bg-gradient-to-br ${feature.color} rounded-xl flex items-center justify-center mb-4 text-white group-hover:scale-110 transition-transform`}>
                  {feature.icon}
                </div>
                <h3 className="text-xl font-semibold mb-2">{feature.title}</h3>
                <p className="text-gray-400 text-sm mb-4">{feature.description}</p>
                <Link
                  href={feature.link}
                  className="text-blue-400 text-sm hover:text-blue-300 transition-colors inline-flex items-center gap-2 group-hover:gap-3"
                >
                  Explore <FaChevronDown className="text-xs" />
                </Link>
              </motion.div>
            ))}
          </div>
        </motion.section>

        {/* Pro Tips */}
        <motion.section
          initial={{ opacity: 0, y: 50 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          className="mb-24"
        >
          <div className="flex items-center gap-3 mb-8">
            <div className="w-12 h-12 bg-gradient-to-br from-yellow-500 to-amber-500 rounded-xl flex items-center justify-center">
              <FaLightbulb className="text-white w-6 h-6" />
            </div>
            <h2 className="text-3xl font-bold">Pro Tips for Success</h2>
          </div>
          
          <div className="grid md:grid-cols-2 lg:grid-cols-4 gap-6">
            {tips.map((tip, index) => (
              <motion.div
                key={index}
                initial={{ opacity: 0, scale: 0.9 }}
                whileInView={{ opacity: 1, scale: 1 }}
                viewport={{ once: true }}
                transition={{ delay: index * 0.1 }}
                whileHover={{ scale: 1.02 }}
                className="bg-gradient-to-br from-zinc-900/80 to-zinc-800/50 border border-zinc-700/50 rounded-2xl p-6 text-center"
              >
                <span className="text-4xl mb-4 block">{tip.emoji}</span>
                <h3 className="text-lg font-semibold mb-2">{tip.title}</h3>
                <p className="text-gray-400 text-sm">{tip.content}</p>
              </motion.div>
            ))}
          </div>
        </motion.section>

        {/* FAQ Section */}
        <motion.section
          initial={{ opacity: 0, y: 50 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          className="mb-24"
        >
          <div className="flex items-center gap-3 mb-8">
            <div className="w-12 h-12 bg-gradient-to-br from-cyan-500 to-blue-500 rounded-xl flex items-center justify-center">
              <FaQuestionCircle className="text-white w-6 h-6" />
            </div>
            <h2 className="text-3xl font-bold">Frequently Asked Questions</h2>
          </div>
          
          <div className="space-y-4">
            {faqs.map((faq, index) => (
              <motion.div
                key={index}
                initial={{ opacity: 0, y: 20 }}
                whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: true }}
                transition={{ delay: index * 0.1 }}
                className="bg-gradient-to-br from-zinc-900/80 to-zinc-800/50 border border-zinc-700/50 rounded-xl overflow-hidden"
              >
                <button
                  onClick={() => setOpenFAQ(openFAQ === index ? null : index)}
                  className="w-full flex items-center justify-between p-6 text-left"
                >
                  <span className="font-semibold text-lg">{faq.question}</span>
                  {openFAQ === index ? (
                    <FaChevronUp className="text-gray-400" />
                  ) : (
                    <FaChevronDown className="text-gray-400" />
                  )}
                </button>
                <motion.div
                  initial={false}
                  animate={{ height: openFAQ === index ? "auto" : 0 }}
                  className="overflow-hidden"
                >
                  <p className="px-6 pb-6 text-gray-400">{faq.answer}</p>
                </motion.div>
              </motion.div>
            ))}
          </div>
        </motion.section>

        {/* Testimonial */}
        <motion.section
          initial={{ opacity: 0, y: 50 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          className="mb-24"
        >
          <div className="bg-gradient-to-br from-blue-500/10 via-purple-500/10 to-pink-500/10 border border-zinc-700/50 rounded-3xl p-8 md:p-12 relative overflow-hidden">
            <FaQuoteLeft className="text-6xl text-white/10 absolute top-8 left-8" />
            <div className="relative z-10">
              <p className="text-2xl md:text-3xl font-medium text-white mb-8 leading-relaxed">
                &ldquo;Nebuna helped me understand the stock market without risking my savings. 
                I practiced for months before making my first real trade. The experience was invaluable!&rdquo;
              </p>
              <div className="flex items-center gap-4">
                <div className="w-14 h-14 bg-gradient-to-br from-blue-500 to-purple-500 rounded-full flex items-center justify-center text-xl font-bold">
                  A
                </div>
                <div>
                  <p className="font-semibold text-white">Alex Trader</p>
                  <p className="text-gray-400">Paper Trading Graduate</p>
                </div>
              </div>
            </div>
          </div>
        </motion.section>

        {/* CTA */}
        <motion.div
          initial={{ opacity: 0, y: 30 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          className="text-center pb-12"
        >
          <h2 className="text-3xl font-bold mb-4">Ready to Start Trading?</h2>
          <p className="text-gray-400 mb-8 text-lg">Begin your paper trading journey today - completely free!</p>
          <div className="flex flex-wrap justify-center gap-4">
            <motion.div whileHover={{ scale: 1.05 }}>
              <Link
                href="/dashboard/portfolio"
                className="inline-block px-8 py-4 bg-gradient-to-r from-blue-600 to-purple-600 hover:from-blue-500 hover:to-purple-500 rounded-xl font-semibold transition-all shadow-lg shadow-blue-500/25"
              >
                View Portfolio
              </Link>
            </motion.div>
            <motion.div whileHover={{ scale: 1.05 }}>
              <Link
                href="/dashboard"
                className="inline-block px-8 py-4 bg-zinc-800 hover:bg-zinc-700 rounded-xl font-semibold transition-all"
              >
                Go to Dashboard
              </Link>
            </motion.div>
          </div>
        </motion.div>
      </motion.div>
    </div>
  );
}
