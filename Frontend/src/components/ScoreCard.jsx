import React from 'react';
import { motion } from 'framer-motion';

const ScoreCard = ({ score }) => {
  const percentage = (score / 1000) * 100;
  const strokeDasharray = 2 * Math.PI * 45; // r=45
  const offset = strokeDasharray - (percentage / 100) * strokeDasharray;

  return (
    <div className="glass-card p-8 rounded-3xl flex flex-col items-center justify-center relative overflow-hidden group">
      <div className="absolute inset-0 bg-gradient-to-br from-accent-green/5 to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-500" />
      
      <h3 className="text-text-main/60 text-sm font-semibold uppercase tracking-widest mb-6">Effort Score</h3>
      
      <div className="relative w-48 h-48">
        <svg className="w-full h-full transform -rotate-90">
          <circle
            cx="96"
            cy="96"
            r="80"
            fill="none"
            stroke="currentColor"
            strokeWidth="12"
            className="text-white/5"
          />
          <motion.circle
            cx="96"
            cy="96"
            r="80"
            fill="none"
            stroke="currentColor"
            strokeWidth="12"
            strokeDasharray={2 * Math.PI * 80}
            initial={{ strokeDashoffset: 2 * Math.PI * 80 }}
            animate={{ strokeDashoffset: 2 * Math.PI * 80 * (1 - score / 1000) }}
            transition={{ duration: 2, ease: "easeOut" }}
            className="text-accent-green"
            strokeLinecap="round"
          />
        </svg>
        
        <div className="absolute inset-0 flex flex-col items-center justify-center">
          <motion.span
            initial={{ opacity: 0, scale: 0.5 }}
            animate={{ opacity: 1, scale: 1 }}
            transition={{ delay: 0.5, duration: 0.5 }}
            className="text-5xl font-black text-white"
          >
            {score}
          </motion.span>
          <span className="text-text-main/40 text-xs font-bold uppercase mt-1">/ 1000</span>
        </div>
      </div>

      <div className="mt-8 flex gap-4">
        <div className="px-4 py-2 rounded-lg bg-accent-green/10 border border-accent-green/20">
          <span className="text-accent-green font-bold uppercase text-xs">Verified</span>
          <span className="text-text-main/40 text-[10px] block uppercase">Authenticity</span>
        </div>
        <div className="px-4 py-2 rounded-lg bg-white/5 border border-white/10">
          <span className="text-white font-bold uppercase text-xs">{score > 750 ? "Architect" : "Core"}</span>
          <span className="text-text-main/40 text-[10px] block uppercase">Profile</span>
        </div>
      </div>
    </div>
  );
};

export default ScoreCard;
