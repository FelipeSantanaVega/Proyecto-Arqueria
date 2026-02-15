from __future__ import annotations

from datetime import datetime, date
from typing import List, Optional

from pydantic import BaseModel, Field, conint, confloat


# Auth
class LoginRequest(BaseModel):
    username: str
    password: str


class LoginResponse(BaseModel):
    access_token: str
    token_type: str = "bearer"
    detail: Optional[str] = None


# Exercises
class ExerciseBase(BaseModel):
    name: str
    arrows_count: conint(ge=0)
    distance_m: confloat(ge=0)
    description: Optional[str] = None
    is_active: bool = True


class ExerciseCreate(ExerciseBase):
    pass


class ExerciseUpdate(ExerciseBase):
    pass


class ExerciseOut(ExerciseBase):
    id: int
    created_at: datetime
    updated_at: datetime

    class Config:
        from_attributes = True


# Students
class StudentBase(BaseModel):
    full_name: str
    document_number: str
    contact: Optional[str] = None
    bow_pounds: Optional[confloat(gt=0)] = None
    arrows_available: Optional[conint(ge=0)] = None
    is_active: bool = True


class StudentCreate(StudentBase):
    pass


class StudentUpdate(StudentBase):
    pass


class StudentStatusUpdate(BaseModel):
    is_active: bool


class StudentOut(StudentBase):
    id: int
    created_at: datetime
    updated_at: datetime

    class Config:
        from_attributes = True


# Routines
class RoutineDayExerciseCreate(BaseModel):
    exercise_id: int
    sort_order: Optional[int] = Field(default=None, ge=1)
    arrows_override: Optional[conint(ge=0)] = None
    distance_override_m: Optional[confloat(ge=0)] = None
    notes: Optional[str] = None


class RoutineDayCreate(BaseModel):
    day_number: conint(ge=1)
    name: Optional[str] = None
    notes: Optional[str] = None
    exercises: List[RoutineDayExerciseCreate] = Field(default_factory=list)


class RoutineCreate(BaseModel):
    name: str
    description: Optional[str] = None
    is_active: bool = True
    is_template: bool = True
    days: List[RoutineDayCreate] = Field(default_factory=list)


class RoutineDayExerciseOut(BaseModel):
    id: int
    exercise_id: int
    sort_order: int
    arrows_override: Optional[int]
    distance_override_m: Optional[float]
    notes: Optional[str]

    class Config:
        from_attributes = True


class RoutineDayOut(BaseModel):
    id: int
    day_number: int
    name: Optional[str]
    notes: Optional[str]
    exercises: List[RoutineDayExerciseOut]

    class Config:
        from_attributes = True


class RoutineOut(BaseModel):
    id: int
    name: str
    description: Optional[str]
    is_active: bool
    is_template: bool
    created_at: datetime
    updated_at: datetime
    days: List[RoutineDayOut]

    class Config:
        from_attributes = True


# Assignments
class AssignmentCreate(BaseModel):
    student_id: int
    routine_id: int
    start_date: Optional[date] = None
    end_date: Optional[date] = None
    status: str = Field(default="active", pattern="^(active|paused|finished)$")
    notes: Optional[str] = None


class AssignmentOut(BaseModel):
    id: int
    student_id: int
    routine_id: int
    assigned_at: datetime
    start_date: Optional[date]
    end_date: Optional[date]
    status: str
    notes: Optional[str]

    class Config:
        from_attributes = True
