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
    <main className="min-h-[100dvh] bg-white text-gray-900">
      <div className="px-5 md:px-10 py-4 flex items-center justify-between border-b border-gray-200">
        <div className="flex items-center gap-4">
          <VinFastLogo />
          <span className="text-sm text-gray-600 hidden md:inline">— EVE The VinFast Life</span>
        </div>
        <div className="text-xs text-gray-500">Hackathon Demo</div>
      </div>

      <section className="h-[70dvh] flex flex-col items-center justify-center text-center px-6 bg-gradient-to-b from-white to-gray-50">
        <motion.h1 
          className="text-4xl md:text-6xl font-bold text-gray-900" 
          initial={{ opacity: 0, y: 12 }} 
          animate={{ opacity: 1, y: 0 }}
        >
          Is <span className="text-blue-600">VinFast</span> for you?
        </motion.h1>
        <p className="mt-4 text-gray-600 max-w-2xl">
          Pin your places, answer a few fun questions, and get your <b>VinFast Life Score</b> in under a minute.
        </p>
        <button 
          onClick={handleStart} 
          className="mt-8 px-6 py-3 rounded-xl bg-gradient-to-r from-[#1b5cff] to-[#00a4ff] text-white font-semibold hover:shadow-lg transition-shadow"
        >
          Start
        </button>
      </section>
    </main>
  );
}

