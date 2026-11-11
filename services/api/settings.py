import os
from dataclasses import dataclass
from pathlib import Path

from dotenv import load_dotenv


ENV_FILE = Path(__file__).resolve().parents[2] / ".env"


@dataclass(frozen=True)
class Settings:
    secret_key: str
    access_token_expire_minutes: int
    resend_api_key: str | None
    resend_from_email: str
    frontend_base_url: str
    password_reset_expire_minutes: int


def load_settings() -> Settings:
    load_dotenv(ENV_FILE)

    secret_key = os.getenv("SECRET_KEY")
    if not secret_key:
        raise RuntimeError("SECRET_KEY must be set in the environment or .env file.")

    expiration_value = os.getenv("ACCESS_TOKEN_EXPIRE_MINUTES")
    if not expiration_value:
        raise RuntimeError("ACCESS_TOKEN_EXPIRE_MINUTES must be set in the environment or .env file.")
    try:
        expiration_minutes = int(expiration_value)
    except ValueError as error:
        raise RuntimeError("ACCESS_TOKEN_EXPIRE_MINUTES must be a positive integer.") from error
    if expiration_minutes <= 0:
        raise RuntimeError("ACCESS_TOKEN_EXPIRE_MINUTES must be a positive integer.")

    reset_expiration_value = os.getenv("PASSWORD_RESET_EXPIRE_MINUTES", "30")
    try:
        reset_expiration_minutes = int(reset_expiration_value)
    except ValueError as error:
        raise RuntimeError("PASSWORD_RESET_EXPIRE_MINUTES must be between 15 and 60.") from error
    if not 15 <= reset_expiration_minutes <= 60:
        raise RuntimeError("PASSWORD_RESET_EXPIRE_MINUTES must be between 15 and 60.")

    return Settings(
        secret_key=secret_key,
        access_token_expire_minutes=expiration_minutes,
        resend_api_key=os.getenv("RESEND_API_KEY"),
        resend_from_email=os.getenv("RESEND_FROM_EMAIL", "onboarding@resend.dev"),
        frontend_base_url=os.getenv("FRONTEND_BASE_URL", "http://localhost:3000").rstrip("/"),
        password_reset_expire_minutes=reset_expiration_minutes,
    )