import { useState, useEffect } from 'react'
import './test-app.css'

// Types for our learning system
interface Note {
  id: string
  title: string
  content: string
  pdfPage?: number
  timestamp: Date
  tags: string[]
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

// Enhanced PDF Viewer with Learning Features
function LearningPDFViewer({ onClose }: { onClose: () => void }) {
  const [pdfUrl, setPdfUrl] = useState<string>('')
  const [fileName, setFileName] = useState<string>('')
  const [error, setError] = useState<string>('')
  const [viewerType, setViewerType] = useState<'browser' | 'mozilla'>('browser')
  
  // Learning features state
  const [notes, setNotes] = useState<Note[]>([])
  const [currentNote, setCurrentNote] = useState<string>('')
  const [currentPage, setCurrentPage] = useState<number>(1)
  const [showNotes, setShowNotes] = useState<boolean>(true)
  const [studySession, setStudySession] = useState<StudySession | null>(null)
  const [searchTerm, setSearchTerm] = useState<string>('')

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
    // End study session
    if (studySession) {
      const endedSession = {
        ...studySession,
        endTime: new Date(),
        notes
      }
      // Here you could save to localStorage or a database
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
    }
  }

  const deleteNote = (noteId: string) => {
    setNotes(notes.filter(n => n.id !== noteId))
  }

  const filteredNotes = notes.filter(note => 
    note.content.toLowerCase().includes(searchTerm.toLowerCase()) ||
    note.title.toLowerCase().includes(searchTerm.toLowerCase())
  )

  return (
    <div style={{
      position: 'fixed',
      top: 0,
      left: 0,
      right: 0,
      bottom: 0,
      background: 'white',
      zIndex: 1000,
      display: 'flex',
      flexDirection: 'column'
    }}>
      {/* Header */}
      <div style={{
        background: '#2c3e50',
        color: 'white',
        padding: '15px',
        display: 'flex',
        justifyContent: 'space-between',
        alignItems: 'center',
        borderBottom: '2px solid #34495e'
      }}>
        <div>
          <h2 style={{ margin: 0 }}>📚 Learning PDF Viewer</h2>
          {fileName && (
            <p style={{ margin: '5px 0 0 0', fontSize: '14px', opacity: 0.9 }}>
              📄 {fileName}
            </p>
          )}
          {studySession && (
            <p style={{ margin: '5px 0 0 0', fontSize: '12px', opacity: 0.7 }}>
              ⏱️ Started: {studySession.startTime.toLocaleTimeString()} | 📝 Notes: {notes.length}
            </p>
          )}
        </div>
        <div style={{ display: 'flex', gap: '10px', alignItems: 'center' }}>
          {pdfUrl && (
            <>
              <button
                onClick={() => setShowNotes(!showNotes)}
                style={{
                  background: showNotes ? '#e74c3c' : '#27ae60',
                  color: 'white',
                  border: 'none',
                  padding: '6px 12px',
                  borderRadius: '4px',
                  cursor: 'pointer',
                  fontSize: '12px'
                }}
              >
                {showNotes ? '🙈 Hide Notes' : '📝 Show Notes'}
              </button>
              <button
                onClick={() => setViewerType('browser')}
                style={{
                  background: viewerType === 'browser' ? '#3498db' : '#7f8c8d',
                  color: 'white',
                  border: 'none',
                  padding: '6px 12px',
                  borderRadius: '4px',
                  cursor: 'pointer',
                  fontSize: '12px'
                }}
              >
                Browser
              </button>
              <button
                onClick={() => setViewerType('mozilla')}
                style={{
                  background: viewerType === 'mozilla' ? '#3498db' : '#7f8c8d',
                  color: 'white',
                  border: 'none',
                  padding: '6px 12px',
                  borderRadius: '4px',
                  cursor: 'pointer',
                  fontSize: '12px'
                }}
              >
                PDF.js
              </button>
            </>
          )}
          <button
            onClick={handleClose}
            style={{
              background: '#e74c3c',
              color: 'white',
              border: 'none',
              padding: '8px 16px',
              borderRadius: '4px',
              cursor: 'pointer',
              fontSize: '16px'
            }}
          >
            ✕ Close
          </button>
        </div>
      </div>

      {/* Main Content Area */}
      <div style={{ flex: 1, display: 'flex' }}>
        {/* PDF Viewer Area */}
        <div style={{ 
          flex: showNotes ? 2 : 1, 
          display: 'flex', 
          flexDirection: 'column',
          borderRight: showNotes ? '2px solid #ecf0f1' : 'none'
        }}>
          {!pdfUrl ? (
            // File upload area
            <div style={{
              flex: 1,
              display: 'flex',
              flexDirection: 'column',
              justifyContent: 'center',
              alignItems: 'center',
              padding: '40px',
              background: '#f8f9fa'
            }}>
              <div style={{ 
                textAlign: 'center',
                background: 'white',
                padding: '40px',
                borderRadius: '12px',
                boxShadow: '0 4px 6px rgba(0,0,0,0.1)',
                border: '2px dashed #3498db'
              }}>
                <div style={{ fontSize: '64px', marginBottom: '20px' }}>📚</div>
                <h3 style={{ color: '#2c3e50', marginBottom: '15px' }}>Start Your Learning Session</h3>
                <p style={{ color: '#7f8c8d', marginBottom: '25px' }}>
                  Upload a PDF to begin taking notes and studying
                </p>
                <input
                  type="file"
                  accept=".pdf,application/pdf"
                  onChange={handleFileSelect}
                  style={{
                    padding: '12px',
                    fontSize: '16px',
                    border: '2px solid #3498db',
                    borderRadius: '6px',
                    background: 'white',
                    cursor: 'pointer',
                    marginBottom: '15px'
                  }}
                />
                <button
                  onClick={() => {
                    const testPdfContent = `data:application/pdf;base64,JVBERi0xLjQKMSAwIG9iago8PAovVHlwZSAvQ2F0YWxvZwovUGFnZXMgMiAwIFIKPj4KZW5kb2JqCjIgMCBvYmoKPDwKL1R5cGUgL1BhZ2VzCi9LaWRzIFszIDAgUl0KL0NvdW50IDEKPD4KZW5kb2JqCjMgMCBvYmoKPDwKL1R5cGUgL1BhZ2UKL1BhcmVudCAyIDAgUgovTWVkaWFCb3ggWzAgMCA2MTIgNzkyXQovQ29udGVudHMgNCAwIFIKPj4KZW5kb2JqCjQgMCBvYmoKPDwKL0xlbmd0aCA1NAo+PgpzdHJlYW0KQlQKL0YxIDEyIFRmCjEwMCA3MDAgVGQKKExlYXJuaW5nIE1hbmFnZW1lbnQgU3lzdGVtIC0gVGVzdCBQREYpIFRqCkVUCmVuZHN0cmVhbQplbmRvYmoKeHJlZgowIDUKMDAwMDAwMDAwMCA2NTUzNSBmIAowMDAwMDAwMDA5IDAwMDAwIG4gCjAwMDAwMDAwNTggMDAwMDAgbiAKMDAwMDAwMDExNSAwMDAwMCBuIAowMDAwMDAwMjA3IDAwMDAwIG4gCnRyYWlsZXIKPDwKL1NpemUgNQovUm9vdCAxIDAgUgo+PgpzdGFydHhyZWYKMzExCiUlRU9G`
                    setPdfUrl(testPdfContent)
                    setFileName('Learning Management System - Demo.pdf')
                    setError('')
                  }}
                  style={{
                    display: 'block',
                    margin: '10px auto',
                    padding: '10px 20px',
                    background: '#27ae60',
                    color: 'white',
                    border: 'none',
                    borderRadius: '4px',
                    cursor: 'pointer',
                    fontSize: '14px'
                  }}
                >
                  🧪 Try Demo PDF
                </button>
                {error && (
                  <p style={{ color: '#e74c3c', marginTop: '10px', fontSize: '14px' }}>
                    {error}
                  </p>
                )}
              </div>
            </div>
          ) : (
            // PDF viewer
            <div style={{
              flex: 1,
              display: 'flex',
              flexDirection: 'column',
              background: '#ecf0f1'
            }}>
              <div style={{
                background: '#3498db',
                color: 'white',
                padding: '8px 15px',
                fontSize: '14px',
                display: 'flex',
                justifyContent: 'space-between',
                alignItems: 'center'
              }}>
                <span>📖 Reading Mode: {viewerType === 'mozilla' ? 'PDF.js' : 'Browser Native'}</span>
                <div style={{ display: 'flex', gap: '10px', alignItems: 'center' }}>
                  <label style={{ fontSize: '12px' }}>Page:</label>
                  <input
                    type="number"
                    min="1"
                    value={currentPage}
                    onChange={(e) => setCurrentPage(parseInt(e.target.value) || 1)}
                    style={{
                      width: '60px',
                      padding: '2px 6px',
                      border: 'none',
                      borderRadius: '3px',
                      fontSize: '12px'
                    }}
                  />
                </div>
              </div>
              
              <div style={{ flex: 1, position: 'relative' }}>
                {viewerType === 'mozilla' ? (
                  <iframe
                    src={getPdfJsUrl(pdfUrl)}
                    width="100%"
                    height="100%"
                    style={{ border: 'none' }}
                    title="PDF.js Viewer"
                    onError={() => setViewerType('browser')}
                  />
                ) : (
                  <object
                    data={pdfUrl}
                    type="application/pdf"
                    width="100%"
                    height="100%"
                    style={{ border: 'none' }}
                  >
                    <embed
                      src={pdfUrl}
                      type="application/pdf"
                      width="100%"
                      height="100%"
                      style={{ border: 'none' }}
                    />
                    <div style={{
                      padding: '40px',
                      textAlign: 'center',
                      background: '#f8f9fa',
                      height: '100%',
                      display: 'flex',
                      flexDirection: 'column',
                      justifyContent: 'center'
                    }}>
                      <p style={{ color: '#7f8c8d', marginBottom: '20px' }}>
                        PDF cannot be displayed. Try PDF.js mode or download.
                      </p>
                      <button
                        onClick={() => setViewerType('mozilla')}
                        style={{
                          background: '#3498db',
                          color: 'white',
                          border: 'none',
                          padding: '10px 20px',
                          borderRadius: '4px',
                          cursor: 'pointer',
                          marginBottom: '10px'
                        }}
                      >
                        🔄 Try PDF.js Mode
                      </button>
                    </div>
                  </object>
                )}
              </div>
            </div>
          )}
        </div>

        {/* Notes Panel */}
        {showNotes && (
          <div style={{
            flex: 1,
            background: '#f8f9fa',
            display: 'flex',
            flexDirection: 'column',
            minWidth: '350px'
          }}>
            {/* Notes Header */}
            <div style={{
              background: '#34495e',
              color: 'white',
              padding: '15px',
              borderBottom: '2px solid #2c3e50'
            }}>
              <h3 style={{ margin: '0 0 10px 0' }}>📝 Study Notes</h3>
              <input
                type="text"
                placeholder="🔍 Search notes..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                style={{
                  width: '100%',
                  padding: '8px',
                  border: 'none',
                  borderRadius: '4px',
                  fontSize: '14px'
                }}
              />
            </div>

            {/* Add Note Section */}
            <div style={{
              padding: '15px',
              background: 'white',
              borderBottom: '1px solid #ecf0f1'
            }}>
              <textarea
                placeholder={`💭 Add a note for page ${currentPage}...`}
                value={currentNote}
                onChange={(e) => setCurrentNote(e.target.value)}
                style={{
                  width: '100%',
                  minHeight: '80px',
                  padding: '10px',
                  border: '2px solid #ecf0f1',
                  borderRadius: '6px',
                  fontSize: '14px',
                  resize: 'vertical',
                  fontFamily: 'inherit'
                }}
              />
              <button
                onClick={addNote}
                disabled={!currentNote.trim()}
                style={{
                  marginTop: '10px',
                  width: '100%',
                  padding: '10px',
                  background: currentNote.trim() ? '#27ae60' : '#bdc3c7',
                  color: 'white',
                  border: 'none',
                  borderRadius: '4px',
                  cursor: currentNote.trim() ? 'pointer' : 'not-allowed',
                  fontSize: '14px',
                  fontWeight: 'bold'
                }}
              >
                ✅ Add Note to Page {currentPage}
              </button>
            </div>

            {/* Notes List */}
            <div style={{
              flex: 1,
              overflowY: 'auto',
              padding: '10px'
            }}>
              {filteredNotes.length === 0 ? (
                <div style={{
                  textAlign: 'center',
                  padding: '40px 20px',
                  color: '#7f8c8d'
                }}>
                  <div style={{ fontSize: '48px', marginBottom: '15px' }}>📝</div>
                  <p>No notes yet.</p>
                  <p style={{ fontSize: '14px' }}>Start adding notes as you study!</p>
                </div>
              ) : (
                filteredNotes.map((note) => (
                  <div
                    key={note.id}
                    style={{
                      background: 'white',
                      margin: '10px 0',
                      padding: '15px',
                      borderRadius: '8px',
                      boxShadow: '0 2px 4px rgba(0,0,0,0.1)',
                      border: '1px solid #ecf0f1'
                    }}
                  >
                    <div style={{
                      display: 'flex',
                      justifyContent: 'space-between',
                      alignItems: 'center',
                      marginBottom: '8px'
                    }}>
                      <span style={{
                        background: '#3498db',
                        color: 'white',
                        padding: '2px 8px',
                        borderRadius: '12px',
                        fontSize: '12px'
                      }}>
                        📄 Page {note.pdfPage}
                      </span>
                      <button
                        onClick={() => deleteNote(note.id)}
                        style={{
                          background: '#e74c3c',
                          color: 'white',
                          border: 'none',
                          borderRadius: '50%',
                          width: '24px',
                          height: '24px',
                          cursor: 'pointer',
                          fontSize: '12px'
                        }}
                      >
                        ✕
                      </button>
                    </div>
                    <p style={{
                      margin: '8px 0',
                      fontSize: '14px',
                      lineHeight: '1.4',
                      color: '#2c3e50'
                    }}>
                      {note.content}
                    </p>
                    <div style={{
                      fontSize: '12px',
                      color: '#7f8c8d',
                      marginTop: '8px'
                    }}>
                      🕒 {note.timestamp.toLocaleString()}
                    </div>
                  </div>
                ))
              )}
            </div>
          </div>
        )}
      </div>
    </div>
  )
}

// Main Learning Application
export default function LearningApp() {
  const [currentView, setCurrentView] = useState<'dashboard' | 'pdf-viewer'>('dashboard')

  return (
    <div style={{
      minHeight: '100vh',
      background: 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)',
      fontFamily: 'Arial, sans-serif'
    }}>
      {currentView === 'pdf-viewer' ? (
        <LearningPDFViewer onClose={() => setCurrentView('dashboard')} />
      ) : (
        // Dashboard
        <div style={{
          padding: '40px',
          maxWidth: '1200px',
          margin: '0 auto'
        }}>
          {/* Header */}
          <div style={{
            background: 'rgba(255,255,255,0.95)',
            padding: '30px',
            borderRadius: '15px',
            textAlign: 'center',
            marginBottom: '30px',
            boxShadow: '0 8px 32px rgba(0,0,0,0.1)'
          }}>
            <h1 style={{
              margin: '0 0 15px 0',
              color: '#2c3e50',
              fontSize: '2.5em'
            }}>
              📚 Learning Management System
            </h1>
            <p style={{
              margin: 0,
              color: '#7f8c8d',
              fontSize: '1.2em'
            }}>
              Your AI-powered study companion for PDF learning with smart note-taking
            </p>
          </div>

          {/* Quick Actions */}
          <div style={{
            display: 'grid',
            gridTemplateColumns: 'repeat(auto-fit, minmax(300px, 1fr))',
            gap: '20px',
            marginBottom: '30px'
          }}>
            <div style={{
              background: 'rgba(255,255,255,0.95)',
              padding: '25px',
              borderRadius: '12px',
              textAlign: 'center',
              boxShadow: '0 4px 16px rgba(0,0,0,0.1)',
              cursor: 'pointer',
              transition: 'transform 0.2s'
            }}
            onClick={() => setCurrentView('pdf-viewer')}
            onMouseEnter={(e) => e.currentTarget.style.transform = 'translateY(-5px)'}
            onMouseLeave={(e) => e.currentTarget.style.transform = 'translateY(0)'}
            >
              <div style={{ fontSize: '48px', marginBottom: '15px' }}>📄</div>
              <h3 style={{ margin: '0 0 10px 0', color: '#2c3e50' }}>Start Learning Session</h3>
              <p style={{ margin: 0, color: '#7f8c8d' }}>
                Open a PDF and begin taking notes with our advanced viewer
              </p>
            </div>

            <div style={{
              background: 'rgba(255,255,255,0.95)',
              padding: '25px',
              borderRadius: '12px',
              textAlign: 'center',
              boxShadow: '0 4px 16px rgba(0,0,0,0.1)'
            }}>
              <div style={{ fontSize: '48px', marginBottom: '15px' }}>📊</div>
              <h3 style={{ margin: '0 0 10px 0', color: '#2c3e50' }}>Study Analytics</h3>
              <p style={{ margin: 0, color: '#7f8c8d' }}>
                Track your learning progress and session insights
              </p>
            </div>

            <div style={{
              background: 'rgba(255,255,255,0.95)',
              padding: '25px',
              borderRadius: '12px',
              textAlign: 'center',
              boxShadow: '0 4px 16px rgba(0,0,0,0.1)'
            }}>
              <div style={{ fontSize: '48px', marginBottom: '15px' }}>🔍</div>
              <h3 style={{ margin: '0 0 10px 0', color: '#2c3e50' }}>Search Notes</h3>
              <p style={{ margin: 0, color: '#7f8c8d' }}>
                Find and organize your study notes across all sessions
              </p>
            </div>
          </div>

          {/* Features Showcase */}
          <div style={{
            background: 'rgba(255,255,255,0.95)',
            padding: '30px',
            borderRadius: '12px',
            boxShadow: '0 4px 16px rgba(0,0,0,0.1)'
          }}>
            <h2 style={{ margin: '0 0 20px 0', color: '#2c3e50', textAlign: 'center' }}>
              🌟 Features
            </h2>
            <div style={{
              display: 'grid',
              gridTemplateColumns: 'repeat(auto-fit, minmax(250px, 1fr))',
              gap: '20px'
            }}>
              <div style={{ textAlign: 'center', padding: '15px' }}>
                <div style={{ fontSize: '32px', marginBottom: '10px' }}>🎯</div>
                <h4 style={{ margin: '0 0 8px 0', color: '#2c3e50' }}>Smart PDF Viewer</h4>
                <p style={{ margin: 0, color: '#7f8c8d', fontSize: '14px' }}>
                  Dual-mode PDF viewing with browser native and PDF.js support
                </p>
              </div>
              <div style={{ textAlign: 'center', padding: '15px' }}>
                <div style={{ fontSize: '32px', marginBottom: '10px' }}>✏️</div>
                <h4 style={{ margin: '0 0 8px 0', color: '#2c3e50' }}>Page-Linked Notes</h4>
                <p style={{ margin: 0, color: '#7f8c8d', fontSize: '14px' }}>
                  Take notes linked to specific PDF pages for better organization
                </p>
              </div>
              <div style={{ textAlign: 'center', padding: '15px' }}>
                <div style={{ fontSize: '32px', marginBottom: '10px' }}>🔍</div>
                <h4 style={{ margin: '0 0 8px 0', color: '#2c3e50' }}>Real-time Search</h4>
                <p style={{ margin: 0, color: '#7f8c8d', fontSize: '14px' }}>
                  Instantly search through all your notes and study content
                </p>
              </div>
              <div style={{ textAlign: 'center', padding: '15px' }}>
                <div style={{ fontSize: '32px', marginBottom: '10px' }}>💾</div>
                <h4 style={{ margin: '0 0 8px 0', color: '#2c3e50' }}>No Downloads</h4>
                <p style={{ margin: 0, color: '#7f8c8d', fontSize: '14px' }}>
                  All files stay in browser memory - zero storage concerns
                </p>
              </div>
              <div style={{ textAlign: 'center', padding: '15px' }}>
                <div style={{ fontSize: '32px', marginBottom: '10px' }}>⏱️</div>
                <h4 style={{ margin: '0 0 8px 0', color: '#2c3e50' }}>Session Tracking</h4>
                <p style={{ margin: 0, color: '#7f8c8d', fontSize: '14px' }}>
                  Monitor study time and track learning progress
                </p>
              </div>
              <div style={{ textAlign: 'center', padding: '15px' }}>
                <div style={{ fontSize: '32px', marginBottom: '10px' }}>🎨</div>
                <h4 style={{ margin: '0 0 8px 0', color: '#2c3e50' }}>Modern UI</h4>
                <p style={{ margin: 0, color: '#7f8c8d', fontSize: '14px' }}>
                  Beautiful, responsive interface designed for focused learning
                </p>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}
