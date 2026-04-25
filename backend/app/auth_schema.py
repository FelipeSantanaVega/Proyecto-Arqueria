from __future__ import annotations

from sqlalchemy import text
from sqlalchemy.orm import Session


def ensure_auth_schema(db: Session) -> None:
    dialect = db.bind.dialect.name if db.bind is not None else ""
    if dialect == "postgresql":
        _ensure_auth_schema_postgres(db)
        return
    _ensure_auth_schema_mysql(db)


def _ensure_auth_schema_mysql(db: Session) -> None:
    has_refresh_hash = db.execute(
        text(
            """
            SELECT COUNT(*) AS c
            FROM information_schema.columns
            WHERE table_schema = DATABASE()
              AND table_name = 'users'
              AND column_name = 'refresh_token_hash'
            """
        )
    ).scalar_one()
    if not has_refresh_hash:
        db.execute(text("ALTER TABLE users ADD COLUMN refresh_token_hash VARCHAR(255) NULL AFTER preferred_lang"))

    has_refresh_expiry = db.execute(
        text(
            """
            SELECT COUNT(*) AS c
            FROM information_schema.columns
            WHERE table_schema = DATABASE()
              AND table_name = 'users'
              AND column_name = 'refresh_token_expires_at'
            """
        )
    ).scalar_one()
    if not has_refresh_expiry:
        db.execute(text("ALTER TABLE users ADD COLUMN refresh_token_expires_at DATETIME NULL AFTER refresh_token_hash"))

    db.commit()


def _ensure_auth_schema_postgres(db: Session) -> None:
    has_refresh_hash = db.execute(
        text(
            """
            SELECT COUNT(*) AS c
            FROM information_schema.columns
            WHERE table_schema = current_schema()
              AND table_name = 'users'
              AND column_name = 'refresh_token_hash'
            """
        )
    ).scalar_one()
    if not has_refresh_hash:
        db.execute(text("ALTER TABLE users ADD COLUMN refresh_token_hash VARCHAR(255) NULL"))

    has_refresh_expiry = db.execute(
        text(
            """
            SELECT COUNT(*) AS c
            FROM information_schema.columns
            WHERE table_schema = current_schema()
              AND table_name = 'users'
              AND column_name = 'refresh_token_expires_at'
            """
        )
    ).scalar_one()
    if not has_refresh_expiry:
        db.execute(text("ALTER TABLE users ADD COLUMN refresh_token_expires_at TIMESTAMP NULL"))

    db.commit()
