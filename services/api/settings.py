import os
from dataclasses import dataclass
from pathlib import Path

from dotenv import load_dotenv


ENV_FILE = Path(__file__).resolve().parents[2] / ".env"


@dataclass(frozen=True)
class Settings:
    secret_key: str
    access_token_expire_minutes: int


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

    return Settings(
        secret_key=secret_key,
        access_token_expire_minutes=expiration_minutes,
    )