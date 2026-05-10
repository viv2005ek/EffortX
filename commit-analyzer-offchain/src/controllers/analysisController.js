const { parseGitHubUrl } = require('../utils/githubParser');
const { fetchCommitData, fetchPullRequestData, preprocessData } = require('../services/githubService');
const { analyzeContribution } = require('../services/geminiService');
const { calculateRewardCoins } = require('../services/scoringService');

/**
 * Main analysis endpoint controller
 */
const analyze = async (req, res) => {
  try {
    const { githubUrl } = req.body;

    if (!githubUrl) {
      return res.status(400).json({
        success: false,
        error: 'githubUrl is required'
      });
    }

    // STEP 1: Parse URL
    const parsed = parseGitHubUrl(githubUrl);
    const { owner, repo, type } = parsed;

    // STEP 2: Fetch Data
    let rawData;
    if (type === 'commit') {
      rawData = await fetchCommitData(owner, repo, parsed.hash);
    } else {
      rawData = await fetchPullRequestData(owner, repo, parsed.pullNumber);
    }

    // STEP 3: Preprocess for AI
    const processedData = preprocessData(rawData, type);

    // STEP 4: AI Analysis
    const aiResult = await analyzeContribution(processedData);

    // STEP 5: Calculate Rewards
    const rewardCoins = calculateRewardCoins(aiResult.effortScore);

    // STEP 6: Format Final Response
    const responseData = {
      type: type,
      repository: repo,
      author: rawData.author,
      commitHash: parsed.hash || null,
      pullNumber: parsed.pullNumber || null,
      commitMessage: rawData.message || rawData.title,
      effortScore: aiResult.effortScore,
      rewardCoins: rewardCoins,
      contributionCategory: aiResult.contributionCategory,
      complexity: aiResult.complexity,
      summary: aiResult.summary,
      strengths: aiResult.strengths,
      weaknesses: aiResult.weaknesses,
      spamProbability: aiResult.spamProbability,
      aiConfidence: aiResult.aiConfidence,
      analyzedAt: new Date().toISOString()
    };

    return res.status(200).json({
      success: true,
      data: responseData
    });

  } catch (error) {
    console.error('Analysis Controller Error:', error);
    
    let statusCode = 500;
    if (error.message.includes('Invalid GitHub URL') || error.message.includes('Unsupported')) {
      statusCode = 400;
    } else if (error.message.includes('Not Found')) {
      statusCode = 404;
    }

    return res.status(statusCode).json({
      success: false,
      error: error.message
    });
  }
};

/**
 * Health check
 */
const healthCheck = (req, res) => {
  res.status(200).json({
    status: 'healthy',
    timestamp: new Date().toISOString(),
    service: 'EffortX Off-chain Analyzer'
  });
};

module.exports = {
  analyze,
  healthCheck
};
