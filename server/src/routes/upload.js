const express = require('express');
const multer = require('multer');
const { v4: uuidv4 } = require('uuid');
const { parseCycloneDX } = require('../parsers/cyclonedx');
const { parseSPDX } = require('../parsers/spdx');
const { detectFormat } = require('../parsers/detector');
const { analyzePackages } = require('../services/analyzer');
const { resolveDependencies } = require('../services/dependencyResolver');

const router = express.Router();
const upload = multer({ storage: multer.memoryStorage() });

router.post('/', upload.single('sbom'), async (req, res) => {
  try {
    if (!req.file) {
      return res.status(400).json({ error: 'No file uploaded' });
    }

    const content = req.file.buffer.toString('utf-8');
    let sbomData;
    
    try {
      sbomData = JSON.parse(content);
    } catch (e) {
      return res.status(400).json({ error: 'Invalid JSON file' });
    }

    const format = detectFormat(sbomData);
    if (!format) {
      return res.status(400).json({ error: 'Unsupported SBOM format. Please upload CycloneDX or SPDX JSON.' });
    }

    let parseResult;
    if (format === 'cyclonedx') {
      parseResult = parseCycloneDX(sbomData);
    } else if (format === 'spdx') {
      parseResult = parseSPDX(sbomData);
    }

    const { packages, dependencies } = parseResult;

    // Analyze packages for vulnerabilities and health
    const analysis = await analyzePackages(packages);
    
    // Resolve direct vs transitive dependencies
    const dependencyResult = resolveDependencies(analysis.packages, dependencies);
    
    // Store in memory
    req.store.currentAnalysis = {
      id: uuidv4(),
      uploadedAt: new Date().toISOString(),
      fileName: req.file.originalname,
      format,
      packages: dependencyResult.packages,
      vulnerabilities: analysis.vulnerabilities,
      dependencyGraph: dependencyResult.dependencyGraph,
      hasDependencyInfo: dependencyResult.hasDependencyInfo
    };

    res.json({
      success: true,
      id: req.store.currentAnalysis.id,
      format,
      packageCount: packages.length,
      hasDependencyInfo: dependencyResult.hasDependencyInfo,
      message: 'SBOM uploaded and analyzed successfully'
    });
  } catch (error) {
    console.error('Upload error:', error);
    res.status(500).json({ error: 'Failed to process SBOM file' });
  }
});

module.exports = router;
