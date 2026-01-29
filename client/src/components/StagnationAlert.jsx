function StagnationAlert({ details }) {
  if (!details) return null
  return (
    <div className="stagnation-alert">
      <h5>⚠️ Stagnation Alert</h5>
      <p>This package had a new release on {new Date(details.recentUpdateDate).toLocaleDateString()} after being dormant for approximately {Math.round(details.dormantPeriodDays / 30)} months. This pattern may indicate a supply chain security concern.</p>
    </div>
  )
}

export default StagnationAlert
