import React, { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import {
  Coins, Trophy, BarChart3, ShieldCheck, ArrowUpRight,
  Send, Loader2, ExternalLink, RefreshCw, List, History, Users, Wallet
} from 'lucide-react';
import { useSolana } from '../context/SolanaContext.jsx';
import { buyEcoins, transferEcoins, parseBlockchainError } from '../solana/program.js';
import { explorerTxUrl } from '../solana/config.js';
import toast from 'react-hot-toast';

// ============================================================
// OnChainProfilePanel
// Displays the user's on-chain reputation profile + actions.
// Integrated into the existing ResultDashboard area.
// ============================================================

export default function OnChainProfilePanel() {
  const { wallet, profile, profileLoading, refreshProfile, leaderboard, userRank, userProofs } = useSolana();

  const [activeTab, setActiveTab] = useState('overview'); // 'overview' | 'stats' | 'leaderboard' | 'history'
  const [solInput, setSolInput] = useState('');
  const [transferTo, setTransferTo] = useState('');
  const [transferAmount, setTransferAmount] = useState('');
  const [txLoading, setTxLoading] = useState(false);
  const [lastTxSig, setLastTxSig] = useState(null);

  // ——— BUY ECOINS ———
  const handleBuy = async (e) => {
    e.preventDefault();
    const solAmt = parseFloat(solInput);
    if (!solAmt || solAmt <= 0) {
      toast.error('Enter a valid SOL amount (min 0.001 SOL).');
      return;
    }
    if (solAmt < 0.001) {
      toast.error('Minimum purchase is 0.001 SOL (1 ECOIN).');
      return;
    }

    setTxLoading(true);
    const toastId = toast.loading(`Buying ${Math.floor(solAmt * 1000)} ECOIN…`);
    try {
      const sig = await buyEcoins(wallet, solAmt);
      setLastTxSig(sig);
      toast.success(`Purchased ${Math.floor(solAmt * 1000)} ECOIN!`, { id: toastId });
      setSolInput('');
      await refreshProfile();
    } catch (err) {
      toast.error(parseBlockchainError(err), { id: toastId });
    } finally {
      setTxLoading(false);
    }
  };

  // ——— TRANSFER ECOINS ———
  const handleTransfer = async (e) => {
    e.preventDefault();
    const amt = parseInt(transferAmount, 10);
    if (!transferTo.trim() || !amt || amt <= 0) {
      toast.error('Enter a valid wallet address and amount.');
      return;
    }
    if (!profile || amt > profile.ecoinBalance) {
      toast.error('Insufficient ECOIN balance.');
      return;
    }

    setTxLoading(true);
    const toastId = toast.loading(`Transferring ${amt} ECOIN…`);
    try {
      const sig = await transferEcoins(wallet, transferTo.trim(), amt);
      setLastTxSig(sig);
      toast.success(`Sent ${amt} ECOIN successfully!`, { id: toastId });
      setTransferTo('');
      setTransferAmount('');
      await refreshProfile();
    } catch (err) {
      toast.error(parseBlockchainError(err), { id: toastId });
    } finally {
      setTxLoading(false);
    }
  };

  if (profileLoading) {
    return (
      <motion.div
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        className="glass-card rounded-3xl border border-white/5 p-8 flex items-center justify-center gap-3"
      >
        <Loader2 className="w-5 h-5 text-accent-green animate-spin" />
        <span className="text-sm text-text-main/50">Loading on-chain profile…</span>
      </motion.div>
    );
  }

  if (!profile) return null;

  const ecoinPreview = solInput ? Math.floor(parseFloat(solInput || 0) * 1000) : 0;

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ delay: 0.3 }}
      className="glass-card rounded-3xl border border-white/5 overflow-hidden"
    >
      {/* Header */}
      <div className="px-8 pt-8 pb-0">
        <div className="flex items-center justify-between mb-6">
          <div className="flex items-center gap-3">
            <div className="p-2 rounded-xl bg-accent-green/10 border border-accent-green/20">
              <ShieldCheck className="w-4 h-4 text-accent-green" />
            </div>
            <div>
              <h4 className="text-sm font-black text-white">On-Chain Reputation</h4>
              <p className="text-[10px] text-text-main/30 font-mono">@{profile.githubUsername}</p>
            </div>
          </div>
          <button
            onClick={refreshProfile}
            disabled={profileLoading}
            className="p-1.5 rounded-lg hover:bg-white/5 text-text-main/30 hover:text-white transition-colors"
            title="Refresh profile"
          >
            <RefreshCw className="w-3.5 h-3.5" />
          </button>
        </div>

        {/* Tab bar */}
        <div className="flex gap-1 p-1 rounded-xl bg-white/3 border border-white/5 mb-6">
          {[
            { id: 'overview', label: 'Overview', icon: Wallet },
            { id: 'stats', label: 'Stats', icon: BarChart3 },
            { id: 'leaderboard', label: 'Leaderboard', icon: Trophy },
            { id: 'history', label: 'History', icon: History },
          ].map(({ id, label, icon: Icon }) => (
            <button
              key={id}
              onClick={() => setActiveTab(id)}
              className={`flex-1 flex items-center justify-center gap-1.5 py-2 rounded-lg text-[10px] sm:text-xs font-bold transition-all duration-200 ${
                activeTab === id
                  ? 'bg-white/10 text-white'
                  : 'text-text-main/40 hover:text-text-main/70'
              }`}
            >
              <Icon className="w-3 h-3" />
              <span className="hidden sm:inline">{label}</span>
            </button>
          ))}
        </div>

        <AnimatePresence mode="wait">
          {/* STATS TAB */}
          {activeTab === 'stats' && (
            <motion.div
              key="stats"
              initial={{ opacity: 0, y: 6 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -6 }}
              className="grid grid-cols-2 gap-3 mb-6"
            >
              <div className="p-3 rounded-xl bg-white/3 border border-white/8">
                <div className="flex items-center gap-2 mb-1">
                  <Coins className="w-3.5 h-3.5 text-accent-green" />
                  <span className="text-[10px] text-text-main/40 uppercase tracking-wider">ECOIN</span>
                </div>
                <p className="text-2xl font-black text-white">{profile.ecoinBalance.toLocaleString()}</p>
                <p className="text-[10px] text-text-main/30 mt-0.5">
                  {profile.ecoinEarned.toLocaleString()} earned total
                </p>
              </div>

              <div className="p-3 rounded-xl bg-white/3 border border-white/8">
                <div className="flex items-center gap-2 mb-1">
                  <Trophy className="w-3.5 h-3.5 text-yellow-400" />
                  <span className="text-[10px] text-text-main/40 uppercase tracking-wider">XP</span>
                </div>
                <p className="text-2xl font-black text-white">{profile.totalXp.toLocaleString()}</p>
                <p className="text-[10px] text-text-main/30 mt-0.5">
                  {profile.totalProofs} proof{profile.totalProofs !== 1 ? 's' : ''} stored
                </p>
              </div>

              <div className="p-3 rounded-xl bg-white/3 border border-white/8">
                <div className="flex items-center gap-2 mb-1">
                  <BarChart3 className="w-3.5 h-3.5 text-blue-400" />
                  <span className="text-[10px] text-text-main/40 uppercase tracking-wider">Avg Score</span>
                </div>
                <p className="text-2xl font-black text-white">
                  {profile.averageScore > 0 ? profile.averageScore : '—'}
                </p>
                <p className="text-[10px] text-text-main/30 mt-0.5">average effort score</p>
              </div>

              <div className="p-3 rounded-xl bg-white/3 border border-white/8">
                <div className="flex items-center gap-2 mb-1">
                  <ArrowUpRight className="w-3.5 h-3.5 text-purple-400" />
                  <span className="text-[10px] text-text-main/40 uppercase tracking-wider">Rank</span>
                </div>
                <p className="text-2xl font-black text-white">
                  {userRank ? `#${userRank}` : '—'}
                </p>
                <p className="text-[10px] text-text-main/30 mt-0.5">
                  global leaderboard
                </p>
              </div>
            </motion.div>
          )}

          {/* OVERVIEW TAB (Wallet Actions) */}
          {activeTab === 'overview' && (
            <motion.div
              key="overview"
              initial={{ opacity: 0, y: 6 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -6 }}
              className="space-y-6 mb-6"
            >
              <form onSubmit={handleBuy} className="space-y-3 p-4 rounded-xl bg-white/3 border border-white/5">
                <div className="flex items-center justify-between mb-2">
                  <h5 className="text-xs font-bold text-white flex items-center gap-2">
                    <Coins className="w-4 h-4 text-accent-green" /> Buy ECOIN
                  </h5>
                  <span className="text-[10px] text-text-main/40 font-mono">Bal: {profile.ecoinBalance}</span>
                </div>
                <div>
                  <input
                    type="number"
                    min="0.001"
                    step="0.001"
                    value={solInput}
                    onChange={(e) => setSolInput(e.target.value)}
                    placeholder="SOL Amount (min 0.001)"
                    disabled={txLoading}
                    className="w-full bg-black/20 border border-white/10 rounded-lg px-3 py-2 text-white placeholder:text-text-main/20 focus:outline-none focus:border-accent-green/50 transition-all text-xs font-mono disabled:opacity-50"
                  />
                  {solInput && ecoinPreview > 0 && (
                    <p className="text-[10px] text-accent-green mt-1">≈ {ecoinPreview} ECOIN</p>
                  )}
                </div>
                <button
                  type="submit"
                  disabled={txLoading || !solInput || parseFloat(solInput) < 0.001}
                  className="w-full py-2 rounded-lg font-bold text-xs bg-accent-green text-white shadow-glow hover:bg-[#3fb950] transition-all disabled:opacity-40 disabled:cursor-not-allowed"
                >
                  {txLoading ? 'Processing…' : 'Purchase'}
                </button>
              </form>

              <form onSubmit={handleTransfer} className="space-y-3 p-4 rounded-xl bg-white/3 border border-white/5">
                <h5 className="text-xs font-bold text-white flex items-center gap-2 mb-2">
                  <Send className="w-4 h-4 text-blue-400" /> Transfer ECOIN
                </h5>
                <div className="grid grid-cols-2 gap-2">
                  <input
                    type="text"
                    value={transferTo}
                    onChange={(e) => setTransferTo(e.target.value)}
                    placeholder="Recipient Wallet"
                    disabled={txLoading}
                    className="col-span-2 w-full bg-black/20 border border-white/10 rounded-lg px-3 py-2 text-white placeholder:text-text-main/20 focus:outline-none focus:border-blue-500/50 transition-all text-xs font-mono disabled:opacity-50"
                  />
                  <input
                    type="number"
                    min="1"
                    step="1"
                    max={profile.ecoinBalance}
                    value={transferAmount}
                    onChange={(e) => setTransferAmount(e.target.value)}
                    placeholder="Amount"
                    disabled={txLoading}
                    className="col-span-2 w-full bg-black/20 border border-white/10 rounded-lg px-3 py-2 text-white placeholder:text-text-main/20 focus:outline-none focus:border-blue-500/50 transition-all text-xs font-mono disabled:opacity-50"
                  />
                </div>
                <button
                  type="submit"
                  disabled={txLoading || !transferTo.trim() || !transferAmount || parseInt(transferAmount) <= 0}
                  className="w-full py-2 rounded-lg font-bold text-xs bg-white/10 border border-white/10 text-white hover:bg-white/15 transition-all disabled:opacity-40 disabled:cursor-not-allowed"
                >
                  {txLoading ? 'Transferring…' : 'Send'}
                </button>
              </form>
            </motion.div>
          )}

          {/* LEADERBOARD TAB */}
          {activeTab === 'leaderboard' && (
            <motion.div
              key="leaderboard"
              initial={{ opacity: 0, y: 6 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -6 }}
              className="mb-6 max-h-64 overflow-y-auto pr-2 custom-scrollbar"
            >
              {leaderboard.length === 0 ? (
                <p className="text-xs text-text-main/40 text-center py-4">No profiles found.</p>
              ) : (
                <div className="space-y-2">
                  {leaderboard.map((p) => {
                    const isMe = p.wallet === wallet.publicKey?.toBase58();
                    return (
                      <div
                        key={p.wallet}
                        className={`flex items-center justify-between p-3 rounded-xl border ${
                          isMe ? 'bg-accent-green/10 border-accent-green/30' : 'bg-white/3 border-white/5'
                        }`}
                      >
                        <div className="flex items-center gap-3">
                          <span className={`text-sm font-black ${isMe ? 'text-accent-green' : 'text-white/50'}`}>
                            #{p.globalRank}
                          </span>
                          <div>
                            <p className={`text-xs font-bold ${isMe ? 'text-white' : 'text-white/80'}`}>
                              @{p.githubUsername}
                            </p>
                            <p className="text-[9px] text-text-main/40 font-mono">
                              {p.wallet.slice(0,4)}...{p.wallet.slice(-4)}
                            </p>
                          </div>
                        </div>
                        <div className="text-right">
                          <p className="text-xs font-bold text-accent-green flex items-center gap-1 justify-end">
                            {p.ecoinBalance.toLocaleString()} <Coins className="w-3 h-3" />
                          </p>
                          <p className="text-[9px] text-text-main/40">{p.totalXp.toLocaleString()} XP</p>
                        </div>
                      </div>
                    );
                  })}
                </div>
              )}
            </motion.div>
          )}

          {/* HISTORY TAB */}
          {activeTab === 'history' && (
            <motion.div
              key="history"
              initial={{ opacity: 0, y: 6 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -6 }}
              className="mb-6 max-h-64 overflow-y-auto pr-2 custom-scrollbar"
            >
              {userProofs.length === 0 ? (
                <p className="text-xs text-text-main/40 text-center py-4">No proofs submitted yet.</p>
              ) : (
                <div className="space-y-2">
                  {userProofs.map((proof) => (
                    <div key={proof.commitHash} className="p-3 rounded-xl bg-white/3 border border-white/5">
                      <div className="flex items-start justify-between mb-2">
                        <a
                          href={`https://github.com/${proof.githubUsername}/commit/${proof.commitHash}`}
                          target="_blank"
                          rel="noopener noreferrer"
                          className="text-xs font-bold text-white hover:text-accent-green transition-colors flex items-center gap-1"
                        >
                          <List className="w-3 h-3" /> Commit {proof.commitHash.slice(0, 7)}
                        </a>
                        <span className="text-[9px] text-text-main/40">
                          {new Date(proof.timestamp * 1000).toLocaleDateString()}
                        </span>
                      </div>
                      <div className="flex items-center gap-3 text-[10px]">
                        <span className="flex items-center gap-1 text-accent-green">
                          <Coins className="w-3 h-3" /> +{proof.rewardCoins}
                        </span>
                        <span className="flex items-center gap-1 text-blue-400">
                          <BarChart3 className="w-3 h-3" /> Score: {proof.effortScore}
                        </span>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </motion.div>
          )}
        </AnimatePresence>

        {/* Last TX link */}
        {lastTxSig && (
          <div className="mt-3 flex items-center gap-1.5 justify-end">
            <a
              href={explorerTxUrl(lastTxSig)}
              target="_blank"
              rel="noopener noreferrer"
              className="text-[10px] text-accent-green/60 hover:text-accent-green flex items-center gap-1 transition-colors"
            >
              <ExternalLink className="w-3 h-3" />
              View last transaction
            </a>
          </div>
        )}
      </div>
    </motion.div>
  );
}
