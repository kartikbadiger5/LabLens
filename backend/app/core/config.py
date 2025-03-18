from pydantic_settings import BaseSettings
import ssl


class Settings(BaseSettings):
    DATABASE_URL: str = "postgresql+asyncpg://lablens-AI_owner:npg_qfcTa8y0buej@ep-wispy-rain-a1wr5vsc-pooler.ap-southeast-1.aws.neon.tech/lablens-AI"
    SSL_CONTEXT: ssl.SSLContext = ssl.create_default_context()
    SECRET_KEY: str = "your_secret_key"
    ALGORITHM: str = "HS256"
    ACCESS_TOKEN_EXPIRE_MINUTES: int = 30
    REFRESH_TOKEN_EXPIRE_DAYS: int = 7  # New setting


settings = Settings()
