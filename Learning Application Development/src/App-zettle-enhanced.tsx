import { useState, useEffect } from 'react'
import { useAuth } from './hooks/useAuth'
import { apiClient, Content, Concept } from './utils/apiClient'
import PDFViewer from './components/PDFViewer'
import './zettle-theme.css'

// Enhanced types for backend integration
interface EnhancedConcept extends Concept {
  size: number
  x: number
  y: number
  connections: string[]
  recentActivity: Date
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

// Enhanced ZettleMind Interface with Backend Integration
function ZettleLearningInterface() {
  const { user, logout } = useAuth()
  const [pdfUrl, setPdfUrl] = useState<string>('')
  const [fileName, setFileName] = useState<string>('')
  const [error, setError] = useState<string>('')
  const [isUploading, setIsUploading] = useState(false)
  
  // Backend state
  const [contents, setContents] = useState<Content[]>([])
  const [concepts, setConcepts] = useState<EnhancedConcept[]>([])
  const [notes, setNotes] = useState<Note[]>([])
  const [currentNote, setCurrentNote] = useState<string>('')
  const [currentPage, setCurrentPage] = useState<number>(1)
  const [studySession, setStudySession] = useState<StudySession | null>(null)
  const [searchTerm, setSearchTerm] = useState<string>('')
  const [selectedConcept, setSelectedConcept] = useState<string | null>(null)
  const [librarySearchTerm, setLibrarySearchTerm] = useState<string>('')
  const [librarySortBy, setLibrarySortBy] = useState<'title' | 'created_at' | 'content_type'>('created_at')
  const [libraryFilterType, setLibraryFilterType] = useState<string>('all')
  
  // Layout management state
  const [sidebarWidth, setSidebarWidth] = useState<number>(() => {
    const saved = localStorage.getItem('sidebar-width')
    return saved ? parseInt(saved) : 400
  })
  const [isSidebarVisible, setIsSidebarVisible] = useState<boolean>(() => {
    const saved = localStorage.getItem('sidebar-visible')
    return saved ? JSON.parse(saved) : true
  })
  const [isPdfFullscreen, setIsPdfFullscreen] = useState<boolean>(false)
  const [isNotesFullscreen, setIsNotesFullscreen] = useState<boolean>(false)
  const [isResizing, setIsResizing] = useState<boolean>(false)



  // Load user's content and concepts on mount
  useEffect(() => {
    const token = localStorage.getItem('auth_token')
    if (token) {
      loadUserData()
    }
  }, [])

  const loadUserData = async () => {
    try {
      const token = localStorage.getItem('auth_token')
      if (!token) {
        return
      }
      
      // Load user's content
      const contentResponse = await apiClient.getContent(1, 50)
      setContents(contentResponse.items)

      // Load concepts and enhance them for visualization
      const conceptsData = await apiClient.getConcepts(50)
      const enhancedConcepts: EnhancedConcept[] = conceptsData.map((concept, index) => ({
        ...concept,
        size: 25 + Math.random() * 20,
        x: 200 + (index % 5) * 150 + Math.random() * 50,
        y: 150 + Math.floor(index / 5) * 100 + Math.random() * 50,
        connections: [],
        recentActivity: new Date()
      }))
      setConcepts(enhancedConcepts)
    } catch (err) {
      console.error('Error loading user data:', err)
      setError('Failed to load your content')
    }
  }

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

  const handleFileSelect = async (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0]
    if (file && file.type === 'application/pdf') {
      setIsUploading(true)
      setError('')
      
      try {
        // Upload to backend
        const uploadedContent = await apiClient.uploadPDF(file.name.replace('.pdf', ''), file)
        
        // Create local URL for viewing
        const url = URL.createObjectURL(file)
        setPdfUrl(url)
        setFileName(file.name)
        
        // Refresh content list
        await loadUserData()
        
        console.log('PDF uploaded successfully:', uploadedContent)
      } catch (err) {
        setError(err instanceof Error ? err.message : 'Failed to upload PDF')
      } finally {
        setIsUploading(false)
      }
    } else {
      setError('Please select a valid PDF file')
    }
  }

  const handleClose = () => {
    if (pdfUrl && pdfUrl.startsWith('blob:')) {
      URL.revokeObjectURL(pdfUrl)
    }
    if (studySession) {
      const endedSession = { ...studySession, endTime: new Date(), notes }
      console.log('Study session completed:', endedSession)
    }
    setPdfUrl('')
    setFileName('')
    setStudySession(null)
  }

  const openLibraryFile = async (content: Content) => {
    if (content.content_type === 'pdf') {
      try {
        // Fetch the file from backend with authentication headers
        const token = localStorage.getItem('auth_token')
        
        if (!token) {
          setError('Authentication required')
          return
        }
        
        const response = await fetch(`http://localhost:8000/api/content/${content.id}/file`, {
          headers: { Authorization: `Bearer ${token}` }
        })
        
        if (response.ok) {
          const blob = await response.blob()
          
          // Create object URL for the PDF
          const url = URL.createObjectURL(blob)
          setPdfUrl(url)
          setFileName(content.title + '.pdf')
        } else {
          await response.text() // Consume the response
          setError('Failed to load PDF file')
        }
      } catch (err) {
        setError('Failed to open PDF file')
      }
    }
  }

  // Function to handle deleting library files
  const deleteLibraryFile = async (contentId: string) => {
    if (confirm('Are you sure you want to delete this file?')) {
      try {
        await apiClient.deleteContent(contentId)
        setError('') // Clear any previous errors
        await loadUserData() // Refresh the library
        
        // Show success message (you could add a success state similar to error)
        console.log('File deleted successfully')
      } catch (err) {
        const errorMessage = err instanceof Error ? err.message : 'Failed to delete file'
        setError(errorMessage)
        console.error('Delete error:', err)
      }
    }
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
      
      // Auto-generate a concept from the note (local visualization)
      if (currentNote.length > 20) {
        const newConcept: EnhancedConcept = {
          id: note.id,
          name: currentNote.substring(0, 30) + '...',
          description: currentNote,
          category: 'learning',
          confidence_score: 0.7,
          content_title: fileName || 'Current Document',
          size: 25 + Math.random() * 20,
          x: 200 + Math.random() * 600,
          y: 150 + Math.random() * 400,
          connections: [],
          recentActivity: new Date()
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

  const filteredAndSortedContents = contents
    .filter(content => {
      const matchesSearch = content.title.toLowerCase().includes(librarySearchTerm.toLowerCase())
      const matchesFilter = libraryFilterType === 'all' || content.content_type === libraryFilterType
      return matchesSearch && matchesFilter
    })
    .sort((a, b) => {
      switch (librarySortBy) {
        case 'title':
          return a.title.localeCompare(b.title)
        case 'content_type':
          return a.content_type.localeCompare(b.content_type)
        case 'created_at':
        default:
          return new Date(b.created_at).getTime() - new Date(a.created_at).getTime()
      }
    })

  const getDomainColor = (domain: string) => {
    const colors = {
      science: '#4ade80',
      technology: '#60a5fa', 
      learning: '#a78bfa',
      general: '#f59e0b'
    }
    return colors[domain as keyof typeof colors] || '#8b5cf6'
  }

  // Resize handling functions
  const handleMouseDown = (e: React.MouseEvent) => {
    setIsResizing(true)
    document.body.classList.add('resizing')
    e.preventDefault()
  }

  const handleMouseMove = (e: MouseEvent) => {
    if (!isResizing) return
    
    const container = document.querySelector('.pdf-study-area') as HTMLElement
    if (!container) return
    
    const containerRect = container.getBoundingClientRect()
    const newWidth = containerRect.right - e.clientX
    
    // Constrain sidebar width between 250px and 600px
    const constrainedWidth = Math.min(Math.max(newWidth, 250), 600)
    setSidebarWidth(constrainedWidth)
  }

  const handleMouseUp = () => {
    setIsResizing(false)
    document.body.classList.remove('resizing')
  }

  // Add event listeners for resize
  useEffect(() => {
    if (isResizing) {
      document.addEventListener('mousemove', handleMouseMove)
      document.addEventListener('mouseup', handleMouseUp)
      document.body.style.cursor = 'ew-resize'
      document.body.style.userSelect = 'none'
      
      return () => {
        document.removeEventListener('mousemove', handleMouseMove)
        document.removeEventListener('mouseup', handleMouseUp)
        document.body.style.cursor = ''
        document.body.style.userSelect = ''
      }
    }
  }, [isResizing])

  // Toggle functions
  const toggleSidebar = () => {
    setIsSidebarVisible(!isSidebarVisible)
  }

  const togglePdfFullscreen = () => {
    setIsPdfFullscreen(!isPdfFullscreen)
    if (!isPdfFullscreen) {
      setIsNotesFullscreen(false) // Ensure only one fullscreen at a time
    }
  }

  const toggleNotesFullscreen = () => {
    setIsNotesFullscreen(!isNotesFullscreen)
    if (!isNotesFullscreen) {
      setIsPdfFullscreen(false) // Ensure only one fullscreen at a time
    }
  }

  // Keyboard shortcuts
  useEffect(() => {
    const handleKeyDown = (event: KeyboardEvent) => {
      // Only handle if no input is focused
      const activeElement = document.activeElement as HTMLElement;
      const isInputFocused = activeElement?.tagName === 'INPUT' || 
                            activeElement?.tagName === 'TEXTAREA' ||
                            activeElement?.contentEditable === 'true';
      
      if (isInputFocused) return;

      switch (event.key) {
        case 'F11':
          event.preventDefault();
          togglePdfFullscreen();
          break;
        case 'Escape':
          event.preventDefault();
          if (isPdfFullscreen || isNotesFullscreen) {
            setIsPdfFullscreen(false);
            setIsNotesFullscreen(false);
          }
          break;
        case 'h':
        case 'H':
          if (event.ctrlKey) {
            event.preventDefault();
            toggleSidebar();
          }
          break;
        case 'n':
        case 'N':
          if (event.ctrlKey && event.shiftKey) {
            event.preventDefault();
            toggleNotesFullscreen();
          }
          break;
      }
    };

    // Add event listener when component mounts
    document.addEventListener('keydown', handleKeyDown);
    
    // Cleanup event listener when component unmounts
    return () => {
      document.removeEventListener('keydown', handleKeyDown);
    };
  }, [isPdfFullscreen, isNotesFullscreen, isSidebarVisible])

  // Save layout preferences
  useEffect(() => {
    localStorage.setItem('sidebar-width', sidebarWidth.toString())
  }, [sidebarWidth])

  useEffect(() => {
    localStorage.setItem('sidebar-visible', JSON.stringify(isSidebarVisible))
  }, [isSidebarVisible]);

  return (
    <div className="zettle-app">
      <div className="app-header">
        <div className="header-left">
          <div className="app-title">
            <span className="app-icon">🧠</span>
            <span>ZettleMind Learning</span>
          </div>
          <div className="user-info">
            Welcome, {user?.email}
          </div>
        </div>
        
        <div className="header-right">
          <button 
            onClick={logout}
            className="logout-btn"
          >
            Sign Out
          </button>
        </div>
      </div>

      <div className="main-interface">
        <div className="left-panel">
          <div className="upload-section">
            <h3>📚 Add Learning Material</h3>
            {error && <div className="error-message">{error}</div>}
            
            <div className="upload-zone" onClick={() => !isUploading && document.getElementById('pdf-file-input')?.click()}>
              <input
                id="pdf-file-input"
                type="file"
                accept=".pdf"
                onChange={handleFileSelect}
                className="file-input-hidden"
                disabled={isUploading}
                style={{ display: 'none' }}
              />
              <div className="upload-text">
                {isUploading ? '⏳ Uploading...' : '📄 Select PDF to start learning'}
              </div>
            </div>
          </div>



          <div className="content-library">
            <div className="library-header">
              <h3>📖 Your Library ({filteredAndSortedContents.length})</h3>
              <div className="library-controls">
                <input
                  type="text"
                  placeholder="Search files..."
                  value={librarySearchTerm}
                  onChange={(e) => setLibrarySearchTerm(e.target.value)}
                  className="library-search"
                />
                <select
                  value={libraryFilterType}
                  onChange={(e) => setLibraryFilterType(e.target.value)}
                  className="library-filter"
                >
                  <option value="all">All Types</option>
                  <option value="pdf">PDF</option>
                  <option value="youtube">YouTube</option>
                </select>
                <select
                  value={librarySortBy}
                  onChange={(e) => setLibrarySortBy(e.target.value as 'title' | 'created_at' | 'content_type')}
                  className="library-sort"
                >
                  <option value="created_at">Newest First</option>
                  <option value="title">Title A-Z</option>
                  <option value="content_type">Type</option>
                </select>
              </div>
            </div>
            <div className="content-list">
              {filteredAndSortedContents.length === 0 ? (
                <div className="empty-library">
                  <div className="empty-icon">📚</div>
                  <p>No files match your search</p>
                </div>
              ) : (
                filteredAndSortedContents.map(content => (
                  <div key={content.id} className="content-item">
                    <div 
                      className="content-main" 
                      onClick={() => openLibraryFile(content)}
                      style={{ cursor: 'pointer' }}
                    >
                      <div className="content-title">{content.title}</div>
                      <div className="content-meta">
                        <span className="content-type">{content.content_type}</span>
                        <span className="content-status">{content.processing_status}</span>
                        <span className="content-date">
                          {new Date(content.created_at).toLocaleDateString()}
                        </span>
                      </div>
                    </div>
                    <button
                      onClick={(e) => {
                        e.stopPropagation()
                        deleteLibraryFile(content.id)
                      }}
                      className="delete-content-btn"
                      title="Delete file"
                    >
                      🗑️
                    </button>
                  </div>
                ))
              )}
            </div>
          </div>

          <div className="knowledge-graph">
            <div className="graph-header">
              <h3>🌐 Knowledge Graph</h3>
              <div className="search-bar">
                <input
                  type="text"
                  placeholder="Search concepts..."
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  className="search-input"
                />
              </div>
            </div>
            
            <div className="graph-canvas">
              {concepts.length === 0 ? (
                <div className="empty-graph">
                  <div className="empty-icon">🌱</div>
                  <p>Your knowledge graph will grow as you learn</p>
                </div>
              ) : (
                <svg width="100%" height="400" className="knowledge-svg">
                  {concepts.map((concept) => (
                    <g key={concept.id}>
                      <circle
                        cx={concept.x}
                        cy={concept.y}
                        r={concept.size}
                        fill={getDomainColor(concept.category || 'general')}
                        fillOpacity="0.8"
                        stroke="#ffffff"
                        strokeWidth="2"
                        className={`concept-node ${selectedConcept === concept.id ? 'selected' : ''}`}
                        onClick={() => setSelectedConcept(concept.id)}
                      />
                      <text
                        x={concept.x}
                        y={concept.y}
                        textAnchor="middle"
                        dy="0.3em"
                        fontSize="12"
                        fill="white"
                        className="concept-label"
                      >
                        {concept.name.length > 15 ? concept.name.substring(0, 15) + '...' : concept.name}
                      </text>
                    </g>
                  ))}
                </svg>
              )}
            </div>
          </div>
        </div>

        <div className="main-content">
          {!pdfUrl ? (
            <div className="welcome-screen">
              <div className="welcome-content">
                <h1>🎯 Start Your Learning Journey</h1>
                <p>Upload a PDF to begin building your personal knowledge graph</p>
                <div className="feature-highlights">
                  <div className="feature">
                    <span className="feature-icon">📄</span>
                    <span>Upload & View PDFs</span>
                  </div>
                  <div className="feature">
                    <span className="feature-icon">💭</span>
                    <span>Capture Insights</span>
                  </div>
                  <div className="feature">
                    <span className="feature-icon">🌐</span>
                    <span>Build Knowledge Graph</span>
                  </div>
                </div>
              </div>
            </div>
          ) : (
            <div className={`pdf-study-area ${isPdfFullscreen ? 'pdf-fullscreen' : ''} ${isNotesFullscreen ? 'notes-fullscreen' : ''}`}>
              <div className="pdf-main-content" style={{ 
                width: isPdfFullscreen ? '100%' : isNotesFullscreen ? '0%' : isSidebarVisible ? `calc(100% - ${sidebarWidth}px)` : '100%' 
              }}>
                <div className="pdf-viewer-container">
                  <div className="pdf-toolbar-extra">
                    <button onClick={toggleSidebar} className="toggle-sidebar-btn" title={`${isSidebarVisible ? 'Hide' : 'Show'} sidebar (Ctrl+H)`}>
                      {isSidebarVisible ? '👁️‍🗨️' : '👁️'}
                    </button>
                    <button onClick={togglePdfFullscreen} className="fullscreen-btn" title={`${isPdfFullscreen ? 'Exit' : 'Enter'} PDF fullscreen (F11)`}>
                      {isPdfFullscreen ? '🗗' : '🗖'}
                    </button>
                    <div className="keyboard-shortcuts-hint">
                      <span>⌨️ F11: PDF Fullscreen | Ctrl+H: Toggle Sidebar | Ctrl+Shift+N: Notes Fullscreen | Esc: Exit</span>
                    </div>
                  </div>
                  <PDFViewer 
                    url={pdfUrl} 
                    onClose={handleClose}
                  />
                </div>
              </div>

              {/* Resizable splitter */}
              {isSidebarVisible && !isPdfFullscreen && !isNotesFullscreen && (
                <div 
                  className="resize-handle"
                  onMouseDown={handleMouseDown}
                />
              )}

              {/* Notes panel */}
              {isSidebarVisible && !isPdfFullscreen && (
                <div 
                  className={`notes-panel ${isNotesFullscreen ? 'notes-fullscreen-panel' : ''}`}
                  style={{ 
                    width: isNotesFullscreen ? '100%' : `${sidebarWidth}px`,
                    minWidth: isNotesFullscreen ? '100%' : '250px'
                  }}
                >
                  <div className="notes-header">
                    <h3>💭 Insights & Notes</h3>
                    <div className="notes-header-controls">
                      <span className="notes-count">{notes.length} notes</span>
                      <button onClick={toggleNotesFullscreen} className="fullscreen-btn" title={`${isNotesFullscreen ? 'Exit' : 'Enter'} notes fullscreen (Ctrl+Shift+N)`}>
                        {isNotesFullscreen ? '🗗' : '🗖'}
                      </button>
                    </div>
                  </div>
                
                <div className="note-composer">
                  <textarea
                    placeholder={`Add insight for page ${currentPage}...`}
                    value={currentNote}
                    onChange={(e) => setCurrentNote(e.target.value)}
                    className="note-textarea"
                  />
                  <div className="note-composer-footer">
                    <input
                      type="number"
                      value={currentPage}
                      onChange={(e) => setCurrentPage(parseInt(e.target.value) || 1)}
                      min="1"
                      placeholder="Page"
                      className="page-input"
                    />
                    <button
                      onClick={addNote}
                      disabled={!currentNote.trim()}
                      className="add-note-btn"
                    >
                      ✨ Add to Knowledge Graph
                    </button>
                  </div>
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
              )}
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
      <ZettleLearningInterface />
    </div>
  )
}