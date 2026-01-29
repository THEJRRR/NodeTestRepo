import { useState, useEffect, useCallback } from 'react'
import FileUpload from './components/FileUpload'
import Dashboard from './components/Dashboard'
import PackageList from './components/PackageList'
import CVEList from './components/CVEList'
import PackageDetail from './components/PackageDetail'
import DependencyGraph from './components/DependencyGraph'
import { getStats, getPackages, getCVEs, getPackageDetails, getDependencies } from './services/api'

function App() {
  const [stats, setStats] = useState(null)
  const [packages, setPackages] = useState([])
  const [cves, setCves] = useState([])
  const [dependencyGraph, setDependencyGraph] = useState(null)
  const [hasDependencyInfo, setHasDependencyInfo] = useState(false)
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState(null)
  const [activeTab, setActiveTab] = useState('packages')
  const [selectedPackage, setSelectedPackage] = useState(null)
  const [filters, setFilters] = useState({
    search: '',
    sortBy: 'risk',
    sortOrder: 'desc',
    severity: '',
    riskLevel: '',
    dependencyType: ''
  })

  const loadData = useCallback(async () => {
    try {
      const [statsData, packagesData, cvesData, depsData] = await Promise.all([
        getStats(),
        getPackages(filters),
        getCVEs(),
        getDependencies()
      ])
      setStats(statsData)
      setPackages(packagesData?.packages || [])
      setCves(cvesData?.vulnerabilities || [])
      setHasDependencyInfo(statsData?.hasDependencyInfo || false)
      setDependencyGraph(depsData?.graph || null)
      setError(null)
    } catch (err) {
      console.error('Error loading data:', err)
    }
  }, [filters])

  useEffect(() => { loadData() }, [loadData])

  const handleUploadSuccess = async () => {
    setLoading(true)
    setError(null)
    await loadData()
    setLoading(false)
  }

  const handleUploadError = (errorMessage) => { setError(errorMessage) }

  const handlePackageClick = async (pkg) => {
    try {
      const details = await getPackageDetails(pkg.id)
      setSelectedPackage(details)
    } catch (err) {
      setError('Failed to load package details')
    }
  }

  const handleFilterChange = (newFilters) => {
    setFilters(prev => ({ ...prev, ...newFilters }))
  }

  return (
    <div className="app">
      <header className="header">
        <h1>🔍 SBOM Viewer</h1>
        <p>Upload and analyze Software Bill of Materials with vulnerability scanning and risk assessment</p>
      </header>

      {error && <div className="error">{error}</div>}

      <FileUpload onSuccess={handleUploadSuccess} onError={handleUploadError} />

      {loading && (
        <div className="loading">
          <div className="loading-spinner"></div>
          <p>Analyzing SBOM...</p>
        </div>
      )}

      {stats && (
        <>
          <Dashboard stats={stats} />
          <div className="tabs">
            <button className={`tab ${activeTab === 'packages' ? 'active' : ''}`} onClick={() => setActiveTab('packages')}>
              Packages ({packages.length})
            </button>
            <button className={`tab ${activeTab === 'vulnerabilities' ? 'active' : ''}`} onClick={() => setActiveTab('vulnerabilities')}>
              Vulnerabilities ({cves.length})
            </button>
            {hasDependencyInfo && (
              <button className={`tab ${activeTab === 'dependencies' ? 'active' : ''}`} onClick={() => setActiveTab('dependencies')}>
                Dependency Graph
              </button>
            )}
          </div>

          {activeTab === 'packages' && (
            <PackageList packages={packages} filters={filters} onFilterChange={handleFilterChange} onPackageClick={handlePackageClick} />
          )}

          {activeTab === 'vulnerabilities' && <CVEList cves={cves} />}

          {activeTab === 'dependencies' && hasDependencyInfo && (
            <DependencyGraph graph={dependencyGraph} onNodeClick={handlePackageClick} />
          )}
        </>
      )}

      {selectedPackage && <PackageDetail pkg={selectedPackage} onClose={() => setSelectedPackage(null)} />}
    </div>
  )
}

export default App
