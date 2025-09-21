#!/usr/bin/env python3
"""
Script to force database schema recreation for SQLAlchemy
"""

import sys
import os
sys.path.append(os.path.dirname(os.path.abspath(__file__)))

from app.core.database import engine, Base
from app.models.database import User, Content, Concept, ConceptRelationship, UserInteraction, ProcessingJob

def reset_database():
    """Force recreation of all database tables"""
    print("Dropping all tables...")
    Base.metadata.drop_all(bind=engine)
    
    print("Creating all tables...")
    Base.metadata.create_all(bind=engine)
    
    print("Database schema reset complete!")
    
    # Verify table creation
    from sqlalchemy import inspect
    inspector = inspect(engine)
    tables = inspector.get_table_names()
    print(f"Created tables: {tables}")
    
    # Check contents table structure specifically
    contents_columns = [col['name'] for col in inspector.get_columns('contents')]
    print(f"Contents table columns: {contents_columns}")

if __name__ == "__main__":
    reset_database()