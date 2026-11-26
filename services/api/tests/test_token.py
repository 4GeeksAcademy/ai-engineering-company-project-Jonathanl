from datetime import datetime, timedelta, timezone
from types import SimpleNamespace
from uuid import uuid4

import pytest
from fastapi import HTTPException
from jose import jwt

from services.api.security import JWT_ALGORITHM, create_access_token, get_current_user, hash_password, verify_password
from services.api.user_models import User, UserRole


class UserServiceStub:
    def __init__(self, user):
        self.user = user
        self.requested_id = None

    def get_user_by_id(self, user_id):
        self.requested_id = user_id
        return self.user if self.user and self.user.id == user_id else None


def make_user(is_active=True):
    return User(
        id=uuid4(),
        email="person@example.com",
        hashed_password="hash",
        is_active=is_active,
        role=UserRole.USER,
        created_at=datetime.now(timezone.utc),
    )


def make_request(users):
    settings = SimpleNamespace(secret_key="unit-test-secret")
    return SimpleNamespace(app=SimpleNamespace(state=SimpleNamespace(settings=settings, user_service=users)))


def test_password_hash_verifies_original_and_rejects_wrong_password():
    hashed = hash_password("a-long-test-password")

    assert hashed != "a-long-test-password"
    assert verify_password("a-long-test-password", hashed)
    assert not verify_password("wrong-password", hashed)


def test_create_access_token_resolves_to_active_user():
    user = make_user()
    users = UserServiceStub(user)
    token = create_access_token(user.id, "unit-test-secret", 5)

    result = get_current_user(make_request(users), token)

    assert result.id == user.id
    assert users.requested_id == user.id


@pytest.mark.parametrize(
    "claims",
    [
        {"sub": "", "exp": datetime.now(timezone.utc) + timedelta(minutes=1)},
        {"sub": "not-a-uuid", "exp": datetime.now(timezone.utc) + timedelta(minutes=1)},
        {"sub": str(uuid4())},
        {"sub": str(uuid4()), "exp": datetime.now(timezone.utc) - timedelta(minutes=1)},
    ],
)
def test_current_user_rejects_invalid_or_expired_token_claims(claims):
    token = jwt.encode(claims, "unit-test-secret", algorithm=JWT_ALGORITHM)
    users = UserServiceStub(None)

    with pytest.raises(HTTPException) as error:
        get_current_user(make_request(users), token)

    assert error.value.status_code == 401


def test_current_user_rejects_wrong_signature_missing_user_and_inactive_user():
    active = make_user()
    inactive = make_user(is_active=False)
    active_token = create_access_token(active.id, "unit-test-secret", 5)
    inactive_token = create_access_token(inactive.id, "unit-test-secret", 5)

    with pytest.raises(HTTPException):
        get_current_user(make_request(UserServiceStub(active)), create_access_token(active.id, "wrong-secret", 5))
    with pytest.raises(HTTPException):
        get_current_user(make_request(UserServiceStub(None)), active_token)
    with pytest.raises(HTTPException):
        get_current_user(make_request(UserServiceStub(inactive)), inactive_token)


def test_verify_password_returns_false_for_malformed_hash():
    # Un hash corrupto debe tratarse como credencial inválida, no filtrar excepción.
    assert not verify_password("any-password", "not-a-valid-bcrypt-hash")
