import React, { useEffect, useRef, useState, useCallback } from 'react';
import * as pdfjsLib from 'pdfjs-dist';
import { PDFDocumentProxy } from 'pdfjs-dist';

// Set up PDF.js worker
pdfjsLib.GlobalWorkerOptions.workerSrc = `//cdnjs.cloudflare.com/ajax/libs/pdf.js/3.11.174/pdf.worker.min.js`;

interface PDFViewerProps {
  url: string;
  onClose?: () => void;
}

interface Annotation {
  id: string;
  pageNumber: number;
  x: number;
  y: number;
  width: number;
  height: number;
  text: string;
  type: 'highlight' | 'note';
  color: string;
}

interface PageInfo {
  pageNumber: number;
  totalPages: number;
}

export const PDFViewer: React.FC<PDFViewerProps> = ({ url, onClose }) => {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const canvas2Ref = useRef<HTMLCanvasElement>(null);
  const containerRef = useRef<HTMLDivElement>(null);
  const [pdfDoc, setPdfDoc] = useState<PDFDocumentProxy | null>(null);
  const [pageInfo, setPageInfo] = useState<PageInfo>({ pageNumber: 1, totalPages: 0 });
  const [scale, setScale] = useState(1.0);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [searchTerm, setSearchTerm] = useState('');
  const [searchMatches, setSearchMatches] = useState<any[]>([]);
  const [currentMatch, setCurrentMatch] = useState(0);
  const [annotations, setAnnotations] = useState<Annotation[]>([]);
  const [isAnnotating, setIsAnnotating] = useState(false);
  const [annotationType, setAnnotationType] = useState<'highlight' | 'note'>('highlight');
  const [isTransitioning, setIsTransitioning] = useState(false);
  const [viewMode, setViewMode] = useState<'single' | 'spread'>('single');

  // Load PDF document
  useEffect(() => {
    const loadPDF = async () => {
      try {
        setIsLoading(true);
        setError(null);
        
        const loadingTask = pdfjsLib.getDocument(url);
        const pdf = await loadingTask.promise;
        
        setPdfDoc(pdf);
        setPageInfo(prev => ({ ...prev, totalPages: pdf.numPages }));
        setIsLoading(false);
      } catch (err) {
        console.error('Error loading PDF:', err);
        setError('Failed to load PDF document');
        setIsLoading(false);
      }
    };

    loadPDF();
  }, [url]);

  // Render current page(s)
  const renderPage = useCallback(async (pageNumber: number) => {
    if (!pdfDoc || !canvasRef.current) return;

    try {
      if (viewMode === 'single') {
        // Single page view
        await renderSinglePage(pageNumber, canvasRef.current);
      } else {
        // Two-page spread view
        await renderSpreadPages(pageNumber, canvasRef.current, canvas2Ref.current);
      }
      
      setPageInfo(prev => ({ ...prev, pageNumber }));
    } catch (err) {
      console.error('Error rendering page:', err);
      setError('Failed to render PDF page');
    }
  }, [pdfDoc, scale, viewMode]);

  // Render single page
  const renderSinglePage = async (pageNumber: number, canvas: HTMLCanvasElement) => {
    const page = await pdfDoc!.getPage(pageNumber);
    const context = canvas.getContext('2d');
    
    if (!context) return;

    // Calculate scale to fit container
    const containerWidth = containerRef.current?.clientWidth || 800;
    const viewport = page.getViewport({ scale: 1 });
    const calculatedScale = Math.min((containerWidth - 40) / viewport.width, scale);
    
    const scaledViewport = page.getViewport({ scale: calculatedScale });
    
    canvas.height = scaledViewport.height;
    canvas.width = scaledViewport.width;
    
    // Apply dark theme styling to canvas
    canvas.style.backgroundColor = '#2d2d2d';
    canvas.style.filter = 'invert(0.9) hue-rotate(180deg)';
    
    const renderContext = {
      canvasContext: context,
      viewport: scaledViewport,
    };

    await page.render(renderContext).promise;
  };

  // Render two-page spread
  const renderSpreadPages = async (leftPageNumber: number, leftCanvas: HTMLCanvasElement, rightCanvas: HTMLCanvasElement | null) => {
    const containerWidth = containerRef.current?.clientWidth || 800;
    const availableWidth = (containerWidth - 60) / 2; // Space for two pages with gap

    // Render left page
    const leftPage = await pdfDoc!.getPage(leftPageNumber);
    const leftContext = leftCanvas.getContext('2d');
    
    if (leftContext) {
      const leftViewport = leftPage.getViewport({ scale: 1 });
      const leftScale = Math.min(availableWidth / leftViewport.width, scale);
      const leftScaledViewport = leftPage.getViewport({ scale: leftScale });
      
      leftCanvas.height = leftScaledViewport.height;
      leftCanvas.width = leftScaledViewport.width;
      leftCanvas.style.backgroundColor = '#2d2d2d';
      leftCanvas.style.filter = 'invert(0.9) hue-rotate(180deg)';
      
      await leftPage.render({
        canvasContext: leftContext,
        viewport: leftScaledViewport,
      }).promise;
    }

    // Render right page (if exists and canvas is available)
    const rightPageNumber = leftPageNumber + 1;
    if (rightPageNumber <= pageInfo.totalPages && rightCanvas) {
      const rightPage = await pdfDoc!.getPage(rightPageNumber);
      const rightContext = rightCanvas.getContext('2d');
      
      if (rightContext) {
        const rightViewport = rightPage.getViewport({ scale: 1 });
        const rightScale = Math.min(availableWidth / rightViewport.width, scale);
        const rightScaledViewport = rightPage.getViewport({ scale: rightScale });
        
        rightCanvas.height = rightScaledViewport.height;
        rightCanvas.width = rightScaledViewport.width;
        rightCanvas.style.backgroundColor = '#2d2d2d';
        rightCanvas.style.filter = 'invert(0.9) hue-rotate(180deg)';
        
        await rightPage.render({
          canvasContext: rightContext,
          viewport: rightScaledViewport,
        }).promise;
      }
    } else if (rightCanvas) {
      // Clear the right canvas if no page to display
      const rightContext = rightCanvas.getContext('2d');
      if (rightContext) {
        rightContext.clearRect(0, 0, rightCanvas.width, rightCanvas.height);
        rightCanvas.style.backgroundColor = '#2d2d2d';
      }
    }
  };

  // Re-render when page, scale, or view mode changes
  useEffect(() => {
    if (pdfDoc) {
      renderPage(pageInfo.pageNumber);
    }
  }, [pdfDoc, pageInfo.pageNumber, scale, viewMode, renderPage]);

  // Keyboard navigation
  useEffect(() => {
    const handleKeyDown = (event: KeyboardEvent) => {
      // Only handle if PDF viewer is focused or if no input is focused
      const activeElement = document.activeElement;
      const isInputFocused = activeElement?.tagName === 'INPUT' || activeElement?.tagName === 'TEXTAREA';
      
      if (isInputFocused) return;

      switch (event.key) {
        case 'ArrowLeft':
        case 'ArrowUp':
          event.preventDefault();
          prevPage();
          break;
        case 'ArrowRight':
        case 'ArrowDown':
          event.preventDefault();
          nextPage();
          break;
        case 'Home':
          event.preventDefault();
          goToPage(1);
          break;
        case 'End':
          event.preventDefault();
          goToPage(pageInfo.totalPages);
          break;
        case 'PageUp':
          event.preventDefault();
          prevPage();
          break;
        case 'PageDown':
          event.preventDefault();
          nextPage();
          break;
        case '+':
        case '=':
          if (event.ctrlKey) {
            event.preventDefault();
            zoomIn();
          }
          break;
        case '-':
          if (event.ctrlKey) {
            event.preventDefault();
            zoomOut();
          }
          break;
        case '0':
          if (event.ctrlKey) {
            event.preventDefault();
            zoomFit();
          }
          break;
      }
    };

    // Add event listener when component mounts
    document.addEventListener('keydown', handleKeyDown);
    
    // Cleanup event listener when component unmounts
    return () => {
      document.removeEventListener('keydown', handleKeyDown);
    };
  }, [pageInfo.pageNumber, pageInfo.totalPages]);

  // Scroll wheel navigation
  useEffect(() => {
    const handleWheel = (event: WheelEvent) => {
      // Only handle wheel events on the PDF content area
      const target = event.target as HTMLElement;
      const pdfContent = containerRef.current?.querySelector('.pdf-content');
      
      if (!pdfContent?.contains(target)) return;

      // Check if Ctrl key is pressed for zoom
      if (event.ctrlKey) {
        event.preventDefault();
        if (event.deltaY < 0) {
          zoomIn();
        } else {
          zoomOut();
        }
        return;
      }

      // Page navigation with scroll
      if (Math.abs(event.deltaY) > 50) { // Threshold to prevent accidental page changes
        if (event.deltaY < 0) {
          // Scrolling up - go to previous page
          prevPage();
        } else {
          // Scrolling down - go to next page
          nextPage();
        }
        event.preventDefault();
      }
    };

    // Add event listener to the container
    const container = containerRef.current;
    if (container) {
      container.addEventListener('wheel', handleWheel, { passive: false });
      
      return () => {
        container.removeEventListener('wheel', handleWheel);
      };
    }
  }, [pageInfo.pageNumber, pageInfo.totalPages]);

  // Navigation functions
  const goToPage = (pageNumber: number) => {
    if (pageNumber >= 1 && pageNumber <= pageInfo.totalPages && pageNumber !== pageInfo.pageNumber) {
      setIsTransitioning(true);
      setPageInfo(prev => ({ ...prev, pageNumber }));
      
      // Reset transition state after a brief delay
      setTimeout(() => setIsTransitioning(false), 200);
    }
  };

  const nextPage = () => {
    if (viewMode === 'spread') {
      // In spread view, advance by 2 pages, but don't go beyond total pages
      const nextPageNum = Math.min(pageInfo.pageNumber + 2, pageInfo.totalPages);
      goToPage(nextPageNum);
    } else {
      goToPage(pageInfo.pageNumber + 1);
    }
  };
  
  const prevPage = () => {
    if (viewMode === 'spread') {
      // In spread view, go back by 2 pages, but not below 1
      const prevPageNum = Math.max(pageInfo.pageNumber - 2, 1);
      goToPage(prevPageNum);
    } else {
      goToPage(pageInfo.pageNumber - 1);
    }
  };

  // Zoom functions
  const zoomIn = () => setScale(prev => Math.min(prev + 0.25, 3.0));
  const zoomOut = () => setScale(prev => Math.max(prev - 0.25, 0.25));
  const zoomFit = () => setScale(1.0);

  // Search functionality
  const searchInPDF = async (term: string) => {
    if (!pdfDoc || !term.trim()) {
      setSearchMatches([]);
      return;
    }

    const matches: any[] = [];
    
    for (let i = 1; i <= pdfDoc.numPages; i++) {
      try {
        const page = await pdfDoc.getPage(i);
        const textContent = await page.getTextContent();
        const textItems = textContent.items as any[];
        
        textItems.forEach((item, index) => {
          if (item.str && item.str.toLowerCase().includes(term.toLowerCase())) {
            matches.push({
              page: i,
              text: item.str,
              index,
              transform: item.transform
            });
          }
        });
      } catch (err) {
        console.error(`Error searching page ${i}:`, err);
      }
    }
    
    setSearchMatches(matches);
    setCurrentMatch(0);
    
    if (matches.length > 0) {
      goToPage(matches[0].page);
    }
  };

  // Print function
  const printPDF = () => {
    if (url) {
      const printWindow = window.open(url, '_blank');
      if (printWindow) {
        printWindow.onload = () => {
          printWindow.print();
        };
      }
    }
  };

  // Download function
  const downloadPDF = () => {
    const link = document.createElement('a');
    link.href = url;
    link.download = 'document.pdf';
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  if (isLoading) {
    return (
      <div className="pdf-viewer-container">
        <div className="pdf-loading">
          <div className="loading-spinner"></div>
          <p>Loading PDF...</p>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="pdf-viewer-container">
        <div className="pdf-error">
          <p>Error: {error}</p>
          {onClose && (
            <button onClick={onClose} className="pdf-close-btn">
              Close
            </button>
          )}
        </div>
      </div>
    );
  }

  return (
    <div className="pdf-viewer-container" ref={containerRef}>
      {/* Toolbar */}
      <div className="pdf-toolbar">
        <div className="pdf-toolbar-left">
          <button 
            onClick={prevPage} 
            disabled={pageInfo.pageNumber <= 1}
            className="pdf-btn"
            title={viewMode === 'spread' ? 'Previous pages' : 'Previous page'}
          >
            ←
          </button>
          <span className="pdf-page-info">
            <input
              type="number"
              value={pageInfo.pageNumber}
              onChange={(e) => goToPage(parseInt(e.target.value) || 1)}
              min={1}
              max={pageInfo.totalPages}
              className="pdf-page-input"
            />
            {viewMode === 'spread' && pageInfo.pageNumber < pageInfo.totalPages ? 
              `- ${Math.min(pageInfo.pageNumber + 1, pageInfo.totalPages)}` : ''
            } / {pageInfo.totalPages}
          </span>
          <button 
            onClick={nextPage} 
            disabled={viewMode === 'spread' ? pageInfo.pageNumber >= pageInfo.totalPages - 1 : pageInfo.pageNumber >= pageInfo.totalPages}
            className="pdf-btn"
            title={viewMode === 'spread' ? 'Next pages' : 'Next page'}
          >
            →
          </button>
        </div>

        <div className="pdf-toolbar-center">
          <button onClick={zoomOut} className="pdf-btn" title="Zoom out">
            −
          </button>
          <span className="pdf-zoom-info">{Math.round(scale * 100)}%</span>
          <button onClick={zoomIn} className="pdf-btn" title="Zoom in">
            +
          </button>
          <button onClick={zoomFit} className="pdf-btn" title="Fit to width">
            Fit
          </button>
          <button 
            onClick={() => setViewMode(viewMode === 'single' ? 'spread' : 'single')}
            className={`pdf-btn ${viewMode === 'spread' ? 'active' : ''}`}
            title={viewMode === 'single' ? 'Switch to two-page view' : 'Switch to single-page view'}
          >
            {viewMode === 'single' ? '📄📄' : '📄'}
          </button>
        </div>

        <div className="pdf-toolbar-right">
          <div className="pdf-search">
            <input
              type="text"
              placeholder="Search..."
              value={searchTerm}
              onChange={(e) => {
                setSearchTerm(e.target.value);
                if (e.target.value.trim()) {
                  searchInPDF(e.target.value);
                } else {
                  setSearchMatches([]);
                }
              }}
              className="pdf-search-input"
            />
            {searchMatches.length > 0 && (
              <span className="pdf-search-results">
                {currentMatch + 1} of {searchMatches.length}
              </span>
            )}
          </div>
          <div className="pdf-annotation-controls">
            <button 
              onClick={() => {
                setIsAnnotating(!isAnnotating);
                setAnnotationType('highlight');
              }}
              className={`pdf-btn ${isAnnotating && annotationType === 'highlight' ? 'active' : ''}`}
              title="Highlight text"
            >
              ✏️
            </button>
            <button 
              onClick={() => {
                setIsAnnotating(!isAnnotating);
                setAnnotationType('note');
              }}
              className={`pdf-btn ${isAnnotating && annotationType === 'note' ? 'active' : ''}`}
              title="Add note"
            >
              📝
            </button>
          </div>
          <button onClick={printPDF} className="pdf-btn" title="Print">
            Print
          </button>
          <button onClick={downloadPDF} className="pdf-btn" title="Download">
            Download
          </button>
          {onClose && (
            <button onClick={onClose} className="pdf-btn pdf-close-btn" title="Close">
              ×
            </button>
          )}
        </div>
      </div>

      {/* PDF Canvas */}
      <div 
        className="pdf-content" 
        tabIndex={0}
        onFocus={() => {
          // Visual indication that PDF viewer is focused for keyboard navigation
        }}
      >
        <div className={`pdf-canvas-container ${viewMode}`}>
          <canvas 
            ref={canvasRef} 
            className={`pdf-canvas ${isTransitioning ? 'transitioning' : ''}`} 
          />
          {viewMode === 'spread' && (
            <canvas 
              ref={canvas2Ref} 
              className={`pdf-canvas pdf-canvas-right ${isTransitioning ? 'transitioning' : ''}`} 
            />
          )}
        </div>
        
        {/* Navigation hint overlay */}
        <div className="pdf-navigation-hint">
          <div className="hint-text">
            <span>🖱️ Scroll to navigate pages</span>
            <span>← → Arrow keys for page navigation</span>
            <span>Ctrl + Scroll for zoom</span>
            <span>📄 Toggle between single/two-page view</span>
          </div>
        </div>
      </div>

      {/* Search navigation */}
      {searchMatches.length > 0 && (
        <div className="pdf-search-nav">
          <button 
            onClick={() => {
              const newMatch = Math.max(0, currentMatch - 1);
              setCurrentMatch(newMatch);
              goToPage(searchMatches[newMatch].page);
            }}
            disabled={currentMatch <= 0}
            className="pdf-btn"
          >
            ↑
          </button>
          <button 
            onClick={() => {
              const newMatch = Math.min(searchMatches.length - 1, currentMatch + 1);
              setCurrentMatch(newMatch);
              goToPage(searchMatches[newMatch].page);
            }}
            disabled={currentMatch >= searchMatches.length - 1}
            className="pdf-btn"
          >
            ↓
          </button>
        </div>
      )}
    </div>
  );
};

export default PDFViewer;