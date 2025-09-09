import { useState, useEffect } from 'react'

export default function App() {
  return (
    <div style={{ padding: '20px', background: 'white', minHeight: '100vh' }}>
      <h1 style={{ color: 'black', fontSize: '32px' }}>🚀 App Is Working!</h1>
      <p style={{ color: 'green', fontSize: '18px' }}>If you can see this, React is loaded successfully.</p>
      
      <div style={{ 
        background: 'lightblue', 
        padding: '20px', 
        margin: '20px 0',
        border: '2px solid blue'
      }}>
        <h2>Simple Test</h2>
        <button 
          onClick={() => alert('Button works!')}
          style={{
            background: 'blue',
            color: 'white',
            padding: '10px 20px',
            border: 'none',
            cursor: 'pointer',
            fontSize: '16px'
          }}
        >
          Click Me to Test
        </button>
      </div>
    </div>
  )
}

interface DocumentFile {
  id: string
  name: string
  type: 'pdf' | 'docx' | 'txt'
  size: number
  uploadedAt: Date
  lastModified: Date
  folderId?: string
  tags: string[]
  content?: File
}

interface ExtractedConcept {
  id: string
  title: string
  description: string
  relevance: number
  category: string
  pageNumber?: number
}

interface Node {
  id: string
  title: string
  x: number
  y: number
  size: number
  color: string
  interactionCount: number
  lastInteraction: Date
  connections: string[]
}

export default function App() {
  console.log('🚀 App component rendering...')
  console.log('Window location:', window.location.href)
  
  const [selectedNode, setSelectedNode] = useState<Node | null>(null)
  const [nodes, setNodes] = useState<Node[]>([])
  const [isAmbientMode, setIsAmbientMode] = useState(true)
  const [searchQuery, setSearchQuery] = useState('')
  const [sidebarCollapsed, setSidebarCollapsed] = useState(false)
  const [showPDFReader, setShowPDFReader] = useState(false)
  const [showDocumentManager, setShowDocumentManager] = useState(false)
  const [currentDocument, setCurrentDocument] = useState<DocumentFile | null>(null)
  const [addConceptsFunction, setAddConceptsFunction] = useState<((concepts: ExtractedConcept[]) => void) | null>(null)
  const { toasts, addToast, removeToast } = useToast()

  // Keyboard shortcut for toggling sidebar
  useEffect(() => {
    const handleKeyDown = (event: KeyboardEvent) => {
      if ((event.ctrlKey || event.metaKey) && event.key === 'b') {
        event.preventDefault()
        setSidebarCollapsed(prev => !prev)
      }
    }

    window.addEventListener('keydown', handleKeyDown)
    return () => window.removeEventListener('keydown', handleKeyDown)
  }, [])

  const handleConceptsExtracted = (concepts: ExtractedConcept[]) => {
    // Validate concepts before proceeding
    if (!concepts || !Array.isArray(concepts) || concepts.length === 0) {
      console.warn('handleConceptsExtracted called with invalid concepts:', concepts)
      addToast({
        type: 'error',
        title: 'No Concepts Found',
        description: 'No valid concepts were extracted from the PDF. Please try again.',
        duration: 4000
      })
      return
    }

    if (addConceptsFunction) {
      addConceptsFunction(concepts)
      addToast({
        type: 'success',
        title: 'Concepts Added Successfully',
        description: `${concepts.length} new concepts from your PDF have been added to the thinking space.`,
        duration: 5000
      })
    } else {
      console.warn('addConceptsFunction is not available yet')
      addToast({
        type: 'error',
        title: 'System Not Ready',
        description: 'The thinking space is still loading. Please try again in a moment.',
        duration: 4000
      })
    }
  }

  const handleSetAddConceptsFunction = (fn: (concepts: ExtractedConcept[]) => void) => {
    console.log('App: Received function from ThinkingSpace, setting it as addConceptsFunction')
    setAddConceptsFunction(() => fn)
  }

  const handleOpenDocument = (doc: DocumentFile) => {
    setCurrentDocument(doc)
    setShowDocumentManager(false)
    setShowPDFReader(true)
  }

  const handleClosePDFReader = () => {
    setShowPDFReader(false)
    setCurrentDocument(null)
  }

  return (
    <ThemeProvider>
      <div className="zettlemind-container h-screen overflow-hidden transition-colors duration-300" style={{background: '#f0f0f0'}}>
        {/* Debug indicator */}
        <div style={{position: 'fixed', top: '10px', right: '10px', background: 'red', color: 'white', padding: '5px', zIndex: 9999}}>
          APP LOADED ✅
        </div>
        
        {/* State Debug Info */}
        <div style={{position: 'fixed', top: '50px', right: '10px', background: 'orange', color: 'black', padding: '5px', zIndex: 9999, fontSize: '12px'}}>
          PDF: {showPDFReader ? 'ON' : 'OFF'} | DOC: {showDocumentManager ? 'ON' : 'OFF'}
        </div>
        
        {/* Main content area with visible background */}
        <div style={{background: 'white', minHeight: '200px', padding: '20px', margin: '20px', border: '2px solid black'}}>
          <h1 style={{color: 'black', fontSize: '24px', marginBottom: '20px'}}>Learning Application Development</h1>
          
          {/* PDF Debug Tester */}
          <div style={{background: '#ffffcc', padding: '15px', marginBottom: '20px', border: '1px solid #ccc'}}>
            <PDFTester />
          </div>
          
          <div style={{background: '#e0e0e0', padding: '20px', marginBottom: '20px'}}>
            <h2 style={{color: 'black', fontSize: '18px', marginBottom: '10px'}}>Navigation</h2>
            <button 
              onClick={() => {
                console.log('🔵 PDF Reader button clicked!')
                console.log('Current showPDFReader state:', showPDFReader)
                setShowPDFReader(true)
                console.log('Setting showPDFReader to true')
              }}
              style={{background: 'blue', color: 'white', padding: '10px 20px', margin: '5px', border: 'none', cursor: 'pointer'}}
            >
              Open PDF Reader
            </button>
            <button 
              onClick={() => {
                console.log('🟢 Document Manager button clicked!')
                console.log('Current showDocumentManager state:', showDocumentManager)
                setShowDocumentManager(true)
                console.log('Setting showDocumentManager to true')
              }}
              style={{background: 'green', color: 'white', padding: '10px 20px', margin: '5px', border: 'none', cursor: 'pointer'}}
            >
              Open Document Manager
            </button>
          </div>
        </div>
        
        {/* Only show normal layout when neither modal is open */}
        {!showPDFReader && !showDocumentManager && (
          <>
            <TopBar 
              searchQuery={searchQuery}
              setSearchQuery={setSearchQuery}
              isAmbientMode={isAmbientMode}
              setIsAmbientMode={setIsAmbientMode}
              sidebarCollapsed={sidebarCollapsed}
              setSidebarCollapsed={setSidebarCollapsed}
              onConceptsExtracted={handleConceptsExtracted}
            />
            
            <div className="flex h-full">
              <motion.div
                initial={false}
                animate={{ 
                  width: sidebarCollapsed ? 0 : 320,
                  opacity: sidebarCollapsed ? 0 : 1
                }}
                transition={{ duration: 0.3, ease: "easeInOut" }}
                className="overflow-hidden"
              >
                <Sidebar 
                  selectedNode={selectedNode}
                  setSelectedNode={setSelectedNode}
                  onConceptsExtracted={handleConceptsExtracted}
                  nodes={nodes}
                  onOpenPDFReader={() => setShowPDFReader(true)}
                  onOpenDocumentManager={() => setShowDocumentManager(true)}
                />
              </motion.div>
              
              <main className="flex-1 relative zettlemind-thinking-space">
                <ThinkingSpace 
                  selectedNode={selectedNode}
                  setSelectedNode={setSelectedNode}
                  isAmbientMode={isAmbientMode}
                  searchQuery={searchQuery}
                  sidebarCollapsed={sidebarCollapsed}
                  onAddExtractedConcepts={handleSetAddConceptsFunction}
                  nodes={nodes}
                  setNodes={setNodes}
                />
                
                {isAmbientMode && (
                  <motion.div 
                    initial={{ opacity: 0 }}
                    animate={{ opacity: 1 }}
                    className="absolute bottom-6 left-1/2 transform -translate-x-1/2"
                  >
                    <div className="ambient-indicator px-6 py-3 text-sm">
                      <div className="flex items-center space-x-2">
                        <div className="w-2 h-2 bg-blue-400 rounded-full animate-pulse"></div>
                        <span>Ambient Learning Mode - Ideas strengthen through interaction</span>
                      </div>
                    </div>
                  </motion.div>
                )}
                
                {/* Floating sidebar toggle when collapsed */}
                {sidebarCollapsed && (
                  <motion.button
                    initial={{ opacity: 0, x: -20 }}
                    animate={{ opacity: 1, x: 0 }}
                    exit={{ opacity: 0, x: -20 }}
                    onClick={() => setSidebarCollapsed(false)}
                    className="absolute left-4 top-4 w-10 h-10 zettlemind-button-secondary flex items-center justify-center zettlemind-icon hover:text-white z-10"
                    title="Show sidebar (⌘B)"
                  >
                    <Menu className="w-4 h-4" />
                  </motion.button>
                )}
              </main>
            </div>
          </>
        )}

        {/* Modal Components - Render as overlays */}
        {showPDFReader && (
          <SimplePDFReader 
            onClose={handleClosePDFReader}
            document={currentDocument}
          />
        )}

        {showDocumentManager && (
          <DocumentManager 
            onClose={() => setShowDocumentManager(false)}
            onOpenDocument={handleOpenDocument}
          />
        )}
        
        {/* Toast Notifications */}
        <ToastContainer toasts={toasts} onCloseToast={removeToast} />
      </div>
    </ThemeProvider>
  )
}