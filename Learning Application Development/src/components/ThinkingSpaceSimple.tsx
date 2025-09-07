import { useState, useEffect, useRef, useCallback } from 'react'
import { IdeaBubble } from './IdeaBubble'
import { ConnectionThread } from './ConnectionThread'
import { AnimatePresence } from 'framer-motion'
import { localStorageAPI } from '../utils/localStorage'

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

interface Connection {
  id: string
  from: string
  to: string
  strength: number
  lastReinforced: Date
}

interface ExtractedConcept {
  id: string
  title: string
  description: string
  relevance: number
  category: string
  pageNumber?: number
}

interface ThinkingSpaceProps {
  selectedNode: Node | null
  setSelectedNode: (node: Node | null) => void
  isAmbientMode: boolean
  searchQuery: string
  sidebarCollapsed?: boolean
  onAddExtractedConcepts?: (addFunction: (concepts: ExtractedConcept[]) => void) => void
  nodes?: Node[]
  setNodes?: (nodes: Node[]) => void
}

export function ThinkingSpace({ 
  selectedNode, 
  setSelectedNode, 
  isAmbientMode, 
  searchQuery,
  sidebarCollapsed = false,
  onAddExtractedConcepts,
  nodes: propNodes,
  setNodes: setPropNodes
}: ThinkingSpaceProps) {
  const containerRef = useRef<HTMLDivElement>(null)
  const [localNodes, setLocalNodes] = useState<Node[]>([])
  const [connections, setConnections] = useState<Connection[]>([])
  const [containerDimensions, setContainerDimensions] = useState({ width: 0, height: 0 })

  // Use external nodes if provided, otherwise use local state
  const nodes = propNodes || localNodes
  const updateNodes = useCallback((newNodes: Node[]) => {
    if (setPropNodes) {
      setPropNodes(newNodes)
    } else {
      setLocalNodes(newNodes)
    }
  }, [setPropNodes])

  // Load data once on mount
  useEffect(() => {
    const savedData = localStorageAPI.loadData()
    if (savedData.nodes.length > 0) {
      updateNodes(savedData.nodes)
    }
    if (savedData.connections.length > 0) {
      setConnections(savedData.connections)
    }
  }, [updateNodes])

  // Set up container dimensions
  useEffect(() => {
    const updateDimensions = () => {
      if (containerRef.current) {
        const rect = containerRef.current.getBoundingClientRect()
        setContainerDimensions({ width: rect.width, height: rect.height })
      }
    }
    
    updateDimensions()
    window.addEventListener('resize', updateDimensions)
    return () => window.removeEventListener('resize', updateDimensions)
  }, [])

  // Simple save to localStorage (debounced)
  useEffect(() => {
    const timeoutId = setTimeout(() => {
      if (nodes.length > 0 || connections.length > 0) {
        localStorageAPI.saveData(nodes, connections)
      }
    }, 2000)
    
    return () => clearTimeout(timeoutId)
  }, [nodes, connections])

  const filteredNodes = nodes.filter(node => 
    searchQuery === '' || 
    node.title.toLowerCase().includes(searchQuery.toLowerCase())
  )

  return (
    <div 
      ref={containerRef}
      className="w-full h-full relative overflow-hidden bg-gray-900"
    >
      {/* Render nodes */}
      <AnimatePresence>
        {filteredNodes.map(node => (
          <IdeaBubble
            key={node.id}
            node={node}
            isSelected={selectedNode?.id === node.id}
            isHighlighted={false}
            isDimmed={false}
            isDragging={false}
            onClick={() => setSelectedNode(node)}
            onDragStart={() => {}}
          />
        ))}
      </AnimatePresence>

      {/* Empty state message */}
      {nodes.length === 0 && (
        <div className="absolute inset-0 flex items-center justify-center">
          <div className="text-center text-gray-400">
            <h3 className="text-xl font-semibold mb-2">Welcome to ZettleMind</h3>
            <p>Your thinking space is ready. Start by uploading a PDF or adding concepts.</p>
          </div>
        </div>
      )}
    </div>
  )
}
