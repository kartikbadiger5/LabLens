from sqlalchemy import Column, Integer, String, DateTime
from app.core.database import Base

class TokenBlocklist(Base):
    __tablename__ = "token_blocklist"
    id = Column(Integer, primary_key=True, index=True)
    token = Column(String(36), unique=True, index=True)  # Must match your database
    expires_at = Column(DateTime)