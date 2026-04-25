from __future__ import annotations

from typing import Any

from fastapi import HTTPException, status
from sqlalchemy import Select, func, or_, text
from sqlalchemy.orm import Session

from .models import User


def is_admin(user: User) -> bool:
    return user.role == "admin"


def is_accessible_owner(owner_user_id: int | None, user: User) -> bool:
    return is_admin(user) or owner_user_id is None or owner_user_id == user.id


def ensure_record_access(owner_user_id: int | None, user: User, detail: str) -> None:
    if is_accessible_owner(owner_user_id, user):
        return
    raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail=detail)


def apply_owner_visibility(stmt: Select[Any], model: Any, user: User) -> Select[Any]:
    if is_admin(user):
        return stmt
    return stmt.where(
        or_(
            model.created_by_user_id == user.id,
            model.created_by_user_id.is_(None),
        )
    )


def resolve_owner_user_id(
    user: User,
    *owner_ids: int | None,
) -> int | None:
    for owner_id in owner_ids:
        if owner_id is not None:
            return owner_id
    return None if is_admin(user) else user.id


def ensure_ownership_schema(db: Session) -> None:
    dialect = db.bind.dialect.name if db.bind is not None else ""
    if dialect == "postgresql":
      _ensure_ownership_schema_postgres(db)
      return
    _ensure_ownership_schema_mysql(db)


def _ensure_ownership_schema_mysql(db: Session) -> None:
    for table_name in (
        "exercises",
        "students",
        "routines",
        "student_routine_assignments",
        "student_routine_history",
    ):
        has_column = db.execute(
            text(
                """
                SELECT COUNT(*) AS c
                FROM information_schema.columns
                WHERE table_schema = DATABASE()
                  AND table_name = :table_name
                  AND column_name = 'created_by_user_id'
                """
            ),
            {"table_name": table_name},
        ).scalar_one()
        if not has_column:
            db.execute(
                text(
                    f"""
                    ALTER TABLE {table_name}
                    ADD COLUMN created_by_user_id BIGINT NULL
                    """
                )
            )

        has_index = db.execute(
            text(
                """
                SELECT COUNT(*) AS c
                FROM information_schema.statistics
                WHERE table_schema = DATABASE()
                  AND table_name = :table_name
                  AND index_name = :index_name
                """
            ),
            {"table_name": table_name, "index_name": f"idx_{table_name}_created_by"},
        ).scalar_one()
        if not has_index:
            db.execute(
                text(
                    f"""
                    CREATE INDEX idx_{table_name}_created_by
                    ON {table_name} (created_by_user_id)
                    """
                )
            )

    _ensure_owner_scoped_uniques_mysql(db)
    _backfill_legacy_ownership_mysql(db)
    db.commit()


def _ensure_ownership_schema_postgres(db: Session) -> None:
    for table_name in (
        "exercises",
        "students",
        "routines",
        "student_routine_assignments",
        "student_routine_history",
    ):
        has_column = db.execute(
            text(
                """
                SELECT COUNT(*) AS c
                FROM information_schema.columns
                WHERE table_schema = current_schema()
                  AND table_name = :table_name
                  AND column_name = 'created_by_user_id'
                """
            ),
            {"table_name": table_name},
        ).scalar_one()
        if not has_column:
            db.execute(
                text(
                    f"""
                    ALTER TABLE {table_name}
                    ADD COLUMN created_by_user_id BIGINT NULL
                    """
                )
            )

        has_index = db.execute(
            text(
                """
                SELECT COUNT(*) AS c
                FROM pg_indexes
                WHERE schemaname = current_schema()
                  AND tablename = :table_name
                  AND indexname = :index_name
                """
            ),
            {"table_name": table_name, "index_name": f"idx_{table_name}_created_by"},
        ).scalar_one()
        if not has_index:
            db.execute(
                text(
                    f"""
                    CREATE INDEX idx_{table_name}_created_by
                    ON {table_name} (created_by_user_id)
                    """
                )
            )

    _ensure_owner_scoped_uniques_postgres(db)
    _backfill_legacy_ownership_postgres(db)
    db.commit()


def _get_single_professor_id(db: Session) -> int | None:
    professor_count = db.execute(
        text("SELECT COUNT(*) FROM users WHERE role = 'professor'")
    ).scalar_one()
    if int(professor_count or 0) != 1:
        return None
    professor_id = db.execute(
        text("SELECT id FROM users WHERE role = 'professor' LIMIT 1")
    ).scalar_one()
    return int(professor_id)


def _backfill_legacy_ownership_mysql(db: Session) -> None:
    professor_id = _get_single_professor_id(db)
    if professor_id is not None:
        for table_name in ("exercises", "students", "routines"):
            db.execute(
                text(
                    f"""
                    UPDATE {table_name}
                    SET created_by_user_id = :professor_id
                    WHERE created_by_user_id IS NULL
                    """
                ),
                {"professor_id": professor_id},
            )
    db.execute(
        text(
            """
            UPDATE student_routine_assignments a
            LEFT JOIN students s ON s.id = a.student_id
            LEFT JOIN routines r ON r.id = a.routine_id
            SET a.created_by_user_id = COALESCE(s.created_by_user_id, r.created_by_user_id)
            WHERE a.created_by_user_id IS NULL
              AND COALESCE(s.created_by_user_id, r.created_by_user_id) IS NOT NULL
            """
        )
    )
    db.execute(
        text(
            """
            UPDATE student_routine_history h
            LEFT JOIN student_routine_assignments a ON a.id = h.assignment_id
            LEFT JOIN students s ON s.id = h.student_id
            SET h.created_by_user_id = COALESCE(a.created_by_user_id, s.created_by_user_id)
            WHERE h.created_by_user_id IS NULL
              AND COALESCE(a.created_by_user_id, s.created_by_user_id) IS NOT NULL
            """
        )
    )


def _backfill_legacy_ownership_postgres(db: Session) -> None:
    professor_id = _get_single_professor_id(db)
    if professor_id is not None:
        for table_name in ("exercises", "students", "routines"):
            db.execute(
                text(
                    f"""
                    UPDATE {table_name}
                    SET created_by_user_id = :professor_id
                    WHERE created_by_user_id IS NULL
                    """
                ),
                {"professor_id": professor_id},
            )
    db.execute(
        text(
            """
            UPDATE student_routine_assignments a
            SET created_by_user_id = src.owner_id
            FROM (
              SELECT
                a2.id,
                COALESCE(s.created_by_user_id, r.created_by_user_id) AS owner_id
              FROM student_routine_assignments a2
              LEFT JOIN students s ON s.id = a2.student_id
              LEFT JOIN routines r ON r.id = a2.routine_id
            ) AS src
            WHERE a.id = src.id
              AND a.created_by_user_id IS NULL
              AND src.owner_id IS NOT NULL
            """
        )
    )


def _ensure_owner_scoped_uniques_mysql(db: Session) -> None:
    routine_unique = db.execute(
        text(
            """
            SELECT COUNT(*) AS c
            FROM information_schema.statistics
            WHERE table_schema = DATABASE()
              AND table_name = 'routines'
              AND index_name = 'uq_routines_owner_name'
            """
        )
    ).scalar_one()
    if not routine_unique:
        old_routine_unique = db.execute(
            text(
                """
                SELECT COUNT(*) AS c
                FROM information_schema.statistics
                WHERE table_schema = DATABASE()
                  AND table_name = 'routines'
                  AND index_name = 'uq_routines_name'
                """
            )
        ).scalar_one()
        if old_routine_unique:
            db.execute(text("ALTER TABLE routines DROP INDEX uq_routines_name"))
        db.execute(
            text(
                """
                ALTER TABLE routines
                ADD CONSTRAINT uq_routines_owner_name UNIQUE (created_by_user_id, name)
                """
            )
        )

    student_unique = db.execute(
        text(
            """
            SELECT COUNT(*) AS c
            FROM information_schema.statistics
            WHERE table_schema = DATABASE()
              AND table_name = 'students'
              AND index_name = 'uq_students_owner_document'
            """
        )
    ).scalar_one()
    if not student_unique:
        old_student_unique = db.execute(
            text(
                """
                SELECT COUNT(*) AS c
                FROM information_schema.statistics
                WHERE table_schema = DATABASE()
                  AND table_name = 'students'
                  AND index_name = 'document_number'
                """
            )
        ).scalar_one()
        if old_student_unique:
            db.execute(text("ALTER TABLE students DROP INDEX document_number"))
        db.execute(
            text(
                """
                ALTER TABLE students
                ADD CONSTRAINT uq_students_owner_document UNIQUE (created_by_user_id, document_number)
                """
            )
        )


def _ensure_owner_scoped_uniques_postgres(db: Session) -> None:
    routine_unique = db.execute(
        text(
            """
            SELECT COUNT(*) AS c
            FROM pg_constraint
            WHERE conname = 'uq_routines_owner_name'
            """
        )
    ).scalar_one()
    if not routine_unique:
        old_routine_unique = db.execute(
            text(
                """
                SELECT COUNT(*) AS c
                FROM pg_constraint
                WHERE conname = 'uq_routines_name'
                """
            )
        ).scalar_one()
        if old_routine_unique:
            db.execute(text("ALTER TABLE routines DROP CONSTRAINT uq_routines_name"))
        db.execute(
            text(
                """
                ALTER TABLE routines
                ADD CONSTRAINT uq_routines_owner_name UNIQUE (created_by_user_id, name)
                """
            )
        )

    student_unique = db.execute(
        text(
            """
            SELECT COUNT(*) AS c
            FROM pg_constraint
            WHERE conname = 'uq_students_owner_document'
            """
        )
    ).scalar_one()
    if not student_unique:
        old_student_unique = db.execute(
            text(
                """
                SELECT COUNT(*) AS c
                FROM pg_constraint
                WHERE conname = 'students_document_number_key'
                """
            )
        ).scalar_one()
        if old_student_unique:
            db.execute(text("ALTER TABLE students DROP CONSTRAINT students_document_number_key"))
        db.execute(
            text(
                """
                ALTER TABLE students
                ADD CONSTRAINT uq_students_owner_document UNIQUE (created_by_user_id, document_number)
                """
            )
        )
    db.execute(
        text(
            """
            UPDATE student_routine_history h
            SET created_by_user_id = src.owner_id
            FROM (
              SELECT
                h2.id,
                COALESCE(a.created_by_user_id, s.created_by_user_id) AS owner_id
              FROM student_routine_history h2
              LEFT JOIN student_routine_assignments a ON a.id = h2.assignment_id
              LEFT JOIN students s ON s.id = h2.student_id
            ) AS src
            WHERE h.id = src.id
              AND h.created_by_user_id IS NULL
              AND src.owner_id IS NOT NULL
            """
        )
    )
