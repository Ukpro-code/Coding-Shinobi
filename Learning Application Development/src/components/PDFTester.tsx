import { useState } from 'react'
import { Document, Page, pdfjs } from 'react-pdf'
import { Button } from './ui/button'

// Simple worker config
pdfjs.GlobalWorkerOptions.workerSrc = 'https://unpkg.com/pdfjs-dist@3.11.174/build/pdf.worker.min.js'

export function PDFTester() {
  const [showTest, setShowTest] = useState(false)
  const [status, setStatus] = useState('')

  const createMinimalPDF = () => {
    // Create minimal PDF as a data URL
    const pdfBase64 = `
JVBERi0xLjQKMSAwIG9iago8PAovVHlwZSAvQ2F0YWxvZwovUGFnZXMgMiAwIFIKPj4KZW5kb2JqCjIgMCBvYmoKPDwKL1R5cGUgL1BhZ2VzCi9LaWRzIFszIDAgUl0KL0NvdW50IDEKPD4KZW5kb2JqCjMgMCBvYmoKPDwKL1R5cGUgL1BhZ2UKL1BhcmVudCAyIDAgUgovTWVkaWFCb3ggWzAgMCA2MTIgNzkyXQovQ29udGVudHMgNCAwIFIKPj4KZW5kb2JqCjQgMCBvYmoKPDwKL0xlbmd0aCA1NAo+PgpzdHJlYW0KQlQKL0YxIDEyIFRmCjEwMCA3MDAgVGQKKFRlc3QgUERGIC0gTWluaW1hbCkgVGoKRVQKZW5kc3RyZWFtCmVuZG9iagp4cmVmCjAgNQowMDAwMDAwMDAwIDY1NTM1IGYgCjAwMDAwMDAwMDkgMDAwMDAgbiAKMDAwMDAwMDA1OCAwMDAwMCBuIAowMDAwMDAwMTE1IDAwMDAwIG4gCjAwMDAwMDAyMDcgMDAwMDAgbiAKdHJhaWxlcgo8PAovU2l6ZSA1Ci9Sb290IDEgMCBSCj4+CnN0YXJ0eHJlZgozMTEKJSVFT0Y=`
    
    const binaryString = atob(pdfBase64.replace(/\s/g, ''))
    const len = binaryString.length
    const bytes = new Uint8Array(len)
    for (let i = 0; i < len; i++) {
      bytes[i] = binaryString.charCodeAt(i)
    }
    return new File([bytes], 'test.pdf', { type: 'application/pdf' })
  }

  const testPDF = createMinimalPDF()

  return (
    <div className="p-4 border rounded-lg bg-yellow-50">
      <h3 className="font-bold mb-2">PDF Debug Tester</h3>
      <div className="space-y-2">
        <Button onClick={() => setShowTest(!showTest)}>
          {showTest ? 'Hide' : 'Show'} PDF Test
        </Button>
        {status && <p className="text-sm text-blue-600">{status}</p>}
      </div>
      
      {showTest && (
        <div className="mt-4 p-4 border bg-white">
          <Document
            file={testPDF}
            onLoadSuccess={({ numPages }) => {
              setStatus(`✅ PDF loaded successfully with ${numPages} pages`)
            }}
            onLoadError={(error) => {
              setStatus(`❌ PDF load error: ${error.message}`)
            }}
            loading={<p>Loading minimal PDF...</p>}
            error={<p className="text-red-500">Failed to load PDF</p>}
          >
            <Page 
              pageNumber={1} 
              scale={0.8}
              onLoadSuccess={() => setStatus(prev => prev + ' | Page rendered ✅')}
              onLoadError={(error) => setStatus(prev => prev + ` | Page error: ${error.message}`)}
            />
          </Document>
        </div>
      )}
    </div>
  )
}
