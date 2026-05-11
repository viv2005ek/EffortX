import React, { useState, useEffect, useRef } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { useSolana } from '../context/SolanaContext';
import { transferEcoins } from '../solana/program';
import { estimatePlaygroundTokens, chatWithPlayground } from '../services/api';
import toast from 'react-hot-toast';

// The admin wallet that receives the ECOIN payments
const ADMIN_WALLET = 'GNN25gvBm4LZ9sWFBqpDKtYFtpeyT9krJtPpU4myEpJP';

export default function Playground() {
  const { isWalletConnected, wallet, profile, refreshProfile } = useSolana();
  const [messages, setMessages] = useState([]);
  const [input, setInput] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [isTransferring, setIsTransferring] = useState(false);
  const [estimatedCost, setEstimatedCost] = useState(null);
  const messagesEndRef = useRef(null);

  const models = [
    { id: 'gemini-2.5-flash', name: 'Gemini-2.5-Flash', active: true },
    { id: 'claude-sonnet', name: 'Claude Sonnet', active: false },
    { id: 'gpt-4.1', name: 'GPT-4.1', active: false },
    { id: 'codex', name: 'Codex', active: false },
  ];

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  };

  useEffect(() => {
    scrollToBottom();
  }, [messages]);

  // Temporary function to estimate cost locally if we don't want to make an extra API call for every keystroke,
  // but let's debounce an API call to estimate if needed. For simplicity in MVP, we can estimate on submit.
  const calculateEstimate = async (text) => {
    if (!text.trim()) return null;
    try {
      // Use local estimation logic to avoid spamming the backend
      const totalChars = messages.reduce((acc, msg) => acc + (msg.content?.length || 0), 0) + text.length;
      const estimatedTokens = Math.ceil(totalChars / 4);
      const cost = Math.max(2, Math.ceil(estimatedTokens / 50));
      setEstimatedCost(cost);
      return cost;
    } catch (e) {
      console.error(e);
      return 2;
    }
  };

  useEffect(() => {
    const timer = setTimeout(() => {
      calculateEstimate(input);
    }, 500);
    return () => clearTimeout(timer);
  }, [input, messages]);

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!input.trim() || isLoading || isTransferring) return;

    const currentInput = input;
    setInput('');
    setEstimatedCost(null);

    const newUserMessage = { role: 'user', content: currentInput };
    const newMessages = [...messages, newUserMessage];
    setMessages(newMessages);

    try {
      // 1. Get official estimate from backend
      setIsLoading(true);
      const estimateRes = await estimatePlaygroundTokens(newMessages);
      const cost = estimateRes.ecoinCost || 2; // fallback

      // 2. Check balance
      if (!profile || profile.ecoinBalance < cost) {
        toast.error(`Insufficient ECOIN balance. Needed: ${cost} ECOIN`);
        setIsLoading(false);
        // We can either keep the message or remove it if failed
        setMessages(messages);
        setInput(currentInput);
        return;
      }

      // 3. Transfer ECOIN
      setIsTransferring(true);
      setIsLoading(false);
      const toastId = toast.loading(`Transferring ${cost} ECOIN...`);
      
      try {
        await transferEcoins(wallet, ADMIN_WALLET, cost);
        toast.success(`Transferred ${cost} ECOIN successfully!`, { id: toastId });
        // Refresh profile to show new balance
        refreshProfile();
      } catch (txError) {
        console.error("Transfer error:", txError);
        toast.error("ECOIN transfer failed. Message not sent.", { id: toastId });
        setIsTransferring(false);
        setMessages(messages); // rollback message
        setInput(currentInput);
        return;
      }

      // 4. Call AI API
      setIsTransferring(false);
      setIsLoading(true);
      
      const aiRes = await chatWithPlayground(newMessages, wallet.publicKey.toBase58(), 'gemini-2.5-flash');
      
      if (aiRes.success) {
        setMessages([...newMessages, { role: 'assistant', content: aiRes.reply }]);
      } else {
        throw new Error(aiRes.error || "Failed to get AI response");
      }

    } catch (error) {
      console.error(error);
      toast.error(error.message || "An error occurred.");
      // Rollback
      setMessages(messages);
      setInput(currentInput);
    } finally {
      setIsLoading(false);
      setIsTransferring(false);
    }
  };

  if (!isWalletConnected || !profile) {
    return (
      <div className="flex flex-col items-center justify-center min-h-[60vh] text-center px-4">
        <h2 className="text-2xl font-bold text-white mb-4">Connect to Access Playground</h2>
        <p className="text-text-main/60 mb-8 max-w-md">
          The AI Playground requires an active on-chain profile and ECOIN balance to use premium developer models.
        </p>
      </div>
    );
  }

  return (
    <div className="max-w-5xl mx-auto px-6 pb-20">
      <div className="mb-8 flex flex-col md:flex-row justify-between items-start md:items-center gap-4 border-b border-white/5 pb-6">
        <div>
          <h1 className="text-3xl font-black text-white tracking-tight drop-shadow-md">AI Playground</h1>
          <p className="text-accent-green/80 mt-1 font-bold text-sm uppercase tracking-widest">Premium developer AI tooling powered by your on-chain reputation.</p>
        </div>
        
        <div className="flex items-center gap-4 bg-[#161b22] border border-[#30363d] rounded-xl p-4 shadow-sm">
          <div className="text-sm">
            <div className="text-text-main/60 uppercase tracking-widest text-[10px] font-black">Balance</div>
            <div className="font-bold text-accent-green text-lg drop-shadow-md">{profile.ecoinBalance} ECOIN</div>
          </div>
          <div className="w-px h-8 bg-white/10"></div>
          <div className="text-sm">
            <div className="text-text-main/60 uppercase tracking-widest text-[10px] font-black">Est. Cost</div>
            <div className="font-bold text-white text-lg">{estimatedCost || '-'} ECOIN</div>
          </div>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-4 gap-6">
        {/* Sidebar */}
        <div className="lg:col-span-1 space-y-4">
          <h3 className="text-xs font-bold text-text-main/40 uppercase tracking-widest mb-4">Models</h3>
          <div className="space-y-2">
            {models.map(m => (
              <div 
                key={m.id} 
                className={`p-3 rounded-xl border transition-all ${m.active ? 'bg-accent-green/10 border-accent-green/30 text-white' : 'bg-white/5 border-white/5 text-text-main/40 cursor-not-allowed opacity-50'}`}
              >
                <div className="flex justify-between items-center">
                  <span className="font-semibold text-sm">{m.name}</span>
                  {m.active ? (
                    <span className="w-2 h-2 rounded-full bg-accent-green shadow-[0_0_8px_#A3FF12]"></span>
                  ) : (
                    <span className="text-[10px] uppercase font-bold tracking-wider">Coming Soon</span>
                  )}
                </div>
              </div>
            ))}
          </div>

        </div>

        {/* Chat Area */}
        <div className="lg:col-span-3 flex flex-col h-[600px] bg-[#0d1117] border border-[#30363d] rounded-[2rem] overflow-hidden shadow-sm relative group">
          <div className="absolute inset-0 bg-gradient-to-b from-[#3fb950]/5 to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-700 pointer-events-none" />
          <div className="flex-1 overflow-y-auto p-6 space-y-6 relative z-10">
            {messages.length === 0 && (
              <div className="h-full flex flex-col items-center justify-center text-center opacity-50">
                <div className="w-12 h-12 rounded-xl bg-white/5 flex items-center justify-center mb-4">
                  <svg className="w-6 h-6 text-white" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 10h.01M12 10h.01M16 10h.01M9 16H5a2 2 0 01-2-2V6a2 2 0 012-2h14a2 2 0 012 2v8a2 2 0 01-2 2h-5l-5 5v-5z" />
                  </svg>
                </div>
                <p className="text-lg font-bold text-white">Start a Conversation</p>
                <p className="text-sm">Ask coding questions, review logic, or generate snippets.</p>
              </div>
            )}
            
            <AnimatePresence initial={false}>
              {messages.map((msg, i) => (
                <motion.div
                  key={i}
                  initial={{ opacity: 0, y: 10 }}
                  animate={{ opacity: 1, y: 0 }}
                  className={`flex ${msg.role === 'user' ? 'justify-end' : 'justify-start'}`}
                >
                  <div 
                    className={`max-w-[85%] rounded-2xl px-5 py-3 ${
                      msg.role === 'user' 
                        ? 'bg-accent-green text-black font-medium' 
                        : 'bg-white/10 text-white'
                    }`}
                  >
                    <div className="whitespace-pre-wrap text-sm leading-relaxed">{msg.content}</div>
                  </div>
                </motion.div>
              ))}
            </AnimatePresence>

            {isTransferring && (
              <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="flex justify-start">
                <div className="bg-[#161b22] border border-[#3fb950]/30 text-accent-green rounded-2xl px-5 py-3 text-sm flex items-center gap-3 font-bold shadow-sm">
                  <div className="w-4 h-4 border-2 border-[#3fb950]/30 border-t-accent-green rounded-full animate-spin"></div>
                  Transferring ECOIN...
                </div>
              </motion.div>
            )}

            {isLoading && !isTransferring && (
              <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="flex justify-start">
                <div className="bg-white/10 text-white/50 rounded-2xl px-5 py-3 text-sm flex items-center gap-2">
                  <span className="animate-pulse">●</span>
                  <span className="animate-pulse animation-delay-200">●</span>
                  <span className="animate-pulse animation-delay-400">●</span>
                </div>
              </motion.div>
            )}
            
            <div ref={messagesEndRef} />
          </div>

          <div className="p-4 bg-[#0d1117] border-t border-[#30363d] relative z-10">
            <form onSubmit={handleSubmit} className="relative group/input">
              <input
                type="text"
                value={input}
                onChange={(e) => setInput(e.target.value)}
                placeholder="Ask Gemini anything..."
                disabled={isLoading || isTransferring}
                className="w-full bg-[#161b22] border border-[#30363d] rounded-2xl pl-6 pr-14 py-5 text-[#c9d1d9] placeholder:text-[#8b949e] focus:outline-none focus:border-[#3fb950]/50 transition-all duration-300 group-hover/input:border-[#8b949e]/50 font-mono text-sm shadow-inner disabled:opacity-50"
              />
              <button
                type="submit"
                disabled={!input.trim() || isLoading || isTransferring}
                className="absolute right-3 top-1/2 -translate-y-1/2 w-10 h-10 flex items-center justify-center bg-[#30363d]/50 hover:bg-[#3fb950] hover:text-white rounded-xl text-[#c9d1d9] transition-all duration-300 disabled:opacity-50 disabled:hover:bg-[#30363d]/50"
              >
                <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 19l9 2-9-18-9 18 9-2zm0 0v-8" />
                </svg>
              </button>
            </form>
          </div>
        </div>
      </div>
    </div>
  );
}
