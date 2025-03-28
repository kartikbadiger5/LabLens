from fastapi import APIRouter, Depends, HTTPException, status, Request,BackgroundTasks
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
from pydantic import BaseModel, EmailStr, Field
import secrets
from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy.ext.asyncio import AsyncSession
from app.core.security import get_password_hash
from app.core.database import get_db
from app.models.user import User
from sendgrid import SendGridAPIClient
from sendgrid.helpers.mail import Mail
from sqlalchemy import select

SENDGRID_API_KEY = (
    "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"
)
FROM_EMAIL = "kartik@brightinfonet.com"
OTP_TEMPLATE_ID = "d-49e22c3ceb2740119aa1bdf41db8b15d"

router = APIRouter()

otp_storage = {}  # Temporary storage (use a database for production)


class LoginSchema(BaseModel):
    email: EmailStr
    password: str

class RegisterRequest(BaseModel):
    username: str = Field(..., alias="name", description="Username for the new user", example="john_doe")
    email: EmailStr = Field(..., description="Email address of the new user", example="john@example.com")
    password: str = Field(..., min_length=6, description="Password for the new user", example="password123")
    confirm_password: Optional[str] = Field(None, alias="confirmPassword", min_length=6, description="Password confirmation (required when verifying OTP)", example="password123")
    otp: Optional[str] = Field(None, min_length=6, max_length=6, description="Optional OTP for verification (6 digits)", example="123456")

    class Config:
        allow_population_by_field_name = True
        schema_extra = {
            "example": {
                "name": "john_doe",
                "email": "john@example.com",
                "password": "password123",
                "otp": "123456"
            }
        }

class RegisterResponse(BaseModel):
    message: str
    clear_fields: Optional[bool] = None

    class Config:
        schema_extra = {
            "example": {
                "message": "User registered successfully",
                "clear_fields": True
            }
        }

def send_email(to_email: str, template_id: str, dynamic_data: dict):
    """
    Send an email using SendGrid's dynamic template.
    """
    message = Mail(from_email=FROM_EMAIL, to_emails=to_email)
    message.template_id = template_id
    message.dynamic_template_data = dynamic_data
    try:
        sg = SendGridAPIClient(SENDGRID_API_KEY)
        response = sg.send(message)
        print(f"Email sent to {to_email}. Status Code: {response.status_code}")
    except Exception as e:
        print(f"Error sending email: {e}")
        # You might want to log this error for debugging.
        raise HTTPException(status_code=500, detail="Failed to send email")

@router.post("/register", response_model=RegisterResponse)
async def register(
    request: RegisterRequest,
    background_tasks: BackgroundTasks,
    db: AsyncSession = Depends(get_db)
):
    username = request.username
    email = request.email
    password = request.password
    confirm_password = request.confirm_password  # May be None in OTP step
    otp = request.otp

    if "@" not in email:
        raise HTTPException(status_code=400, detail="Invalid email format")

    # Only perform password match check if confirm_password is provided.
    # This check is applied only when an OTP is provided (i.e. second submission).
    if otp is not None and confirm_password is not None:
        if password != confirm_password:
            raise HTTPException(status_code=400, detail="Passwords do not match")

    async with db.begin():
        result = await db.execute(select(User).where(User.email == email))
        existing_user = result.scalars().first()
        if existing_user:
            raise HTTPException(status_code=400, detail="Email already registered")

    if otp is None:
        # First submission: generate and send OTP asynchronously.
        generated_otp = f"{secrets.randbelow(1_000_000):06}"
        otp_storage[email] = generated_otp
        background_tasks.add_task(send_email, email, OTP_TEMPLATE_ID, {"otp": generated_otp})
        return {"message": "OTP sent to your email, please verify."}

    # OTP verification step
    stored_otp = otp_storage.get(email)
    if not stored_otp or stored_otp != otp:
        raise HTTPException(status_code=400, detail="Invalid or expired OTP")

    async with db.begin():
        hashed_password = get_password_hash(password)
        new_user = User(username=username, email=email, hashed_password=hashed_password)
        db.add(new_user)
        await db.commit()

    del otp_storage[email]  # Remove OTP after successful verification

    return {
        "message": "User registered successfully",
        "clear_fields": True,
    }


@router.post("/login")
async def login(login: LoginSchema, db: AsyncSession = Depends(get_db)):
    try:
        result = await db.execute(select(User).where(User.email == login.email))
        user = result.scalars().first()

        if not user or not verify_password(login.password, user.hashed_password):
            raise HTTPException(
                status_code=status.HTTP_401_UNAUTHORIZED,
                detail="Incorrect username or password",
            )

        access_token = create_access_token({"sub": str(user.id)})
        refresh_token = create_refresh_token({"sub": str(user.id)})
        return {
            "access_token": access_token,
            "refresh_token": refresh_token,
            "token_type": "bearer",
        }
    except HTTPException:
        raise
    except Exception as e:
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail=f"Failed to login: {str(e)}",
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
        return {
            "access_token": new_access_token,
            "refresh_token": new_refresh_token,
            "token_type": "bearer",
        }
    except HTTPException:
        raise
    except Exception as e:
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail=f"Failed to refresh token: {str(e)}",
        )


# @router.post("/logout")
# async def logout(request: Request, db: AsyncSession = Depends(get_db)):
#     """
#     Logout the user by blacklisting the access token.
#     """
#     authorization: str = request.headers.get("Authorization")
#     if not authorization or not authorization.startswith("Bearer "):
#         raise HTTPException(status_code=status.HTTP_401_UNAUTHORIZED, detail="Invalid authentication credentials")

#     access_token = authorization.split(" ")[1]
#     try:
#         payload = decode_token(access_token)
#         expire = datetime.utcnow() + timedelta(days=1)
#         blocklisted_token = TokenBlocklist(token=access_token, expires_at=expire)
#         db.add(blocklisted_token)
#         await db.commit()
#         return {"message": "Successfully logged out"}
#     except Exception as e:
#         await db.rollback()
#         raise HTTPException(
#             status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
#             detail=f"Failed to logout: {str(e)}",
#         )


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
            detail=f"Failed to fetch user details: {str(e)}",
        )
