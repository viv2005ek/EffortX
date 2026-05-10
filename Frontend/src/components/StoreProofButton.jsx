import React, { useState } from 'react';
import { motion } from 'framer-motion';
import { Shield, Loader2, CheckCircle2, ExternalLink, AlertCircle } from 'lucide-react';
import { useSolana } from '../context/SolanaContext.jsx';
import { submitProof, parseBlockchainError } from '../solana/program.js';
import { explorerTxUrl } from '../solana/config.js';
import toast from 'react-hot-toast';

// ============================================================
// StoreProofButton
// Shown in ResultDashboard after analysis is complete.
// Calls submit_proof on the Solana contract.
// ============================================================

/**
 * @param {object} props
 * @param {object} props.analysisData - the data object from the backend
 * Expected fields: githubUrl, commitHash, effortScore, rewardCoins
 */
export default function StoreProofButton({ analysisData }) {
  const { wallet, profile, isWalletConnected, refreshProfile } = useSolana();
  const [loading, setLoading] = useState(false);
  const [stored, setStored] = useState(false);
  const [txSig, setTxSig] = useState(null);
  const [errorMsg, setErrorMsg] = useState(null);

  // Extract fields from analysis data
  const commitHash = analysisData?.commitHash || '';
  const githubUrl = analysisData?.githubUrl || '';
  const effortScore = Math.round(analysisData?.effortScore || 0);
  const rewardCoins = Math.round(analysisData?.rewardCoins || 1);

  const canStore =
    isWalletConnected &&
    !!profile &&
    commitHash.length > 0 &&
    effortScore > 0;

  const handleStore = async () => {
    if (!canStore || loading || stored) return;

    setLoading(true);
    setErrorMsg(null);
    const toastId = toast.loading('Storing proof on Solana…');

    try {
      const sig = await submitProof(wallet, {
        githubUrl,
        commitHash,
        effortScore,
        rewardCoins,
      });

      setTxSig(sig);
      setStored(true);
      toast.success('Proof stored on Solana! 🎉', { id: toastId });
      await refreshProfile();
    } catch (err) {
      console.error('Submit proof error:', err);
      const message = parseBlockchainError(err);
      setErrorMsg(message);
      toast.error(message, { id: toastId });
    } finally {
      setLoading(false);
    }
  };

  // ——— Already stored ———
  if (stored) {
    return (
      <motion.div
        initial={{ opacity: 0, scale: 0.95 }}
        animate={{ opacity: 1, scale: 1 }}
        className="flex flex-col items-end gap-2"
      >
        <div className="flex items-center gap-2 px-5 py-2.5 rounded-xl bg-accent-green/10 border border-accent-green/30 text-accent-green text-xs font-bold">
          <CheckCircle2 className="w-4 h-4" />
          Proof Stored On-Chain
        </div>
        {txSig && (
          <a
            href={explorerTxUrl(txSig)}
            target="_blank"
            rel="noopener noreferrer"
            className="flex items-center gap-1 text-[10px] text-accent-green/60 hover:text-accent-green transition-colors"
          >
            <ExternalLink className="w-3 h-3" />
            View on Solana Explorer
          </a>
        )}
      </motion.div>
    );
  }

  // ——— Not connected ———
  if (!isWalletConnected) {
    return (
      <button
        disabled
        className="px-5 py-2.5 rounded-xl bg-white/5 border border-white/10 text-xs font-bold text-text-main/30 flex items-center gap-2 cursor-not-allowed"
        title="Connect wallet to store proof"
      >
        <Shield className="w-4 h-4" />
        Store Proof On-Chain
        <span className="px-1.5 py-0.5 rounded-md bg-white/10 text-[8px] text-text-main/40 uppercase">
          Connect wallet
        </span>
      </button>
    );
  }

  // ——— No profile ———
  if (!profile) {
    return (
      <button
        disabled
        className="px-5 py-2.5 rounded-xl bg-white/5 border border-white/10 text-xs font-bold text-text-main/30 flex items-center gap-2 cursor-not-allowed"
        title="Create profile to store proof"
      >
        <Shield className="w-4 h-4" />
        Store Proof On-Chain
        <span className="px-1.5 py-0.5 rounded-md bg-white/10 text-[8px] text-text-main/40 uppercase">
          Create profile
        </span>
      </button>
    );
  }

  // ——— Error state ———
  if (errorMsg) {
    return (
      <div className="flex flex-col items-end gap-2">
        <div className="flex items-center gap-2 px-4 py-2 rounded-xl bg-red-500/10 border border-red-500/20 text-red-400 text-xs">
          <AlertCircle className="w-3.5 h-3.5 shrink-0" />
          <span>{errorMsg}</span>
        </div>
        <motion.button
          whileHover={{ scale: 1.02 }}
          whileTap={{ scale: 0.98 }}
          onClick={() => { setErrorMsg(null); handleStore(); }}
          className="px-5 py-2.5 rounded-xl bg-white/5 border border-white/10 hover:bg-white/10 text-xs font-bold text-text-main/60 flex items-center gap-2"
        >
          <Shield className="w-4 h-4" />
          Try Again
        </motion.button>
      </div>
    );
  }

  // ——— Ready ———
  return (
    <motion.button
      whileHover={{ scale: 1.02 }}
      whileTap={{ scale: 0.97 }}
      onClick={handleStore}
      disabled={loading}
      className="relative overflow-hidden px-5 py-2.5 rounded-xl bg-accent-green text-white text-xs font-black flex items-center gap-2 shadow-glow hover:bg-[#3fb950] transition-all duration-200 disabled:opacity-60 disabled:cursor-not-allowed"
    >
      {loading ? (
        <>
          <Loader2 className="w-4 h-4 animate-spin" />
          Storing on Solana…
        </>
      ) : (
        <>
          <Shield className="w-4 h-4" />
          Store Proof On-Chain
        </>
      )}
    </motion.button>
  );
}
