import RiskScore from './RiskScore'

function Dashboard({ stats }) {
  const { summary } = stats

  return (
    <div className="dashboard">
      <div className="stat-card">
        <h4>Total Packages</h4>
        <div className="value">{summary.totalPackages}</div>
        <div className="sub-value">{summary.packagesWithVulnerabilities} with vulnerabilities</div>
      </div>

      <div className="stat-card">
        <h4>Vulnerabilities Found</h4>
        <div className="value">{summary.totalVulnerabilities}</div>
        <div className="severity-breakdown">
          {summary.severityBreakdown.CRITICAL > 0 && (
            <div className="severity-item"><span className="severity-dot critical"></span><span>{summary.severityBreakdown.CRITICAL} Critical</span></div>
          )}
          {summary.severityBreakdown.HIGH > 0 && (
            <div className="severity-item"><span className="severity-dot high"></span><span>{summary.severityBreakdown.HIGH} High</span></div>
          )}
          {summary.severityBreakdown.MEDIUM > 0 && (
            <div className="severity-item"><span className="severity-dot medium"></span><span>{summary.severityBreakdown.MEDIUM} Medium</span></div>
          )}
          {summary.severityBreakdown.LOW > 0 && (
            <div className="severity-item"><span className="severity-dot low"></span><span>{summary.severityBreakdown.LOW} Low</span></div>
          )}
        </div>
      </div>

      <div className="stat-card">
        <h4>Overall Risk Score</h4>
        <RiskScore score={summary.overallRiskScore} size="large" />
      </div>

      <div className="stat-card">
        <h4>Risk Distribution</h4>
        <div className="severity-breakdown">
          <div className="severity-item"><span className="traffic-light green"></span><span>{summary.riskDistribution.low} Low Risk</span></div>
          <div className="severity-item"><span className="traffic-light yellow"></span><span>{summary.riskDistribution.medium} Medium</span></div>
          <div className="severity-item"><span className="traffic-light red"></span><span>{summary.riskDistribution.high} High Risk</span></div>
        </div>
      </div>
    </div>
  )
}

export default Dashboard
