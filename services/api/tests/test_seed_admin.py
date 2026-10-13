import pytest

from services.api.database import CompanyDatabase
from services.api.seed_admin import AdminBootstrapError, bootstrap_admin, main
from services.api.security import verify_password
from services.api.user_models import UserCreate, UserRole
from services.api.user_service import UserService


def test_bootstrap_creates_admin_with_hashed_password_and_profile(tmp_path):
    database_path = tmp_path / "runtime" / "auth.json"

    admin, created = bootstrap_admin(database_path, "admin@example.com", "secure-password")

    database = CompanyDatabase(database_path)
    try:
        user_service = UserService(database)
        stored_admin = user_service.get_user_by_id(admin.id)
        profile = user_service.get_profile(admin.id)
        stored_json = database_path.read_text()
    finally:
        database.close()

    assert created is True
    assert stored_admin is not None
    assert stored_admin.role == UserRole.ADMIN
    assert stored_admin.is_active is True
    assert stored_admin.hashed_password != "secure-password"
    assert verify_password("secure-password", stored_admin.hashed_password)
    assert profile is not None
    assert "secure-password" not in stored_json


def test_bootstrap_is_idempotent_without_replacing_password(tmp_path):
    database_path = tmp_path / "runtime" / "auth.json"

    first_admin, first_created = bootstrap_admin(database_path, "admin@example.com", "secure-password")
    second_admin, second_created = bootstrap_admin(database_path, "admin@example.com", "secure-password")

    assert first_created is True
    assert second_created is False
    assert second_admin.id == first_admin.id
    assert second_admin.hashed_password == first_admin.hashed_password


def test_bootstrap_does_not_promote_existing_user(tmp_path):
    database_path = tmp_path / "runtime" / "auth.json"
    database = CompanyDatabase(database_path)
    try:
        UserService(database).create_user(
            UserCreate(email="existing@example.com", password="user-password"),
            "already-hashed",
        )
    finally:
        database.close()

    with pytest.raises(AdminBootstrapError, match="no coincide"):
        bootstrap_admin(database_path, "existing@example.com", "user-password")


def test_bootstrap_requires_credentials(tmp_path):
    with pytest.raises(AdminBootstrapError, match="obligatorios"):
        bootstrap_admin(tmp_path / "runtime" / "auth.json", "", "")


def test_seed_admin_cli_reads_environment_and_is_repeatable(tmp_path, monkeypatch, capsys):
    database_path = tmp_path / "runtime" / "auth.json"
    monkeypatch.setattr("services.api.seed_admin.DATABASE_PATH", database_path)
    monkeypatch.setenv("BOOTSTRAP_ADMIN_EMAIL", "admin@example.com")
    monkeypatch.setenv("BOOTSTRAP_ADMIN_PASSWORD", "secure-password")

    main()
    first_output = capsys.readouterr().out
    main()
    second_output = capsys.readouterr().out

    assert "creado" in first_output
    assert "ya estaba creado" in second_output
    assert "secure-password" not in first_output + second_output