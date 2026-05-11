import React, { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { AtSign as Github, Loader2, CheckCircle2, X, User } from 'lucide-react';
import { useSolana } from '../context/SolanaContext.jsx';
import { createProfile, parseBlockchainError } from '../solana/program.js';
import { explorerTxUrl } from '../solana/config.js';
import toast from 'react-hot-toast';

// ============================================================
// CreateProfileModal
// Shown when wallet is connected but no on-chain profile exists.
// ============================================================

export default function CreateProfileModal({ isOpen, onClose }) {
  const { wallet, refreshProfile } = useSolana();
  const [username, setUsername] = useState('');
  const [loading, setLoading] = useState(false);
  const [txSig, setTxSig] = useState(null);
  const [done, setDone] = useState(false);

  const isValidUsername = username.trim().length > 0 && username.trim().length <= 32;

  const handleCreate = async (e) => {
    e.preventDefault();
    if (!isValidUsername || loading) return;

    setLoading(true);
    const toastId = toast.loading('Creating on-chain profile…');

    try {
      const sig = await createProfile(wallet, username.trim());
      setTxSig(sig);
      setDone(true);

      toast.success('Profile created on Solana!', { id: toastId });
      await refreshProfile();

      // Auto-close after 2 seconds
      setTimeout(() => {
        onClose();
        setDone(false);
        setTxSig(null);
        setUsername('');
      }, 2500);
    } catch (err) {
      console.error('Create profile error:', err);
      const message = parseBlockchainError(err);
      toast.error(message, { id: toastId });
    } finally {
      setLoading(false);
    }
  };

  return (
    <AnimatePresence>
      {isOpen && (
        <>
          {/* Backdrop */}
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 z-50 bg-black/70 "
            onClick={!loading ? onClose : undefined}
          />

          {/* Modal */}
          <motion.div
            initial={{ opacity: 0, scale: 0.95, y: 20 }}
            animate={{ opacity: 1, scale: 1, y: 0 }}
            exit={{ opacity: 0, scale: 0.95, y: 20 }}
            transition={{ type: 'spring', stiffness: 350, damping: 30 }}
            className="fixed inset-0 z-50 flex items-center justify-center p-4 pointer-events-none"
          >
            <div className="pointer-events-auto w-full max-w-md bg-[#161b22] rounded-3xl border border-[#30363d] shadow-2xl overflow-hidden">
              {/* Top accent line */}
              <div className="h-0.5 w-full bg-gradient-to-r from-transparent via-accent-green to-transparent" />

              <div className="p-8">
                {/* Header */}
                <div className="flex items-start justify-between mb-6">
                  <div className="flex items-center gap-3">
                    <div className="p-2.5 rounded-xl bg-accent-green/10 border border-accent-green/20">
                      <User className="w-5 h-5 text-accent-green" />
                    </div>
                    <div>
                      <h2 className="text-lg font-black text-white">Create On-Chain Profile</h2>
                      <p className="text-xs text-text-main/50">Link your GitHub identity to Solana</p>
                    </div>
                  </div>
                  {!loading && (
                    <button
                      onClick={onClose}
                      className="p-1.5 rounded-lg hover:bg-[#30363d] text-text-main/40 hover:text-white transition-colors"
                    >
                      <X className="w-4 h-4" />
                    </button>
                  )}
                </div>

                {/* Success State */}
                {done ? (
                  <motion.div
                    initial={{ opacity: 0, scale: 0.9 }}
                    animate={{ opacity: 1, scale: 1 }}
                    className="text-center py-6"
                  >
                    <div className="flex justify-center mb-4">
                      <div className="p-4 rounded-full bg-accent-green/10 border border-accent-green/20">
                        <CheckCircle2 className="w-10 h-10 text-accent-green" />
                      </div>
                    </div>
                    <h3 className="text-xl font-black text-white mb-2">Profile Created!</h3>
                    <p className="text-sm text-text-main/50 mb-4">
                      Your on-chain identity is now live on Solana Devnet.
                    </p>
                    {txSig && (
                      <a
                        href={explorerTxUrl(txSig)}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="text-xs text-accent-green underline underline-offset-2"
                      >
                        View transaction →
                      </a>
                    )}
                  </motion.div>
                ) : (
                  <form onSubmit={handleCreate} className="space-y-5">
                    {/* Info box */}
                    <div className="rounded-xl bg-white/3 border border-white/8 p-4">
                      <p className="text-xs text-text-main/50 leading-relaxed">
                        This creates two on-chain accounts (UserProfile + UsernameIndex) on Solana Devnet.
                        A small rent fee (~0.002 SOL) will be charged from your wallet.
                      </p>
                    </div>

                    {/* Username input */}
                    <div>
                      <label className="text-xs font-bold text-text-main/40 uppercase tracking-wider mb-2 block">
                        GitHub Username
                      </label>
                      <div className="relative">
                        <div className="absolute left-4 top-1/2 -translate-y-1/2">
                          <Github className="w-4 h-4 text-text-main/30" />
                        </div>
                        <input
                          type="text"
                          value={username}
                          onChange={(e) => setUsername(e.target.value.replace(/\s/g, ''))}
                          placeholder="your-github-username"
                          maxLength={32}
                          disabled={loading}
                          className="w-full pl-10 pr-4 py-3.5 rounded-xl bg-[#30363d] border border-[#30363d] text-white placeholder:text-text-main/25 focus:outline-none focus:border-accent-green/50 transition-all text-sm font-mono disabled:opacity-50"
                          autoFocus
                        />
                      </div>
                      <p className="text-[10px] text-text-main/30 mt-1.5 text-right">
                        {username.length}/32
                      </p>
                    </div>

                    {/* Submit button */}
                    <motion.button
                      type="submit"
                      disabled={!isValidUsername || loading}
                      whileHover={isValidUsername && !loading ? { scale: 1.02 } : {}}
                      whileTap={isValidUsername && !loading ? { scale: 0.98 } : {}}
                      className={`w-full py-4 rounded-xl font-black text-sm flex items-center justify-center gap-2 transition-all duration-300 ${
                        isValidUsername && !loading
                          ? 'bg-accent-green text-white shadow-glow hover:bg-[#3fb950]'
                          : 'bg-[#30363d] text-text-main/30 cursor-not-allowed'
                      }`}
                    >
                      {loading ? (
                        <>
                          <Loader2 className="w-4 h-4 animate-spin" />
                          Creating Profile…
                        </>
                      ) : (
                        'Create Profile On-Chain'
                      )}
                    </motion.button>
                  </form>
                )}
              </div>
            </div>
          </motion.div>
        </>
      )}
    </AnimatePresence>
  );
}
