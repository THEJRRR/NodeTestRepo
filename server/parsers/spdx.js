const { v4: uuidv4 } = require('uuid');

/**
 * Parse SPDX SBOM format and extract packages
 * @param {Object} sbom - SPDX SBOM JSON
 * @returns {Array} - Array of normalized package objects
 */
function parseSPDX(sbom) {
  const packages = [];
  const spdxPackages = sbom.packages || [];

  for (const spdxPkg of spdxPackages) {
    // Skip the root document package
    if (spdxPkg.SPDXID === 'SPDXRef-DOCUMENT') {
      continue;
    }

    const pkg = {
      id: uuidv4(),
      name: spdxPkg.name,
      version: spdxPkg.versionInfo || 'unknown',
      ecosystem: detectEcosystem(spdxPkg),
      license: extractLicense(spdxPkg),
      purl: extractPurl(spdxPkg.externalRefs),
      description: spdxPkg.description || spdxPkg.summary || null,
      author: spdxPkg.supplier || spdxPkg.originator || null,
      repositoryUrl: spdxPkg.downloadLocation !== 'NOASSERTION' ? spdxPkg.downloadLocation : null,
      vulnerabilities: [],
      health: null,
      riskScore: null
    };

    packages.push(pkg);
  }

  return packages;
}

/**
 * Detect ecosystem from SPDX package data
 */
function detectEcosystem(spdxPkg) {
  // Try to extract from purl in external refs
  const purl = extractPurl(spdxPkg.externalRefs);
  if (purl) {
    const purlMatch = purl.match(/^pkg:([^/]+)\//);
    if (purlMatch) {
      return mapPurlType(purlMatch[1]);
    }
  }

  // Try to detect from package name patterns
  const name = spdxPkg.name?.toLowerCase() || '';
  
  if (name.includes('npm') || name.startsWith('@')) {
    return 'npm';
  }
  if (spdxPkg.downloadLocation?.includes('pypi.org')) {
    return 'PyPI';
  }
  if (spdxPkg.downloadLocation?.includes('maven')) {
    return 'Maven';
  }
  if (spdxPkg.downloadLocation?.includes('nuget')) {
    return 'NuGet';
  }
  if (spdxPkg.downloadLocation?.includes('rubygems')) {
    return 'RubyGems';
  }

  return 'unknown';
}

/**
 * Map PURL type to ecosystem name
 */
function mapPurlType(purlType) {
  const purlMap = {
    'npm': 'npm',
    'pypi': 'PyPI',
    'maven': 'Maven',
    'nuget': 'NuGet',
    'gem': 'RubyGems',
    'cargo': 'crates.io',
    'golang': 'Go',
    'composer': 'Packagist',
    'cocoapods': 'CocoaPods',
    'swift': 'Swift',
    'pub': 'Pub',
    'hex': 'Hex',
    'deb': 'Debian',
    'rpm': 'RPM',
    'apk': 'Alpine',
    'docker': 'Docker',
    'github': 'GitHub'
  };

  return purlMap[purlType] || purlType;
}

/**
 * Extract license from SPDX package
 */
function extractLicense(spdxPkg) {
  if (spdxPkg.licenseConcluded && spdxPkg.licenseConcluded !== 'NOASSERTION') {
    return spdxPkg.licenseConcluded;
  }
  if (spdxPkg.licenseDeclared && spdxPkg.licenseDeclared !== 'NOASSERTION') {
    return spdxPkg.licenseDeclared;
  }

  return 'Unknown';
}

/**
 * Extract PURL from SPDX external references
 */
function extractPurl(externalRefs) {
  if (!externalRefs || !Array.isArray(externalRefs)) {
    return null;
  }

  const purlRef = externalRefs.find(ref => 
    ref.referenceType === 'purl' || 
    ref.referenceCategory === 'PACKAGE-MANAGER' ||
    ref.referenceLocator?.startsWith('pkg:')
  );

  return purlRef?.referenceLocator || null;
}

module.exports = { parseSPDX };
