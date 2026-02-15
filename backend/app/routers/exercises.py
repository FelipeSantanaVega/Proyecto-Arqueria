from __future__ import annotations

from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy import select
from sqlalchemy.orm import Session

from ..deps import get_db
from ..schemas import ExerciseCreate, ExerciseOut, ExerciseUpdate
from ..models import Exercise
from ..security import require_roles

router = APIRouter(prefix="/exercises", tags=["exercises"])


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
    exercise = Exercise(**payload.dict())
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
    for field, value in payload.dict().items():
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
    try:
        db.delete(exercise)
        db.commit()
    except Exception:
        db.rollback()
        # Puede fallar por FK si el ejercicio está usado en rutinas
        raise HTTPException(
            status_code=status.HTTP_409_CONFLICT,
            detail="No se pudo eliminar el ejercicio (está referenciado en rutinas)",
        )
    return None
