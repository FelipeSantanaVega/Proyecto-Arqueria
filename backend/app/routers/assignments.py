from __future__ import annotations

import json
import re
from datetime import date, timedelta, datetime
from io import BytesIO

from fastapi import APIRouter, Depends, Form, HTTPException, Query, Response, status
from sqlalchemy import select, and_, or_
from sqlalchemy.exc import IntegrityError
from sqlalchemy.orm import Session, joinedload

from ..deps import get_db
from ..models import Exercise, StudentRoutineAssignment, Student, Routine, RoutineDay, RoutineDayExercise, StudentRoutineHistory, User
from ..ownership import ensure_record_access, resolve_owner_user_id
from ..schemas import AssignmentCreate, AssignmentOut, AssignmentStatusUpdate, AssignmentHistoryOut
from ..security import get_current_user, get_user_from_access_token, require_roles

router = APIRouter(prefix="/assignments", tags=["assignments"])


def _student_visibility_filter(current_user: User):
    if current_user.role == "admin":
        return True
    return or_(
        Student.created_by_user_id == current_user.id,
        Student.created_by_user_id.is_(None),
    )


def _routine_visibility_filter(current_user: User):
    if current_user.role == "admin":
        return True
    return or_(
        Routine.created_by_user_id == current_user.id,
        Routine.created_by_user_id.is_(None),
    )


@router.get("", response_model=list[AssignmentOut])
def list_assignments(
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user),
    _: None = Depends(require_roles({"admin", "professor"})),
):
    stmt = (
        select(StudentRoutineAssignment)
        .join(Student, Student.id == StudentRoutineAssignment.student_id)
        .join(Routine, Routine.id == StudentRoutineAssignment.routine_id)
        .order_by(StudentRoutineAssignment.created_at.desc())
    )
    if current_user.role != "admin":
        stmt = stmt.where(
            and_(
                _student_visibility_filter(current_user),
                _routine_visibility_filter(current_user),
            )
        )
    return db.scalars(stmt).all()


@router.get("/history", response_model=list[AssignmentHistoryOut])
def list_assignment_history(
    student_id: int | None = Query(default=None),
    limit: int = Query(default=200, ge=1, le=1000),
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user),
    _: None = Depends(require_roles({"admin", "professor"})),
):
    stmt = select(StudentRoutineHistory).order_by(StudentRoutineHistory.completed_at.desc())
    if student_id is not None:
        stmt = stmt.where(StudentRoutineHistory.student_id == student_id)
    if current_user.role != "admin":
        stmt = stmt.where(
            or_(
                StudentRoutineHistory.created_by_user_id == current_user.id,
                StudentRoutineHistory.created_by_user_id.is_(None),
            )
        )
    return db.scalars(stmt.limit(limit)).all()


@router.post("", response_model=AssignmentOut, status_code=status.HTTP_201_CREATED)
def create_assignment(
    payload: AssignmentCreate,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user),
    _: None = Depends(require_roles({"admin", "professor"})),
):
    # Validar que existan student y routine
    student = db.get(Student, payload.student_id)
    if not student:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Deportista no encontrado")
    ensure_record_access(student.created_by_user_id, current_user, "Deportista no encontrado")
    routine = db.get(Routine, payload.routine_id)
    if not routine:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Rutina no encontrada")
    ensure_record_access(routine.created_by_user_id, current_user, "Rutina no encontrada")

    # Regla de negocio: un deportista no puede tener más de una rutina activa en la misma semana.
    if payload.status == "active":
        start = payload.start_date or date.today()
        week_start = start - timedelta(days=start.weekday())
        week_end = week_start + timedelta(days=6)
        stmt = (
            select(StudentRoutineAssignment)
            .join(Student, Student.id == StudentRoutineAssignment.student_id)
            .join(Routine, Routine.id == StudentRoutineAssignment.routine_id)
            .where(
                and_(
                    StudentRoutineAssignment.student_id == payload.student_id,
                    StudentRoutineAssignment.status == "active",
                    StudentRoutineAssignment.start_date <= week_end,
                    StudentRoutineAssignment.end_date >= week_start,
                )
            )
        )
        if current_user.role != "admin":
            stmt = stmt.where(
                and_(
                    _student_visibility_filter(current_user),
                    _routine_visibility_filter(current_user),
                )
            )
        existing = db.scalars(stmt).first()
        if existing:
            raise HTTPException(
                status_code=status.HTTP_400_BAD_REQUEST,
                detail="El deportista ya tiene una rutina activa en esa semana",
            )

    assignment = StudentRoutineAssignment(
        **payload.dict(),
        created_by_user_id=resolve_owner_user_id(
            current_user,
            student.created_by_user_id,
            routine.created_by_user_id,
        ),
    )
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
    current_user: User = Depends(get_current_user),
    _: None = Depends(require_roles({"admin", "professor"})),
):
    assignment = db.get(StudentRoutineAssignment, assignment_id)
    if not assignment:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Asignación no encontrada")
    student = db.get(Student, assignment.student_id)
    routine = db.get(Routine, assignment.routine_id)
    ensure_record_access(student.created_by_user_id if student else assignment.created_by_user_id, current_user, "Asignación no encontrada")
    ensure_record_access(routine.created_by_user_id if routine else assignment.created_by_user_id, current_user, "Asignación no encontrada")
    db.delete(assignment)
    db.commit()


@router.patch("/{assignment_id}/status", response_model=AssignmentOut)
def update_assignment_status(
    assignment_id: int,
    payload: AssignmentStatusUpdate,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user),
    _: None = Depends(require_roles({"admin", "professor"})),
):
    # Futuro: permitir role "student" validando ownership deportista<->usuario.
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
    ensure_record_access(assignment.student.created_by_user_id, current_user, "Asignación no encontrada")
    ensure_record_access(assignment.routine.created_by_user_id, current_user, "Asignación no encontrada")
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
            history.created_by_user_id = resolve_owner_user_id(
                current_user,
                assignment.created_by_user_id,
                assignment.student.created_by_user_id,
                assignment.routine.created_by_user_id,
            )
        else:
            db.add(
                StudentRoutineHistory(
                    created_by_user_id=resolve_owner_user_id(
                        current_user,
                        assignment.created_by_user_id,
                        assignment.student.created_by_user_id,
                        assignment.routine.created_by_user_id,
                    ),
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

                base_rounds = _to_int(getattr(exercise, "rounds", None))
                if base_rounds is None or base_rounds <= 0:
                    base_rounds = 1
                base_arrows_per_round = _to_int(getattr(exercise, "arrows_per_round", None))
                if base_arrows_per_round is None:
                    base_arrows_per_round = int(exercise.arrows_count or 0)

                rounds = _to_int(temp_override.get("rounds_override"))
                arrows_per_round = _to_int(temp_override.get("arrows_per_round_override"))

                if rounds is None and arrows_per_round is None:
                    if arrows is not None and base_rounds > 0 and arrows % base_rounds == 0:
                        rounds = base_rounds
                        arrows_per_round = arrows // base_rounds
                    else:
                        rounds = base_rounds
                        arrows_per_round = base_arrows_per_round
                elif rounds is None:
                    rounds = base_rounds if base_rounds > 0 else 1
                elif arrows_per_round is None:
                    if rounds > 0 and arrows is not None and arrows % rounds == 0:
                        arrows_per_round = arrows // rounds
                    else:
                        arrows_per_round = base_arrows_per_round

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
                        "rounds": rounds,
                        "arrows_per_round": arrows_per_round,
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

                rounds = _to_int(getattr(exercise, "rounds", None))
                if rounds is None or rounds <= 0:
                    rounds = 1
                arrows_per_round = _to_int(getattr(exercise, "arrows_per_round", None))
                if arrows_per_round is None:
                    if rounds > 0 and arrows is not None and arrows % rounds == 0:
                        arrows_per_round = arrows // rounds
                    else:
                        arrows_per_round = int(exercise.arrows_count or 0)

                distance = _to_float(item.distance_override_m)
                if distance is None:
                    distance = float(exercise.distance_m)
                description = (item.notes or exercise.description or "").strip()
                effective_items.append(
                    {
                        "name": exercise.name,
                        "arrows": arrows,
                        "rounds": rounds,
                        "arrows_per_round": arrows_per_round,
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


def _build_assignment_pdf_response(
    assignment_id: int,
    db: Session,
    current_user: User,
    *,
    inline: bool = False,
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
    ensure_record_access(assignment.student.created_by_user_id, current_user, "Asignación no encontrada")
    ensure_record_access(assignment.routine.created_by_user_id, current_user, "Asignación no encontrada")

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
        from reportlab.lib.utils import simpleSplit
        from reportlab.pdfgen import canvas
    except Exception as exc:  # pragma: no cover
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail=f"No se pudo generar PDF (falta dependencia): {exc}",
        )

    buffer = BytesIO()
    pdf = canvas.Canvas(buffer, pagesize=A4)
    pdf.setTitle("Plan semanal")
    page_w, page_h = A4
    x_left = 15 * mm
    x_right = page_w - (15 * mm)
    content_w = x_right - x_left
    page_margin_bottom = 16 * mm
    y = page_h
    page_number = 0

    brand = colors.HexColor("#fb5a13")
    brand_dark = colors.HexColor("#c2410c")
    text_primary = colors.HexColor("#12213a")
    text_secondary = colors.HexColor("#536179")
    text_muted = colors.HexColor("#748092")
    card_fill = colors.white
    card_border = colors.HexColor("#e6eaf2")
    soft_fill = colors.HexColor("#f7f8fb")
    soft_orange = colors.HexColor("#fff1e8")

    def draw_round_rect(x: float, y_top: float, width: float, height: float, *, fill_color, stroke_color=card_border, radius: float = 5 * mm, stroke_width: float = 1):
        pdf.setFillColor(fill_color)
        pdf.setStrokeColor(stroke_color)
        pdf.setLineWidth(stroke_width)
        pdf.roundRect(x, y_top - height, width, height, radius, stroke=1, fill=1)

    def draw_text(
        text: str,
        x: float,
        y_baseline: float,
        *,
        font_name: str = "Helvetica",
        size: int = 10,
        color=text_primary,
    ):
        pdf.setFont(font_name, size)
        pdf.setFillColor(color)
        pdf.drawString(x, y_baseline, text)

    def split_text(text: str, *, font_name: str, size: int, max_width: float) -> list[str]:
        if not text:
            return []
        return simpleSplit(text, font_name, size, max_width)

    def draw_multiline_text(
        text: str,
        x: float,
        y_top: float,
        *,
        font_name: str = "Helvetica",
        size: int = 10,
        color=text_secondary,
        leading: float = 4.1 * mm,
        max_width: float,
    ) -> float:
        lines = split_text(text, font_name=font_name, size=size, max_width=max_width)
        cursor_y = y_top
        for line in lines:
            draw_text(line, x, cursor_y, font_name=font_name, size=size, color=color)
            cursor_y -= leading
        return cursor_y

    def draw_footer():
        footer_y = 10 * mm
        pdf.setStrokeColor(card_border)
        pdf.setLineWidth(0.7)
        pdf.line(x_left, footer_y + 4 * mm, x_right, footer_y + 4 * mm)
        draw_text(
            f"Página {page_number}",
            x_right - 18 * mm,
            footer_y,
            font_name="Helvetica",
            size=8,
            color=text_muted,
        )

    def start_page(*, include_summary: bool):
        nonlocal y, page_number
        if page_number:
            pdf.showPage()
        page_number += 1
        pdf.setFillColor(colors.white)
        pdf.setStrokeColor(colors.white)
        pdf.rect(0, 0, page_w, page_h, stroke=0, fill=1)

        header_h = 24 * mm
        draw_round_rect(x_left, page_h - 12 * mm, content_w, header_h, fill_color=soft_fill, stroke_color=soft_fill, radius=6 * mm, stroke_width=0)

        title_center_x = x_left + (content_w / 2)
        club_title = "ARQUEROS ANDINOS"
        doc_title = "Plan semanal de entrenamiento"
        pdf.setFont("Helvetica-Bold", 11)
        club_width = pdf.stringWidth(club_title, "Helvetica-Bold", 11)
        pdf.setFont("Helvetica-Bold", 18)
        doc_width = pdf.stringWidth(doc_title, "Helvetica-Bold", 18)
        draw_text(club_title, title_center_x - (club_width / 2), page_h - 16.8 * mm, font_name="Helvetica-Bold", size=11, color=brand_dark)
        draw_text(doc_title, title_center_x - (doc_width / 2), page_h - 24.2 * mm, font_name="Helvetica-Bold", size=18, color=text_primary)

        y = page_h - 42 * mm

        if include_summary:
            draw_text(f"Deportista: {assignment.student.full_name}", x_left, y, font_name="Helvetica-Bold", size=13, color=text_primary)
            y -= 5.5 * mm
            date_range = (
                f"Semana: {assignment.start_date.strftime('%d/%m/%Y') if assignment.start_date else '--/--/----'}"
                f" al {assignment.end_date.strftime('%d/%m/%Y') if assignment.end_date else '--/--/----'}"
            )
            draw_text(date_range, x_left, y, font_name="Helvetica", size=9, color=text_secondary)
            y -= 5 * mm

            objective_lines = split_text(
                f"Objetivo: {objective}",
                font_name="Helvetica",
                size=10,
                max_width=content_w,
            )
            for line in objective_lines:
                draw_text(line, x_left, y, font_name="Helvetica", size=10, color=text_secondary)
                y -= 4.2 * mm
            y -= 1.5 * mm

    def ensure_space(required_height: float):
        nonlocal y
        if y - required_height < page_margin_bottom:
            draw_footer()
            start_page(include_summary=False)

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

    start_page(include_summary=True)

    summary_gap = 3 * mm
    summary_width = (content_w - (2 * summary_gap)) / 3
    summary_height = 19 * mm
    summary_y = y
    status_finished = assignment.status == "finished"
    status_label = "Finalizada" if status_finished else "En curso"
    status_color = colors.HexColor("#dc2626") if status_finished else colors.HexColor("#15803d")
    summary_items = [
        ("Volumen semanal", f"{weekly_total} disparos"),
        ("Días programados", str(len(effective_days))),
        ("Estado", status_label),
    ]
    for idx, (label, value) in enumerate(summary_items):
        card_x = x_left + (idx * (summary_width + summary_gap))
        draw_round_rect(card_x, summary_y, summary_width, summary_height, fill_color=card_fill, stroke_color=card_border, radius=4 * mm)
        draw_text(label.upper(), card_x + 4 * mm, summary_y - 6 * mm, font_name="Helvetica-Bold", size=7, color=text_muted)
        draw_text(value, card_x + 4 * mm, summary_y - 13 * mm, font_name="Helvetica-Bold", size=12, color=brand if idx < 2 else status_color)
    y -= summary_height + 5 * mm

    clean_professor_notes = (professor_notes or "").strip()
    if clean_professor_notes:
        notes_lines = []
        for raw_line in clean_professor_notes.splitlines():
            if not raw_line.strip():
                notes_lines.append("")
                continue
            notes_lines.extend(split_text(raw_line, font_name="Helvetica", size=9, max_width=content_w - 10 * mm))
        notes_height = 11 * mm + max(len(notes_lines), 1) * (3.9 * mm)
        ensure_space(notes_height + 2 * mm)
        draw_round_rect(x_left, y, content_w, notes_height, fill_color=soft_orange, stroke_color=colors.HexColor("#fbd0b5"), radius=4 * mm)
        draw_text("Notas del profesor", x_left + 5 * mm, y - 6 * mm, font_name="Helvetica-Bold", size=10, color=brand_dark)
        notes_y = y - 11 * mm
        if notes_lines:
            for note_line in notes_lines:
                if note_line:
                    draw_text(note_line, x_left + 5 * mm, notes_y, font_name="Helvetica", size=9, color=text_secondary)
                notes_y -= 3.9 * mm
        y -= notes_height + 5 * mm

    day_card_width = min(content_w, 170 * mm)
    day_card_x = x_left + ((content_w - day_card_width) / 2)

    def estimate_day_height(day_index: int, day: dict[str, object], total_arrows: int) -> float:
        card_inner_w = day_card_width - (12 * mm)
        text_w = card_inner_w - 22 * mm
        height = 17 * mm
        items = day["items"]
        if not items:
            return height + 10 * mm
        for item in items:
            name_lines = split_text(str(item["name"]).strip(), font_name="Helvetica-Bold", size=11, max_width=text_w)
            meta = (
                f"{max(int(item.get('rounds') or 1), 1)} x "
                f"{max(int(item.get('arrows_per_round') or 0), 0)} disparos"
                f"  ·  {format_distance(float(item['distance']))} m"
                f"  ·  Total {int(item['arrows'])}"
            )
            meta_lines = split_text(meta, font_name="Helvetica", size=8, max_width=text_w)
            description = str(item["description"]).strip()
            description_lines = split_text(description, font_name="Helvetica", size=9, max_width=text_w) if description else []
            height += max(15 * mm, (len(name_lines) * 4.3 * mm) + (len(meta_lines) * 3.7 * mm) + (len(description_lines) * 3.8 * mm) + (4 * mm))
        return height + 8 * mm

    for idx, day in enumerate(effective_days, start=1):
        day_total = day_totals[idx - 1]
        card_height = estimate_day_height(idx, day, day_total)
        ensure_space(card_height + 2 * mm)
        draw_round_rect(day_card_x, y, day_card_width, card_height, fill_color=card_fill, stroke_color=card_border, radius=5 * mm)
        pdf.setFillColor(brand)
        pdf.roundRect(day_card_x, y - card_height, 5 * mm, card_height, 5 * mm, stroke=0, fill=1)

        day_top_y = y - 6 * mm
        draw_text(str(day.get("label") or f"Día {idx}"), day_card_x + 9 * mm, day_top_y, font_name="Helvetica-Bold", size=13, color=text_primary)
        draw_round_rect(day_card_x + day_card_width - 35 * mm, y - 4 * mm, 29 * mm, 8.5 * mm, fill_color=soft_orange, stroke_color=soft_orange, radius=3 * mm, stroke_width=0)
        draw_text(f"{day_total} disparos", day_card_x + day_card_width - 31 * mm, y - 9.2 * mm, font_name="Helvetica-Bold", size=8, color=brand_dark)

        cursor_y = y - 16 * mm
        items = day["items"]
        if not items:
            draw_text("Sin ejercicios programados.", day_card_x + 9 * mm, cursor_y, font_name="Helvetica", size=10, color=text_secondary)
            y -= card_height + 4 * mm
            continue

        for item_index, item in enumerate(items, start=1):
            name = str(item["name"]).strip()
            arrows = int(item["arrows"])
            rounds = max(int(item.get("rounds") or 1), 1)
            arrows_per_round = max(int(item.get("arrows_per_round") or 0), 0)
            distance = float(item["distance"])
            description = str(item["description"]).strip()

            badge_size = 7.5 * mm
            badge_x = day_card_x + 9 * mm
            badge_y = cursor_y + 1.5 * mm
            draw_round_rect(badge_x, badge_y, badge_size, badge_size, fill_color=soft_fill, stroke_color=soft_fill, radius=2.2 * mm, stroke_width=0)
            draw_text(str(item_index), badge_x + 2.35 * mm, badge_y - 5 * mm, font_name="Helvetica-Bold", size=8, color=brand_dark)

            text_x = badge_x + badge_size + 4 * mm
            text_w = (day_card_x + day_card_width) - (text_x + 5 * mm)
            name_lines = split_text(name, font_name="Helvetica-Bold", size=11, max_width=text_w)
            meta = (
                f"{rounds} rondas x {arrows_per_round} disparos  ·  "
                f"{format_distance(distance)} m  ·  Total {arrows}"
            )
            meta_lines = split_text(meta, font_name="Helvetica", size=9, max_width=text_w)
            desc_lines = split_text(description, font_name="Helvetica", size=9, max_width=text_w) if description else []

            line_y = cursor_y
            for line in name_lines:
                draw_text(line, text_x, line_y, font_name="Helvetica-Bold", size=11, color=text_primary)
                line_y -= 4.2 * mm
            for line in meta_lines:
                draw_text(line, text_x, line_y, font_name="Helvetica", size=9, color=text_muted)
                line_y -= 4.2 * mm
            for line in desc_lines:
                draw_text(line, text_x, line_y, font_name="Helvetica", size=9, color=text_secondary)
                line_y -= 3.9 * mm

            cursor_y = min(line_y, cursor_y - 15 * mm)
            if item_index < len(items):
                pdf.setStrokeColor(card_border)
                pdf.setLineWidth(0.8)
                pdf.line(day_card_x + 9 * mm, cursor_y + 2 * mm, day_card_x + day_card_width - 5 * mm, cursor_y + 2 * mm)
                cursor_y -= 4 * mm

        y -= card_height + 4 * mm

    draw_footer()

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
    disposition = "inline" if inline else "attachment"
    return Response(
        content=pdf_bytes,
        media_type="application/pdf",
        headers={"Content-Disposition": f'{disposition}; filename="{file_name}"'},
    )


@router.get("/{assignment_id}/pdf")
def export_assignment_pdf(
    assignment_id: int,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user),
    _: None = Depends(require_roles({"admin", "professor"})),
):
    return _build_assignment_pdf_response(assignment_id, db, current_user)


@router.post("/{assignment_id}/pdf")
def export_assignment_pdf_post(
    assignment_id: int,
    access_token: str = Form(...),
    db: Session = Depends(get_db),
):
    current_user = get_user_from_access_token(db, access_token)
    if current_user.role not in {"admin", "professor"}:
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail="Permisos insuficientes",
        )
    return _build_assignment_pdf_response(assignment_id, db, current_user)


@router.get("/{assignment_id}/pdf-download")
def export_assignment_pdf_download(
    assignment_id: int,
    access_token: str = Query(...),
    db: Session = Depends(get_db),
):
    current_user = get_user_from_access_token(db, access_token)
    if current_user.role not in {"admin", "professor"}:
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail="Permisos insuficientes",
        )
    return _build_assignment_pdf_response(assignment_id, db, current_user)
