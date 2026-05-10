import React, { createContext, useContext, useState, useEffect, useCallback, useRef } from 'react';
import { useWallet } from '@solana/wallet-adapter-react';
import { getProvider, getProgram } from '../solana/provider.js';
import { fetchUserProfile } from '../solana/program.js';

// ============================================================
// Solana Context — provides wallet state + on-chain profile
// ============================================================

const SolanaContext = createContext(null);

export function SolanaContextProvider({ children }) {
  const wallet = useWallet();
  const [profile, setProfile] = useState(null);
  const [profileLoading, setProfileLoading] = useState(false);
  const [profileError, setProfileError] = useState(null);
  // true once we've completed at least one profile check for the current wallet
  const [profileChecked, setProfileChecked] = useState(false);
  const lastCheckedKey = useRef(null);

  /**
   * Load (or reload) the on-chain profile for the connected wallet.
   */
  const loadProfile = useCallback(async () => {
    if (!wallet?.publicKey) {
      setProfile(null);
      setProfileChecked(false);
      return;
    }

    setProfileLoading(true);
    setProfileError(null);

    try {
      const provider = getProvider(wallet);
      const program = getProgram(provider);
      const onChainProfile = await fetchUserProfile(wallet.publicKey, program);
      setProfile(onChainProfile); // null = no profile yet
    } catch (err) {
      console.error('Failed to load profile:', err);
      setProfileError('Could not load on-chain profile.');
      setProfile(null);
    } finally {
      setProfileLoading(false);
      setProfileChecked(true);
    }
  }, [wallet]);

  // Auto-load profile when wallet connects/disconnects
  useEffect(() => {
    const walletKey = wallet?.publicKey?.toBase58();

    if (walletKey) {
      // Only re-fetch if the wallet actually changed
      if (lastCheckedKey.current !== walletKey) {
        lastCheckedKey.current = walletKey;
        setProfileChecked(false);
        loadProfile();
      }
    } else {
      // Wallet disconnected
      lastCheckedKey.current = null;
      setProfile(null);
      setProfileError(null);
      setProfileChecked(false);
    }
  }, [wallet?.publicKey?.toBase58()]);

  return (
    <SolanaContext.Provider
      value={{
        wallet,
        profile,
        profileLoading,
        profileError,
        profileChecked,      // ← new: true after first fetch completes
        refreshProfile: loadProfile,
        hasProfile: profile !== null,
        isWalletConnected: !!wallet?.publicKey,
      }}
    >
      {children}
    </SolanaContext.Provider>
  );
}

/**
 * Hook to access Solana context.
 */
export function useSolana() {
  const ctx = useContext(SolanaContext);
  if (!ctx) throw new Error('useSolana must be used inside SolanaContextProvider');
  return ctx;
}
