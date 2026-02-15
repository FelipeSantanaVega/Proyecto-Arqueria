from app.config import Settings
from app.db import get_session_factory
from app.models import Exercise, Routine

s = Settings()
Session = get_session_factory(s)
with Session() as session:
    updates = {
        1: {
            "name": "Calentamiento básico 10 metros",
            "description": "Calentamiento rápido 50 flechas a 10 metros sin diana. Centrarse en postura",
        },
        2: {
            "name": "Tiro con respiración intermedia",
            "description": "4 series de 5 flechas. Tensar y respirar profundamente antes de disparar. Centrarse en la correcta técnica de suelta",
        },
    }
    for ex_id, data in updates.items():
        ex = session.get(Exercise, ex_id)
        if ex:
            ex.name = data["name"]
            ex.description = data["description"]
    routine = session.query(Routine).filter_by(name="Rutina semanal demo").first()
    if routine:
        routine.description = "Rutina de 3 días con ejercicios base"
        for day in routine.days:
            day.name = f"Día {day.day_number}"
    session.commit()
    print("Actualizado con UTF-8 via SQLAlchemy")
