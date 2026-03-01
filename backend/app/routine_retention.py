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

    db.execute(
        text(
            """
            CREATE TABLE IF NOT EXISTS student_routine_history (
              id BIGINT UNSIGNED NOT NULL AUTO_INCREMENT,
              assignment_id BIGINT UNSIGNED NULL,
              student_id BIGINT UNSIGNED NOT NULL,
              student_full_name VARCHAR(150) NOT NULL,
              routine_id BIGINT UNSIGNED NULL,
              routine_name VARCHAR(120) NOT NULL,
              start_date DATE NULL,
              end_date DATE NULL,
              completed_at DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
              objective VARCHAR(255) NOT NULL DEFAULT 'Determinante',
              professor_notes TEXT NULL,
              student_observations TEXT NULL,
              weekly_total_arrows INT UNSIGNED NOT NULL DEFAULT 0,
              snapshot_json TEXT NOT NULL,
              created_at DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
              updated_at DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
              PRIMARY KEY (id),
              UNIQUE KEY uq_history_assignment (assignment_id),
              KEY idx_history_student_completed (student_id, completed_at),
              KEY idx_history_completed (completed_at)
            ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci
            """
        )
    )

    has_student_observations = db.execute(
        text(
            """
            SELECT COUNT(*) AS c
            FROM information_schema.columns
            WHERE table_schema = DATABASE()
              AND table_name = 'student_routine_history'
              AND column_name = 'student_observations'
            """
        )
    ).scalar_one()
    if not has_student_observations:
        db.execute(
            text(
                """
                ALTER TABLE student_routine_history
                ADD COLUMN student_observations TEXT NULL
                AFTER professor_notes
                """
            )
        )

    db.commit()
