/**
 * Logic for calculating rewards and evaluating scores
 */

const calculateRewardCoins = (effortScore) => {
  if (effortScore < 0) return 0;
  if (effortScore <= 200) return 5;
  if (effortScore <= 500) return 20;
  if (effortScore <= 800) return 50;
  return 120;
};

/**
 * Heuristics for spam detection based on raw stats
 * (Complementary to AI analysis)
 */
const detectSpamHeuristics = (stats) => {
  const { additions, deletions, total } = stats;
  
  // Trivial changes (e.g. only 1-2 lines in a non-code file)
  if (total < 3) {
    return 0.7; // High probability of being trivial/spam
  }

  // Large auto-generated files (heuristic)
  // This is better handled by AI but we can flag it here
  return 0.05; // Default low
};

module.exports = {
  calculateRewardCoins,
  detectSpamHeuristics
};
