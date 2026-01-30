const express = require('express');
const router = express.Router();

router.get('/', (req, res) => {
  const analysis = req.store.currentAnalysis;
  
  if (!analysis) {
    return res.status(404).json({ error: 'No SBOM uploaded. Please upload an SBOM file first.' });
  }

  const { severity, search } = req.query;
  let vulnerabilities = [...analysis.vulnerabilities];

  // Filter by severity
  if (severity) {
    const severities = severity.split(',').map(s => s.toUpperCase());
    vulnerabilities = vulnerabilities.filter(v => severities.includes(v.severity));
  }

  // Filter by search term
  if (search) {
    const searchLower = search.toLowerCase();
    vulnerabilities = vulnerabilities.filter(v =>
      v.id.toLowerCase().includes(searchLower) ||
      v.summary?.toLowerCase().includes(searchLower) ||
      v.affectedPackage?.toLowerCase().includes(searchLower)
    );
  }

  // Sort by severity (CRITICAL first)
  const severityOrder = { CRITICAL: 0, HIGH: 1, MEDIUM: 2, LOW: 3, UNKNOWN: 4 };
  vulnerabilities.sort((a, b) => 
    (severityOrder[a.severity] || 4) - (severityOrder[b.severity] || 4)
  );

  res.json({
    total: vulnerabilities.length,
    vulnerabilities
  });
});

module.exports = router;
