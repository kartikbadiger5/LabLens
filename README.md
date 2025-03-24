# LabLens - Medical Lab Report Analysis System

## Overview
LabLens is a comprehensive system for analyzing medical lab reports using AI. It provides features for:
- PDF report upload and analysis
- AI-powered insights and recommendations
- Diet plan generation based on lab results
- Secure user authentication and data management

## Tech Stack
- **Backend**: FastAPI (Python)
- **Database**: PostgreSQL (with asyncpg)
- **AI Services**: Google Gemini, ElevenLabs
- **Authentication**: JWT tokens with refresh/access token mechanism
- **Security**: HTTPS, SSL, bcrypt password hashing

## Key Features

### Authentication System
```python:backend/app/core/security.py
# JWT token creation and validation
def create_access_token(data: dict):
    # Generates access token with expiration
    pass

async def get_current_user(credentials: HTTPAuthorizationCredentials):
    # Validates JWT token and returns user
    pass
```

#### Authentication Features:
- JWT token generation with expiration
- Refresh token mechanism
- Password hashing using bcrypt
- Token revocation system
- Secure cookie-based refresh token storage
- Role-based access control (future implementation)

### PDF Processing
```python:backend/app/routes/api_v1/endpoints/pdf_processing.py
@router.post("/reports/upload")
async def upload_pdf(file: UploadFile):
    # Handles PDF upload and analysis
    pass
```

#### PDF Processing Features:
- PDF file validation and text extraction
- AI-powered lab report validation
- Comprehensive report analysis using Gemini AI
- Abnormal result detection and classification
- Critical alert identification
- Medical recommendations generation
- Visualization data extraction for charts
- Audio summary generation using ElevenLabs
- Report history management

### Database Models

#### User Model
```python:backend/app/models/user.py
class User(Base):
    # User model with authentication fields
    pass
```

#### User Model Features:
- User authentication credentials
- Email verification status
- Relationship with lab reports and diet plans
- Secure password storage
- Unique email and username constraints

#### Lab Report Model
```python:backend/app/models/lab_report.py
class LabReport(Base):
    # Stores processed lab report data
    pass
```

#### Lab Report Model Features:
- User association
- Original filename storage
- Processed JSON data storage
- Relationship with diet plans
- Report history tracking

#### Diet Plan Model
```python:backend/app/models/diet_plan.py
class DietPlan(Base):
    # Stores AI-generated diet plans
    pass
```

#### Diet Plan Model Features:
- User association
- Report association
- JSON data storage for meal plans
- Nutritional recommendations
- Meal-specific food suggestions

## Installation

1. Clone the repository:
   ```bash
   git clone https://github.com/yourusername/lablens.git
   cd lablens
   ```

2. Set up environment variables:
   ```bash
   cp .env.example .env
   # Edit .env with your credentials
   ```

3. Install dependencies:
   ```bash
   pip install -r requirements.txt
   ```

4. Run the application:
   ```bash
   uvicorn app.main:app --reload
   ```

## API Documentation

The API is documented using Swagger UI. After starting the server, access it at:

```
http://localhost:8000/docs
```

## Security Features

- JWT token authentication with refresh tokens
- Token revocation system
- Password hashing using bcrypt
- HTTPS enforced for all endpoints
- CSRF protection
- Secure cookie settings
- Input validation and sanitization
- Rate limiting (future implementation)

## Workflow

1. User registration and authentication
2. PDF lab report upload
3. AI analysis and validation
4. Report processing and storage
5. Diet plan generation
6. Report and diet plan retrieval
7. Audio summary generation
8. Data visualization

## Contributing

1. Fork the repository
2. Create your feature branch
3. Commit your changes
4. Push to the branch
5. Create a new Pull Request

## License
This project is licensed under the MIT License - see the LICENSE file for details.

## Contact
For any queries, please contact: support@lablens.com