import React from 'react';
import { motion } from 'framer-motion';
import { Coins, Zap, ShieldCheck, BarChart3 } from 'lucide-react';

const InsightCards = ({ data }) => {
  const insights = [
    {
      title: "Reward Coins",
      value: `+${data.rewardCoins}`,
      icon: <Coins className="w-5 h-5 text-yellow-500" />,
      color: "from-yellow-500/20 to-transparent",
      borderColor: "border-yellow-500/20"
    },
    {
      title: "Complexity",
      value: data.complexity,
      icon: <Zap className="w-5 h-5 text-accent-green" />,
      color: "from-accent-green/20 to-transparent",
      borderColor: "border-accent-green/20"
    },
    {
      title: "Spam Probability",
      value: `${(data.spamProbability * 100).toFixed(1)}%`,
      icon: <ShieldCheck className="w-5 h-5 text-blue-500" />,
      color: "from-blue-500/20 to-transparent",
      borderColor: "border-blue-500/20"
    },
    {
      title: "AI Confidence",
      value: `${(data.aiConfidence * 100).toFixed(0)}%`,
      icon: <BarChart3 className="w-5 h-5 text-purple-500" />,
      color: "from-purple-500/20 to-transparent",
      borderColor: "border-purple-500/20"
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
          className={`glass-card p-5 rounded-2xl border ${insight.borderColor} bg-gradient-to-br ${insight.color} relative overflow-hidden group`}
        >
          <div className="flex flex-col gap-3 relative z-10">
            <div className="p-2 rounded-lg bg-white/5 w-fit">
              {insight.icon}
            </div>
            <div>
              <p className="text-[10px] uppercase font-bold text-text-main/40 tracking-wider">{insight.title}</p>
              <p className="text-xl font-bold text-white group-hover:text-accent-green transition-colors">{insight.value}</p>
            </div>
          </div>
        </motion.div>
      ))}
    </div>
  );
};

export default InsightCards;
