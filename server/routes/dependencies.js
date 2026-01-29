const express = require('express');
const router = express.Router();

// Get dependency graph data
router.get('/', (req, res) => {
  const analysis = req.store.currentAnalysis;
  
  if (!analysis) {
    return res.status(404).json({ error: 'No SBOM uploaded. Please upload an SBOM file first.' });
  }

  if (!analysis.hasDependencyInfo || !analysis.dependencyGraph) {
    return res.status(404).json({ 
      error: 'No dependency information available in this SBOM.',
      hasDependencyInfo: false 
    });
  }

  res.json({
    hasDependencyInfo: true,
    graph: analysis.dependencyGraph
  });
});

module.exports = router;
