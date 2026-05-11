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

export default function OnChainProfilePanel() {
  const { wallet, profile, profileLoading, refreshProfile, leaderboard, userRank, userProofs } = useSolana();

  const [activeTab, setActiveTab] = useState('overview'); // 'overview' | 'stats' | 'leaderboard' | 'history'
  const [solInput, setSolInput] = useState('');
  const [transferTo, setTransferTo] = useState('');
  const [transferAmount, setTransferAmount] = useState('');
  const [txLoading, setTxLoading] = useState(false);
  const [lastTxSig, setLastTxSig] = useState(null);

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
        className="bg-[#161b22] border border-[#30363d] rounded-xl p-8 flex items-center justify-center gap-3 shadow-sm"
      >
        <Loader2 className="w-5 h-5 text-accent-green animate-spin" />
        <span className="text-sm text-[#8b949e]">Loading on-chain profile…</span>
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
      className="bg-[#161b22] border border-[#30363d] rounded-xl overflow-hidden shadow-sm"
    >
      <div className="p-6 md:p-8 pb-0">
        <div className="flex items-center justify-between mb-8">
          <div className="flex items-center gap-4">
            <div className="p-3 rounded-lg bg-[#0d1117] border border-[#30363d]">
              <ShieldCheck className="w-5 h-5 text-accent-green" />
            </div>
            <div>
              <h4 className="text-base font-bold text-white tracking-tight">On-Chain Reputation</h4>
              <p className="text-[12px] text-[#8b949e] font-mono mt-0.5 tracking-wide">@{profile.githubUsername}</p>
            </div>
          </div>
          <button
            onClick={refreshProfile}
            disabled={profileLoading}
            className="p-2.5 rounded-lg bg-[#0d1117] border border-[#30363d] hover:border-[#8b949e] hover:bg-[#21262d] text-[#8b949e] hover:text-[#c9d1d9] transition-all shadow-sm"
            title="Refresh profile"
          >
            <RefreshCw className="w-4 h-4" />
          </button>
        </div>

        <div className="flex gap-2 p-1.5 rounded-lg bg-[#0d1117] border border-[#30363d] mb-8">
          {[
            { id: 'overview', label: 'Overview', icon: Wallet },
            { id: 'stats', label: 'Stats', icon: BarChart3 },
            { id: 'leaderboard', label: 'Leaderboard', icon: Trophy },
            { id: 'history', label: 'History', icon: History },
          ].map(({ id, label, icon: Icon }) => (
            <button
              key={id}
              onClick={() => setActiveTab(id)}
              className={`flex-1 flex items-center justify-center gap-2 py-2 rounded-md text-[12px] font-semibold transition-all duration-300 ${
                activeTab === id
                  ? 'bg-[#21262d] text-white border border-[#30363d] shadow-sm'
                  : 'text-[#8b949e] hover:text-[#c9d1d9] hover:bg-[#161b22] border border-transparent'
              }`}
            >
              <Icon className="w-3.5 h-3.5" />
              <span className="hidden sm:inline">{label}</span>
            </button>
          ))}
        </div>

        <AnimatePresence mode="wait">
          {activeTab === 'stats' && (
            <motion.div
              key="stats"
              initial={{ opacity: 0, y: 6 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -6 }}
              className="grid grid-cols-2 gap-4 mb-8"
            >
              <div className="p-4 rounded-lg bg-[#0d1117] border border-[#30363d] group hover:border-accent-green transition-colors">
                <div className="flex items-center gap-2 mb-2">
                  <Coins className="w-4 h-4 text-accent-green" />
                  <span className="text-[11px] text-[#8b949e] uppercase tracking-wide font-bold">ECOIN</span>
                </div>
                <p className="text-2xl font-bold text-white tracking-tight">{profile.ecoinBalance.toLocaleString()}</p>
                <p className="text-[11px] text-[#8b949e] mt-1 uppercase tracking-wide font-medium">
                  {profile.ecoinEarned.toLocaleString()} total
                </p>
              </div>

              <div className="p-4 rounded-lg bg-[#0d1117] border border-[#30363d] group hover:border-[#d2a8ff] transition-colors">
                <div className="flex items-center gap-2 mb-2">
                  <Trophy className="w-4 h-4 text-[#d2a8ff]" />
                  <span className="text-[11px] text-[#8b949e] uppercase tracking-wide font-bold">XP</span>
                </div>
                <p className="text-2xl font-bold text-white tracking-tight">{profile.totalXp.toLocaleString()}</p>
                <p className="text-[11px] text-[#8b949e] mt-1 uppercase tracking-wide font-medium">
                  {profile.totalProofs} proof{profile.totalProofs !== 1 ? 's' : ''} stored
                </p>
              </div>

              <div className="p-4 rounded-lg bg-[#0d1117] border border-[#30363d] group hover:border-[#3fb950] transition-colors">
                <div className="flex items-center gap-2 mb-2">
                  <BarChart3 className="w-4 h-4 text-[#3fb950]" />
                  <span className="text-[11px] text-[#8b949e] uppercase tracking-wide font-bold">Avg Score</span>
                </div>
                <p className="text-2xl font-bold text-white tracking-tight">
                  {profile.averageScore > 0 ? profile.averageScore : '—'}
                </p>
                <p className="text-[11px] text-[#8b949e] mt-1 uppercase tracking-wide font-medium">average effort</p>
              </div>

              <div className="p-4 rounded-lg bg-[#0d1117] border border-[#30363d] group hover:border-[#58a6ff] transition-colors">
                <div className="flex items-center gap-2 mb-2">
                  <ArrowUpRight className="w-4 h-4 text-[#58a6ff]" />
                  <span className="text-[11px] text-[#8b949e] uppercase tracking-wide font-bold">Rank</span>
                </div>
                <p className="text-2xl font-bold text-white tracking-tight">
                  {userRank ? `#${userRank}` : '—'}
                </p>
                <p className="text-[11px] text-[#8b949e] mt-1 uppercase tracking-wide font-medium">
                  global standing
                </p>
              </div>
            </motion.div>
          )}

          {activeTab === 'overview' && (
            <motion.div
              key="overview"
              initial={{ opacity: 0, y: 6 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -6 }}
              className="space-y-4 mb-8"
            >
              <form onSubmit={handleBuy} className="space-y-4 p-5 rounded-lg bg-[#0d1117] border border-[#30363d]">
                <div className="flex items-center justify-between mb-2">
                  <h5 className="text-[13px] font-bold text-white flex items-center gap-2">
                    <Coins className="w-4 h-4 text-accent-green" /> Buy ECOIN
                  </h5>
                  <span className="text-[11px] text-[#c9d1d9] font-mono tracking-wide font-medium bg-[#21262d] border border-[#30363d] px-2 py-1 rounded-md">Bal: {profile.ecoinBalance}</span>
                </div>
                <div className="relative">
                  <input
                    type="number"
                    min="0.001"
                    step="0.001"
                    value={solInput}
                    onChange={(e) => setSolInput(e.target.value)}
                    placeholder="SOL Amount (min 0.001)"
                    disabled={txLoading}
                    className="w-full bg-[#161b22] border border-[#30363d] rounded-lg px-4 py-2.5 text-white placeholder:text-[#8b949e] focus:outline-none focus:bg-[#0d1117] focus:border-[#58a6ff] transition-all text-[13px] font-mono disabled:opacity-50"
                  />
                  {solInput && ecoinPreview > 0 && (
                    <div className="absolute right-2 top-1/2 -translate-y-1/2 px-2 py-1 bg-[#238636] text-white text-[10px] rounded border border-[rgba(240,246,252,0.1)] font-bold">
                      ≈ {ecoinPreview} ECOIN
                    </div>
                  )}
                </div>
                <button
                  type="submit"
                  disabled={txLoading || !solInput || parseFloat(solInput) < 0.001}
                  className="w-full py-2.5 rounded-lg font-semibold text-[13px] bg-[#21262d] border border-[#30363d] hover:border-[#8b949e] hover:bg-[#30363d] text-[#c9d1d9] shadow-sm transition-all disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  {txLoading ? 'Processing…' : 'Purchase'}
                </button>
              </form>

              <form onSubmit={handleTransfer} className="space-y-4 p-5 rounded-lg bg-[#0d1117] border border-[#30363d]">
                <h5 className="text-[13px] font-bold text-white flex items-center gap-2 mb-2">
                  <Send className="w-4 h-4 text-[#58a6ff]" /> Transfer ECOIN
                </h5>
                <div className="grid grid-cols-3 gap-3">
                  <input
                    type="text"
                    value={transferTo}
                    onChange={(e) => setTransferTo(e.target.value)}
                    placeholder="Recipient Wallet"
                    disabled={txLoading}
                    className="col-span-2 w-full bg-[#161b22] border border-[#30363d] rounded-lg px-4 py-2.5 text-white placeholder:text-[#8b949e] focus:outline-none focus:bg-[#0d1117] focus:border-[#58a6ff] transition-all text-[13px] font-mono disabled:opacity-50"
                  />
                  <input
                    type="number"
                    min="1"
                    step="1"
                    max={profile.ecoinBalance}
                    value={transferAmount}
                    onChange={(e) => setTransferAmount(e.target.value)}
                    placeholder="Amt"
                    disabled={txLoading}
                    className="col-span-1 w-full bg-[#161b22] border border-[#30363d] rounded-lg px-4 py-2.5 text-white placeholder:text-[#8b949e] focus:outline-none focus:bg-[#0d1117] focus:border-[#58a6ff] transition-all text-[13px] font-mono disabled:opacity-50"
                  />
                </div>
                <button
                  type="submit"
                  disabled={txLoading || !transferTo.trim() || !transferAmount || parseInt(transferAmount) <= 0}
                  className="w-full py-2.5 rounded-lg font-semibold text-[13px] bg-[#21262d] border border-[#30363d] hover:border-[#8b949e] hover:bg-[#30363d] text-[#c9d1d9] shadow-sm transition-all disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  {txLoading ? 'Transferring…' : 'Send'}
                </button>
              </form>
            </motion.div>
          )}

          {activeTab === 'leaderboard' && (
            <motion.div
              key="leaderboard"
              initial={{ opacity: 0, y: 6 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -6 }}
              className="mb-8 max-h-[310px] overflow-y-auto pr-2 custom-scrollbar space-y-3"
            >
              {leaderboard.length === 0 ? (
                <div className="flex flex-col items-center justify-center py-8 gap-3 text-[#8b949e]">
                  <Trophy className="w-8 h-8 opacity-20" />
                  <p className="text-[13px]">No profiles found.</p>
                </div>
              ) : (
                <div className="space-y-3">
                  {leaderboard.map((p) => {
                    const isMe = p.wallet === wallet.publicKey?.toBase58();
                    return (
                      <div
                        key={p.wallet}
                        className={`flex items-center justify-between p-4 rounded-lg border transition-colors ${
                          isMe ? 'bg-[#161b22] border-accent-green' : 'bg-[#0d1117] border-[#30363d] hover:border-[#8b949e]'
                        }`}
                      >
                        <div className="flex items-center gap-4">
                          <span className={`text-[15px] font-bold w-8 text-center ${isMe ? 'text-accent-green' : 'text-[#8b949e]'}`}>
                            #{p.globalRank}
                          </span>
                          <div>
                            <p className={`text-[14px] font-bold ${isMe ? 'text-white' : 'text-[#c9d1d9]'}`}>
                              @{p.githubUsername}
                            </p>
                            <p className="text-[11px] text-[#8b949e] font-mono mt-0.5">
                              {p.wallet.slice(0,4)}...{p.wallet.slice(-4)}
                            </p>
                          </div>
                        </div>
                        <div className="text-right">
                          <p className={`text-[13px] font-bold flex items-center gap-1.5 justify-end ${isMe ? 'text-accent-green' : 'text-white'}`}>
                            {p.ecoinBalance.toLocaleString()} <Coins className={`w-3.5 h-3.5 ${isMe ? 'text-accent-green' : 'text-[#8b949e]'}`} />
                          </p>
                          <p className="text-[11px] text-[#8b949e] mt-0.5 font-medium">{p.totalXp.toLocaleString()} XP</p>
                        </div>
                      </div>
                    );
                  })}
                </div>
              )}
            </motion.div>
          )}

          {activeTab === 'history' && (
            <motion.div
              key="history"
              initial={{ opacity: 0, y: 6 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -6 }}
              className="mb-8 max-h-[310px] overflow-y-auto pr-2 custom-scrollbar space-y-3"
            >
              {userProofs.length === 0 ? (
                <div className="flex flex-col items-center justify-center py-8 gap-3 text-[#8b949e]">
                  <History className="w-8 h-8 opacity-20" />
                  <p className="text-[13px]">No proofs submitted yet.</p>
                </div>
              ) : (
                <div className="space-y-3">
                  {userProofs.map((proof) => (
                    <div key={proof.commitHash} className="p-4 rounded-lg bg-[#0d1117] border border-[#30363d] hover:border-[#8b949e] transition-colors">
                      <div className="flex items-start justify-between mb-3">
                        <a
                          href={`https://github.com/${proof.githubUsername}/commit/${proof.commitHash}`}
                          target="_blank"
                          rel="noopener noreferrer"
                          className="text-[13px] font-bold text-white hover:text-[#58a6ff] transition-colors flex items-center gap-2"
                        >
                          <List className="w-4 h-4 text-[#8b949e]" /> 
                          <span className="font-mono tracking-wide">{proof.commitHash.slice(0, 7)}</span>
                        </a>
                        <span className="text-[11px] text-[#8b949e] bg-[#161b22] border border-[#30363d] px-2 py-0.5 rounded-md font-medium">
                          {new Date(proof.timestamp * 1000).toLocaleDateString()}
                        </span>
                      </div>
                      <div className="flex items-center gap-3 text-[12px] font-semibold">
                        <span className="flex items-center gap-1.5 text-accent-green">
                          <Coins className="w-3.5 h-3.5" /> +{proof.rewardCoins}
                        </span>
                        <span className="flex items-center gap-1.5 text-[#8b949e]">
                          <BarChart3 className="w-3.5 h-3.5" /> Score: <span className="text-[#c9d1d9]">{proof.effortScore}</span>
                        </span>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </motion.div>
          )}
        </AnimatePresence>

        {lastTxSig && (
          <div className="pb-6 flex items-center justify-center">
            <a
              href={explorerTxUrl(lastTxSig)}
              target="_blank"
              rel="noopener noreferrer"
              className="text-[11px] text-[#8b949e] hover:text-[#58a6ff] flex items-center gap-1.5 transition-colors font-medium"
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
