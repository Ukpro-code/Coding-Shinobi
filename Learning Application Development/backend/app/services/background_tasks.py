"""
Background Task Processor for Content Processing
Handles PDF processing, concept extraction, and database updates
"""
import logging
from sqlalchemy.orm import Session
from app.core.database import SessionLocal
from app.models.database import Content, Concept, ConceptRelationship
from app.services.pdf_processor import process_pdf_file

logger = logging.getLogger(__name__)

def process_pdf_content(content_id: str, file_path: str):
    """
    Background task to process PDF content
    
    Args:
        content_id: Database content ID
        file_path: Path to uploaded PDF file
    """
    db = SessionLocal()
    
    try:
        # Get content record
        content = db.query(Content).filter(Content.id == content_id).first()
        if not content:
            logger.error(f"Content {content_id} not found")
            return
        
        # Update status to processing
        content.processing_status = "processing"
        db.commit()
        
        # Process the PDF
        result = process_pdf_file(file_path, content_id)
        
        if not result["success"]:
            content.processing_status = "failed"
            content.error_message = result["error"]
            db.commit()
            logger.error(f"PDF processing failed for {content_id}: {result['error']}")
            return
        
        # Update content with results
        content.original_text = result["text"]
        content.summary_brief = result["summary"]
        content.word_count = result["word_count"]
        content.page_count = result["page_count"]
        content.extraction_method = result["extraction_method"]
        content.processing_status = "completed"
        content.error_message = None
        
        # Save concepts to database
        for concept_data in result["concepts"]:
            # Check if concept already exists for this content
            existing_concept = db.query(Concept).filter(
                Concept.content_id == content_id,
                Concept.name == concept_data["name"]
            ).first()
            
            if not existing_concept:
                concept = Concept(
                    content_id=content_id,
                    name=concept_data["name"],
                    category=concept_data["category"],
                    confidence_score=concept_data["confidence"],
                    frequency=concept_data["frequency"]
                )
                db.add(concept)
        
        db.commit()
        
        logger.info(f"Successfully processed PDF content {content_id}")
        
    except Exception as e:
        # Update status to failed
        if content:
            content.processing_status = "failed"
            content.error_message = str(e)
            db.commit()
        
        logger.error(f"Error processing PDF content {content_id}: {e}")
        
    finally:
        db.close()

def process_youtube_content(content_id: str, url: str):
    """
    Background task to process YouTube content
    This is a placeholder for future implementation
    
    Args:
        content_id: Database content ID
        url: YouTube URL
    """
    db = SessionLocal()
    
    try:
        content = db.query(Content).filter(Content.id == content_id).first()
        if not content:
            logger.error(f"Content {content_id} not found")
            return
        
        # Update status to processing
        content.processing_status = "processing"
        db.commit()
        
        # TODO: Implement YouTube transcript extraction and processing
        # For now, just mark as completed with placeholder
        content.summary_brief = "YouTube content processing not yet implemented"
        content.processing_status = "pending"  # Keep as pending until implemented
        
        db.commit()
        
        logger.info(f"YouTube content {content_id} queued for future processing")
        
    except Exception as e:
        if content:
            content.processing_status = "failed"
            content.error_message = str(e)
            db.commit()
        
        logger.error(f"Error processing YouTube content {content_id}: {e}")
        
    finally:
        db.close()