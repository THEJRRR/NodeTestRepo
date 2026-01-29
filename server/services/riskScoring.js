const STAGNATION_DORMANT_DAYS = 365;
const STAGNATION_RECENT_DAYS = 90;

function calculateRiskScore(pkg) {
  const components = {
    vulnerability: calculateVulnerabilityScore(pkg.vulnerabilities || []),
    maintenance: calculateMaintenanceScore(pkg.health),
    staleness: calculateStalenessScore(pkg.health),
    stagnation: calculateStagnationScore(pkg.health)
  };

  const weights = {
    vulnerability: 0.4,
    maintenance: 0.2,
    staleness: 0.25,
    stagnation: 0.15
  };

  const numeric = Math.round(
    (components.vulnerability * weights.vulnerability +
     components.maintenance * weights.maintenance +
     components.staleness * weights.staleness +
     components.stagnation * weights.stagnation) * 10
  ) / 10;

  const flags = generateFlags(pkg, components);

  return {
    numeric: Math.min(10, Math.max(1, numeric)),
    grade: getGrade(numeric),
    trafficLight: getTrafficLight(numeric),
    components,
    flags
  };
}

function calculateVulnerabilityScore(vulnerabilities) {
  if (!vulnerabilities || vulnerabilities.length === 0) {
    return 1;
  }

  const severityWeights = {
    CRITICAL: 10,
    HIGH: 7,
    MEDIUM: 4,
    LOW: 2,
    UNKNOWN: 3
  };

  let totalWeight = 0;
  for (const vuln of vulnerabilities) {
    totalWeight += severityWeights[vuln.severity] || 3;
  }

  return Math.min(10, 1 + (totalWeight / 2));
}

function calculateMaintenanceScore(health) {
  if (!health) return 5;

  const status = health.maintenanceStatus;
  switch (status) {
    case 'active': return 1;
    case 'minimal': return 4;
    case 'abandoned': return 9;
    default: return 5;
  }
}

function calculateStalenessScore(health) {
  if (!health || !health.lastUpdate) return 5;

  const daysSinceUpdate = health.daysSinceLastUpdate;
  
  if (daysSinceUpdate <= 30) return 1;
  if (daysSinceUpdate <= 90) return 2;
  if (daysSinceUpdate <= 180) return 3;
  if (daysSinceUpdate <= 365) return 5;
  if (daysSinceUpdate <= 730) return 7;
  return 9;
}

function calculateStagnationScore(health) {
  if (!health || !health.isStagnant) return 1;
  return 8;
}

function generateFlags(pkg, components) {
  const flags = [];

  if (pkg.vulnerabilities?.some(v => v.severity === 'CRITICAL')) {
    flags.push('critical-cve');
  }
  if (pkg.vulnerabilities?.some(v => v.severity === 'HIGH')) {
    flags.push('high-cve');
  }
  if (pkg.health?.maintenanceStatus === 'abandoned') {
    flags.push('abandoned');
  }
  if (pkg.health?.isStagnant) {
    flags.push('stagnation-alert');
  }
  if (pkg.health?.maintainerCount === 0) {
    flags.push('no-maintainer-info');
  }

  return flags;
}

function analyzePackageHealth(registryData, githubData) {
  if (!registryData && !githubData) {
    return null;
  }

  const now = new Date();
  const lastUpdate = registryData?.lastUpdate || githubData?.lastPush;
  const lastUpdateDate = lastUpdate ? new Date(lastUpdate) : null;
  const daysSinceLastUpdate = lastUpdateDate 
    ? Math.floor((now - lastUpdateDate) / (1000 * 60 * 60 * 24))
    : null;

  let maintenanceStatus = 'unknown';
  if (daysSinceLastUpdate !== null) {
    if (daysSinceLastUpdate <= 180) maintenanceStatus = 'active';
    else if (daysSinceLastUpdate <= 365) maintenanceStatus = 'minimal';
    else maintenanceStatus = 'abandoned';
  }

  const stagnationInfo = detectStagnation(registryData?.releaseHistory);
  const updateFrequency = determineUpdateFrequency(registryData?.releaseHistory);

  return {
    lastUpdate: lastUpdateDate?.toISOString() || null,
    updateFrequency,
    daysSinceLastUpdate,
    totalReleases: registryData?.totalReleases || 0,
    releaseHistory: registryData?.releaseHistory || [],
    maintainerCount: registryData?.maintainerCount || githubData?.contributorCount || 0,
    repositoryUrl: registryData?.repositoryUrl || null,
    contributorLocations: githubData?.contributorLocations || [],
    isStagnant: stagnationInfo.isStagnant,
    stagnationDetails: stagnationInfo.isStagnant ? {
      dormantPeriodDays: stagnationInfo.dormantPeriodDays,
      recentUpdateDate: stagnationInfo.recentUpdateDate
    } : null,
    maintenanceStatus,
    githubStats: githubData ? {
      stars: githubData.stars,
      forks: githubData.forks,
      openIssues: githubData.openIssues,
      archived: githubData.archived
    } : null
  };
}

function detectStagnation(releaseHistory) {
  if (!releaseHistory || releaseHistory.length < 2) {
    return { isStagnant: false };
  }

  const now = new Date();
  const sortedReleases = [...releaseHistory].sort((a, b) => 
    new Date(b.date) - new Date(a.date)
  );

  const latestRelease = new Date(sortedReleases[0].date);
  const previousRelease = new Date(sortedReleases[1].date);

  const daysSinceLatest = Math.floor((now - latestRelease) / (1000 * 60 * 60 * 24));
  const gapBetweenReleases = Math.floor((latestRelease - previousRelease) / (1000 * 60 * 60 * 24));

  const isStagnant = daysSinceLatest <= STAGNATION_RECENT_DAYS && 
                     gapBetweenReleases >= STAGNATION_DORMANT_DAYS;

  return {
    isStagnant,
    dormantPeriodDays: isStagnant ? gapBetweenReleases : null,
    recentUpdateDate: isStagnant ? latestRelease.toISOString() : null
  };
}

function determineUpdateFrequency(releaseHistory) {
  if (!releaseHistory || releaseHistory.length < 2) {
    return 'unknown';
  }

  const sortedReleases = [...releaseHistory].sort((a, b) => 
    new Date(b.date) - new Date(a.date)
  );

  let totalGap = 0;
  for (let i = 0; i < Math.min(sortedReleases.length - 1, 10); i++) {
    const current = new Date(sortedReleases[i].date);
    const previous = new Date(sortedReleases[i + 1].date);
    totalGap += (current - previous) / (1000 * 60 * 60 * 24);
  }

  const avgGap = totalGap / Math.min(sortedReleases.length - 1, 10);

  if (avgGap <= 14) return 'frequent';
  if (avgGap <= 60) return 'regular';
  if (avgGap <= 180) return 'infrequent';
  return 'stale';
}

function getGrade(score) {
  if (score <= 2) return 'A';
  if (score <= 4) return 'B';
  if (score <= 6) return 'C';
  if (score <= 8) return 'D';
  return 'F';
}

function getTrafficLight(score) {
  if (score <= 3) return 'green';
  if (score <= 6) return 'yellow';
  return 'red';
}

module.exports = {
  calculateRiskScore,
  analyzePackageHealth,
  detectStagnation,
  determineUpdateFrequency
};
