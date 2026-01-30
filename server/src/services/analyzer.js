const { batchQueryVulnerabilities } = require('./osv');
const { getRepositoryInfo } = require('./github');
const registries = require('./registries');
const { calculateRiskScore, analyzePackageHealth } = require('./riskScoring');

async function analyzePackages(packages) {
  console.log(`Analyzing ${packages.length} packages...`);

  // Step 1: Query vulnerabilities
  console.log('Querying OSV for vulnerabilities...');
  const vulnMap = await batchQueryVulnerabilities(
    packages.map(p => ({
      ecosystem: p.ecosystem,
      name: p.name,
      version: p.version
    }))
  );

  // Step 2: Fetch package health data
  console.log('Fetching package health data from registries...');
  const healthDataMap = new Map();
  
  const batchSize = 5;
  for (let i = 0; i < packages.length; i += batchSize) {
    const batch = packages.slice(i, i + batchSize);
    const promises = batch.map(async (pkg) => {
      try {
        const registryData = await registries.getPackageInfo(
          pkg.ecosystem,
          pkg.name,
          pkg.version
        );
        
        let githubData = null;
        const repoUrl = registryData?.repositoryUrl || pkg.repositoryUrl;
        if (repoUrl && repoUrl.includes('github.com')) {
          githubData = await getRepositoryInfo(repoUrl);
        }

        return {
          key: pkg.id,
          health: analyzePackageHealth(registryData, githubData)
        };
      } catch (error) {
        console.error(`Error fetching health data for ${pkg.name}:`, error.message);
        return { key: pkg.id, health: null };
      }
    });

    const results = await Promise.all(promises);
    results.forEach(({ key, health }) => {
      healthDataMap.set(key, health);
    });

    if (i + batchSize < packages.length) {
      await new Promise(r => setTimeout(r, 200));
    }
  }

  // Step 3: Enrich packages
  console.log('Calculating risk scores...');
  const allVulnerabilities = [];
  
  const enrichedPackages = packages.map(pkg => {
    const key = `${pkg.name}@${pkg.version}`;
    const vulnerabilities = vulnMap.get(key) || [];
    const health = healthDataMap.get(pkg.id) || null;

    vulnerabilities.forEach(v => {
      if (!allVulnerabilities.find(av => av.id === v.id)) {
        allVulnerabilities.push(v);
      }
    });

    const enrichedPkg = {
      ...pkg,
      vulnerabilities,
      health,
      riskScore: null
    };

    enrichedPkg.riskScore = calculateRiskScore(enrichedPkg);

    return enrichedPkg;
  });

  console.log(`Analysis complete. Found ${allVulnerabilities.length} unique vulnerabilities.`);

  return {
    packages: enrichedPackages,
    vulnerabilities: allVulnerabilities
  };
}

module.exports = { analyzePackages };
