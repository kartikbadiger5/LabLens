from pydantic_settings import BaseSettings
import ssl


class Settings(BaseSettings):
    DATABASE_URL: str = "postgresql+asyncpg://postgres.wcauhcdohbaekqjqjdbb:Lablens%4025K@aws-0-ap-southeast-1.pooler.supabase.com:5432/postgres"
    # DATABASE_URL: str = "postgresql+asyncpg://postgre:2002@localhost:5432/lablens"
    SSL_CONTEXT: ssl.SSLContext = ssl.create_default_context()
    SECRET_KEY: str = "your_secret_key"
    ALGORITHM: str = "HS256"
    ACCESS_TOKEN_EXPIRE_MINUTES: int = 30
    REFRESH_TOKEN_EXPIRE_DAYS: int = 7  # New setting


settings=Settings()
# Lablens@25K