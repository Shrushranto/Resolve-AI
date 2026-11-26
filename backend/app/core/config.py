from pydantic_settings import BaseSettings
from typing import Optional

class Settings(BaseSettings):
    DATABASE_URL: str = "postgresql://supportai:supportai@localhost:5432/supportai"
    SECRET_KEY: str = "change-me-in-production-use-32-char-min"
    ALGORITHM: str = "HS256"
    ACCESS_TOKEN_EXPIRE_MINUTES: int = 60
    GEMINI_API_KEY: Optional[str] = None
    AI_MODEL: str = "gemini-3-flash-preview"
    APP_NAME: str = "AuraCare"
    DEBUG: bool = False
    RETURN_WINDOW_DAYS: int = 30
    ESCALATION_THRESHOLD: float = 5000.0

    class Config:
        env_file = ".env"
        case_sensitive = True

settings = Settings()
