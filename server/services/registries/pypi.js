const https = require('https');

async function getPackageInfo(packageName) {
  return new Promise((resolve) => {
    const options = {
      hostname: 'pypi.org',
      port: 443,
      path: `/pypi/${encodeURIComponent(packageName)}/json`,
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
          resolve(normalizePyPIData(pkgData));
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

function normalizePyPIData(data) {
  const info = data.info || {};
  const releases = data.releases || {};
  
  const releaseHistory = Object.entries(releases)
    .filter(([_, files]) => files.length > 0)
    .map(([version, files]) => ({
      version,
      date: files[0]?.upload_time || null
    }))
    .filter(r => r.date)
    .sort((a, b) => new Date(b.date) - new Date(a.date));

  const lastUpdate = releaseHistory[0]?.date || null;

  let repositoryUrl = null;
  const projectUrls = info.project_urls || {};
  repositoryUrl = projectUrls.Repository || 
                  projectUrls.Source || 
                  projectUrls.GitHub ||
                  projectUrls['Source Code'] ||
                  info.home_page;

  return {
    name: info.name,
    lastUpdate,
    totalReleases: releaseHistory.length,
    releaseHistory: releaseHistory.slice(0, 20),
    maintainerCount: info.maintainer ? 1 : (info.author ? 1 : 0),
    maintainers: [info.maintainer || info.author].filter(Boolean),
    repositoryUrl,
    homepage: info.home_page || null,
    description: info.summary || null
  };
}

module.exports = { getPackageInfo };
