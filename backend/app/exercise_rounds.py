from __future__ import annotations

import re

from sqlalchemy import text
from sqlalchemy.orm import Session

ROUNDS_PATTERN = re.compile(r"(\d+)\s*rondas?\s*de\s*(\d+)\s*disparos?", re.IGNORECASE)
EXCLUDED_EXERCISE_NAMES = {"Ejercicios test", "Ejercicio test 2"}


def ensure_exercise_rounds_schema(db: Session) -> None:
    dialect = db.bind.dialect.name if db.bind is not None else ""
    if dialect == "postgresql":
        _ensure_exercise_rounds_schema_postgres(db)
    else:
        _ensure_exercise_rounds_schema_mysql(db)

    exercises = db.execute(
        text(
            """
            SELECT id, name, description, arrows_count, rounds, arrows_per_round
            FROM exercises
            """
        )
    ).mappings()

    for exercise in exercises:
        exercise_id = int(exercise["id"])
        name = (exercise.get("name") or "").strip()
        description = exercise.get("description") or ""
        current_arrows_count = int(exercise.get("arrows_count") or 0)
        current_rounds = exercise.get("rounds")
        current_arrows_per_round = exercise.get("arrows_per_round")

        rounds: int
        arrows_per_round: int

        if name in EXCLUDED_EXERCISE_NAMES:
            rounds = int(current_rounds) if current_rounds is not None else 1
            arrows_per_round = (
                int(current_arrows_per_round)
                if current_arrows_per_round is not None
                else current_arrows_count
            )
        else:
            match = ROUNDS_PATTERN.search(description)
            if match:
                rounds = int(match.group(1))
                arrows_per_round = int(match.group(2))
            elif current_rounds is not None and current_arrows_per_round is not None:
                rounds = int(current_rounds)
                arrows_per_round = int(current_arrows_per_round)
            else:
                rounds = 1
                arrows_per_round = current_arrows_count

        total_arrows = rounds * arrows_per_round
        db.execute(
            text(
                """
                UPDATE exercises
                SET rounds = :rounds,
                    arrows_per_round = :arrows_per_round,
                    arrows_count = :arrows_count
                WHERE id = :exercise_id
                """
            ),
            {
                "rounds": rounds,
                "arrows_per_round": arrows_per_round,
                "arrows_count": total_arrows,
                "exercise_id": exercise_id,
            },
        )

    db.commit()


def _ensure_exercise_rounds_schema_postgres(db: Session) -> None:
    db.execute(
        text(
            """
            ALTER TABLE exercises
            ADD COLUMN IF NOT EXISTS rounds INTEGER
            """
        )
    )
    db.execute(
        text(
            """
            ALTER TABLE exercises
            ADD COLUMN IF NOT EXISTS arrows_per_round INTEGER
            """
        )
    )
    db.execute(
        text(
            """
            ALTER TABLE exercises
            ALTER COLUMN rounds SET DEFAULT 1
            """
        )
    )
    db.execute(
        text(
            """
            ALTER TABLE exercises
            ALTER COLUMN arrows_per_round SET DEFAULT 0
            """
        )
    )
    db.execute(
        text(
            """
            DO $$
            BEGIN
              IF NOT EXISTS (
                SELECT 1 FROM pg_constraint
                WHERE conname = 'chk_exercises_rounds_positive'
              ) THEN
                ALTER TABLE exercises
                ADD CONSTRAINT chk_exercises_rounds_positive CHECK (rounds > 0);
              END IF;
            END $$;
            """
        )
    )
    db.execute(
        text(
            """
            DO $$
            BEGIN
              IF NOT EXISTS (
                SELECT 1 FROM pg_constraint
                WHERE conname = 'chk_exercises_arrows_per_round_positive'
              ) THEN
                ALTER TABLE exercises
                ADD CONSTRAINT chk_exercises_arrows_per_round_positive CHECK (arrows_per_round >= 0);
              END IF;
            END $$;
            """
        )
    )
    db.execute(text("UPDATE exercises SET rounds = 1 WHERE rounds IS NULL"))
    db.execute(text("UPDATE exercises SET arrows_per_round = arrows_count WHERE arrows_per_round IS NULL"))
    db.execute(text("ALTER TABLE exercises ALTER COLUMN rounds SET NOT NULL"))
    db.execute(text("ALTER TABLE exercises ALTER COLUMN arrows_per_round SET NOT NULL"))


def _ensure_exercise_rounds_schema_mysql(db: Session) -> None:
    has_rounds = db.execute(
        text(
            """
            SELECT COUNT(*) AS c
            FROM information_schema.columns
            WHERE table_schema = DATABASE()
              AND table_name = 'exercises'
              AND column_name = 'rounds'
            """
        )
    ).scalar_one()
    if not has_rounds:
        db.execute(
            text(
                """
                ALTER TABLE exercises
                ADD COLUMN rounds INT NOT NULL DEFAULT 1
                AFTER arrows_count
                """
            )
        )

    has_arrows_per_round = db.execute(
        text(
            """
            SELECT COUNT(*) AS c
            FROM information_schema.columns
            WHERE table_schema = DATABASE()
              AND table_name = 'exercises'
              AND column_name = 'arrows_per_round'
            """
        )
    ).scalar_one()
    if not has_arrows_per_round:
        db.execute(
            text(
                """
                ALTER TABLE exercises
                ADD COLUMN arrows_per_round INT NOT NULL DEFAULT 0
                AFTER rounds
                """
            )
        )

    has_rounds_constraint = db.execute(
        text(
            """
            SELECT COUNT(*) AS c
            FROM information_schema.table_constraints
            WHERE table_schema = DATABASE()
              AND table_name = 'exercises'
              AND constraint_name = 'chk_exercises_rounds_positive'
            """
        )
    ).scalar_one()
    if not has_rounds_constraint:
        db.execute(
            text(
                """
                ALTER TABLE exercises
                ADD CONSTRAINT chk_exercises_rounds_positive CHECK (rounds > 0)
                """
            )
        )

    has_arrows_per_round_constraint = db.execute(
        text(
            """
            SELECT COUNT(*) AS c
            FROM information_schema.table_constraints
            WHERE table_schema = DATABASE()
              AND table_name = 'exercises'
              AND constraint_name = 'chk_exercises_arrows_per_round_positive'
            """
        )
    ).scalar_one()
    if not has_arrows_per_round_constraint:
        db.execute(
            text(
                """
                ALTER TABLE exercises
                ADD CONSTRAINT chk_exercises_arrows_per_round_positive CHECK (arrows_per_round >= 0)
                """
            )
        )
