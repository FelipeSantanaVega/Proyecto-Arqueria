from __future__ import annotations

from sqlalchemy import text
from sqlalchemy.orm import Session


def ensure_routine_schema(db: Session) -> None:
    has_is_template = db.execute(
        text(
            """
            SELECT COUNT(*) AS c
            FROM information_schema.columns
            WHERE table_schema = DATABASE()
              AND table_name = 'routines'
              AND column_name = 'is_template'
            """
        )
    ).scalar_one()
    if not has_is_template:
        db.execute(
            text(
                """
                ALTER TABLE routines
                ADD COLUMN is_template TINYINT(1) NOT NULL DEFAULT 1
                AFTER is_active
                """
            )
        )

    has_index = db.execute(
        text(
            """
            SELECT COUNT(*) AS c
            FROM information_schema.statistics
            WHERE table_schema = DATABASE()
              AND table_name = 'routines'
              AND index_name = 'idx_routines_template_active'
            """
        )
    ).scalar_one()
    if not has_index:
        db.execute(text("CREATE INDEX idx_routines_template_active ON routines (is_template, is_active)"))

    db.commit()


def purge_expired_temporary_routines(db: Session) -> None:
    # 1) eliminar asignaciones temporales vencidas (fin de semana ya pasado)
    db.execute(
        text(
            """
            DELETE a
            FROM student_routine_assignments a
            INNER JOIN routines r ON r.id = a.routine_id
            WHERE r.is_template = 0
              AND a.end_date IS NOT NULL
              AND a.end_date < CURDATE()
            """
        )
    )

    # 2) eliminar rutinas temporales huérfanas
    db.execute(
        text(
            """
            DELETE r
            FROM routines r
            LEFT JOIN student_routine_assignments a ON a.routine_id = r.id
            WHERE r.is_template = 0
              AND a.id IS NULL
            """
        )
    )
    db.commit()

