import { clusterApiUrl } from '@solana/web3.js';

// ============================================================
// EffortX Solana Configuration
// ============================================================

/** Deployed Program ID on Devnet */
export const PROGRAM_ID = 'Hd2TgtDaw6hAJBLfPNg79CZpLbBSaXAdKcDCSz37wTN7';

/** Solana Devnet RPC endpoint */
export const SOLANA_RPC = 'https://api.devnet.solana.com';

/** Cluster name */
export const CLUSTER = 'devnet';

/** Solana Explorer base URL (devnet) */
export const EXPLORER_BASE = 'https://explorer.solana.com';

/**
 * Build a Solana Explorer link for a transaction
 * @param {string} sig - transaction signature
 */
export const explorerTxUrl = (sig) =>
  `${EXPLORER_BASE}/tx/${sig}?cluster=${CLUSTER}`;

/**
 * Build a Solana Explorer link for an account
 * @param {string} address - public key string
 */
export const explorerAccountUrl = (address) =>
  `${EXPLORER_BASE}/address/${address}?cluster=${CLUSTER}`;

/** ECOIN conversion: 1 ECOIN costs 1_000_000 lamports (0.001 SOL) */
export const LAMPORTS_PER_ECOIN = 1_000_000;

/** Helper: SOL amount (float) → lamports (BigInt-safe integer) */
export const solToLamports = (sol) => Math.round(sol * 1e9);
