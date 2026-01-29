const { v4: uuidv4 } = require('uuid');

/**
 * Parse CycloneDX SBOM format and extract packages
 * @param {Object} sbom - CycloneDX SBOM JSON
 * @returns {Array} - Array of normalized package objects
 */
function parseCycloneDX(sbom) {
  const packages = [];
  const components = sbom.components || [];

  for (const component of components) {
    const pkg = {
      id: uuidv4(),
      name: component.name,
      version: component.version || 'unknown',
      ecosystem: mapCycloneDXType(component.type, component.purl),
      license: extractLicense(component.licenses),
      purl: component.purl || null,
      description: component.description || null,
      author: component.author || component.publisher || null,
      repositoryUrl: extractRepositoryUrl(component.externalReferences),
      vulnerabilities: [],
      health: null,
      riskScore: null
    };

    packages.push(pkg);
  }

  return packages;
}

/**
 * Map CycloneDX component type to ecosystem
 */
function mapCycloneDXType(type, purl) {
  // Try to extract from purl first (more accurate)
  if (purl) {
    const purlMatch = purl.match(/^pkg:([^/]+)\//);
    if (purlMatch) {
      return mapPurlType(purlMatch[1]);
    }
  }

  // Fallback to type mapping
  const typeMap = {
    'library': 'unknown',
    'framework': 'unknown',
    'application': 'unknown',
    'container': 'container',
    'operating-system': 'os',
    'device': 'device',
    'firmware': 'firmware',
    'file': 'file'
  };

  return typeMap[type] || 'unknown';
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
 * Extract license from CycloneDX licenses array
 */
function extractLicense(licenses) {
  if (!licenses || !Array.isArray(licenses) || licenses.length === 0) {
    return 'Unknown';
  }

  const license = licenses[0];
  if (license.license) {
    return license.license.id || license.license.name || 'Unknown';
  }
  if (license.expression) {
    return license.expression;
  }

  return 'Unknown';
}

/**
 * Extract repository URL from external references
 */
function extractRepositoryUrl(externalReferences) {
  if (!externalReferences || !Array.isArray(externalReferences)) {
    return null;
  }

  const vcsRef = externalReferences.find(ref => 
    ref.type === 'vcs' || ref.type === 'website' || ref.type === 'distribution'
  );

  return vcsRef?.url || null;
}

module.exports = { parseCycloneDX };
