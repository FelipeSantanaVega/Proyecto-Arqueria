from __future__ import annotations

from datetime import datetime

from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy import select
from sqlalchemy.exc import IntegrityError
from sqlalchemy.orm import Session

from ..deps import get_db
from ..models import Student
from ..schemas import StudentCreate, StudentOut, StudentStatusUpdate, StudentUpdate
from ..security import require_roles
from ..student_retention import purge_inactive_students

router = APIRouter(prefix="/students", tags=["students"])


@router.get("", response_model=list[StudentOut])
def list_students(db: Session = Depends(get_db)):
    purge_inactive_students(db)
    stmt = select(Student).order_by(Student.full_name)
    return db.scalars(stmt).all()


@router.post("", response_model=StudentOut, status_code=status.HTTP_201_CREATED)
def create_student(
    payload: StudentCreate,
    db: Session = Depends(get_db),
    _: None = Depends(require_roles({"admin", "professor"})),
):
    data = payload.dict()
    if data.get("is_active") is False:
        data["inactive_since"] = datetime.utcnow()
    else:
        data["inactive_since"] = None
    student = Student(**data)
    db.add(student)
    try:
        db.commit()
    except IntegrityError:
        db.rollback()
        raise HTTPException(
            status_code=status.HTTP_409_CONFLICT,
            detail="Ya existe un alumno con ese número de documento",
        )
    db.refresh(student)
    return student


@router.get("/{student_id}", response_model=StudentOut)
def get_student(student_id: int, db: Session = Depends(get_db)):
    student = db.get(Student, student_id)
    if not student:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Alumno no encontrado")
    return student


@router.put("/{student_id}", response_model=StudentOut)
def update_student(
    student_id: int,
    payload: StudentUpdate,
    db: Session = Depends(get_db),
    _: None = Depends(require_roles({"admin", "professor"})),
):
    student = db.get(Student, student_id)
    if not student:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Alumno no encontrado")
    was_active = student.is_active
    for field, value in payload.dict().items():
        setattr(student, field, value)
    if student.is_active:
        student.inactive_since = None
    elif was_active:
        student.inactive_since = datetime.utcnow()
    elif student.inactive_since is None:
        student.inactive_since = datetime.utcnow()
    try:
        db.commit()
    except IntegrityError:
        db.rollback()
        raise HTTPException(
            status_code=status.HTTP_409_CONFLICT,
            detail="No se pudo actualizar el alumno por conflicto de datos",
        )
    db.refresh(student)
    return student


@router.patch("/{student_id}/status", response_model=StudentOut)
def update_student_status(
    student_id: int,
    payload: StudentStatusUpdate,
    db: Session = Depends(get_db),
    _: None = Depends(require_roles({"admin", "professor"})),
):
    student = db.get(Student, student_id)
    if not student:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Alumno no encontrado")
    was_active = student.is_active
    student.is_active = payload.is_active
    if student.is_active:
        student.inactive_since = None
    elif was_active:
        student.inactive_since = datetime.utcnow()
    elif student.inactive_since is None:
        student.inactive_since = datetime.utcnow()
    db.commit()
    db.refresh(student)
    return student
