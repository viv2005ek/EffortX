import React, { useState, useMemo } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import {
  Layout, BarChart3, Trophy, History, Activity, 
  Wallet, Coins, ShieldCheck, ArrowUpRight, Send, 
  ExternalLink, Code2 as Github, FileText, CheckCircle2, ChevronRight, X
} from 'lucide-react';
import { useSolana } from '../context/SolanaContext.jsx';
import { buyEcoins, transferEcoins, parseBlockchainError } from '../solana/program.js';
import { explorerTxUrl } from '../solana/config.js';
import toast from 'react-hot-toast';

export default function Dashboard() {
  const { wallet, profile, leaderboard, userRank, userProofs, refreshProfile } = useSolana();
  const [activeTab, setActiveTab] = useState('overview');
  const [selectedProof, setSelectedProof] = useState(null);

  const tabs = [
    { id: 'overview', label: 'Overview', icon: Layout },
    { id: 'stats', label: 'Stats', icon: BarChart3 },
    { id: 'leaderboard', label: 'Leaderboard', icon: Trophy },
    { id: 'proofs', label: 'On-Chain Proofs', icon: History },
    { id: 'activity', label: 'Activity', icon: Activity },
  ];

  if (!profile) return (
    <div className="flex flex-col items-center justify-center min-h-[60vh] text-center">
      <ShieldCheck className="w-16 h-16 text-white/10 mb-4" />
      <h2 className="text-2xl font-black text-white mb-2">No Profile Found</h2>
      <p className="text-text-main/50 max-w-md">Connect your wallet and create a profile to access the EffortX dashboard.</p>
    </div>
  );

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 py-8 min-h-[80vh] flex flex-col md:flex-row gap-8">
      {/* Sidebar Navigation */}
      <div className="w-full md:w-64 shrink-0">
        <div className="sticky top-28 space-y-8">
          {/* User Brief */}
          <div className="glass-card rounded-2xl p-6 border border-white/5 relative overflow-hidden">
            <div className="absolute top-0 right-0 p-4 opacity-10">
              <ShieldCheck className="w-24 h-24" />
            </div>
            <div className="relative z-10">
              <div className="w-12 h-12 rounded-xl bg-accent-green/20 border border-accent-green/30 flex items-center justify-center mb-4 text-accent-green font-black text-xl">
                {profile.githubUsername[0].toUpperCase()}
              </div>
              <h3 className="text-lg font-black text-white">@{profile.githubUsername}</h3>
              <p className="text-xs text-text-main/40 font-mono mt-1">
                {wallet.publicKey?.toBase58().slice(0, 6)}...{wallet.publicKey?.toBase58().slice(-6)}
              </p>
              
              <div className="mt-6 pt-6 border-t border-white/5 space-y-3">
                <div className="flex justify-between items-center">
                  <span className="text-xs text-text-main/50">Global Rank</span>
                  <span className="text-sm font-bold text-white">#{userRank || '—'}</span>
                </div>
                <div className="flex justify-between items-center">
                  <span className="text-xs text-text-main/50">ECOIN Balance</span>
                  <span className="text-sm font-bold text-accent-green flex items-center gap-1">
                    {profile.ecoinBalance.toLocaleString()} <Coins className="w-3 h-3" />
                  </span>
                </div>
              </div>
            </div>
          </div>

          {/* Navigation Links */}
          <nav className="space-y-1">
            {tabs.map((tab) => {
              const Icon = tab.icon;
              const isActive = activeTab === tab.id;
              return (
                <button
                  key={tab.id}
                  onClick={() => setActiveTab(tab.id)}
                  className={`w-full flex items-center gap-3 px-4 py-3 rounded-xl text-sm font-bold transition-all duration-200 ${
                    isActive 
                      ? 'bg-accent-green/10 text-accent-green border border-accent-green/20' 
                      : 'text-text-main/50 hover:bg-white/5 hover:text-white border border-transparent'
                  }`}
                >
                  <Icon className={`w-4 h-4 ${isActive ? 'text-accent-green' : 'text-text-main/40'}`} />
                  {tab.label}
                  {isActive && (
                    <motion.div layoutId="activeTabIndicator" className="ml-auto w-1.5 h-1.5 rounded-full bg-accent-green" />
                  )}
                </button>
              );
            })}
          </nav>
        </div>
      </div>

      {/* Main Content Area */}
      <div className="flex-1 min-w-0">
        <AnimatePresence mode="wait">
          <motion.div
            key={activeTab}
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -10 }}
            transition={{ duration: 0.2 }}
            className="h-full"
          >
            {activeTab === 'overview' && <OverviewTab profile={profile} userRank={userRank} refreshProfile={refreshProfile} wallet={wallet} />}
            {activeTab === 'stats' && <StatsTab profile={profile} userProofs={userProofs} />}
            {activeTab === 'leaderboard' && <LeaderboardTab leaderboard={leaderboard} wallet={wallet} />}
            {activeTab === 'proofs' && <ProofsTab proofs={userProofs} onSelectProof={setSelectedProof} />}
            {activeTab === 'activity' && <ActivityTab proofs={userProofs} profile={profile} />}
          </motion.div>
        </AnimatePresence>
      </div>

      {/* Proof Details Modal */}
      <AnimatePresence>
        {selectedProof && (
          <ProofModal proof={selectedProof} onClose={() => setSelectedProof(null)} />
        )}
      </AnimatePresence>
    </div>
  );
}

// ----------------------------------------------------------------------
// TABS COMPONENTS
// ----------------------------------------------------------------------

function OverviewTab({ profile, userRank, refreshProfile, wallet }) {
  const [solInput, setSolInput] = useState('');
  const [transferTo, setTransferTo] = useState('');
  const [transferAmount, setTransferAmount] = useState('');
  const [txLoading, setTxLoading] = useState(false);

  const handleBuy = async (e) => {
    e.preventDefault();
    const solAmt = parseFloat(solInput);
    if (!solAmt || solAmt < 0.001) {
      toast.error('Minimum purchase is 0.001 SOL.');
      return;
    }
    setTxLoading(true);
    const toastId = toast.loading(`Buying ECOIN...`);
    try {
      await buyEcoins(wallet, solAmt);
      toast.success(`Purchase successful!`, { id: toastId });
      setSolInput('');
      refreshProfile();
    } catch (err) {
      toast.error(parseBlockchainError(err), { id: toastId });
    } finally {
      setTxLoading(false);
    }
  };

  const handleTransfer = async (e) => {
    e.preventDefault();
    const amt = parseInt(transferAmount, 10);
    if (!transferTo.trim() || !amt || amt <= 0) return;
    setTxLoading(true);
    const toastId = toast.loading(`Transferring ECOIN...`);
    try {
      await transferEcoins(wallet, transferTo.trim(), amt);
      toast.success(`Transfer successful!`, { id: toastId });
      setTransferTo('');
      setTransferAmount('');
      refreshProfile();
    } catch (err) {
      toast.error(parseBlockchainError(err), { id: toastId });
    } finally {
      setTxLoading(false);
    }
  };

  const ecoinPreview = solInput ? Math.floor(parseFloat(solInput || 0) * 1000) : 0;

  return (
    <div className="space-y-6">
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
        <StatCard title="Global Rank" value={`#${userRank || '—'}`} icon={Trophy} color="text-yellow-400" />
        <StatCard title="ECOIN Balance" value={profile.ecoinBalance.toLocaleString()} icon={Coins} color="text-accent-green" />
        <StatCard title="Total XP" value={profile.totalXp.toLocaleString()} icon={ArrowUpRight} color="text-purple-400" />
        <StatCard title="Avg Score" value={profile.averageScore || '—'} icon={BarChart3} color="text-blue-400" />
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <div className="glass-card p-6 rounded-2xl border border-white/5">
          <h4 className="text-sm font-black text-white flex items-center gap-2 mb-4">
            <Coins className="w-4 h-4 text-accent-green" /> Buy ECOIN
          </h4>
          <form onSubmit={handleBuy} className="space-y-4">
            <div>
              <label className="text-xs text-text-main/50 mb-1 block">Amount in SOL</label>
              <input
                type="number" min="0.001" step="0.001"
                value={solInput} onChange={(e) => setSolInput(e.target.value)}
                placeholder="0.1 SOL" disabled={txLoading}
                className="w-full bg-black/30 border border-white/10 rounded-xl px-4 py-3 text-white focus:border-accent-green/50 transition-all font-mono"
              />
              {ecoinPreview > 0 && <p className="text-xs text-accent-green mt-2">≈ {ecoinPreview.toLocaleString()} ECOIN</p>}
            </div>
            <button type="submit" disabled={txLoading || !solInput} className="w-full py-3 rounded-xl font-bold bg-accent-green text-black hover:bg-[#3fb950] transition-all disabled:opacity-50 shadow-glow">
              {txLoading ? 'Processing...' : 'Purchase ECOIN'}
            </button>
          </form>
        </div>

        <div className="glass-card p-6 rounded-2xl border border-white/5">
          <h4 className="text-sm font-black text-white flex items-center gap-2 mb-4">
            <Send className="w-4 h-4 text-blue-400" /> Transfer ECOIN
          </h4>
          <form onSubmit={handleTransfer} className="space-y-4">
            <div>
              <label className="text-xs text-text-main/50 mb-1 block">Recipient Wallet Address</label>
              <input
                type="text" value={transferTo} onChange={(e) => setTransferTo(e.target.value)}
                placeholder="Solana Address" disabled={txLoading}
                className="w-full bg-black/30 border border-white/10 rounded-xl px-4 py-3 text-white focus:border-blue-500/50 transition-all font-mono text-sm"
              />
            </div>
            <div>
              <label className="text-xs text-text-main/50 mb-1 block">Amount (ECOIN)</label>
              <input
                type="number" min="1" max={profile.ecoinBalance}
                value={transferAmount} onChange={(e) => setTransferAmount(e.target.value)}
                placeholder="100" disabled={txLoading}
                className="w-full bg-black/30 border border-white/10 rounded-xl px-4 py-3 text-white focus:border-blue-500/50 transition-all font-mono"
              />
            </div>
            <button type="submit" disabled={txLoading || !transferTo || !transferAmount} className="w-full py-3 rounded-xl font-bold bg-white/10 text-white hover:bg-white/20 transition-all disabled:opacity-50">
              {txLoading ? 'Transferring...' : 'Send ECOIN'}
            </button>
          </form>
        </div>
      </div>
    </div>
  );
}

function StatsTab({ profile, userProofs }) {
  const highestScore = userProofs.length > 0 ? Math.max(...userProofs.map(p => p.effortScore)) : 0;
  
  return (
    <div className="space-y-6">
      <div className="glass-card p-8 rounded-3xl border border-white/5">
        <h3 className="text-xl font-black text-white mb-6 flex items-center gap-3">
          <BarChart3 className="w-5 h-5 text-accent-green" /> Contribution Analytics
        </h3>
        <div className="grid grid-cols-2 md:grid-cols-4 gap-6">
          <div className="p-4 rounded-2xl bg-black/20 border border-white/5">
            <p className="text-xs text-text-main/50 uppercase tracking-wider mb-2">Total Analyzed</p>
            <p className="text-3xl font-black text-white">{profile.totalProofs}</p>
            <p className="text-xs text-text-main/30 mt-1">Commits & PRs</p>
          </div>
          <div className="p-4 rounded-2xl bg-black/20 border border-white/5">
            <p className="text-xs text-text-main/50 uppercase tracking-wider mb-2">Total Earned</p>
            <p className="text-3xl font-black text-accent-green">{profile.ecoinEarned}</p>
            <p className="text-xs text-text-main/30 mt-1">Lifetime ECOIN</p>
          </div>
          <div className="p-4 rounded-2xl bg-black/20 border border-white/5">
            <p className="text-xs text-text-main/50 uppercase tracking-wider mb-2">Avg Score</p>
            <p className="text-3xl font-black text-blue-400">{profile.averageScore}</p>
            <p className="text-xs text-text-main/30 mt-1">Out of 100</p>
          </div>
          <div className="p-4 rounded-2xl bg-black/20 border border-white/5">
            <p className="text-xs text-text-main/50 uppercase tracking-wider mb-2">Best Score</p>
            <p className="text-3xl font-black text-purple-400">{highestScore}</p>
            <p className="text-xs text-text-main/30 mt-1">All time high</p>
          </div>
        </div>
      </div>
      
      {/* Chart Placeholder for future implementation */}
      <div className="glass-card p-8 rounded-3xl border border-white/5 h-64 flex flex-col items-center justify-center text-center">
        <Activity className="w-12 h-12 text-white/10 mb-4" />
        <h4 className="text-lg font-bold text-white mb-2">Contribution Activity Trend</h4>
        <p className="text-sm text-text-main/50">Chart visualization coming soon to EffortX Analytics.</p>
      </div>
    </div>
  );
}

function LeaderboardTab({ leaderboard, wallet }) {
  return (
    <div className="glass-card rounded-3xl border border-white/5 overflow-hidden">
      <div className="p-6 border-b border-white/5 bg-white/5">
        <h3 className="text-xl font-black text-white flex items-center gap-3">
          <Trophy className="w-5 h-5 text-yellow-400" /> Global Ecosystem Ranking
        </h3>
        <p className="text-sm text-text-main/50 mt-1">Ranked by total ECOIN balance and XP.</p>
      </div>
      
      <div className="overflow-x-auto">
        <table className="w-full text-left border-collapse">
          <thead>
            <tr className="border-b border-white/5 text-xs text-text-main/40 uppercase tracking-wider">
              <th className="p-4 font-medium pl-6">Rank</th>
              <th className="p-4 font-medium">Developer</th>
              <th className="p-4 font-medium">ECOIN</th>
              <th className="p-4 font-medium">XP</th>
              <th className="p-4 font-medium">Avg Score</th>
              <th className="p-4 font-medium pr-6 text-right">Proofs</th>
            </tr>
          </thead>
          <tbody>
            {leaderboard.map((user) => {
              const isMe = user.wallet === wallet.publicKey?.toBase58();
              const isTop3 = user.globalRank <= 3;
              
              return (
                <tr 
                  key={user.wallet} 
                  className={`border-b border-white/5 hover:bg-white/5 transition-colors ${
                    isMe ? 'bg-accent-green/5' : ''
                  }`}
                >
                  <td className="p-4 pl-6">
                    <span className={`inline-flex items-center justify-center w-8 h-8 rounded-lg font-black text-sm ${
                      user.globalRank === 1 ? 'bg-yellow-400/20 text-yellow-400' :
                      user.globalRank === 2 ? 'bg-gray-300/20 text-gray-300' :
                      user.globalRank === 3 ? 'bg-amber-600/20 text-amber-600' :
                      'text-text-main/40'
                    }`}>
                      {user.globalRank}
                    </span>
                  </td>
                  <td className="p-4">
                    <div className="flex items-center gap-3">
                      <div className="w-8 h-8 rounded bg-white/10 flex items-center justify-center text-white font-bold text-xs">
                        {user.githubUsername[0].toUpperCase()}
                      </div>
                      <div>
                        <p className={`font-bold text-sm ${isMe ? 'text-accent-green' : 'text-white'}`}>
                          @{user.githubUsername}
                          {isMe && <span className="ml-2 text-[9px] px-1.5 py-0.5 rounded-sm bg-accent-green/20 text-accent-green uppercase">You</span>}
                        </p>
                        <p className="text-[10px] text-text-main/40 font-mono mt-0.5">
                          {user.wallet.slice(0,4)}...{user.wallet.slice(-4)}
                        </p>
                      </div>
                    </div>
                  </td>
                  <td className="p-4 text-accent-green font-bold text-sm flex items-center gap-1.5 mt-2">
                    {user.ecoinBalance.toLocaleString()} <Coins className="w-3 h-3" />
                  </td>
                  <td className="p-4 text-white/80 font-medium text-sm">
                    {user.totalXp.toLocaleString()}
                  </td>
                  <td className="p-4 text-blue-400 font-medium text-sm">
                    {user.averageScore}
                  </td>
                  <td className="p-4 pr-6 text-right text-text-main/60 text-sm">
                    {user.totalProofs}
                  </td>
                </tr>
              );
            })}
          </tbody>
        </table>
        {leaderboard.length === 0 && (
          <div className="p-12 text-center text-text-main/40">No profiles found.</div>
        )}
      </div>
    </div>
  );
}

function ProofsTab({ proofs, onSelectProof }) {
  if (proofs.length === 0) {
    return (
      <div className="glass-card p-12 rounded-3xl border border-white/5 text-center flex flex-col items-center">
        <FileText className="w-16 h-16 text-white/10 mb-4" />
        <h3 className="text-xl font-bold text-white mb-2">No On-Chain Proofs</h3>
        <p className="text-text-main/50">Analyze a GitHub commit on the home page and store the proof on-chain to see it here.</p>
      </div>
    );
  }

  return (
    <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
      {proofs.map((proof) => (
        <motion.div
          key={proof.commitHash}
          whileHover={{ scale: 1.01 }}
          onClick={() => onSelectProof(proof)}
          className="glass-card p-5 rounded-2xl border border-white/5 cursor-pointer hover:border-accent-green/30 transition-all group relative overflow-hidden"
        >
          <div className="absolute top-0 right-0 w-32 h-32 bg-accent-green/5 rounded-full blur-3xl -mr-16 -mt-16 group-hover:bg-accent-green/10 transition-colors" />
          
          <div className="flex justify-between items-start mb-4 relative z-10">
            <div>
              <div className="flex items-center gap-2 mb-1">
                <Github className="w-4 h-4 text-white/60" />
                <span className="text-xs font-mono text-white/60">commit</span>
              </div>
              <h4 className="text-lg font-bold text-white font-mono">{proof.commitHash.slice(0, 8)}...</h4>
            </div>
            <div className="text-right">
              <span className="text-[10px] text-text-main/40 uppercase tracking-wider bg-black/30 px-2 py-1 rounded-md">
                {new Date(proof.timestamp * 1000).toLocaleDateString()}
              </span>
            </div>
          </div>
          
          <div className="flex gap-4 relative z-10 pt-4 border-t border-white/5">
            <div>
              <p className="text-[10px] text-text-main/50 uppercase tracking-wider mb-1">Score</p>
              <p className="text-xl font-black text-blue-400">{proof.effortScore}</p>
            </div>
            <div>
              <p className="text-[10px] text-text-main/50 uppercase tracking-wider mb-1">Reward</p>
              <p className="text-xl font-black text-accent-green flex items-center gap-1">
                +{proof.rewardCoins} <Coins className="w-3 h-3" />
              </p>
            </div>
            <div className="ml-auto mt-auto">
              <div className="w-8 h-8 rounded-full bg-white/5 flex items-center justify-center group-hover:bg-white/10 transition-colors">
                <ChevronRight className="w-4 h-4 text-white/50" />
              </div>
            </div>
          </div>
        </motion.div>
      ))}
    </div>
  );
}

function ActivityTab({ proofs, profile }) {
  // Generate a timeline from proofs and account creation
  const events = useMemo(() => {
    const list = proofs.map(p => ({
      type: 'proof',
      title: 'Commit Verified on Chain',
      desc: `Commit ${p.commitHash.slice(0, 8)} analyzed with score ${p.effortScore}`,
      reward: p.rewardCoins,
      timestamp: p.timestamp
    }));
    
    // Add profile creation event
    if (profile) {
      list.push({
        type: 'creation',
        title: 'Reputation Profile Created',
        desc: `Joined the EffortX network as @${profile.githubUsername}`,
        reward: null,
        timestamp: profile.createdAt || 0 // Assuming createdAt is available
      });
    }
    
    return list.sort((a, b) => b.timestamp - a.timestamp);
  }, [proofs, profile]);

  return (
    <div className="glass-card p-8 rounded-3xl border border-white/5">
      <h3 className="text-xl font-black text-white mb-8 flex items-center gap-3">
        <Activity className="w-5 h-5 text-blue-400" /> Activity Timeline
      </h3>
      
      <div className="space-y-8 relative before:absolute before:inset-0 before:ml-5 before:-translate-x-px md:before:mx-auto md:before:translate-x-0 before:h-full before:w-0.5 before:bg-gradient-to-b before:from-transparent before:via-white/10 before:to-transparent">
        {events.map((event, i) => (
          <div key={i} className="relative flex items-center justify-between md:justify-normal md:odd:flex-row-reverse group is-active">
            <div className="flex items-center justify-center w-10 h-10 rounded-full border border-white/10 bg-background text-white/50 shadow shrink-0 md:order-1 md:group-odd:-translate-x-1/2 md:group-even:translate-x-1/2 z-10 group-hover:border-accent-green/50 group-hover:text-accent-green transition-colors">
              {event.type === 'proof' ? <CheckCircle2 className="w-4 h-4" /> : <ShieldCheck className="w-4 h-4" />}
            </div>
            
            <div className="w-[calc(100%-4rem)] md:w-[calc(50%-2.5rem)] p-4 rounded-2xl glass-card border border-white/5 hover:border-white/10 transition-colors">
              <div className="flex items-center justify-between mb-1">
                <h4 className="text-sm font-bold text-white">{event.title}</h4>
                <span className="text-[10px] text-text-main/40">
                  {new Date(event.timestamp * 1000).toLocaleDateString()}
                </span>
              </div>
              <p className="text-xs text-text-main/60 mb-2">{event.desc}</p>
              {event.reward && (
                <span className="inline-flex items-center gap-1 text-[10px] font-bold text-accent-green bg-accent-green/10 px-2 py-1 rounded">
                  +{event.reward} ECOIN
                </span>
              )}
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}

// ----------------------------------------------------------------------
// SHARED COMPONENTS
// ----------------------------------------------------------------------

function StatCard({ title, value, icon: Icon, color }) {
  return (
    <div className="glass-card p-5 rounded-2xl border border-white/5 flex items-center gap-4">
      <div className={`w-12 h-12 rounded-xl bg-white/5 flex items-center justify-center ${color}`}>
        <Icon className="w-5 h-5" />
      </div>
      <div>
        <p className="text-xs text-text-main/50 uppercase tracking-wider mb-0.5">{title}</p>
        <p className="text-2xl font-black text-white">{value}</p>
      </div>
    </div>
  );
}

function ProofModal({ proof, onClose }) {
  const { profile } = useSolana();
  const url = `https://github.com/${profile.githubUsername}/commit/${proof.commitHash}`;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
      <motion.div 
        initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
        onClick={onClose}
        className="absolute inset-0 bg-background/80 backdrop-blur-sm"
      />
      <motion.div
        initial={{ opacity: 0, scale: 0.95, y: 20 }}
        animate={{ opacity: 1, scale: 1, y: 0 }}
        exit={{ opacity: 0, scale: 0.95, y: 20 }}
        className="relative w-full max-w-lg glass-card rounded-3xl border border-white/10 shadow-2xl overflow-hidden p-8"
      >
        <button onClick={onClose} className="absolute top-6 right-6 p-2 rounded-full bg-white/5 hover:bg-white/10 text-white/50 hover:text-white transition-colors">
          <X className="w-4 h-4" />
        </button>

        <div className="flex items-center gap-3 mb-6">
          <div className="w-12 h-12 rounded-full bg-accent-green/10 border border-accent-green/30 flex items-center justify-center">
            <ShieldCheck className="w-6 h-6 text-accent-green" />
          </div>
          <div>
            <h2 className="text-xl font-black text-white">Proof Certificate</h2>
            <p className="text-xs text-text-main/50">Verified on Solana Blockchain</p>
          </div>
        </div>

        <div className="space-y-4 mb-8">
          <div className="bg-black/20 rounded-xl p-4 border border-white/5">
            <p className="text-[10px] text-text-main/50 uppercase tracking-wider mb-1">Commit Hash</p>
            <p className="text-sm font-mono text-white break-all">{proof.commitHash}</p>
          </div>
          
          <div className="grid grid-cols-2 gap-4">
            <div className="bg-black/20 rounded-xl p-4 border border-white/5">
              <p className="text-[10px] text-text-main/50 uppercase tracking-wider mb-1">Effort Score</p>
              <p className="text-2xl font-black text-blue-400">{proof.effortScore}</p>
            </div>
            <div className="bg-black/20 rounded-xl p-4 border border-white/5">
              <p className="text-[10px] text-text-main/50 uppercase tracking-wider mb-1">Reward</p>
              <p className="text-2xl font-black text-accent-green flex items-center gap-1">
                {proof.rewardCoins} <Coins className="w-4 h-4" />
              </p>
            </div>
          </div>
          
          <div className="bg-black/20 rounded-xl p-4 border border-white/5">
            <p className="text-[10px] text-text-main/50 uppercase tracking-wider mb-1">Timestamp</p>
            <p className="text-sm text-white">
              {new Date(proof.timestamp * 1000).toLocaleString()}
            </p>
          </div>
        </div>

        <div className="flex gap-3">
          <a
            href={url}
            target="_blank"
            rel="noopener noreferrer"
            className="flex-1 py-3 px-4 rounded-xl font-bold text-sm bg-white/10 hover:bg-white/15 text-white transition-colors flex items-center justify-center gap-2"
          >
            <Github className="w-4 h-4" /> View on GitHub
          </a>
          <button
            onClick={() => {
              navigator.clipboard.writeText(proof.commitHash);
              toast.success('Commit hash copied!');
            }}
            className="py-3 px-6 rounded-xl font-bold text-sm border border-white/10 hover:bg-white/5 text-white transition-colors"
          >
            Copy Hash
          </button>
        </div>
      </motion.div>
    </div>
  );
}
