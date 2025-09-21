from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.orm import Session
from pydantic import BaseModel
from typing import List, Optional
from datetime import datetime

from app.core.database import get_db
from app.models.database import User, Content, Concept
from app.api.auth import get_current_user

router = APIRouter()

# Pydantic models
class QueryRequest(BaseModel):
    query: str
    context: Optional[str] = None
    max_results: int = 10
    confidence_threshold: float = 0.7

class QueryResult(BaseModel):
    content_id: str
    title: str
    content_type: str
    excerpt: str
    confidence: float
    source_url: Optional[str]

class QueryResponse(BaseModel):
    query: str
    results: List[QueryResult]
    total_results: int
    processing_time_ms: int

class ConceptResponse(BaseModel):
    id: str
    name: str
    description: Optional[str]
    category: Optional[str]
    confidence_score: float
    content_title: str

@router.post("/search", response_model=QueryResponse)
async def search_content(
    query_request: QueryRequest,
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db)
):
    """Search through user's content using natural language"""
    start_time = datetime.now()
    
    # For now, simple text search - will be replaced with vector search
    search_term = f"%{query_request.query.lower()}%"
    
    contents = db.query(Content).filter(
        Content.user_id == current_user.id,
        Content.processed_text.ilike(search_term)
    ).limit(query_request.max_results).all()
    
    results = []
    for content in contents:
        # Extract excerpt around the search term
        text = content.processed_text or content.original_text or ""
        excerpt = text[:200] + "..." if len(text) > 200 else text
        
        results.append(QueryResult(
            content_id=str(content.id),
            title=content.title,
            content_type=content.content_type,
            excerpt=excerpt,
            confidence=0.8,  # Mock confidence score
            source_url=content.source_url
        ))
    
    end_time = datetime.now()
    processing_time = int((end_time - start_time).total_seconds() * 1000)
    
    return QueryResponse(
        query=query_request.query,
        results=results,
        total_results=len(results),
        processing_time_ms=processing_time
    )

@router.get("/concepts", response_model=List[ConceptResponse])
async def get_user_concepts(
    limit: int = 50,
    category: Optional[str] = None,
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db)
):
    """Get concepts from user's content"""
    query = db.query(Concept, Content).join(Content).filter(
        Content.user_id == current_user.id
    )
    
    if category:
        query = query.filter(Concept.category == category)
    
    concepts = query.limit(limit).all()
    
    return [
        ConceptResponse(
            id=str(concept.id),
            name=concept.name,
            description=concept.description,
            category=concept.category,
            confidence_score=concept.confidence_score or 0.0,
            content_title=content.title
        )
        for concept, content in concepts
    ]

@router.get("/graph/data")
async def get_knowledge_graph_data(
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db)
):
    """Get knowledge graph data for visualization"""
    # Get user's concepts
    concepts = db.query(Concept, Content).join(Content).filter(
        Content.user_id == current_user.id
    ).all()
    
    nodes = []
    for concept, content in concepts:
        nodes.append({
            "id": str(concept.id),
            "name": concept.name,
            "category": concept.category or "general",
            "size": min(max(concept.frequency * 5, 20), 50) if concept.frequency else 25,
            "confidence": concept.confidence_score or 0.5,
            "content_title": content.title,
            "content_type": content.content_type
        })
    
    # For now, return empty edges - will be populated with actual relationships
    edges = []
    
    return {
        "nodes": nodes,
        "edges": edges,
        "total_nodes": len(nodes),
        "total_edges": len(edges)
    }
