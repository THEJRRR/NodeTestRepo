import { useState, useRef } from 'react'
import { uploadSBOM } from '../services/api'

function FileUpload({ onSuccess, onError }) {
  const [dragging, setDragging] = useState(false)
  const [uploading, setUploading] = useState(false)
  const [fileName, setFileName] = useState(null)
  const fileInputRef = useRef(null)

  const handleDragOver = (e) => { e.preventDefault(); setDragging(true) }
  const handleDragLeave = (e) => { e.preventDefault(); setDragging(false) }

  const handleDrop = async (e) => {
    e.preventDefault()
    setDragging(false)
    const file = e.dataTransfer.files[0]
    if (file) await handleFile(file)
  }

  const handleFileSelect = async (e) => {
    const file = e.target.files[0]
    if (file) await handleFile(file)
  }

  const handleFile = async (file) => {
    if (!file.name.endsWith('.json')) {
      onError('Please upload a JSON file')
      return
    }
    setUploading(true)
    setFileName(file.name)
    try {
      await uploadSBOM(file)
      onSuccess()
    } catch (err) {
      onError(err.message)
    } finally {
      setUploading(false)
    }
  }

  return (
    <div className="upload-container">
      <div 
        className={`upload-zone ${dragging ? 'dragging' : ''}`}
        onDragOver={handleDragOver}
        onDragLeave={handleDragLeave}
        onDrop={handleDrop}
        onClick={() => fileInputRef.current?.click()}
      >
        <input ref={fileInputRef} type="file" accept=".json" onChange={handleFileSelect} />
        {uploading ? (
          <>
            <div className="loading-spinner"></div>
            <p>Uploading and analyzing {fileName}...</p>
          </>
        ) : (
          <>
            <h3>📁 Drop your SBOM file here</h3>
            <p>or click to browse • Supports CycloneDX and SPDX JSON formats</p>
          </>
        )}
      </div>
    </div>
  )
}

export default FileUpload
