@echo off
REM Setup script for Our Big Company Database (Windows)
echo Setting up PostgreSQL database for Our Big Company...

REM Database configuration
set DB_NAME=our_big_company_db
set DB_USER=postgres

echo Creating database '%DB_NAME%'...

REM Create database (you may need to enter your PostgreSQL password)
psql -U %DB_USER% -c "CREATE DATABASE %DB_NAME%;" 2>nul

REM Check if psql command succeeded
if %ERRORLEVEL% EQU 0 (
    echo ✅ Database '%DB_NAME%' is ready!
    echo.
    echo Next steps:
    echo 1. Copy .env.example to .env and update database credentials if needed
    echo 2. Install Python dependencies: pip install -r requirements.txt
    echo 3. Run the server: python main.py
    echo.
    echo Database URL: postgresql://%DB_USER%:password@localhost/%DB_NAME%
) else (
    echo ❌ Failed to create database. Please check your PostgreSQL setup.
    echo Make sure PostgreSQL is installed and running.
    echo Visit: https://www.postgresql.org/download/
    pause
)
