/**
 * Utility to parse GitHub URLs and extract owner, repo, and commit/PR info.
 */
const parseGitHubUrl = (url) => {
  try {
    const urlObj = new URL(url);
    if (urlObj.hostname !== 'github.com') {
      throw new Error('Invalid GitHub URL hostname');
    }

    const pathParts = urlObj.pathname.split('/').filter(part => part !== '');
    
    // Expected formats:
    // https://github.com/owner/repo/commit/hash
    // https://github.com/owner/repo/pull/number
    
    if (pathParts.length < 4) {
      throw new Error('Incomplete GitHub URL');
    }

    const owner = pathParts[0];
    const repo = pathParts[1];
    const type = pathParts[2]; // 'commit' or 'pull'
    const id = pathParts[3];

    if (type === 'commit') {
      return { owner, repo, type: 'commit', hash: id };
    } else if (type === 'pull') {
      return { owner, repo, type: 'pull', pullNumber: id };
    } else {
      throw new Error('Unsupported GitHub resource type. Use commit or pull request links.');
    }
  } catch (error) {
    throw new Error(`Failed to parse GitHub URL: ${error.message}`);
  }
};

module.exports = { parseGitHubUrl };
