const https = require('https');

const OSV_API_URL = 'api.osv.dev';

/**
 * Query OSV API for vulnerabilities affecting a package
 */
async function queryVulnerabilities(ecosystem, name, version) {
  const osvEcosystem = mapToOSVEcosystem(ecosystem);
  
  if (!osvEcosystem) {
    return [];
  }

  const payload = JSON.stringify({
    package: {
      name: name,
      ecosystem: osvEcosystem
    },
    version: version
  });

  return new Promise((resolve) => {
    const options = {
      hostname: OSV_API_URL,
      port: 443,
      path: '/v1/query',
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Content-Length': Buffer.byteLength(payload)
      }
    };

    const req = https.request(options, (res) => {
      let data = '';
      res.on('data', chunk => data += chunk);
      res.on('end', () => {
        try {
          const response = JSON.parse(data);
          const vulns = (response.vulns || []).map(v => normalizeVulnerability(v, name));
          resolve(vulns);
        } catch (e) {
          resolve([]);
        }
      });
    });

    req.on('error', () => resolve([]));
    req.setTimeout(10000, () => {
      req.destroy();
      resolve([]);
    });

    req.write(payload);
    req.end();
  });
}

/**
 * Batch query for multiple packages
 */
async function batchQueryVulnerabilities(packages) {
  const results = new Map();
  
  const batchSize = 10;
  for (let i = 0; i < packages.length; i += batchSize) {
    const batch = packages.slice(i, i + batchSize);
    const promises = batch.map(pkg => 
      queryVulnerabilities(pkg.ecosystem, pkg.name, pkg.version)
        .then(vulns => ({ key: `${pkg.name}@${pkg.version}`, vulns }))
    );
    
    const batchResults = await Promise.all(promises);
    batchResults.forEach(({ key, vulns }) => {
      results.set(key, vulns);
    });
    
    if (i + batchSize < packages.length) {
      await new Promise(r => setTimeout(r, 100));
    }
  }
  
  return results;
}

function mapToOSVEcosystem(ecosystem) {
  const ecosystemMap = {
    'npm': 'npm',
    'PyPI': 'PyPI',
    'pypi': 'PyPI',
    'Maven': 'Maven',
    'maven': 'Maven',
    'NuGet': 'NuGet',
    'nuget': 'NuGet',
    'RubyGems': 'RubyGems',
    'rubygems': 'RubyGems',
    'crates.io': 'crates.io',
    'Go': 'Go',
    'golang': 'Go',
    'Packagist': 'Packagist',
    'composer': 'Packagist',
    'Hex': 'Hex',
    'Pub': 'Pub',
    'Debian': 'Debian',
    'Alpine': 'Alpine',
    'Linux': 'Linux'
  };

  return ecosystemMap[ecosystem] || null;
}

function normalizeVulnerability(osvVuln, packageName) {
  let severity = 'UNKNOWN';
  if (osvVuln.severity && osvVuln.severity.length > 0) {
    const cvss = osvVuln.severity.find(s => s.type === 'CVSS_V3' || s.type === 'CVSS_V2');
    if (cvss && cvss.score) {
      severity = cvssToSeverity(parseFloat(cvss.score));
    }
  }
  
  if (severity === 'UNKNOWN' && osvVuln.database_specific?.severity) {
    severity = osvVuln.database_specific.severity.toUpperCase();
  }

  let fixedVersion = null;
  if (osvVuln.affected) {
    for (const affected of osvVuln.affected) {
      if (affected.ranges) {
        for (const range of affected.ranges) {
          const fixed = range.events?.find(e => e.fixed);
          if (fixed) {
            fixedVersion = fixed.fixed;
            break;
          }
        }
      }
    }
  }

  return {
    id: osvVuln.id,
    aliases: osvVuln.aliases || [],
    severity,
    summary: osvVuln.summary || 'No summary available',
    details: osvVuln.details || '',
    affectedPackage: packageName,
    fixedVersion,
    publishedAt: osvVuln.published,
    modifiedAt: osvVuln.modified,
    references: (osvVuln.references || []).map(r => ({
      type: r.type,
      url: r.url
    }))
  };
}

function cvssToSeverity(score) {
  if (score >= 9.0) return 'CRITICAL';
  if (score >= 7.0) return 'HIGH';
  if (score >= 4.0) return 'MEDIUM';
  if (score > 0) return 'LOW';
  return 'UNKNOWN';
}

module.exports = {
  queryVulnerabilities,
  batchQueryVulnerabilities
};
