function RiskScore({ score, size = 'normal' }) {
  if (!score) return null

  return (
    <div className="risk-score">
      <span className={size === 'large' ? 'risk-numeric' : ''} style={{ 
        color: score.trafficLight === 'green' ? '#22c55e' : score.trafficLight === 'yellow' ? '#ca8a04' : '#dc2626'
      }}>
        {score.numeric}
      </span>
      <span className={`risk-grade ${score.grade}`}>{score.grade}</span>
      <span className={`traffic-light ${score.trafficLight}`}></span>
    </div>
  )
}

export default RiskScore
