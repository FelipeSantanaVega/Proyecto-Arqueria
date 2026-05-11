from __future__ import annotations

from datetime import datetime

from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy import select
from sqlalchemy.exc import IntegrityError
from sqlalchemy.orm import Session

from ..deps import get_db
from ..models import Student, User
from ..ownership import apply_owner_visibility, ensure_record_access
from ..schemas import StudentCreate, StudentOut, StudentStatusUpdate, StudentUpdate
from ..security import get_current_user, hash_password, require_roles
from ..student_retention import purge_inactive_students

router = APIRouter(prefix="/students", tags=["students"])


@router.get("", response_model=list[StudentOut])
def list_students(
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user),
    _: None = Depends(require_roles({"admin", "professor"})),
):
    purge_inactive_students(db)
    stmt = apply_owner_visibility(select(Student), Student, current_user).order_by(Student.full_name)
    return db.scalars(stmt).all()


@router.post("", response_model=StudentOut, status_code=status.HTTP_201_CREATED)
def create_student(
    payload: StudentCreate,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user),
    _: None = Depends(require_roles({"admin", "professor"})),
):
    data = payload.dict()
    account_username = (data.pop("account_username", None) or "").strip()
    account_password = data.pop("account_password", None) or ""
    data["created_by_user_id"] = current_user.id
    if data.get("is_active") is False:
        data["inactive_since"] = datetime.utcnow()
    else:
        data["inactive_since"] = None

    student_user: User | None = None
    if account_username or account_password:
        if len(account_username) < 3:
            raise HTTPException(
                status_code=status.HTTP_400_BAD_REQUEST,
                detail="El usuario debe tener al menos 3 caracteres",
            )
        if len(account_password) < 8:
            raise HTTPException(
                status_code=status.HTTP_400_BAD_REQUEST,
                detail="La contraseña debe tener al menos 8 caracteres",
            )
        exists = db.scalars(select(User).where(User.username == account_username)).first()
        if exists:
            raise HTTPException(
                status_code=status.HTTP_400_BAD_REQUEST,
                detail="Ya existe un usuario con ese nombre",
            )
        student_user = User(
            username=account_username,
            password_hash=hash_password(account_password),
            role="student",
            is_active=bool(data.get("is_active", True)),
        )
        db.add(student_user)
        db.flush()
        data["user_id"] = student_user.id

    student = Student(**data)
    db.add(student)
    try:
        db.commit()
    except IntegrityError:
        db.rollback()
        raise HTTPException(
            status_code=status.HTTP_409_CONFLICT,
            detail="Ya existe un deportista con ese número de documento",
        )
    db.refresh(student)
    return student


@router.get("/{student_id}", response_model=StudentOut)
def get_student(
    student_id: int,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user),
    _: None = Depends(require_roles({"admin", "professor"})),
):
    student = db.get(Student, student_id)
    if not student:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Deportista no encontrado")
    ensure_record_access(student.created_by_user_id, current_user, "Deportista no encontrado")
    return student


@router.put("/{student_id}", response_model=StudentOut)
def update_student(
    student_id: int,
    payload: StudentUpdate,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user),
    _: None = Depends(require_roles({"admin", "professor"})),
):
    student = db.get(Student, student_id)
    if not student:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Deportista no encontrado")
    ensure_record_access(student.created_by_user_id, current_user, "Deportista no encontrado")
    was_active = student.is_active
    for field, value in payload.dict().items():
        setattr(student, field, value)
    if student.is_active:
        student.inactive_since = None
    elif was_active:
        student.inactive_since = datetime.utcnow()
    elif student.inactive_since is None:
        student.inactive_since = datetime.utcnow()
    if student.user_id:
        linked_user = db.get(User, student.user_id)
        if linked_user:
            linked_user.is_active = student.is_active
            db.add(linked_user)
    try:
        db.commit()
    except IntegrityError:
        db.rollback()
        raise HTTPException(
            status_code=status.HTTP_409_CONFLICT,
            detail="No se pudo actualizar el deportista por conflicto de datos",
        )
    db.refresh(student)
    return student


@router.patch("/{student_id}/status", response_model=StudentOut)
def update_student_status(
    student_id: int,
    payload: StudentStatusUpdate,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user),
    _: None = Depends(require_roles({"admin", "professor"})),
):
    student = db.get(Student, student_id)
    if not student:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Deportista no encontrado")
    ensure_record_access(student.created_by_user_id, current_user, "Deportista no encontrado")
    was_active = student.is_active
    student.is_active = payload.is_active
    if student.is_active:
        student.inactive_since = None
    elif was_active:
        student.inactive_since = datetime.utcnow()
    elif student.inactive_since is None:
        student.inactive_since = datetime.utcnow()
    if student.user_id:
        linked_user = db.get(User, student.user_id)
        if linked_user:
            linked_user.is_active = student.is_active
            db.add(linked_user)
    db.commit()
    db.refresh(student)
    return student
