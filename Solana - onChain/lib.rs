use anchor_lang::prelude::*;
use anchor_lang::system_program;

declare_id!("Hd2TgtDaw6hAJBLfPNg79CZpLbBSaXAdKcDCSz37wTN7"); // Replace with your program ID after `anchor build`

// ============================================================
// CONSTANTS
// ============================================================

/// Maximum length for a GitHub username (capped at 32 bytes for PDA seed safety)
const MAX_USERNAME_LEN: usize = 32;

/// Maximum length for a GitHub commit/PR URL
const MAX_URL_LEN: usize = 200;

/// Maximum length for a Git commit SHA (40 hex chars)
const MAX_COMMIT_HASH_LEN: usize = 40;

/// ECOIN purchase rate: 0.01 SOL = 10 ECOIN
/// 0.01 SOL = 10_000_000 lamports
const LAMPORTS_PER_ECOIN_UNIT: u64 = 1_000_000; // 1 ECOIN costs 1_000_000 lamports (0.001 SOL)
// Formula: sol_amount (lamports) / 1_000_000 = ecoin_amount
// So 10_000_000 lamports = 10 ECOIN  ✓  (0.01 SOL = 10 ECOIN)

// ============================================================
// PROGRAM ENTRYPOINT
// ============================================================

#[program]
pub mod effortx {
    use super::*;

    // ----------------------------------------------------------
    // 1. initialize_protocol
    //
    // Called ONCE by the deployer.
    // Creates the GlobalState PDA and sets admin + treasury.
    // ----------------------------------------------------------
    pub fn initialize_protocol(
        ctx: Context<InitializeProtocol>,
        treasury_wallet: Pubkey,
    ) -> Result<()> {
        let global_state = &mut ctx.accounts.global_state;

        global_state.admin = ctx.accounts.admin.key();
        global_state.treasury_wallet = treasury_wallet;
        global_state.total_users = 0;
        global_state.total_proofs = 0;
        global_state.bump = ctx.bumps.global_state;

        msg!("EffortX protocol initialized. Admin: {}", global_state.admin);
        Ok(())
    }

    // ----------------------------------------------------------
    // 2. create_profile
    //
    // Creates a UserProfile PDA and a UsernameIndex PDA.
    // Enforces:
    //   - one wallet = one profile
    //   - one GitHub username = one wallet
    // ----------------------------------------------------------
    pub fn create_profile(
        ctx: Context<CreateProfile>,
        github_username: String,
    ) -> Result<()> {
        // Validate username length
        require!(
            github_username.len() > 0 && github_username.len() <= MAX_USERNAME_LEN,
            EffortXError::UsernameTooLong
        );

        let clock = Clock::get()?;

        // --- Populate UserProfile ---
        let profile = &mut ctx.accounts.user_profile;
        profile.wallet = ctx.accounts.user.key();
        profile.github_username = github_username.clone();
        profile.total_xp = 0;
        profile.average_score = 0;
        profile.total_proofs = 0;
        profile.ecoin_balance = 0;
        profile.ecoin_earned = 0;
        profile.created_at = clock.unix_timestamp;
        profile.bump = ctx.bumps.user_profile;

        // --- Populate UsernameIndex (uniqueness guard) ---
        let username_index = &mut ctx.accounts.username_index;
        username_index.github_username = github_username.clone();
        username_index.wallet = ctx.accounts.user.key();
        username_index.bump = ctx.bumps.username_index;

        // --- Update global counter ---
        let global_state = &mut ctx.accounts.global_state;
        global_state.total_users = global_state
            .total_users
            .checked_add(1)
            .ok_or(EffortXError::Overflow)?;

        msg!(
            "Profile created for wallet: {} | GitHub: {}",
            profile.wallet,
            profile.github_username
        );
        Ok(())
    }

    // ----------------------------------------------------------
    // 3. submit_proof
    //
    // THE most important instruction.
    // Called by the frontend after off-chain AI verification.
    //
    // Inputs:
    //   github_url      - full GitHub commit/PR URL (max 200 bytes)
    //   commit_hash     - full 40-char Git SHA (stored in account)
    //   commit_hash_seed - sha256(commit_hash)[..32] for PDA derivation
    //   effort_score    - AI-calculated effort score
    //   reward_coins    - ECOIN to credit
    //
    // Actions:
    //   - creates ProofRecord PDA (keyed by commit_hash_seed)
    //   - updates user XP, average score, proof count
    //   - credits ECOIN balance + lifetime earned
    //   - increments global proof counter
    // ----------------------------------------------------------
    pub fn submit_proof(
        ctx: Context<SubmitProof>,
        github_url: String,
        commit_hash: String,
        _commit_hash_seed: [u8; 32], // used only for PDA derivation via constraint, not stored raw
        effort_score: u64,
        reward_coins: u64,
    ) -> Result<()> {
        // Validate inputs
        require!(github_url.len() > 0 && github_url.len() <= MAX_URL_LEN, EffortXError::UrlTooLong);
        require!(
            commit_hash.len() > 0 && commit_hash.len() <= MAX_COMMIT_HASH_LEN,
            EffortXError::CommitHashInvalid
        );
        require!(effort_score > 0, EffortXError::InvalidScore);
        require!(reward_coins > 0, EffortXError::InvalidReward);

        let clock = Clock::get()?;
        let profile = &mut ctx.accounts.user_profile;

        // --- Populate ProofRecord ---
        let proof = &mut ctx.accounts.proof_record;
        proof.owner = ctx.accounts.user.key();
        proof.github_username = profile.github_username.clone();
        proof.github_url = github_url;
        proof.commit_hash = commit_hash;
        proof.effort_score = effort_score;
        proof.reward_coins = reward_coins;
        proof.timestamp = clock.unix_timestamp;
        // proof_number is 1-indexed count of this user's proofs (set after increment below)
        proof.bump = ctx.bumps.proof_record;

        // --- Update user XP ---
        profile.total_xp = profile
            .total_xp
            .checked_add(effort_score)
            .ok_or(EffortXError::Overflow)?;

        // --- Increment user proof count ---
        profile.total_proofs = profile
            .total_proofs
            .checked_add(1)
            .ok_or(EffortXError::Overflow)?;

        // --- Set proof_number (this user's Nth proof) ---
        proof.proof_number = profile.total_proofs;

        // --- Recalculate average score ---
        // average_score = total_xp / total_proofs  (integer division, stored as u64)
        profile.average_score = profile.total_xp / profile.total_proofs;

        // --- Credit ECOIN ---
        profile.ecoin_balance = profile
            .ecoin_balance
            .checked_add(reward_coins)
            .ok_or(EffortXError::Overflow)?;

        profile.ecoin_earned = profile
            .ecoin_earned
            .checked_add(reward_coins)
            .ok_or(EffortXError::Overflow)?;

        // --- Update global proof counter ---
        let global_state = &mut ctx.accounts.global_state;
        global_state.total_proofs = global_state
            .total_proofs
            .checked_add(1)
            .ok_or(EffortXError::Overflow)?;

        msg!(
            "Proof stored | User: {} | XP gained: {} | ECOIN earned: {} | New balance: {}",
            proof.owner,
            effort_score,
            reward_coins,
            profile.ecoin_balance
        );
        Ok(())
    }

    // ----------------------------------------------------------
    // 4. transfer_ecoins
    //
    // Transfers ECOIN from sender to receiver.
    // Pure internal balance update — no SOL movement.
    //
    // Rules:
    //   - sender must have sufficient balance
    //   - amount must be > 0
    // ----------------------------------------------------------
    pub fn transfer_ecoins(ctx: Context<TransferEcoins>, amount: u64) -> Result<()> {
        require!(amount > 0, EffortXError::InvalidAmount);

        let sender_profile = &mut ctx.accounts.sender_profile;
        let receiver_profile = &mut ctx.accounts.receiver_profile;

        // Check sender has enough balance
        require!(
            sender_profile.ecoin_balance >= amount,
            EffortXError::InsufficientEcoinBalance
        );

        // Deduct from sender
        sender_profile.ecoin_balance = sender_profile
            .ecoin_balance
            .checked_sub(amount)
            .ok_or(EffortXError::Overflow)?;

        // Credit to receiver
        receiver_profile.ecoin_balance = receiver_profile
            .ecoin_balance
            .checked_add(amount)
            .ok_or(EffortXError::Overflow)?;

        msg!(
            "ECOIN transfer | From: {} | To: {} | Amount: {} | Sender balance: {} | Receiver balance: {}",
            sender_profile.wallet,
            receiver_profile.wallet,
            amount,
            sender_profile.ecoin_balance,
            receiver_profile.ecoin_balance
        );
        Ok(())
    }

    // ----------------------------------------------------------
    // 5. buy_ecoins
    //
    // User sends SOL, program credits ECOIN.
    //
    // Conversion: 0.01 SOL = 10 ECOIN
    //   => 1 ECOIN costs 1_000_000 lamports
    //   => ecoin_to_credit = sol_amount / 1_000_000
    //
    // SOL is transferred to treasury_wallet via CPI.
    // ECOIN is credited to user's ecoin_balance.
    //
    // Rules:
    //   - sol_amount > 0
    //   - must result in at least 1 ECOIN
    // ----------------------------------------------------------
    pub fn buy_ecoins(ctx: Context<BuyEcoins>, sol_amount: u64) -> Result<()> {
        require!(sol_amount > 0, EffortXError::InvalidAmount);

        // Calculate ECOIN to credit
        let ecoin_to_credit = sol_amount
            .checked_div(LAMPORTS_PER_ECOIN_UNIT)
            .ok_or(EffortXError::Overflow)?;

        require!(ecoin_to_credit > 0, EffortXError::AmountTooSmall);

        // --- Transfer SOL from user to treasury via System Program CPI ---
        let cpi_context = CpiContext::new(
            ctx.accounts.system_program.to_account_info(),
            system_program::Transfer {
                from: ctx.accounts.user.to_account_info(),
                to: ctx.accounts.treasury_wallet.to_account_info(),
            },
        );
        system_program::transfer(cpi_context, sol_amount)?;

        // --- Credit ECOIN to user profile ---
        let profile = &mut ctx.accounts.user_profile;
        profile.ecoin_balance = profile
            .ecoin_balance
            .checked_add(ecoin_to_credit)
            .ok_or(EffortXError::Overflow)?;

        msg!(
            "ECOIN purchase | User: {} | SOL spent: {} lamports | ECOIN credited: {} | New balance: {}",
            profile.wallet,
            sol_amount,
            ecoin_to_credit,
            profile.ecoin_balance
        );
        Ok(())
    }

    // ----------------------------------------------------------
    // 6. get_profile  (read-only helper)
    //
    // Emits profile data to transaction logs.
    // Frontend can also just fetch the account directly via RPC;
    // this instruction is provided for on-chain composability.
    // ----------------------------------------------------------
    pub fn get_profile(ctx: Context<GetProfile>) -> Result<()> {
        let profile = &ctx.accounts.user_profile;
        msg!(
            "Profile | wallet: {} | github: {} | xp: {} | avg_score: {} | proofs: {} | ecoin_balance: {} | ecoin_earned: {} | created_at: {}",
            profile.wallet,
            profile.github_username,
            profile.total_xp,
            profile.average_score,
            profile.total_proofs,
            profile.ecoin_balance,
            profile.ecoin_earned,
            profile.created_at
        );
        Ok(())
    }

    // ----------------------------------------------------------
    // 7. get_proof  (read-only helper)
    //
    // Emits proof data to transaction logs.
    // Frontend can also fetch the ProofRecord account directly.
    // ----------------------------------------------------------
    pub fn get_proof(ctx: Context<GetProof>) -> Result<()> {
        let proof = &ctx.accounts.proof_record;
        msg!(
            "Proof | owner: {} | github: {} | url: {} | hash: {} | score: {} | coins: {} | ts: {} | proof_num: {}",
            proof.owner,
            proof.github_username,
            proof.github_url,
            proof.commit_hash,
            proof.effort_score,
            proof.reward_coins,
            proof.timestamp,
            proof.proof_number
        );
        Ok(())
    }
}

// ============================================================
// ACCOUNT STRUCTS (on-chain state)
// ============================================================

// ----------------------------------------------------------
// GlobalState
//
// PDA seeds: ["global_state"]
// Created once during initialize_protocol.
// ----------------------------------------------------------
#[account]
pub struct GlobalState {
    /// The protocol admin (deployer)
    pub admin: Pubkey,           // 32
    /// SOL from ECOIN purchases flows here
    pub treasury_wallet: Pubkey, // 32
    /// Total registered users
    pub total_users: u64,        // 8
    /// Total proofs submitted across all users
    pub total_proofs: u64,       // 8
    /// PDA bump
    pub bump: u8,                // 1
}

impl GlobalState {
    // discriminator(8) + admin(32) + treasury(32) + total_users(8) + total_proofs(8) + bump(1)
    pub const LEN: usize = 8 + 32 + 32 + 8 + 8 + 1;
}

// ----------------------------------------------------------
// UserProfile
//
// PDA seeds: ["profile", wallet_pubkey]
// One per wallet address.
// ----------------------------------------------------------
#[account]
pub struct UserProfile {
    /// Owner wallet address
    pub wallet: Pubkey,             // 32
    /// Linked GitHub username (max 32 bytes)
    pub github_username: String,    // 4 + 32
    /// Cumulative XP (sum of all effort_scores)
    pub total_xp: u64,              // 8
    /// total_xp / total_proofs (integer)
    pub average_score: u64,         // 8
    /// Number of proofs submitted
    pub total_proofs: u64,          // 8
    /// Current spendable ECOIN balance
    pub ecoin_balance: u64,         // 8
    /// Lifetime ECOIN earned (never decremented)
    pub ecoin_earned: u64,          // 8
    /// Unix timestamp of profile creation
    pub created_at: i64,            // 8
    /// PDA bump
    pub bump: u8,                   // 1
}

impl UserProfile {
    // discriminator(8) + wallet(32) + github_username(4+32) + total_xp(8)
    // + average_score(8) + total_proofs(8) + ecoin_balance(8)
    // + ecoin_earned(8) + created_at(8) + bump(1)
    pub const LEN: usize = 8 + 32 + (4 + 32) + 8 + 8 + 8 + 8 + 8 + 8 + 1;
}

// ----------------------------------------------------------
// UsernameIndex
//
// PDA seeds: ["username", github_username_bytes]
// Existence of this account proves the username is taken.
// ----------------------------------------------------------
#[account]
pub struct UsernameIndex {
    /// The GitHub username this index guards
    pub github_username: String, // 4 + 32
    /// The wallet that owns this username
    pub wallet: Pubkey,          // 32
    /// PDA bump
    pub bump: u8,                // 1
}

impl UsernameIndex {
    // discriminator(8) + github_username(4+32) + wallet(32) + bump(1)
    pub const LEN: usize = 8 + (4 + 32) + 32 + 1;
}

// ----------------------------------------------------------
// ProofRecord
//
// PDA seeds: ["proof", sha256(commit_hash)[..32]]
// One per unique commit hash. Immutable after creation.
// ----------------------------------------------------------
#[account]
pub struct ProofRecord {
    /// Wallet that submitted this proof
    pub owner: Pubkey,              // 32
    /// GitHub username at time of submission
    pub github_username: String,    // 4 + 32
    /// Full GitHub commit or PR URL (max 200 bytes)
    pub github_url: String,         // 4 + 200
    /// Full 40-char Git SHA
    pub commit_hash: String,        // 4 + 40
    /// AI-calculated effort score
    pub effort_score: u64,          // 8
    /// ECOIN rewarded for this proof
    pub reward_coins: u64,          // 8
    /// Unix timestamp of submission
    pub timestamp: i64,             // 8
    /// This user's Nth proof (1-indexed)
    pub proof_number: u64,          // 8
    /// PDA bump
    pub bump: u8,                   // 1
}

impl ProofRecord {
    // discriminator(8) + owner(32) + github_username(4+32)
    // + github_url(4+200) + commit_hash(4+40)
    // + effort_score(8) + reward_coins(8) + timestamp(8)
    // + proof_number(8) + bump(1)
    pub const LEN: usize = 8 + 32 + (4 + 32) + (4 + 200) + (4 + 40) + 8 + 8 + 8 + 8 + 1;
}

// ============================================================
// INSTRUCTION CONTEXT STRUCTS
// ============================================================

// ----------------------------------------------------------
// InitializeProtocol
// ----------------------------------------------------------
#[derive(Accounts)]
pub struct InitializeProtocol<'info> {
    /// The deployer/admin who pays for the account
    #[account(mut)]
    pub admin: Signer<'info>,

    /// GlobalState PDA — can only be created once
    #[account(
        init,
        payer = admin,
        space = GlobalState::LEN,
        seeds = [b"global_state"],
        bump
    )]
    pub global_state: Account<'info, GlobalState>,

    pub system_program: Program<'info, System>,
}

// ----------------------------------------------------------
// CreateProfile
// ----------------------------------------------------------
#[derive(Accounts)]
#[instruction(github_username: String)]
pub struct CreateProfile<'info> {
    /// The user creating their profile
    #[account(mut)]
    pub user: Signer<'info>,

    /// UserProfile PDA — one per wallet
    #[account(
        init,
        payer = user,
        space = UserProfile::LEN,
        seeds = [b"profile", user.key().as_ref()],
        bump
    )]
    pub user_profile: Account<'info, UserProfile>,

    /// UsernameIndex PDA — enforces GitHub username uniqueness
    /// Using first 32 bytes of username as seed (capped at MAX_USERNAME_LEN=32)
    #[account(
        init,
        payer = user,
        space = UsernameIndex::LEN,
        seeds = [b"username", github_username.as_bytes()],
        bump
    )]
    pub username_index: Account<'info, UsernameIndex>,

    /// GlobalState — updated to increment total_users
    #[account(
        mut,
        seeds = [b"global_state"],
        bump = global_state.bump
    )]
    pub global_state: Account<'info, GlobalState>,

    pub system_program: Program<'info, System>,
}

// ----------------------------------------------------------
// SubmitProof
// ----------------------------------------------------------
#[derive(Accounts)]
#[instruction(
    github_url: String,
    commit_hash: String,
    commit_hash_seed: [u8; 32],
    effort_score: u64,
    reward_coins: u64
)]
pub struct SubmitProof<'info> {
    /// The user submitting the proof (must have a profile)
    #[account(mut)]
    pub user: Signer<'info>,

    /// User's profile — updated with XP, proofs, ECOIN
    #[account(
        mut,
        seeds = [b"profile", user.key().as_ref()],
        bump = user_profile.bump,
        // Ensure the profile belongs to this wallet
        constraint = user_profile.wallet == user.key() @ EffortXError::Unauthorized
    )]
    pub user_profile: Account<'info, UserProfile>,

    /// ProofRecord PDA — keyed by sha256(commit_hash)[..32]
    /// `init` will FAIL if this PDA already exists, enforcing uniqueness
    #[account(
        init,
        payer = user,
        space = ProofRecord::LEN,
        seeds = [b"proof", commit_hash_seed.as_ref()],
        bump
    )]
    pub proof_record: Account<'info, ProofRecord>,

    /// GlobalState — updated to increment total_proofs
    #[account(
        mut,
        seeds = [b"global_state"],
        bump = global_state.bump
    )]
    pub global_state: Account<'info, GlobalState>,

    pub system_program: Program<'info, System>,
}

// ----------------------------------------------------------
// TransferEcoins
// ----------------------------------------------------------
#[derive(Accounts)]
pub struct TransferEcoins<'info> {
    /// The sender (must sign)
    #[account(mut)]
    pub sender: Signer<'info>,

    /// Sender's profile
    #[account(
        mut,
        seeds = [b"profile", sender.key().as_ref()],
        bump = sender_profile.bump,
        constraint = sender_profile.wallet == sender.key() @ EffortXError::Unauthorized
    )]
    pub sender_profile: Account<'info, UserProfile>,

    /// Receiver's profile — identified by their wallet pubkey
    /// The frontend passes the receiver's wallet pubkey; the PDA is derived here
    #[account(
        mut,
        seeds = [b"profile", receiver_profile.wallet.as_ref()],
        bump = receiver_profile.bump,
        // Ensure sender is not sending to themselves
        constraint = sender_profile.wallet != receiver_profile.wallet @ EffortXError::CannotTransferToSelf
    )]
    pub receiver_profile: Account<'info, UserProfile>,

    pub system_program: Program<'info, System>,
}

// ----------------------------------------------------------
// BuyEcoins
// ----------------------------------------------------------
#[derive(Accounts)]
pub struct BuyEcoins<'info> {
    /// The buyer (sends SOL)
    #[account(mut)]
    pub user: Signer<'info>,

    /// User's profile — ECOIN balance updated here
    #[account(
        mut,
        seeds = [b"profile", user.key().as_ref()],
        bump = user_profile.bump,
        constraint = user_profile.wallet == user.key() @ EffortXError::Unauthorized
    )]
    pub user_profile: Account<'info, UserProfile>,

    /// Treasury wallet — receives the SOL
    /// Validated against GlobalState.treasury_wallet
    #[account(
        mut,
        constraint = treasury_wallet.key() == global_state.treasury_wallet @ EffortXError::InvalidTreasury
    )]
    /// CHECK: This is a plain system account (EOA), not a program-owned account.
    /// We validate it matches GlobalState.treasury_wallet above.
    pub treasury_wallet: UncheckedAccount<'info>,

    /// GlobalState — read to validate treasury address
    #[account(
        seeds = [b"global_state"],
        bump = global_state.bump
    )]
    pub global_state: Account<'info, GlobalState>,

    pub system_program: Program<'info, System>,
}

// ----------------------------------------------------------
// GetProfile (read-only)
// ----------------------------------------------------------
#[derive(Accounts)]
pub struct GetProfile<'info> {
    /// Any profile can be read — no signer required
    #[account(
        seeds = [b"profile", user_profile.wallet.as_ref()],
        bump = user_profile.bump
    )]
    pub user_profile: Account<'info, UserProfile>,
}

// ----------------------------------------------------------
// GetProof (read-only)
// ----------------------------------------------------------
#[derive(Accounts)]
#[instruction(commit_hash_seed: [u8; 32])]
pub struct GetProof<'info> {
    /// Any proof can be read — no signer required
    #[account(
        seeds = [b"proof", commit_hash_seed.as_ref()],
        bump = proof_record.bump
    )]
    pub proof_record: Account<'info, ProofRecord>,
}

// ============================================================
// CUSTOM ERRORS
// ============================================================

#[error_code]
pub enum EffortXError {
    #[msg("GitHub username exceeds the maximum allowed length of 32 bytes.")]
    UsernameTooLong,

    #[msg("GitHub URL exceeds the maximum allowed length of 200 bytes.")]
    UrlTooLong,

    #[msg("Commit hash is invalid or exceeds 40 characters.")]
    CommitHashInvalid,

    #[msg("Effort score must be greater than zero.")]
    InvalidScore,

    #[msg("Reward coins must be greater than zero.")]
    InvalidReward,

    #[msg("Transfer amount must be greater than zero.")]
    InvalidAmount,

    #[msg("SOL amount is too small to purchase even 1 ECOIN. Minimum is 1,000,000 lamports (0.001 SOL).")]
    AmountTooSmall,

    #[msg("Insufficient ECOIN balance for this transfer.")]
    InsufficientEcoinBalance,

    #[msg("You cannot transfer ECOIN to yourself.")]
    CannotTransferToSelf,

    #[msg("Signer does not match the profile owner.")]
    Unauthorized,

    #[msg("Treasury wallet does not match the one stored in GlobalState.")]
    InvalidTreasury,

    #[msg("Arithmetic overflow occurred.")]
    Overflow,
}