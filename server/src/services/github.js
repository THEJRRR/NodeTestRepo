const https = require('https');

const GITHUB_API = 'api.github.com';
const GITHUB_TOKEN = process.env.GITHUB_TOKEN || null;

/**
 * Get repository information from GitHub
 */
async function getRepositoryInfo(repoUrl) {
  const repoPath = extractRepoPath(repoUrl);
  if (!repoPath) return null;

  const repoData = await makeGitHubRequest(`/repos/${repoPath}`);
  if (!repoData) return null;

  const contributors = await makeGitHubRequest(`/repos/${repoPath}/contributors?per_page=10`);
  const locations = await getContributorLocations(contributors || []);
  const commits = await makeGitHubRequest(`/repos/${repoPath}/commits?per_page=30`);

  return {
    fullName: repoData.full_name,
    description: repoData.description,
    stars: repoData.stargazers_count,
    forks: repoData.forks_count,
    openIssues: repoData.open_issues_count,
    lastPush: repoData.pushed_at,
    createdAt: repoData.created_at,
    archived: repoData.archived,
    disabled: repoData.disabled,
    contributorCount: contributors?.length || 0,
    contributorLocations: locations,
    recentCommitCount: commits?.length || 0,
    lastCommitDate: commits?.[0]?.commit?.committer?.date || null
  };
}

function extractRepoPath(url) {
  if (!url) return null;
  
  const patterns = [
    /github\.com\/([^\/]+\/[^\/]+?)(?:\.git)?(?:\/|$)/,
    /github\.com:([^\/]+\/[^\/]+?)(?:\.git)?$/,
  ];

  for (const pattern of patterns) {
    const match = url.match(pattern);
    if (match) {
      return match[1].replace(/\.git$/, '');
    }
  }

  return null;
}

async function getContributorLocations(contributors) {
  const locations = [];
  const topContributors = contributors.slice(0, 5);

  for (const contributor of topContributors) {
    if (contributor.login) {
      const user = await makeGitHubRequest(`/users/${contributor.login}`);
      if (user?.location) {
        locations.push(user.location);
      }
    }
  }

  return [...new Set(locations)];
}

function makeGitHubRequest(path) {
  return new Promise((resolve) => {
    const options = {
      hostname: GITHUB_API,
      port: 443,
      path: path,
      method: 'GET',
      headers: {
        'User-Agent': 'SBOM-Viewer/1.0',
        'Accept': 'application/vnd.github.v3+json'
      }
    };

    if (GITHUB_TOKEN) {
      options.headers['Authorization'] = `token ${GITHUB_TOKEN}`;
    }

    const req = https.request(options, (res) => {
      let data = '';
      res.on('data', chunk => data += chunk);
      res.on('end', () => {
        try {
          if (res.statusCode === 403 || res.statusCode === 429) {
            console.warn('GitHub API rate limit reached');
            resolve(null);
            return;
          }
          if (res.statusCode !== 200) {
            resolve(null);
            return;
          }
          resolve(JSON.parse(data));
        } catch (e) {
          resolve(null);
        }
      });
    });

    req.on('error', () => resolve(null));
    req.setTimeout(10000, () => {
      req.destroy();
      resolve(null);
    });

    req.end();
  });
}

module.exports = {
  getRepositoryInfo,
  extractRepoPath
};
