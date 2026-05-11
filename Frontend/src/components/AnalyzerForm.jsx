import React, { useState, useRef } from 'react';
import { motion, useMotionValue, useSpring, useTransform, AnimatePresence } from 'framer-motion';
import { Code2 as Github, Search, Loader2, ArrowRight, GitBranch, GitCommit, Terminal } from 'lucide-react';

const TiltWrapper = ({ children }) => {
  const ref = useRef(null);
  const x = useMotionValue(0);
  const y = useMotionValue(0);
  const mouseXSpring = useSpring(x, { stiffness: 100, damping: 30 });
  const mouseYSpring = useSpring(y, { stiffness: 100, damping: 30 });
  const rotateX = useTransform(mouseYSpring, [-0.5, 0.5], ["5deg", "-5deg"]);
  const rotateY = useTransform(mouseXSpring, [-0.5, 0.5], ["-5deg", "5deg"]);

  const handleMouseMove = (e) => {
    if (!ref.current) return;
    const rect = ref.current.getBoundingClientRect();
    const width = rect.width;
    const height = rect.height;
    const mouseX = e.clientX - rect.left;
    const mouseY = e.clientY - rect.top;
    x.set(mouseX / width - 0.5);
    y.set(mouseY / height - 0.5);
  };

  const handleMouseLeave = () => {
    x.set(0);
    y.set(0);
  };

  return (
    <motion.div
      ref={ref}
      onMouseMove={handleMouseMove}
      onMouseLeave={handleMouseLeave}
      style={{ rotateX, rotateY, transformStyle: "preserve-3d", perspective: 1000 }}
      className="relative w-full max-w-4xl mx-auto z-10"
    >
      {children}
    </motion.div>
  );
};

const AnalyzerForm = ({ onAnalyze, isLoading }) => {
  const [url, setUrl] = useState('');
  const [isFocused, setIsFocused] = useState(false);

  const handleSubmit = (e) => {
    e.preventDefault();
    if (url.trim()) {
      onAnalyze(url);
    }
  };

  return (
    <div id="analyzer" className="w-full max-w-4xl mx-auto px-4 py-16 relative z-10">
      <motion.div
        initial={{ opacity: 0, y: 40 }}
        whileInView={{ opacity: 1, y: 0 }}
        viewport={{ once: true, margin: "-100px" }}
        transition={{ duration: 0.8, ease: "easeOut" }}
      >
        <TiltWrapper>
          <div className="relative group">
            {/* 3D Drop Shadow / Glow */}
            <div className="absolute -inset-1 bg-accent-green/20 rounded-[2rem] blur-[80px] transition-opacity duration-1000 opacity-40 group-hover:opacity-70" style={{ transform: 'translateZ(-10px)' }} />
            
            <div className="relative p-1 rounded-[2rem] bg-gradient-to-b from-[#30363d] to-[#161b22] shadow-[0_40px_80px_-20px_rgba(0,0,0,0.9)] overflow-hidden">
              <div className="relative p-8 md:p-12 rounded-[1.8rem] bg-[#0d1117] h-full">
                
                {/* Decorative Elements */}
                <div className="absolute top-0 right-0 p-8 opacity-20 pointer-events-none" style={{ transform: 'translateZ(10px)' }}>
                  <Terminal className="w-48 h-48 text-accent-green transform rotate-12 scale-150" />
                </div>
                
                <div className="relative z-20 flex flex-col md:flex-row items-start justify-between gap-8 mb-10 border-b border-[#30363d]/50 pb-8">
                  <div className="flex items-center gap-6">
                    <div className="relative w-16 h-16 rounded-2xl bg-gradient-to-br from-[#161b22] to-[#0d1117] border border-[#30363d] flex items-center justify-center shadow-lg transform hover:scale-105 transition-transform duration-300">
                      <div className="absolute inset-0 rounded-2xl bg-accent-green/5 blur-md" />
                      <Github className="w-8 h-8 text-white relative z-10" />
                    </div>
                    <div>
                      <h2 className="text-3xl md:text-4xl font-extrabold text-white tracking-tight mb-2">
                        Analyze Commit
                      </h2>
                      <div className="flex items-center gap-3 text-sm text-[#8b949e] font-mono">
                        <span className="flex items-center gap-1.5"><GitCommit className="w-4 h-4" /> SHA-256</span>
                        <span className="flex items-center gap-1.5"><GitBranch className="w-4 h-4" /> diff tree</span>
                      </div>
                    </div>
                  </div>
                </div>

                <form onSubmit={handleSubmit} className="relative z-20 space-y-8">
                  <div className="space-y-3">
                    <label className="text-xs font-bold text-text-main/50 uppercase tracking-widest ml-1">Target Repository URL</label>
                    <div 
                      className={`relative flex items-center bg-[#0d1117] border-2 ${isFocused ? 'border-accent-green shadow-[0_0_20px_rgba(46,160,67,0.2)]' : 'border-[#30363d]'} rounded-xl transition-all duration-300 overflow-hidden transform-gpu group-hover:border-[#3fb950]/50`}
                    >
                      <div className="pl-6 pr-4 flex items-center justify-center bg-[#161b22] h-full py-5 border-r border-[#30363d]">
                        <Search className={`w-5 h-5 transition-colors ${isFocused ? 'text-accent-green' : 'text-[#8b949e]'}`} />
                      </div>
                      <input
                        type="text"
                        value={url}
                        onChange={(e) => setUrl(e.target.value)}
                        onFocus={() => setIsFocused(true)}
                        onBlur={() => setIsFocused(false)}
                        placeholder="https://github.com/owner/repo/commit/hash"
                        className="flex-1 bg-transparent py-5 px-5 text-[#c9d1d9] placeholder:text-[#8b949e]/50 focus:outline-none font-mono text-[15px]"
                        disabled={isLoading}
                      />
                      
                      <AnimatePresence>
                        {url && !isLoading && (
                          <motion.div 
                            initial={{ opacity: 0, scale: 0.8 }}
                            animate={{ opacity: 1, scale: 1 }}
                            exit={{ opacity: 0, scale: 0.8 }}
                            className="pr-6"
                          >
                            <div className="w-2.5 h-2.5 rounded-full bg-accent-green shadow-[0_0_12px_#2ea043] animate-pulse" />
                          </motion.div>
                        )}
                      </AnimatePresence>
                    </div>
                  </div>

                  <motion.button
                    whileHover={{ scale: 1.02, y: -2 }}
                    whileTap={{ scale: 0.98 }}
                    disabled={isLoading || !url.trim()}
                    className={`relative w-full overflow-hidden rounded-xl font-bold text-[16px] transition-all duration-300 ${
                      isLoading || !url.trim()
                        ? 'bg-[#161b22] text-[#8b949e] cursor-not-allowed border border-[#30363d]'
                        : 'bg-accent-green text-black shadow-[0_0_30px_rgba(46,160,67,0.3)] hover:shadow-[0_0_40px_rgba(46,160,67,0.5)] border border-[#3fb950]'
                    }`}
                  >
                    <div className="relative px-8 py-5 flex items-center justify-center gap-3 z-10">
                      {isLoading ? (
                        <>
                          <Loader2 className="w-5 h-5 animate-spin" />
                          <span>Executing AI Verification...</span>
                        </>
                      ) : (
                        <>
                          <span>Initiate Analysis</span>
                          <ArrowRight className="w-5 h-5" />
                        </>
                      )}
                    </div>
                  </motion.button>
                </form>
              </div>
            </div>
          </div>
        </TiltWrapper>
      </motion.div>
    </div>
  );
};

export default AnalyzerForm;
