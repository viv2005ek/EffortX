import { Connection } from '@solana/web3.js';
import { AnchorProvider, Program } from '@project-serum/anchor';
import { SOLANA_RPC, PROGRAM_ID } from './config.js';
import IDL from './idl.json';

// ============================================================
// Connection singleton
// ============================================================
export const connection = new Connection(SOLANA_RPC, 'confirmed');

/**
 * Build an AnchorProvider from a connected wallet adapter.
 * @param {import('@solana/wallet-adapter-react').WalletContextState} wallet
 * @returns {AnchorProvider}
 */
export function getProvider(wallet) {
  if (!wallet || !wallet.publicKey) {
    throw new Error('Wallet not connected');
  }

  return new AnchorProvider(
    connection,
    {
      publicKey: wallet.publicKey,
      signTransaction: wallet.signTransaction,
      signAllTransactions: wallet.signAllTransactions,
    },
    { preflightCommitment: 'confirmed', commitment: 'confirmed' }
  );
}

/**
 * Build the Anchor Program client.
 * @param {AnchorProvider} provider
 * @returns {Program}
 */
export function getProgram(provider) {
  return new Program(IDL, PROGRAM_ID, provider);
}
