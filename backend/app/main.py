from __future__ import annotations

from fastapi import Depends, FastAPI
from fastapi.middleware.cors import CORSMiddleware
from sqlalchemy import text
from sqlalchemy.orm import Session

from .deps import SessionLocal, get_db, settings
from .routine_retention import ensure_routine_schema
from .routers import exercises, students, routines, assignments, auth
from .student_retention import ensure_student_retention_schema, purge_inactive_students

app = FastAPI(
    title="Archery Training API",
    version="0.1.0",
    debug=settings.app_debug,
)

app.add_middleware(
    CORSMiddleware,
    allow_origins=settings.cors_origins,
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)


@app.on_event("startup")
def startup_maintenance():
    db = SessionLocal()
    try:
        ensure_student_retention_schema(db)
        ensure_routine_schema(db)
        purge_inactive_students(db)
    finally:
        db.close()


@app.get("/health")
def health(db: Session = Depends(get_db)):
    # Prueba de conectividad a la base.
    db.execute(text("SELECT 1"))
    return {
        "status": "ok",
        "env": settings.app_env,
    }


@app.get("/")
def root():
    return {"message": "Archery Training API", "version": app.version}


# Routers
app.include_router(auth.router)
app.include_router(exercises.router)
app.include_router(students.router)
app.include_router(routines.router)
app.include_router(assignments.router)
