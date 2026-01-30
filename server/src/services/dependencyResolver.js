/**
 * Resolve direct vs transitive dependencies from parsed SBOM data
 */

/**
 * Classify packages as direct or transitive dependencies
 * @param {Array} packages - Array of package objects
 * @param {Object} dependencies - Dependencies object with rootId and edges
 * @returns {Object} - Enhanced packages with dependency info and graph data
 */
function resolveDependencies(packages, dependencies) {
  if (!dependencies || !dependencies.edges || dependencies.edges.length === 0) {
    return {
      packages,
      dependencyGraph: null,
      hasDependencyInfo: false
    };
  }

  const { rootId, edges } = dependencies;
  const packageMap = new Map(packages.map(p => [p.id, p]));
  
  // Build adjacency lists
  const dependsOn = new Map();  // package -> packages it depends on
  const dependencyOf = new Map();  // package -> packages that depend on it
  
  for (const edge of edges) {
    if (!dependsOn.has(edge.from)) {
      dependsOn.set(edge.from, []);
    }
    dependsOn.get(edge.from).push(edge.to);
    
    if (!dependencyOf.has(edge.to)) {
      dependencyOf.set(edge.to, []);
    }
    dependencyOf.get(edge.to).push(edge.from);
  }

  // Find direct dependencies (dependencies of root)
  const directDeps = new Set();
  if (rootId) {
    const rootDeps = dependsOn.get(rootId) || [];
    for (const depId of rootDeps) {
      directDeps.add(depId);
    }
  } else {
    // If no root, packages with no dependents are considered direct
    for (const pkg of packages) {
      const dependents = dependencyOf.get(pkg.id) || [];
      if (dependents.length === 0 || dependents.every(d => d === 'root')) {
        directDeps.add(pkg.id);
      }
    }
  }

  // Enhance packages with dependency classification
  const enhancedPackages = packages.map(pkg => {
    const isDirect = directDeps.has(pkg.id);
    const pkgDependsOn = (dependsOn.get(pkg.id) || [])
      .filter(id => id !== 'root' && packageMap.has(id));
    const pkgDependencyOf = (dependencyOf.get(pkg.id) || [])
      .filter(id => id !== 'root' && packageMap.has(id));

    return {
      ...pkg,
      isDirect,
      dependencyType: isDirect ? 'direct' : 'transitive',
      dependsOn: pkgDependsOn,
      dependencyOf: pkgDependencyOf
    };
  });

  // Build graph structure for visualization
  const nodes = enhancedPackages.map(pkg => ({
    id: pkg.id,
    name: pkg.name,
    version: pkg.version,
    isDirect: pkg.isDirect,
    ecosystem: pkg.ecosystem,
    vulnerabilityCount: pkg.vulnerabilities?.length || 0,
    riskScore: pkg.riskScore?.numeric || null
  }));

  const graphEdges = edges
    .filter(e => e.from !== 'root' && packageMap.has(e.from) && packageMap.has(e.to))
    .map(e => ({
      source: e.from,
      target: e.to
    }));

  return {
    packages: enhancedPackages,
    dependencyGraph: {
      nodes,
      edges: graphEdges,
      rootId: rootId !== 'root' ? rootId : null
    },
    hasDependencyInfo: true
  };
}

module.exports = { resolveDependencies };
