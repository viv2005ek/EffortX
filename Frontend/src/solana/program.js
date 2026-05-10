import { PublicKey, SystemProgram, LAMPORTS_PER_SOL } from '@solana/web3.js';
import { BN } from '@project-serum/anchor';
import { getProvider, getProgram, connection } from './provider.js';
import {
  getGlobalStatePDA,
  getProfilePDA,
  getUsernamePDA,
  getProofPDA,
  hashCommit,
} from './pda.js';

// ============================================================
// PROFILE FETCHING
// ============================================================

/**
 * Fetch on-chain UserProfile account for a wallet.
 * Returns null if account does not exist (no profile yet).
 * @param {PublicKey} walletPublicKey
 * @param {import('@project-serum/anchor').Program} program
 * @returns {Promise<object|null>}
 */
export async function fetchUserProfile(walletPublicKey, program) {
  try {
    const [profilePDA] = getProfilePDA(walletPublicKey);
    const profile = await program.account.userProfile.fetch(profilePDA);
    return {
      wallet: profile.wallet.toBase58(),
      githubUsername: profile.githubUsername,
      totalXp: profile.totalXp.toNumber(),
      averageScore: profile.averageScore.toNumber(),
      totalProofs: profile.totalProofs.toNumber(),
      ecoinBalance: profile.ecoinBalance.toNumber(),
      ecoinEarned: profile.ecoinEarned.toNumber(),
      createdAt: profile.createdAt.toNumber(),
      bump: profile.bump,
    };
  } catch (err) {
    // Account not found → no profile yet
    if (
      err.message?.includes('Account does not exist') ||
      err.message?.includes('Failed to find') ||
      err.code === 3012
    ) {
      return null;
    }
    throw err;
  }
}

/**
 * Fetch GlobalState account.
 * @param {import('@project-serum/anchor').Program} program
 * @returns {Promise<object>}
 */
export async function fetchGlobalState(program) {
  const [globalStatePDA] = getGlobalStatePDA(); // sync — no await needed
  const state = await program.account.globalState.fetch(globalStatePDA);
  return {
    admin: state.admin.toBase58(),
    treasuryWallet: state.treasuryWallet.toBase58(),
    totalUsers: state.totalUsers.toNumber(),
    totalProofs: state.totalProofs.toNumber(),
    bump: state.bump,
  };
}

// ============================================================
// INITIALIZE PROTOCOL (ADMIN ONLY)
// ============================================================

/**
 * Initialize the global protocol state. Must be called once by an admin.
 * @param {import('@solana/wallet-adapter-react').WalletContextState} wallet
 * @param {PublicKey} treasuryWallet
 * @returns {Promise<string>} transaction signature
 */
export async function initializeProtocol(wallet, treasuryWallet) {
  const provider = getProvider(wallet);
  const program = getProgram(provider);

  const admin = wallet.publicKey;
  const [globalStatePDA] = getGlobalStatePDA();

  const tx = await program.methods
    .initializeProtocol(treasuryWallet)
    .accounts({
      admin,
      globalState: globalStatePDA,
      systemProgram: SystemProgram.programId,
    })
    .rpc();

  return tx;
}

// ============================================================
// CREATE PROFILE
// ============================================================

/**
 * Send create_profile transaction.
 * Creates UserProfile PDA + UsernameIndex PDA.
 *
 * @param {import('@solana/wallet-adapter-react').WalletContextState} wallet
 * @param {string} githubUsername
 * @returns {Promise<string>} transaction signature
 */
export async function createProfile(wallet, githubUsername) {
  const provider = getProvider(wallet);
  const program = getProgram(provider);

  const user = wallet.publicKey;
  const [globalStatePDA] = getGlobalStatePDA();
  const [userProfilePDA] = getProfilePDA(user);
  const [usernameIndexPDA] = getUsernamePDA(githubUsername);

  const tx = await program.methods
    .createProfile(githubUsername)
    .accounts({
      user,
      userProfile: userProfilePDA,
      usernameIndex: usernameIndexPDA,
      globalState: globalStatePDA,
      systemProgram: SystemProgram.programId,
    })
    .rpc();

  return tx;
}

// ============================================================
// SUBMIT PROOF
// ============================================================

/**
 * Send submit_proof transaction.
 *
 * @param {import('@solana/wallet-adapter-react').WalletContextState} wallet
 * @param {object} params
 * @param {string} params.githubUrl       - full GitHub commit URL (max 200 bytes)
 * @param {string} params.commitHash      - 40-char git SHA
 * @param {number} params.effortScore     - AI effort score (must be > 0)
 * @param {number} params.rewardCoins     - ECOIN to reward (must be > 0)
 * @returns {Promise<string>} transaction signature
 */
export async function submitProof(wallet, { githubUrl, commitHash, effortScore, rewardCoins }) {
  const provider = getProvider(wallet);
  const program = getProgram(provider);

  const user = wallet.publicKey;
  const [globalStatePDA] = getGlobalStatePDA();
  const [userProfilePDA] = getProfilePDA(user);

  // Compute sha256(commitHash) → Uint8Array[32] for PDA seed
  const commitHashSeed = await hashCommit(commitHash);
  const [proofRecordPDA] = PublicKey.findProgramAddressSync(
    [Buffer.from('proof'), commitHashSeed],
    program.programId
  );

  // Convert to BN (u64) — effortScore and rewardCoins come as numbers
  const effortScoreBN = new BN(Math.round(effortScore));
  const rewardCoinsBN = new BN(Math.round(rewardCoins));

  // Protect against string length overflows causing Anchor errors
  const safeCommitHash = commitHash.length > 40 ? commitHash.substring(0, 40) : commitHash;
  
  // As per user request, we don't need the full "https://github.com/..." because it's predictable.
  // Instead, we just pass the safeCommitHash into the github_url field to bypass the length limit entirely
  // and guarantee it's always > 0 and <= 200 bytes.
  const safeGithubUrl = safeCommitHash;

  const tx = await program.methods
    .submitProof(
      safeGithubUrl,
      safeCommitHash,
      Array.from(commitHashSeed), // [u8; 32] — Anchor expects an array, not Buffer
      effortScoreBN,
      rewardCoinsBN
    )
    .accounts({
      user,
      userProfile: userProfilePDA,
      proofRecord: proofRecordPDA,
      globalState: globalStatePDA,
      systemProgram: SystemProgram.programId,
    })
    .rpc();

  return tx;
}

// ============================================================
// BUY ECOINS
// ============================================================

/**
 * Send buy_ecoins transaction.
 * Transfers SOL to treasury, credits ECOIN to user profile.
 *
 * Rate: 1 ECOIN = 1_000_000 lamports (0.001 SOL)
 *
 * @param {import('@solana/wallet-adapter-react').WalletContextState} wallet
 * @param {number} solAmount  - amount in SOL (float, e.g. 0.01)
 * @returns {Promise<string>} transaction signature
 */
export async function buyEcoins(wallet, solAmount) {
  const provider = getProvider(wallet);
  const program = getProgram(provider);

  const user = wallet.publicKey;
  const [globalStatePDA] = getGlobalStatePDA();
  const [userProfilePDA] = getProfilePDA(user);

  // Fetch globalState to get treasury wallet address
  const globalState = await fetchGlobalState(program);
  const treasuryWallet = new PublicKey(globalState.treasuryWallet);

  // Convert SOL → lamports
  const lamports = Math.round(solAmount * LAMPORTS_PER_SOL);
  const solAmountBN = new BN(lamports);

  const tx = await program.methods
    .buyEcoins(solAmountBN)
    .accounts({
      user,
      userProfile: userProfilePDA,
      treasuryWallet,
      globalState: globalStatePDA,
      systemProgram: SystemProgram.programId,
    })
    .rpc();

  return tx;
}

// ============================================================
// TRANSFER ECOINS
// ============================================================

/**
 * Send transfer_ecoins transaction.
 * Internal ECOIN balance transfer — no SOL movement.
 *
 * @param {import('@solana/wallet-adapter-react').WalletContextState} wallet
 * @param {string} receiverWalletAddress - receiver's wallet public key (base58 string)
 * @param {number} amount                - ECOIN amount to transfer
 * @returns {Promise<string>} transaction signature
 */
export async function transferEcoins(wallet, receiverWalletAddress, amount) {
  const provider = getProvider(wallet);
  const program = getProgram(provider);

  const sender = wallet.publicKey;
  const receiverWallet = new PublicKey(receiverWalletAddress);

  const [senderProfilePDA] = getProfilePDA(sender);
  const [receiverProfilePDA] = getProfilePDA(receiverWallet);

  const amountBN = new BN(Math.round(amount));

  const tx = await program.methods
    .transferEcoins(amountBN)
    .accounts({
      sender,
      senderProfile: senderProfilePDA,
      receiverProfile: receiverProfilePDA,
      systemProgram: SystemProgram.programId,
    })
    .rpc();

  return tx;
}

// ============================================================
// UTILITY: PARSE BLOCKCHAIN ERRORS
// ============================================================

/**
 * Map Anchor/Program custom error codes to human-readable messages.
 * @param {Error} err
 * @returns {string}
 */
export function parseBlockchainError(err) {
  const msg = err?.message || String(err);

  if (msg.includes('UsernameTooLong'))
    return 'GitHub username is too long (max 32 characters).';
  if (msg.includes('UrlTooLong'))
    return 'GitHub URL is too long (max 200 characters).';
  if (msg.includes('CommitHashInvalid'))
    return 'Invalid commit hash. Must be a valid 40-character git SHA.';
  if (msg.includes('InvalidScore'))
    return 'Effort score must be greater than zero.';
  if (msg.includes('InvalidReward'))
    return 'Reward coins must be greater than zero.';
  if (msg.includes('InvalidAmount'))
    return 'Amount must be greater than zero.';
  if (msg.includes('AmountTooSmall'))
    return 'SOL amount too small. Minimum is 0.001 SOL (buys 1 ECOIN).';
  if (msg.includes('InsufficientEcoinBalance'))
    return 'Insufficient ECOIN balance for this transfer.';
  if (msg.includes('CannotTransferToSelf'))
    return 'You cannot transfer ECOIN to yourself.';
  if (msg.includes('Unauthorized'))
    return 'Wallet does not match profile owner.';
  if (msg.includes('InvalidTreasury'))
    return 'Invalid treasury address.';
  if (msg.includes('Overflow'))
    return 'Arithmetic overflow. Values are too large.';
  if (msg.includes('already in use') || msg.includes('custom program error: 0x0'))
    return 'This proof has already been stored on-chain.';
  if (msg.includes('User rejected') || msg.includes('rejected'))
    return 'Transaction cancelled by user.';
  if (msg.includes('insufficient funds') || msg.includes('Insufficient'))
    return 'Insufficient SOL balance for this transaction.';
  if (msg.includes('Account does not exist') || msg.includes('Failed to find'))
    return 'Account not found. Please create your profile first.';

  return 'Transaction failed. Please try again.';
}
