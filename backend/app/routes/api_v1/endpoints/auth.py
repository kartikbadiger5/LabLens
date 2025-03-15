from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy.orm import Session
from app.core.security import (
    create_access_token,
    verify_password,
    get_password_hash,
    get_current_user,
)
from app.core.database import get_db
from app.models.user import User

router = APIRouter()


@router.post("/register")
async def register(
    username: str, email: str, password: str, db: Session = Depends(get_db)
):
    existing_user = (
        db.query(User)
        .filter((User.username == username) | (User.email == email))
        .first()
    )
    if existing_user:
        raise HTTPException(status_code=400, detail="Username or email already exists")

    hashed_password = get_password_hash(password)
    new_user = User(username=username, email=email, hashed_password=hashed_password)
    db.add(new_user)
    db.commit()
    return {"message": "User created successfully", "user_id": new_user.id}


@router.post("/login")
async def login(username: str, password: str, db: Session = Depends(get_db)):
    user = db.query(User).filter(User.username == username).first()
    if not user or not verify_password(password, user.hashed_password):
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="Incorrect username or password",
        )

    access_token = create_access_token({"sub": str(user.id)})
    return {"access_token": access_token, "token_type": "bearer"}


@router.get("/users/me")
async def read_current_user(current_user: User = Depends(get_current_user)):
    return {
        "id": current_user.id,
        "username": current_user.username,
        "email": current_user.email,
    }
