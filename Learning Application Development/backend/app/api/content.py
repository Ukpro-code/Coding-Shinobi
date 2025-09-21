from fastapi import APIRouter, Depends, HTTPException, UploadFile, File, Form, BackgroundTasks, Query
from fastapi.responses import FileResponse
from sqlalchemy.orm import Session
from pydantic import BaseModel
from typing import Optional, List
from datetime import datetime
import uuid
import os
from jose import JWTError, jwt

from app.core.database import get_db
from app.core.config import settings
from app.models.database import Content, User
from app.api.auth import get_current_user
from app.services.background_tasks import process_pdf_content, process_youtube_content

router = APIRouter()

def decode_auth_token(token: str) -> Optional[str]:
    """Decode JWT token and return user ID"""
    try:
        print(f"Attempting to decode token: {token[:50]}...")
        print(f"Using secret key: {settings.secret_key[:20]}...")
        payload = jwt.decode(token, settings.secret_key, algorithms=["HS256"])
        print(f"Token payload: {payload}")
        user_id: str = payload.get("sub")
        print(f"Extracted user_id: {user_id}")
        return user_id
    except JWTError as e:
        print(f"JWT decode error: {e}")
        return None
    except Exception as e:
        print(f"Unexpected error: {e}")
        return None

# Pydantic models
class ContentCreate(BaseModel):
    title: str
    content_type: str  # youtube, pdf, article
    source_url: Optional[str] = None

class ContentResponse(BaseModel):
    id: str
    title: str
    content_type: str
    source_url: Optional[str]
    processing_status: str
    created_at: datetime
    summary_brief: Optional[str]

class ContentList(BaseModel):
    items: List[ContentResponse]
    total: int
    page: int
    size: int

# Routes
@router.post("/youtube", response_model=ContentResponse)
async def create_youtube_content(
    content: ContentCreate,
    background_tasks: BackgroundTasks,
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db)
):
    """Process YouTube content"""
    db_content = Content(
        user_id=current_user.id,
        title=content.title,
        content_type="youtube",
        source_url=content.source_url,
        processing_status="pending"
    )
    db.add(db_content)
    db.commit()
    db.refresh(db_content)
    
    # Add background task for processing (to be implemented)
    background_tasks.add_task(process_youtube_content, str(db_content.id), content.source_url)
    
    return ContentResponse(
        id=str(db_content.id),
        title=db_content.title,
        content_type=db_content.content_type,
        source_url=db_content.source_url,
        processing_status=db_content.processing_status,
        created_at=db_content.created_at,
        summary_brief=db_content.summary_brief
    )

@router.post("/pdf", response_model=ContentResponse)
async def create_pdf_content(
    background_tasks: BackgroundTasks,
    title: str = Form(...),
    file: UploadFile = File(...),
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db)
):
    """Upload and process PDF content"""
    if not file.filename.endswith('.pdf'):
        raise HTTPException(status_code=400, detail="Only PDF files are allowed")
    
    # Save file
    os.makedirs(settings.upload_dir, exist_ok=True)
    file_id = str(uuid.uuid4())
    file_path = os.path.join(settings.upload_dir, f"{file_id}_{file.filename}")
    
    with open(file_path, "wb") as buffer:
        content = await file.read()
        buffer.write(content)
    
    # Create database record
    db_content = Content(
        user_id=current_user.id,
        title=title,
        content_type="pdf",
        file_path=file_path,
        processing_status="pending"
    )
    db.add(db_content)
    db.commit()
    db.refresh(db_content)
    
    # Add background task for processing (to be implemented)
    background_tasks.add_task(process_pdf_content, str(db_content.id), file_path)
    
    return ContentResponse(
        id=str(db_content.id),
        title=db_content.title,
        content_type=db_content.content_type,
        source_url=None,
        processing_status=db_content.processing_status,
        created_at=db_content.created_at,
        summary_brief=db_content.summary_brief
    )

@router.get("/", response_model=ContentList)
async def list_content(
    page: int = 1,
    size: int = 20,
    content_type: Optional[str] = None,
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db)
):
    """List user's content"""
    try:
        query = db.query(Content).filter(Content.user_id == current_user.id)
        
        if content_type:
            query = query.filter(Content.content_type == content_type)
        
        total = query.count()
        items = query.offset((page - 1) * size).limit(size).all()
        
        content_list = [
            ContentResponse(
                id=str(item.id),
                title=item.title,
                content_type=item.content_type,
                source_url=item.source_url,
                processing_status=item.processing_status,
                created_at=item.created_at,
                summary_brief=item.summary_brief
            )
            for item in items
        ]
        
        return ContentList(
            items=content_list,
            total=total,
            page=page,
            size=size
        )
    except Exception as e:
        import traceback
        print(f"Error in list_content: {e}")
        print(traceback.format_exc())
        raise HTTPException(status_code=500, detail=f"Database error: {str(e)}")

@router.get("/{content_id}", response_model=ContentResponse)
async def get_content(
    content_id: str,
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db)
):
    """Get specific content by ID"""
    content = db.query(Content).filter(
        Content.id == content_id,
        Content.user_id == current_user.id
    ).first()
    
    if not content:
        raise HTTPException(status_code=404, detail="Content not found")
    
    return ContentResponse(
        id=str(content.id),
        title=content.title,
        content_type=content.content_type,
        source_url=content.source_url,
        processing_status=content.processing_status,
        created_at=content.created_at,
        summary_brief=content.summary_brief
    )

@router.delete("/{content_id}")
async def delete_content(
    content_id: str,
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db)
):
    """Delete content"""
    try:
        content = db.query(Content).filter(
            Content.id == content_id,
            Content.user_id == current_user.id
        ).first()
        
        if not content:
            raise HTTPException(status_code=404, detail="Content not found")
        
        # Delete file if exists (handle both absolute and relative paths)
        if content.file_path:
            file_path = content.file_path
            # If relative path, make it absolute
            if not os.path.isabs(file_path):
                file_path = os.path.join(os.path.dirname(__file__), '..', '..', file_path)
                file_path = os.path.normpath(file_path)
            
            try:
                if os.path.exists(file_path):
                    os.remove(file_path)
                    print(f"Successfully deleted file: {file_path}")
                else:
                    print(f"File not found (already deleted?): {file_path}")
            except Exception as e:
                print(f"Warning: Could not delete file {file_path}: {e}")
                # Don't fail the deletion if file removal fails
        
        # Delete related concepts
        try:
            from app.models.database import Concept
            concepts = db.query(Concept).filter(Concept.content_id == content_id).all()
            for concept in concepts:
                db.delete(concept)
            print(f"Deleted {len(concepts)} related concepts")
        except Exception as e:
            print(f"Warning: Could not delete concepts: {e}")
        
        # Delete the content record
        db.delete(content)
        db.commit()
        
        return {"message": "Content deleted successfully"}
        
    except HTTPException:
        raise
    except Exception as e:
        print(f"Error deleting content: {e}")
        db.rollback()
        raise HTTPException(status_code=500, detail=f"Failed to delete content: {str(e)}")

@router.get("/{content_id}/file")
async def get_content_file(
    content_id: str,
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db)
):
    """Serve the actual file for a content item"""
    content = db.query(Content).filter(
        Content.id == content_id,
        Content.user_id == current_user.id
    ).first()
    
    if not content:
        raise HTTPException(status_code=404, detail="Content not found")
    
    if not content.file_path or not os.path.exists(content.file_path):
        raise HTTPException(status_code=404, detail="File not found")
    
    return FileResponse(
        path=content.file_path,
        filename=f"{content.title}.pdf",
        media_type="application/pdf",
        headers={
            "Content-Disposition": "inline",
            "Cache-Control": "no-cache",
            "X-Frame-Options": "SAMEORIGIN"
        }
    )
