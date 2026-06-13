"use client";

import Link from "next/link";
import { motion, type Variants } from "framer-motion";
import { Navbar } from "@/components/Navbar";
import {
  Coffee,
  Rocket,
  BarChart3,
  ShieldCheck,
  Heart,
  ArrowRight,
} from "lucide-react";

export default function Home() {
  const containerVariants: Variants = {
    hidden: { opacity: 0 },
    visible: {
      opacity: 1,
      transition: {
        staggerChildren: 0.15,
      },
    },
  };

  const itemVariants: Variants = {
    hidden: { y: 30, opacity: 0 },
    visible: {
      y: 0,
      opacity: 1,
      transition: { type: "spring", stiffness: 100 },
    },
  };

  return (
    <div className="min-h-screen flex flex-col bg-[#f4f4f0] text-black">
      <Navbar />

      <main className="grow">
        {/* Hero Section */}
        <section className="relative px-6 py-20 md:py-28 overflow-hidden border-b-4 border-black bg-neo-cyan">
          {/* Decorative floating shapes */}
          <motion.div
            animate={{ rotate: 360 }}
            transition={{ duration: 20, repeat: Infinity, ease: "linear" }}
            className="absolute -top-10 -left-10 w-40 h-40 bg-neo-yellow border-4 border-black hidden md:block"
          />
          <motion.div
            animate={{ y: [0, -20, 0] }}
            transition={{ duration: 4, repeat: Infinity, ease: "easeInOut" }}
            className="absolute -bottom-10 right-10 w-32 h-32 rounded-full bg-neo-pink border-4 border-black hidden md:block"
          />

          <div className="mx-auto max-w-5xl text-center relative z-10">
            <motion.div
              initial={{ scale: 0.8, rotate: -5, opacity: 0 }}
              animate={{ scale: 1, rotate: -2, opacity: 1 }}
              transition={{ type: "spring", stiffness: 200, delay: 0.1 }}
              className="inline-block bg-neo-yellow border-4 border-black px-6 py-2 font-black text-sm uppercase tracking-widest shadow-[4px_4px_0px_0px_#000000] mb-8"
            >
              🚀 Web3 Creator Revolution
            </motion.div>

            <motion.h1
              initial={{ y: 50, opacity: 0 }}
              animate={{ y: 0, opacity: 1 }}
              transition={{ delay: 0.2, type: "spring", stiffness: 100 }}
              className="text-5xl md:text-8xl font-black uppercase tracking-tight leading-none mb-8"
            >
              Buy Me A Coffee <br />
              <span className="bg-neo-pink px-4 py-2 border-4 border-black inline-block shadow-[8px_8px_0px_0px_#000000] -rotate-1 mt-2">
                Factory
              </span>
            </motion.h1>

            <motion.p
              initial={{ y: 30, opacity: 0 }}
              animate={{ y: 0, opacity: 1 }}
              transition={{ delay: 0.3 }}
              className="mx-auto max-w-2xl text-lg md:text-xl font-bold text-black border-4 border-black bg-white p-6 shadow-neo mb-10"
            >
              Don't let centralized platforms eat your tips. Deploy your own
              personalized smart contract in one click, accept ETH directly from
              fans, and check your dashboard analytics.
            </motion.p>

            <motion.div
              initial={{ y: 30, opacity: 0 }}
              animate={{ y: 0, opacity: 1 }}
              transition={{ delay: 0.4 }}
              className="flex flex-wrap items-center justify-center gap-6"
            >
              <Link
                href="/dashboard"
                className="flex items-center gap-2 bg-neo-yellow text-black font-black text-lg px-8 py-4 border-4 border-black shadow-[8px_8px_0px_0px_#000000] hover:-translate-x-1 hover:-translate-y-1 hover:shadow-[12px_12px_0px_0px_#000000] active:translate-x-1 active:translate-y-1 active:shadow-[4px_4px_0px_0px_#000000] transition-all"
              >
                Launch Dashboard
                <ArrowRight className="h-5 w-5" />
              </Link>
              <a
                href="#features"
                className="bg-white text-black font-black text-lg px-8 py-4 border-4 border-black shadow-[8px_8px_0px_0px_#000000] hover:-translate-x-1 hover:-translate-y-1 hover:shadow-[12px_12px_0px_0px_#000000] active:translate-x-1 active:translate-y-1 active:shadow-[4px_4px_0px_0px_#000000] transition-all"
              >
                How It Works
              </a>
            </motion.div>
          </div>
        </section>

        {/* Features Section */}
        <section id="features" className="px-6 py-20 bg-[#f4f4f0]">
          <div className="mx-auto max-w-7xl">
            <div className="text-center mb-16">
              <h2 className="text-4xl md:text-6xl font-black uppercase inline-block bg-neo-pink px-6 py-3 border-4 border-black shadow-neo -rotate-1">
                The Creator Engine Features
              </h2>
            </div>

            <motion.div
              variants={containerVariants}
              initial="hidden"
              whileInView="visible"
              viewport={{ once: true, margin: "-100px" }}
              className="grid gap-8 md:grid-cols-3"
            >
              {/* Feature 1 */}
              <motion.div
                variants={itemVariants}
                whileHover={{ scale: 1.03, rotate: 1 }}
                className="bg-white border-4 border-black p-8 shadow-neo relative hover:bg-neo-yellow/10 transition-colors"
              >
                <div className="bg-neo-yellow w-14 h-14 rounded-none border-4 border-black flex items-center justify-center mb-6 shadow-neo-sm">
                  <Rocket className="h-8 w-8 text-black" />
                </div>
                <h3 className="text-2xl font-black uppercase mb-4">
                  One-Click Factory
                </h3>
                <p className="font-medium text-gray-700">
                  Deploy a dedicated instance of the tipping smart contract
                  directly to the blockchain. No coding required—fully
                  multi-tenant and secure.
                </p>
              </motion.div>

              {/* Feature 2 */}
              <motion.div
                variants={itemVariants}
                whileHover={{ scale: 1.03, rotate: -1 }}
                className="bg-white border-4 border-black p-8 shadow-neo relative hover:bg-neo-pink/10 transition-colors"
              >
                <div className="bg-neo-pink w-14 h-14 rounded-none border-4 border-black flex items-center justify-center mb-6 shadow-neo-sm">
                  <BarChart3 className="h-8 w-8 text-black" />
                </div>
                <h3 className="text-2xl font-black uppercase mb-4">
                  Analytics Suite
                </h3>
                <p className="font-medium text-gray-700">
                  Understand your supporters. Visualize total Ethereum received,
                  transaction counts, and withdrawal histories with
                  high-performance charts.
                </p>
              </motion.div>

              {/* Feature 3 */}
              <motion.div
                variants={itemVariants}
                whileHover={{ scale: 1.03, rotate: 1 }}
                className="bg-white border-4 border-black p-8 shadow-neo relative hover:bg-neo-cyan/10 transition-colors"
              >
                <div className="bg-neo-cyan w-14 h-14 rounded-none border-4 border-black flex items-center justify-center mb-6 shadow-neo-sm">
                  <ShieldCheck className="h-8 w-8 text-black" />
                </div>
                <h3 className="text-2xl font-black uppercase mb-4">
                  Direct Ownership
                </h3>
                <p className="font-medium text-gray-700">
                  All coffee tips are held securely in your own contract, not in
                  a pooled database. Withdraw 100% of contract funds directly
                  into your wallet instantly.
                </p>
              </motion.div>
            </motion.div>
          </div>
        </section>

        {/* Steps/Interactive pipeline */}
        <section className="px-6 py-20 bg-neo-yellow border-t-4 border-b-4 border-black">
          <div className="mx-auto max-w-7xl">
            <h2 className="text-4xl md:text-6xl font-black uppercase text-center mb-16">
              Launch in 3 Steps
            </h2>

            <div className="grid gap-8 md:grid-cols-3 relative">
              <div className="bg-white border-4 border-black p-6 shadow-neo">
                <span className="text-6xl font-black text-neo-pink select-none">
                  01
                </span>
                <h4 className="text-xl font-bold uppercase mt-4 mb-2">
                  Connect Wallet
                </h4>
                <p className="text-sm font-semibold">
                  Connect your MetaMask or other Web3 browser extension.
                  Supports both Anvil Localnet and Sepolia Testnet.
                </p>
              </div>

              <div className="bg-white border-4 border-black p-6 shadow-neo">
                <span className="text-6xl font-black text-neo-cyan select-none">
                  02
                </span>
                <h4 className="text-xl font-bold uppercase mt-4 mb-2">
                  Deploy Factory
                </h4>
                <p className="text-sm font-semibold">
                  Click 'Deploy Contract' on your dashboard. Your unique
                  BuyMeACoffee smart contract is launched live on-chain.
                </p>
              </div>

              <div className="bg-white border-4 border-black p-6 shadow-neo">
                <span className="text-6xl font-black text-neo-yellow select-none">
                  03
                </span>
                <h4 className="text-xl font-bold uppercase mt-4 mb-2">
                  Receive Tips
                </h4>
                <p className="text-sm font-semibold">
                  Share your public URL{" "}
                  <code className="bg-gray-100 p-1 neo-border-sm border-black font-mono">
                    /your-address
                  </code>{" "}
                  with your fans. They tip you directly in ETH and write nice
                  memos.
                </p>
              </div>
            </div>
          </div>
        </section>
      </main>

      {/* Footer */}
      <footer className="border-t-4 border-black bg-white px-6 py-8">
        <div className="mx-auto max-w-7xl flex flex-col md:flex-row items-center justify-between gap-4">
          <div className="flex items-center gap-2 font-black">
            <Coffee className="h-5 w-5 text-neo-pink fill-current" />
            <span>COFFEE ENGINE &copy; 2026</span>
          </div>
          <div className="flex items-center gap-2 font-bold text-sm">
            <span>Built with Love by Antigravity</span>
            <Heart className="h-4 w-4 text-neo-pink fill-current" />
          </div>
        </div>
      </footer>
    </div>
  );
}
