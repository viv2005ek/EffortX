import React from 'react';
import { motion } from 'framer-motion';

const HeroSection = ({ onScrollToAnalyzer }) => {
  return (
    <section className="relative min-h-[70vh] flex flex-col items-center justify-center text-center px-4 overflow-hidden">
      {/* Animated Background Grid */}
      <div className="absolute inset-0 animated-grid pointer-events-none" />
      <div className="absolute inset-0 bg-gradient-to-b from-transparent via-[#0D1117]/50 to-[#0D1117] pointer-events-none" />
      
      {/* Glowing Accents */}
      <div className="absolute top-1/4 left-1/4 w-64 h-64 bg-accent-green/10 rounded-full blur-[120px] pointer-events-none" />
      <div className="absolute bottom-1/4 right-1/4 w-96 h-96 bg-accent-green/5 rounded-full blur-[150px] pointer-events-none" />

      <motion.div
        initial={{ opacity: 0, y: 30 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.8, ease: "easeOut" }}
        className="relative z-10 max-w-4xl"
      >
        <div className="flex items-center justify-center mb-6">
          <motion.div
            initial={{ scale: 0.8, opacity: 0 }}
            animate={{ scale: 1, opacity: 1 }}
            transition={{ delay: 0.2, duration: 0.5 }}
            className="px-4 py-1 rounded-full border border-accent-green/30 bg-accent-green/5 text-accent-green text-sm font-semibold tracking-wide"
          >
            BETA v1.0
          </motion.div>
        </div>

        <h1 className="text-5xl md:text-7xl font-extrabold text-heading tracking-tight mb-6 leading-tight">
          Effort<span className="text-accent-green">X</span>
        </h1>
        
        <p className="text-2xl md:text-3xl font-medium text-white mb-4 tracking-wide">
          AI-Verified Proof of Real Developer Work
        </p>
        
        <p className="text-lg text-text-main/80 max-w-2xl mx-auto mb-10 leading-relaxed">
          The ultimate reputation layer for engineers. Analyze GitHub commits and PRs using Gemini AI to generate objective Effort Scores, reward coins, and architectural insights.
        </p>

        <motion.button
          whileHover={{ scale: 1.05 }}
          whileTap={{ scale: 0.95 }}
          onClick={onScrollToAnalyzer}
          className="px-10 py-4 bg-accent-green text-white font-bold rounded-xl shadow-glow hover:bg-[#3fb950] transition-all duration-300 text-lg"
        >
          Analyze Commit
        </motion.button>
      </motion.div>
    </section>
  );
};

export default HeroSection;
