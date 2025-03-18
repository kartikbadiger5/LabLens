from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy.ext.asyncio import AsyncSession
from app.core.security import (
    create_access_token,
    create_refresh_token,
    verify_password,
    get_password_hash,
    get_current_user,
    decode_token,
)
from app.core.database import get_db
from app.models.user import User
from app.models.token import TokenBlocklist
from datetime import datetime, timedelta
from typing import Optional
from sqlalchemy import select

router = APIRouter()

@router.post("/register")
async def register(
    username: str, email: str, password: str, db: AsyncSession = Depends(get_db)
):
    try:
        if "@" not in email:
            raise HTTPException(status_code=400, detail="Invalid email format")

        async with db.begin():
            result = await db.execute(
                select(User).where((User.username == username) | (User.email == email))
            )
            existing_user = result.scalars().first()
            
            if existing_user:
                raise HTTPException(status_code=400, detail="Username or email already exists")

            hashed_password = get_password_hash(password)
            new_user = User(username=username, email=email, hashed_password=hashed_password)
            db.add(new_user)
            await db.commit()
            await db.refresh(new_user)
            return {"message": "User created successfully", "user_id": new_user.id}
    except HTTPException:
        raise
    except Exception as e:
        await db.rollback()
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail=f"Failed to register user: {str(e)}"
        )

@router.post("/login")
async def login(username: str, password: str, db: AsyncSession = Depends(get_db)):
    try:
        result = await db.execute(select(User).where(User.username == username))
        user = result.scalars().first()
        
        if not user or not verify_password(password, user.hashed_password):
            raise HTTPException(
                status_code=status.HTTP_401_UNAUTHORIZED,
                detail="Incorrect username or password",
            )

        access_token = create_access_token({"sub": str(user.id)})
        refresh_token = create_refresh_token({"sub": str(user.id)})
        return {
            "access_token": access_token,
            "refresh_token": refresh_token,
            "token_type": "bearer"
        }
    except HTTPException:
        raise
    except Exception as e:
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail=f"Failed to login: {str(e)}"
        )

@router.post("/refresh")
async def refresh_token(refresh_token: str, db: AsyncSession = Depends(get_db)):
    try:
        payload = decode_token(refresh_token)
        user_id = payload.get("sub")
        if not user_id:
            raise HTTPException(status_code=401, detail="Invalid refresh token")

        result = await db.execute(select(User).where(User.id == int(user_id)))
        user = result.scalars().first()
        if not user:
            raise HTTPException(status_code=404, detail="User not found")

        new_access_token = create_access_token({"sub": str(user.id)})
        new_refresh_token = create_refresh_token({"sub": str(user.id)})
        return {"access_token": new_access_token, "refresh_token": new_refresh_token, "token_type": "bearer"}
    except HTTPException:
        raise
    except Exception as e:
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail=f"Failed to refresh token: {str(e)}"
        )

@router.post("/logout")
async def logout(token: str, db: AsyncSession = Depends(get_db)):
    try:
        payload = decode_token(token)
        expire = datetime.utcnow() + timedelta(minutes=1)
        blocklisted_token = TokenBlocklist(token=token, expires_at=expire)
        db.add(blocklisted_token)
        await db.commit()
        return {"message": "Successfully logged out"}
    except HTTPException:
        raise
    except Exception as e:
        await db.rollback()
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail=f"Failed to logout: {str(e)}"
        )

@router.get("/users/me")
async def read_current_user(current_user: User = Depends(get_current_user)):
    try:
        return {
            "id": current_user.id,
            "username": current_user.username,
            "email": current_user.email,
        }
    except Exception as e:
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail=f"Failed to fetch user details: {str(e)}"
        )