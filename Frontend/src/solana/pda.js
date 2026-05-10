import { PublicKey } from '@solana/web3.js';
import { PROGRAM_ID } from './config.js';

const PROGRAM_PK = new PublicKey(PROGRAM_ID);

// ============================================================
// PDA HELPERS
// Seeds must EXACTLY match the Rust contract in lib.rs:
//
//   GlobalState:     seeds = [b"global_state"]
//   UserProfile:     seeds = [b"profile", wallet_pubkey]
//   UsernameIndex:   seeds = [b"username", github_username_bytes]
//   ProofRecord:     seeds = [b"proof", sha256(commit_hash)[..32]]
// ============================================================

/**
 * Derive the GlobalState PDA.
 * seeds: [b"global_state"]
 * Synchronous — findProgramAddressSync is NOT async.
 * @returns {[PublicKey, number]}
 */
export function getGlobalStatePDA() {
  return PublicKey.findProgramAddressSync(
    [Buffer.from('global_state')],
    PROGRAM_PK
  );
}

/**
 * Derive the UserProfile PDA for a given wallet.
 * seeds: [b"profile", wallet_pubkey.as_ref()]
 * @param {PublicKey} walletPublicKey
 * @returns {[PublicKey, number]}
 */
export function getProfilePDA(walletPublicKey) {
  return PublicKey.findProgramAddressSync(
    [Buffer.from('profile'), walletPublicKey.toBuffer()],
    PROGRAM_PK
  );
}

/**
 * Derive the UsernameIndex PDA for a given GitHub username.
 * seeds: [b"username", github_username_bytes]
 * @param {string} githubUsername
 * @returns {[PublicKey, number]}
 */
export function getUsernamePDA(githubUsername) {
  return PublicKey.findProgramAddressSync(
    [Buffer.from('username'), Buffer.from(githubUsername)],
    PROGRAM_PK
  );
}

/**
 * Compute sha256(commitHash) and return as Uint8Array[32].
 * This EXACTLY replicates what the Rust contract uses as the PDA seed.
 *
 * The contract uses:
 *   seeds = [b"proof", commit_hash_seed.as_ref()]
 * where commit_hash_seed is sha256(commit_hash)[0..32]
 *
 * @param {string} commitHash - The full 40-char git SHA string
 * @returns {Promise<Uint8Array>} 32-byte hash
 */
export async function hashCommit(commitHash) {
  const encoded = new TextEncoder().encode(commitHash);
  const hashBuffer = await crypto.subtle.digest('SHA-256', encoded);
  return new Uint8Array(hashBuffer); // SHA-256 is always 32 bytes
}

/**
 * Derive the ProofRecord PDA for a given commit hash.
 * seeds: [b"proof", sha256(commit_hash)]
 * @param {string} commitHash - The full 40-char git SHA string
 * @returns {Promise<[PublicKey, number]>}
 */
export async function getProofPDA(commitHash) {
  const seed = await hashCommit(commitHash);
  return PublicKey.findProgramAddressSync(
    [Buffer.from('proof'), seed],
    PROGRAM_PK
  );
}
