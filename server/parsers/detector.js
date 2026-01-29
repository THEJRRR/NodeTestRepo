/**
 * Detects the SBOM format from the parsed JSON data
 * @param {Object} data - Parsed SBOM JSON
 * @returns {string|null} - 'cyclonedx', 'spdx', or null if unrecognized
 */
function detectFormat(data) {
  // CycloneDX detection
  if (data.bomFormat === 'CycloneDX' || data.$schema?.includes('cyclonedx')) {
    return 'cyclonedx';
  }

  // SPDX detection
  if (data.spdxVersion || data.SPDXID || data.SPDXVersion) {
    return 'spdx';
  }

  // Check for components array (CycloneDX style)
  if (data.components && Array.isArray(data.components)) {
    return 'cyclonedx';
  }

  // Check for packages array (SPDX style)
  if (data.packages && Array.isArray(data.packages) && data.packages[0]?.SPDXID) {
    return 'spdx';
  }

  return null;
}

module.exports = { detectFormat };
