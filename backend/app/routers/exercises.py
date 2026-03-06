from __future__ import annotations

from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy import select, text
from sqlalchemy.orm import Session

from ..deps import get_db
from ..schemas import ExerciseCreate, ExerciseOut, ExerciseUpdate
from ..models import Exercise
from ..security import require_roles

router = APIRouter(prefix="/exercises", tags=["exercises"])


def _apply_rounds_logic(data: dict, *, existing: Exercise | None = None) -> dict:
    rounds = data.get("rounds")
    arrows_per_round = data.get("arrows_per_round")
    arrows_count = data.get("arrows_count")

    if rounds is None and existing is not None:
        rounds = existing.rounds
    if arrows_per_round is None and existing is not None:
        arrows_per_round = existing.arrows_per_round
    if arrows_count is None and existing is not None:
        arrows_count = existing.arrows_count

    if rounds is not None and arrows_per_round is not None:
        data["rounds"] = int(rounds)
        data["arrows_per_round"] = int(arrows_per_round)
        data["arrows_count"] = int(rounds) * int(arrows_per_round)
        return data

    if rounds is None and arrows_per_round is None and arrows_count is not None:
        data["rounds"] = 1
        data["arrows_per_round"] = int(arrows_count)
        data["arrows_count"] = int(arrows_count)
        return data

    raise HTTPException(
        status_code=status.HTTP_422_UNPROCESSABLE_ENTITY,
        detail="Debes enviar rondas y flechas por ronda, o solo flechas totales.",
    )


@router.get("", response_model=list[ExerciseOut])
def list_exercises(db: Session = Depends(get_db)):
    stmt = select(Exercise).order_by(Exercise.name)
    return db.scalars(stmt).all()


@router.post("", response_model=ExerciseOut, status_code=status.HTTP_201_CREATED)
def create_exercise(
    payload: ExerciseCreate,
    db: Session = Depends(get_db),
    _: None = Depends(require_roles({"admin", "professor"})),
):
    payload_data = _apply_rounds_logic(payload.dict())
    exercise = Exercise(**payload_data)
    db.add(exercise)
    db.commit()
    db.refresh(exercise)
    return exercise


@router.get("/{exercise_id}", response_model=ExerciseOut)
def get_exercise(exercise_id: int, db: Session = Depends(get_db)):
    exercise = db.get(Exercise, exercise_id)
    if not exercise:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Ejercicio no encontrado")
    return exercise


@router.put("/{exercise_id}", response_model=ExerciseOut)
def update_exercise(
    exercise_id: int,
    payload: ExerciseUpdate,
    db: Session = Depends(get_db),
    _: None = Depends(require_roles({"admin", "professor"})),
):
    exercise = db.get(Exercise, exercise_id)
    if not exercise:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Ejercicio no encontrado")
    payload_data = _apply_rounds_logic(payload.dict(), existing=exercise)
    for field, value in payload_data.items():
        setattr(exercise, field, value)
    db.commit()
    db.refresh(exercise)
    return exercise


@router.delete("/{exercise_id}", status_code=status.HTTP_204_NO_CONTENT)
def delete_exercise(
    exercise_id: int,
    db: Session = Depends(get_db),
    _: None = Depends(require_roles({"admin", "professor"})),
):
    exercise = db.get(Exercise, exercise_id)
    if not exercise:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Ejercicio no encontrado")

    reference_rows = db.execute(
        text(
            """
            SELECT
              rde.id AS routine_day_exercise_id,
              r.id AS routine_id,
              r.name AS routine_name,
              r.is_template AS is_template,
              EXISTS (
                SELECT 1
                FROM student_routine_assignments a
                WHERE a.routine_id = r.id
                  AND a.status IN ('active', 'paused')
              ) AS has_live_assignment
            FROM routine_day_exercises rde
            JOIN routine_days rd ON rd.id = rde.routine_day_id
            JOIN routines r ON r.id = rd.routine_id
            WHERE rde.exercise_id = :exercise_id
            """
        ),
        {"exercise_id": exercise_id},
    ).mappings().all()

    blocking_rows = [
        row for row in reference_rows if bool(row["is_template"]) or bool(row["has_live_assignment"])
    ]
    if blocking_rows:
        raise HTTPException(
            status_code=status.HTTP_409_CONFLICT,
            detail="No se puede eliminar este ejercicio porque está siendo usado en una o más rutinas. "
                   "Quita el ejercicio de esas rutinas y vuelve a intentarlo.",
        )

    try:
        # Si solo estaba en rutinas temporales finalizadas/inactivas, limpiamos esas referencias.
        for row in reference_rows:
            db.execute(
                text("DELETE FROM routine_day_exercises WHERE id = :id"),
                {"id": int(row["routine_day_exercise_id"])},
            )
        db.delete(exercise)
        db.commit()
    except Exception:
        db.rollback()
        # Fallback defensivo por posibles restricciones adicionales.
        raise HTTPException(
            status_code=status.HTTP_409_CONFLICT,
            detail="No se pudo eliminar este ejercicio porque está relacionado con otros datos.",
        )
    return None
