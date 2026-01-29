const express = require('express');
const router = express.Router();

router.get('/', (req, res) => {
  const analysis = req.store.currentAnalysis;
  
  if (!analysis) {
    return res.status(404).json({ error: 'No SBOM uploaded. Please upload an SBOM file first.' });
  }

  const { packages, vulnerabilities } = analysis;

  // Count packages with vulnerabilities
  const packagesWithVulns = packages.filter(p => p.vulnerabilities && p.vulnerabilities.length > 0);
  
  // Vulnerability breakdown by severity
  const severityCounts = {
    CRITICAL: 0,
    HIGH: 0,
    MEDIUM: 0,
    LOW: 0,
    UNKNOWN: 0
  };

  vulnerabilities.forEach(v => {
    const severity = v.severity || 'UNKNOWN';
    if (severityCounts.hasOwnProperty(severity)) {
      severityCounts[severity]++;
    } else {
      severityCounts.UNKNOWN++;
    }
  });

  // Risk distribution
  const riskDistribution = {
    low: 0,    // score 1-3
    medium: 0, // score 4-6
    high: 0    // score 7-10
  };

  packages.forEach(p => {
    if (p.riskScore) {
      if (p.riskScore.numeric <= 3) riskDistribution.low++;
      else if (p.riskScore.numeric <= 6) riskDistribution.medium++;
      else riskDistribution.high++;
    }
  });

  // Calculate overall SBOM risk score (average of all packages)
  const avgRiskScore = packages.length > 0
    ? packages.reduce((sum, p) => sum + (p.riskScore?.numeric || 5), 0) / packages.length
    : 0;

  res.json({
    id: analysis.id,
    uploadedAt: analysis.uploadedAt,
    fileName: analysis.fileName,
    format: analysis.format,
    summary: {
      totalPackages: packages.length,
      packagesWithVulnerabilities: packagesWithVulns.length,
      totalVulnerabilities: vulnerabilities.length,
      severityBreakdown: severityCounts,
      riskDistribution,
      overallRiskScore: {
        numeric: Math.round(avgRiskScore * 10) / 10,
        grade: getGrade(avgRiskScore),
        trafficLight: getTrafficLight(avgRiskScore)
      }
    }
  });
});

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

module.exports = router;
