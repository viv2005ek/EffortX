import React from 'react';
import { motion } from 'framer-motion';
import { ExternalLink, GitBranch, User, Calendar, CheckCircle2, AlertCircle } from 'lucide-react';
import ScoreCard from './ScoreCard';
import InsightCards from './InsightCards';
import StoreProofButton from './StoreProofButton';
import OnChainProfilePanel from './OnChainProfilePanel';
import { useSolana } from '../context/SolanaContext.jsx';

const ResultDashboard = ({ data }) => {
  const { isWalletConnected, profile } = useSolana();

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

        <div className="flex flex-wrap gap-3">
          {/* STORE PROOF button — replaces the old "Verify On-Chain (Soon)" button */}
          <StoreProofButton analysisData={data} />

          <button className="px-5 py-2.5 rounded-xl bg-white/5 border border-white/10 hover:bg-white/10 transition-all text-xs font-bold text-text-main/60 flex items-center gap-2">
            Share Result
          </button>
          <a
            href={`https://github.com/${data.author}/${data.repository}/commit/${data.commitHash}`}
            target="_blank"
            rel="noopener noreferrer"
            className="px-6 py-2.5 rounded-xl bg-white text-black shadow-glow hover:shadow-accent-green/20 hover:bg-white/90 transition-all text-sm font-black flex items-center gap-2"
          >
            View on GitHub <ExternalLink className="w-4 h-4" />
          </a>
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
            className="glass-card p-8 rounded-3xl relative overflow-hidden"
          >
            <div className="absolute top-0 right-0 p-4 opacity-5">
              <CheckCircle2 className="w-32 h-32" />
            </div>

            <div className="flex items-center gap-3 mb-6">
              <div className="p-2 rounded-lg bg-accent-green/10">
                <CheckCircle2 className="w-5 h-5 text-accent-green" />
              </div>
              <h4 className="text-xl font-bold text-white">AI Contribution Summary</h4>
            </div>
            <p className="text-lg leading-relaxed text-text-main/80 mb-8 font-medium">
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
                <h5 className="text-sm font-bold text-white uppercase tracking-wider mb-4 flex items-center gap-2 text-yellow-500/80">
                  <AlertCircle className="w-4 h-4" /> Development Insights
                </h5>
                <ul className="space-y-3">
                  {data.weaknesses.map((w, i) => (
                    <li key={i} className="flex items-start gap-3 text-sm text-text-main/70">
                      <div className="mt-1.5 w-1.5 h-1.5 rounded-full bg-yellow-500/50 shrink-0" />
                      {w}
                    </li>
                  ))}
                </ul>
              </div>
            </div>
          </motion.div>

          <InsightCards data={data} />
        </div>

        {/* Right Column: Score Card + On-Chain Panel */}
        <div className="space-y-8">
          <ScoreCard score={data.effortScore} />

          {/* On-Chain Profile Panel — only shown when wallet connected */}
          {isWalletConnected && <OnChainProfilePanel />}

          {/* Engineering Metrics (always shown, moved below on-chain panel) */}
          {!isWalletConnected && (
            <motion.div
              initial={{ opacity: 0, x: 20 }}
              animate={{ opacity: 1, x: 0 }}
              transition={{ delay: 0.4 }}
              className="glass-card p-8 rounded-3xl border border-white/5 bg-gradient-to-br from-white/5 to-transparent shadow-2xl"
            >
              <h4 className="text-xs font-black text-white/40 uppercase tracking-[0.2em] mb-8">Engineering Metrics</h4>
              <div className="space-y-6">
                <div className="space-y-2">
                  <div className="flex justify-between items-center text-[10px] uppercase font-bold tracking-wider">
                    <span className="text-text-main/40">Code Consistency</span>
                    <span className="text-accent-green">88%</span>
                  </div>
                  <div className="w-full bg-white/5 h-1.5 rounded-full overflow-hidden">
                    <div className="bg-accent-green h-full w-[88%] rounded-full shadow-glow" />
                  </div>
                </div>
                <div className="space-y-2">
                  <div className="flex justify-between items-center text-[10px] uppercase font-bold tracking-wider">
                    <span className="text-text-main/40">Maintainability</span>
                    <span className="text-blue-400">HIGH</span>
                  </div>
                  <div className="w-full bg-white/5 h-1.5 rounded-full overflow-hidden">
                    <div className="bg-blue-400 h-full w-[94%] rounded-full" />
                  </div>
                </div>
                <div className="space-y-2">
                  <div className="flex justify-between items-center text-[10px] uppercase font-bold tracking-wider">
                    <span className="text-text-main/40">Security Awareness</span>
                    <span className="text-purple-400">OPTIMIZED</span>
                  </div>
                  <div className="w-full bg-white/5 h-1.5 rounded-full overflow-hidden">
                    <div className="bg-purple-400 h-full w-[82%] rounded-full" />
                  </div>
                </div>
                <div className="pt-4 border-t border-white/5">
                  <p className="text-[10px] text-text-main/30 leading-relaxed italic">
                    Metrics are generated via multi-layered architectural analysis of the submitted diff.
                  </p>
                </div>
              </div>
            </motion.div>
          )}

          {/* Engineering metrics shown below on-chain panel when connected */}
          {isWalletConnected && (
            <motion.div
              initial={{ opacity: 0, x: 20 }}
              animate={{ opacity: 1, x: 0 }}
              transition={{ delay: 0.5 }}
              className="glass-card p-6 rounded-3xl border border-white/5 bg-gradient-to-br from-white/5 to-transparent shadow-2xl"
            >
              <h4 className="text-xs font-black text-white/40 uppercase tracking-[0.2em] mb-6">Engineering Metrics</h4>
              <div className="space-y-4">
                <div className="space-y-2">
                  <div className="flex justify-between items-center text-[10px] uppercase font-bold tracking-wider">
                    <span className="text-text-main/40">Code Consistency</span>
                    <span className="text-accent-green">88%</span>
                  </div>
                  <div className="w-full bg-white/5 h-1.5 rounded-full overflow-hidden">
                    <div className="bg-accent-green h-full w-[88%] rounded-full shadow-glow" />
                  </div>
                </div>
                <div className="space-y-2">
                  <div className="flex justify-between items-center text-[10px] uppercase font-bold tracking-wider">
                    <span className="text-text-main/40">Maintainability</span>
                    <span className="text-blue-400">HIGH</span>
                  </div>
                  <div className="w-full bg-white/5 h-1.5 rounded-full overflow-hidden">
                    <div className="bg-blue-400 h-full w-[94%] rounded-full" />
                  </div>
                </div>
                <div className="space-y-2">
                  <div className="flex justify-between items-center text-[10px] uppercase font-bold tracking-wider">
                    <span className="text-text-main/40">Security Awareness</span>
                    <span className="text-purple-400">OPTIMIZED</span>
                  </div>
                  <div className="w-full bg-white/5 h-1.5 rounded-full overflow-hidden">
                    <div className="bg-purple-400 h-full w-[82%] rounded-full" />
                  </div>
                </div>
              </div>
            </motion.div>
          )}
        </div>
      </div>
    </div>
  );
};

export default ResultDashboard;
