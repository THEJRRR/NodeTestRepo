const https = require('https');

async function getPackageInfo(packageName) {
  return new Promise((resolve) => {
    const encodedName = packageName.replace('/', '%2f');
    
    const options = {
      hostname: 'registry.npmjs.org',
      port: 443,
      path: `/${encodedName}`,
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
          const pkgData = JSON.parse(data);
          resolve(normalizeNpmData(pkgData));
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

function normalizeNpmData(data) {
  const time = data.time || {};
  const versions = Object.keys(time).filter(v => v !== 'created' && v !== 'modified');
  
  const releaseHistory = versions
    .map(v => ({ version: v, date: time[v] }))
    .sort((a, b) => new Date(b.date) - new Date(a.date));

  const lastUpdate = time.modified || releaseHistory[0]?.date;
  const maintainers = data.maintainers || [];

  return {
    name: data.name,
    lastUpdate,
    totalReleases: versions.length,
    releaseHistory: releaseHistory.slice(0, 20),
    maintainerCount: maintainers.length,
    maintainers: maintainers.map(m => m.name || m.email),
    repositoryUrl: data.repository?.url || null,
    homepage: data.homepage || null,
    description: data.description || null
  };
}

module.exports = { getPackageInfo };
