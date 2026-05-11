import React from 'react';
import { motion } from 'framer-motion';

const ScoreCard = ({ score }) => {
  const percentage = (score / 1000) * 100;

  return (
    <div className="bg-[#161b22] border border-[#30363d] p-8 rounded-xl flex flex-col items-center justify-center relative overflow-hidden shadow-lg">
      <h3 className="text-[#8b949e] text-[12px] font-bold uppercase tracking-wide mb-8 relative z-10">Effort Score</h3>
      
      <div className="relative w-52 h-52">
        <svg className="w-full h-full transform -rotate-90">
          <circle
            cx="104"
            cy="104"
            r="88"
            fill="none"
            stroke="#0d1117"
            strokeWidth="8"
          />
          <motion.circle
            cx="104"
            cy="104"
            r="88"
            fill="none"
            stroke="currentColor"
            strokeWidth="8"
            strokeDasharray={2 * Math.PI * 88}
            initial={{ strokeDashoffset: 2 * Math.PI * 88 }}
            animate={{ strokeDashoffset: 2 * Math.PI * 88 * (1 - score / 1000) }}
            transition={{ duration: 2.5, ease: [0.16, 1, 0.3, 1] }}
            className="text-accent-green"
            strokeLinecap="round"
          />
        </svg>
        
        <div className="absolute inset-0 flex flex-col items-center justify-center">
          <motion.span
            initial={{ opacity: 0, scale: 0.8, y: 10 }}
            animate={{ opacity: 1, scale: 1, y: 0 }}
            transition={{ delay: 0.8, duration: 0.8, ease: "easeOut" }}
            className="text-6xl font-black text-white tracking-tighter"
          >
            {score}
          </motion.span>
          <motion.span 
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ delay: 1.5 }}
            className="text-[#8b949e] text-[11px] font-bold uppercase tracking-widest mt-2"
          >
            / 1000 MAX
          </motion.span>
        </div>
      </div>

      <div className="mt-10 flex gap-4 relative z-10 w-full justify-center">
        <div className="flex-1 flex flex-col items-center justify-center py-3 rounded-lg bg-[#0d1117] border border-[#30363d]">
          <span className="text-accent-green font-bold uppercase text-xs tracking-wider">Verified</span>
          <span className="text-[#8b949e] text-[10px] block uppercase tracking-widest mt-1">Authenticity</span>
        </div>
        <div className="flex-1 flex flex-col items-center justify-center py-3 rounded-lg bg-[#0d1117] border border-[#30363d]">
          <span className="text-white font-bold uppercase text-xs tracking-wider">{score > 750 ? "Architect" : "Core"}</span>
          <span className="text-[#8b949e] text-[10px] block uppercase tracking-widest mt-1">Profile</span>
        </div>
      </div>
    </div>
  );
};

export default ScoreCard;
