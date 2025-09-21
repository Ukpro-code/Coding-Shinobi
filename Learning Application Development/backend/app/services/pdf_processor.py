"""
PDF Processing Module for Personal Learning System
Handles PDF text extraction and concept identification
"""
import PyPDF2
import pdfplumber
import os
from typing import Dict, List, Optional
import logging

logger = logging.getLogger(__name__)

def extract_text_from_pdf(file_path: str) -> Dict[str, any]:
    """
    Extract text from PDF using multiple methods for best results
    
    Args:
        file_path: Path to the PDF file
        
    Returns:
        Dict containing extracted text, metadata, and processing info
    """
    result = {
        "text": "",
        "page_count": 0,
        "extraction_method": None,
        "metadata": {},
        "success": False,
        "error": None
    }
    
    if not os.path.exists(file_path):
        result["error"] = "File not found"
        return result
    
    try:
        # Try pdfplumber first (better for complex layouts)
        result = _extract_with_pdfplumber(file_path, result)
        
        # If pdfplumber didn't work well, try PyPDF2
        if not result["success"] or len(result["text"].strip()) < 100:
            logger.info("Trying PyPDF2 as fallback")
            result = _extract_with_pypdf2(file_path, result)
            
    except Exception as e:
        result["error"] = str(e)
        logger.error(f"PDF extraction failed: {e}")
    
    return result

def _extract_with_pdfplumber(file_path: str, result: Dict) -> Dict:
    """Extract text using pdfplumber"""
    try:
        with pdfplumber.open(file_path) as pdf:
            text_parts = []
            
            result["page_count"] = len(pdf.pages)
            result["metadata"] = pdf.metadata or {}
            
            for page_num, page in enumerate(pdf.pages, 1):
                try:
                    page_text = page.extract_text()
                    if page_text:
                        text_parts.append(f"--- Page {page_num} ---\n{page_text}")
                except Exception as e:
                    logger.warning(f"Failed to extract page {page_num}: {e}")
                    continue
            
            result["text"] = "\n\n".join(text_parts)
            result["extraction_method"] = "pdfplumber"
            result["success"] = len(result["text"].strip()) > 0
            
    except Exception as e:
        result["error"] = f"pdfplumber extraction failed: {e}"
        logger.error(f"pdfplumber extraction failed: {e}")
    
    return result

def _extract_with_pypdf2(file_path: str, result: Dict) -> Dict:
    """Extract text using PyPDF2 as fallback"""
    try:
        with open(file_path, 'rb') as file:
            pdf_reader = PyPDF2.PdfReader(file)
            text_parts = []
            
            result["page_count"] = len(pdf_reader.pages)
            
            # Extract metadata
            if pdf_reader.metadata:
                result["metadata"] = {
                    "title": pdf_reader.metadata.get("/Title", ""),
                    "author": pdf_reader.metadata.get("/Author", ""),
                    "subject": pdf_reader.metadata.get("/Subject", ""),
                    "creator": pdf_reader.metadata.get("/Creator", "")
                }
            
            for page_num, page in enumerate(pdf_reader.pages, 1):
                try:
                    page_text = page.extract_text()
                    if page_text:
                        text_parts.append(f"--- Page {page_num} ---\n{page_text}")
                except Exception as e:
                    logger.warning(f"Failed to extract page {page_num} with PyPDF2: {e}")
                    continue
            
            result["text"] = "\n\n".join(text_parts)
            result["extraction_method"] = "PyPDF2"
            result["success"] = len(result["text"].strip()) > 0
            
    except Exception as e:
        result["error"] = f"PyPDF2 extraction failed: {e}"
        logger.error(f"PyPDF2 extraction failed: {e}")
    
    return result

def extract_concepts_from_text(text: str, max_concepts: int = 20) -> List[Dict[str, any]]:
    """
    Extract key concepts from text using simple keyword analysis
    This is a basic implementation - can be enhanced with AI later
    
    Args:
        text: Extracted text from PDF
        max_concepts: Maximum number of concepts to return
        
    Returns:
        List of concept dictionaries with name, category, confidence
    """
    concepts = []
    
    if not text or len(text.strip()) < 50:
        return concepts
    
    # Simple keyword-based concept extraction
    # This is a placeholder for more sophisticated AI-based extraction
    
    # Common academic/business terms to look for
    concept_patterns = {
        "technical": [
            "algorithm", "system", "process", "method", "approach", "framework",
            "architecture", "design", "implementation", "analysis", "model",
            "database", "network", "security", "performance", "optimization"
        ],
        "business": [
            "strategy", "management", "leadership", "team", "project", "planning",
            "marketing", "sales", "customer", "revenue", "profit", "growth",
            "innovation", "competition", "market", "analysis", "report"
        ],
        "research": [
            "study", "research", "hypothesis", "experiment", "data", "results",
            "conclusion", "methodology", "literature", "review", "theory",
            "evidence", "findings", "statistical", "correlation", "significance"
        ],
        "general": [
            "problem", "solution", "challenge", "opportunity", "risk", "benefit",
            "advantage", "disadvantage", "factor", "element", "component",
            "feature", "characteristic", "principle", "concept", "idea"
        ]
    }
    
    text_lower = text.lower()
    word_count = {}
    
    # Count occurrences of concept words
    for category, words in concept_patterns.items():
        for word in words:
            count = text_lower.count(word)
            if count > 0:
                word_count[word] = {
                    "count": count,
                    "category": category,
                    "confidence": min(count / 10.0, 1.0)  # Basic confidence scoring
                }
    
    # Sort by count and take top concepts
    sorted_concepts = sorted(word_count.items(), key=lambda x: x[1]["count"], reverse=True)
    
    for word, data in sorted_concepts[:max_concepts]:
        concepts.append({
            "name": word.title(),
            "category": data["category"],
            "confidence": data["confidence"],
            "frequency": data["count"]
        })
    
    return concepts

def create_content_summary(text: str, max_length: int = 500) -> str:
    """
    Create a brief summary of the content
    This is a simple implementation - can be enhanced with AI
    
    Args:
        text: Full text content
        max_length: Maximum length of summary
        
    Returns:
        Brief summary string
    """
    if not text or len(text.strip()) < 100:
        return "Content too short to summarize."
    
    # Simple extractive summary - take first few sentences
    sentences = text.split('.')
    summary_parts = []
    current_length = 0
    
    for sentence in sentences:
        sentence = sentence.strip()
        if not sentence:
            continue
            
        if current_length + len(sentence) > max_length:
            break
            
        summary_parts.append(sentence)
        current_length += len(sentence)
    
    summary = '. '.join(summary_parts)
    if summary and not summary.endswith('.'):
        summary += '.'
    
    return summary or "Unable to generate summary."

def process_pdf_file(file_path: str, content_id: str) -> Dict[str, any]:
    """
    Complete PDF processing pipeline
    
    Args:
        file_path: Path to PDF file
        content_id: Database content ID
        
    Returns:
        Processing results including text, concepts, and summary
    """
    logger.info(f"Starting PDF processing for content {content_id}")
    
    # Extract text
    extraction_result = extract_text_from_pdf(file_path)
    
    if not extraction_result["success"]:
        return {
            "success": False,
            "error": extraction_result["error"],
            "content_id": content_id
        }
    
    text = extraction_result["text"]
    
    # Extract concepts
    concepts = extract_concepts_from_text(text)
    
    # Create summary
    summary = create_content_summary(text)
    
    result = {
        "success": True,
        "content_id": content_id,
        "text": text,
        "concepts": concepts,
        "summary": summary,
        "metadata": extraction_result["metadata"],
        "page_count": extraction_result["page_count"],
        "extraction_method": extraction_result["extraction_method"],
        "word_count": len(text.split()) if text else 0
    }
    
    logger.info(f"PDF processing complete for content {content_id}: "
                f"{result['page_count']} pages, {result['word_count']} words, "
                f"{len(concepts)} concepts")
    
    return result