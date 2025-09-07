import { useState, useRef } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import { Upload, FileText, Loader2, AlertCircle, CheckCircle, Brain, X } from 'lucide-react'
import { Button } from './ui/button'
import { Progress } from './ui/progress'
import { Card, CardContent, CardHeader, CardTitle } from './ui/card'
import { Badge } from './ui/badge'

interface ExtractedConcept {
  id: string
  title: string
  description: string
  relevance: number
  category: string
  pageNumber?: number
}

interface PDFProcessorProps {
  onConceptsExtracted: (concepts: ExtractedConcept[]) => void
  onClose: () => void
}

export function PDFProcessor({ onConceptsExtracted, onClose }: PDFProcessorProps) {
  const [isDragOver, setIsDragOver] = useState(false)
  const [uploadedFile, setUploadedFile] = useState<File | null>(null)
  const [processing, setProcessing] = useState(false)
  const [progress, setProgress] = useState(0)
  const [extractedText, setExtractedText] = useState('')
  const [concepts, setConcepts] = useState<ExtractedConcept[]>([])
  const [status, setStatus] = useState<'idle' | 'uploading' | 'extracting' | 'analyzing' | 'complete' | 'error'>('idle')
  const [errorMessage, setErrorMessage] = useState('')
  const fileInputRef = useRef<HTMLInputElement>(null)

  const handleDragOver = (e: React.DragEvent) => {
    e.preventDefault()
    setIsDragOver(true)
  }

  const handleDragLeave = (e: React.DragEvent) => {
    e.preventDefault()
    setIsDragOver(false)
  }

  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault()
    setIsDragOver(false)
    
    const files = Array.from(e.dataTransfer.files)
    const pdfFile = files.find(file => file.type === 'application/pdf')
    
    if (pdfFile) {
      handleFileSelect(pdfFile)
    } else {
      setErrorMessage('Please upload a PDF file')
      setStatus('error')
    }
  }

  const handleFileSelect = (file: File) => {
    setUploadedFile(file)
    setErrorMessage('')
    setStatus('idle')
    setConcepts([])
    setExtractedText('')
  }

  const handleFileInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0]
    if (file) {
      handleFileSelect(file)
    }
  }

  const processPDF = async () => {
    if (!uploadedFile) return

    setProcessing(true)
    setStatus('uploading')
    setProgress(10)

    try {
      // Simulate PDF text extraction
      setStatus('extracting')
      setProgress(30)
      
      // Mock text extraction - in real implementation, you'd use a PDF.js or similar library
      await new Promise(resolve => setTimeout(resolve, 1500))
      
      const mockExtractedText = `
        Database Design Fundamentals
        
        Understanding the principles of database design is crucial for building scalable applications. 
        This chapter covers normalization, entity-relationship diagrams, and performance optimization.
        
        Key concepts include:
        - Entity-Relationship Modeling
        - Normalization Forms
        - Indexing Strategies
        - Query Optimization
        - ACID Properties
        - Concurrency Control
        
        API Design Patterns
        
        Modern web applications rely heavily on well-designed APIs. RESTful design principles
        provide a foundation for creating maintainable and scalable web services.
        
        Important patterns:
        - RESTful Architecture
        - GraphQL Design
        - Authentication Strategies
        - Rate Limiting
        - Versioning Approaches
        - Error Handling
        
        React Development Best Practices
        
        Component-based architecture in React enables building complex user interfaces
        through composition of smaller, reusable components.
        
        Core concepts:
        - Component Lifecycle
        - State Management
        - Hooks Patterns
        - Performance Optimization
        - Testing Strategies
        - Code Splitting
      `
      
      setExtractedText(mockExtractedText)
      setProgress(60)
      
      // Simulate AI concept extraction
      setStatus('analyzing')
      await new Promise(resolve => setTimeout(resolve, 2000))
      
      const mockConcepts: ExtractedConcept[] = [
        {
          id: 'pdf-1',
          title: 'Database Normalization',
          description: 'Process of organizing data to reduce redundancy and improve data integrity',
          relevance: 0.9,
          category: 'Database Design',
          pageNumber: 1
        },
        {
          id: 'pdf-2',
          title: 'Entity-Relationship Modeling',
          description: 'Visual representation of data relationships in database systems',
          relevance: 0.85,
          category: 'Database Design',
          pageNumber: 2
        },
        {
          id: 'pdf-3',
          title: 'RESTful API Design',
          description: 'Architectural style for designing networked applications using HTTP',
          relevance: 0.92,
          category: 'API Development',
          pageNumber: 5
        },
        {
          id: 'pdf-4',
          title: 'React Hooks',
          description: 'Functions that let you use state and other React features in functional components',
          relevance: 0.88,
          category: 'Frontend Development',
          pageNumber: 8
        },
        {
          id: 'pdf-5',
          title: 'Query Optimization',
          description: 'Techniques for improving database query performance and efficiency',
          relevance: 0.75,
          category: 'Database Performance',
          pageNumber: 3
        },
        {
          id: 'pdf-6',
          title: 'Authentication Strategies',
          description: 'Methods for verifying user identity in web applications',
          relevance: 0.82,
          category: 'Security',
          pageNumber: 6
        }
      ]
      
      setConcepts(mockConcepts)
      setProgress(100)
      setStatus('complete')
      
    } catch (error) {
      setErrorMessage('Failed to process PDF. Please try again.')
      setStatus('error')
      console.error('PDF processing error:', error)
    } finally {
      setProcessing(false)
    }
  }

  const addConceptsToThinkingSpace = () => {
    // Validate concepts before sending
    if (!concepts || !Array.isArray(concepts) || concepts.length === 0) {
      console.warn('No valid concepts to add to thinking space')
      setErrorMessage('No concepts found to add. Please try processing again.')
      setStatus('error')
      return
    }

    try {
      onConceptsExtracted(concepts)
      onClose()
    } catch (error) {
      console.error('Error adding concepts to thinking space:', error)
      setErrorMessage('Failed to add concepts. Please try again.')
      setStatus('error')
    }
  }

  const getStatusIcon = () => {
    switch (status) {
      case 'uploading':
      case 'extracting':
      case 'analyzing':
        return <Loader2 className="w-4 h-4 animate-spin" />
      case 'complete':
        return <CheckCircle className="w-4 h-4 text-green-500" />
      case 'error':
        return <AlertCircle className="w-4 h-4 text-red-500" />
      default:
        return <Brain className="w-4 h-4" />
    }
  }

  const getStatusText = () => {
    switch (status) {
      case 'uploading':
        return 'Uploading PDF...'
      case 'extracting':
        return 'Extracting text content...'
      case 'analyzing':
        return 'Analyzing concepts with AI...'
      case 'complete':
        return `Found ${concepts.length} concepts`
      case 'error':
        return errorMessage
      default:
        return 'Ready to process'
    }
  }

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      exit={{ opacity: 0, y: -20 }}
      className="space-y-4"
    >
      <div className="flex items-center justify-between">
        <h3 className="font-medium text-white dark:text-white light:text-slate-800">PDF Knowledge Extraction</h3>
        <Button
          variant="ghost"
          size="sm"
          onClick={onClose}
          className="w-8 h-8 p-0 text-white/70 dark:text-white/70 light:text-slate-600 hover:text-white dark:hover:text-white light:hover:text-slate-800"
        >
          <X className="w-4 h-4" />
        </Button>
      </div>

      {/* File Upload Area */}
      {!uploadedFile && (
        <div
          onDragOver={handleDragOver}
          onDragLeave={handleDragLeave}
          onDrop={handleDrop}
          onClick={() => fileInputRef.current?.click()}
          className={`
            relative border-2 border-dashed rounded-lg p-8 text-center cursor-pointer transition-all duration-200
            ${isDragOver 
              ? 'border-blue-400 bg-blue-50/50 dark:bg-blue-950/20 light:bg-blue-50/50' 
              : 'border-white/20 dark:border-white/20 light:border-slate-300 hover:border-blue-400 hover:bg-white/5 dark:hover:bg-white/5 light:hover:bg-slate-50'
            }
          `}
        >
          <Upload className="w-12 h-12 mx-auto mb-4 text-white/50 dark:text-white/50 light:text-slate-400" />
          <p className="text-sm font-medium text-white dark:text-white light:text-slate-800 mb-2">
            Drop your PDF here or click to browse
          </p>
          <p className="text-xs text-white/70 dark:text-white/70 light:text-slate-600">
            AI will extract concepts and ideas from your document
          </p>
          <input
            ref={fileInputRef}
            type="file"
            accept=".pdf"
            onChange={handleFileInputChange}
            className="hidden"
          />
        </div>
      )}

      {/* Uploaded File Info */}
      {uploadedFile && !processing && status !== 'complete' && (
        <Card className="bg-white/5 dark:bg-white/5 light:bg-white border-white/20 dark:border-white/20 light:border-slate-200">
          <CardContent className="p-4">
            <div className="flex items-center space-x-3">
              <FileText className="w-8 h-8 text-red-500" />
              <div className="flex-1 min-w-0">
                <p className="text-sm font-medium text-white dark:text-white light:text-slate-800 truncate">
                  {uploadedFile.name}
                </p>
                <p className="text-xs text-white/70 dark:text-white/70 light:text-slate-600">
                  {(uploadedFile.size / 1024 / 1024).toFixed(2)} MB
                </p>
              </div>
              <Button onClick={processPDF} size="sm" className="bg-blue-500 hover:bg-blue-600 text-white">
                <Brain className="w-4 h-4 mr-2" />
                Extract Concepts
              </Button>
            </div>
          </CardContent>
        </Card>
      )}

      {/* Processing Status */}
      {processing && (
        <Card className="bg-white/5 dark:bg-white/5 light:bg-white border-white/20 dark:border-white/20 light:border-slate-200">
          <CardContent className="p-4">
            <div className="space-y-3">
              <div className="flex items-center space-x-2">
                {getStatusIcon()}
                <span className="text-sm font-medium text-white dark:text-white light:text-slate-800">
                  {getStatusText()}
                </span>
              </div>
              <Progress value={progress} className="w-full" />
            </div>
          </CardContent>
        </Card>
      )}

      {/* Extracted Concepts */}
      {status === 'complete' && concepts.length > 0 && (
        <Card className="bg-white/5 dark:bg-white/5 light:bg-white border-white/20 dark:border-white/20 light:border-slate-200">
          <CardHeader className="pb-3">
            <CardTitle className="text-sm flex items-center space-x-2 text-white dark:text-white light:text-slate-800">
              <CheckCircle className="w-4 h-4 text-green-500" />
              <span>Extracted Concepts</span>
              <Badge variant="secondary" className="text-xs bg-white/10 dark:bg-white/10 light:bg-slate-100 text-white dark:text-white light:text-slate-700">
                {concepts.length} found
              </Badge>
            </CardTitle>
          </CardHeader>
          <CardContent className="p-4 pt-0">
            <div className="space-y-3 max-h-60 overflow-y-auto">
              {concepts.map((concept) => (
                <motion.div
                  key={concept.id}
                  initial={{ opacity: 0, x: -20 }}
                  animate={{ opacity: 1, x: 0 }}
                  className="p-3 rounded-lg border border-white/10 dark:border-white/10 light:border-slate-200 bg-white/5 dark:bg-white/5 light:bg-slate-50 hover:bg-white/10 dark:hover:bg-white/10 light:hover:bg-slate-100 transition-colors"
                >
                  <div className="flex items-start justify-between">
                    <div className="flex-1 min-w-0">
                      <h4 className="text-sm font-medium text-white dark:text-white light:text-slate-800 mb-1 truncate">
                        {concept.title}
                      </h4>
                      <p className="text-xs text-white/70 dark:text-white/70 light:text-slate-600 mb-2 line-clamp-2">
                        {concept.description}
                      </p>
                      <div className="flex items-center space-x-2">
                        <Badge variant="outline" className="text-xs">
                          {concept.category}
                        </Badge>
                        {concept.pageNumber && (
                          <span className="text-xs text-muted-foreground">
                            Page {concept.pageNumber}
                          </span>
                        )}
                      </div>
                    </div>
                    <div className="ml-2 flex-shrink-0">
                      <div className="w-2 h-2 rounded-full bg-gradient-to-r from-blue-400 to-purple-500" 
                           style={{ opacity: concept.relevance }} />
                    </div>
                  </div>
                </motion.div>
              ))}
            </div>
            
            <div className="pt-4 border-t border-white/10 dark:border-white/10 light:border-slate-200 mt-4">
              <Button 
                onClick={addConceptsToThinkingSpace} 
                className="w-full bg-blue-500 hover:bg-blue-600 text-white"
                size="sm"
              >
                <Brain className="w-4 h-4 mr-2" />
                Add to Thinking Space
              </Button>
            </div>
          </CardContent>
        </Card>
      )}

      {/* Error State */}
      {status === 'error' && (
        <Card className="bg-red-500/10 border-red-500/20 dark:bg-red-500/10 dark:border-red-500/20 light:bg-red-50 light:border-red-200">
          <CardContent className="p-4">
            <div className="flex items-center space-x-2 text-red-400 dark:text-red-400 light:text-red-600">
              <AlertCircle className="w-4 h-4" />
              <span className="text-sm">{errorMessage}</span>
            </div>
          </CardContent>
        </Card>
      )}
    </motion.div>
  )
}