#!/usr/bin/env python3
"""
Cleanup script for removing redundant files in the Productivity Web-App project.
This script identifies and removes test/debug HTML files and other redundant files.

Usage:
    - Run this script from the command line: python cleanup_redundant_files.py
    - The script will ask for confirmation before deleting files
    - Use --force flag to skip confirmation: python cleanup_redundant_files.py --force
"""

import os
import shutil
import sys
from datetime import datetime

# Get the directory of this script
BASE_DIR = os.path.dirname(os.path.abspath(__file__))

# Files to delete (relative to the project root)
REDUNDANT_FILES = [
    # Test HTML files
    'button_test.html',
    'calendar_output.html',
    'calendar_grid_output.html',
    'debug_calendar.html',
    'debug_simple.html',
    'element_test.html',
    'final_test_output.html',
    'focus_test_calendar.html',
    'fresh_calendar_output.html',
    'js_test.html',  # Duplicate of templates/js_test.html
    'simple_view_test.html',
    'standalone_test.html',
    'test_js.html',
    'test_template_output.html',
    'working_calendar.html',
    
    # Test Python files
    'test_priority1.py'
]

def backup_files(files_to_backup):
    """Creates a backup of files before deletion"""
    backup_dir = os.path.join(BASE_DIR, f"backup_{datetime.now().strftime('%Y%m%d_%H%M%S')}")
    
    if not os.path.exists(backup_dir):
        os.makedirs(backup_dir)
        print(f"Created backup directory: {backup_dir}")
    
    for file_path in files_to_backup:
        full_path = os.path.join(BASE_DIR, file_path)
        if os.path.exists(full_path):
            backup_path = os.path.join(backup_dir, os.path.basename(file_path))
            shutil.copy2(full_path, backup_path)
    
    print(f"Backup created in: {backup_dir}")
    return backup_dir

def cleanup_files(force=False):
    """Clean up redundant files"""
    print("Redundant files to be deleted:")
    
    files_to_delete = []
    for file_path in REDUNDANT_FILES:
        full_path = os.path.join(BASE_DIR, file_path)
        if os.path.exists(full_path):
            files_to_delete.append(file_path)
            print(f"  - {file_path}")
    
    if not files_to_delete:
        print("No redundant files found.")
        return
    
    if not force:
        # Backup files
        backup_dir = backup_files(files_to_delete)
        
        # Ask for confirmation
        confirm = input("\nAre you sure you want to delete these files? (yes/no): ")
        if confirm.lower() not in ['yes', 'y']:
            print("Operation cancelled.")
            return
    
    # Delete the files
    deleted_count = 0
    for file_path in files_to_delete:
        full_path = os.path.join(BASE_DIR, file_path)
        try:
            os.remove(full_path)
            deleted_count += 1
            print(f"Deleted: {file_path}")
        except Exception as e:
            print(f"Error deleting {file_path}: {str(e)}")
    
    print(f"\nDeleted {deleted_count} redundant files.")
    if not force and deleted_count > 0:
        print(f"Backup was created in: {backup_dir}")

if __name__ == "__main__":
    # Check for force flag
    force_mode = "--force" in sys.argv
    
    print("=== Redundant Files Cleanup Script ===")
    cleanup_files(force=force_mode)