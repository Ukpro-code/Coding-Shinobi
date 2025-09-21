/**
 * API Client for Personal Learning System Backend
 */

const API_BASE_URL = 'http://localhost:8000/api';

interface User {
  id: string;
  email: string;
  is_active: boolean;
  created_at: string;
}

interface Content {
  id: string;
  title: string;
  content_type: string;
  source_url?: string;
  processing_status: string;
  created_at: string;
  summary_brief?: string;
}

interface Concept {
  id: string;
  name: string;
  description?: string;
  category?: string;
  confidence_score: number;
  content_title: string;
}

interface QueryResult {
  content_id: string;
  title: string;
  content_type: string;
  excerpt: string;
  confidence: number;
  source_url?: string;
}

interface KnowledgeGraphNode {
  id: string;
  name: string;
  category: string;
  size: number;
  confidence: number;
  content_title: string;
  content_type: string;
}

interface KnowledgeGraphData {
  nodes: KnowledgeGraphNode[];
  edges: any[];
  total_nodes: number;
  total_edges: number;
}

class ApiClient {
  private token: string | null = null;

  constructor() {
    // Load token from localStorage if available
    this.token = localStorage.getItem('auth_token');
  }

  private getAuthHeaders() {
    const headers: Record<string, string> = {
      'Content-Type': 'application/json',
    };
    
    if (this.token) {
      headers['Authorization'] = `Bearer ${this.token}`;
    }
    
    return headers;
  }

  private async fetchWithAuth(url: string, options: RequestInit = {}) {
    const response = await fetch(`${API_BASE_URL}${url}`, {
      ...options,
      headers: {
        ...this.getAuthHeaders(),
        ...options.headers,
      },
    });

    if (response.status === 401) {
      // Token expired or invalid
      this.logout();
      throw new Error('Authentication required');
    }

    return response;
  }

  // Authentication
  async register(email: string, password: string): Promise<User> {
    const response = await fetch(`${API_BASE_URL}/auth/register`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ email, password }),
    });

    if (!response.ok) {
      const error = await response.json();
      throw new Error(error.detail || 'Registration failed');
    }

    return await response.json();
  }

  async login(email: string, password: string): Promise<{ access_token: string; token_type: string }> {
    const formData = new FormData();
    formData.append('username', email);
    formData.append('password', password);

    const response = await fetch(`${API_BASE_URL}/auth/token`, {
      method: 'POST',
      body: formData,
    });

    if (!response.ok) {
      const error = await response.json();
      throw new Error(error.detail || 'Login failed');
    }

    const tokenData = await response.json();
    this.token = tokenData.access_token;
    localStorage.setItem('auth_token', this.token!);
    
    return tokenData;
  }

  async getCurrentUser(): Promise<User> {
    const response = await this.fetchWithAuth('/auth/me');
    
    if (!response.ok) {
      throw new Error('Failed to get user info');
    }
    
    return await response.json();
  }

  logout() {
    this.token = null;
    localStorage.removeItem('auth_token');
  }

  // Content Management
  async uploadPDF(title: string, file: File): Promise<Content> {
    const formData = new FormData();
    formData.append('title', title);
    formData.append('file', file);

    const response = await fetch(`${API_BASE_URL}/content/pdf`, {
      method: 'POST',
      headers: {
        ...(this.token && { Authorization: `Bearer ${this.token}` }),
      },
      body: formData,
    });

    if (!response.ok) {
      const error = await response.json();
      throw new Error(error.detail || 'PDF upload failed');
    }

    return await response.json();
  }

  async addYouTubeContent(title: string, url: string): Promise<Content> {
    const response = await this.fetchWithAuth('/content/youtube', {
      method: 'POST',
      body: JSON.stringify({
        title,
        content_type: 'youtube',
        source_url: url,
      }),
    });

    if (!response.ok) {
      const error = await response.json();
      throw new Error(error.detail || 'YouTube content creation failed');
    }

    return await response.json();
  }

  async getContent(page: number = 1, size: number = 20, contentType?: string): Promise<{
    items: Content[];
    total: number;
    page: number;
    size: number;
  }> {
    const params = new URLSearchParams({
      page: page.toString(),
      size: size.toString(),
    });
    
    if (contentType) {
      params.append('content_type', contentType);
    }

    const response = await this.fetchWithAuth(`/content/?${params}`);
    
    if (!response.ok) {
      throw new Error('Failed to fetch content');
    }
    
    return await response.json();
  }

  async deleteContent(contentId: string): Promise<void> {
    const response = await this.fetchWithAuth(`/content/${contentId}`, {
      method: 'DELETE',
    });

    if (!response.ok) {
      throw new Error('Failed to delete content');
    }
  }

  // Search and Query
  async searchContent(query: string, maxResults: number = 10): Promise<{
    query: string;
    results: QueryResult[];
    total_results: number;
    processing_time_ms: number;
  }> {
    const response = await this.fetchWithAuth('/query/search', {
      method: 'POST',
      body: JSON.stringify({
        query,
        max_results: maxResults,
        confidence_threshold: 0.7,
      }),
    });

    if (!response.ok) {
      throw new Error('Search failed');
    }

    return await response.json();
  }

  // Knowledge Graph
  async getConcepts(limit: number = 50, category?: string): Promise<Concept[]> {
    const params = new URLSearchParams({
      limit: limit.toString(),
    });
    
    if (category) {
      params.append('category', category);
    }

    const response = await this.fetchWithAuth(`/query/concepts?${params}`);
    
    if (!response.ok) {
      throw new Error('Failed to fetch concepts');
    }
    
    return await response.json();
  }

  async getKnowledgeGraphData(): Promise<KnowledgeGraphData> {
    const response = await this.fetchWithAuth('/query/graph/data');
    
    if (!response.ok) {
      throw new Error('Failed to fetch knowledge graph data');
    }
    
    return await response.json();
  }

  // Health check
  async healthCheck(): Promise<{ status: string; environment: string }> {
    const response = await fetch('http://localhost:8000/health');
    
    if (!response.ok) {
      throw new Error('Health check failed');
    }
    
    return await response.json();
  }
}

// Create singleton instance
export const apiClient = new ApiClient();

// Export types for use in components
export type {
  User,
  Content,
  Concept,
  QueryResult,
  KnowledgeGraphNode,
  KnowledgeGraphData,
};