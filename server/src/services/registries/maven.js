const https = require('https');

async function getPackageInfo(groupId, artifactId) {
  if (!artifactId && groupId.includes(':')) {
    [groupId, artifactId] = groupId.split(':');
  }

  if (!groupId || !artifactId) {
    return null;
  }

  return new Promise((resolve) => {
    const query = `g:"${groupId}" AND a:"${artifactId}"`;
    const path = `/solrsearch/select?q=${encodeURIComponent(query)}&rows=20&wt=json&core=gav`;
    
    const options = {
      hostname: 'search.maven.org',
      port: 443,
      path,
      method: 'GET',
      headers: { 'Accept': 'application/json' }
    };

    const req = https.request(options, (res) => {
      let data = '';
      res.on('data', chunk => data += chunk);
      res.on('end', () => {
        try {
          if (res.statusCode !== 200) {
            resolve(null);
            return;
          }
          const response = JSON.parse(data);
          resolve(normalizeMavenData(response, groupId, artifactId));
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

function normalizeMavenData(response, groupId, artifactId) {
  const docs = response.response?.docs || [];
  
  if (docs.length === 0) {
    return null;
  }

  const releaseHistory = docs
    .map(doc => ({
      version: doc.v,
      date: doc.timestamp ? new Date(doc.timestamp).toISOString() : null
    }))
    .filter(r => r.date)
    .sort((a, b) => new Date(b.date) - new Date(a.date));

  const lastUpdate = releaseHistory[0]?.date || null;

  return {
    name: `${groupId}:${artifactId}`,
    lastUpdate,
    totalReleases: releaseHistory.length,
    releaseHistory: releaseHistory.slice(0, 20),
    maintainerCount: 0,
    maintainers: [],
    repositoryUrl: null,
    homepage: null,
    description: null
  };
}

function parseMavenCoordinate(coordinate) {
  const parts = coordinate.split(':');
  return {
    groupId: parts[0] || null,
    artifactId: parts[1] || null,
    version: parts[2] || null
  };
}

module.exports = { getPackageInfo, parseMavenCoordinate };
