from __future__ import annotations

from sqlalchemy.orm import Session

from .config import Settings
from .db import get_session_factory

settings = Settings()
SessionLocal = get_session_factory(settings)


def get_db():
    db: Session = SessionLocal()
    try:
        yield db
    finally:
        db.close()
