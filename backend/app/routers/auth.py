from __future__ import annotations

from datetime import datetime, timedelta

from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy import select
from sqlalchemy.orm import Session

from ..deps import get_db, settings
from ..models import User
from ..schemas import (
    AuthMeResponse,
    ChangePasswordRequest,
    LoginRequest,
    LoginResponse,
    LogoutRequest,
    RefreshTokenRequest,
)
from ..security import (
    create_access_token,
    create_refresh_token,
    decode_token,
    get_current_user,
    get_current_user_optional,
    hash_password,
    hash_refresh_token,
    verify_password,
)

router = APIRouter(prefix="/auth", tags=["auth"])


def issue_tokens(user: User, db: Session) -> LoginResponse:
    access_token = create_access_token(
        data={"sub": user.username, "role": user.role, "user_id": user.id},
        expires_minutes=settings.jwt_expires_min,
    )
    refresh_token = create_refresh_token(
        data={"sub": user.username, "user_id": user.id},
        expires_minutes=settings.jwt_refresh_expires_min,
    )
    user.refresh_token_hash = hash_refresh_token(refresh_token)
    user.refresh_token_expires_at = datetime.utcnow() + timedelta(minutes=settings.jwt_refresh_expires_min)
    db.add(user)
    db.commit()
    return LoginResponse(
        access_token=access_token,
        refresh_token=refresh_token,
        detail="Login exitoso",
    )


def revoke_refresh_session(user: User, db: Session) -> None:
    user.refresh_token_hash = None
    user.refresh_token_expires_at = None
    db.add(user)
    db.commit()


def get_user_from_refresh_token(
    refresh_token: str,
    db: Session,
    *,
    clear_expired_session: bool = False,
) -> User:
    normalized_refresh_token = refresh_token.strip()
    if not normalized_refresh_token:
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="Refresh token inválido",
        )

    token_payload = decode_token(normalized_refresh_token, verify_exp=False)
    if token_payload.get("type") != "refresh":
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="Refresh token inválido",
        )

    user_id = token_payload.get("user_id")
    username = token_payload.get("sub")
    if not user_id or not username:
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="Refresh token inválido",
        )

    user = db.get(User, int(user_id))
    if not user or not user.is_active or user.username != username:
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="Usuario no autorizado",
        )
    if not user.refresh_token_hash or not user.refresh_token_expires_at:
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="Refresh token inválido",
        )
    if user.refresh_token_expires_at <= datetime.utcnow():
        if clear_expired_session:
            revoke_refresh_session(user, db)
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="La sesión expiró",
        )
    if user.refresh_token_hash != hash_refresh_token(normalized_refresh_token):
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="Refresh token inválido",
        )

    return user


@router.post("/login", response_model=LoginResponse)
def login(payload: LoginRequest, db: Session = Depends(get_db)):
    stmt = select(User).where(User.username == payload.username)
    user = db.scalars(stmt).first()
    if not user or not user.is_active:
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="Credenciales inválidas",
        )
    if not verify_password(payload.password, user.password_hash):
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="Credenciales inválidas",
        )
    return issue_tokens(user, db)


@router.post("/refresh", response_model=LoginResponse)
def refresh_access_token(payload: RefreshTokenRequest, db: Session = Depends(get_db)):
    user = get_user_from_refresh_token(
        payload.refresh_token,
        db,
        clear_expired_session=True,
    )
    return issue_tokens(user, db)


@router.post("/logout")
def logout(
    payload: LogoutRequest,
    db: Session = Depends(get_db),
    current_user: User | None = Depends(get_current_user_optional),
):
    refresh_token = (payload.refresh_token or "").strip()

    if current_user and refresh_token:
        expected_hash = hash_refresh_token(refresh_token)
        if current_user.refresh_token_hash and current_user.refresh_token_hash != expected_hash:
            raise HTTPException(
                status_code=status.HTTP_401_UNAUTHORIZED,
                detail="Refresh token inválido",
            )
        revoke_refresh_session(current_user, db)
        return {"detail": "Sesión cerrada correctamente"}

    if current_user:
        revoke_refresh_session(current_user, db)
        return {"detail": "Sesión cerrada correctamente"}

    if refresh_token:
        user = get_user_from_refresh_token(
            refresh_token,
            db,
            clear_expired_session=True,
        )
        revoke_refresh_session(user, db)
        return {"detail": "Sesión cerrada correctamente"}

    raise HTTPException(
        status_code=status.HTTP_401_UNAUTHORIZED,
        detail="Se requiere una sesión válida para cerrar sesión",
    )


@router.get("/me", response_model=AuthMeResponse)
def auth_me(current_user: User = Depends(get_current_user)):
    return AuthMeResponse(
        id=current_user.id,
        username=current_user.username,
        role=current_user.role,
        is_active=current_user.is_active,
        preferred_lang=current_user.preferred_lang,
    )


@router.post("/change-password")
def change_password(
    payload: ChangePasswordRequest,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    if not verify_password(payload.current_password, current_user.password_hash):
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="La contraseña actual no es correcta",
        )
    if len(payload.new_password) < 8:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="La nueva contraseña debe tener al menos 8 caracteres",
        )
    if payload.new_password != payload.confirm_password:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="Las contraseñas no coinciden",
        )
    if payload.current_password == payload.new_password:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="La nueva contraseña no puede ser igual a la actual",
        )

    current_user.password_hash = hash_password(payload.new_password)
    current_user.refresh_token_hash = None
    current_user.refresh_token_expires_at = None
    db.add(current_user)
    db.commit()

    return {"detail": "Contraseña actualizada correctamente. Inicia sesión nuevamente."}
