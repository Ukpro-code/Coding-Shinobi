# Technical Architecture Overview

## System Architecture Diagram

```
┌─────────────────────────────────────────────────────────────────┐
│                          Frontend (React)                       │
├─────────────────────────────────────────────────────────────────┤
│  ┌─────────────────┐  ┌─────────────────┐  ┌─────────────────┐  │
│  │  Thinking Space │  │ Content Manager │  │ Query Interface │  │
│  │   (D3.js)       │  │   (Upload/List) │  │  (NL Queries)   │  │
│  └─────────────────┘  └─────────────────┘  └─────────────────┘  │
└─────────────────────────────────────────────────────────────────┘
                                  │
                               REST API
                                  │
┌─────────────────────────────────────────────────────────────────┐
│                      Backend (FastAPI)                          │
├─────────────────────────────────────────────────────────────────┤
│  ┌─────────────────┐  ┌─────────────────┐  ┌─────────────────┐  │
│  │   API Routes    │  │   Auth Service  │  │  Query Service  │  │
│  └─────────────────┘  └─────────────────┘  └─────────────────┘  │
│                                  │                                │
│  ┌─────────────────┐  ┌─────────────────┐  ┌─────────────────┐  │
│  │Content Processor│  │  AI Integration │  │ Knowledge Graph │  │
│  │   (YouTube/PDF) │  │   (OpenAI API)  │  │   (Neo4j/Graph) │  │
│  └─────────────────┘  └─────────────────┘  └─────────────────┘  │
│                                  │                                │
│  ┌─────────────────┐  ┌─────────────────┐  ┌─────────────────┐  │
│  │Background Tasks │  │Vector Embeddings│  │  File Storage   │  │
│  │   (Celery)      │  │   (Pinecone)    │  │   (Local/S3)    │  │
│  └─────────────────┘  └─────────────────┘  └─────────────────┘  │
└─────────────────────────────────────────────────────────────────┘
                                  │
                            Database Layer
                                  │
┌─────────────────────────────────────────────────────────────────┐
│  ┌─────────────────┐  ┌─────────────────┐  ┌─────────────────┐  │
│  │   PostgreSQL    │  │      Neo4j      │  │      Redis      │  │
│  │  (Primary Data) │  │ (Knowledge Graph│  │   (Cache/Queue) │  │
│  └─────────────────┘  └─────────────────┘  └─────────────────┘  │
└─────────────────────────────────────────────────────────────────┘
```

## Data Flow Architecture

### Content Processing Pipeline
```
User Input (URL/File) 
    ↓
Content Extraction Service
    ↓
Text Preprocessing & Cleaning
    ↓
AI Analysis (OpenAI API)
    ├── Summarization
    ├── Concept Extraction
    └── Key Points Identification
    ↓
Vector Embedding Generation
    ↓
Knowledge Graph Integration
    ├── Concept Nodes Creation
    ├── Relationship Detection
    └── Confidence Scoring
    ↓
Database Storage
    ├── PostgreSQL (Content & Metadata)
    ├── Neo4j (Graph Relationships)
    └── Vector DB (Semantic Search)
```

### Query Processing Pipeline
```
Natural Language Query
    ↓
Query Understanding (NLP)
    ↓
Vector Similarity Search
    ↓
Graph Traversal (Neo4j)
    ↓
Context Aggregation
    ↓
AI Response Generation
    ↓
Response with Sources & Confidence
```

## Technology Stack Details

### Backend Components

#### FastAPI Application
```python
# Main application structure
app/
├── main.py                 # FastAPI app entry point
├── core/
│   ├── config.py          # Configuration management
│   ├── security.py        # Authentication & authorization
│   └── database.py        # Database connections
├── api/
│   ├── content.py         # Content processing endpoints
│   ├── query.py           # Query handling endpoints
│   └── graph.py           # Knowledge graph endpoints
├── services/
│   ├── content_processor.py    # Content extraction logic
│   ├── ai_service.py           # OpenAI API integration
│   ├── graph_service.py        # Neo4j operations
│   └── vector_service.py       # Vector database operations
├── models/
│   ├── content.py         # Pydantic models for content
│   ├── concepts.py        # Concept and relationship models
│   └── queries.py         # Query request/response models
└── workers/
    ├── content_worker.py  # Background content processing
    └── graph_worker.py    # Knowledge graph updates
```

#### Key Dependencies
```python
# requirements.txt
fastapi==0.104.1
uvicorn==0.24.0
sqlalchemy==2.0.23
alembic==1.12.1
psycopg2-binary==2.9.7
neo4j==5.14.0
celery==5.3.4
redis==5.0.1
openai==1.3.5
pinecone-client==2.2.4
pydantic==2.5.0
python-multipart==0.0.6
python-jose==3.3.0
passlib==1.7.4
pypdf2==3.0.1
pdfplumber==0.10.3
beautifulsoup4==4.12.2
requests==2.31.0
numpy==1.24.3
scikit-learn==1.3.2
```

### Frontend Components

#### React Application Structure
```typescript
src/
├── App.tsx                 # Main application component
├── components/
│   ├── ThinkingSpace/
│   │   ├── BubbleChart.tsx       # D3.js visualization
│   │   ├── ConceptBubble.tsx     # Individual concept bubbles
│   │   ├── ConnectionLines.tsx   # Relationship visualizations
│   │   └── InteractionLayer.tsx  # Mouse/touch interactions
│   ├── ContentManager/
│   │   ├── ContentUpload.tsx     # File/URL upload component
│   │   ├── ContentList.tsx       # List of processed content
│   │   └── ProcessingStatus.tsx  # Real-time processing updates
│   ├── QueryInterface/
│   │   ├── QueryInput.tsx        # Natural language query input
│   │   ├── QueryResults.tsx      # Search results display
│   │   └── QueryHistory.tsx      # Previous queries
│   └── Common/
│       ├── Layout.tsx            # App layout wrapper
│       ├── Navigation.tsx        # Navigation component
│       └── Loading.tsx           # Loading states
├── services/
│   ├── api.ts             # API client configuration
│   ├── contentService.ts  # Content-related API calls
│   ├── queryService.ts    # Query-related API calls
│   └── websocket.ts       # Real-time updates
├── stores/
│   ├── contentStore.ts    # Content state management
│   ├── graphStore.ts      # Knowledge graph state
│   └── uiStore.ts         # UI state management
├── types/
│   ├── content.ts         # Content type definitions
│   ├── concepts.ts        # Concept type definitions
│   └── api.ts             # API response types
└── utils/
    ├── visualization.ts   # D3.js helper functions
    ├── formatting.ts      # Text/data formatting
    └── constants.ts       # App constants
```

#### Key Dependencies
```json
{
  "dependencies": {
    "react": "^18.2.0",
    "react-dom": "^18.2.0",
    "typescript": "^5.2.2",
    "@types/react": "^18.2.37",
    "@types/react-dom": "^18.2.15",
    "d3": "^7.8.5",
    "@types/d3": "^7.4.3",
    "zustand": "^4.4.6",
    "axios": "^1.6.2",
    "react-router-dom": "^6.18.0",
    "@radix-ui/react-dialog": "^1.0.5",
    "@radix-ui/react-select": "^2.0.0",
    "tailwindcss": "^3.3.5",
    "framer-motion": "^10.16.4",
    "react-dropzone": "^14.2.3",
    "react-query": "^3.39.3"
  }
}
```

## Database Schema Design

### PostgreSQL Schema
```sql
-- Users table
CREATE TABLE users (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    email VARCHAR(255) UNIQUE NOT NULL,
    password_hash VARCHAR(255) NOT NULL,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- Content sources
CREATE TABLE contents (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id UUID REFERENCES users(id),
    title VARCHAR(500) NOT NULL,
    content_type VARCHAR(50) NOT NULL, -- 'youtube', 'pdf', 'article'
    source_url TEXT,
    file_path TEXT,
    original_text TEXT,
    processed_text TEXT,
    summary_brief TEXT,
    summary_detailed TEXT,
    summary_comprehensive TEXT,
    metadata JSONB,
    processing_status VARCHAR(50) DEFAULT 'pending',
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- Extracted concepts
CREATE TABLE concepts (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    content_id UUID REFERENCES contents(id),
    name VARCHAR(200) NOT NULL,
    description TEXT,
    category VARCHAR(100),
    confidence_score FLOAT CHECK (confidence_score >= 0 AND confidence_score <= 1),
    first_mentioned_at INTEGER, -- Position in text where first mentioned
    frequency INTEGER DEFAULT 1,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- Concept relationships
CREATE TABLE concept_relationships (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    source_concept_id UUID REFERENCES concepts(id),
    target_concept_id UUID REFERENCES concepts(id),
    relationship_type VARCHAR(100) NOT NULL,
    confidence_score FLOAT CHECK (confidence_score >= 0 AND confidence_score <= 1),
    evidence TEXT, -- Supporting text for the relationship
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    UNIQUE(source_concept_id, target_concept_id, relationship_type)
);

-- User interactions for learning patterns
CREATE TABLE user_interactions (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id UUID REFERENCES users(id),
    interaction_type VARCHAR(50) NOT NULL, -- 'click', 'explore', 'query', 'bookmark'
    target_type VARCHAR(50) NOT NULL, -- 'concept', 'content', 'relationship'
    target_id UUID NOT NULL,
    metadata JSONB,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- Query history
CREATE TABLE query_history (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id UUID REFERENCES users(id),
    query_text TEXT NOT NULL,
    results_count INTEGER,
    response_time_ms INTEGER,
    satisfaction_rating INTEGER CHECK (satisfaction_rating >= 1 AND satisfaction_rating <= 5),
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- Processing jobs
CREATE TABLE processing_jobs (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    content_id UUID REFERENCES contents(id),
    job_type VARCHAR(50) NOT NULL, -- 'extract', 'summarize', 'analyze', 'connect'
    status VARCHAR(50) DEFAULT 'pending', -- 'pending', 'running', 'completed', 'failed'
    progress_percentage INTEGER DEFAULT 0,
    error_message TEXT,
    started_at TIMESTAMP,
    completed_at TIMESTAMP,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- Indexes for performance
CREATE INDEX idx_contents_user_id ON contents(user_id);
CREATE INDEX idx_concepts_content_id ON concepts(content_id);
CREATE INDEX idx_concept_relationships_source ON concept_relationships(source_concept_id);
CREATE INDEX idx_concept_relationships_target ON concept_relationships(target_concept_id);
CREATE INDEX idx_user_interactions_user_id ON user_interactions(user_id);
CREATE INDEX idx_query_history_user_id ON query_history(user_id);
```

### Neo4j Graph Schema
```cypher
// Content nodes
CREATE CONSTRAINT content_id FOR (c:Content) REQUIRE c.id IS UNIQUE;

// Concept nodes
CREATE CONSTRAINT concept_id FOR (c:Concept) REQUIRE c.id IS UNIQUE;

// User nodes
CREATE CONSTRAINT user_id FOR (u:User) REQUIRE u.id IS UNIQUE;

// Example node creation
CREATE (c:Content {
    id: "uuid",
    title: "Introduction to React Hooks",
    type: "youtube",
    url: "https://youtube.com/watch?v=...",
    created_at: datetime()
});

CREATE (concept:Concept {
    id: "uuid",
    name: "useState Hook",
    description: "React hook for managing component state",
    category: "programming",
    confidence: 0.95
});

// Relationships
CREATE (content)-[:CONTAINS]->(concept);
CREATE (concept1)-[:RELATES_TO {confidence: 0.8, type: "semantic"}]->(concept2);
CREATE (user)-[:VIEWED {timestamp: datetime()}]->(content);
CREATE (user)-[:EXPLORED {timestamp: datetime(), duration: 45}]->(concept);
```

## API Documentation

### Content Processing Endpoints

```python
# Upload and process YouTube content
POST /api/content/youtube
{
    "url": "https://youtube.com/watch?v=...",
    "title": "Optional custom title"
}

# Upload and process PDF
POST /api/content/pdf
{
    "file": "multipart file upload",
    "title": "Optional custom title"
}

# Get content by ID
GET /api/content/{content_id}

# List all content for user
GET /api/content/?limit=20&offset=0&type=youtube

# Get processing status
GET /api/content/{content_id}/status
```

### Knowledge Graph Endpoints

```python
# Get concepts for content
GET /api/content/{content_id}/concepts

# Get concept relationships
GET /api/concepts/{concept_id}/relationships?depth=2

# Get knowledge graph for thinking space
GET /api/graph/visualization?user_id={user_id}&limit=100

# Get concept details
GET /api/concepts/{concept_id}
```

### Query Endpoints

```python
# Natural language query
POST /api/query
{
    "query": "How does React optimization relate to performance?",
    "context": "coding",
    "max_results": 10
}

# Semantic search
POST /api/search
{
    "query": "state management",
    "content_types": ["youtube", "pdf"],
    "confidence_threshold": 0.7
}

# Query history
GET /api/query/history?limit=20
```

## Development Environment Setup

### Prerequisites
- Python 3.11+
- Node.js 18+
- Docker & Docker Compose
- PostgreSQL 15+
- Redis 7+

### Quick Start Commands
```bash
# Clone and setup
git clone <repository-url>
cd personal-learning-system

# Backend setup
cd backend
python -m venv venv
source venv/bin/activate  # On Windows: venv\Scripts\activate
pip install -r requirements.txt

# Frontend setup
cd ../frontend
npm install

# Start development environment
docker-compose up -d  # Start databases
cd backend && uvicorn app.main:app --reload
cd frontend && npm run dev
```

This architecture provides a solid foundation for building your Personal Learning System with room for iterative improvement and scaling as you learn from personal usage.
