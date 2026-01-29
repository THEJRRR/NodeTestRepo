import RiskScore from './RiskScore'
import PackageHealth from './PackageHealth'
import StagnationAlert from './StagnationAlert'
import VulnerabilityCard from './VulnerabilityCard'

function PackageDetail({ pkg, onClose }) {
  return (
    <div className="modal-overlay" onClick={onClose}>
      <div className="modal-content" onClick={e => e.stopPropagation()}>
        <div className="modal-header">
          <div>
            <h2>{pkg.name} <span style={{ color: '#888', fontWeight: 'normal' }}>v{pkg.version}</span></h2>
            <p style={{ color: '#888', marginTop: '5px' }}>{pkg.ecosystem} • {pkg.license}</p>
          </div>
          <button className="modal-close" onClick={onClose}>&times;</button>
        </div>

        <div className="modal-body">
          <div className="section">
            <h4>Risk Assessment</h4>
            <div style={{ display: 'flex', gap: '30px', alignItems: 'flex-start', flexWrap: 'wrap' }}>
              <RiskScore score={pkg.riskScore} size="large" />
              {pkg.riskScore?.components && (
                <div className="health-grid" style={{ flex: 1 }}>
                  <div className="health-item"><label>Vulnerability Score</label><div className="value">{pkg.riskScore.components.vulnerability}/10</div></div>
                  <div className="health-item"><label>Maintenance Score</label><div className="value">{pkg.riskScore.components.maintenance}/10</div></div>
                  <div className="health-item"><label>Staleness Score</label><div className="value">{pkg.riskScore.components.staleness}/10</div></div>
                  <div className="health-item"><label>Stagnation Score</label><div className="value">{pkg.riskScore.components.stagnation}/10</div></div>
                </div>
              )}
            </div>
            {pkg.riskScore?.flags?.length > 0 && (
              <div className="flags" style={{ marginTop: '15px' }}>
                {pkg.riskScore.flags.map(flag => <span key={flag} className={`flag ${flag}`}>{flag.replace(/-/g, ' ')}</span>)}
              </div>
            )}
          </div>

          {pkg.health?.isStagnant && <StagnationAlert details={pkg.health.stagnationDetails} />}

          {pkg.health && <div className="section"><h4>Package Health</h4><PackageHealth health={pkg.health} /></div>}

          <div className="section">
            <h4>Vulnerabilities ({pkg.vulnerabilities?.length || 0})</h4>
            {pkg.vulnerabilities?.length > 0 ? pkg.vulnerabilities.map(vuln => <VulnerabilityCard key={vuln.id} vulnerability={vuln} />) : <p style={{ color: '#22c55e' }}>✓ No known vulnerabilities</p>}
          </div>

          <div className="section">
            <h4>Additional Information</h4>
            <div className="health-grid">
              {pkg.purl && <div className="health-item"><label>PURL</label><div className="value" style={{ fontSize: '0.85rem', wordBreak: 'break-all' }}>{pkg.purl}</div></div>}
              {pkg.repositoryUrl && <div className="health-item"><label>Repository</label><div className="value"><a href={pkg.repositoryUrl} target="_blank" rel="noopener noreferrer" style={{ color: '#667eea' }}>{pkg.repositoryUrl}</a></div></div>}
              {pkg.description && <div className="health-item" style={{ gridColumn: '1 / -1' }}><label>Description</label><div className="value" style={{ fontSize: '0.9rem' }}>{pkg.description}</div></div>}
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}

export default PackageDetail
