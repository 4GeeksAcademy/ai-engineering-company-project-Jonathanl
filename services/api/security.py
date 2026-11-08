from datetime import datetime, timedelta, timezone
from uuid import UUID

from fastapi import Depends, HTTPException, Request, status
from fastapi.security import OAuth2PasswordBearer
from jose import JWTError, jwt
from passlib.hash import bcrypt

from services.api.user_models import User, UserRole
from services.api.user_service import UserService


JWT_ALGORITHM = "HS256"
oauth2_scheme = OAuth2PasswordBearer(tokenUrl="/auth/login")


def get_user_service(request: Request) -> UserService:
    return request.app.state.user_service


def hash_password(password: str) -> str:
    return bcrypt.hash(password)


def verify_password(password: str, hashed_password: str) -> bool:
    try:
        return bcrypt.verify(password, hashed_password)
    except (TypeError, ValueError):
        return False


def create_access_token(user_id: UUID, secret_key: str, expires_minutes: int) -> str:
    expires_at = datetime.now(timezone.utc) + timedelta(minutes=expires_minutes)
    return jwt.encode(
        {"sub": str(user_id), "exp": expires_at},
        secret_key,
        algorithm=JWT_ALGORITHM,
    )


def get_current_user(
    request: Request,
    token: str = Depends(oauth2_scheme),
) -> User:
    settings = request.app.state.settings
    unauthorized = HTTPException(
        status_code=status.HTTP_401_UNAUTHORIZED,
        detail="Credenciales de autenticación inválidas.",
        headers={"WWW-Authenticate": "Bearer"},
    )
    try:
        payload = jwt.decode(token, settings.secret_key, algorithms=[JWT_ALGORITHM])
        subject = payload.get("sub")
        if not isinstance(subject, str) or not subject or "exp" not in payload:
            raise JWTError("Token claims are incomplete.")
        user_id = UUID(subject)
    except (JWTError, TypeError, ValueError):
        raise unauthorized

    user = request.app.state.user_service.get_user_by_id(user_id)
    if user is None or not user.is_active:
        raise unauthorized
    return user


def require_admin(user: User = Depends(get_current_user)) -> User:
    if user.role != UserRole.ADMIN:
        raise HTTPException(status_code=status.HTTP_403_FORBIDDEN, detail="Se requiere rol admin.")
    return user