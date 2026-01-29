function CVEList({ cves }) {
  if (cves.length === 0) {
    return <div className="cve-list"><div className="loading"><p style={{ color: '#22c55e' }}>✓ No vulnerabilities found</p></div></div>
  }

  return (
    <div className="cve-list">
      <div className="package-list-header"><h3>Vulnerabilities</h3></div>
      {cves.map(cve => (
        <div key={cve.id} className="cve-item">
          <div className="cve-header">
            <span className={`severity-badge ${cve.severity?.toLowerCase() || 'unknown'}`}>{cve.severity || 'UNKNOWN'}</span>
            <span className="cve-id">{cve.id}</span>
            {cve.aliases?.length > 0 && <span style={{ color: '#888', fontSize: '0.85rem' }}>({cve.aliases.join(', ')})</span>}
          </div>
          <div className="cve-summary">{cve.summary}</div>
          <div className="cve-meta">
            <span>Package: <strong>{cve.affectedPackage}</strong></span>
            {cve.fixedVersion && <span>Fix available: <strong>v{cve.fixedVersion}</strong></span>}
            {cve.publishedAt && <span>Published: {new Date(cve.publishedAt).toLocaleDateString()}</span>}
          </div>
          {cve.references?.length > 0 && (
            <div className="cve-meta">
              {cve.references.slice(0, 3).map((ref, i) => (
                <a key={i} href={ref.url} target="_blank" rel="noopener noreferrer" style={{ color: '#667eea', textDecoration: 'none' }}>{ref.type || 'Reference'} →</a>
              ))}
            </div>
          )}
        </div>
      ))}
    </div>
  )
}

export default CVEList
