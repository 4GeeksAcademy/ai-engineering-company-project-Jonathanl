from typing import Literal

from fastapi import APIRouter, Depends, HTTPException, Request, status
from fastapi.security import OAuth2PasswordRequestForm
from pydantic import BaseModel, EmailStr

from services.api.security import create_access_token, get_current_user, get_user_service, verify_password
from services.api.user_models import Profile, User, UserRole
from services.api.user_service import UserService


class AccessToken(BaseModel):
    access_token: str
    token_type: Literal["bearer"] = "bearer"


class AuthenticatedUser(BaseModel):
    email: EmailStr
    role: UserRole
    profile: Profile


router = APIRouter(prefix="/auth", tags=["auth"])


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