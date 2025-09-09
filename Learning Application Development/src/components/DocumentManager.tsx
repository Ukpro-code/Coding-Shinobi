import { useState } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import { 
  FileText, 
  FolderPlus, 
  Folder, 
  MoreVertical, 
  Search,
  ArrowLeft,
  GridIcon,
  List,
  Filter
} from 'lucide-react'
import { Button } from './ui/button'
import { Card, CardContent } from './ui/card'
import { Badge } from './ui/badge'
import { Input } from './ui/input'
import { Separator } from './ui/separator'

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

interface DocumentFolder {
  id: string
  name: string
  color: string
  documentsCount: number
  createdAt: Date
}

interface DocumentManagerProps {
  onClose: () => void
  onOpenDocument: (doc: DocumentFile) => void
}

export function DocumentManager({ onClose, onOpenDocument }: DocumentManagerProps) {
  const [documents, setDocuments] = useState<DocumentFile[]>([
    {
      id: '1',
      name: 'React Development Guide.pdf',
      type: 'pdf',
      size: 2500000,
      uploadedAt: new Date('2024-01-15'),
      lastModified: new Date('2024-01-15'),
      folderId: 'dev',
      tags: ['react', 'frontend', 'development']
    },
    {
      id: '2',
      name: 'Database Design Principles.pdf',
      type: 'pdf',
      size: 1800000,
      uploadedAt: new Date('2024-01-20'),
      lastModified: new Date('2024-01-20'),
      folderId: 'db',
      tags: ['database', 'design', 'sql']
    }
  ])

  const [folders, setFolders] = useState<DocumentFolder[]>([
    {
      id: 'dev',
      name: 'Development',
      color: '#3b82f6',
      documentsCount: 1,
      createdAt: new Date('2024-01-01')
    },
    {
      id: 'db',
      name: 'Database',
      color: '#10b981',
      documentsCount: 1,
      createdAt: new Date('2024-01-01')
    },
    {
      id: 'ai',
      name: 'AI & ML',
      color: '#8b5cf6',
      documentsCount: 0,
      createdAt: new Date('2024-01-01')
    }
  ])

  const [selectedFolder, setSelectedFolder] = useState<string | null>(null)
  const [searchQuery, setSearchQuery] = useState('')
  const [viewMode, setViewMode] = useState<'grid' | 'list'>('grid')
  const [showNewFolderDialog, setShowNewFolderDialog] = useState(false)
  const [newFolderName, setNewFolderName] = useState('')
  const [isDragOver, setIsDragOver] = useState(false)

  const filteredDocuments = documents.filter(doc => {
    const matchesSearch = doc.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
                         doc.tags.some(tag => tag.toLowerCase().includes(searchQuery.toLowerCase()))
    const matchesFolder = selectedFolder ? doc.folderId === selectedFolder : true
    return matchesSearch && matchesFolder
  })

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
    const supportedFiles = files.filter(file => 
      file.type === 'application/pdf' || 
      file.name.endsWith('.docx') || 
      file.type === 'text/plain'
    )

    supportedFiles.forEach(file => {
      const newDoc: DocumentFile = {
        id: Date.now().toString() + Math.random().toString(36),
        name: file.name,
        type: file.type === 'application/pdf' ? 'pdf' : 
              file.name.endsWith('.docx') ? 'docx' : 'txt',
        size: file.size,
        uploadedAt: new Date(),
        lastModified: new Date(),
        folderId: selectedFolder || undefined,
        tags: [],
        content: file
      }
      setDocuments(prev => [...prev, newDoc])
    })
  }

  const handleCreateFolder = () => {
    if (!newFolderName.trim()) return

    const newFolder: DocumentFolder = {
      id: Date.now().toString(),
      name: newFolderName,
      color: '#6b7280',
      documentsCount: 0,
      createdAt: new Date()
    }

    setFolders(prev => [...prev, newFolder])
    setNewFolderName('')
    setShowNewFolderDialog(false)
  }

  const formatFileSize = (bytes: number) => {
    if (bytes === 0) return '0 Bytes'
    const k = 1024
    const sizes = ['Bytes', 'KB', 'MB', 'GB']
    const i = Math.floor(Math.log(bytes) / Math.log(k))
    return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + ' ' + sizes[i]
  }

  const getFileIcon = (type: string) => {
    switch (type) {
      case 'pdf': return <FileText className="w-8 h-8 text-red-500" />
      default: return <FileText className="w-8 h-8 text-blue-500" />
    }
  }

  return (
    <div className="flex-1 flex flex-col h-full bg-white dark:bg-gray-900">
      {/* Header */}
      <div className="border-b border-gray-200 dark:border-gray-700 p-4">
        <div className="flex items-center justify-between mb-4">
          <div className="flex items-center gap-3">
            <Button variant="ghost" size="sm" onClick={onClose}>
              <ArrowLeft className="w-4 h-4" />
            </Button>
            <h1 className="text-xl font-semibold">Document Manager</h1>
            {selectedFolder && (
              <Badge 
                variant="secondary" 
                style={{ backgroundColor: folders.find(f => f.id === selectedFolder)?.color + '20' }}
              >
                {folders.find(f => f.id === selectedFolder)?.name}
              </Badge>
            )}
          </div>

          <div className="flex items-center gap-2">
            <Button
              variant="ghost"
              size="sm"
              onClick={() => setViewMode(viewMode === 'grid' ? 'list' : 'grid')}
            >
              {viewMode === 'grid' ? <List className="w-4 h-4" /> : <GridIcon className="w-4 h-4" />}
            </Button>
            <Button
              variant="outline"
              size="sm"
              onClick={() => setShowNewFolderDialog(true)}
            >
              <FolderPlus className="w-4 h-4 mr-2" />
              New Folder
            </Button>
          </div>
        </div>

        {/* Search and Filters */}
        <div className="flex items-center gap-3">
          <div className="flex-1 relative">
            <Search className="w-4 h-4 absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400" />
            <Input
              placeholder="Search documents..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="pl-10"
            />
          </div>
          <Button variant="ghost" size="sm">
            <Filter className="w-4 h-4" />
          </Button>
        </div>
      </div>

      <div className="flex-1 flex">
        {/* Sidebar - Folders */}
        <div className="w-64 border-r border-gray-200 dark:border-gray-700 p-4">
          <div className="space-y-2">
            <Button
              variant={selectedFolder === null ? "default" : "ghost"}
              className="w-full justify-start"
              onClick={() => setSelectedFolder(null)}
            >
              <FileText className="w-4 h-4 mr-2" />
              All Documents ({documents.length})
            </Button>

            <Separator className="my-3" />

            {folders.map((folder) => (
              <Button
                key={folder.id}
                variant={selectedFolder === folder.id ? "default" : "ghost"}
                className="w-full justify-start"
                onClick={() => setSelectedFolder(folder.id)}
              >
                <Folder className="w-4 h-4 mr-2" style={{ color: folder.color }} />
                {folder.name} ({folder.documentsCount})
              </Button>
            ))}
          </div>
        </div>

        {/* Main Content Area */}
        <div className="flex-1 p-4">
          {/* Drop Zone */}
          <div
            onDragOver={handleDragOver}
            onDragLeave={handleDragLeave}
            onDrop={handleDrop}
            className={`
              min-h-full border-2 border-dashed rounded-lg p-6 transition-colors
              ${isDragOver 
                ? 'border-blue-400 bg-blue-50 dark:bg-blue-950/20' 
                : 'border-gray-300 dark:border-gray-600'
              }
            `}
          >
            {filteredDocuments.length === 0 ? (
              <div className="flex flex-col items-center justify-center h-64 text-gray-500">
                <FileText className="w-16 h-16 mb-4" />
                <p className="text-lg font-medium mb-2">No documents found</p>
                <p className="text-sm">Drag and drop files here or use the upload button</p>
              </div>
            ) : (
              <div className={viewMode === 'grid' ? 'grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4' : 'space-y-2'}>
                {filteredDocuments.map((doc) => (
                  <motion.div
                    key={doc.id}
                    initial={{ opacity: 0, scale: 0.9 }}
                    animate={{ opacity: 1, scale: 1 }}
                    className={viewMode === 'grid' ? 'cursor-pointer' : ''}
                  >
                    {viewMode === 'grid' ? (
                      <Card 
                        className="hover:shadow-md transition-shadow cursor-pointer"
                        onClick={() => onOpenDocument(doc)}
                      >
                        <CardContent className="p-4">
                          <div className="flex flex-col items-center text-center">
                            {getFileIcon(doc.type)}
                            <h3 className="font-medium text-sm mt-2 line-clamp-2">{doc.name}</h3>
                            <p className="text-xs text-gray-500 mt-1">{formatFileSize(doc.size)}</p>
                            <div className="flex flex-wrap gap-1 mt-2">
                              {doc.tags.slice(0, 2).map(tag => (
                                <Badge key={tag} variant="secondary" className="text-xs">
                                  {tag}
                                </Badge>
                              ))}
                            </div>
                          </div>
                        </CardContent>
                      </Card>
                    ) : (
                      <div 
                        className="flex items-center p-3 rounded-lg border hover:bg-gray-50 dark:hover:bg-gray-800 cursor-pointer"
                        onClick={() => onOpenDocument(doc)}
                      >
                        {getFileIcon(doc.type)}
                        <div className="flex-1 ml-3">
                          <h3 className="font-medium">{doc.name}</h3>
                          <p className="text-sm text-gray-500">
                            {formatFileSize(doc.size)} • {doc.uploadedAt.toLocaleDateString()}
                          </p>
                        </div>
                        <div className="flex items-center gap-2">
                          {doc.tags.slice(0, 3).map(tag => (
                            <Badge key={tag} variant="secondary" className="text-xs">
                              {tag}
                            </Badge>
                          ))}
                          <Button variant="ghost" size="sm">
                            <MoreVertical className="w-4 h-4" />
                          </Button>
                        </div>
                      </div>
                    )}
                  </motion.div>
                ))}
              </div>
            )}
          </div>
        </div>
      </div>

      {/* New Folder Dialog */}
      <AnimatePresence>
        {showNewFolderDialog && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 bg-black/50 flex items-center justify-center z-50"
            onClick={() => setShowNewFolderDialog(false)}
          >
            <motion.div
              initial={{ scale: 0.9, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              exit={{ scale: 0.9, opacity: 0 }}
              onClick={(e) => e.stopPropagation()}
              className="bg-white dark:bg-gray-800 rounded-lg p-6 w-96"
            >
              <h3 className="text-lg font-semibold mb-4">Create New Folder</h3>
              <Input
                placeholder="Folder name"
                value={newFolderName}
                onChange={(e) => setNewFolderName(e.target.value)}
                onKeyPress={(e) => e.key === 'Enter' && handleCreateFolder()}
                className="mb-4"
              />
              <div className="flex justify-end gap-2">
                <Button variant="ghost" onClick={() => setShowNewFolderDialog(false)}>
                  Cancel
                </Button>
                <Button onClick={handleCreateFolder}>Create</Button>
              </div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  )
}
