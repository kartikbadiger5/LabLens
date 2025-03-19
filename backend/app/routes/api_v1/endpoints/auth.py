from fastapi import APIRouter, Depends, HTTPException, status, Request
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
        raise HTTPException(status_code=500, detail="Failed to send email")


@router.post("/register")
async def register(
    username: str,
    email: str,
    password: str,
    confirm_password: str,
    otp: str = None,
    db: AsyncSession = Depends(get_db),
):
    if "@" not in email:
        raise HTTPException(status_code=400, detail="Invalid email format")

    if password != confirm_password:
        raise HTTPException(status_code=400, detail="Passwords do not match")

    async with db.begin():
        result = await db.execute(select(User).where(User.email == email))
        existing_user = result.scalars().first()

        if existing_user:
            raise HTTPException(status_code=400, detail="Email already registered")

    if otp is None:
        # Generate and send OTP
        generated_otp = f"{secrets.randbelow(1_000_000):06}"
        otp_storage[email] = generated_otp
        send_email(email, OTP_TEMPLATE_ID, {"otp": generated_otp})
        return {"message": "OTP sent to your email, please verify."}

    # Verify OTP
    stored_otp = otp_storage.get(email)
    if not stored_otp or stored_otp != otp:
        raise HTTPException(status_code=400, detail="Invalid or expired OTP")

    async with db.begin():
        hashed_password = get_password_hash(password)
        new_user = User(username=username, email=email, hashed_password=hashed_password)
        db.add(new_user)
        await db.commit()

    del otp_storage[email]  # Remove OTP after successful verification

    # Clear input fields (for frontend handling)
    return {
        "message": "User registered successfully",
        "clear_fields": True,  # Indicate to frontend to clear input fields
    }


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
