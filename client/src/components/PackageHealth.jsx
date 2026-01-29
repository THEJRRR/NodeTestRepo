function PackageHealth({ health }) {
  if (!health) return null
  const formatDate = (dateStr) => dateStr ? new Date(dateStr).toLocaleDateString() : 'Unknown'

  return (
    <div className="health-grid">
      <div className="health-item">
        <label>Last Update</label>
        <div className="value">{formatDate(health.lastUpdate)}{health.daysSinceLastUpdate !== null && <span style={{ color: '#888', fontSize: '0.85rem', marginLeft: '8px' }}>({health.daysSinceLastUpdate} days ago)</span>}</div>
      </div>
      <div className="health-item"><label>Update Frequency</label><div className="value" style={{ textTransform: 'capitalize' }}>{health.updateFrequency || 'Unknown'}</div></div>
      <div className="health-item"><label>Total Releases</label><div className="value">{health.totalReleases || 0}</div></div>
      <div className="health-item"><label>Maintainers</label><div className="value">{health.maintainerCount || 'Unknown'}</div></div>
      <div className="health-item">
        <label>Maintenance Status</label>
        <div className="value"><span className={`severity-badge ${health.maintenanceStatus === 'active' ? 'low' : health.maintenanceStatus === 'minimal' ? 'medium' : health.maintenanceStatus === 'abandoned' ? 'high' : 'unknown'}`}>{health.maintenanceStatus || 'Unknown'}</span></div>
      </div>
      {health.contributorLocations?.length > 0 && <div className="health-item"><label>Contributor Locations</label><div className="value" style={{ fontSize: '0.9rem' }}>{health.contributorLocations.join(', ')}</div></div>}
      {health.githubStats && (
        <>
          <div className="health-item"><label>GitHub Stars</label><div className="value">⭐ {health.githubStats.stars?.toLocaleString()}</div></div>
          <div className="health-item"><label>Open Issues</label><div className="value">{health.githubStats.openIssues}</div></div>
        </>
      )}
      {health.releaseHistory?.length > 0 && (
        <div className="health-item" style={{ gridColumn: '1 / -1' }}>
          <label>Recent Releases</label>
          <div style={{ display: 'flex', gap: '10px', flexWrap: 'wrap', marginTop: '8px' }}>
            {health.releaseHistory.slice(0, 5).map((release, i) => (
              <span key={i} style={{ background: '#f3f4f6', padding: '4px 10px', borderRadius: '4px', fontSize: '0.85rem' }}>{release.version} <span style={{ color: '#888' }}>({formatDate(release.date)})</span></span>
            ))}
          </div>
        </div>
      )}
    </div>
  )
}

export default PackageHealth
