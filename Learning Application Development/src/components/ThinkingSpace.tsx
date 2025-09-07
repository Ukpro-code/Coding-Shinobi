import { useState, useEffect, useRef, useCallback } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import { IdeaBubble } from './IdeaBubble'
import { ConnectionThread } from './ConnectionThread'
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
  // Use prop nodes if provided, otherwise maintain local state
  const [localNodes, setLocalNodes] = useState<Node[]>([])
  
  const nodes = propNodes || localNodes
  const updateNodes = (updater: Node[] | ((prev: Node[]) => Node[])) => {
    if (setPropNodes) {
      if (typeof updater === 'function') {
        setPropNodes(updater(propNodes || []))
      } else {
        setPropNodes(updater)
      }
    } else {
      if (typeof updater === 'function') {
        setLocalNodes(updater)
      } else {
        setLocalNodes(updater)
      }
    }
  }
  const [connections, setConnections] = useState<Connection[]>([])
  const [hasLoaded, setHasLoaded] = useState(false)
  const saveTimeoutRef = useRef<NodeJS.Timeout | null>(null)
  
  // Load data from localStorage on mount - only once
  useEffect(() => {
    if (!hasLoaded) {
      const savedData = localStorageAPI.loadData()
      console.log('Loading data on mount:', savedData)
      
      // Only load if there's actual data, don't load empty arrays
      if (savedData.nodes.length > 0) {
        console.log('Loading nodes from localStorage:', savedData.nodes.length)
        updateNodes(savedData.nodes)
      }
      if (savedData.connections.length > 0) {
        console.log('Loading connections from localStorage:', savedData.connections.length)
        setConnections(savedData.connections)
      }
      setHasLoaded(true)
    }
  }, [hasLoaded]) // Only run when hasLoaded changes
  
  // Save data to localStorage when nodes or connections change (debounced)
  useEffect(() => {
    // Don't save immediately on mount or if data is empty
    if (nodes.length === 0 && connections.length === 0) {
      return
    }
    
    if (saveTimeoutRef.current) {
      clearTimeout(saveTimeoutRef.current)
    }
    
    saveTimeoutRef.current = setTimeout(() => {
      console.log('Saving to localStorage:', { nodes: nodes.length, connections: connections.length })
      localStorageAPI.saveData(nodes, connections)
    }, 1000) // Debounce saves by 1 second
    
    return () => {
      if (saveTimeoutRef.current) {
        clearTimeout(saveTimeoutRef.current)
      }
    }
  }, [nodes, connections])
  const [isDragging, setIsDragging] = useState(false)
  const [draggedNodeId, setDraggedNodeId] = useState<string | null>(null)
  const [dragOffset, setDragOffset] = useState({ x: 0, y: 0 })
  const [containerDimensions, setContainerDimensions] = useState({ width: 0, height: 0 })
  const [newlyAddedNodes, setNewlyAddedNodes] = useState<Set<string>>(new Set())

  // Define addExtractedConcepts first so it can be used in other useEffects
  const addExtractedConcepts = useCallback((concepts: ExtractedConcept[]) => {
    console.log('addExtractedConcepts called with:', concepts)
    
    // Validate inputs first
    if (!concepts || !Array.isArray(concepts) || concepts.length === 0) {
      console.warn('addExtractedConcepts called with invalid concepts:', concepts)
      return
    }

    if (containerDimensions.width === 0 || containerDimensions.height === 0) {
      // If dimensions aren't ready, try again in a moment (but only once)
      setTimeout(() => {
        if (containerDimensions.width > 0 && containerDimensions.height > 0) {
          addExtractedConcepts(concepts)
        } else {
          console.warn('Container dimensions still not ready, skipping concept addition')
        }
      }, 100)
      return
    }

    const centerX = containerDimensions.width / 2
    const centerY = containerDimensions.height / 2
    const radius = Math.min(containerDimensions.width, containerDimensions.height) * 0.15

    const newNodes: Node[] = concepts.map((concept, index) => {
      const angle = (index / concepts.length) * 2 * Math.PI
      const x = centerX + Math.cos(angle) * radius * (1 + Math.random() * 0.5)
      const y = centerY + Math.sin(angle) * radius * (1 + Math.random() * 0.5)
      
      // Map concept categories to colors
      const categoryColors = {
        'Database Design': 'bg-blue-500',
        'API Development': 'bg-purple-500',
        'Frontend Development': 'bg-green-500',
        'Database Performance': 'bg-yellow-500',
        'Security': 'bg-red-500',
        'default': 'bg-indigo-500'
      }
      
      return {
        id: concept.id,
        title: concept.title,
        x: Math.max(50, Math.min(x, containerDimensions.width - 100)),
        y: Math.max(50, Math.min(y, containerDimensions.height - 100)),
        size: Math.max(60, Math.min(90, 60 + concept.relevance * 30)), // Size based on relevance
        color: categoryColors[concept.category as keyof typeof categoryColors] || categoryColors.default,
        interactionCount: 0,
        lastInteraction: new Date(),
        connections: []
      }
    })

    updateNodes(prev => [...prev, ...newNodes])
    
    // Mark nodes as newly added for animation
    const newNodeIds = new Set(newNodes.map(node => node.id))
    setNewlyAddedNodes(newNodeIds)
    
    // Remove the "newly added" status after animation
    setTimeout(() => {
      setNewlyAddedNodes(new Set())
    }, 2000)
    
    // Create some connections between new concepts and existing ones based on relevance
    const newConnections: Connection[] = []
    if (nodes && Array.isArray(nodes) && nodes.length > 0) {
      newNodes.forEach(newNode => {
        nodes.forEach(existingNode => {
          // Simple heuristic: connect if titles have common words
          const newWords = newNode.title.toLowerCase().split(' ')
          const existingWords = existingNode.title.toLowerCase().split(' ')
          const commonWords = newWords.filter(word => existingWords.includes(word) && word.length > 3)
          
          if (commonWords.length > 0) {
            newConnections.push({
              id: `conn-${newNode.id}-${existingNode.id}`,
              from: newNode.id,
              to: existingNode.id,
              strength: 0.3 + (commonWords.length * 0.2),
              lastReinforced: new Date()
            })
          }
        })
      })
    }

    setConnections(prev => [...prev, ...newConnections])
  }, [containerDimensions, nodes])

  // Create a stable version of the function to avoid infinite re-renders
  const stableAddExtractedConcepts = useCallback((concepts: ExtractedConcept[]) => {
    console.log('stableAddExtractedConcepts called with:', concepts)
    
    // Guard against invalid inputs at this level too
    if (!concepts || !Array.isArray(concepts) || concepts.length === 0) {
      console.warn('stableAddExtractedConcepts: Invalid concepts provided, ignoring call')
      return
    }
    
    if (containerDimensions.width > 0 && containerDimensions.height > 0) {
      addExtractedConcepts(concepts)
    } else {
      console.warn('Cannot add concepts: container dimensions not ready', containerDimensions)
    }
  }, [addExtractedConcepts, containerDimensions.width, containerDimensions.height])

  // Expose the addExtractedConcepts function to parent
  useEffect(() => {
    if (onAddExtractedConcepts && containerDimensions.width > 0 && containerDimensions.height > 0) {
      console.log('ThinkingSpace: Exposing addExtractedConcepts function to parent')
      onAddExtractedConcepts(stableAddExtractedConcepts)
    }
  }, [onAddExtractedConcepts, stableAddExtractedConcepts, containerDimensions.width, containerDimensions.height])

  // Track container dimensions for proper layout
  useEffect(() => {
    const updateDimensions = () => {
      if (containerRef.current) {
        const rect = containerRef.current.getBoundingClientRect()
        const newDimensions = { width: rect.width, height: rect.height }
        
        // Only update if dimensions actually changed to prevent unnecessary re-renders
        setContainerDimensions(prev => {
          if (prev.width !== newDimensions.width || prev.height !== newDimensions.height) {
            console.log('Container dimensions updated:', newDimensions)
            return newDimensions
          }
          return prev
        })
      }
    }

    // Small delay to ensure DOM is ready
    const timeoutId = setTimeout(updateDimensions, 100)
    window.addEventListener('resize', updateDimensions)
    
    return () => {
      clearTimeout(timeoutId)
      window.removeEventListener('resize', updateDimensions)
    }
  }, [])

  const handleNodeClick = useCallback((node: Node) => {
    if (!isDragging) {
      setSelectedNode(node)
      
      // Increase interaction count
      updateNodes(prev => prev.map(n =>
        n.id === node.id 
          ? { ...n, interactionCount: n.interactionCount + 1, lastInteraction: new Date() }
          : n
      ))

      // Strengthen connections to this node
      setConnections(prev => prev.map(conn => 
        (conn.from === node.id || conn.to === node.id)
          ? { 
              ...conn, 
              strength: Math.min(1, conn.strength + 0.1), 
              lastReinforced: new Date() 
            }
          : conn
      ))
    }
  }, [setSelectedNode, isDragging])

  const handleDragStart = useCallback((nodeId: string, event: React.MouseEvent) => {
    event.preventDefault()
    setIsDragging(true)
    setDraggedNodeId(nodeId)
    
    const node = nodes.find(n => n.id === nodeId)
    if (node && containerRef.current) {
      const rect = containerRef.current.getBoundingClientRect()
      setDragOffset({
        x: event.clientX - rect.left - node.x,
        y: event.clientY - rect.top - node.y
      })
    }
  }, [nodes])

  const handleDragMove = useCallback((event: MouseEvent) => {
    if (isDragging && draggedNodeId && containerRef.current) {
      const rect = containerRef.current.getBoundingClientRect()
      const newX = event.clientX - rect.left - dragOffset.x
      const newY = event.clientY - rect.top - dragOffset.y
      
      // Constrain to container bounds with padding
      const containerWidth = rect.width
      const containerHeight = rect.height
      const nodeSize = nodes.find(n => n.id === draggedNodeId)?.size || 80
      const padding = 20 // Add some padding from edges
      
      const constrainedX = Math.max(padding, Math.min(newX, containerWidth - nodeSize - padding))
      const constrainedY = Math.max(padding, Math.min(newY, containerHeight - nodeSize - padding))
      
      updateNodes(prev => prev.map(node => 
        node.id === draggedNodeId 
          ? { ...node, x: constrainedX, y: constrainedY }
          : node
      ))
    }
  }, [isDragging, draggedNodeId, dragOffset, nodes])

  const handleDragEnd = useCallback(() => {
    setTimeout(() => {
      setIsDragging(false)
      setDraggedNodeId(null)
    }, 100) // Small delay to prevent click after drag
  }, [])

  // Mouse event listeners for dragging
  useEffect(() => {
    if (isDragging) {
      document.addEventListener('mousemove', handleDragMove)
      document.addEventListener('mouseup', handleDragEnd)
      
      return () => {
        document.removeEventListener('mousemove', handleDragMove)
        document.removeEventListener('mouseup', handleDragEnd)
      }
    }
  }, [isDragging, handleDragMove, handleDragEnd])

  const filteredNodes = nodes.filter(node => 
    searchQuery === '' || 
    node.title.toLowerCase().includes(searchQuery.toLowerCase())
  )

  return (
    <div 
      ref={containerRef}
      className={`w-full h-full relative overflow-hidden thinking-space-grid ${isDragging ? 'cursor-grabbing select-none' : 'cursor-default'}`}
      style={{ userSelect: isDragging ? 'none' : 'auto' }}
    >
      {/* Connection Threads */}
      <svg className="absolute inset-0 w-full h-full pointer-events-none">
        {connections.map(connection => {
          const fromNode = nodes.find(n => n.id === connection.from)
          const toNode = nodes.find(n => n.id === connection.to)
          
          if (!fromNode || !toNode) return null

          const isRelatedToSelected = selectedNode && (connection.from === selectedNode.id || connection.to === selectedNode.id)
          const shouldDimConnection = selectedNode !== null && !isRelatedToSelected

          return (
            <ConnectionThread
              key={connection.id}
              from={{ x: fromNode.x + fromNode.size/2, y: fromNode.y + fromNode.size/2 }}
              to={{ x: toNode.x + toNode.size/2, y: toNode.y + toNode.size/2 }}
              strength={connection.strength}
              isDimmed={shouldDimConnection}
            />
          )
        })}
      </svg>

      {/* Idea Bubbles */}
      <AnimatePresence>
        {filteredNodes.map(node => (
          <motion.div
            key={node.id}
            initial={newlyAddedNodes.has(node.id) ? { scale: 0, opacity: 0 } : false}
            animate={{ scale: 1, opacity: 1 }}
            transition={{ 
              type: "spring", 
              stiffness: 200, 
              damping: 20,
              duration: 0.6 
            }}
          >
            <IdeaBubble
              node={node}
              isSelected={selectedNode?.id === node.id}
              isHighlighted={searchQuery !== '' && node.title.toLowerCase().includes(searchQuery.toLowerCase())}
              isDimmed={selectedNode !== null && selectedNode.id !== node.id}
              isDragging={draggedNodeId === node.id}
              onClick={() => handleNodeClick(node)}
              onDragStart={(event) => handleDragStart(node.id, event)}
            />
          </motion.div>
        ))}
      </AnimatePresence>

      {/* Floating particles for ambient effect */}
      {isAmbientMode && (
        <div className="absolute inset-0 pointer-events-none">
          {Array.from({ length: 20 }, (_, i) => (
            <motion.div
              key={i}
              className="absolute w-1 h-1 bg-white/30 dark:bg-white/30 light:bg-slate-400/50 rounded-full"
              animate={{
                x: [0, Math.random() * 100 - 50],
                y: [0, Math.random() * 100 - 50],
                opacity: [0, 0.5, 0]
              }}
              transition={{
                duration: Math.random() * 10 + 10,
                repeat: Infinity,
                delay: Math.random() * 5
              }}
              style={{
                left: `${Math.random() * 100}%`,
                top: `${Math.random() * 100}%`
              }}
            />
          ))}
        </div>
      )}
    </div>
  )
}