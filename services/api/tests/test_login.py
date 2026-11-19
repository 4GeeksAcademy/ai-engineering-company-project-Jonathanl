from datetime import datetime, timezone
from types import SimpleNamespace
from uuid import uuid4

import pytest
from fastapi import HTTPException

from services.api.auth import login
from services.api.user_models import User, UserRole


class UserServiceStub:
    def __init__(self, user):
        self.user = user
        self.lookups = []

    def get_user_by_email(self, email):
        self.lookups.append(email)
        return self.user


def make_user(is_active=True):
    return User(
        id=uuid4(),
        email="person@example.com",
        hashed_password="hash",
        is_active=is_active,
        role=UserRole.USER,
        created_at=datetime.now(timezone.utc),
    )


def make_request():
    return SimpleNamespace(app=SimpleNamespace(state=SimpleNamespace(settings=SimpleNamespace(
        secret_key="test-secret", access_token_expire_minutes=10
    ))))


def test_login_active_user_returns_token_for_user(monkeypatch):
    user = make_user()
    users = UserServiceStub(user)
    monkeypatch.setattr("services.api.auth.verify_password", lambda password, hashed: password == "correct")
    monkeypatch.setattr("services.api.auth.create_access_token", lambda user_id, key, expiry: f"token:{user_id}")
    credentials = SimpleNamespace(username="person@example.com", password="correct")

    result = login(make_request(), credentials, users)

    assert result.access_token == f"token:{user.id}"
    assert users.lookups == ["person@example.com"]


@pytest.mark.parametrize(
    ("user", "password"),
    [(None, "correct"), (make_user(is_active=False), "correct"), (make_user(), "wrong")],
)
def test_login_rejects_unknown_inactive_or_wrong_password(user, password, monkeypatch):
    users = UserServiceStub(user)
    monkeypatch.setattr("services.api.auth.verify_password", lambda candidate, hashed: candidate == "correct")
    credentials = SimpleNamespace(username="person@example.com", password=password)

    with pytest.raises(HTTPException) as error:
        login(make_request(), credentials, users)

    assert error.value.status_code == 401
