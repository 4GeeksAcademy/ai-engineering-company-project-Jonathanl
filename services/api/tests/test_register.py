from datetime import datetime, timezone
from types import SimpleNamespace
from uuid import uuid4

import pytest
from fastapi import HTTPException

from services.api.database import CompanyDatabase
from services.api.user_models import Profile, User, UserCreate, UserRole
from services.api.user_service import UserService
from services.api.user_store import DuplicateEmailError
from services.api.users import register_user


class UserServiceStub:
    def __init__(self, result=None, error=None):
        self.result = result
        self.error = error
        self.created_with = None

    def create_user(self, user_data, hashed_password, role):
        self.created_with = (user_data, hashed_password, role)
        if self.error:
            raise self.error
        return self.result


def make_user_and_profile(email="person@example.com"):
    user_id = uuid4()
    user = User(
        id=user_id,
        email=email,
        hashed_password="stored-hash",
        is_active=True,
        role=UserRole.USER,
        created_at=datetime.now(timezone.utc),
    )
    profile = Profile(id=uuid4(), user_id=user_id, name="Person")
    return user, profile


def test_register_creates_regular_user_with_hashed_password(monkeypatch):
    user, profile = make_user_and_profile()
    users = UserServiceStub(result=(user, profile))
    monkeypatch.setattr("services.api.users.hash_password", lambda password: "hash:" + password)
    data = UserCreate(email="person@example.com", password="plain-secret", name="Person")

    created = register_user(data, users)

    assert created is user
    assert users.created_with == (data, "hash:plain-secret", UserRole.USER)


def test_register_duplicate_email_raises_conflict():
    users = UserServiceStub(error=DuplicateEmailError("duplicate"))
    data = UserCreate(email="person@example.com", password="plain-secret")

    with pytest.raises(HTTPException) as error:
        register_user(data, users)

    assert error.value.status_code == 409


def test_register_normalizes_email_and_rejects_duplicate_variant(tmp_path, monkeypatch):
    database = CompanyDatabase(tmp_path / "users.json")
    users = UserService(database)
    monkeypatch.setattr("services.api.users.hash_password", lambda password: "hash:" + password)
    try:
        first = register_user(
            UserCreate(email="Person@Example.com", password="first-secret"), users
        )

        assert first.email == "person@example.com"
        with pytest.raises(HTTPException) as error:
            register_user(
                UserCreate(email="PERSON@example.com", password="second-secret"), users
            )

        assert error.value.status_code == 409
        assert len(users.list_users()) == 1
    finally:
        database.close()
