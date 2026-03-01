from __future__ import annotations

import json
import re
from datetime import date, timedelta, datetime
from io import BytesIO

from fastapi import APIRouter, Depends, HTTPException, Query, Response, status
from sqlalchemy import select, and_
from sqlalchemy.exc import IntegrityError
from sqlalchemy.orm import Session, joinedload

from ..deps import get_db
from ..models import Exercise, StudentRoutineAssignment, Student, Routine, RoutineDay, RoutineDayExercise, StudentRoutineHistory
from ..schemas import AssignmentCreate, AssignmentOut, AssignmentStatusUpdate, AssignmentHistoryOut
from ..security import require_roles

router = APIRouter(prefix="/assignments", tags=["assignments"])


@router.get("", response_model=list[AssignmentOut])
def list_assignments(db: Session = Depends(get_db)):
    stmt = select(StudentRoutineAssignment).order_by(StudentRoutineAssignment.created_at.desc())
    return db.scalars(stmt).all()


@router.get("/history", response_model=list[AssignmentHistoryOut])
def list_assignment_history(
    student_id: int | None = Query(default=None),
    limit: int = Query(default=200, ge=1, le=1000),
    db: Session = Depends(get_db),
    _: None = Depends(require_roles({"admin", "professor"})),
):
    stmt = select(StudentRoutineHistory).order_by(StudentRoutineHistory.completed_at.desc())
    if student_id is not None:
        stmt = stmt.where(StudentRoutineHistory.student_id == student_id)
    return db.scalars(stmt.limit(limit)).all()


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


@router.patch("/{assignment_id}/status", response_model=AssignmentOut)
def update_assignment_status(
    assignment_id: int,
    payload: AssignmentStatusUpdate,
    db: Session = Depends(get_db),
    _: None = Depends(require_roles({"admin", "professor"})),
):
    # Futuro: permitir role "student" validando ownership alumno<->usuario.
    stmt = (
        select(StudentRoutineAssignment)
        .where(StudentRoutineAssignment.id == assignment_id)
        .options(
            joinedload(StudentRoutineAssignment.student),
            joinedload(StudentRoutineAssignment.routine)
            .joinedload(Routine.days)
            .joinedload(RoutineDay.exercises)
            .joinedload(RoutineDayExercise.exercise),
        )
    )
    assignment = db.scalars(stmt).first()
    if not assignment:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Asignación no encontrada")
    assignment.status = payload.status
    if payload.status == "finished" and assignment.end_date is None:
        assignment.end_date = date.today()

    if payload.status == "finished":
        effective_days, objective, professor_notes = _build_effective_days(db, assignment)
        weekly_total = sum(
            int(item["arrows"])
            for day in effective_days
            for item in day["items"]
        )
        snapshot = {
            "title": "PLAN SEMANAL",
            "student_name": assignment.student.full_name,
            "routine_name": assignment.routine.name,
            "objective": objective,
            "professor_notes": professor_notes or None,
            "student_observations": (payload.student_observations or "").strip() or None,
            "start_date": assignment.start_date.isoformat() if assignment.start_date else None,
            "end_date": assignment.end_date.isoformat() if assignment.end_date else None,
            "weekly_total_arrows": weekly_total,
            "days": effective_days,
            "section_titles": {
                "student_observations": "Obvservaciones",
            },
        }

        history = db.scalars(
            select(StudentRoutineHistory).where(StudentRoutineHistory.assignment_id == assignment.id)
        ).first()
        if history:
            history.student_id = assignment.student_id
            history.student_full_name = assignment.student.full_name
            history.routine_id = assignment.routine_id
            history.routine_name = assignment.routine.name
            history.start_date = assignment.start_date
            history.end_date = assignment.end_date
            history.completed_at = datetime.utcnow()
            history.objective = objective
            history.professor_notes = professor_notes or None
            history.student_observations = (payload.student_observations or "").strip() or None
            history.weekly_total_arrows = weekly_total
            history.snapshot_json = json.dumps(snapshot, ensure_ascii=False)
        else:
            db.add(
                StudentRoutineHistory(
                    assignment_id=assignment.id,
                    student_id=assignment.student_id,
                    student_full_name=assignment.student.full_name,
                    routine_id=assignment.routine_id,
                    routine_name=assignment.routine.name,
                    start_date=assignment.start_date,
                    end_date=assignment.end_date,
                    completed_at=datetime.utcnow(),
                    objective=objective,
                    professor_notes=professor_notes or None,
                    student_observations=(payload.student_observations or "").strip() or None,
                    weekly_total_arrows=weekly_total,
                    snapshot_json=json.dumps(snapshot, ensure_ascii=False),
                )
            )
    db.commit()
    db.refresh(assignment)
    return assignment


def _to_float(value: object) -> float | None:
    if value is None:
        return None
    try:
        return float(value)
    except (TypeError, ValueError):
        return None


def _to_int(value: object) -> int | None:
    if value is None:
        return None
    try:
        return int(value)
    except (TypeError, ValueError):
        return None


def _parse_assignment_notes(notes_value: str | None) -> tuple[str, str, dict[str, list[int]], dict[str, dict[str, dict[str, object]]]]:
    objective = "Determinante"
    professor_notes = ""
    temporary_exercises_by_day: dict[str, list[int]] = {}
    temporary_overrides_by_day: dict[str, dict[str, dict[str, object]]] = {}

    if not notes_value:
        return objective, professor_notes, temporary_exercises_by_day, temporary_overrides_by_day

    try:
        parsed_notes = json.loads(notes_value)
        if isinstance(parsed_notes, dict):
            maybe_objective = parsed_notes.get("objective")
            if isinstance(maybe_objective, str) and maybe_objective.strip():
                objective = maybe_objective.strip()
            maybe_professor_notes = parsed_notes.get("professor_notes")
            if isinstance(maybe_professor_notes, str):
                professor_notes = maybe_professor_notes
            maybe_exercises = parsed_notes.get("temporary_exercises_by_day")
            maybe_overrides = parsed_notes.get("temporary_exercise_overrides_by_day")
            if isinstance(maybe_exercises, dict):
                temporary_exercises_by_day = {
                    str(k): [int(v) for v in values if isinstance(v, int)]
                    for k, values in maybe_exercises.items()
                    if isinstance(values, list)
                }
            if isinstance(maybe_overrides, dict):
                temporary_overrides_by_day = {
                    str(k): values
                    for k, values in maybe_overrides.items()
                    if isinstance(values, dict)
                }
    except json.JSONDecodeError:
        professor_notes = notes_value

    return objective, professor_notes, temporary_exercises_by_day, temporary_overrides_by_day


def _build_effective_days(
    db: Session,
    assignment: StudentRoutineAssignment,
) -> tuple[list[dict[str, object]], str, str]:
    routine = assignment.routine
    ordered_days = sorted(routine.days, key=lambda day: day.day_number)

    objective, professor_notes, temporary_exercises_by_day, temporary_overrides_by_day = _parse_assignment_notes(
        assignment.notes
    )

    all_temporary_ids: set[int] = set()
    for ids in temporary_exercises_by_day.values():
        all_temporary_ids.update(ids)
    exercise_lookup: dict[int, Exercise] = {}
    if all_temporary_ids:
        exercise_stmt = select(Exercise).where(Exercise.id.in_(all_temporary_ids))
        exercise_lookup = {exercise.id: exercise for exercise in db.scalars(exercise_stmt).all()}

    effective_days: list[dict[str, object]] = []
    for day_index, day in enumerate(ordered_days, start=1):
        day_key = f"day_{day_index}"
        day_label = f"Día {day_index}"

        base_items_by_exercise_id = {
            int(item.exercise_id): item for item in sorted(day.exercises, key=lambda item: item.sort_order)
        }
        temp_ids = temporary_exercises_by_day.get(day_key)
        effective_items: list[dict[str, object]] = []

        if temp_ids:
            for exercise_id in temp_ids:
                base_item = base_items_by_exercise_id.get(exercise_id)
                exercise = (base_item.exercise if base_item else None) or exercise_lookup.get(exercise_id)
                if not exercise:
                    continue
                temp_override = temporary_overrides_by_day.get(day_key, {}).get(str(exercise_id), {})
                if not isinstance(temp_override, dict):
                    temp_override = {}
                arrows = _to_int(temp_override.get("arrows_override"))
                if arrows is None and base_item:
                    arrows = _to_int(base_item.arrows_override)
                if arrows is None:
                    arrows = int(exercise.arrows_count)

                distance = _to_float(temp_override.get("distance_override_m"))
                if distance is None and base_item:
                    distance = _to_float(base_item.distance_override_m)
                if distance is None:
                    distance = float(exercise.distance_m)

                description = temp_override.get("description_override")
                if not isinstance(description, str) or not description.strip():
                    description = base_item.notes if base_item and base_item.notes else exercise.description

                effective_items.append(
                    {
                        "name": exercise.name,
                        "arrows": arrows,
                        "distance": distance,
                        "description": (description or "").strip(),
                    }
                )
        else:
            for item in sorted(day.exercises, key=lambda i: i.sort_order):
                exercise = item.exercise
                arrows = _to_int(item.arrows_override)
                if arrows is None:
                    arrows = int(exercise.arrows_count)
                distance = _to_float(item.distance_override_m)
                if distance is None:
                    distance = float(exercise.distance_m)
                description = (item.notes or exercise.description or "").strip()
                effective_items.append(
                    {
                        "name": exercise.name,
                        "arrows": arrows,
                        "distance": distance,
                        "description": description,
                    }
                )

        effective_days.append({"label": day_label, "items": effective_items})

    return effective_days, objective, professor_notes


def _sanitize_filename(value: str) -> str:
    # Permite espacios y caracteres Unicode, reemplazando solo caracteres inválidos
    # para nombres de archivo en Windows/macOS/Linux.
    safe = re.sub(r'[\\/:*?"<>|]+', "_", value.strip())
    safe = re.sub(r"\s+", " ", safe).strip(" .")
    return safe or "rutina"


@router.get("/{assignment_id}/pdf")
def export_assignment_pdf(
    assignment_id: int,
    db: Session = Depends(get_db),
    _: None = Depends(require_roles({"admin", "professor"})),
):
    stmt = (
        select(StudentRoutineAssignment)
        .where(StudentRoutineAssignment.id == assignment_id)
        .options(
            joinedload(StudentRoutineAssignment.student),
            joinedload(StudentRoutineAssignment.routine)
            .joinedload(Routine.days)
            .joinedload(RoutineDay.exercises)
            .joinedload(RoutineDayExercise.exercise),
        )
    )
    assignment = db.scalars(stmt).first()
    if not assignment:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Asignación no encontrada")

    # Force loading exercise relation for routine day items.
    routine = assignment.routine
    ordered_days = sorted(routine.days, key=lambda day: day.day_number)
    for day in ordered_days:
        for day_exercise in day.exercises:
            _ = day_exercise.exercise

    effective_days, objective, professor_notes = _build_effective_days(db, assignment)

    try:
        from reportlab.lib.pagesizes import A4
        from reportlab.lib import colors
        from reportlab.lib.units import mm
        from reportlab.pdfgen import canvas
    except Exception as exc:  # pragma: no cover
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail=f"No se pudo generar PDF (falta dependencia): {exc}",
        )

    buffer = BytesIO()
    pdf = canvas.Canvas(buffer, pagesize=A4)
    page_w, page_h = A4
    x_left = 18 * mm
    x_right = page_w - (18 * mm)
    y = page_h - 18 * mm
    line_h = 5.2 * mm

    def ensure_space(min_y: float = 20 * mm):
        nonlocal y
        if y < min_y:
            pdf.showPage()
            y = page_h - 20 * mm
        pdf.setStrokeColor(colors.black)
        pdf.setFillColor(colors.black)

    def write_line(
        text: str,
        *,
        x: float = x_left,
        size: int = 11,
        bold: bool = False,
        color=colors.black,
        step: float | None = None,
    ):
        nonlocal y
        ensure_space()
        pdf.setFont("Times-Bold" if bold else "Times-Roman", size)
        pdf.setFillColor(color)
        pdf.drawString(x, y, text)
        pdf.setFillColor(colors.black)
        y -= step if step is not None else line_h

    def write_wrapped(
        text: str,
        *,
        x: float = x_left,
        max_width: float = x_right - x_left,
        size: int = 10,
        bold: bool = False,
        leading: float = 4.8 * mm,
    ):
        nonlocal y
        if not text:
            return
        words = text.split()
        if not words:
            return
        font_name = "Times-Bold" if bold else "Times-Roman"
        pdf.setFont(font_name, size)
        line = words[0]
        for word in words[1:]:
            trial = f"{line} {word}"
            if pdf.stringWidth(trial, font_name, size) <= max_width:
                line = trial
            else:
                ensure_space()
                pdf.drawString(x, y, line)
                y -= leading
                line = word
        ensure_space()
        pdf.drawString(x, y, line)
        y -= leading

    def write_wrapped_justify(
        text: str,
        *,
        size: int = 12,
        bold: bool = False,
        leading: float = 5.2 * mm,
    ):
        nonlocal y
        if not text:
            return
        words = text.split()
        if not words:
            return
        font_name = "Times-Bold" if bold else "Times-Roman"
        pdf.setFont(font_name, size)
        max_width = x_right - x_left
        lines: list[str] = []
        line = words[0]
        for word in words[1:]:
            trial = f"{line} {word}"
            if pdf.stringWidth(trial, font_name, size) <= max_width:
                line = trial
            else:
                lines.append(line)
                line = word
        lines.append(line)
        for i, ln in enumerate(lines):
            ensure_space()
            # Justificado tipo Word: solo líneas intermedias, última línea alineada a la izquierda.
            is_last = i == len(lines) - 1
            parts = ln.split(" ")
            if is_last or len(parts) <= 1:
                pdf.drawString(x_left, y, ln)
            else:
                # Evita separar visualmente el bullet del texto al justificar.
                if parts[0] == "•" and len(parts) > 2:
                    bullet = parts[0]
                    rest_parts = parts[1:]
                    bullet_gap = pdf.stringWidth(" ", font_name, size)
                    bullet_width = pdf.stringWidth(bullet, font_name, size)
                    rest_width = max_width - bullet_width - bullet_gap
                    rest_words_width = sum(pdf.stringWidth(part, font_name, size) for part in rest_parts)
                    rest_gaps = len(rest_parts) - 1
                    rest_gap_width = (
                        max((rest_width - rest_words_width) / rest_gaps, bullet_gap)
                        if rest_gaps > 0
                        else bullet_gap
                    )
                    x_cursor = x_left
                    pdf.drawString(x_cursor, y, bullet)
                    x_cursor += bullet_width + bullet_gap
                    for idx_part, part in enumerate(rest_parts):
                        pdf.drawString(x_cursor, y, part)
                        if idx_part < rest_gaps:
                            x_cursor += pdf.stringWidth(part, font_name, size) + rest_gap_width
                else:
                    words_width = sum(pdf.stringWidth(part, font_name, size) for part in parts)
                    gaps = len(parts) - 1
                    total_space = max_width - words_width
                    gap_width = max(total_space / gaps, pdf.stringWidth(" ", font_name, size))
                    x_cursor = x_left
                    for idx_part, part in enumerate(parts):
                        pdf.drawString(x_cursor, y, part)
                        if idx_part < gaps:
                            x_cursor += pdf.stringWidth(part, font_name, size) + gap_width
            y -= leading

    def format_distance(distance: float) -> str:
        if float(distance).is_integer():
            return str(int(distance))
        return f"{distance:.1f}".rstrip("0").rstrip(".")

    weekly_total = 0
    day_totals: list[int] = []
    for day in effective_days:
        total = sum(int(item["arrows"]) for item in day["items"])
        day_totals.append(total)
        weekly_total += total

    # Formato 1:1 con el documento de referencia (texto corrido, Times New Roman 12).
    start_label = assignment.start_date.strftime("%d/%m") if assignment.start_date else "--/--"
    end_label = assignment.end_date.strftime("%d/%m/%Y") if assignment.end_date else "--/--/----"

    write_line("PLAN SEMANAL", size=12, bold=False, step=5.2 * mm)
    write_line(
        f"SEMANA: {start_label} al {end_label}    OBJETIVO: {objective}",
        size=12,
        bold=False,
        step=5.2 * mm,
    )
    write_line(
        f"VOLUMEN SEMANAL: {weekly_total} disparos    DEPORTISTA: {assignment.student.full_name}",
        size=12,
        bold=False,
        step=6.3 * mm,
    )

    clean_professor_notes = (professor_notes or "").strip()
    if clean_professor_notes:
        write_line("Notas del profesor:", size=12, bold=True, step=5.2 * mm)
        for line in professor_notes.splitlines():
            if not line.strip():
                y -= line_h
                continue
            write_wrapped_justify(
                line,
                size=12,
                leading=5.2 * mm,
            )
        y -= 0.8 * mm

    # Contenido por día.
    for idx, day in enumerate(effective_days, start=1):
        ensure_space(30 * mm)
        # Separador al inicio de cada día (incluye Día 1).
        pdf.setStrokeColor(colors.HexColor("#888888"))
        pdf.setLineWidth(0.8)
        pdf.line(x_left, y, x_right, y)
        # Línea vacía entre separador y encabezado del día.
        y -= line_h
        write_line(f"Día {idx}", size=12, bold=True, step=5.2 * mm)
        items = day["items"]
        if not items:
            write_line("Sin ejercicios.", x=x_left, size=12, bold=False, step=5.2 * mm)
        else:
            for item in items:
                name = str(item["name"]).strip()
                arrows = int(item["arrows"])
                distance = float(item["distance"])
                description = str(item["description"]).strip()

                write_wrapped_justify(
                    f"• Tirar a {format_distance(distance)} metros : {name} ({arrows} disparos).",
                    size=12,
                    leading=5.2 * mm,
                )
                if description:
                    write_wrapped_justify(
                        description,
                        size=12,
                        leading=5.2 * mm,
                    )
                y -= 0.5 * mm

        # Asegura que el total quede debajo del bloque de ejercicios.
        y -= 0.8 * mm
        write_line(f"Total Día {idx}: {day_totals[idx - 1]} disparos", size=12, bold=True, step=5.6 * mm)

    pdf.save()
    pdf_bytes = buffer.getvalue()
    buffer.close()

    if assignment.start_date and assignment.end_date:
        start_day = assignment.start_date.strftime("%d")
        start_month = assignment.start_date.strftime("%m")
        end_day = assignment.end_date.strftime("%d")
        end_month = assignment.end_date.strftime("%m")
        base_name = (
            f"PLAN SEMANAL {assignment.student.full_name} "
            f"{start_day}-{start_month} a {end_day}-{end_month}"
        )
    else:
        base_name = f"PLAN SEMANAL {assignment.student.full_name}"
    file_name = _sanitize_filename(f"{base_name}.pdf")
    return Response(
        content=pdf_bytes,
        media_type="application/pdf",
        headers={"Content-Disposition": f'attachment; filename="{file_name}"'},
    )
