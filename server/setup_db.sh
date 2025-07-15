#!/bin/bash

# Setup script for Our Big Company Database
echo "Setting up PostgreSQL database for Our Big Company..."

# Check if PostgreSQL is installed
if ! command -v psql &> /dev/null; then
    echo "PostgreSQL is not installed. Please install PostgreSQL first."
    echo "Visit: https://www.postgresql.org/download/"
    exit 1
fi

# Database configuration
DB_NAME="our_big_company_db"
DB_USER="postgres"

echo "Creating database '$DB_NAME'..."

# Create database (you may need to enter your PostgreSQL password)
psql -U $DB_USER -c "CREATE DATABASE $DB_NAME;" 2>/dev/null || echo "Database may already exist"

# Check if database was created/exists
if psql -U $DB_USER -lqt | cut -d \| -f 1 | grep -qw $DB_NAME; then
    echo "✅ Database '$DB_NAME' is ready!"
    echo ""
    echo "Next steps:"
    echo "1. Copy .env.example to .env and update database credentials if needed"
    echo "2. Install Python dependencies: pip install -r requirements.txt"
    echo "3. Run the server: python main.py"
    echo ""
    echo "Database URL: postgresql://$DB_USER:password@localhost/$DB_NAME"
else
    echo "❌ Failed to create database. Please check your PostgreSQL setup."
    exit 1
fi
