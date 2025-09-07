import { useState } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import { Video, Loader2, AlertCircle, CheckCircle, Brain, X, ExternalLink, Clock } from 'lucide-react'
import { Button } from './ui/button'
import { Input } from './ui/input'
import { Progress } from './ui/progress'
import { Card, CardContent, CardHeader, CardTitle } from './ui/card'
import { Badge } from './ui/badge'

interface ExtractedConcept {
  id: string
  title: string
  description: string
  relevance: number
  category: string
  timestamp?: string
}

interface YouTubeProcessorProps {
  onConceptsExtracted: (concepts: ExtractedConcept[]) => void
  onClose: () => void
}

interface VideoInfo {
  title: string
  duration: string
  channel: string
  thumbnail: string
  description: string
}

export function YouTubeProcessor({ onConceptsExtracted, onClose }: YouTubeProcessorProps) {
  const [youtubeUrl, setYoutubeUrl] = useState('')
  const [videoInfo, setVideoInfo] = useState<VideoInfo | null>(null)
  const [processing, setProcessing] = useState(false)
  const [progress, setProgress] = useState(0)
  const [extractedTranscript, setExtractedTranscript] = useState('')
  const [concepts, setConcepts] = useState<ExtractedConcept[]>([])
  const [status, setStatus] = useState<'idle' | 'fetching' | 'extracting' | 'analyzing' | 'complete' | 'error'>('idle')
  const [errorMessage, setErrorMessage] = useState('')

  const isValidYouTubeUrl = (url: string) => {
    const youtubeRegex = /^(https?:\/\/)?(www\.)?(youtube\.com\/(watch\?v=|embed\/)|youtu\.be\/)[\w-]+/
    return youtubeRegex.test(url)
  }

  const extractVideoId = (url: string) => {
    const match = url.match(/(?:youtube\.com\/watch\?v=|youtu\.be\/|youtube\.com\/embed\/)([^&\n?#]+)/)
    return match ? match[1] : null
  }

  const processYouTubeVideo = async () => {
    if (!youtubeUrl || !isValidYouTubeUrl(youtubeUrl)) {
      setErrorMessage('Please enter a valid YouTube URL')
      setStatus('error')
      return
    }

    setProcessing(true)
    setStatus('fetching')
    setProgress(10)

    try {
      const videoId = extractVideoId(youtubeUrl)
      
      // Simulate fetching video info
      setStatus('fetching')
      setProgress(25)
      await new Promise(resolve => setTimeout(resolve, 1000))

      const mockVideoInfo: VideoInfo = {
        title: 'Advanced Database Design Patterns for Modern Applications',
        duration: '24:32',
        channel: 'TechEducation Pro',
        thumbnail: `https://img.youtube.com/vi/${videoId}/mqdefault.jpg`,
        description: 'Learn advanced database design patterns including microservices data architecture, event sourcing, and CQRS patterns for building scalable modern applications.'
      }

      setVideoInfo(mockVideoInfo)
      setProgress(40)

      // Simulate transcript extraction
      setStatus('extracting')
      await new Promise(resolve => setTimeout(resolve, 1500))

      const mockTranscript = `
        Welcome to this deep dive into advanced database design patterns. Today we'll explore how modern applications handle data at scale.

        Let's start with microservices architecture and data management. When building distributed systems, each microservice should own its data. This principle helps us maintain loose coupling and high cohesion.

        Event sourcing is another powerful pattern. Instead of storing just the current state, we store all events that led to that state. This gives us complete audit trails and the ability to replay events.

        CQRS, or Command Query Responsibility Segregation, separates read and write operations. This allows us to optimize each operation independently and handle different scaling requirements.

        Database sharding becomes crucial as we scale. Horizontal partitioning distributes data across multiple database instances, but introduces complexity in querying and transactions.

        Consistency patterns are essential to understand. We have strong consistency, eventual consistency, and various levels in between. CAP theorem tells us we can't have all three - consistency, availability, and partition tolerance.

        Caching strategies include write-through, write-behind, and cache-aside patterns. Each has trade-offs in terms of performance, consistency, and complexity.

        API design for data access should follow RESTful principles while considering GraphQL for more flexible querying. Rate limiting and authentication are crucial for production systems.

        In conclusion, modern database design requires understanding these patterns and choosing the right combination for your specific use case.
      `

      setExtractedTranscript(mockTranscript)
      setProgress(70)

      // Simulate AI concept extraction
      setStatus('analyzing')
      await new Promise(resolve => setTimeout(resolve, 2000))

      const mockConcepts: ExtractedConcept[] = [
        {
          id: 'yt-1',
          title: 'Microservices Data Architecture',
          description: 'Each microservice owns its data to maintain loose coupling and high cohesion',
          relevance: 0.95,
          category: 'System Architecture',
          timestamp: '02:15'
        },
        {
          id: 'yt-2',
          title: 'Event Sourcing',
          description: 'Store all events that led to current state for complete audit trails and event replay',
          relevance: 0.89,
          category: 'Data Patterns',
          timestamp: '05:42'
        },
        {
          id: 'yt-3',
          title: 'CQRS Pattern',
          description: 'Command Query Responsibility Segregation separates read and write operations',
          relevance: 0.91,
          category: 'Data Patterns',
          timestamp: '08:30'
        },
        {
          id: 'yt-4',
          title: 'Database Sharding',
          description: 'Horizontal partitioning distributes data across multiple database instances',
          relevance: 0.87,
          category: 'Scalability',
          timestamp: '12:18'
        },
        {
          id: 'yt-5',
          title: 'CAP Theorem',
          description: 'Trade-offs between consistency, availability, and partition tolerance',
          relevance: 0.84,
          category: 'Distributed Systems',
          timestamp: '15:45'
        },
        {
          id: 'yt-6',
          title: 'Caching Strategies',
          description: 'Write-through, write-behind, and cache-aside patterns for performance optimization',
          relevance: 0.78,
          category: 'Performance',
          timestamp: '18:20'
        },
        {
          id: 'yt-7',
          title: 'API Design Patterns',
          description: 'RESTful principles and GraphQL for flexible data access',
          relevance: 0.82,
          category: 'API Development',
          timestamp: '21:05'
        }
      ]

      setConcepts(mockConcepts)
      setProgress(100)
      setStatus('complete')

    } catch (error) {
      setErrorMessage('Failed to process YouTube video. Please check the URL and try again.')
      setStatus('error')
      console.error('YouTube processing error:', error)
    } finally {
      setProcessing(false)
    }
  }

  const addConceptsToThinkingSpace = () => {
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
      case 'fetching':
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
      case 'fetching':
        return 'Fetching video information...'
      case 'extracting':
        return 'Extracting transcript and content...'
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
        <h3 className="font-medium text-white dark:text-white light:text-slate-800">YouTube Knowledge Extraction</h3>
        <Button
          variant="ghost"
          size="sm"
          onClick={onClose}
          className="w-8 h-8 p-0 text-white/70 dark:text-white/70 light:text-slate-600 hover:text-white dark:hover:text-white light:hover:text-slate-800"
        >
          <X className="w-4 h-4" />
        </Button>
      </div>

      {/* URL Input */}
      {!videoInfo && (
        <div className="space-y-3">
          <div className="space-y-2">
            <label className="text-sm font-medium text-white dark:text-white light:text-slate-800">
              YouTube Video URL
            </label>
            <div className="flex space-x-2">
              <Input
                placeholder="https://youtube.com/watch?v=..."
                value={youtubeUrl}
                onChange={(e) => setYoutubeUrl(e.target.value)}
                className="flex-1 bg-white/10 dark:bg-white/10 light:bg-white/90 border-white/20 dark:border-white/20 light:border-slate-300 text-white dark:text-white light:text-slate-800 placeholder-white/50 dark:placeholder-white/50 light:placeholder-slate-500"
              />
              <Button
                onClick={processYouTubeVideo}
                disabled={processing || !youtubeUrl}
                size="sm"
                className="bg-red-500 hover:bg-red-600 text-white px-4"
              >
                <Video className="w-4 h-4 mr-2" />
                Process
              </Button>
            </div>
          </div>
          <p className="text-xs text-white/70 dark:text-white/70 light:text-slate-600">
            AI will extract concepts and ideas from the video transcript
          </p>
        </div>
      )}

      {/* Video Info */}
      {videoInfo && !processing && status !== 'complete' && (
        <Card className="bg-white/5 dark:bg-white/5 light:bg-white border-white/20 dark:border-white/20 light:border-slate-200">
          <CardContent className="p-4">
            <div className="flex space-x-4">
              <div className="flex-shrink-0">
                <img
                  src={videoInfo.thumbnail}
                  alt="Video thumbnail"
                  className="w-24 h-16 object-cover rounded border border-white/20 dark:border-white/20 light:border-slate-200"
                />
              </div>
              <div className="flex-1 min-w-0">
                <h4 className="text-sm font-medium text-white dark:text-white light:text-slate-800 mb-1 truncate">
                  {videoInfo.title}
                </h4>
                <p className="text-xs text-white/70 dark:text-white/70 light:text-slate-600 mb-2">
                  {videoInfo.channel}
                </p>
                <div className="flex items-center space-x-2">
                  <div className="flex items-center space-x-1">
                    <Clock className="w-3 h-3 text-white/50 dark:text-white/50 light:text-slate-500" />
                    <span className="text-xs text-white/70 dark:text-white/70 light:text-slate-600">
                      {videoInfo.duration}
                    </span>
                  </div>
                  <Button
                    onClick={processYouTubeVideo}
                    size="sm"
                    className="bg-red-500 hover:bg-red-600 text-white text-xs px-3 py-1 h-auto"
                  >
                    <Brain className="w-3 h-3 mr-1" />
                    Extract Concepts
                  </Button>
                </div>
              </div>
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
                        {concept.timestamp && (
                          <div className="flex items-center space-x-1">
                            <Clock className="w-3 h-3 text-muted-foreground" />
                            <span className="text-xs text-muted-foreground">
                              {concept.timestamp}
                            </span>
                          </div>
                        )}
                      </div>
                    </div>
                    <div className="ml-2 flex-shrink-0">
                      <div className="w-2 h-2 rounded-full bg-gradient-to-r from-red-400 to-orange-500" 
                           style={{ opacity: concept.relevance }} />
                    </div>
                  </div>
                </motion.div>
              ))}
            </div>
            
            <div className="pt-4 border-t border-white/10 dark:border-white/10 light:border-slate-200 mt-4">
              <div className="flex items-center justify-between">
                <Button 
                  onClick={addConceptsToThinkingSpace} 
                  className="flex-1 bg-red-500 hover:bg-red-600 text-white mr-2"
                  size="sm"
                >
                  <Brain className="w-4 h-4 mr-2" />
                  Add to Thinking Space
                </Button>
                {videoInfo && (
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => window.open(youtubeUrl, '_blank')}
                    className="border-white/20 dark:border-white/20 light:border-slate-300 text-white/70 dark:text-white/70 light:text-slate-600 hover:text-white dark:hover:text-white light:hover:text-slate-800"
                  >
                    <ExternalLink className="w-3 h-3" />
                  </Button>
                )}
              </div>
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