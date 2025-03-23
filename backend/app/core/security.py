from datetime import datetime, timedelta
from fastapi.security import HTTPBearer, HTTPAuthorizationCredentials
from fastapi import Depends, HTTPException, status
from jose import JWTError, jwt
import bcrypt
from typing import Optional, Dict, Any
from app.core.config import settings
from app.core.database import get_db
from sqlalchemy.ext.asyncio import AsyncSession
from app.models.user import User
from sqlalchemy import select
import uuid
from datetime import datetime, timedelta
from app.models.token import TokenBlocklist
# Initialize Bearer scheme
bearer_scheme = HTTPBearer()
# Token expiration settings
REFRESH_TOKEN_EXPIRE_DAYS = 7  # Refresh token expires in 7 days
ACCESS_TOKEN_EXPIRE_MINUTES = 15  # Access token expires in 15 minutes

# Other application settings can go here 

def create_access_token(data: dict, expires_delta: Optional[timedelta] = None):
    to_encode = data.copy()
    expire = datetime.utcnow() + (
        expires_delta or timedelta(minutes=settings.ACCESS_TOKEN_EXPIRE_MINUTES)
    )
    token = str(uuid.uuid4())  # Add unique token
    to_encode.update({"exp": expire, "token": token})
    return jwt.encode(to_encode, settings.SECRET_KEY, algorithm=settings.ALGORITHM)

def create_refresh_token(data: dict, expires_delta: Optional[timedelta] = None):
    to_encode = data.copy()
    expire = datetime.utcnow() + (
        expires_delta or timedelta(days=settings.REFRESH_TOKEN_EXPIRE_DAYS)
    )
    token = str(uuid.uuid4())  # Add unique token
    to_encode.update({"exp": expire, "token": token})
    return jwt.encode(to_encode, settings.SECRET_KEY, algorithm=settings.ALGORITHM)


async def decode_token(token: str, db: AsyncSession):  # Add db parameter
    try:
        payload = jwt.decode(
            token, settings.SECRET_KEY, algorithms=[settings.ALGORITHM]
        )
        token = payload.get("token")
        # Check if token is revoked
        result = await db.execute(select(TokenBlocklist).where(TokenBlocklist.token == token))
        if result.scalars().first():
            raise HTTPException(status_code=401, detail="Token revoked")
        return payload
    except JWTError:
        raise HTTPException(status_code=401, detail="Invalid token")


async def get_current_user(
    credentials: HTTPAuthorizationCredentials = Depends(bearer_scheme),
    db: AsyncSession = Depends(get_db),
):
    token = credentials.credentials
    try:
        payload = await decode_token(token, db)
        user_id = payload.get("sub")
        if not user_id:
            raise HTTPException(status_code=401, detail="Invalid credentials")

        # Remove async with db.begin() here
        result = await db.execute(select(User).where(User.id == int(user_id)))
        user = result.scalars().first()
        if not user:
            raise HTTPException(status_code=404, detail="User not found")

        return user
    except JWTError:
        raise HTTPException(status_code=401, detail="Could not validate credentials")

def get_password_hash(password: str) -> str:
    salt = bcrypt.gensalt()
    hashed = bcrypt.hashpw(password.encode("utf-8"), salt)
    return hashed.decode("utf-8")


def verify_password(plain_password: str, hashed_password: str) -> bool:
    return bcrypt.checkpw(
        plain_password.encode("utf-8"), hashed_password.encode("utf-8")
    )
