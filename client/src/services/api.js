const API_BASE = '/api';

export async function uploadSBOM(file) {
  const formData = new FormData();
  formData.append('sbom', file);

  const response = await fetch(`${API_BASE}/upload`, {
    method: 'POST',
    body: formData
  });

  if (!response.ok) {
    const error = await response.json();
    throw new Error(error.error || 'Upload failed');
  }

  return response.json();
}

export async function getStats() {
  const response = await fetch(`${API_BASE}/stats`);
  if (!response.ok) {
    if (response.status === 404) return null;
    throw new Error('Failed to fetch stats');
  }
  return response.json();
}

export async function getPackages(params = {}) {
  const queryParams = new URLSearchParams();
  if (params.search) queryParams.set('search', params.search);
  if (params.sortBy) queryParams.set('sortBy', params.sortBy);
  if (params.sortOrder) queryParams.set('sortOrder', params.sortOrder);
  if (params.severity) queryParams.set('severity', params.severity);
  if (params.riskLevel) queryParams.set('riskLevel', params.riskLevel);

  const url = `${API_BASE}/packages${queryParams.toString() ? '?' + queryParams.toString() : ''}`;
  const response = await fetch(url);

  if (!response.ok) {
    if (response.status === 404) return { packages: [], total: 0 };
    throw new Error('Failed to fetch packages');
  }
  return response.json();
}

export async function getPackageDetails(id) {
  const response = await fetch(`${API_BASE}/packages/${id}`);
  if (!response.ok) throw new Error('Failed to fetch package details');
  return response.json();
}

export async function getCVEs(params = {}) {
  const queryParams = new URLSearchParams();
  if (params.severity) queryParams.set('severity', params.severity);
  if (params.search) queryParams.set('search', params.search);

  const url = `${API_BASE}/cves${queryParams.toString() ? '?' + queryParams.toString() : ''}`;
  const response = await fetch(url);

  if (!response.ok) {
    if (response.status === 404) return { vulnerabilities: [], total: 0 };
    throw new Error('Failed to fetch CVEs');
  }
  return response.json();
}

export async function getDependencies() {
  const response = await fetch(`${API_BASE}/dependencies`);
  if (!response.ok) {
    if (response.status === 404) return { hasDependencyInfo: false, graph: null };
    throw new Error('Failed to fetch dependencies');
  }
  return response.json();
}
