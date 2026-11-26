import hashlib
import logging
import secrets
from datetime import datetime, timedelta, timezone
from typing import Literal

import httpx
from fastapi import APIRouter, Depends, HTTPException, Request, status
from fastapi.security import OAuth2PasswordRequestForm
from pydantic import BaseModel, EmailStr, Field

from services.api.security import create_access_token, get_current_user, get_user_service, hash_password, verify_password
from services.api.user_models import Profile, User, UserRole
from services.api.user_service import UserService


class AccessToken(BaseModel):
    access_token: str
    token_type: Literal["bearer"] = "bearer"


class AuthenticatedUser(BaseModel):
    email: EmailStr
    role: UserRole
    profile: Profile


class ForgotPasswordRequest(BaseModel):
    email: EmailStr


class ResetPasswordRequest(BaseModel):
    token: str
    new_password: str = Field(min_length=8, max_length=128)


class ChangePasswordRequest(BaseModel):
    current_password: str
    new_password: str = Field(min_length=8, max_length=128)


router = APIRouter(prefix="/auth", tags=["auth"])
logger = logging.getLogger(__name__)


@router.post("/login", response_model=AccessToken)
def login(
    request: Request,
    credentials: OAuth2PasswordRequestForm = Depends(),
    users: UserService = Depends(get_user_service),
):
    user = users.get_user_by_email(credentials.username)
    if user is None or not user.is_active or not verify_password(
        credentials.password,
        user.hashed_password if user else "",
    ):
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="Email o contraseña incorrectos.",
            headers={"WWW-Authenticate": "Bearer"},
        )

    settings = request.app.state.settings
    token = create_access_token(user.id, settings.secret_key, settings.access_token_expire_minutes)
    return AccessToken(access_token=token)


@router.get("/me", response_model=AuthenticatedUser)
def current_user_details(
    current_user: User = Depends(get_current_user),
    users: UserService = Depends(get_user_service),
):
    profile = users.get_profile(current_user.id)
    if profile is None:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Perfil no encontrado.")
    return AuthenticatedUser(email=current_user.email, role=current_user.role, profile=profile)


async def send_password_reset_email(api_key: str, sender: str, recipient: str, reset_url: str) -> None:
    async with httpx.AsyncClient(timeout=10) as client:
        response = await client.post(
            "https://api.resend.com/emails",
            headers={"Authorization": f"Bearer {api_key}", "Content-Type": "application/json"},
            json={
                "from": sender,
                "to": [recipient],
                "subject": "Restablece tu contraseña de Nexova",
                "text": (
                    "Hemos recibido una solicitud para restablecer tu contraseña. "
                    f"Abre este enlace en tu móvil o equipo: {reset_url}\n\n"
                    "El enlace caduca pronto y solo se puede usar una vez. "
                    "Si no solicitaste este cambio, ignora este correo."
                ),
            },
        )
        response.raise_for_status()


@router.post("/forgot-password", status_code=status.HTTP_200_OK)
async def forgot_password(
    payload: ForgotPasswordRequest,
    request: Request,
    users: UserService = Depends(get_user_service),
):
    user = users.get_user_by_email(str(payload.email))
    settings = request.app.state.settings
    if user is None or not user.is_active:
        logger.warning("Password reset email not sent: account not found or inactive.")
    elif not settings.resend_api_key:
        logger.warning("Password reset email not sent: RESEND_API_KEY is not configured.")
    else:
        token = secrets.token_urlsafe(32)
        token_hash = hashlib.sha256(token.encode()).hexdigest()
        expires_at = datetime.now(timezone.utc) + timedelta(minutes=settings.password_reset_expire_minutes)
        users.password_reset_tokens.create(token_hash, user.id, expires_at.isoformat())
        reset_url = f"{settings.frontend_base_url}/reset-password?token={token}"
        try:
            await send_password_reset_email(
                settings.resend_api_key,
                settings.resend_from_email,
                str(user.email),
                reset_url,
            )
            logger.warning("Password reset email accepted by Resend.")
        except httpx.HTTPStatusError as error:
            logger.error("Resend rejected password reset email (HTTP %s).", error.response.status_code)
            users.invalidate_password_reset_token(token_hash)
        except (httpx.RequestError, ValueError) as error:
            logger.error("Could not send password reset email (%s).", type(error).__name__)
            # Keep the public response indistinguishable even if delivery fails.
            users.invalidate_password_reset_token(token_hash)
    return {"message": "Si esa dirección está registrada, recibirás un enlace en breve."}


@router.post("/reset-password")
def reset_password(payload: ResetPasswordRequest, request: Request, users: UserService = Depends(get_user_service)):
    token_hash = hashlib.sha256(payload.token.encode()).hexdigest()
    now = datetime.now(timezone.utc).isoformat()
    if not users.reset_password(token_hash, now, hash_password(payload.new_password)):
        raise HTTPException(status_code=status.HTTP_400_BAD_REQUEST, detail="El enlace no es válido o ha caducado. Solicita uno nuevo.")
    return {"message": "La contraseña se ha actualizado correctamente."}


@router.post("/change-password")
def change_password(
    payload: ChangePasswordRequest,
    current_user: User = Depends(get_current_user),
    users: UserService = Depends(get_user_service),
):
    if not verify_password(payload.current_password, current_user.hashed_password):
        raise HTTPException(status_code=status.HTTP_400_BAD_REQUEST, detail="La contraseña actual es incorrecta.")
    users.update_password(current_user.id, hash_password(payload.new_password))
    return {"message": "La contraseña se ha actualizado correctamente."}