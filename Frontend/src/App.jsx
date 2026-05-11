import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import HeroSection from './components/HeroSection';
import AnalyzerForm from './components/AnalyzerForm';
import LoadingState from './components/LoadingState';
import ResultDashboard from './components/ResultDashboard';
import ErrorCard from './components/ErrorCard';
import AboutSection from './components/AboutSection';
import HowItWorks from './components/HowItWorks';
import WalletButton from './components/WalletButton';
import CreateProfileModal from './components/CreateProfileModal';
import { analyzeCommit } from './services/api';
import { useSolana } from './context/SolanaContext.jsx';
import { initializeProtocol } from './solana/program.js';
import toast from 'react-hot-toast';
import Dashboard from './components/Dashboard';
import Playground from './components/Playground';

function InitAdminButton() {
  const { isWalletConnected, wallet } = useSolana();
  const [loading, setLoading] = useState(false);

  if (!isWalletConnected) return null;

  const handleInit = async () => {
    setLoading(true);
    const toastId = toast.loading('Initializing protocol...');
    try {
      const sig = await initializeProtocol(wallet, wallet.publicKey);
      toast.success('Protocol Initialized on-chain!', { id: toastId });
    } catch (err) {
      console.error(err);
      toast.error(err.message || 'Initialization failed', { id: toastId });
    } finally {
      setLoading(false);
    }
  };

  // Only the designated admin should see this button
  const ADMIN_WALLET = 'GNN25gvBm4LZ9sWFBqpDKtYFtpeyT9krJtPpU4myEpJP';
  if (wallet.publicKey?.toBase58() !== ADMIN_WALLET) return null;

  return (
    <button
      onClick={handleInit}
      disabled={loading}
      className="text-[10px] uppercase tracking-wider font-bold text-accent-green/60 hover:text-accent-green transition-colors bg-accent-green/10 px-2 py-1 rounded"
      title="Initialize Global Protocol State"
    >
      {loading ? 'Initializing...' : 'Init Protocol'}
    </button>
  );

}

function AppContent() {
  const [isLoading, setIsLoading] = useState(false);
  const [result, setResult] = useState(null);
  const [error, setError] = useState(null);
  const [showCreateProfile, setShowCreateProfile] = useState(false);
  const [currentRoute, setCurrentRoute] = useState('home');

  const { isWalletConnected, profile, profileLoading, profileChecked } = useSolana();

  // ─── Auto-show create-profile modal ────────────────────────────────────────
  // When wallet is connected, loading is done, and profile check came back null
  // (meaning the user has no on-chain profile yet), pop the modal automatically.
  useEffect(() => {
    if (isWalletConnected && profileChecked && !profileLoading && profile === null) {
      // Small delay so wallet modal has time to close first
      const timer = setTimeout(() => setShowCreateProfile(true), 600);
      return () => clearTimeout(timer);
    }
    // If they already have a profile, make sure modal is closed
    if (isWalletConnected && profile !== null) {
      setShowCreateProfile(false);
    }
  }, [isWalletConnected, profile, profileLoading, profileChecked]);

  // Close modal and reset when wallet disconnects
  useEffect(() => {
    if (!isWalletConnected) {
      setShowCreateProfile(false);
    }
  }, [isWalletConnected]);

  const handleAnalyze = async (githubUrl) => {
    setIsLoading(true);
    setError(null);
    setResult(null);

    try {
      const [data] = await Promise.all([
        analyzeCommit(githubUrl),
        new Promise(resolve => setTimeout(resolve, 3000))
      ]);

      if (data.success) {
        setResult({ ...data.data, githubUrl }); // Ensure githubUrl is passed down to StoreProofButton
      } else {
        setError(data.message || "Failed to analyze contribution.");
      }
    } catch (err) {
      console.error("Analysis error:", err);
      setError(
        err.response?.data?.message ||
        "Backend connection error. Please ensure the EffortX API is running on https://effortx-commit-analyzer.vercel.app/api/health"
      );
    } finally {
      setIsLoading(false);
    }
  };

  const scrollToAnalyzer = () => {
    document.getElementById('analyzer')?.scrollIntoView({ behavior: 'smooth' });
  };

  const handleRetry = () => {
    setError(null);
    scrollToAnalyzer();
  };

  return (
    <div className="min-h-screen bg-background text-text-main font-sans selection:bg-accent-green/30 selection:text-white">

      {/* ── Navbar ───────────────────────────────────────────────────────────── */}
      <nav className="fixed top-0 left-0 w-full z-40 px-6 py-4 flex justify-between items-center backdrop-blur-md bg-background/80 border-b border-white/5">
        <div
          className="flex items-center gap-2 group cursor-pointer"
          onClick={() => {
            setCurrentRoute('home');
            window.scrollTo({ top: 0, behavior: 'smooth' });
          }}
        >
          <img
            className="w-8 h-8 rounded-lg bg-accent-green flex items-center justify-center font-black text-black group-hover:shadow-glow transition-all"
            src="./logo.png"
            alt="EffortX"
          />
          <span className="text-2xl font-black text-heading tracking-tighter">
            Effort<span className="text-accent-green group-hover:text-white transition-colors">X</span>
          </span>
        </div>

        <div className="hidden md:flex items-center gap-8 text-sm font-medium text-text-main/70">
          {isWalletConnected && profile && (
            <button
              onClick={() => setCurrentRoute('dashboard')}
              className={`transition-colors cursor-pointer ${currentRoute === 'dashboard' ? 'text-white' : 'hover:text-white'}`}
            >
              Dashboard
            </button>
          )}
          {isWalletConnected && profile && (
            <button
              onClick={() => setCurrentRoute('playground')}
              className={`transition-colors cursor-pointer font-bold flex items-center gap-2 ${currentRoute === 'playground' ? 'text-accent-green' : 'hover:text-white'}`}
            >
              <span className="w-2 h-2 rounded-full bg-accent-green animate-pulse"></span>
              AI Playground
            </button>
          )}
          <button
            onClick={() => {
              if (currentRoute !== 'home') setCurrentRoute('home');
              setTimeout(scrollToAnalyzer, 100);
            }}
            className="hover:text-white transition-colors cursor-pointer"
          >
            Analyze
          </button>
          {currentRoute === 'home' && !isWalletConnected && (
            <>
              <a href="#about" className="hover:text-white transition-colors cursor-pointer">About EffortX</a>
              <a href="#how-it-works" className="hover:text-white transition-colors cursor-pointer">How It Works</a>
            </>
          )}



          <a href="https://github.com/viv2005ek/EffortX" target="_blank" rel="noopener noreferrer" className="hover:text-white transition-colors cursor-pointer">GitHub</a>

          <WalletButton />

          {/* Nudge badge: connected but no profile and check completed */}
          <AnimatePresence>
            {isWalletConnected && profileChecked && !profileLoading && profile === null && (
              <motion.button
                key="nudge"
                initial={{ opacity: 0, scale: 0.85, x: 10 }}
                animate={{ opacity: 1, scale: 1, x: 0 }}
                exit={{ opacity: 0, scale: 0.85, x: 10 }}
                transition={{ type: 'spring', stiffness: 400, damping: 25 }}
                onClick={() => setShowCreateProfile(true)}
                className="px-3 py-1.5 rounded-lg bg-accent-green/10 border border-accent-green/30 text-accent-green text-xs font-bold hover:bg-accent-green/20 transition-all whitespace-nowrap"
              >
                Create Profile →
              </motion.button>
            )}
          </AnimatePresence>
        </div>

        {/* Mobile wallet button */}
        <div className="md:hidden">
          <WalletButton />
        </div>
      </nav>

      {/* ── Main Content ──────────────────────────────────────────────────────── */}
      <main className="pt-20">
        <AnimatePresence mode="wait">
          {currentRoute === 'home' ? (
            <motion.div
              key="home"
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -10 }}
            >
              <HeroSection onScrollToAnalyzer={scrollToAnalyzer} onOpenPlayground={() => setCurrentRoute('playground')} />

              <div className="pb-40">
                <AnalyzerForm onAnalyze={handleAnalyze} isLoading={isLoading} />

                <AnimatePresence>
                  {isLoading && <LoadingState />}
                </AnimatePresence>

                <AnimatePresence mode="wait">
                  {result && (
                    <motion.div
                      key="result"
                      initial={{ opacity: 0 }}
                      animate={{ opacity: 1 }}
                      transition={{ duration: 0.5 }}
                    >
                      <ResultDashboard data={result} />
                    </motion.div>
                  )}

                  {error && (
                    <motion.div
                      key="error"
                      initial={{ opacity: 0 }}
                      animate={{ opacity: 1 }}
                    >
                      <ErrorCard message={error} onRetry={handleRetry} />
                    </motion.div>
                  )}
                </AnimatePresence>

                <AboutSection />
                <HowItWorks />
              </div>
            </motion.div>
          ) : currentRoute === 'dashboard' ? (
            <motion.div
              key="dashboard"
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -10 }}
            >
              <Dashboard />
            </motion.div>
          ) : (
            <motion.div
              key="playground"
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -10 }}
            >
              <Playground />
            </motion.div>
          )}
        </AnimatePresence>
      </main>

      {/* ── Footer ────────────────────────────────────────────────────────────── */}
      <footer className="py-20 border-t border-white/5 px-6">
        <div className="max-w-6xl mx-auto flex flex-col md:flex-row justify-between items-center gap-8">
          <div className="flex items-center gap-2">
            <div className="w-6 h-6 rounded-md bg-white/10 flex items-center justify-center font-bold text-[10px] text-white">E</div>
            <span className="text-sm font-bold text-heading">EffortX Engine v1.0</span>
            <InitAdminButton />
          </div>
          <div className="text-sm text-text-main/40">
            © 2026 EffortX Platform. Powered by Gemini 2.5 Pro + Solana.
          </div>
          <div className="flex gap-6 text-text-main/40 hover:text-text-main transition-colors text-xs uppercase tracking-widest font-bold">
            <a href="#">Privacy</a>
            <a href="#">Terms</a>
            <a href="#">GitHub</a>
          </div>
        </div>
      </footer>

      {/* ── Create Profile Modal ───────────────────────────────────────────────── */}
      <CreateProfileModal
        isOpen={showCreateProfile}
        onClose={() => setShowCreateProfile(false)}
      />
    </div>
  );
}

export default function App() {
  return <AppContent />;
}
