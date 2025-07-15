# Our Big Company Startup Submission Portal

A beautiful, modern web application for startup submissions with file upload capabilities. Built with Next.js frontend and FastAPI backend with PostgreSQL database.

## 🚀 Features

- **Modern UI**: Beautiful gradient design with smooth animations
- **File Upload**: Drag & drop or click to upload company documents
- **PostgreSQL Database**: Secure and scalable data storage
- **Real-time Validation**: Form validation with visual feedback
- **Admin Dashboard**: View and manage all submissions
- **Responsive Design**: Works perfectly on all device sizes
- **RESTful API**: FastAPI with automatic OpenAPI documentation

## 🏗️ Architecture

- **Frontend**: Next.js 14 with TypeScript, Tailwind CSS, Framer Motion
- **Backend**: FastAPI with Python, SQLAlchemy ORM
- **Database**: PostgreSQL for robust data storage
- **Styling**: Modern glassmorphism design with custom gradients

## 📋 Prerequisites

- Node.js 18+ and npm
- Python 3.8+ and pip
- PostgreSQL 12+ (Download from https://www.postgresql.org/download/)

## 🛠️ Installation & Setup

### 1. Database Setup

First, install and set up PostgreSQL:

**Windows:**
```bash
cd server
setup_db.bat
```

**macOS/Linux:**
```bash
cd server
chmod +x setup_db.sh
./setup_db.sh
```

**Manual Setup:**
```sql
-- Connect to PostgreSQL as superuser
psql -U postgres

-- Create database
CREATE DATABASE our_big_company_db;

-- Exit psql
\q
```

### 2. Backend Setup (FastAPI)

1. Navigate to the server directory:
```bash
cd server
```

2. Create and activate virtual environment (recommended):
```bash
# Windows
python -m venv venv
venv\Scripts\activate

# macOS/Linux
python -m venv venv
source venv/bin/activate
```

3. Install Python dependencies:
```bash
pip install -r requirements.txt
```

4. Set up environment variables:
```bash
# Copy the example environment file
cp .env.example .env

# Edit .env file with your database credentials
# DATABASE_URL=postgresql://username:password@localhost/our_big_company_db
```

5. Initialize the database:
```bash
python init_db.py
```

6. Start the FastAPI server:
```bash
# On Windows
start_server.bat

# On macOS/Linux
chmod +x start_server.sh
./start_server.sh

# Or manually
uvicorn main:app --host 0.0.0.0 --port 8000 --reload
```

The API will be available at:
- **API**: `http://localhost:8000`
- **API Docs**: `http://localhost:8000/docs`
- **API Redoc**: `http://localhost:8000/redoc`

### 3. Frontend Setup (Next.js)

1. Navigate to the client directory:
```bash
cd client
```

2. Install dependencies:
```bash
npm install
```

3. Start the development server:
```bash
npm run dev
```

The application will be available at `http://localhost:3000`

## 🔧 API Endpoints

### Main Endpoints
- `POST /api/submit-startup` - Submit startup information with files
- `GET /api/submissions/{id}` - Get specific submission details
- `GET /api/submissions` - List all submissions (admin)
- `GET /api/stats` - Get submission statistics
- `GET /health` - Health check endpoint

### Database Schema

**Startups Table:**
- `id` (Primary Key)
- `submission_id` (UUID)
- `startup_name`
- `submitter_name`
- `status`
- `created_at`
- `updated_at`

**Startup Files Table:**
- `id` (Primary Key)
- `startup_id` (Foreign Key)
- `original_name`
- `saved_name`
- `file_path`
- `file_size`
- `content_type`
- `created_at`

## 📁 Project Structure

```
├── client/                 # Next.js frontend
│   ├── src/
│   │   ├── app/
│   │   │   ├── layout.tsx  # Root layout
│   │   │   ├── page.tsx    # Main submission page
│   │   │   └── globals.css # Global styles
│   │   └── components/
│   │       └── ui/         # Reusable UI components
│   └── package.json
├── server/                 # FastAPI backend
│   ├── main.py            # FastAPI application
│   ├── database.py        # Database configuration
│   ├── models.py          # SQLAlchemy models
│   ├── schemas.py         # Pydantic schemas
│   ├── init_db.py         # Database initialization
│   ├── requirements.txt   # Python dependencies
│   ├── setup_db.bat/.sh   # Database setup scripts
│   ├── start_server.bat/.sh # Server startup scripts
│   ├── .env.example       # Environment template
│   ├── uploads/           # Uploaded files storage
│   └── submissions/       # Submission metadata storage
└── README.md
```

## 🎨 Design Features

- **Gradient Backgrounds**: Modern multi-color gradients
- **Glassmorphism**: Frosted glass effect on form elements
- **Smooth Animations**: Framer Motion for delightful interactions
- **Icon Integration**: Lucide React icons throughout
- **Responsive Layout**: Mobile-first design approach

## 🔒 Security Features

- **CORS Configuration**: Properly configured for local development
- **File Validation**: Secure file upload handling
- **Unique IDs**: UUID-based submission tracking
- **Error Handling**: Comprehensive error management

## 🚀 Deployment

### Frontend (Vercel/Netlify)
1. Build the client: `npm run build`
2. Deploy the `client` directory

### Backend (Railway/Heroku/DigitalOcean)
1. Deploy the `server` directory
2. Update CORS origins in `main.py` for production domain
3. Set environment variables as needed

## 📝 Environment Variables

### Backend
- `UPLOAD_DIR`: Directory for file uploads (default: "uploads")
- `SUBMISSIONS_DIR`: Directory for submission metadata (default: "submissions")

### Frontend
- Update API endpoint in `page.tsx` for production deployment

## 🤝 Contributing

1. Fork the repository
2. Create a feature branch
3. Make your changes
4. Test thoroughly
5. Submit a pull request

## 📄 License

This project is licensed under the MIT License.

## 🆘 Troubleshooting

### Common Issues

1. **CORS Errors**: Make sure the backend is running on port 8000
2. **File Upload Fails**: Check that the uploads directory exists and has write permissions
3. **Frontend Build Errors**: Ensure all dependencies are installed with `npm install`
4. **Python Import Errors**: Verify all requirements are installed with `pip install -r requirements.txt`

### Development Tips

- The backend automatically creates necessary directories on startup
- File uploads are stored with UUID names to prevent conflicts
- Submission metadata is stored as JSON for easy retrieval
- Use the browser's developer tools to debug API calls
