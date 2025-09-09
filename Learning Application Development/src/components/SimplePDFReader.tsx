import { useState, useRef } from 'react'
import { Document, Page, pdfjs } from 'react-pdf'
import { X, Upload, Loader2, AlertCircle, FolderOpen, ZoomIn, ZoomOut, RotateCw } from 'lucide-react'
import { Button } from './ui/button'

import 'react-pdf/dist/Page/AnnotationLayer.css'
import 'react-pdf/dist/Page/TextLayer.css'

// Configure PDF.js worker
if (typeof window !== 'undefined') {
  // Try local worker first, fallback to CDN
  pdfjs.GlobalWorkerOptions.workerSrc = '/pdf.worker.min.js'
  
  // Test if worker loads, fallback to CDN if not
  const testWorker = () => {
    try {
      const worker = new Worker('/pdf.worker.min.js')
      worker.terminate()
      console.log('✅ Using local PDF worker')
    } catch (error) {
      console.log('❌ Local worker failed, using CDN:', error)
      pdfjs.GlobalWorkerOptions.workerSrc = 'https://unpkg.com/pdfjs-dist@3.11.174/build/pdf.worker.min.js'
    }
  }
  testWorker()
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

interface SimplePDFReaderProps {
  onClose: () => void
  document?: DocumentFile | null
}

export function SimplePDFReader({ onClose, document }: SimplePDFReaderProps) {
  const [uploadedFile, setUploadedFile] = useState<File | null>(document?.content || null)
  const [numPages, setNumPages] = useState<number>(0)
  const [pageNumber, setPageNumber] = useState<number>(1)
  const [loading, setLoading] = useState<boolean>(false)
  const [error, setError] = useState<string>('')
  const [scale, setScale] = useState<number>(1.2)
  const [rotation, setRotation] = useState<number>(0)
  const [debugInfo, setDebugInfo] = useState<string>('')
  const fileInputRef = useRef<HTMLInputElement>(null)

  const onDocumentLoadSuccess = ({ numPages }: { numPages: number }) => {
    console.log('PDF loaded successfully, pages:', numPages)
    setDebugInfo(`✅ PDF loaded: ${numPages} pages`)
    setNumPages(numPages)
    setPageNumber(1)
    setLoading(false)
    setError('')
  }

  const onDocumentLoadError = (error: Error) => {
    console.error('PDF load error:', error)
    setDebugInfo(`❌ Load error: ${error.message}`)
    setError(`Failed to load PDF: ${error.message}`)
    setLoading(false)
  }

  const onPageLoadSuccess = () => {
    console.log('Page rendered successfully')
    setDebugInfo(prev => prev + ` | Page ${pageNumber} rendered ✅`)
  }

  const onPageLoadError = (error: Error) => {
    console.error('Page render error:', error)
    setDebugInfo(prev => prev + ` | Page render error: ${error.message}`)
  }

  const handleFileSelect = (file: File) => {
    console.log('File selected:', file.name, 'Size:', (file.size / 1024 / 1024).toFixed(2), 'MB')
    setDebugInfo(`📁 File selected: ${file.name} (${(file.size / 1024 / 1024).toFixed(2)} MB)`)
    
    if (file.type !== 'application/pdf') {
      setError('Please select a PDF file')
      return
    }
    
    // Remove file size limit - handle large files
    if (file.size > 100 * 1024 * 1024) { // Only warn for files > 100MB
      console.warn('Large file detected:', (file.size / 1024 / 1024).toFixed(2), 'MB')
    }
    
    setUploadedFile(file)
    setLoading(true)
    setError('')
    setDebugInfo(prev => prev + ' | 🔄 Loading...')
  }

  const handleZoomIn = () => setScale(prev => Math.min(prev + 0.2, 3.0))
  const handleZoomOut = () => setScale(prev => Math.max(prev - 0.2, 0.5))
  const handleRotate = () => setRotation(prev => (prev + 90) % 360)

  const generateTestPDF = async () => {
    try {
      // Create a more comprehensive test PDF with jsPDF
      const { jsPDF } = await import('jspdf')
      const doc = new jsPDF()
      
      // Page 1
      doc.setFontSize(20)
      doc.text('Test PDF Document', 20, 30)
      doc.setFontSize(12)
      doc.text('This is a test PDF generated for the PDF Reader application.', 20, 50)
      doc.text('Features to test:', 20, 70)
      doc.text('• Page navigation', 30, 85)
      doc.text('• Zoom in/out controls', 30, 100)
      doc.text('• Rotation functionality', 30, 115)
      doc.text('• Text selection and copying', 30, 130)
      
      // Add some sample content
      const sampleText = 'Lorem ipsum dolor sit amet, consectetur adipiscing elit. Sed do eiusmod tempor incididunt ut labore et dolore magna aliqua. Ut enim ad minim veniam, quis nostrud exercitation ullamco laboris nisi ut aliquip ex ea commodo consequat.'
      doc.text(doc.splitTextToSize(sampleText, 170), 20, 150)
      
      // Page 2
      doc.addPage()
      doc.setFontSize(16)
      doc.text('Page 2 - More Content', 20, 30)
      doc.setFontSize(12)
      doc.text('This is the second page to test navigation.', 20, 50)
      
      // Add a simple table
      doc.text('Sample Table:', 20, 80)
      doc.line(20, 85, 190, 85)
      doc.text('Column 1', 25, 95)
      doc.text('Column 2', 80, 95)
      doc.text('Column 3', 135, 95)
      doc.line(20, 100, 190, 100)
      doc.text('Row 1 Data', 25, 110)
      doc.text('More Data', 80, 110)
      doc.text('Additional', 135, 110)
      doc.text('Row 2 Data', 25, 125)
      doc.text('Information', 80, 125)
      doc.text('Content', 135, 125)
      
      // Page 3
      doc.addPage()
      doc.setFontSize(16)
      doc.text('Page 3 - Final Page', 20, 30)
      doc.setFontSize(12)
      doc.text('This PDF has multiple pages to test the navigation features.', 20, 50)
      doc.text('You can use the page controls to navigate between pages.', 20, 70)
      
      const pdfBlob = doc.output('blob')
      const file = new File([pdfBlob], 'test-document.pdf', { type: 'application/pdf' })
      handleFileSelect(file)
    } catch (error) {
      console.error('Error generating test PDF:', error)
      setError('Failed to generate test PDF. Please try selecting a file instead.')
    }
  }

  // Upload screen
  if (!uploadedFile) {
    return (
      <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50">
        <div className="bg-white rounded-lg p-6 max-w-2xl w-full mx-4 max-h-[80vh] overflow-y-auto">
          <div className="flex items-center justify-between mb-6">
            <h2 className="text-2xl font-bold">Open PDF File</h2>
            <Button variant="ghost" size="sm" onClick={onClose}>
              <X className="w-4 h-4" />
            </Button>
          </div>
          
          {/* File Browser Style Interface */}
          <div className="space-y-4">
            <div className="text-sm text-gray-600 mb-4">
              Select a PDF file from your computer. No file size limits - all processing is done locally.
            </div>
            
            {/* Main File Selection Area */}
            <div
              onClick={() => fileInputRef.current?.click()}
              className="border-2 border-dashed border-blue-300 rounded-lg p-12 text-center cursor-pointer hover:border-blue-500 hover:bg-blue-50 transition-colors"
            >
              <FolderOpen className="w-16 h-16 mx-auto mb-4 text-blue-400" />
              <h3 className="text-lg font-semibold mb-2">Choose PDF File</h3>
              <p className="text-sm text-gray-600 mb-4">
                Click here to browse and select a PDF file from your computer
              </p>
              <p className="text-xs text-gray-500">
                Supports files of any size • Local processing only • No upload to servers
              </p>
              <input
                ref={fileInputRef}
                type="file"
                accept=".pdf,application/pdf"
                onChange={(e) => {
                  const file = e.target.files?.[0]
                  if (file) handleFileSelect(file)
                }}
                className="hidden"
              />
            </div>
            
            {/* Quick Actions */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mt-6">
              <Button 
                onClick={() => fileInputRef.current?.click()} 
                variant="outline" 
                className="h-12 flex items-center justify-center gap-3"
              >
                <FolderOpen className="w-5 h-5" />
                Browse Files
              </Button>
              <Button 
                onClick={generateTestPDF} 
                variant="outline" 
                className="h-12 flex items-center justify-center gap-3"
              >
                <Upload className="w-5 h-5" />
                Generate Test PDF
              </Button>
            </div>
            
            {/* File Type Info */}
            <div className="mt-6 p-4 bg-gray-50 rounded-lg">
              <h4 className="font-medium mb-2">Supported Features:</h4>
              <ul className="text-sm text-gray-600 space-y-1">
                <li>• PDF files of any size (no limitations)</li>
                <li>• Zoom in/out and page navigation</li>
                <li>• Text selection and search</li>
                <li>• Local processing - no data sent to servers</li>
                <li>• Fast loading with progressive rendering</li>
              </ul>
            </div>
          </div>
          
          {error && (
            <div className="mt-6 p-4 bg-red-50 border border-red-200 rounded-md">
              <div className="flex items-center text-red-600">
                <AlertCircle className="w-5 h-5 mr-3" />
                <div>
                  <p className="font-medium">Error</p>
                  <p className="text-sm">{error}</p>
                </div>
              </div>
            </div>
          )}
        </div>
      </div>
    )
  }

  // PDF viewer screen
  return (
    <div className="fixed inset-0 bg-white z-50 flex flex-col">
      {/* Header */}
      <div className="flex items-center justify-between p-4 border-b bg-gray-50">
        <div className="flex-1">
          <h1 className="text-xl font-bold">PDF Reader</h1>
          <p className="text-sm text-gray-600 truncate max-w-md">
            {uploadedFile.name} ({(uploadedFile.size / 1024 / 1024).toFixed(2)} MB)
          </p>
        </div>
        
        {/* Controls */}
        <div className="flex items-center gap-3">
          {/* Zoom Controls */}
          <div className="flex items-center gap-1 border rounded-md">
            <Button
              variant="ghost"
              size="sm"
              onClick={handleZoomOut}
              className="h-8 px-2"
              title="Zoom Out"
            >
              <ZoomOut className="w-4 h-4" />
            </Button>
            <span className="px-2 text-sm min-w-[4rem] text-center">
              {Math.round(scale * 100)}%
            </span>
            <Button
              variant="ghost"
              size="sm"
              onClick={handleZoomIn}
              className="h-8 px-2"
              title="Zoom In"
            >
              <ZoomIn className="w-4 h-4" />
            </Button>
          </div>
          
          {/* Rotate Button */}
          <Button
            variant="ghost"
            size="sm"
            onClick={handleRotate}
            className="h-8 px-2"
            title="Rotate"
          >
            <RotateCw className="w-4 h-4" />
          </Button>
          
          {/* Page Navigation */}
          {numPages > 0 && (
            <div className="flex items-center gap-2 border rounded-md p-1">
              <Button
                variant="ghost"
                size="sm"
                onClick={() => setPageNumber(Math.max(1, pageNumber - 1))}
                disabled={pageNumber <= 1}
                className="h-8 px-3"
              >
                ←
              </Button>
              <div className="px-2">
                <input
                  type="number"
                  value={pageNumber}
                  onChange={(e) => {
                    const page = parseInt(e.target.value)
                    if (page >= 1 && page <= numPages) {
                      setPageNumber(page)
                    }
                  }}
                  className="w-12 text-center text-sm border-0 bg-transparent"
                  min={1}
                  max={numPages}
                />
                <span className="text-sm text-gray-500">/ {numPages}</span>
              </div>
              <Button
                variant="ghost"
                size="sm"
                onClick={() => setPageNumber(Math.min(numPages, pageNumber + 1))}
                disabled={pageNumber >= numPages}
                className="h-8 px-3"
              >
                →
              </Button>
            </div>
          )}
          
          <Button variant="ghost" size="sm" onClick={onClose} className="h-8 px-2">
            <X className="w-4 h-4" />
          </Button>
        </div>
      </div>

      {/* PDF Content */}
      <div className="flex-1 overflow-auto bg-gray-100 flex flex-col">
        {/* Debug Info Bar */}
        {debugInfo && (
          <div className="bg-blue-50 border-b p-2 text-xs text-blue-700">
            <strong>Debug:</strong> {debugInfo}
          </div>
        )}
        
        <div className="flex-1 flex items-center justify-center p-4">
          {loading && (
            <div className="text-center">
              <Loader2 className="w-12 h-12 animate-spin mx-auto mb-4 text-blue-500" />
              <p className="text-lg font-medium">Loading PDF...</p>
              <p className="text-sm text-gray-600 mt-2">
                Processing {(uploadedFile.size / 1024 / 1024).toFixed(2)} MB file
              </p>
            </div>
          )}
          
          {error && (
            <div className="text-center text-red-500 max-w-md">
              <AlertCircle className="w-12 h-12 mx-auto mb-4" />
              <p className="text-lg font-medium mb-2">Failed to load PDF</p>
              <p className="text-sm bg-red-50 p-3 rounded">{error}</p>
              <Button 
                onClick={() => setUploadedFile(null)} 
                variant="outline" 
                className="mt-4"
              >
                Choose Different File
              </Button>
            </div>
          )}
          
          {uploadedFile && !loading && !error && (
            <div className="max-w-full">
              <Document
                file={uploadedFile}
                onLoadSuccess={onDocumentLoadSuccess}
                onLoadError={onDocumentLoadError}
                loading={
                  <div className="text-center p-8">
                    <Loader2 className="w-8 h-8 animate-spin mx-auto mb-4 text-blue-500" />
                    <p>Initializing PDF...</p>
                  </div>
                }
                error={
                  <div className="text-center text-red-500 p-8">
                    <AlertCircle className="w-8 h-8 mx-auto mb-4" />
                    <p>Failed to initialize PDF</p>
                  </div>
                }
                options={{
                  cMapUrl: 'https://unpkg.com/pdfjs-dist@3.11.174/cmaps/',
                  cMapPacked: true,
                  standardFontDataUrl: 'https://unpkg.com/pdfjs-dist@3.11.174/standard_fonts/',
                }}
              >
                {numPages > 0 && (
                  <Page 
                    pageNumber={pageNumber} 
                    scale={scale}
                    rotate={rotation}
                    onLoadSuccess={onPageLoadSuccess}
                    onLoadError={onPageLoadError}
                    renderAnnotationLayer={true}
                    renderTextLayer={true}
                    className="shadow-lg"
                    loading={
                      <div className="text-center p-4">
                        <Loader2 className="w-6 h-6 animate-spin mx-auto mb-2" />
                        <p className="text-sm">Rendering page {pageNumber}...</p>
                      </div>
                    }
                    error={
                      <div className="text-center p-4 text-red-500">
                        <p className="text-sm">Failed to render page {pageNumber}</p>
                      </div>
                    }
                  />
                )}
              </Document>
            </div>
          )}
        </div>
      </div>
    </div>
  )
}
