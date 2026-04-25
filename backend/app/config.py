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
    db_engine: str = "mysql"
    database_url: str | None = None

    jwt_secret: str = "change_me"
    jwt_algorithm: str = "HS256"
    jwt_expires_min: int = 30
    jwt_refresh_expires_min: int = 43200

    model_config = SettingsConfigDict(
        env_file=ENV_FILE,
        env_file_encoding="utf-8",
        env_prefix="",
        extra="ignore",
    )

    @property
    def sqlalchemy_url(self) -> str:
        if self.database_url:
            url = self.database_url.strip()
            if url.startswith("postgres://"):
                url = "postgresql://" + url[len("postgres://"):]
            if url.startswith("postgresql://") and not url.startswith("postgresql+"):
                url = "postgresql+psycopg://" + url[len("postgresql://"):]
            if url.startswith("mysql+pymysql://"):
                if "charset=" not in url:
                    separator = "&" if "?" in url else "?"
                    return f"{url}{separator}charset={self.db_charset}"
            return url
        if self.db_engine.lower() in {"postgres", "postgresql"}:
            return (
                f"postgresql+psycopg://{self.db_user}:{self.db_password}"
                f"@{self.db_host}:{self.db_port}/{self.db_name}"
            )
        return (
            f"mysql+pymysql://{self.db_user}:{self.db_password}"
            f"@{self.db_host}:{self.db_port}/{self.db_name}"
            f"?charset={self.db_charset}"
        )
