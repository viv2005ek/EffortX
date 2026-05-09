import React, { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import HeroSection from './components/HeroSection';
import AnalyzerForm from './components/AnalyzerForm';
import LoadingState from './components/LoadingState';
import ResultDashboard from './components/ResultDashboard';
import ErrorCard from './components/ErrorCard';
import { analyzeCommit } from './services/api';

function App() {
  const [isLoading, setIsLoading] = useState(false);
  const [result, setResult] = useState(null);
  const [error, setError] = useState(null);

  const handleAnalyze = async (githubUrl) => {
    setIsLoading(true);
    setError(null);
    setResult(null);

    try {
      // Small artificial delay to show off the premium loading state
      const [data] = await Promise.all([
        analyzeCommit(githubUrl),
        new Promise(resolve => setTimeout(resolve, 3000))
      ]);

      if (data.success) {
        setResult(data.data);
      } else {
        setError(data.message || "Failed to analyze contribution.");
      }
    } catch (err) {
      console.error("Analysis error:", err);
      setError(
        err.response?.data?.message || 
        "Backend connection error. Please ensure the EffortX API is running on localhost:5000"
      );
    } finally {
      setIsLoading(false);
    }
  };

  const scrollToAnalyzer = () => {
    const element = document.getElementById('analyzer');
    element?.scrollIntoView({ behavior: 'smooth' });
  };

  const handleRetry = () => {
    setError(null);
    scrollToAnalyzer();
  };

  return (
    <div className="min-h-screen bg-background text-text-main font-sans selection:bg-accent-green/30 selection:text-white">
      {/* Header / Logo */}
      <nav className="fixed top-0 left-0 w-full z-40 px-6 py-6 flex justify-between items-center backdrop-blur-sm bg-background/50 border-b border-white/5">
        <div className="flex items-center gap-2 group cursor-pointer">
          <div className="w-8 h-8 rounded-lg bg-accent-green flex items-center justify-center font-black text-black group-hover:shadow-glow transition-all">
            E
          </div>
          <span className="text-xl font-black text-heading tracking-tighter">
            Effort<span className="text-accent-green group-hover:text-white transition-colors">X</span>
          </span>
        </div>
        
        <div className="hidden md:flex items-center gap-8 text-sm font-medium text-text-main/60">
          <a href="#" className="hover:text-white transition-colors">Network</a>
          <a href="#" className="hover:text-white transition-colors">Documentation</a>
          <a href="#" className="hover:text-white transition-colors">API</a>
          <button className="px-5 py-2 rounded-lg bg-white/5 border border-white/10 hover:bg-white/10 text-white transition-all">
            Connect Wallet
          </button>
        </div>
      </nav>

      <main className="pt-20">
        <HeroSection onScrollToAnalyzer={scrollToAnalyzer} />
        
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
        </div>
      </main>

      {/* Footer */}
      <footer className="py-20 border-t border-white/5 px-6">
        <div className="max-w-6xl mx-auto flex flex-col md:flex-row justify-between items-center gap-8">
          <div className="flex items-center gap-2">
            <div className="w-6 h-6 rounded-md bg-white/10 flex items-center justify-center font-bold text-[10px] text-white">
              E
            </div>
            <span className="text-sm font-bold text-heading">EffortX Engine v1.0</span>
          </div>
          <div className="text-sm text-text-main/40">
            © 2026 EffortX Platform. Powered by Gemini 2.5 Pro.
          </div>
          <div className="flex gap-6 text-text-main/40 hover:text-text-main transition-colors text-xs uppercase tracking-widest font-bold">
            <a href="#">Privacy</a>
            <a href="#">Terms</a>
            <a href="#">GitHub</a>
          </div>
        </div>
      </footer>
    </div>
  );
}

export default App;
