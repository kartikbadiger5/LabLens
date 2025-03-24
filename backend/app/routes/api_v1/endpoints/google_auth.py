import secrets
import httpx
from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy import select
from pydantic import BaseModel
from app.core.security import (
    create_access_token,
    create_refresh_token,
    get_password_hash,
)
from app.core.database import get_db
from app.models.user import User

router = APIRouter()

class GoogleAuthRequest(BaseModel):
    access_token: str

class GoogleAuthResponse(BaseModel):
    access_token: str
    refresh_token: str
    token_type: str = "bearer"

@router.post("/google", response_model=GoogleAuthResponse)
async def google_auth(request_data: GoogleAuthRequest, db: AsyncSession = Depends(get_db)):
    # Verify Google access token using userinfo endpoint
    async with httpx.AsyncClient() as client:
        google_response = await client.get(
            "https://www.googleapis.com/oauth2/v3/userinfo",
            headers={"Authorization": f"Bearer {request_data.access_token}"}
        )

    if google_response.status_code != 200:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="Invalid Google token"
        )

    google_data = google_response.json()
    email = google_data.get("email")
    if not email:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="Google token does not contain email"
        )

    # Check for existing user
    result = await db.execute(select(User).where(User.email == email))
    user = result.scalars().first()

    if not user:
        # Generate unique username
        username_base = google_data.get("name") or email.split("@")[0]
        username = username_base
        suffix = 1
        while True:
            # Check if username exists
            result = await db.execute(select(User).where(User.username == username))
            if not result.scalars().first():
                break
            username = f"{username_base}{suffix}"
            suffix += 1

        # Create new user
        random_password = secrets.token_urlsafe(12)
        hashed_password = get_password_hash(random_password)
        new_user = User(
            username=username,
            email=email,
            hashed_password=hashed_password
        )
        
        db.add(new_user)
        await db.commit()
        await db.refresh(new_user)  # Refresh to get generated ID
        user = new_user

    # Generate JWT tokens
    access_token = create_access_token({"sub": str(user.id)})
    refresh_token = create_refresh_token({"sub": str(user.id)})

    return {
        "access_token": access_token,
        "refresh_token": refresh_token,
        "token_type": "bearer"
    }