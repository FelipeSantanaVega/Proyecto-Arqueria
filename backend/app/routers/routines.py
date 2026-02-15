from __future__ import annotations

from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy import select
from sqlalchemy.orm import Session, selectinload

from ..deps import get_db
from ..models import Routine, RoutineDay, RoutineDayExercise, Exercise
from ..routine_retention import purge_expired_temporary_routines
from ..schemas import RoutineCreate, RoutineOut
from ..security import require_roles

router = APIRouter(prefix="/routines", tags=["routines"])


@router.get("", response_model=list[RoutineOut])
def list_routines(db: Session = Depends(get_db)):
    purge_expired_temporary_routines(db)
    stmt = (
        select(Routine)
        .options(
            selectinload(Routine.days).selectinload(RoutineDay.exercises)
        )
        .order_by(Routine.name)
    )
    return db.scalars(stmt).unique().all()


@router.get("/{routine_id}", response_model=RoutineOut)
def get_routine(routine_id: int, db: Session = Depends(get_db)):
    stmt = (
        select(Routine)
        .where(Routine.id == routine_id)
        .options(
            selectinload(Routine.days).selectinload(RoutineDay.exercises)
        )
    )
    routine = db.scalars(stmt).first()
    if not routine:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Rutina no encontrada")
    return routine


@router.post("", response_model=RoutineOut, status_code=status.HTTP_201_CREATED)
def create_routine(
    payload: RoutineCreate,
    db: Session = Depends(get_db),
    _: None = Depends(require_roles({"admin", "professor"})),
):
    day_numbers = [d.day_number for d in payload.days]
    if len(day_numbers) != len(set(day_numbers)):
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="day_number duplicado en la rutina",
        )
    if any(d < 1 or d > 7 for d in day_numbers):
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="day_number debe estar entre 1 y 7",
        )
    # Validar ejercicios existentes
    exercise_ids = {ex.exercise_id for d in payload.days for ex in d.exercises}
    if exercise_ids:
        found = db.scalars(select(Exercise.id).where(Exercise.id.in_(exercise_ids))).all()
        if len(found) != len(exercise_ids):
            raise HTTPException(
                status_code=status.HTTP_400_BAD_REQUEST,
                detail="Algún ejercicio no existe",
            )

    routine = Routine(
        name=payload.name,
        description=payload.description,
        is_active=payload.is_active,
        is_template=payload.is_template,
    )

    for day in sorted(payload.days, key=lambda d: d.day_number):
        day_model = RoutineDay(
            day_number=day.day_number,
            name=day.name,
            notes=day.notes,
        )
        resolved_orders: list[int] = []
        for idx, ex in enumerate(day.exercises, start=1):
            sort_order = ex.sort_order or idx
            resolved_orders.append(sort_order)
            day_model.exercises.append(
                RoutineDayExercise(
                    exercise_id=ex.exercise_id,
                    sort_order=sort_order,
                    arrows_override=ex.arrows_override,
                    distance_override_m=ex.distance_override_m,
                    notes=ex.notes,
                )
            )
        if len(resolved_orders) != len(set(resolved_orders)):
            raise HTTPException(
                status_code=status.HTTP_400_BAD_REQUEST,
                detail=f"sort_order duplicado en el día {day.day_number}",
            )
        routine.days.append(day_model)

    db.add(routine)
    db.commit()
    db.refresh(routine)

    # Recargar relaciones para la respuesta
    db.refresh(
        routine,
        attribute_names=["days"],
    )
    for day in routine.days:
        db.refresh(day, attribute_names=["exercises"])

    return routine


@router.put("/{routine_id}", response_model=RoutineOut)
def update_routine(
    routine_id: int,
    payload: RoutineCreate,
    db: Session = Depends(get_db),
    _: None = Depends(require_roles({"admin", "professor"})),
):
    routine = db.get(Routine, routine_id)
    if not routine:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Rutina no encontrada")

    day_numbers = [d.day_number for d in payload.days]
    if len(day_numbers) != len(set(day_numbers)):
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="day_number duplicado en la rutina",
        )
    if any(d < 1 or d > 7 for d in day_numbers):
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="day_number debe estar entre 1 y 7",
        )

    exercise_ids = {ex.exercise_id for d in payload.days for ex in d.exercises}
    if exercise_ids:
        found = db.scalars(select(Exercise.id).where(Exercise.id.in_(exercise_ids))).all()
        if len(found) != len(exercise_ids):
            raise HTTPException(
                status_code=status.HTTP_400_BAD_REQUEST,
                detail="Algún ejercicio no existe",
            )

    routine.name = payload.name
    routine.description = payload.description
    routine.is_active = payload.is_active
    routine.is_template = payload.is_template
    routine.days.clear()
    # Forzar delete de días previos antes de insertar los nuevos para evitar
    # colisiones con la unique (routine_id, day_number) durante el mismo flush.
    db.flush()

    for day in sorted(payload.days, key=lambda d: d.day_number):
        day_model = RoutineDay(
            day_number=day.day_number,
            name=day.name,
            notes=day.notes,
        )
        resolved_orders: list[int] = []
        for idx, ex in enumerate(day.exercises, start=1):
            sort_order = ex.sort_order or idx
            resolved_orders.append(sort_order)
            day_model.exercises.append(
                RoutineDayExercise(
                    exercise_id=ex.exercise_id,
                    sort_order=sort_order,
                    arrows_override=ex.arrows_override,
                    distance_override_m=ex.distance_override_m,
                    notes=ex.notes,
                )
            )
        if len(resolved_orders) != len(set(resolved_orders)):
            raise HTTPException(
                status_code=status.HTTP_400_BAD_REQUEST,
                detail=f"sort_order duplicado en el día {day.day_number}",
            )
        routine.days.append(day_model)

    db.commit()
    db.refresh(routine, attribute_names=["days"])
    for day in routine.days:
        db.refresh(day, attribute_names=["exercises"])
    return routine


@router.delete("/{routine_id}", status_code=status.HTTP_204_NO_CONTENT)
def delete_routine(
    routine_id: int,
    db: Session = Depends(get_db),
    _: None = Depends(require_roles({"admin", "professor"})),
):
    routine = db.get(Routine, routine_id)
    if not routine:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Rutina no encontrada")
    db.delete(routine)
    db.commit()
