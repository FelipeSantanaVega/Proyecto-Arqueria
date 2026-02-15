from __future__ import annotations

from datetime import date, timedelta

from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy import select, and_
from sqlalchemy.exc import IntegrityError
from sqlalchemy.orm import Session

from ..deps import get_db
from ..models import StudentRoutineAssignment, Student, Routine
from ..routine_retention import purge_expired_temporary_routines
from ..schemas import AssignmentCreate, AssignmentOut
from ..security import require_roles

router = APIRouter(prefix="/assignments", tags=["assignments"])


@router.get("", response_model=list[AssignmentOut])
def list_assignments(db: Session = Depends(get_db)):
    purge_expired_temporary_routines(db)
    stmt = select(StudentRoutineAssignment).order_by(StudentRoutineAssignment.created_at.desc())
    return db.scalars(stmt).all()


@router.post("", response_model=AssignmentOut, status_code=status.HTTP_201_CREATED)
def create_assignment(
    payload: AssignmentCreate,
    db: Session = Depends(get_db),
    _: None = Depends(require_roles({"admin", "professor"})),
):
    # Validar que existan student y routine
    if not db.get(Student, payload.student_id):
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Alumno no encontrado")
    if not db.get(Routine, payload.routine_id):
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Rutina no encontrada")

    # Regla de negocio: un alumno no puede tener más de una rutina activa en la misma semana.
    if payload.status == "active":
        start = payload.start_date or date.today()
        week_start = start - timedelta(days=start.weekday())
        week_end = week_start + timedelta(days=6)
        stmt = select(StudentRoutineAssignment).where(
            and_(
                StudentRoutineAssignment.student_id == payload.student_id,
                StudentRoutineAssignment.status == "active",
                StudentRoutineAssignment.start_date <= week_end,
                StudentRoutineAssignment.end_date >= week_start,
            )
        )
        existing = db.scalars(stmt).first()
        if existing:
            raise HTTPException(
                status_code=status.HTTP_400_BAD_REQUEST,
                detail="El alumno ya tiene una rutina activa en esa semana",
            )

    assignment = StudentRoutineAssignment(**payload.dict())
    db.add(assignment)
    try:
        db.commit()
    except IntegrityError:
        db.rollback()
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="No se pudo crear la asignación (verifica datos)",
        )
    db.refresh(assignment)
    return assignment


@router.delete("/{assignment_id}", status_code=status.HTTP_204_NO_CONTENT)
def delete_assignment(
    assignment_id: int,
    db: Session = Depends(get_db),
    _: None = Depends(require_roles({"admin", "professor"})),
):
    assignment = db.get(StudentRoutineAssignment, assignment_id)
    if not assignment:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Asignación no encontrada")
    db.delete(assignment)
    db.commit()
