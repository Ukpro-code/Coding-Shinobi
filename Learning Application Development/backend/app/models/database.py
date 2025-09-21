from sqlalchemy import Column, String, Text, DateTime, Float, Integer, Boolean, JSON, ForeignKey
from sqlalchemy.orm import relationship
from sqlalchemy.sql import func
import uuid
from app.core.database import Base

class User(Base):
    __tablename__ = "users"
    
    id = Column(String(36), primary_key=True, default=lambda: str(uuid.uuid4()))
    email = Column(String(255), unique=True, nullable=False, index=True)
    hashed_password = Column(String(255), nullable=False)
    is_active = Column(Boolean, default=True)
    created_at = Column(DateTime, server_default=func.now())
    updated_at = Column(DateTime, onupdate=func.now())
    
    # Relationships
    contents = relationship("Content", back_populates="user")
    interactions = relationship("UserInteraction", back_populates="user")

class Content(Base):
    __tablename__ = "contents"
    
    id = Column(String(36), primary_key=True, default=lambda: str(uuid.uuid4()))
    user_id = Column(String(36), ForeignKey("users.id"), nullable=False)
    title = Column(String(500), nullable=False)
    content_type = Column(String(50), nullable=False)  # youtube, pdf, article
    source_url = Column(Text)
    file_path = Column(Text)
    original_text = Column(Text)
    processed_text = Column(Text)
    summary_brief = Column(Text)
    summary_detailed = Column(Text)
    summary_comprehensive = Column(Text)
    metadata_json = Column(JSON)
    processing_status = Column(String(50), default="pending")  # pending, processing, completed, failed
    error_message = Column(Text)  # Store processing errors
    word_count = Column(Integer)  # Number of words in content
    page_count = Column(Integer)  # Number of pages (for PDFs)
    extraction_method = Column(String(50))  # Method used for text extraction
    created_at = Column(DateTime, server_default=func.now())
    updated_at = Column(DateTime, onupdate=func.now())
    
    # Relationships
    user = relationship("User", back_populates="contents")
    concepts = relationship("Concept", back_populates="content")

class Concept(Base):
    __tablename__ = "concepts"
    
    id = Column(String(36), primary_key=True, default=lambda: str(uuid.uuid4()))
    content_id = Column(String(36), ForeignKey("contents.id"), nullable=False)
    name = Column(String(200), nullable=False, index=True)
    description = Column(Text)
    category = Column(String(100))
    confidence_score = Column(Float)
    first_mentioned_at = Column(Integer)  # Position in text
    frequency = Column(Integer, default=1)
    created_at = Column(DateTime, server_default=func.now())
    
    # Relationships
    content = relationship("Content", back_populates="concepts")
    source_relationships = relationship("ConceptRelationship", foreign_keys="ConceptRelationship.source_concept_id")
    target_relationships = relationship("ConceptRelationship", foreign_keys="ConceptRelationship.target_concept_id")

class ConceptRelationship(Base):
    __tablename__ = "concept_relationships"
    
    id = Column(String(36), primary_key=True, default=lambda: str(uuid.uuid4()))
    source_concept_id = Column(String(36), ForeignKey("concepts.id"), nullable=False)
    target_concept_id = Column(String(36), ForeignKey("concepts.id"), nullable=False)
    relationship_type = Column(String(100), nullable=False)  # semantic, direct, contextual
    confidence_score = Column(Float)
    evidence = Column(Text)  # Supporting text for the relationship
    created_at = Column(DateTime, server_default=func.now())
    
    # Relationships
    source_concept = relationship("Concept", foreign_keys=[source_concept_id])
    target_concept = relationship("Concept", foreign_keys=[target_concept_id])

class UserInteraction(Base):
    __tablename__ = "user_interactions"
    
    id = Column(String(36), primary_key=True, default=lambda: str(uuid.uuid4()))
    user_id = Column(String(36), ForeignKey("users.id"), nullable=False)
    interaction_type = Column(String(50), nullable=False)  # click, explore, query, bookmark
    target_type = Column(String(50), nullable=False)  # concept, content, relationship
    target_id = Column(String(36), nullable=False)
    metadata_json = Column(JSON)
    created_at = Column(DateTime, server_default=func.now())
    
    # Relationships
    user = relationship("User", back_populates="interactions")

class ProcessingJob(Base):
    __tablename__ = "processing_jobs"
    
    id = Column(String(36), primary_key=True, default=lambda: str(uuid.uuid4()))
    content_id = Column(String(36), ForeignKey("contents.id"), nullable=False)
    job_type = Column(String(50), nullable=False)  # extract, summarize, analyze, connect
    status = Column(String(50), default="pending")  # pending, running, completed, failed
    progress_percentage = Column(Integer, default=0)
    error_message = Column(Text)
    started_at = Column(DateTime)
    completed_at = Column(DateTime)
    created_at = Column(DateTime, server_default=func.now())
    
    # Relationships
    content = relationship("Content")
