from __future__ import annotations

from datetime import datetime, date
from typing import Optional, List

from sqlalchemy import (
    BigInteger,
    CheckConstraint,
    Column,
    Date,
    DateTime,
    Enum,
    ForeignKey,
    Index,
    Integer,
    Numeric,
    String,
    Text,
    UniqueConstraint,
    Boolean,
)
from sqlalchemy.orm import relationship, Mapped, mapped_column

from .db import Base


class User(Base):
    __tablename__ = "users"
    __table_args__ = (
        Index("idx_users_active_role", "is_active", "role"),
        Index("idx_users_lang", "preferred_lang"),
        CheckConstraint("preferred_lang IN ('es','en')", name="chk_users_preferred_lang"),
    )

    id: Mapped[int] = mapped_column(BigInteger, primary_key=True, autoincrement=True)
    username: Mapped[str] = mapped_column(String(50), unique=True, nullable=False)
    password_hash: Mapped[str] = mapped_column(String(255), nullable=False)
    role: Mapped[str] = mapped_column(
        Enum("admin", "professor", "student", name="role_enum"), default="admin"
    )
    is_active: Mapped[bool] = mapped_column(Boolean, default=True, nullable=False)
    preferred_lang: Mapped[str] = mapped_column(String(2), default="es", nullable=False)
    created_at: Mapped[datetime] = mapped_column(
        DateTime, default=datetime.utcnow, nullable=False
    )
    updated_at: Mapped[datetime] = mapped_column(
        DateTime, default=datetime.utcnow, onupdate=datetime.utcnow, nullable=False
    )


class Exercise(Base):
    __tablename__ = "exercises"
    __table_args__ = (
        CheckConstraint("arrows_count >= 0", name="chk_exercises_arrows_positive"),
        CheckConstraint("distance_m >= 0", name="chk_exercises_distance_positive"),
    )

    id: Mapped[int] = mapped_column(BigInteger, primary_key=True, autoincrement=True)
    name: Mapped[str] = mapped_column(String(120), nullable=False)
    arrows_count: Mapped[int] = mapped_column(Integer, nullable=False)
    distance_m: Mapped[float] = mapped_column(Numeric(6, 2), nullable=False)
    description: Mapped[Optional[str]] = mapped_column(Text, nullable=True)
    is_active: Mapped[bool] = mapped_column(Boolean, default=True, nullable=False)
    created_at: Mapped[datetime] = mapped_column(
        DateTime, default=datetime.utcnow, nullable=False
    )
    updated_at: Mapped[datetime] = mapped_column(
        DateTime, default=datetime.utcnow, onupdate=datetime.utcnow, nullable=False
    )

    day_exercises: Mapped[List["RoutineDayExercise"]] = relationship(
        back_populates="exercise"
    )


class Student(Base):
    __tablename__ = "students"
    __table_args__ = (
        Index("idx_students_active_name", "is_active", "full_name"),
        CheckConstraint("char_length(trim(document_number)) > 0", name="chk_students_document_not_empty"),
        CheckConstraint("bow_pounds IS NULL OR bow_pounds > 0", name="chk_students_bow_positive"),
    )

    id: Mapped[int] = mapped_column(BigInteger, primary_key=True, autoincrement=True)
    full_name: Mapped[str] = mapped_column(String(150), nullable=False)
    document_number: Mapped[str] = mapped_column(String(50), nullable=False, unique=True)
    contact: Mapped[Optional[str]] = mapped_column(String(255), nullable=True)
    bow_pounds: Mapped[Optional[float]] = mapped_column(Numeric(6, 2), nullable=True)
    arrows_available: Mapped[Optional[int]] = mapped_column(Integer, nullable=True)
    is_active: Mapped[bool] = mapped_column(Boolean, default=True, nullable=False)
    inactive_since: Mapped[Optional[datetime]] = mapped_column(DateTime, nullable=True)
    created_at: Mapped[datetime] = mapped_column(
        DateTime, default=datetime.utcnow, nullable=False
    )
    updated_at: Mapped[datetime] = mapped_column(
        DateTime, default=datetime.utcnow, onupdate=datetime.utcnow, nullable=False
    )

    assignments: Mapped[List["StudentRoutineAssignment"]] = relationship(
        back_populates="student"
    )


class Routine(Base):
    __tablename__ = "routines"
    __table_args__ = (
        UniqueConstraint("name", name="uq_routines_name"),
        Index("idx_routines_template_active", "is_template", "is_active"),
    )

    id: Mapped[int] = mapped_column(BigInteger, primary_key=True, autoincrement=True)
    name: Mapped[str] = mapped_column(String(120), nullable=False)
    description: Mapped[Optional[str]] = mapped_column(Text, nullable=True)
    is_active: Mapped[bool] = mapped_column(Boolean, default=True, nullable=False)
    is_template: Mapped[bool] = mapped_column(Boolean, default=True, nullable=False)
    created_at: Mapped[datetime] = mapped_column(
        DateTime, default=datetime.utcnow, nullable=False
    )
    updated_at: Mapped[datetime] = mapped_column(
        DateTime, default=datetime.utcnow, onupdate=datetime.utcnow, nullable=False
    )

    days: Mapped[List["RoutineDay"]] = relationship(
        back_populates="routine", cascade="all, delete-orphan", order_by="RoutineDay.day_number"
    )

    assignments: Mapped[List["StudentRoutineAssignment"]] = relationship(
        back_populates="routine"
    )


class RoutineDay(Base):
    __tablename__ = "routine_days"
    __table_args__ = (
        UniqueConstraint("routine_id", "day_number", name="uq_routine_day"),
        CheckConstraint("day_number BETWEEN 1 AND 7", name="chk_routine_days_number_range"),
    )

    id: Mapped[int] = mapped_column(BigInteger, primary_key=True, autoincrement=True)
    routine_id: Mapped[int] = mapped_column(
        BigInteger, ForeignKey("routines.id", ondelete="CASCADE", onupdate="CASCADE"), nullable=False
    )
    day_number: Mapped[int] = mapped_column(Integer, nullable=False)
    name: Mapped[Optional[str]] = mapped_column(String(100), nullable=True)
    notes: Mapped[Optional[str]] = mapped_column(Text, nullable=True)
    created_at: Mapped[datetime] = mapped_column(
        DateTime, default=datetime.utcnow, nullable=False
    )
    updated_at: Mapped[datetime] = mapped_column(
        DateTime, default=datetime.utcnow, onupdate=datetime.utcnow, nullable=False
    )

    routine: Mapped[Routine] = relationship(back_populates="days")
    exercises: Mapped[List["RoutineDayExercise"]] = relationship(
        back_populates="routine_day", cascade="all, delete-orphan", order_by="RoutineDayExercise.sort_order"
    )


class RoutineDayExercise(Base):
    __tablename__ = "routine_day_exercises"
    __table_args__ = (
        UniqueConstraint("routine_day_id", "sort_order", name="uq_day_sort"),
        CheckConstraint(
            "arrows_override IS NULL OR arrows_override >= 0",
            name="chk_day_exercises_arrows_override_positive",
        ),
        CheckConstraint(
            "distance_override_m IS NULL OR distance_override_m >= 0",
            name="chk_day_exercises_distance_override_positive",
        ),
    )

    id: Mapped[int] = mapped_column(BigInteger, primary_key=True, autoincrement=True)
    routine_day_id: Mapped[int] = mapped_column(
        BigInteger,
        ForeignKey("routine_days.id", ondelete="CASCADE", onupdate="CASCADE"),
        nullable=False,
    )
    exercise_id: Mapped[int] = mapped_column(
        BigInteger,
        ForeignKey("exercises.id", ondelete="RESTRICT", onupdate="CASCADE"),
        nullable=False,
    )
    sort_order: Mapped[int] = mapped_column(Integer, default=1, nullable=False)
    arrows_override: Mapped[Optional[int]] = mapped_column(Integer, nullable=True)
    distance_override_m: Mapped[Optional[float]] = mapped_column(Numeric(6, 2), nullable=True)
    notes: Mapped[Optional[str]] = mapped_column(Text, nullable=True)
    created_at: Mapped[datetime] = mapped_column(
        DateTime, default=datetime.utcnow, nullable=False
    )
    updated_at: Mapped[datetime] = mapped_column(
        DateTime, default=datetime.utcnow, onupdate=datetime.utcnow, nullable=False
    )

    routine_day: Mapped[RoutineDay] = relationship(back_populates="exercises")
    exercise: Mapped[Exercise] = relationship(back_populates="day_exercises")


class StudentRoutineAssignment(Base):
    __tablename__ = "student_routine_assignments"
    __table_args__ = (
        Index("idx_assignments_student_status", "student_id", "status"),
        CheckConstraint(
            "end_date IS NULL OR start_date IS NULL OR end_date >= start_date",
            name="chk_assignments_date_range",
        ),
    )

    id: Mapped[int] = mapped_column(BigInteger, primary_key=True, autoincrement=True)
    student_id: Mapped[int] = mapped_column(
        BigInteger,
        ForeignKey("students.id", ondelete="CASCADE", onupdate="CASCADE"),
        nullable=False,
    )
    routine_id: Mapped[int] = mapped_column(
        BigInteger,
        ForeignKey("routines.id", ondelete="RESTRICT", onupdate="CASCADE"),
        nullable=False,
    )
    assigned_at: Mapped[datetime] = mapped_column(
        DateTime, default=datetime.utcnow, nullable=False
    )
    start_date: Mapped[Optional[date]] = mapped_column(Date, nullable=True)
    end_date: Mapped[Optional[date]] = mapped_column(Date, nullable=True)
    status: Mapped[str] = mapped_column(Enum("active", "paused", "finished", name="status_enum"), default="active", nullable=False)
    notes: Mapped[Optional[str]] = mapped_column(Text, nullable=True)
    created_at: Mapped[datetime] = mapped_column(
        DateTime, default=datetime.utcnow, nullable=False
    )
    updated_at: Mapped[datetime] = mapped_column(
        DateTime, default=datetime.utcnow, onupdate=datetime.utcnow, nullable=False
    )

    student: Mapped[Student] = relationship(back_populates="assignments")
    routine: Mapped[Routine] = relationship(back_populates="assignments")
