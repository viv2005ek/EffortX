const axios = require('axios');
require('dotenv').config();

const GITHUB_API_BASE = 'https://api.github.com';
const GITHUB_TOKEN = process.env.GITHUB_TOKEN;

const githubClient = axios.create({
  baseURL: GITHUB_API_BASE,
  headers: {
    'Accept': 'application/vnd.github.v3+json',
    ...(GITHUB_TOKEN && { 'Authorization': `token ${GITHUB_TOKEN}` })
  }
});

/**
 * Fetch commit data from GitHub
 */
const fetchCommitData = async (owner, repo, hash) => {
  try {
    const response = await githubClient.get(`/repos/${owner}/${repo}/commits/${hash}`);
    const data = response.data;

    return {
      author: data.commit.author.name || data.author.login,
      message: data.commit.message,
      timestamp: data.commit.author.date,
      additions: data.stats.additions,
      deletions: data.stats.deletions,
      totalChanges: data.stats.total,
      files: data.files.map(file => ({
        filename: file.filename,
        status: file.status,
        additions: file.additions,
        deletions: file.deletions,
        patch: file.patch // This is the diff
      }))
    };
  } catch (error) {
    throw new Error(`GitHub Commit API Error: ${error.response?.data?.message || error.message}`);
  }
};

/**
 * Fetch Pull Request data from GitHub
 */
const fetchPullRequestData = async (owner, repo, pullNumber) => {
  try {
    const [prResponse, filesResponse] = await Promise.all([
      githubClient.get(`/repos/${owner}/${repo}/pulls/${pullNumber}`),
      githubClient.get(`/repos/${owner}/${repo}/pulls/${pullNumber}/files`)
    ]);

    const prData = prResponse.data;
    const filesData = filesResponse.data;

    return {
      author: prData.user.login,
      title: prData.title,
      description: prData.body,
      state: prData.state,
      merged: prData.merged,
      createdAt: prData.created_at,
      mergedAt: prData.merged_at,
      additions: prData.additions,
      deletions: prData.deletions,
      changedFiles: prData.changed_files,
      files: filesData.map(file => ({
        filename: file.filename,
        status: file.status,
        additions: file.additions,
        deletions: file.deletions,
        patch: file.patch
      }))
    };
  } catch (error) {
    throw new Error(`GitHub PR API Error: ${error.response?.data?.message || error.message}`);
  }
};

/**
 * Preprocess GitHub data for LLM
 */
const preprocessData = (rawData, type) => {
  // Limit patch size to avoid hitting LLM token limits
  const MAX_PATCH_LENGTH = 2000;
  
  const processedFiles = rawData.files.map(file => {
    let patch = file.patch || '';
    if (patch.length > MAX_PATCH_LENGTH) {
      patch = patch.substring(0, MAX_PATCH_LENGTH) + '\n... [Diff truncated due to size]';
    }
    return {
      filename: file.filename,
      changes: `+${file.additions} -${file.deletions}`,
      patch: patch
    };
  });

  if (type === 'commit') {
    return {
      type: 'commit',
      author: rawData.author,
      message: rawData.message,
      timestamp: rawData.timestamp,
      stats: {
        additions: rawData.additions,
        deletions: rawData.deletions,
        total: rawData.totalChanges
      },
      files: processedFiles
    };
  } else {
    return {
      type: 'pull_request',
      author: rawData.author,
      title: rawData.title,
      description: rawData.description,
      stats: {
        additions: rawData.additions,
        deletions: rawData.deletions,
        filesChanged: rawData.changedFiles
      },
      files: processedFiles
    };
  }
};

module.exports = {
  fetchCommitData,
  fetchPullRequestData,
  preprocessData
};
