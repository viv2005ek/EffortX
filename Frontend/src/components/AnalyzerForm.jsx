import React, { useState } from 'react';
import { motion } from 'framer-motion';
import { Github, Search, Loader2 } from 'lucide-react';

const AnalyzerForm = ({ onAnalyze, isLoading }) => {
  const [url, setUrl] = useState('');

  const handleSubmit = (e) => {
    e.preventDefault();
    if (url.trim()) {
      onAnalyze(url);
    }
  };

  return (
    <div id="analyzer" className="w-full max-w-3xl mx-auto px-4 py-20">
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        whileInView={{ opacity: 1, y: 0 }}
        viewport={{ once: true }}
        className="glass-card p-8 md:p-12 rounded-3xl relative overflow-hidden"
      >
        <div className="absolute top-0 left-0 w-full h-1 bg-gradient-to-r from-transparent via-accent-green to-transparent opacity-50" />
        
        <div className="flex items-center gap-3 mb-8">
          <div className="p-3 rounded-2xl bg-white/5 border border-white/10">
            <Github className="w-6 h-6 text-accent-green" />
          </div>
          <div>
            <h2 className="text-2xl font-bold text-heading">Contribution Analyzer</h2>
            <p className="text-sm text-text-main/60">Paste a GitHub commit or PR URL to start</p>
          </div>
        </div>

        <form onSubmit={handleSubmit} className="space-y-6">
          <div className="relative group">
            <input
              type="text"
              value={url}
              onChange={(e) => setUrl(e.target.value)}
              placeholder="https://github.com/user/repo/commit/abc123"
              className="w-full bg-[#0D1117]/50 border border-white/10 rounded-2xl px-6 py-5 text-white placeholder:text-text-main/30 focus:outline-none focus:border-accent-green/50 transition-all duration-300 pr-14 group-hover:border-white/20"
              disabled={isLoading}
            />
            <div className="absolute right-5 top-1/2 -translate-y-1/2">
              <Search className="w-5 h-5 text-text-main/30 group-focus-within:text-accent-green transition-colors" />
            </div>
          </div>

          <motion.button
            whileHover={{ scale: 1.02 }}
            whileTap={{ scale: 0.98 }}
            disabled={isLoading || !url.trim()}
            className={`w-full py-5 rounded-2xl font-bold text-lg flex items-center justify-center gap-3 transition-all duration-300 ${
              isLoading 
                ? 'bg-white/5 text-text-main/50 cursor-not-allowed' 
                : 'bg-white text-black hover:bg-white/90 shadow-lg'
            }`}
          >
            {isLoading ? (
              <>
                <Loader2 className="w-6 h-6 animate-spin" />
                Processing Analysis...
              </>
            ) : (
              'Verify Effort Score'
            )}
          </motion.button>
        </form>
      </motion.div>
    </div>
  );
};

export default AnalyzerForm;
