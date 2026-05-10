import React, { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import {
  Coins, Trophy, BarChart3, ShieldCheck, ArrowUpRight,
  Send, Loader2, ExternalLink, RefreshCw
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
  const { wallet, profile, profileLoading, refreshProfile } = useSolana();

  const [activeTab, setActiveTab] = useState('profile'); // 'profile' | 'buy' | 'transfer'
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

        {/* Stats row */}
        <div className="grid grid-cols-2 gap-3 mb-6">
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
              {profile.totalXp >= 1000 ? '🏆' : profile.totalXp >= 500 ? '🥈' : profile.totalXp >= 100 ? '🥉' : '—'}
            </p>
            <p className="text-[10px] text-text-main/30 mt-0.5">
              {profile.totalXp >= 1000 ? 'Gold' : profile.totalXp >= 500 ? 'Silver' : profile.totalXp >= 100 ? 'Bronze' : 'Unranked'}
            </p>
          </div>
        </div>

        {/* Tab bar */}
        <div className="flex gap-1 p-1 rounded-xl bg-white/3 border border-white/5 mb-0">
          {[
            { id: 'buy', label: 'Buy ECOIN', icon: Coins },
            { id: 'transfer', label: 'Transfer', icon: Send },
          ].map(({ id, label, icon: Icon }) => (
            <button
              key={id}
              onClick={() => setActiveTab(id === activeTab ? 'profile' : id)}
              className={`flex-1 flex items-center justify-center gap-1.5 py-2 rounded-lg text-xs font-bold transition-all duration-200 ${
                activeTab === id
                  ? 'bg-white/10 text-white'
                  : 'text-text-main/40 hover:text-text-main/70'
              }`}
            >
              <Icon className="w-3 h-3" />
              {label}
            </button>
          ))}
        </div>
      </div>

      {/* Tab content */}
      <div className="px-8 pb-8 pt-4">
        <AnimatePresence mode="wait">
          {/* BUY ECOINS */}
          {activeTab === 'buy' && (
            <motion.form
              key="buy"
              initial={{ opacity: 0, y: 6 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -6 }}
              onSubmit={handleBuy}
              className="space-y-3"
            >
              <div>
                <label className="text-[10px] text-text-main/40 uppercase tracking-wider block mb-1.5">
                  SOL Amount
                </label>
                <input
                  type="number"
                  min="0.001"
                  step="0.001"
                  value={solInput}
                  onChange={(e) => setSolInput(e.target.value)}
                  placeholder="0.01"
                  disabled={txLoading}
                  className="w-full bg-white/5 border border-white/10 rounded-xl px-4 py-3 text-white placeholder:text-text-main/20 focus:outline-none focus:border-accent-green/50 transition-all text-sm font-mono disabled:opacity-50"
                />
                {solInput && ecoinPreview > 0 && (
                  <p className="text-[10px] text-accent-green mt-1.5">
                    ≈ {ecoinPreview} ECOIN (1 SOL = 1,000 ECOIN)
                  </p>
                )}
              </div>

              <motion.button
                type="submit"
                disabled={txLoading || !solInput || parseFloat(solInput) < 0.001}
                whileHover={{ scale: 1.01 }}
                whileTap={{ scale: 0.98 }}
                className="w-full py-3 rounded-xl font-bold text-sm flex items-center justify-center gap-2 bg-accent-green text-white shadow-glow hover:bg-[#3fb950] transition-all disabled:opacity-40 disabled:cursor-not-allowed disabled:shadow-none"
              >
                {txLoading ? (
                  <><Loader2 className="w-4 h-4 animate-spin" /> Buying…</>
                ) : (
                  <><Coins className="w-4 h-4" /> Buy ECOIN</>
                )}
              </motion.button>
            </motion.form>
          )}

          {/* TRANSFER ECOINS */}
          {activeTab === 'transfer' && (
            <motion.form
              key="transfer"
              initial={{ opacity: 0, y: 6 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -6 }}
              onSubmit={handleTransfer}
              className="space-y-3"
            >
              <div>
                <label className="text-[10px] text-text-main/40 uppercase tracking-wider block mb-1.5">
                  Recipient Wallet
                </label>
                <input
                  type="text"
                  value={transferTo}
                  onChange={(e) => setTransferTo(e.target.value)}
                  placeholder="Solana wallet address"
                  disabled={txLoading}
                  className="w-full bg-white/5 border border-white/10 rounded-xl px-4 py-3 text-white placeholder:text-text-main/20 focus:outline-none focus:border-accent-green/50 transition-all text-xs font-mono disabled:opacity-50"
                />
              </div>
              <div>
                <label className="text-[10px] text-text-main/40 uppercase tracking-wider block mb-1.5">
                  ECOIN Amount
                  <span className="ml-2 text-accent-green">(balance: {profile.ecoinBalance})</span>
                </label>
                <input
                  type="number"
                  min="1"
                  step="1"
                  max={profile.ecoinBalance}
                  value={transferAmount}
                  onChange={(e) => setTransferAmount(e.target.value)}
                  placeholder="10"
                  disabled={txLoading}
                  className="w-full bg-white/5 border border-white/10 rounded-xl px-4 py-3 text-white placeholder:text-text-main/20 focus:outline-none focus:border-accent-green/50 transition-all text-sm font-mono disabled:opacity-50"
                />
              </div>
              <motion.button
                type="submit"
                disabled={txLoading || !transferTo.trim() || !transferAmount || parseInt(transferAmount) <= 0}
                whileHover={{ scale: 1.01 }}
                whileTap={{ scale: 0.98 }}
                className="w-full py-3 rounded-xl font-bold text-sm flex items-center justify-center gap-2 bg-white/10 border border-white/10 text-white hover:bg-white/15 transition-all disabled:opacity-40 disabled:cursor-not-allowed"
              >
                {txLoading ? (
                  <><Loader2 className="w-4 h-4 animate-spin" /> Transferring…</>
                ) : (
                  <><Send className="w-4 h-4" /> Transfer ECOIN</>
                )}
              </motion.button>
            </motion.form>
          )}
        </AnimatePresence>

        {/* Last TX link */}
        {lastTxSig && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            className="mt-3 flex items-center gap-1.5 justify-end"
          >
            <a
              href={explorerTxUrl(lastTxSig)}
              target="_blank"
              rel="noopener noreferrer"
              className="text-[10px] text-accent-green/60 hover:text-accent-green flex items-center gap-1 transition-colors"
            >
              <ExternalLink className="w-3 h-3" />
              View last transaction
            </a>
          </motion.div>
        )}
      </div>
    </motion.div>
  );
}
