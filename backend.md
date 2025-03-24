# Backend Setup

## LabLens Backend

### Overview
LabLens is an AI-powered medical report analysis system that processes lab reports, detects abnormalities, and provides personalized health insights. The backend is built using **FastAPI**, following a modular and scalable architecture.

## Project Structure
```
backend/
├── app/
│   ├── core/
│   │   ├── __init__.py
│   │   ├── config.py          # Application configuration settings
│   │   ├── database.py        # Database connection and setup
│   │   └── security.py        # Authentication and security utilities
│   ├── models/
│   │   ├── __init__.py
│   │   ├── user.py            # User model and related functionality
│   │   ├── lab_report.py      # Lab report model
│   │   ├── diet_plan.py       # Diet plan model
│   │   └── token.py           # Token blocklist model
│   ├── routes/
│   │   ├── __init__.py
│   │   └── api_v1/
│   │       ├── __init__.py
│   │       └── endpoints/
│   │           ├── __init__.py
│   │           ├── auth.py    # Authentication endpoints
│   │           └── pdf_processing.py  # PDF processing endpoints
│   ├── __init__.py
│   └── main.py                # Main application entry point
├── requirements.txt           # Python dependencies
├── .env                       # Environment variables
└── .pre-commit-config.yaml    # Pre-commit hooks configuration
```

## Key Components

### 1. **Core Module**
- Manages application-wide settings and configurations.
- Handles database connections and security implementations.

### 2. **Models**
- Defines database models using **SQLAlchemy**.
- Establishes relationships between different entities.

### 3. **Routes**
- Organized by API versions (currently v1).
- Contains endpoint implementations grouped by functionality.

### 4. **Main Application**
- Initializes the **FastAPI** application.
- Sets up middleware, database connections, and API routes.

### 5. **Configuration Files**
- `.env`: Stores environment variables (e.g., API keys, database URLs).
- `requirements.txt`: Manages project dependencies.
- `.pre-commit-config.yaml`: Ensures code quality with pre-commit hooks.

## API Endpoints Overview
The backend follows **RESTful API principles** with proper authentication and versioning.

| Endpoint                           | Method | Auth | Description                        |
|------------------------------------|--------|------|------------------------------------|
| `/api/v1/reports/upload`          | POST   | ✅   | Upload lab report PDF             |
| `/api/v1/reports/{report_id}`     | GET    | ✅   | Get full report analysis          |
| `/api/v1/reports/{user_id}/history` | GET  | ✅   | Retrieve historical test trends   |
| `/api/v1/health-check`            | GET    | ❌   | Check service health status       |
| `/api/v1/users/register`          | POST   | ❌   | Register a new user               |
| `/api/v1/auth/login`              | POST   | ❌   | Authenticate user                  |
| `/api/v1/users/me`                | GET    | ✅   | Retrieve current user profile     |

## Installation & Setup

### 1. Clone the Repository
```sh
git clone https://github.com/your-repo/lablens-backend.git
cd lablens-backend
```

### 2. Create a Virtual Environment
```sh
python -m venv venv
source venv/bin/activate  # On macOS/Linux
venv\Scripts\activate     # On Windows
```

### 3. Install Dependencies
```sh
pip install -r requirements.txt
```

### 4. Set Up Environment Variables
Create a `.env` file and configure the necessary environment variables:
```sh
DATABASE_URL=postgresql://user:password@localhost/lablens_db
SECRET_KEY=your-secret-key
ACCESS_TOKEN_EXPIRE_MINUTES=30
```

### 5. Run the Server
```sh
uvicorn app.main:app --reload
```
The API will be available at:
```
http://localhost:8000
```

## Technologies Used
- **Framework**: FastAPI
- **Database**: PostgreSQL with SQLAlchemy
- **Authentication**: JWT-based authentication
- **PDF Processing**: PyPDF2, pdfminer.six
- **AI Integration**: Transformers, Torch
- **Testing**: Pytest

## Future Enhancements
- **Improved AI Predictions**: Enhance report analysis using advanced AI models.
- **Expanded Data Visualization**: Implement interactive health trends.
- **Multi-User Support**: Add family accounts for tracking multiple users.

This backend architecture ensures **scalability, security, and maintainability**, making it easier to integrate new features over time.

