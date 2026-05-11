import React from 'react';
import { motion } from 'framer-motion';
import { Coins, Zap, ShieldCheck, BarChart3 } from 'lucide-react';

const InsightCards = ({ data }) => {
  const cappedConfidence = Math.min(Math.max(data.aiConfidence * 100, 82), 96).toFixed(0);

  const insights = [
    {
      title: "Reward Coins",
      value: `+${data.rewardCoins}`,
      icon: <Coins className="w-5 h-5 text-accent-green" />,
    },
    {
      title: "Architecture Impact",
      value: data.effortScore > 700 ? "HIGH" : data.effortScore > 400 ? "MEDIUM" : "LOW",
      icon: <Zap className="w-5 h-5 text-[#8b949e]" />,
    },
    {
      title: "Engineering Depth",
      value: data.complexity,
      icon: <ShieldCheck className="w-5 h-5 text-[#8b949e]" />,
    },
    {
      title: "AI Confidence",
      value: `${cappedConfidence}%`,
      icon: <BarChart3 className="w-5 h-5 text-[#8b949e]" />,
    }
  ];

  return (
    <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
      {insights.map((insight, index) => (
        <motion.div
          key={insight.title}
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.1 * index }}
          className="bg-[#161b22] p-5 rounded-xl border border-[#30363d] hover:border-[#8b949e] hover:bg-[#21262d] transition-all duration-300 relative overflow-hidden group shadow-sm"
        >
          <div className="flex flex-col gap-3 relative z-10">
            <div className="p-2 rounded-lg bg-[#0d1117] w-fit border border-[#30363d] group-hover:border-[#8b949e] transition-colors duration-300">
              {insight.icon}
            </div>
            <div className="mt-2">
              <p className="text-[11px] font-bold text-[#8b949e] uppercase tracking-wide">{insight.title}</p>
              <p className="text-xl font-bold text-white group-hover:text-accent-green transition-colors mt-1">{insight.value}</p>
            </div>
          </div>
        </motion.div>
      ))}
    </div>
  );
};

export default InsightCards;
