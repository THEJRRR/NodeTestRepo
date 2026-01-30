const { v4: uuidv4 } = require('uuid');

/**
 * Parse CycloneDX SBOM format and extract packages
 * @param {Object} sbom - CycloneDX SBOM JSON
 * @returns {Object} - Object with packages array and dependencies info
 */
function parseCycloneDX(sbom) {
  const packages = [];
  const components = sbom.components || [];
  const bomRefToPackageId = new Map();

  // First pass: create packages and build ref mapping
  for (const component of components) {
    const pkgId = uuidv4();
    const bomRef = component['bom-ref'] || component.purl || `${component.name}@${component.version}`;
    bomRefToPackageId.set(bomRef, pkgId);

    const pkg = {
      id: pkgId,
      bomRef: bomRef,
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

  // Parse dependencies if available
  const dependencies = parseDependencies(sbom.dependencies, sbom.metadata, bomRefToPackageId);

  return { packages, dependencies };
}

/**
 * Parse CycloneDX dependencies array to extract dependency info
 * @param {Array} deps - CycloneDX dependencies array
 * @param {Object} metadata - CycloneDX metadata with root component
 * @param {Map} bomRefToPackageId - Map of bom-refs to package IDs
 * @returns {Object|null} - Dependencies object or null if no dependencies
 */
function parseDependencies(deps, metadata, bomRefToPackageId) {
  if (!deps || !Array.isArray(deps) || deps.length === 0) {
    return null;
  }

  const edges = [];
  let rootId = null;

  // Determine root component from metadata
  if (metadata?.component) {
    const rootRef = metadata.component['bom-ref'] || metadata.component.purl || 
      `${metadata.component.name}@${metadata.component.version}`;
    rootId = bomRefToPackageId.get(rootRef) || null;
  }

  for (const dep of deps) {
    const fromRef = dep.ref;
    const dependsOn = dep.dependsOn || [];
    const fromId = bomRefToPackageId.get(fromRef);

    // If this is the root component reference, capture direct dependencies
    if (!rootId && metadata?.component) {
      const rootRef = metadata.component['bom-ref'] || metadata.component.purl ||
        `${metadata.component.name}@${metadata.component.version}`;
      if (fromRef === rootRef) {
        rootId = 'root'; // Special marker for root
      }
    }

    for (const toRef of dependsOn) {
      const toId = bomRefToPackageId.get(toRef);
      if (fromId && toId) {
        edges.push({ from: fromId, to: toId });
      } else if (fromRef === (metadata?.component?.['bom-ref'] || metadata?.component?.purl) && toId) {
        // Edge from root to direct dependency
        edges.push({ from: 'root', to: toId });
      }
    }
  }

  if (edges.length === 0) {
    return null;
  }

  return { rootId, edges };
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
