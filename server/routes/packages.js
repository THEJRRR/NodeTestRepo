const express = require('express');
const router = express.Router();

// Get all packages
router.get('/', (req, res) => {
  const analysis = req.store.currentAnalysis;
  
  if (!analysis) {
    return res.status(404).json({ error: 'No SBOM uploaded. Please upload an SBOM file first.' });
  }

  const { search, sortBy, sortOrder, severity, riskLevel } = req.query;
  let packages = [...analysis.packages];

  // Filter by search term
  if (search) {
    const searchLower = search.toLowerCase();
    packages = packages.filter(p => 
      p.name.toLowerCase().includes(searchLower) ||
      (p.version && p.version.toLowerCase().includes(searchLower))
    );
  }

  // Filter by vulnerability severity
  if (severity) {
    const severities = severity.split(',').map(s => s.toUpperCase());
    packages = packages.filter(p => 
      p.vulnerabilities?.some(v => severities.includes(v.severity))
    );
  }

  // Filter by risk level
  if (riskLevel) {
    const levels = riskLevel.split(',');
    packages = packages.filter(p => {
      const score = p.riskScore?.numeric || 5;
      if (levels.includes('low') && score <= 3) return true;
      if (levels.includes('medium') && score > 3 && score <= 6) return true;
      if (levels.includes('high') && score > 6) return true;
      return false;
    });
  }

  // Sort
  if (sortBy) {
    const order = sortOrder === 'desc' ? -1 : 1;
    packages.sort((a, b) => {
      let aVal, bVal;
      switch (sortBy) {
        case 'name':
          return order * a.name.localeCompare(b.name);
        case 'risk':
          aVal = a.riskScore?.numeric || 5;
          bVal = b.riskScore?.numeric || 5;
          return order * (aVal - bVal);
        case 'vulnerabilities':
          aVal = a.vulnerabilities?.length || 0;
          bVal = b.vulnerabilities?.length || 0;
          return order * (aVal - bVal);
        case 'lastUpdate':
          aVal = a.health?.lastUpdate ? new Date(a.health.lastUpdate).getTime() : 0;
          bVal = b.health?.lastUpdate ? new Date(b.health.lastUpdate).getTime() : 0;
          return order * (aVal - bVal);
        default:
          return 0;
      }
    });
  }

  res.json({
    total: packages.length,
    packages: packages.map(p => ({
      id: p.id,
      name: p.name,
      version: p.version,
      ecosystem: p.ecosystem,
      license: p.license,
      vulnerabilityCount: p.vulnerabilities?.length || 0,
      riskScore: p.riskScore,
      maintenanceStatus: p.health?.maintenanceStatus,
      hasStagnationAlert: p.health?.isStagnant || false
    }))
  });
});

// Get single package details
router.get('/:id', (req, res) => {
  const analysis = req.store.currentAnalysis;
  
  if (!analysis) {
    return res.status(404).json({ error: 'No SBOM uploaded. Please upload an SBOM file first.' });
  }

  const pkg = analysis.packages.find(p => p.id === req.params.id);
  
  if (!pkg) {
    return res.status(404).json({ error: 'Package not found' });
  }

  res.json(pkg);
});

module.exports = router;
