from __future__ import annotations

from collections.abc import Iterator

from fastapi import FastAPI
from fastapi.testclient import TestClient
from sqlalchemy import create_engine
from sqlalchemy.orm import Session, sessionmaker
from sqlalchemy.pool import StaticPool

from app.deps import get_db
from app.models import User
from app.routers import auth
from app.security import hash_password


def build_test_app(session_factory: sessionmaker[Session]) -> FastAPI:
    app = FastAPI()
    app.include_router(auth.router)

    def override_get_db() -> Iterator[Session]:
        db = session_factory()
        try:
            yield db
        finally:
            db.close()

    app.dependency_overrides[get_db] = override_get_db
    return app


def create_user(session_factory: sessionmaker[Session]) -> User:
    with session_factory() as db:
        user = User(
            id=1,
            username="profesor",
            password_hash=hash_password("profesor123"),
            role="professor",
            is_active=True,
        )
        db.add(user)
        db.commit()
        db.refresh(user)
        return user


def login(client: TestClient) -> dict[str, str]:
    response = client.post(
        "/auth/login",
        json={"username": "profesor", "password": "profesor123"},
    )
    assert response.status_code == 200
    return response.json()


def auth_header(access_token: str) -> dict[str, str]:
    return {"Authorization": f"Bearer {access_token}"}


def test_logout_with_refresh_token_only_revokes_session() -> None:
    engine = create_engine(
        "sqlite+pysqlite:///:memory:",
        future=True,
        connect_args={"check_same_thread": False},
        poolclass=StaticPool,
    )
    session_factory = sessionmaker(bind=engine, autoflush=False, autocommit=False, future=True)
    User.__table__.create(engine)
    create_user(session_factory)
    client = TestClient(build_test_app(session_factory))

    tokens = login(client)

    logout_response = client.post(
        "/auth/logout",
        json={"refresh_token": tokens["refresh_token"]},
    )

    assert logout_response.status_code == 200
    assert logout_response.json()["detail"] == "Sesión cerrada correctamente"

    refresh_response = client.post(
        "/auth/refresh",
        json={"refresh_token": tokens["refresh_token"]},
    )
    assert refresh_response.status_code == 401


def test_change_password_revokes_refresh_token_and_requires_new_password() -> None:
    engine = create_engine(
        "sqlite+pysqlite:///:memory:",
        future=True,
        connect_args={"check_same_thread": False},
        poolclass=StaticPool,
    )
    session_factory = sessionmaker(bind=engine, autoflush=False, autocommit=False, future=True)
    User.__table__.create(engine)
    create_user(session_factory)
    client = TestClient(build_test_app(session_factory))

    tokens = login(client)

    change_password_response = client.post(
        "/auth/change-password",
        json={
            "current_password": "profesor123",
            "new_password": "profesor456",
            "confirm_password": "profesor456",
        },
        headers=auth_header(tokens["access_token"]),
    )

    assert change_password_response.status_code == 200
    assert "Inicia sesión nuevamente" in change_password_response.json()["detail"]

    refresh_response = client.post(
        "/auth/refresh",
        json={"refresh_token": tokens["refresh_token"]},
    )
    assert refresh_response.status_code == 401

    old_login_response = client.post(
        "/auth/login",
        json={"username": "profesor", "password": "profesor123"},
    )
    assert old_login_response.status_code == 401

    new_login_response = client.post(
        "/auth/login",
        json={"username": "profesor", "password": "profesor456"},
    )
    assert new_login_response.status_code == 200
