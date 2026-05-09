import React from 'react';
import { motion } from 'framer-motion';
import { ExternalLink, GitBranch, User, Calendar, CheckCircle2, AlertCircle } from 'lucide-react';
import ScoreCard from './ScoreCard';
import InsightCards from './InsightCards';

const ResultDashboard = ({ data }) => {
  return (
    <div className="max-w-6xl mx-auto px-4 py-10 space-y-8">
      {/* Header Info */}
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        className="flex flex-col md:flex-row md:items-end justify-between gap-6"
      >
        <div>
          <div className="flex items-center gap-2 mb-2">
            <GitBranch className="w-4 h-4 text-accent-green" />
            <span className="text-accent-green font-mono text-sm tracking-widest uppercase">Analysis Complete</span>
          </div>
          <h2 className="text-4xl font-black text-heading mb-2">
            {data.repository} <span className="text-text-main/20 font-light">/</span> {data.contributionCategory}
          </h2>
          <div className="flex flex-wrap items-center gap-6 text-text-main/60">
            <div className="flex items-center gap-2">
              <User className="w-4 h-4" />
              <span>{data.author}</span>
            </div>
            <div className="flex items-center gap-2">
              <Calendar className="w-4 h-4" />
              <span>{new Date(data.analyzedAt).toLocaleDateString()}</span>
            </div>
            <div className="px-3 py-1 rounded-md bg-white/5 border border-white/10 text-xs font-mono uppercase">
              {data.type}
            </div>
          </div>
        </div>
        
        <div className="flex gap-3">
          <button className="px-6 py-3 rounded-xl bg-white/5 border border-white/10 hover:bg-white/10 transition-all text-sm font-bold flex items-center gap-2">
            Share Result
          </button>
          <button className="px-6 py-3 rounded-xl bg-accent-green text-white shadow-glow hover:bg-[#3fb950] transition-all text-sm font-bold flex items-center gap-2">
            View on GitHub <ExternalLink className="w-4 h-4" />
          </button>
        </div>
      </motion.div>

      {/* Main Grid */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
        {/* Left Column: Score & Summary */}
        <div className="lg:col-span-2 space-y-8">
          {/* AI Summary Card */}
          <motion.div
            initial={{ opacity: 0, x: -20 }}
            animate={{ opacity: 1, x: 0 }}
            transition={{ delay: 0.2 }}
            className="glass-card p-8 rounded-3xl"
          >
            <div className="flex items-center gap-3 mb-6">
              <div className="p-2 rounded-lg bg-accent-green/10">
                <CheckCircle2 className="w-5 h-5 text-accent-green" />
              </div>
              <h4 className="text-xl font-bold text-white">AI Contribution Summary</h4>
            </div>
            <p className="text-lg leading-relaxed text-text-main/80 mb-8 italic">
              "{data.summary}"
            </p>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
              <div>
                <h5 className="text-sm font-bold text-white uppercase tracking-wider mb-4 flex items-center gap-2">
                  <CheckCircle2 className="w-4 h-4 text-accent-green" /> Key Strengths
                </h5>
                <ul className="space-y-3">
                  {data.strengths.map((s, i) => (
                    <li key={i} className="flex items-start gap-3 text-sm text-text-main/70">
                      <div className="mt-1.5 w-1.5 h-1.5 rounded-full bg-accent-green shrink-0" />
                      {s}
                    </li>
                  ))}
                </ul>
              </div>
              <div>
                <h5 className="text-sm font-bold text-white uppercase tracking-wider mb-4 flex items-center gap-2 text-yellow-500">
                  <AlertCircle className="w-4 h-4" /> Potential Areas of Improvement
                </h5>
                <ul className="space-y-3">
                  {data.weaknesses.map((w, i) => (
                    <li key={i} className="flex items-start gap-3 text-sm text-text-main/70">
                      <div className="mt-1.5 w-1.5 h-1.5 rounded-full bg-yellow-500 shrink-0" />
                      {w}
                    </li>
                  ))}
                </ul>
              </div>
            </div>
          </motion.div>
          
          <InsightCards data={data} />
        </div>

        {/* Right Column: Score Card */}
        <div className="space-y-8">
          <ScoreCard score={data.effortScore} />
          
          {/* Reputation Card */}
          <motion.div
            initial={{ opacity: 0, x: 20 }}
            animate={{ opacity: 1, x: 0 }}
            transition={{ delay: 0.4 }}
            className="glass-card p-6 rounded-3xl border border-white/5 bg-gradient-to-br from-white/5 to-transparent"
          >
            <h4 className="text-sm font-bold text-white/40 uppercase tracking-widest mb-4">Reputation Status</h4>
            <div className="space-y-4">
              <div className="flex justify-between items-center text-sm">
                <span className="text-text-main/60">Architectural Impact</span>
                <span className="text-white font-mono">HIGH</span>
              </div>
              <div className="w-full bg-white/5 h-1.5 rounded-full overflow-hidden">
                <div className="bg-accent-green h-full w-[85%]" />
              </div>
              
              <div className="flex justify-between items-center text-sm">
                <span className="text-text-main/60">Code Consistency</span>
                <span className="text-white font-mono">92%</span>
              </div>
              <div className="w-full bg-white/5 h-1.5 rounded-full overflow-hidden">
                <div className="bg-blue-500 h-full w-[92%]" />
              </div>
            </div>
          </motion.div>
        </div>
      </div>
    </div>
  );
};

export default ResultDashboard;
