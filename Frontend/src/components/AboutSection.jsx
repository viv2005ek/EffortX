import React from 'react';
import { motion } from 'framer-motion';
import { Shield, Brain, Cpu, Database } from 'lucide-react';

const AboutSection = () => {
  const features = [
    {
      icon: <Brain className="w-6 h-6 text-accent-green" />,
      title: "Quality over Quantity",
      description: "GitHub activity alone measures quantity. EffortX evaluates the actual engineering depth and architectural impact of every line of code."
    },
    {
      icon: <Shield className="w-6 h-6 text-accent-green" />,
      title: "Verifiable Reputation",
      description: "Generate a credible, technical proof of work. No more fake metrics or gaming the system—just objective engineering analysis."
    },
    {
      icon: <Cpu className="w-6 h-6 text-accent-green" />,
      title: "AI-Powered Depth",
      description: "Powered by Gemini AI, we analyze code patterns, complexity, and maintainability to ensure your effort is recognized accurately."
    },
    {
      icon: <Database className="w-6 h-6 text-accent-green" />,
      title: "Immutable History",
      description: "Integrations with Solana allow you to store your contribution history on-chain, creating a permanent, verifiable developer resume."
    }
  ];

  return (
    <section id="about" className="py-24 px-4 relative overflow-hidden">
      <div className="max-w-6xl mx-auto">
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          className="text-center mb-16"
        >
          <h2 className="text-accent-green font-mono text-sm tracking-widest uppercase mb-4">The Vision</h2>
          <h3 className="text-4xl md:text-5xl font-black text-heading mb-6">Redefining Developer Value</h3>
          <p className="text-lg text-text-main/60 max-w-3xl mx-auto leading-relaxed">
            EffortX is an AI-powered developer reputation infrastructure layer. We believe that true engineering value 
            lies in the quality and impact of contributions, not just the frequency of commits.
          </p>
        </motion.div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
          {features.map((feature, index) => (
            <motion.div
              key={index}
              initial={{ opacity: 0, y: 20 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }}
              transition={{ delay: index * 0.1 }}
              className="bg-[#161b22] p-8 rounded-2xl border border-[#30363d] hover:border-[#3fb950]/50 transition-all group shadow-sm"
            >
              <div className="p-3 rounded-xl bg-[#0d1117] border border-[#30363d] w-fit mb-6 group-hover:border-[#3fb950]/30 transition-all shadow-inner">
                {feature.icon}
              </div>
              <h4 className="text-xl font-bold text-white mb-3">{feature.title}</h4>
              <p className="text-[#8b949e] leading-relaxed font-medium">
                {feature.description}
              </p>
            </motion.div>
          ))}
        </div>
      </div>
    </section>
  );
};

export default AboutSection;
