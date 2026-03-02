from __future__ import annotations

from sqlalchemy import create_engine
from sqlalchemy.orm import declarative_base, sessionmaker

from .config import Settings

Base = declarative_base()


def create_engine_from_settings(settings: Settings):
    """Crea engine con pool pre_ping para reconectar si hay idle timeout."""
    sqlalchemy_url = settings.sqlalchemy_url
    connect_args = {}
    if sqlalchemy_url.startswith("mysql+"):
        connect_args = {"charset": settings.db_charset}

    return create_engine(
        sqlalchemy_url,
        pool_pre_ping=True,
        pool_size=10,
        max_overflow=20,
        pool_timeout=5,
        pool_recycle=1800,  # recicla conexiones cada 30 min
        connect_args=connect_args,
        future=True,
    )


def get_session_factory(settings: Settings):
    engine = create_engine_from_settings(settings)
    return sessionmaker(bind=engine, autoflush=False, autocommit=False, future=True)
