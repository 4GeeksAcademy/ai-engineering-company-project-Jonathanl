import os
from pathlib import Path

from dotenv import load_dotenv
from pydantic import ValidationError

from services.api.database import CompanyDatabase
from services.api.security import hash_password, verify_password
from services.api.settings import ENV_FILE
from services.api.user_models import User, UserCreate, UserRole
from services.api.user_service import UserService
from services.api.user_store import DuplicateEmailError


ROOT = Path(__file__).resolve().parents[2]
DATABASE_PATH = ROOT / "data" / "runtime" / "suppliers.json"


class AdminBootstrapError(ValueError):
    pass


def bootstrap_admin(db_path: Path, email: str, password: str) -> tuple[User, bool]:
    if not email.strip() or not password:
        raise AdminBootstrapError("BOOTSTRAP_ADMIN_EMAIL y BOOTSTRAP_ADMIN_PASSWORD son obligatorios.")
    try:
        user_data = UserCreate(email=email, password=password)
    except ValidationError as error:
        raise AdminBootstrapError("El email o la contraseña del admin no son válidos.") from error

    database = CompanyDatabase(db_path)
    try:
        users = UserService(database)
        existing = users.get_user_by_email(str(user_data.email))
        if existing is not None:
            if (
                existing.role == UserRole.ADMIN
                and existing.is_active
                and verify_password(password, existing.hashed_password)
            ):
                return existing, False
            raise AdminBootstrapError("El email ya existe y no coincide con un admin activo.")

        try:
            user, _ = users.create_user(user_data, hash_password(password), role=UserRole.ADMIN)
        except DuplicateEmailError as error:
            raise AdminBootstrapError("Ya existe un usuario con ese email.") from error
        return user, True
    finally:
        database.close()


def main():
    load_dotenv(ENV_FILE)
    email = os.getenv("BOOTSTRAP_ADMIN_EMAIL", "")
    password = os.getenv("BOOTSTRAP_ADMIN_PASSWORD", "")
    try:
        _, created = bootstrap_admin(DATABASE_PATH, email, password)
    except AdminBootstrapError as error:
        raise SystemExit(str(error)) from error

    if created:
        print("Admin inicial creado.")
    else:
        print("El admin inicial ya estaba creado; no se realizaron cambios.")