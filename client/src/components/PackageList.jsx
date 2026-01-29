import { useState } from 'react'
import RiskScore from './RiskScore'

function PackageList({ packages, filters, onFilterChange, onPackageClick }) {
  const [sortBy, setSortBy] = useState(filters.sortBy || 'risk')
  const [sortOrder, setSortOrder] = useState(filters.sortOrder || 'desc')

  const handleSort = (column) => {
    const newOrder = sortBy === column && sortOrder === 'desc' ? 'asc' : 'desc'
    setSortBy(column)
    setSortOrder(newOrder)
    onFilterChange({ sortBy: column, sortOrder: newOrder })
  }

  const handleRiskFilter = (level) => {
    const current = filters.riskLevel?.split(',').filter(Boolean) || []
    const newLevels = current.includes(level) ? current.filter(l => l !== level) : [...current, level]
    onFilterChange({ riskLevel: newLevels.join(',') })
  }

  const getSortIndicator = (column) => sortBy !== column ? '' : sortOrder === 'asc' ? ' ↑' : ' ↓'

  return (
    <div className="package-list">
      <div className="package-list-header">
        <h3>Packages</h3>
        <div className="filters">
          <input type="text" className="search-input" placeholder="Search packages..." value={filters.search || ''} onChange={(e) => onFilterChange({ search: e.target.value })} />
          <button className={`filter-btn ${filters.riskLevel?.includes('high') ? 'active' : ''}`} onClick={() => handleRiskFilter('high')}>High Risk</button>
          <button className={`filter-btn ${filters.riskLevel?.includes('medium') ? 'active' : ''}`} onClick={() => handleRiskFilter('medium')}>Medium</button>
          <button className={`filter-btn ${filters.riskLevel?.includes('low') ? 'active' : ''}`} onClick={() => handleRiskFilter('low')}>Low Risk</button>
        </div>
      </div>

      <table className="package-table">
        <thead>
          <tr>
            <th onClick={() => handleSort('name')}>Package{getSortIndicator('name')}</th>
            <th>Ecosystem</th>
            <th onClick={() => handleSort('vulnerabilities')}>CVEs{getSortIndicator('vulnerabilities')}</th>
            <th onClick={() => handleSort('risk')}>Risk Score{getSortIndicator('risk')}</th>
            <th>Status</th>
            <th>Flags</th>
          </tr>
        </thead>
        <tbody>
          {packages.map(pkg => (
            <tr key={pkg.id} onClick={() => onPackageClick(pkg)} style={{ cursor: 'pointer' }}>
              <td><span className="package-name">{pkg.name}</span><span className="package-version"> v{pkg.version}</span></td>
              <td>{pkg.ecosystem}</td>
              <td>{pkg.vulnerabilityCount > 0 ? <span className="severity-badge high">{pkg.vulnerabilityCount}</span> : <span style={{ color: '#22c55e' }}>✓ None</span>}</td>
              <td><RiskScore score={pkg.riskScore} /></td>
              <td><span className={`severity-badge ${pkg.maintenanceStatus === 'active' ? 'low' : pkg.maintenanceStatus === 'minimal' ? 'medium' : pkg.maintenanceStatus === 'abandoned' ? 'high' : 'unknown'}`}>{pkg.maintenanceStatus || 'Unknown'}</span></td>
              <td>
                <div className="flags">
                  {pkg.riskScore?.flags?.map(flag => <span key={flag} className={`flag ${flag}`}>{flag.replace('-', ' ')}</span>)}
                  {pkg.hasStagnationAlert && <span className="flag stagnation-alert">⚠️ Stagnation</span>}
                </div>
              </td>
            </tr>
          ))}
        </tbody>
      </table>
      {packages.length === 0 && <div className="loading"><p>No packages found</p></div>}
    </div>
  )
}

export default PackageList
