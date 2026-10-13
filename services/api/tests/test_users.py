import pytest
from pydantic import ValidationError
from uuid import uuid4

from services.api.database import CompanyDatabase
from services.api.user_models import Profile, ProfileUpdate, User, UserCreate, UserPublic, UserRole, UserUpdate
from services.api.user_service import UserService
from services.api.user_store import DuplicateEmailError, DuplicateProfileError


@pytest.fixture
def user_service(tmp_path):
    database = CompanyDatabase(tmp_path / "runtime" / "users.json")
    try:
        yield UserService(database), database
    finally:
        database.close()


def registration(email="patricia@example.com", **profile):
    return UserCreate(email=email, password="raw-password", **profile)


def create_user(service, email="patricia@example.com", **profile):
    return service.create_user(registration(email, **profile), "$2b$12$test-hash")


def test_create_user_persists_hash_and_linked_profile(user_service):
    service, database = user_service

    user, profile = create_user(
        service,
        name="Patricia Solis",
        phone="+34 600 000 000",
        address="Valencia",
    )

    stored_data = database.db_path.read_text()
    assert user.email == "patricia@example.com"
    assert user.role == UserRole.USER
    assert user.is_active is True
    assert profile.user_id == user.id
    assert service.get_user_by_id(user.id) == user
    assert service.get_user_by_email("PATRICIA@example.com") == user
    assert service.get_profile(user.id) == profile
    assert "raw-password" not in stored_data
    assert "$2b$12$test-hash" in stored_data


def test_profile_is_created_when_optional_fields_are_omitted(user_service):
    service, _ = user_service

    user, profile = create_user(service)

    assert service.get_profile(user.id) == profile
    assert profile.name is None
    assert profile.phone is None
    assert profile.address is None


def test_profile_store_enforces_one_profile_per_user(user_service):
    service, _ = user_service
    user, profile = create_user(service)

    with pytest.raises(DuplicateProfileError):
        service.profiles.create(Profile(id=uuid4(), user_id=user.id, name="Second profile"))

    assert service.get_profile(user.id) == profile


def test_duplicate_email_is_case_insensitive_and_not_written(user_service):
    service, _ = user_service
    create_user(service)

    with pytest.raises(DuplicateEmailError):
        create_user(service, email="PATRICIA@example.com")

    assert len(service.list_users()) == 1


def test_update_user_and_profile(user_service):
    service, _ = user_service
    user, _ = create_user(service)

    updated_user = service.update_user(user.id, UserUpdate(email="new@example.com", role="manager"))
    updated_profile = service.update_profile(user.id, ProfileUpdate(name="Patricia", phone=None))

    assert updated_user is not None
    assert updated_user.email == "new@example.com"
    assert updated_user.role == UserRole.MANAGER
    assert updated_profile is not None
    assert updated_profile.name == "Patricia"
    assert updated_profile.phone is None


def test_update_rejects_duplicate_email_and_empty_changes(user_service):
    service, _ = user_service
    first, _ = create_user(service)
    create_user(service, email="other@example.com")

    with pytest.raises(DuplicateEmailError):
        service.update_user(first.id, UserUpdate(email="OTHER@example.com"))
    with pytest.raises(ValidationError):
        UserUpdate.model_validate({})
    with pytest.raises(ValidationError):
        ProfileUpdate.model_validate({})


def test_create_rolls_back_user_when_profile_write_fails(user_service, monkeypatch):
    service, _ = user_service
    insert_profile = service.profiles.create
    profile_user_ids = []

    def insert_then_fail(profile):
        profile_user_ids.append(profile.user_id)
        insert_profile(profile)
        raise RuntimeError("write failed")

    monkeypatch.setattr(service.profiles, "create", insert_then_fail)

    with pytest.raises(RuntimeError, match="write failed"):
        create_user(service)

    assert service.list_users() == []
    assert service.get_profile(profile_user_ids[0]) is None


def test_delete_user_also_deletes_profile(user_service):
    service, _ = user_service
    user, _ = create_user(service)

    deleted = service.delete_user(user.id)

    assert deleted == user
    assert service.get_user_by_id(user.id) is None
    assert service.get_profile(user.id) is None


def test_user_role_is_limited_and_public_model_excludes_hash(user_service):
    service, _ = user_service
    user, _ = create_user(service)

    with pytest.raises(ValidationError):
        User.model_validate(
            {
                **user.model_dump(),
                "role": "owner",
            }
        )

    public_user = UserPublic.model_validate(user.model_dump(exclude={"hashed_password"}))
    assert "hashed_password" not in public_user.model_dump()
    with pytest.raises(ValidationError):
        UserCreate.model_validate(
            {
                "email": "another@example.com",
                "password": "raw-password",
                "role": "admin",
            }
        )