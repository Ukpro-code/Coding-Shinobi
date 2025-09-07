import { useState } from 'react'
import { ChevronRight, ChevronDown, FileText, Video, BookOpen, Link, Clock, TrendingUp, Plus, Upload, Brain } from 'lucide-react'
import { Button } from './ui/button'
import { ScrollArea } from './ui/scroll-area'
import { Badge } from './ui/badge'
import { PDFProcessor } from './PDFProcessor'
import { motion, AnimatePresence } from 'framer-motion'

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

interface ExtractedConcept {
  id: string
  title: string
  description: string
  relevance: number
  category: string
  pageNumber?: number
}

interface SidebarProps {
  selectedNode: Node | null
  setSelectedNode: (node: Node | null) => void
  onConceptsExtracted?: (concepts: ExtractedConcept[]) => void
  nodes?: Node[]
}

export function Sidebar({ selectedNode, setSelectedNode, onConceptsExtracted, nodes = [] }: SidebarProps) {
  const [expandedSections, setExpandedSections] = useState<string[]>(['recent', 'sources'])
  const [showPDFProcessor, setShowPDFProcessor] = useState(false)
  const [showAddContent, setShowAddContent] = useState(false)

  const toggleSection = (section: string) => {
    setExpandedSections(prev => 
      prev.includes(section) 
        ? prev.filter(s => s !== section)
        : [...prev, section]
    )
  }

  // Dynamic recent sources based on actual usage (empty for fresh app)
  const recentSources: Array<{id: string, title: string, type: string, timestamp: string}> = [
    // This will be populated when users actually upload files
  ]

  const getTypeIcon = (type: string) => {
    switch (type) {
      case 'pdf': return <FileText className="w-4 h-4" />
      case 'youtube': return <Video className="w-4 h-4" />
      case 'book': return <BookOpen className="w-4 h-4" />
      case 'article': return <Link className="w-4 h-4" />
      default: return <FileText className="w-4 h-4" />
    }
  }

  const handleConceptsExtracted = (concepts: ExtractedConcept[]) => {
    setShowPDFProcessor(false)
    if (onConceptsExtracted) {
      onConceptsExtracted(concepts)
    }
  }

  return (
    <div className="w-80 zettlemind-sidebar flex flex-col">
      <ScrollArea className="flex-1 p-4">
        {/* Add Content Section */}
        <div className="mb-6">
          <Button
            variant="ghost"
            onClick={() => setShowAddContent(!showAddContent)}
            className="w-full justify-start p-0 h-auto zettlemind-button-secondary"
          >
            {showAddContent ? (
              <ChevronDown className="w-4 h-4 mr-2" />
            ) : (
              <ChevronRight className="w-4 h-4 mr-2" />
            )}
            <span className="font-medium">Add Content</span>
          </Button>

          <AnimatePresence>
            {showAddContent && (
              <motion.div
                initial={{ height: 0, opacity: 0 }}
                animate={{ height: 'auto', opacity: 1 }}
                exit={{ height: 0, opacity: 0 }}
                transition={{ duration: 0.2 }}
                className="overflow-hidden"
              >
                <div className="mt-3 space-y-2">
                  <Button
                    variant="ghost"
                    onClick={() => {
                      console.log('Upload PDF clicked, setting showPDFProcessor to true')
                      setShowPDFProcessor(true)
                    }}
                    className="w-full justify-start text-white/70 dark:text-white/70 light:text-slate-600 hover:text-white dark:hover:text-white light:hover:text-slate-800 hover:bg-white/5 dark:hover:bg-white/5 light:hover:bg-slate-100"
                    size="sm"
                  >
                    <FileText className="w-4 h-4 mr-2" />
                    Upload PDF
                  </Button>
                  <Button
                    variant="ghost"
                    className="w-full justify-start text-white/70 dark:text-white/70 light:text-slate-600 hover:text-white dark:hover:text-white light:hover:text-slate-800 hover:bg-white/5 dark:hover:bg-white/5 light:hover:bg-slate-100"
                    size="sm"
                    disabled
                  >
                    <Video className="w-4 h-4 mr-2" />
                    YouTube Link (Soon)
                  </Button>
                  <Button
                    variant="ghost"
                    className="w-full justify-start text-white/70 dark:text-white/70 light:text-slate-600 hover:text-white dark:hover:text-white light:hover:text-slate-800 hover:bg-white/5 dark:hover:bg-white/5 light:hover:bg-slate-100"
                    size="sm"
                    disabled
                  >
                    <BookOpen className="w-4 h-4 mr-2" />
                    eBook Upload (Soon)
                  </Button>
                  <Button
                    variant="ghost"
                    className="w-full justify-start text-white/70 dark:text-white/70 light:text-slate-600 hover:text-white dark:hover:text-white light:hover:text-slate-800 hover:bg-white/5 dark:hover:bg-white/5 light:hover:bg-slate-100"
                    size="sm"
                    disabled
                  >
                    <Link className="w-4 h-4 mr-2" />
                    Web Article (Soon)
                  </Button>
                </div>
              </motion.div>
            )}
          </AnimatePresence>
        </div>

        {/* PDF Processor Modal */}
        <AnimatePresence>
          {showPDFProcessor && (
            <motion.div
              initial={{ opacity: 0, y: -10 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -10 }}
              transition={{ duration: 0.2 }}
              className="mb-6 p-4 rounded-lg bg-white/5 dark:bg-white/5 light:bg-white/90 border border-white/20 dark:border-white/20 light:border-slate-200"
            >
              <PDFProcessor
                onConceptsExtracted={handleConceptsExtracted}
                onClose={() => setShowPDFProcessor(false)}
              />
            </motion.div>
          )}
        </AnimatePresence>
        {/* Selected Node Details */}
        {selectedNode && (
          <div className="mb-6 p-4 rounded-lg bg-white/10 dark:bg-white/10 light:bg-white/90 border border-white/20 dark:border-white/20 light:border-slate-200">
            <div className="flex items-center justify-between mb-3">
              <h3 className="text-white dark:text-white light:text-slate-800 font-medium">{selectedNode.title}</h3>
              <Button 
                variant="ghost" 
                size="sm"
                onClick={() => setSelectedNode(null)}
                className="text-white/70 dark:text-white/70 light:text-slate-600 hover:text-white dark:hover:text-white light:hover:text-slate-800 h-6 w-6 p-0"
              >
                ×
              </Button>
            </div>
            
            <div className="space-y-2 text-sm text-white/70 dark:text-white/70 light:text-slate-600">
              <div className="flex items-center space-x-2">
                <TrendingUp className="w-4 h-4" />
                <span>{selectedNode.interactionCount} interactions</span>
              </div>
              
              <div className="flex items-center space-x-2">
                <Clock className="w-4 h-4" />
                <span>Last viewed: {selectedNode.lastInteraction.toLocaleDateString()}</span>
              </div>
              
              <div>
                <span className="block mb-1">Connections: {selectedNode.connections.length}</span>
                <div className="flex flex-wrap gap-1">
                  {selectedNode.connections.slice(0, 3).map(connId => (
                    <Badge key={connId} variant="secondary" className="text-xs bg-white/10 dark:bg-white/10 light:bg-slate-100 text-white dark:text-white light:text-slate-700">
                      Node {connId}
                    </Badge>
                  ))}
                  {selectedNode.connections.length > 3 && (
                    <Badge variant="secondary" className="text-xs bg-white/10 dark:bg-white/10 light:bg-slate-100 text-white dark:text-white light:text-slate-700">
                      +{selectedNode.connections.length - 3} more
                    </Badge>
                  )}
                </div>
              </div>
            </div>
          </div>
        )}

        {/* Recent Activity */}
        <div className="mb-6">
          <Button
            variant="ghost"
            onClick={() => toggleSection('recent')}
            className="w-full justify-start p-0 h-auto zettlemind-text hover:text-blue-400"
          >
            {expandedSections.includes('recent') ? (
              <ChevronDown className="w-4 h-4 mr-2" />
            ) : (
              <ChevronRight className="w-4 h-4 mr-2" />
            )}
            <span className="font-medium">Recent Activity</span>
          </Button>

          {expandedSections.includes('recent') && (
            <div className="mt-3 space-y-2">
              {nodes.length === 0 ? (
                <div className="recent-activity-item text-center">
                  <div className="text-gray-400 text-sm">No activity yet</div>
                  <div className="text-gray-500 text-xs mt-1">Start by adding some content</div>
                </div>
              ) : (
                // Show actual recent activity based on nodes
                nodes.slice(0, 3).map((node) => (
                  <div key={node.id} className="recent-activity-item">
                    <div className="recent-activity-title">{node.title}</div>
                    <div className="text-sm text-gray-400">concept added</div>
                    <div className="recent-activity-meta">recently</div>
                  </div>
                ))
              )}
            </div>
          )}
        </div>

        {/* Sources */}
        <div className="mb-6">
          <Button
            variant="ghost"
            onClick={() => toggleSection('sources')}
            className="w-full justify-start p-0 h-auto zettlemind-text hover:text-blue-400"
          >
            {expandedSections.includes('sources') ? (
              <ChevronDown className="w-4 h-4 mr-2" />
            ) : (
              <ChevronRight className="w-4 h-4 mr-2" />
            )}
            <span className="font-medium">Recent Sources</span>
          </Button>

          {expandedSections.includes('sources') && (
            <div className="mt-3 space-y-2">
              {recentSources.length === 0 ? (
                <div className="recent-activity-item text-center">
                  <div className="text-gray-400 text-sm">No sources uploaded yet</div>
                  <div className="text-gray-500 text-xs mt-1">Upload PDFs or add YouTube videos to get started</div>
                </div>
              ) : (
                recentSources.map(source => (
                  <div key={source.id} className="recent-activity-item cursor-pointer">
                    <div className="flex items-start space-x-3">
                      <div className="zettlemind-icon mt-1">
                        {getTypeIcon(source.type)}
                      </div>
                      <div className="flex-1 min-w-0">
                        <div className="text-sm font-medium text-white dark:text-white light:text-slate-800 truncate">
                          {source.title}
                        </div>
                        <div className="text-xs text-white/50 dark:text-white/50 light:text-slate-500">
                          {source.timestamp}
                        </div>
                      </div>
                    </div>
                  </div>
                ))
              )}
            </div>
          )}
        </div>

        {/* Learning Stats */}
        <div>
          <Button
            variant="ghost"
            onClick={() => toggleSection('stats')}
            className="w-full justify-start p-0 h-auto text-white dark:text-white light:text-slate-800 hover:bg-white/5 dark:hover:bg-white/5 light:hover:bg-slate-100"
          >
            {expandedSections.includes('stats') ? (
              <ChevronDown className="w-4 h-4 mr-2" />
            ) : (
              <ChevronRight className="w-4 h-4 mr-2" />
            )}
            <span className="font-medium">Learning Stats</span>
          </Button>

          {expandedSections.includes('stats') && (
            <div className="mt-3 space-y-3">
              <div className="p-3 rounded bg-white/5 dark:bg-white/5 light:bg-slate-50">
                <div className="text-white/90 dark:text-white/90 light:text-slate-800 font-medium">Total Concepts</div>
                <div className="text-2xl font-bold text-blue-400">{nodes.length}</div>
                <div className="text-xs text-white/50 dark:text-white/50 light:text-slate-500">
                  {nodes.length === 0 ? 'Start building your knowledge graph' : 'Ideas in your thinking space'}
                </div>
              </div>
              
              <div className="p-3 rounded bg-white/5 dark:bg-white/5 light:bg-slate-50">
                <div className="text-white/90 dark:text-white/90 light:text-slate-800 font-medium">Total Interactions</div>
                <div className="text-2xl font-bold text-green-400">
                  {nodes.reduce((total, node) => total + node.interactionCount, 0)}
                </div>
                <div className="text-xs text-white/50 dark:text-white/50 light:text-slate-500">
                  {nodes.length === 0 ? 'Interactions will appear here' : 'Times you\'ve engaged with concepts'}
                </div>
              </div>
              
              <div className="p-3 rounded bg-white/5 dark:bg-white/5 light:bg-slate-50">
                <div className="text-white/90 dark:text-white/90 light:text-slate-800 font-medium">Active Learning</div>
                <div className="text-2xl font-bold text-purple-400">
                  {nodes.length > 0 ? 'Active' : 'Ready'}
                </div>
                <div className="text-xs text-white/50 dark:text-white/50 light:text-slate-500">
                  {nodes.length === 0 ? 'Waiting for your first concept' : 'Learning system online'}
                </div>
              </div>
            </div>
          )}
        </div>
      </ScrollArea>
    </div>
  )
}