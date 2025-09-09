import { useState, useEffect } from 'react'
import './zettle-theme.css'

// Types for the knowledge system
interface Concept {
  id: string
  name: string
  domain: string
  size: number
  x: number
  y: number
  connections: string[]
  recentActivity: Date
  confidence: number
}

interface Connection {
  from: string
  to: string
  strength: number
  type: 'semantic' | 'direct' | 'contextual'
}

interface Note {
  id: string
  title: string
  content: string
  pdfPage?: number
  timestamp: Date
  tags: string[]
  conceptId?: string
}

interface StudySession {
  id: string
  fileName: string
  startTime: Date
  endTime?: Date
  notes: Note[]
  totalPages?: number
  currentPage: number
}

// ZettleMind-inspired Learning Interface
function ZettleLearningInterface({ onClose }: { onClose: () => void }) {
  const [pdfUrl, setPdfUrl] = useState<string>('')
  const [fileName, setFileName] = useState<string>('')
  const [error, setError] = useState<string>('')
  const [viewerType, setViewerType] = useState<'browser' | 'mozilla'>('browser')
  
  // Knowledge system state
  const [concepts, setConcepts] = useState<Concept[]>([])
  const [notes, setNotes] = useState<Note[]>([])
  const [currentNote, setCurrentNote] = useState<string>('')
  const [currentPage, setCurrentPage] = useState<number>(1)
  const [studySession, setStudySession] = useState<StudySession | null>(null)
  const [searchTerm, setSearchTerm] = useState<string>('')
  const [selectedConcept, setSelectedConcept] = useState<string | null>(null)

  // Initialize with empty concepts for clean new app layout
  useEffect(() => {
    const sampleConcepts: Concept[] = [
      // Empty initial state - concepts will be added as user learns
    ]
    setConcepts(sampleConcepts)
  }, [])

  // Start study session when PDF loads
  useEffect(() => {
    if (pdfUrl && fileName && !studySession) {
      const session: StudySession = {
        id: Date.now().toString(),
        fileName,
        startTime: new Date(),
        notes: [],
        currentPage: 1
      }
      setStudySession(session)
    }
  }, [pdfUrl, fileName])

  const handleFileSelect = (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0]
    if (file && file.type === 'application/pdf') {
      const url = URL.createObjectURL(file)
      setPdfUrl(url)
      setFileName(file.name)
      setError('')
    } else {
      setError('Please select a valid PDF file')
    }
  }

  const handleClose = () => {
    if (pdfUrl) {
      URL.revokeObjectURL(pdfUrl)
    }
    if (studySession) {
      const endedSession = { ...studySession, endTime: new Date(), notes }
      console.log('Study session completed:', endedSession)
    }
    onClose()
  }

  const getPdfJsUrl = (url: string) => {
    return `https://mozilla.github.io/pdf.js/web/viewer.html?file=${encodeURIComponent(url)}`
  }

  const addNote = () => {
    if (currentNote.trim()) {
      const note: Note = {
        id: Date.now().toString(),
        title: `Note - Page ${currentPage}`,
        content: currentNote,
        pdfPage: currentPage,
        timestamp: new Date(),
        tags: []
      }
      setNotes([...notes, note])
      setCurrentNote('')
      
      // Auto-generate a concept from the note
      if (currentNote.length > 20) {
        const newConcept: Concept = {
          id: note.id,
          name: currentNote.substring(0, 30) + '...',
          domain: 'learning',
          size: 25 + Math.random() * 20,
          x: 200 + Math.random() * 600,
          y: 150 + Math.random() * 400,
          connections: [],
          recentActivity: new Date(),
          confidence: 0.7
        }
        setConcepts(prev => [...prev, newConcept])
      }
    }
  }

  const deleteNote = (noteId: string) => {
    setNotes(notes.filter(n => n.id !== noteId))
    setConcepts(concepts.filter(c => c.id !== noteId))
  }

  const filteredNotes = notes.filter(note => 
    note.content.toLowerCase().includes(searchTerm.toLowerCase()) ||
    note.title.toLowerCase().includes(searchTerm.toLowerCase())
  )

  const getDomainColor = () => {
    // ZettleMind uses pure white bubbles for all concepts
    return '#ffffff'
  }

  return (
    <div className="zettle-container">
      {/* Top Navigation Bar */}
      <div className="zettle-header">
        <div className="zettle-brand">
          <div className="brand-icon">🧠</div>
          <span>ZettleMind</span>
          <span className="brand-subtitle">Ambient Learning</span>
        </div>
        
        <div className="zettle-search">
          <input
            type="text"
            placeholder="Search ideas, connections, or content..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="search-input"
          />
        </div>

        <div className="zettle-controls">
          <button className="control-btn">📄 PDF</button>
          <button className="control-btn">📺 YouTube</button>
          <button className="control-btn">📖 eBook</button>
          <button className="control-btn">💡 Add Idea</button>
          <button className="close-btn" onClick={handleClose}>✕</button>
        </div>
      </div>

      <div className="zettle-main">
        {/* Left Sidebar */}
        <div className="zettle-sidebar">
          <div className="sidebar-section">
            <div className="section-header">
              <span>🔄 Recent Activity</span>
            </div>
            <div className="activity-list">
              <div className="empty-state">
                <span className="empty-text">No recent activity yet</span>
                <span className="empty-subtext">Start learning to see your progress here</span>
              </div>
            </div>
          </div>

          <div className="sidebar-section">
            <div className="section-header">
              <span>📚 Recent Sources</span>
            </div>
            <div className="sources-list">
              {fileName ? (
                <div className="source-item active">
                  <span className="source-icon">📄</span>
                  <div className="source-info">
                    <span className="source-title">{fileName}</span>
                    <span className="source-meta">PDF • {notes.length} notes</span>
                  </div>
                </div>
              ) : (
                <div className="empty-state">
                  <span className="empty-text">No sources added yet</span>
                  <span className="empty-subtext">Upload a PDF or add content to get started</span>
                </div>
              )}
            </div>
          </div>

          <div className="sidebar-section">
            <div className="section-header">
              <span>📈 Learning Stats</span>
            </div>
            <div className="stats-grid">
              <div className="stat-item">
                <span className="stat-value">{concepts.length}</span>
                <span className="stat-label">Concepts</span>
              </div>
              <div className="stat-item">
                <span className="stat-value">{notes.length}</span>
                <span className="stat-label">Notes</span>
              </div>
              <div className="stat-item">
                <span className="stat-value">0</span>
                <span className="stat-label">Connections</span>
              </div>
            </div>
          </div>
        </div>

        {/* Main Content Area */}
        <div className="zettle-content">
          {!pdfUrl ? (
            // Knowledge Graph View
            <div className="knowledge-graph">
              {concepts.length === 0 && (
                <div className="welcome-overlay">
                  <div className="welcome-content">
                    <h2 className="welcome-title">Welcome to ZettleMind</h2>
                    <p className="welcome-subtitle">
                      Start your learning journey by uploading a PDF or adding your first idea. 
                      Watch as your knowledge graph grows with interconnected concepts.
                    </p>
                    <div className="welcome-actions">
                      <button className="upload-btn" onClick={() => document.getElementById('file-input')?.click()}>
                        📄 Upload PDF
                      </button>
                      <button className="demo-btn">💡 Add First Idea</button>
                    </div>
                  </div>
                </div>
              )}
              <div className="graph-container">
                <svg className="graph-svg" width="100%" height="100%">
                  {/* Render connections */}
                  {concepts.map(concept => 
                    concept.connections.map(connId => {
                      const target = concepts.find(c => c.id === connId)
                      if (!target) return null
                      return (
                        <line
                          key={`${concept.id}-${connId}`}
                          x1={concept.x}
                          y1={concept.y}
                          x2={target.x}
                          y2={target.y}
                          stroke="#404040"
                          strokeWidth="1"
                          className="connection-line"
                        />
                      )
                    })
                  )}
                  
                  {/* Render concept bubbles */}
                  {concepts.map(concept => (
                    <g key={concept.id}>
                      <circle
                        cx={concept.x}
                        cy={concept.y}
                        r={concept.size}
                        fill={getDomainColor()}
                        className={`concept-bubble ${selectedConcept === concept.id ? 'selected' : ''}`}
                        onClick={() => setSelectedConcept(concept.id)}
                        style={{
                          opacity: concept.confidence,
                          cursor: 'pointer',
                          filter: 'drop-shadow(0 0 10px rgba(255,255,255,0.2))'
                        }}
                      />
                      <text
                        x={concept.x}
                        y={concept.y}
                        textAnchor="middle"
                        dominantBaseline="middle"
                        className="concept-label"
                        fill="#1a1a1a"
                        fontSize="9"
                        fontWeight="400"
                      >
                        {concept.name}
                      </text>
                    </g>
                  ))}
                </svg>

                {/* File Upload Overlay */}
                <div className="upload-overlay">
                  <div className="upload-area">
                    <div className="upload-icon">📄</div>
                    <h3>Start Learning</h3>
                    <p>Upload a PDF or add a YouTube URL to begin building your knowledge graph</p>
                    <input
                      type="file"
                      accept=".pdf,application/pdf"
                      onChange={handleFileSelect}
                      className="file-input"
                      id="file-upload"
                    />
                    <label htmlFor="file-upload" className="upload-btn">
                      Choose PDF File
                    </label>
                    <button
                      className="demo-btn"
                      onClick={() => {
                        const testPdfContent = `data:application/pdf;base64,JVBERi0xLjQKMSAwIG9iago8PAovVHlwZSAvQ2F0YWxvZwovUGFnZXMgMiAwIFIKPj4KZW5kb2JqCjIgMCBvYmoKPDwKL1R5cGUgL1BhZ2VzCi9LaWRzIFszIDAgUl0KL0NvdW50IDEKPD4KZW5kb2JqCjMgMCBvYmoKPDwKL1R5cGUgL1BhZ2UKL1BhcmVudCAyIDAgUgovTWVkaWFCb3ggWzAgMCA2MTIgNzkyXQovQ29udGVudHMgNCAwIFIKPj4KZW5kb2JqCjQgMCBvYmoKPDwKL0xlbmd0aCA1NAo+PgpzdHJlYW0KQlQKL0YxIDEyIFRmCjEwMCA3MDAgVGQKKFpldHRsZUxlYXJuaW5nIC0gS25vd2xlZGdlIEdyYXBoIERlbW8pIFRqCkVUCmVuZHN0cmVhbQplbmRvYmoKeHJlZgowIDUKMDAwMDAwMDAwMCA2NTUzNSBmIAowMDAwMDAwMDA5IDAwMDAwIG4gCjAwMDAwMDAwNTggMDAwMDAgbiAKMDAwMDAwMDExNSAwMDAwMCBuIAowMDAwMDAwMjA3IDAwMDAwIG4gCnRyYWlsZXIKPDwKL1NpemUgNQovUm9vdCAxIDAgUgo+PgpzdGFydHhyZWYKMzExCiUlRU9G`
                        setPdfUrl(testPdfContent)
                        setFileName('Knowledge Graph Demo.pdf')
                        setError('')
                      }}
                    >
                      Try Demo PDF
                    </button>
                    {error && <div className="error-message">{error}</div>}
                  </div>
                </div>
              </div>
            </div>
          ) : (
            // PDF Learning Mode
            <div className="pdf-learning-mode">
              <div className="pdf-viewer">
                <div className="pdf-header">
                  <div className="pdf-info">
                    <span className="pdf-title">📖 {fileName}</span>
                    <div className="pdf-controls">
                      <button
                        className={`mode-btn ${viewerType === 'browser' ? 'active' : ''}`}
                        onClick={() => setViewerType('browser')}
                      >
                        Browser
                      </button>
                      <button
                        className={`mode-btn ${viewerType === 'mozilla' ? 'active' : ''}`}
                        onClick={() => setViewerType('mozilla')}
                      >
                        PDF.js
                      </button>
                      <input
                        type="number"
                        min="1"
                        value={currentPage}
                        onChange={(e) => setCurrentPage(parseInt(e.target.value) || 1)}
                        className="page-input"
                        placeholder="Page"
                      />
                    </div>
                  </div>
                </div>
                
                <div className="pdf-content">
                  {viewerType === 'mozilla' ? (
                    <iframe
                      src={getPdfJsUrl(pdfUrl)}
                      className="pdf-iframe"
                      title="PDF.js Viewer"
                      onError={() => setViewerType('browser')}
                    />
                  ) : (
                    <object
                      data={pdfUrl}
                      type="application/pdf"
                      className="pdf-object"
                    >
                      <embed
                        src={pdfUrl}
                        type="application/pdf"
                        className="pdf-embed"
                      />
                      <div className="pdf-fallback">
                        <p>PDF cannot be displayed</p>
                        <button onClick={() => setViewerType('mozilla')}>Try PDF.js</button>
                      </div>
                    </object>
                  )}
                </div>
              </div>

              <div className="notes-panel">
                <div className="notes-header">
                  <h3>💭 Insights & Notes</h3>
                  <span className="notes-count">{notes.length} notes</span>
                </div>
                
                <div className="note-composer">
                  <textarea
                    placeholder={`Add insight for page ${currentPage}...`}
                    value={currentNote}
                    onChange={(e) => setCurrentNote(e.target.value)}
                    className="note-textarea"
                  />
                  <button
                    onClick={addNote}
                    disabled={!currentNote.trim()}
                    className="add-note-btn"
                  >
                    ✨ Add to Knowledge Graph
                  </button>
                </div>

                <div className="notes-list">
                  {filteredNotes.length === 0 ? (
                    <div className="empty-notes">
                      <div className="empty-icon">🌱</div>
                      <p>Start capturing insights as you learn</p>
                    </div>
                  ) : (
                    filteredNotes.map((note) => (
                      <div key={note.id} className="note-item">
                        <div className="note-header">
                          <span className="note-page">Page {note.pdfPage}</span>
                          <button
                            onClick={() => deleteNote(note.id)}
                            className="delete-note-btn"
                          >
                            ✕
                          </button>
                        </div>
                        <div className="note-content">{note.content}</div>
                        <div className="note-meta">
                          {note.timestamp.toLocaleString()}
                        </div>
                      </div>
                    ))
                  )}
                </div>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  )
}

// Main App Component
export default function ZettleLearningApp() {
  return (
    <div className="app-container">
      <ZettleLearningInterface onClose={() => console.log('Close app')} />
    </div>
  )
}
