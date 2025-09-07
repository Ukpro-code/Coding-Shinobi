// Local storage utilities for ZettleMind

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

interface ZettleMindData {
  nodes: Node[]
  connections: Connection[]
  lastSaved: string
  version: string
}

const STORAGE_KEY = 'zettlemind-data'
const CURRENT_VERSION = '1.0.0'

export const localStorageAPI = {
  // Save data to localStorage
  saveData: (nodes: Node[], connections: Connection[]): boolean => {
    try {
      const data: ZettleMindData = {
        nodes,
        connections,
        lastSaved: new Date().toISOString(),
        version: CURRENT_VERSION
      }
      localStorage.setItem(STORAGE_KEY, JSON.stringify(data))
      console.log('Data saved to localStorage:', data)
      return true
    } catch (error) {
      console.error('Failed to save data to localStorage:', error)
      return false
    }
  },

  // Load data from localStorage
  loadData: (): { nodes: Node[], connections: Connection[] } => {
    try {
      const stored = localStorage.getItem(STORAGE_KEY)
      if (!stored) {
        console.log('No stored data found, returning empty state')
        return { nodes: [], connections: [] }
      }

      const data: ZettleMindData = JSON.parse(stored)
      
      // Convert date strings back to Date objects
      const nodes = data.nodes.map(node => ({
        ...node,
        lastInteraction: new Date(node.lastInteraction)
      }))
      
      const connections = data.connections.map(conn => ({
        ...conn,
        lastReinforced: new Date(conn.lastReinforced)
      }))

      console.log('Data loaded from localStorage:', { nodes, connections })
      return { nodes, connections }
    } catch (error) {
      console.error('Failed to load data from localStorage:', error)
      return { nodes: [], connections: [] }
    }
  },

  // Clear all data
  clearData: (): boolean => {
    try {
      localStorage.removeItem(STORAGE_KEY)
      console.log('Data cleared from localStorage')
      return true
    } catch (error) {
      console.error('Failed to clear data from localStorage:', error)
      return false
    }
  },

  // Export data as JSON file
  exportData: (nodes: Node[], connections: Connection[]): void => {
    try {
      const data: ZettleMindData = {
        nodes,
        connections,
        lastSaved: new Date().toISOString(),
        version: CURRENT_VERSION
      }
      
      const blob = new Blob([JSON.stringify(data, null, 2)], { type: 'application/json' })
      const url = URL.createObjectURL(blob)
      
      const a = document.createElement('a')
      a.href = url
      a.download = `zettlemind-export-${new Date().toISOString().split('T')[0]}.json`
      document.body.appendChild(a)
      a.click()
      document.body.removeChild(a)
      URL.revokeObjectURL(url)
      
      console.log('Data exported successfully')
    } catch (error) {
      console.error('Failed to export data:', error)
    }
  },

  // Import data from JSON file
  importData: (file: File): Promise<{ nodes: Node[], connections: Connection[] }> => {
    return new Promise((resolve, reject) => {
      const reader = new FileReader()
      
      reader.onload = (e) => {
        try {
          const result = e.target?.result as string
          const data: ZettleMindData = JSON.parse(result)
          
          // Convert date strings back to Date objects
          const nodes = data.nodes.map(node => ({
            ...node,
            lastInteraction: new Date(node.lastInteraction)
          }))
          
          const connections = data.connections.map(conn => ({
            ...conn,
            lastReinforced: new Date(conn.lastReinforced)
          }))
          
          console.log('Data imported successfully:', { nodes, connections })
          resolve({ nodes, connections })
        } catch (error) {
          console.error('Failed to parse imported data:', error)
          reject(error)
        }
      }
      
      reader.onerror = () => {
        reject(new Error('Failed to read file'))
      }
      
      reader.readAsText(file)
    })
  },

  // Get storage info
  getStorageInfo: (): { hasData: boolean, lastSaved: string | null, nodeCount: number, connectionCount: number } => {
    try {
      const stored = localStorage.getItem(STORAGE_KEY)
      if (!stored) {
        return { hasData: false, lastSaved: null, nodeCount: 0, connectionCount: 0 }
      }

      const data: ZettleMindData = JSON.parse(stored)
      return {
        hasData: true,
        lastSaved: data.lastSaved,
        nodeCount: data.nodes.length,
        connectionCount: data.connections.length
      }
    } catch (error) {
      console.error('Failed to get storage info:', error)
      return { hasData: false, lastSaved: null, nodeCount: 0, connectionCount: 0 }
    }
  }
}
