from __future__ import annotations

from pathlib import Path

from pydantic_settings import BaseSettings, SettingsConfigDict

# Ruta al root del proyecto (donde estará .env)
PROJECT_ROOT = Path(__file__).resolve().parents[2]
ENV_FILE = PROJECT_ROOT / ".env"


class Settings(BaseSettings):
    app_env: str = "local"
    app_debug: bool = True
    cors_origins: list[str] = ["http://localhost:5173", "http://127.0.0.1:5173"]

    db_host: str = "localhost"
    db_port: int = 3306
    db_user: str = "archery_user"
    db_password: str = "archery_pass"
    db_name: str = "archery_training"
    db_charset: str = "utf8mb4"
    database_url: str | None = None

    jwt_secret: str = "change_me"
    jwt_algorithm: str = "HS256"
    jwt_expires_min: int = 60

    model_config = SettingsConfigDict(
        env_file=ENV_FILE,
        env_file_encoding="utf-8",
        env_prefix="",
        extra="ignore",
    )

    @property
    def sqlalchemy_url(self) -> str:
        if self.database_url:
            if "charset=" not in self.database_url:
                separator = "&" if "?" in self.database_url else "?"
                return f"{self.database_url}{separator}charset={self.db_charset}"
            return self.database_url
        return (
            f"mysql+pymysql://{self.db_user}:{self.db_password}"
            f"@{self.db_host}:{self.db_port}/{self.db_name}"
            f"?charset={self.db_charset}"
        )
