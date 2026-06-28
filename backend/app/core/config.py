from pydantic_settings import BaseSettings, SettingsConfigDict
from typing import List


class Settings(BaseSettings):
    # Aplicación
    PROJECT_NAME: str = "NEXORA API"
    VERSION: str = "1.0.0"
    DESCRIPTION: str = "API para el sistema de ventas NEXORA"
    DEBUG: bool = False

    # Base de datos
    DATABASE_URL: str = "postgresql://nexora:nexora123@localhost:5432/nexora_db"

    # JWT
    SECRET_KEY: str = "cambia-esta-clave-en-produccion-min-32-caracteres"
    ALGORITHM: str = "HS256"
    ACCESS_TOKEN_EXPIRE_MINUTES: int = 30
    REFRESH_TOKEN_EXPIRE_DAYS: int = 7

    # CORS — en producción Railway usa el mismo dominio (no hace falta CORS)
    ALLOWED_ORIGINS: List[str] = [
        "http://localhost:3000",
        "http://localhost:19006",
        "*",
    ]

    model_config = SettingsConfigDict(env_file=".env")


settings = Settings()
