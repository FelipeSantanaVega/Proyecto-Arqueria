from __future__ import annotations

from sqlalchemy import text
from sqlalchemy.orm import Session


def ensure_student_accounts_schema(db: Session) -> None:
    dialect = db.bind.dialect.name if db.bind is not None else ""
    if dialect == "postgresql":
        _ensure_student_accounts_schema_postgres(db)
        return
    _ensure_student_accounts_schema_mysql(db)


def _ensure_student_accounts_schema_postgres(db: Session) -> None:
    has_user_id = db.execute(
        text(
            """
            SELECT COUNT(*) AS c
            FROM information_schema.columns
            WHERE table_schema = current_schema()
              AND table_name = 'students'
              AND column_name = 'user_id'
            """
        )
    ).scalar_one()
    if not has_user_id:
        db.execute(text("ALTER TABLE students ADD COLUMN user_id BIGINT NULL"))

    has_fk = db.execute(
        text(
            """
            SELECT COUNT(*) AS c
            FROM pg_constraint
            WHERE conname = 'fk_students_user_id'
            """
        )
    ).scalar_one()
    if not has_fk:
        db.execute(
            text(
                """
                ALTER TABLE students
                ADD CONSTRAINT fk_students_user_id
                FOREIGN KEY (user_id) REFERENCES users(id)
                """
            )
        )

    db.execute(text("CREATE UNIQUE INDEX IF NOT EXISTS uq_students_user_id ON students (user_id)"))
    db.execute(
        text(
            """
            UPDATE students s
            SET user_id = u.id
            FROM users u
            WHERE s.user_id IS NULL
              AND u.role = 'student'
              AND u.username = s.document_number
            """
        )
    )
    db.commit()


def _ensure_student_accounts_schema_mysql(db: Session) -> None:
    has_user_id = db.execute(
        text(
            """
            SELECT COUNT(*) AS c
            FROM information_schema.columns
            WHERE table_schema = DATABASE()
              AND table_name = 'students'
              AND column_name = 'user_id'
            """
        )
    ).scalar_one()
    if not has_user_id:
        db.execute(text("ALTER TABLE students ADD COLUMN user_id BIGINT NULL AFTER id"))

    has_unique = db.execute(
        text(
            """
            SELECT COUNT(*) AS c
            FROM information_schema.statistics
            WHERE table_schema = DATABASE()
              AND table_name = 'students'
              AND index_name = 'uq_students_user_id'
            """
        )
    ).scalar_one()
    if not has_unique:
        db.execute(text("CREATE UNIQUE INDEX uq_students_user_id ON students (user_id)"))

    has_fk = db.execute(
        text(
            """
            SELECT COUNT(*) AS c
            FROM information_schema.table_constraints
            WHERE table_schema = DATABASE()
              AND table_name = 'students'
              AND constraint_name = 'fk_students_user_id'
            """
        )
    ).scalar_one()
    if not has_fk:
        db.execute(
            text(
                """
                ALTER TABLE students
                ADD CONSTRAINT fk_students_user_id
                FOREIGN KEY (user_id) REFERENCES users(id)
                """
            )
        )

    db.execute(
        text(
            """
            UPDATE students s
            JOIN users u ON u.username = s.document_number
            SET s.user_id = u.id
            WHERE s.user_id IS NULL
              AND u.role = 'student'
            """
        )
    )
    db.commit()
