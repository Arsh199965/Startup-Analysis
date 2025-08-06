#!/usr/bin/env python3
"""
Migration script to add is_manual and original_text columns to startup_files table
"""

import sqlite3
import os
from pathlib import Path

def migrate_database():
    # Get the database path
    db_path = Path(__file__).parent.parent / "storage" / "our_big_company.db"
    
    if not db_path.exists():
        print(f"Database not found at {db_path}")
        return
    
    # Connect to database
    conn = sqlite3.connect(str(db_path))
    cursor = conn.cursor()
    
    try:
        # Check if columns already exist
        cursor.execute("PRAGMA table_info(startup_files)")
        columns = [row[1] for row in cursor.fetchall()]
        
        if 'is_manual' not in columns:
            print("Adding is_manual column...")
            cursor.execute("ALTER TABLE startup_files ADD COLUMN is_manual BOOLEAN DEFAULT 0")
            print("✓ Added is_manual column")
        else:
            print("is_manual column already exists")
        
        if 'original_text' not in columns:
            print("Adding original_text column...")
            cursor.execute("ALTER TABLE startup_files ADD COLUMN original_text TEXT")
            print("✓ Added original_text column")
        else:
            print("original_text column already exists")
        
        # Commit changes
        conn.commit()
        print("✅ Database migration completed successfully")
        
    except Exception as e:
        print(f"❌ Migration failed: {e}")
        conn.rollback()
    finally:
        conn.close()

if __name__ == "__main__":
    migrate_database()
