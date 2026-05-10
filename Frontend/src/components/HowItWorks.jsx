import React from 'react';
import { motion } from 'framer-motion';
import { Link2, Sparkles, Trophy, Wallet, Milestone } from 'lucide-react';

const HowItWorks = () => {
  const steps = [
    {
      icon: <Link2 className="w-6 h-6" />,
      title: "Paste Contribution",
      description: "Submit a GitHub commit or Pull Request URL for deep analysis."
    },
    {
      icon: <Sparkles className="w-6 h-6" />,
      title: "AI Analysis",
      description: "Gemini AI evaluates engineering depth, impact, and code quality."
    },
    {
      icon: <Trophy className="w-6 h-6" />,
      title: "Earn Effort Score",
      description: "Receive a verifiable Effort Score based on technical significance."
    },
    {
      icon: <Wallet className="w-6 h-6" />,
      title: "Collect Rewards",
      description: "Earn EffortX Coins that unlock premium features and analytics."
    },
    {
      icon: <Milestone className="w-6 h-6" />,
      title: "On-Chain Proof",
      description: "Future: Store your reputation history immutably on the Solana network."
    }
  ];

  return (
    <section id="how-it-works" className="py-24 px-4 bg-white/[0.02]">
      <div className="max-w-6xl mx-auto">
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          className="text-center mb-16"
        >
          <h2 className="text-accent-green font-mono text-sm tracking-widest uppercase mb-4">The Process</h2>
          <h3 className="text-4xl font-black text-heading mb-6">How It Works</h3>
        </motion.div>

        <div className="relative">
          {/* Connecting Line (Desktop) */}
          <div className="hidden lg:block absolute top-1/8 left-0 w-full h-0.5 bg-white/5 -translate-y-1/2" />

          <div className="grid grid-cols-1 md:grid-cols-3 lg:grid-cols-5 gap-8 relative z-10">
            {steps.map((step, index) => (
              <motion.div
                key={index}
                initial={{ opacity: 0, scale: 0.9 }}
                whileInView={{ opacity: 1, scale: 1 }}
                viewport={{ once: true }}
                transition={{ delay: index * 0.1 }}
                className="flex flex-col items-center text-center group"
              >
                <div className="w-16 h-16 rounded-2xl bg-[#161B22] border border-white/10 flex items-center justify-center mb-6 group-hover:border-accent-green/50 transition-all shadow-lg group-hover:shadow-accent-green/10">
                  <div className="text-accent-green">
                    {step.icon}
                  </div>
                </div>
                <h4 className="text-lg font-bold text-white mb-2">{step.title}</h4>
                <p className="text-sm text-text-main/40 leading-relaxed px-4">
                  {step.description}
                </p>

                {/* Step Number Badge */}
                <div className="mt-4 px-3 py-1 rounded-full bg-white/5 text-[10px] font-black text-text-main/30 border border-white/5 uppercase tracking-tighter">
                  Step {index + 1}
                </div>
              </motion.div>
            ))}
          </div>
        </div>
      </div>
    </section>
  );
};

export default HowItWorks;
