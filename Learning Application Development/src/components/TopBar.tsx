import { useState } from 'react'
import { Search, Brain, Plus, Settings, FileText, Video, BookOpen, Sun, Moon, Menu, X } from 'lucide-react'
import { Button } from './ui/button'
import { Input } from './ui/input'
import { Badge } from './ui/badge'
import { useTheme } from './ThemeProvider'
import { PDFProcessor } from './PDFProcessor'
import { YouTubeProcessor } from './YouTubeProcessor'
import { motion, AnimatePresence } from 'framer-motion'

interface ExtractedConcept {
  id: string
  title: string
  description: string
  relevance: number
  category: string
  pageNumber?: number
}

interface TopBarProps {
  searchQuery: string
  setSearchQuery: (query: string) => void
  isAmbientMode: boolean
  setIsAmbientMode: (mode: boolean) => void
  sidebarCollapsed: boolean
  setSidebarCollapsed: (collapsed: boolean) => void
  onConceptsExtracted?: (concepts: ExtractedConcept[]) => void
}

export function TopBar({ 
  searchQuery, 
  setSearchQuery, 
  isAmbientMode, 
  setIsAmbientMode,
  sidebarCollapsed,
  setSidebarCollapsed,
  onConceptsExtracted
}: TopBarProps) {
  const { theme, toggleTheme } = useTheme()
  const [showPDFProcessor, setShowPDFProcessor] = useState(false)
  const [showYouTubeProcessor, setShowYouTubeProcessor] = useState(false)

  const handleConceptsExtracted = (concepts: ExtractedConcept[]) => {
    setShowPDFProcessor(false)
    setShowYouTubeProcessor(false)
    if (onConceptsExtracted) {
      onConceptsExtracted(concepts)
    }
  }
  return (
    <>
    <div className="h-16 zettlemind-topbar flex items-center justify-between px-6">
      {/* Left section - Sidebar toggle, Logo and mode */}
      <div className="flex items-center space-x-4">
        <Button
          variant="ghost"
          size="sm"
          onClick={() => setSidebarCollapsed(!sidebarCollapsed)}
          className="zettlemind-button-secondary"
          title={sidebarCollapsed ? "Show sidebar (⌘B)" : "Hide sidebar (⌘B)"}
        >
          {sidebarCollapsed ? <Menu className="w-4 h-4" /> : <X className="w-4 h-4" />}
        </Button>
        
        <div className="flex items-center space-x-2">
          <Brain className="w-8 h-8 text-blue-400" />
          <span className="zettlemind-logo">
            Zettle<span className="accent">Mind</span>
          </span>
        </div>
        
        {isAmbientMode && (
          <Badge variant="secondary" className="bg-blue-500/20 text-blue-300 border-blue-400/30">
            Ambient Learning
          </Badge>
        )}
      </div>

      {/* Center section - Search */}
      <div className="flex-1 max-w-md mx-8">
        <div className="relative">
          <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 w-4 h-4 text-gray-400" />
          <Input
            placeholder="Search ideas, connections, or content..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="zettlemind-search pl-10"
          />
        </div>
      </div>

      {/* Right section - Actions */}
      <div className="flex items-center space-x-2">
        <Button 
          variant="ghost" 
          size="sm" 
          onClick={() => setShowPDFProcessor(true)}
          className="zettlemind-button-secondary"
        >
          <FileText className="w-4 h-4 mr-2" />
          PDF
        </Button>
        
        <Button 
          variant="ghost" 
          size="sm" 
          onClick={() => setShowYouTubeProcessor(true)}
          className="zettlemind-button-secondary"
        >
          <Video className="w-4 h-4 mr-2" />
          YouTube
        </Button>
        
        <Button 
          variant="ghost" 
          size="sm" 
          className="zettlemind-button-secondary"
        >
          <BookOpen className="w-4 h-4 mr-2" />
          eBook
        </Button>
        
        <Button 
          variant="ghost" 
          size="sm" 
          className="zettlemind-button"
        >
          <Plus className="w-4 h-4 mr-2" />
          Add Idea
        </Button>
        
        <Button 
          variant="ghost" 
          size="sm" 
          onClick={toggleTheme}
          className="zettlemind-icon hover:text-blue-400"
        >
          {theme === 'dark' ? <Sun className="w-4 h-4" /> : <Moon className="w-4 h-4" />}
        </Button>
        
        <Button 
          variant="ghost" 
          size="sm" 
          className="zettlemind-icon hover:text-blue-400"
        >
          <Settings className="w-4 h-4" />
        </Button>
      </div>
    </div>

    {/* PDF Processor Modal */}
    <AnimatePresence>
      {showPDFProcessor && (
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          className="fixed inset-0 bg-black/50 dark:bg-black/50 light:bg-black/30 backdrop-blur-sm flex items-center justify-center z-50"
          onClick={() => setShowPDFProcessor(false)}
        >
          <motion.div
            initial={{ opacity: 0, scale: 0.95, y: 20 }}
            animate={{ opacity: 1, scale: 1, y: 0 }}
            exit={{ opacity: 0, scale: 0.95, y: 20 }}
            transition={{ duration: 0.2 }}
            className="max-w-2xl w-full mx-4 max-h-[80vh] overflow-y-auto bg-black/90 dark:bg-black/90 light:bg-white border border-white/20 dark:border-white/20 light:border-slate-200 rounded-lg backdrop-blur-sm"
            onClick={(e) => e.stopPropagation()}
          >
            <div className="p-6">
              <PDFProcessor
                onConceptsExtracted={handleConceptsExtracted}
                onClose={() => setShowPDFProcessor(false)}
              />
            </div>
          </motion.div>
        </motion.div>
      )}
    </AnimatePresence>

    {/* YouTube Processor Modal */}
    <AnimatePresence>
      {showYouTubeProcessor && (
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          className="fixed inset-0 bg-black/50 dark:bg-black/50 light:bg-black/30 backdrop-blur-sm flex items-center justify-center z-50"
          onClick={() => setShowYouTubeProcessor(false)}
        >
          <motion.div
            initial={{ opacity: 0, scale: 0.95, y: 20 }}
            animate={{ opacity: 1, scale: 1, y: 0 }}
            exit={{ opacity: 0, scale: 0.95, y: 20 }}
            transition={{ duration: 0.2 }}
            className="max-w-2xl w-full mx-4 max-h-[80vh] overflow-y-auto bg-black/90 dark:bg-black/90 light:bg-white border border-white/20 dark:border-white/20 light:border-slate-200 rounded-lg backdrop-blur-sm"
            onClick={(e) => e.stopPropagation()}
          >
            <div className="p-6">
              <YouTubeProcessor
                onConceptsExtracted={handleConceptsExtracted}
                onClose={() => setShowYouTubeProcessor(false)}
              />
            </div>
          </motion.div>
        </motion.div>
      )}
    </AnimatePresence>
    </>
  )
}