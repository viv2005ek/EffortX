import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Loader2, Terminal } from 'lucide-react';

const messages = [
  "Fetching contribution data...",
  "Analyzing repository structure...",
  "Running Gemini AI deep scan...",
  "Evaluating code quality & complexity...",
  "Identifying architectural patterns...",
  "Calculating Effort Score...",
  "Minting reward coins...",
  "Finalizing contribution report..."
];

const LoadingState = () => {
  const [index, setIndex] = useState(0);

  useEffect(() => {
    const interval = setInterval(() => {
      setIndex((prev) => (prev + 1) % messages.length);
    }, 2500);
    return () => clearInterval(interval);
  }, []);

  return (
    <div className="fixed inset-0 z-50 flex flex-col items-center justify-center bg-[#0D1117]/90 backdrop-blur-md">
      <motion.div
        initial={{ scale: 0.8, opacity: 0 }}
        animate={{ scale: 1, opacity: 1 }}
        className="relative mb-12"
      >
        <div className="w-32 h-32 rounded-full border-4 border-accent-green/20 border-t-accent-green animate-spin" />
        <div className="absolute inset-0 flex items-center justify-center">
          <Terminal className="w-10 h-10 text-accent-green" />
        </div>
      </motion.div>

      <div className="h-12 overflow-hidden text-center">
        <AnimatePresence mode="wait">
          <motion.p
            key={index}
            initial={{ y: 20, opacity: 0 }}
            animate={{ y: 0, opacity: 1 }}
            exit={{ y: -20, opacity: 0 }}
            transition={{ duration: 0.5 }}
            className="text-xl md:text-2xl font-medium text-heading"
          >
            {messages[index]}
          </motion.p>
        </AnimatePresence>
      </div>

      <div className="mt-8 flex gap-2">
        {messages.map((_, i) => (
          <div
            key={i}
            className={`w-2 h-2 rounded-full transition-all duration-500 ${
              i === index ? 'bg-accent-green w-6' : 'bg-white/10'
            }`}
          />
        ))}
      </div>
    </div>
  );
};

export default LoadingState;
