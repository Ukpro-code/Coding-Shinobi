import { useState, useEffect } from 'react'
import { ThinkingSpace } from './components/ThinkingSpace'
import { Sidebar } from './components/Sidebar'
import { TopBar } from './components/TopBar'
import { ThemeProvider } from './components/ThemeProvider'
import { ToastContainer, useToast } from './components/Toast'
import { motion } from 'framer-motion'
import { Menu } from 'lucide-react'

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
  const [selectedNode, setSelectedNode] = useState<Node | null>(null)
  const [nodes, setNodes] = useState<Node[]>([])
  const [isAmbientMode, setIsAmbientMode] = useState(true)
  const [searchQuery, setSearchQuery] = useState('')
  const [sidebarCollapsed, setSidebarCollapsed] = useState(false)
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

  return (
    <ThemeProvider>
      <div className="zettlemind-container h-screen overflow-hidden transition-colors duration-300">
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
      
      {/* Toast Notifications */}
      <ToastContainer toasts={toasts} onCloseToast={removeToast} />
      </div>
    </ThemeProvider>
  )
}