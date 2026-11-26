from datetime import datetime, timezone
from types import SimpleNamespace
from uuid import uuid4

import pytest
from fastapi import HTTPException

from services.api.auth import current_user_details
from services.api.user_models import Profile, User, UserRole


class UserServiceStub:
    def __init__(self, profile):
        self.profile = profile

    def get_profile(self, user_id):
        return self.profile if self.profile and self.profile.user_id == user_id else None


def make_user():
    return User(
        id=uuid4(),
        email="person@example.com",
        hashed_password="hash",
        is_active=True,
        role=UserRole.USER,
        created_at=datetime.now(timezone.utc),
    )


def test_current_user_details_returns_profile_for_authenticated_user():
    user = make_user()
    profile = Profile(id=uuid4(), user_id=user.id, name="Person")

    result = current_user_details(user, UserServiceStub(profile))

    assert result.email == user.email
    assert result.role == UserRole.USER
    assert result.profile.name == "Person"


def test_current_user_details_fails_when_profile_is_missing():
    user = make_user()

    with pytest.raises(HTTPException) as error:
        current_user_details(user, UserServiceStub(None))

    assert error.value.status_code == 404
