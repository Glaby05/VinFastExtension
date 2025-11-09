"use client";

import { useRouter } from "next/navigation";
import { motion } from "framer-motion";
import VinFastLogo from "../chat/VinFastLogo";

export default function HeroPage() {
  const router = useRouter();

  const handleStart = () => {
    router.push("/globe");
  };

  return (
    <main className="min-h-[100dvh] flex flex-col bg-gradient-to-b from-white to-[#f7f8fa] text-gray-900">
      {/* Header */}
      <header className="px-6 md:px-12 py-5 flex items-center justify-between border-b border-gray-200/70 backdrop-blur-sm bg-white/70">
        <div className="flex items-center gap-4">
          <VinFastLogo className="scale-105" />
        </div>
        <span className="text-xs text-gray-400 uppercase tracking-wider">Demo</span>
      </header>

      {/* Hero Section */}
      <section className="flex-1 flex flex-col items-center justify-center text-center px-6">
        <motion.h1
          className="text-4xl md:text-6xl font-semibold text-gray-900 leading-tight"
          initial={{ opacity: 0, y: 12 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.6, ease: "easeOut" }}
        >
          Discover your <span className="text-[#007bff] font-bold">VinFast Life</span>
        </motion.h1>

        <motion.p
          className="mt-5 text-gray-600 max-w-xl text-base md:text-lg"
          initial={{ opacity: 0, y: 8 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.2, duration: 0.6 }}
        >
          Explore the world through your lifestyle lens. Pin your favorite places and get your{" "}
          <b>VinFast Life Score</b> in under a minute.
        </motion.p>

        <motion.button
          onClick={handleStart}
          className="mt-10 px-8 py-3.5 rounded-2xl bg-gradient-to-r from-[#1b5cff] to-[#00a4ff] text-white font-semibold tracking-wide shadow-md hover:shadow-lg hover:scale-105 transition-all"
          whileHover={{ y: -2 }}
          whileTap={{ scale: 0.98 }}
        >
          Start Your Experience
        </motion.button>
      </section>

      {/* Footer (minimal, aligned with VinFast’s tone) */}
      <footer className="py-4 text-center text-xs text-gray-400 border-t border-gray-100">
        © {new Date().getFullYear()} VinFast. All rights reserved.
      </footer>
    </main>
  );
}
