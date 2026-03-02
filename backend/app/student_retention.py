from __future__ import annotations

from datetime import datetime, timedelta

from sqlalchemy import text
from sqlalchemy.orm import Session

INACTIVE_PURGE_DAYS = 30


def ensure_student_retention_schema(db: Session) -> None:
    dialect = db.bind.dialect.name if db.bind is not None else ""
    if dialect == "postgresql":
        _ensure_student_retention_schema_postgres(db)
        return

    has_inactive_since = db.execute(
        text(
            """
            SELECT COUNT(*) AS c
            FROM information_schema.columns
            WHERE table_schema = DATABASE()
              AND table_name = 'students'
              AND column_name = 'inactive_since'
            """
        )
    ).scalar_one()
    if not has_inactive_since:
        db.execute(text("ALTER TABLE students ADD COLUMN inactive_since DATETIME NULL AFTER is_active"))

    has_index = db.execute(
        text(
            """
            SELECT COUNT(*) AS c
            FROM information_schema.statistics
            WHERE table_schema = DATABASE()
              AND table_name = 'students'
              AND index_name = 'idx_students_inactive_since'
            """
        )
    ).scalar_one()
    if not has_index:
        db.execute(text("CREATE INDEX idx_students_inactive_since ON students (is_active, inactive_since)"))

    db.execute(
        text(
            """
            UPDATE students
            SET inactive_since = COALESCE(updated_at, created_at, UTC_TIMESTAMP())
            WHERE is_active = 0 AND inactive_since IS NULL
            """
        )
    )
    db.commit()


def purge_inactive_students(db: Session, days: int = INACTIVE_PURGE_DAYS) -> int:
    dialect = db.bind.dialect.name if db.bind is not None else ""
    if dialect == "postgresql":
        cutoff = datetime.utcnow() - timedelta(days=days)
        result = db.execute(
            text(
                """
                DELETE FROM students
                WHERE is_active = FALSE
                  AND inactive_since IS NOT NULL
                  AND inactive_since <= :cutoff
                """
            ),
            {"cutoff": cutoff},
        )
        db.commit()
        return int(result.rowcount or 0)

    cutoff = datetime.utcnow() - timedelta(days=days)
    result = db.execute(
        text(
            """
            DELETE FROM students
            WHERE is_active = 0
              AND inactive_since IS NOT NULL
              AND inactive_since <= :cutoff
            """
        ),
        {"cutoff": cutoff},
    )
    db.commit()
    return int(result.rowcount or 0)


def _ensure_student_retention_schema_postgres(db: Session) -> None:
    has_inactive_since = db.execute(
        text(
            """
            SELECT COUNT(*) AS c
            FROM information_schema.columns
            WHERE table_schema = current_schema()
              AND table_name = 'students'
              AND column_name = 'inactive_since'
            """
        )
    ).scalar_one()
    if not has_inactive_since:
        db.execute(text("ALTER TABLE students ADD COLUMN inactive_since TIMESTAMP NULL"))

    has_index = db.execute(
        text(
            """
            SELECT COUNT(*) AS c
            FROM pg_indexes
            WHERE schemaname = current_schema()
              AND tablename = 'students'
              AND indexname = 'idx_students_inactive_since'
            """
        )
    ).scalar_one()
    if not has_index:
        db.execute(text("CREATE INDEX idx_students_inactive_since ON students (is_active, inactive_since)"))

    db.execute(
        text(
            """
            UPDATE students
            SET inactive_since = COALESCE(updated_at, created_at, CURRENT_TIMESTAMP)
            WHERE is_active = FALSE AND inactive_since IS NULL
            """
        )
    )
    db.commit()
