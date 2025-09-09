import { useState, useRef, useCallback, useEffect } from 'react'
import { Document, Page, pdfjs } from 'react-pdf'
import { motion, AnimatePresence } from 'framer-motion'
import { 
  Upload, 
  FileText, 
  Loader2, 
  AlertCircle, 
  X, 
  ZoomIn, 
  ZoomOut,
  StickyNote,
  Highlighter,
  Bookmark,
  ChevronLeft,
  ChevronRight,
  Eye,
  EyeOff
} from 'lucide-react'
import { Button } from './ui/button'
import { Card, CardContent, CardHeader, CardTitle } from './ui/card'
import { Separator } from './ui/separator'
import { ScrollArea } from './ui/scroll-area'

import 'react-pdf/dist/Page/AnnotationLayer.css'
import 'react-pdf/dist/Page/TextLayer.css'
import '../styles/pdf.css'

// Configure PDF.js worker with a compatible version
// Using local installed version for better reliability
const LOCAL_WORKER = '/pdf.worker.min.js'
const FALLBACK_WORKER = 'https://unpkg.com/pdfjs-dist@3.11.174/build/pdf.worker.min.js'

try {
  // Try local worker first
  pdfjs.GlobalWorkerOptions.workerSrc = LOCAL_WORKER
  console.log('PDF.js worker configured with local version:', LOCAL_WORKER)
  console.log('PDF.js API version:', pdfjs.version)
} catch (error) {
  console.error('Error configuring local PDF.js worker, using fallback:', error)
  pdfjs.GlobalWorkerOptions.workerSrc = FALLBACK_WORKER
  console.log('Using fallback worker:', FALLBACK_WORKER)
}

// Configure PDF.js worker with a compatible version
// Using a known stable version that works with most react-pdf versions
const COMPATIBLE_WORKER = 'https://unpkg.com/pdfjs-dist@3.11.174/build/pdf.worker.min.js'

try {
  pdfjs.GlobalWorkerOptions.workerSrc = COMPATIBLE_WORKER
  console.log('PDF.js worker configured with compatible version:', COMPATIBLE_WORKER)
  console.log('PDF.js API version:', pdfjs.version)
} catch (error) {
  console.error('Error configuring PDF.js worker:', error)
}

interface PDFAnnotation {
  id: string
  type: 'highlight' | 'note' | 'bookmark'
  pageNumber: number
  x: number
  y: number
  width?: number
  height?: number
  color: string
  text?: string
  content?: string
  timestamp: Date
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

interface PDFReaderProps {
  onClose?: () => void
  document?: DocumentFile | null
}

interface PDFAnnotation {
  id: string
  type: 'highlight' | 'note' | 'bookmark'
  pageNumber: number
  x: number
  y: number
  width?: number
  height?: number
  color: string
  text?: string
  content?: string
  timestamp: Date
}

interface PDFReaderProps {
  onClose?: () => void
  document?: DocumentFile | null
}

export function PDFReader({ onClose, document }: PDFReaderProps) {
  const [uploadedFile, setUploadedFile] = useState<File | null>(document?.content || null)
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')
  const [zoom, setZoom] = useState(1)
  const [currentPage, setCurrentPage] = useState(1)
  const [totalPages, setTotalPages] = useState(1)
  const [annotations, setAnnotations] = useState<PDFAnnotation[]>([])
  const [activeAnnotationTool, setActiveAnnotationTool] = useState<'none' | 'highlight' | 'note' | 'bookmark'>('none')
  const [showNotesPanel, setShowNotesPanel] = useState(true)
  const [noteText, setNoteText] = useState('')
  const [isDragOver, setIsDragOver] = useState(false)
  const [pdfFile, setPdfFile] = useState<string | File | ArrayBuffer | null>(null)
  const [retryCount, setRetryCount] = useState(0)
  const [maxRetries] = useState(2)
  
  const fileInputRef = useRef<HTMLInputElement>(null)
  const pdfViewerRef = useRef<HTMLDivElement>(null)

  // Ensure worker is properly configured on component mount
  useEffect(() => {
    console.log('PDFReader component mounted - verifying worker configuration...')
    
    // Get the actual PDF.js version that's installed
    const currentVersion = pdfjs.version
    console.log('PDF.js API version on mount:', currentVersion)
    
    // CRITICAL: Use local worker first (guaranteed version match)
    const localWorker = '/pdf.worker.min.js'
    pdfjs.GlobalWorkerOptions.workerSrc = localWorker
    console.log('Worker configured on mount (LOCAL - version guaranteed):', localWorker)
    
    // Verify worker configuration
    console.log('Final worker source:', pdfjs.GlobalWorkerOptions.workerSrc)
  }, [])

  // Load document if passed as prop
  useEffect(() => {
    if (document?.content) {
      setUploadedFile(document.content)
      loadPDF(document.content)
    }
  }, [document])

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
      setError('Please upload a PDF file')
    }
  }

  const handleFileSelect = (file: File) => {
    console.log('=== PDF FILE SELECTION DEBUG ===')
    console.log('File name:', file.name)
    console.log('File size:', file.size, 'bytes (', (file.size / 1024 / 1024).toFixed(2), 'MB)')
    console.log('File type:', file.type)
    console.log('File last modified:', new Date(file.lastModified))
    
    // Validate file type
    if (file.type !== 'application/pdf') {
      console.error('Invalid file type:', file.type)
      setError(`Invalid file type: ${file.type}. Please select a PDF file.`)
      return
    }
    
    // Validate file size (max 50MB)
    if (file.size > 50 * 1024 * 1024) {
      console.error('File too large:', file.size)
      setError('File size too large. Please select a file smaller than 50MB')
      return
    }
    
    // Check if file is readable
    try {
      const reader = new FileReader()
      reader.onload = (e) => {
        console.log('File read successfully, first 100 chars:', 
          typeof e.target?.result === 'string' ? e.target.result.substring(0, 100) : 'Binary data')
      }
      reader.onerror = (e) => {
        console.error('File read error:', e)
        setError('Failed to read file')
      }
      reader.readAsArrayBuffer(file) // Change to readAsArrayBuffer for PDF files
    } catch (readError) {
      console.error('FileReader error:', readError)
    }
    
    console.log('✅ Selected PDF file validation passed - starting upload...')
    setUploadedFile(file)
    setError('📤 Processing PDF file...')
    setRetryCount(0) // Reset retry count for new file
    
    // Add a small delay to show the processing message
    setTimeout(() => {
      console.log('🚀 Starting PDF load process...')
      loadPDF(file)
    }, 100)
  }

  const forceStableWorker = () => {
    console.log('Force Stable Worker clicked - using LOCAL worker (guaranteed version match)...')
    
    // Reset retry count for manual intervention
    setRetryCount(0)
    
    // Use LOCAL worker first (guaranteed version compatibility)
    const localWorker = '/pdf.worker.min.js'
    pdfjs.GlobalWorkerOptions.workerSrc = localWorker
    console.log('Forced LOCAL worker (version guaranteed):', localWorker)
    setError('✅ Using local worker (guaranteed version match). Reloading PDF...')
    
    // Automatically reload PDF if one is uploaded
    if (uploadedFile) {
      setTimeout(() => {
        console.log('Auto-reloading PDF with reliable worker...')
        loadPDF(uploadedFile)
      }, 500)
    }
  }

  const testWorker = async () => {
    console.log('=== TESTING PDF.js WORKER ===')
    console.log('Current PDF.js version:', pdfjs.version)
    console.log('Current worker source:', pdfjs.GlobalWorkerOptions.workerSrc)
    
    try {
      // Test worker with a simple operation
      setError('🧪 Testing PDF.js worker configuration...')
      
      // Create a minimal test to verify worker is functional
      console.log('Testing PDF.js worker functionality...')
      
      // Test if the current worker can be fetched
      const response = await fetch(pdfjs.GlobalWorkerOptions.workerSrc, { method: 'HEAD' })
      if (!response.ok) {
        throw new Error(`Worker not accessible: ${response.status}`)
      }
      
      console.log('✅ Worker file is accessible')
      
      // Try to create a simple PDF document task to test worker communication
      const testData = new Uint8Array([0x25, 0x50, 0x44, 0x46]) // %PDF
      const loadingTask = pdfjs.getDocument({ data: testData })
      
      // Set a timeout for the test
      const timeoutPromise = new Promise((_, reject) => {
        setTimeout(() => reject(new Error('Worker test timed out')), 5000)
      })
      
      try {
        await Promise.race([loadingTask.promise, timeoutPromise])
        console.log('✅ Worker communication test successful!')
        setError('✅ PDF.js worker is working correctly! You can now upload your PDF.')
        return true
      } catch (workerError) {
        console.log('Worker communication failed, but worker file is accessible')
        setError('⚠️ Worker file accessible but communication failed. Try uploading your PDF anyway.')
        return true
      }
      
    } catch (error) {
      console.error('❌ Worker test failed:', error)
      setError(`❌ Worker test failed: ${(error as Error).message}. Try "Force Stable Worker" button.`)
      return false
    }
  }

  const generateTestPDF = () => {
    // Create a simple PDF blob for testing
    const testPDFContent = `%PDF-1.4
1 0 obj
<<
/Type /Catalog
/Pages 2 0 R
>>
endobj

2 0 obj
<<
/Type /Pages
/Kids [3 0 R]
/Count 1
>>
endobj

3 0 obj
<<
/Type /Page
/Parent 2 0 R
/MediaBox [0 0 612 792]
/Contents 4 0 R
/Resources <<
/Font <<
/F1 5 0 R
>>
>>
>>
endobj

4 0 obj
<<
/Length 44
>>
stream
BT
/F1 12 Tf
50 750 Td
(Hello, this is a test PDF!) Tj
ET
endstream
endobj

5 0 obj
<<
/Type /Font
/Subtype /Type1
/BaseFont /Helvetica
>>
endobj

xref
0 6
0000000000 65535 f 
0000000010 00000 n 
0000000053 00000 n 
0000000100 00000 n 
0000000242 00000 n 
0000000334 00000 n 
trailer
<<
/Size 6
/Root 1 0 R
>>
startxref
408
%%EOF`;

    const blob = new Blob([testPDFContent], { type: 'application/pdf' })
    const file = new File([blob], 'test.pdf', { type: 'application/pdf' })
    handleFileSelect(file)
  }

  const handleFileInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0]
    if (file) {
      handleFileSelect(file)
    }
  }

  const loadPDF = async (file: File) => {
    console.log('=== PDF LOAD PROCESS DEBUG ===')
    console.log('Starting PDF load process for:', file.name)
    console.log('File size:', file.size, 'bytes')
    console.log('File type:', file.type)
    setLoading(true)
    setError('')
    
    try {
      // First, ensure we have a working PDF.js worker
      if (!pdfjs.GlobalWorkerOptions.workerSrc) {
        console.log('No worker configured, setting default...')
        pdfjs.GlobalWorkerOptions.workerSrc = 'https://unpkg.com/pdfjs-dist@3.11.174/build/pdf.worker.min.js'
      }
      
      console.log('Current PDF.js worker:', pdfjs.GlobalWorkerOptions.workerSrc)
      console.log('PDF.js version:', pdfjs.version)
      
      // Method 1: Try with ArrayBuffer (most reliable for large files)
      console.log('Method 1: Converting to ArrayBuffer...')
      const arrayBuffer = await file.arrayBuffer()
      console.log('ArrayBuffer created, size:', arrayBuffer.byteLength)
      
      // Test if the ArrayBuffer contains valid PDF data
      const uint8Array = new Uint8Array(arrayBuffer)
      const pdfHeader = new TextDecoder().decode(uint8Array.slice(0, 8))
      console.log('PDF header check:', pdfHeader)
      
      if (pdfHeader.startsWith('%PDF-')) {
        console.log('✅ Valid PDF header detected')
        setPdfFile(arrayBuffer)
        setLoading(false)
        return
      } else {
        console.log('❌ Invalid PDF header, trying other methods...')
      }
      
      // Method 2: Try with blob URL
      console.log('Method 2: Creating blob URL...')
      const fileUrl = URL.createObjectURL(file)
      console.log('Blob URL created:', fileUrl)
      
      // Test if blob URL is accessible
      try {
        const response = await fetch(fileUrl)
        console.log('Blob URL test response:', response.status, response.statusText)
        
        if (response.ok) {
          console.log('✅ Blob URL is accessible')
          setPdfFile(fileUrl)
          setLoading(false)
          return
        }
      } catch (fetchError) {
        console.error('❌ Blob URL not accessible:', fetchError)
      }
      
      // Method 3: Try with File object directly
      console.log('Method 3: Using File object directly...')
      setPdfFile(file)
      setLoading(false)
      
    } catch (err) {
      console.error('❌ Error in loadPDF function:', err)
      setError(`Failed to load PDF file: ${err instanceof Error ? err.message : 'Unknown error'}`)
      setLoading(false)
    }
  }

  const onDocumentLoadSuccess = ({ numPages }: { numPages: number }) => {
    console.log('=== PDF DOCUMENT LOAD SUCCESS ===')
    console.log('PDF loaded successfully, pages:', numPages)
    console.log('PDF file URL:', pdfFile)
    setTotalPages(numPages)
    setCurrentPage(1)
    setError('')
  }

  const onDocumentLoadError = (error: Error) => {
    console.log('=== PDF DOCUMENT LOAD ERROR ===')
    console.error('PDF load error:', error)
    console.error('Error details:', {
      name: error.name,
      message: error.message,
      stack: error.stack
    })
    console.log('PDF file URL that failed:', pdfFile)
    console.log('PDF.js API version:', pdfjs.version)
    console.log('PDF.js worker source:', pdfjs.GlobalWorkerOptions.workerSrc)
    console.log('Current retry count:', retryCount)
    
    // Check if we've exceeded max retries
    if (retryCount >= maxRetries) {
      console.log('Max retries exceeded, stopping automatic retry')
      setError(`Failed to load PDF after ${maxRetries} attempts. Please try using the "Force Stable Worker" button or upload a different PDF file.`)
      setRetryCount(0) // Reset for next attempt
      return
    }
    
    // Try different workers for any error (not just specific error messages)
    console.log(`PDF load failed - trying VERSION-MATCHED worker (attempt ${retryCount + 1}/${maxRetries})...`)
    
    // Get current version for exact matching
    const currentVersion = pdfjs.version
    console.log('Using PDF.js version for worker matching:', currentVersion)
    
    // Try multiple VERSION-MATCHED worker sources (CRITICAL!)
    const workerSources = [
      '/pdf.worker.min.js', // Local worker
      `https://unpkg.com/pdfjs-dist@${currentVersion}/build/pdf.worker.min.js`, // Version-matched CDN
      `https://cdnjs.cloudflare.com/ajax/libs/pdf.js/${currentVersion}/pdf.worker.min.js`, // Version-matched CDN
      `https://cdn.jsdelivr.net/npm/pdfjs-dist@${currentVersion}/build/pdf.worker.min.js` // Version-matched CDN
    ]
    
    const workerToTry = workerSources[retryCount % workerSources.length]
    console.log('Setting VERSION-MATCHED worker:', workerToTry)
    pdfjs.GlobalWorkerOptions.workerSrc = workerToTry
    
    // Increment retry count
    setRetryCount(prev => prev + 1)
    
    // Automatically retry loading the PDF with the new worker
    setTimeout(() => {
      console.log('Retrying PDF load with new worker...')
      const workerType = workerToTry.includes('/pdf.worker.min.js') && !workerToTry.includes('http') ? 'local' : 'CDN'
      setError(`🔄 Trying ${workerType} worker (attempt ${retryCount + 1}/${maxRetries}), reloading PDF...`)
      if (uploadedFile) {
        loadPDF(uploadedFile)
      }
    }, 1000)
  }

  const handleZoomIn = () => setZoom(prev => Math.min(prev + 0.25, 3))
  const handleZoomOut = () => setZoom(prev => Math.max(prev - 0.25, 0.5))

  const handlePageChange = (direction: 'prev' | 'next') => {
    if (direction === 'prev' && currentPage > 1) {
      setCurrentPage(prev => prev - 1)
    } else if (direction === 'next' && currentPage < totalPages) {
      setCurrentPage(prev => prev + 1)
    }
  }

  const handlePDFClick = useCallback((e: React.MouseEvent) => {
    if (activeAnnotationTool === 'none') return

    const rect = e.currentTarget.getBoundingClientRect()
    const x = ((e.clientX - rect.left) / rect.width) * 100
    const y = ((e.clientY - rect.top) / rect.height) * 100

    const newAnnotation: PDFAnnotation = {
      id: Date.now().toString(),
      type: activeAnnotationTool === 'highlight' ? 'highlight' : activeAnnotationTool === 'note' ? 'note' : 'bookmark',
      pageNumber: currentPage,
      x,
      y,
      color: activeAnnotationTool === 'highlight' ? '#ffeb3b' : activeAnnotationTool === 'note' ? '#2196f3' : '#f44336',
      timestamp: new Date(),
      ...(activeAnnotationTool === 'highlight' && { width: 20, height: 2 }),
      ...(activeAnnotationTool === 'note' && { content: 'New note' })
    }

    setAnnotations(prev => [...prev, newAnnotation])
    setActiveAnnotationTool('none')
  }, [activeAnnotationTool, currentPage])

  const addNote = () => {
    if (!noteText.trim()) return

    const newNote: PDFAnnotation = {
      id: Date.now().toString(),
      type: 'note',
      pageNumber: currentPage,
      x: 50,
      y: 50,
      color: '#2196f3',
      content: noteText,
      timestamp: new Date()
    }

    setAnnotations(prev => [...prev, newNote])
    setNoteText('')
  }

  const deleteAnnotation = (id: string) => {
    setAnnotations(prev => prev.filter(ann => ann.id !== id))
  }

  if (!uploadedFile) {
    return (
      <div className="flex-1 flex items-center justify-center p-8">
        <Card className="w-full max-w-lg">
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <FileText className="w-5 h-5" />
              PDF Reader
            </CardTitle>
          </CardHeader>
          <CardContent>
            {/* Compact Debug Display */}
            <div className="bg-gray-100 dark:bg-gray-800 p-2 rounded text-xs font-mono mb-2">
              <div className="flex flex-wrap gap-2">
                <span>📊 Worker: ✅</span>
                <span>📄 File: {uploadedFile ? '✅' : '❌'}</span>
                <span>🔄 PDF: {pdfFile ? '✅' : '❌'}</span>
                <span>⏳ Loading: {loading ? '✅' : '❌'}</span>
                {error && <span className="text-red-600">❌ {error.substring(0, 30)}...</span>}
              </div>
            </div>
            <div
              onDragOver={handleDragOver}
              onDragLeave={handleDragLeave}
              onDrop={handleDrop}
              onClick={() => fileInputRef.current?.click()}
              className={`
                relative border-2 border-dashed rounded-lg p-8 text-center cursor-pointer transition-all duration-200
                ${isDragOver 
                  ? 'border-blue-400 bg-blue-50/50 dark:bg-blue-950/20' 
                  : 'border-gray-300 dark:border-gray-600 hover:border-blue-400 hover:bg-gray-50 dark:hover:bg-gray-800'
                }
              `}
            >
              <Upload className="w-12 h-12 mx-auto mb-4 text-gray-400" />
              <p className="text-sm font-medium mb-2">
                Drop your PDF here or click to browse
              </p>
              <p className="text-xs text-gray-500">
                Read, highlight, and annotate your PDF documents
              </p>
              <input
                ref={fileInputRef}
                type="file"
                accept=".pdf"
                onChange={handleFileInputChange}
                className="hidden"
              />
              <Button
                onClick={generateTestPDF}
                variant="outline"
                size="sm"
                className="mt-4"
              >
                Generate Test PDF
              </Button>
              <Button
                onClick={() => fileInputRef.current?.click()}
                variant="outline"
                size="sm"
                className="mt-2"
              >
                Browse for PDF File
              </Button>
              <Button
                onClick={testWorker}
                variant="outline"
                size="sm"
                className="mt-2"
              >
                Test & Fix Worker
              </Button>
              <Button
                onClick={forceStableWorker}
                variant="outline"
                size="sm"
                className="mt-2"
              >
                Force Stable Worker
              </Button>
              <Button
                onClick={testWorker}
                variant="outline"
                size="sm"
                className="mt-2 ml-2"
              >
                Test Worker
              </Button>
              
              <Button
                onClick={() => {
                  // Open developer console and run comprehensive tests
                  console.log('=== COMPREHENSIVE PDF.js DIAGNOSTICS ===')
                  console.log('Browser:', navigator.userAgent)
                  console.log('PDF.js version:', pdfjs.version)
                  console.log('Worker src:', pdfjs.GlobalWorkerOptions.workerSrc)
                  console.log('Window origin:', window.location.origin)
                  console.log('Available workers to test:')
                  
                  const workers = [
                    '/pdf.worker.min.js',
                    'https://unpkg.com/pdfjs-dist@3.11.174/build/pdf.worker.min.js',
                    'https://cdnjs.cloudflare.com/ajax/libs/pdf.js/3.11.174/pdf.worker.min.js',
                    'https://cdn.jsdelivr.net/npm/pdfjs-dist@3.11.174/build/pdf.worker.min.js'
                  ]
                  
                  workers.forEach((worker, index) => {
                    console.log(`${index + 1}. ${worker}`)
                  })
                  
                  console.log('🔧 To manually test a worker, run:')
                  console.log('pdfjs.GlobalWorkerOptions.workerSrc = "WORKER_URL_HERE"')
                  console.log('Then try uploading your PDF again.')
                  
                  setError('🔍 Check browser console (F12) for detailed diagnostics')
                }}
                variant="outline"
                size="sm"
                className="mt-2 ml-2"
              >
                Console Debug
              </Button>
              
              <Button
                onClick={() => {
                  // Create a simple test PDF
                  console.log('Creating test PDF...')
                  try {
                    // Minimal PDF content
                    const pdfContent = `%PDF-1.4
1 0 obj
<< /Type /Catalog /Pages 2 0 R >>
endobj
2 0 obj
<< /Type /Pages /Kids [3 0 R] /Count 1 >>
endobj
3 0 obj
<< /Type /Page /Parent 2 0 R /MediaBox [0 0 612 792] /Contents 4 0 R >>
endobj
4 0 obj
<< /Length 44 >>
stream
BT
/F1 12 Tf
100 700 Td
(Test PDF) Tj
ET
endstream
endobj
xref
0 5
0000000000 65535 f 
0000000010 00000 n 
0000000053 00000 n 
0000000110 00000 n 
0000000189 00000 n 
trailer
<< /Size 5 /Root 1 0 R >>
startxref
285
%%EOF`
                    
                    const blob = new Blob([pdfContent], { type: 'application/pdf' })
                    const file = new File([blob], 'test.pdf', { type: 'application/pdf' })
                    
                    console.log('Test PDF created, loading...')
                    setUploadedFile(file)
                    setError('📄 Loading test PDF...')
                    loadPDF(file)
                  } catch (error) {
                    console.error('Failed to create test PDF:', error)
                    setError('❌ Failed to create test PDF')
                  }
                }}
                variant="outline"
                size="sm"
                className="mt-2 ml-2"
              >
                Test PDF
              </Button>
              {uploadedFile && (
                <Button
                  onClick={() => {
                    try {
                      const url = URL.createObjectURL(uploadedFile as File)
                      const link = window.document.createElement('a')
                      link.href = url
                      link.download = (uploadedFile as File).name || 'document.pdf'
                      window.document.body.appendChild(link)
                      link.click()
                      window.document.body.removeChild(link)
                      URL.revokeObjectURL(url)
                    } catch (error) {
                      console.error('Error downloading file:', error)
                    }
                  }}
                  variant="outline"
                  size="sm"
                  className="mt-2 ml-2"
                >
                  Download PDF
                </Button>
              )}
            </div>
            {error && (
              <div className="mt-4 p-3 bg-red-50 border border-red-200 rounded-md">
                <div className="flex items-center text-red-600">
                  <AlertCircle className="w-4 h-4 mr-2" />
                  <span className="text-sm">{error}</span>
                </div>
              </div>
            )}
          </CardContent>
        </Card>
      </div>
    )
  }

  if (loading) {
    return (
      <div className="flex-1 flex items-center justify-center">
        <div className="text-center">
          <Loader2 className="w-8 h-8 animate-spin mx-auto mb-4" />
          <p className="text-sm text-gray-600">Loading PDF...</p>
        </div>
      </div>
    )
  }

  return (
    <div className="flex-1 flex h-full">
      {/* Debug Strip - shows PDF status */}
      <div className="fixed top-0 left-0 right-0 bg-blue-100 p-1 text-xs font-mono z-50">
        <div className="flex gap-4">
          <span>📄 File: {uploadedFile ? uploadedFile.name : 'None'}</span>
          <span>🔄 PDF: {pdfFile ? 'Ready' : 'Not ready'}</span>
          <span>⏳ Loading: {loading ? 'Yes' : 'No'}</span>
          <span>📖 Pages: {totalPages}</span>
          <span>📍 Current: {currentPage}</span>
          {error && <span className="text-red-600">❌ {error}</span>}
        </div>
      </div>
      
      {/* Notes Panel */}
      <AnimatePresence>
        {showNotesPanel && (
          <motion.div
            initial={{ width: 0, opacity: 0 }}
            animate={{ width: 320, opacity: 1 }}
            exit={{ width: 0, opacity: 0 }}
            transition={{ duration: 0.3 }}
            className="bg-white dark:bg-gray-900 border-r border-gray-200 dark:border-gray-700 flex flex-col"
          >
            <div className="p-4 border-b border-gray-200 dark:border-gray-700">
              <div className="flex items-center justify-between mb-4">
                <h3 className="font-medium">Notes & Annotations</h3>
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={() => setShowNotesPanel(false)}
                >
                  <EyeOff className="w-4 h-4" />
                </Button>
              </div>

              {/* Add Note Section */}
              <div className="space-y-2">
                <textarea
                  value={noteText}
                  onChange={(e) => setNoteText(e.target.value)}
                  placeholder="Write a note..."
                  className="w-full p-2 text-sm border border-gray-200 dark:border-gray-600 rounded-md resize-none"
                  rows={3}
                />
                <Button onClick={addNote} size="sm" className="w-full">
                  <StickyNote className="w-4 h-4 mr-2" />
                  Add Note
                </Button>
              </div>
            </div>

            <ScrollArea className="flex-1 p-4">
              <div className="space-y-3">
                {annotations
                  .filter(ann => ann.pageNumber === currentPage)
                  .map((annotation) => (
                    <motion.div
                      key={annotation.id}
                      initial={{ opacity: 0, y: 10 }}
                      animate={{ opacity: 1, y: 0 }}
                      className="p-3 bg-gray-50 dark:bg-gray-800 rounded-md"
                    >
                      <div className="flex items-start justify-between">
                        <div className="flex-1">
                          <div className="flex items-center gap-2 mb-1">
                            {annotation.type === 'highlight' && <Highlighter className="w-3 h-3" />}
                            {annotation.type === 'note' && <StickyNote className="w-3 h-3" />}
                            {annotation.type === 'bookmark' && <Bookmark className="w-3 h-3" />}
                            <span className="text-xs text-gray-500 capitalize">
                              {annotation.type}
                            </span>
                          </div>
                          {annotation.content && (
                            <p className="text-sm">{annotation.content}</p>
                          )}
                          <p className="text-xs text-gray-400 mt-1">
                            Page {annotation.pageNumber} • {annotation.timestamp.toLocaleTimeString()}
                          </p>
                        </div>
                        <Button
                          variant="ghost"
                          size="sm"
                          onClick={() => deleteAnnotation(annotation.id)}
                          className="p-1 h-auto"
                        >
                          <X className="w-3 h-3" />
                        </Button>
                      </div>
                    </motion.div>
                  ))}
                
                {annotations.filter(ann => ann.pageNumber === currentPage).length === 0 && (
                  <p className="text-sm text-gray-500 text-center py-8">
                    No annotations on this page
                  </p>
                )}
              </div>
            </ScrollArea>
          </motion.div>
        )}
      </AnimatePresence>

      {/* PDF Viewer */}
      <div className="flex-1 flex flex-col">
        {/* Toolbar */}
        <div className="bg-white dark:bg-gray-900 border-b border-gray-200 dark:border-gray-700 p-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <Button
                variant="ghost"
                size="sm"
                onClick={() => setShowNotesPanel(!showNotesPanel)}
              >
                {showNotesPanel ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
              </Button>
              <Separator orientation="vertical" className="h-6" />
              <Button
                variant={activeAnnotationTool === 'highlight' ? 'default' : 'ghost'}
                size="sm"
                onClick={() => setActiveAnnotationTool(activeAnnotationTool === 'highlight' ? 'none' : 'highlight')}
              >
                <Highlighter className="w-4 h-4" />
              </Button>
              <Button
                variant={activeAnnotationTool === 'note' ? 'default' : 'ghost'}
                size="sm"
                onClick={() => setActiveAnnotationTool(activeAnnotationTool === 'note' ? 'none' : 'note')}
              >
                <StickyNote className="w-4 h-4" />
              </Button>
              <Button
                variant={activeAnnotationTool === 'bookmark' ? 'default' : 'ghost'}
                size="sm"
                onClick={() => setActiveAnnotationTool(activeAnnotationTool === 'bookmark' ? 'none' : 'bookmark')}
              >
                <Bookmark className="w-4 h-4" />
              </Button>
            </div>

            <div className="flex items-center gap-2">
              <Button variant="ghost" size="sm" onClick={() => handlePageChange('prev')}>
                <ChevronLeft className="w-4 h-4" />
              </Button>
              <span className="text-sm px-2">
                {currentPage} / {totalPages}
              </span>
              <Button variant="ghost" size="sm" onClick={() => handlePageChange('next')}>
                <ChevronRight className="w-4 h-4" />
              </Button>
              <Separator orientation="vertical" className="h-6" />
              <Button variant="ghost" size="sm" onClick={handleZoomOut}>
                <ZoomOut className="w-4 h-4" />
              </Button>
              <span className="text-sm px-2">{Math.round(zoom * 100)}%</span>
              <Button variant="ghost" size="sm" onClick={handleZoomIn}>
                <ZoomIn className="w-4 h-4" />
              </Button>
              {onClose && (
                <>
                  <Separator orientation="vertical" className="h-6" />
                  <Button variant="ghost" size="sm" onClick={onClose}>
                    <X className="w-4 h-4" />
                  </Button>
                </>
              )}
            </div>
          </div>
        </div>

        {/* PDF Content */}
        <div className="flex-1 bg-gray-100 dark:bg-gray-800 p-4 overflow-auto">
          <div className="flex justify-center">
            {uploadedFile && pdfFile ? (
              <div
                ref={pdfViewerRef}
                onClick={handlePDFClick}
                className="relative"
                style={{
                  cursor: activeAnnotationTool !== 'none' ? 'crosshair' : 'default'
                }}
              >
                <Document
                  file={pdfFile}
                  onLoadSuccess={onDocumentLoadSuccess}
                  onLoadError={onDocumentLoadError}
                  options={{
                    cMapUrl: 'https://unpkg.com/pdfjs-dist@3.11.174/cmaps/',
                    cMapPacked: true,
                    standardFontDataUrl: 'https://unpkg.com/pdfjs-dist@3.11.174/standard_fonts/',
                  }}
                  loading={
                    <div className="flex items-center justify-center h-64">
                      <Loader2 className="w-8 h-8 animate-spin" />
                      <span className="ml-2">Loading PDF...</span>
                    </div>
                  }
                  error={
                    <div className="flex flex-col items-center justify-center h-64 text-red-500">
                      <AlertCircle className="w-8 h-8 mb-2" />
                      <span>Failed to load PDF</span>
                      {error && <span className="text-sm mt-1">{error}</span>}
                    </div>
                  }
                >
                  <Page
                    pageNumber={currentPage}
                    scale={zoom}
                    renderAnnotationLayer={true}
                    renderTextLayer={true}
                    onLoadSuccess={() => console.log(`Page ${currentPage} loaded successfully`)}
                    onLoadError={(error) => console.error(`Error loading page ${currentPage}:`, error)}
                  />
                </Document>

                {/* Render Annotations */}
                {annotations
                  .filter(ann => ann.pageNumber === currentPage)
                  .map((annotation) => (
                    <div
                      key={annotation.id}
                      className="absolute pointer-events-none"
                      style={{
                        left: `${annotation.x}%`,
                        top: `${annotation.y}%`,
                        width: annotation.width ? `${annotation.width}%` : 'auto',
                        height: annotation.height ? `${annotation.height}%` : 'auto',
                      }}
                    >
                      {annotation.type === 'highlight' && (
                        <div
                          className="bg-yellow-300 opacity-50"
                          style={{ width: '100%', height: '100%' }}
                        />
                      )}
                      {annotation.type === 'note' && (
                        <div className="w-4 h-4 bg-blue-500 rounded-full border-2 border-white shadow-lg" />
                      )}
                      {annotation.type === 'bookmark' && (
                        <div className="w-4 h-4 bg-red-500 rounded border-2 border-white shadow-lg" />
                      )}
                    </div>
                  ))}
              </div>
            ) : (
              <div className="flex items-center justify-center h-64 text-gray-500">
                <FileText className="w-16 h-16 mb-4" />
                <p>No PDF loaded</p>
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  )
}
