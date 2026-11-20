from datetime import datetime, timezone
from uuid import uuid4

import pytest
from fastapi import HTTPException

from services.api.database import CompanyDatabase
from services.api.user_models import User, UserCreate, UserRole, UserUpdate
from services.api.user_service import UserService
from services.api.users import delete_user, get_user, list_users, update_user


@pytest.fixture
def users(tmp_path):
    database = CompanyDatabase(tmp_path / "runtime" / "users.json")
    try:
        yield UserService(database)
    finally:
        database.close()


def create_user(users, email="person@example.com", role=UserRole.USER, active=True):
    return users.create_user(
        UserCreate(email=email, password="password"),
        "hashed-password",
        role=role,
        is_active=active,
    )[0]


def test_list_users_returns_service_users_and_requires_route_admin(users):
    first = create_user(users)
    second = create_user(users, email="second@example.com")

    assert list_users(users=users, _admin=first) == [first, second]


def test_get_user_allows_owner_and_admin_but_hides_missing_and_other_user(users):
    owner = create_user(users)
    admin = create_user(users, email="admin@example.com", role=UserRole.ADMIN)
    stranger = create_user(users, email="stranger@example.com")

    assert get_user(owner.id, current_user=owner, users=users) == owner
    assert get_user(owner.id, current_user=admin, users=users) == owner

    with pytest.raises(HTTPException) as forbidden:
        get_user(owner.id, current_user=stranger, users=users)
    assert forbidden.value.status_code == 403

    with pytest.raises(HTTPException) as missing:
        get_user(uuid4(), current_user=owner, users=users)
    assert missing.value.status_code == 404


def test_update_user_enforces_ownership_admin_role_and_domain_conflicts(users):
    owner = create_user(users)
    other = create_user(users, email="other@example.com")
    admin = create_user(users, email="admin@example.com", role=UserRole.ADMIN)

    with pytest.raises(HTTPException) as forbidden_other:
        update_user(other.id, UserUpdate(email="changed@example.com"), current_user=owner, users=users)
    assert forbidden_other.value.status_code == 403

    with pytest.raises(HTTPException) as forbidden_role:
        update_user(owner.id, UserUpdate(role=UserRole.ADMIN), current_user=owner, users=users)
    assert forbidden_role.value.status_code == 403

    assert update_user(owner.id, UserUpdate(email="changed@example.com"), current_user=owner, users=users).email == "changed@example.com"
    assert update_user(other.id, UserUpdate(role=UserRole.MANAGER), current_user=admin, users=users).role == UserRole.MANAGER

    with pytest.raises(HTTPException) as duplicate:
        update_user(owner.id, UserUpdate(email="admin@example.com"), current_user=owner, users=users)
    assert duplicate.value.status_code == 409

    with pytest.raises(HTTPException) as missing:
        update_user(uuid4(), UserUpdate(email="new@example.com"), current_user=admin, users=users)
    assert missing.value.status_code == 404


def test_update_user_maps_last_active_admin_conflict(users):
    admin = create_user(users, email="admin@example.com", role=UserRole.ADMIN)

    with pytest.raises(HTTPException) as conflict:
        update_user(admin.id, UserUpdate(role=UserRole.USER), current_user=admin, users=users)

    assert conflict.value.status_code == 409


def test_delete_user_maps_missing_and_last_admin_and_deletes_regular_user(users):
    admin = create_user(users, email="admin@example.com", role=UserRole.ADMIN)
    regular = create_user(users)

    with pytest.raises(HTTPException) as last_admin:
        delete_user(admin.id, users=users, _admin=admin)
    assert last_admin.value.status_code == 409

    with pytest.raises(HTTPException) as missing:
        delete_user(uuid4(), users=users, _admin=admin)
    assert missing.value.status_code == 404

    delete_user(regular.id, users=users, _admin=admin)
    assert users.get_user_by_id(regular.id) is None
    assert users.get_profile(regular.id) is None
