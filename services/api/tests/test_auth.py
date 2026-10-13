from datetime import datetime, timedelta, timezone

import pytest
from fastapi.testclient import TestClient
from jose import jwt
from tinydb import Query

from services.api.app import create_app
from services.api.security import JWT_ALGORITHM, hash_password
from services.api.user_models import UserCreate, UserRole, UserUpdate
from services.api.user_service import LastActiveAdminError


@pytest.fixture
def client_and_app(tmp_path):
    app = create_app(tmp_path / "runtime" / "auth.json")
    with TestClient(app) as client:
        yield client, app


def register(client, email="user@example.com", password="correct-password", **profile):
    return client.post(
        "/users",
        json={"email": email, "password": password, **profile},
    )


def login(client, email="user@example.com", password="correct-password"):
    return client.post("/auth/login", data={"username": email, "password": password})


def register_admin(app, email="admin@example.com", password="admin-password"):
    return app.state.user_service.create_user(
        UserCreate(email=email, password=password),
        hash_password(password),
        role=UserRole.ADMIN,
    )


def auth_headers(client, email="user@example.com", password="correct-password"):
    response = login(client, email, password)
    return {"Authorization": f"Bearer {response.json()['access_token']}"}


def test_register_login_and_current_user_include_profile(client_and_app):
    client, _ = client_and_app
    response = register(client, name="Patricia", phone="123", address="Valencia")

    assert response.status_code == 201
    assert "hashed_password" not in response.json()
    assert "password" not in response.json()

    token_response = login(client)
    assert token_response.status_code == 200
    assert token_response.json()["token_type"] == "bearer"

    headers = {"Authorization": f"Bearer {token_response.json()['access_token']}"}
    current = client.get("/auth/me", headers=headers)
    assert current.status_code == 200
    assert current.json()["email"] == "user@example.com"
    assert current.json()["profile"]["name"] == "Patricia"
    assert "hashed_password" not in current.text


def test_register_rejects_role_injection_and_duplicate_email(client_and_app):
    client, _ = client_and_app

    assert register(client, role="admin").status_code == 422
    assert register(client).status_code == 201
    assert register(client, email="USER@example.com").status_code == 409


def test_login_rejects_invalid_credentials(client_and_app):
    client, _ = client_and_app
    register(client)

    assert login(client, password="wrong-password").status_code == 401
    assert login(client, email="missing@example.com").status_code == 401


@pytest.mark.parametrize(
    ("method", "path", "kwargs"),
    [
        ("get", "/api/suppliers", {}),
        ("post", "/api/suppliers", {"json": {}}),
        ("get", "/api/suppliers/00000000-0000-0000-0000-000000000000", {}),
        ("patch", "/api/suppliers/00000000-0000-0000-0000-000000000000", {"json": {}}),
        ("post", "/api/incidents/analyze", {}),
        ("get", "/api/incidents/results/export", {}),
        ("get", "/auth/me", {}),
        ("get", "/users", {}),
        ("get", "/users/00000000-0000-0000-0000-000000000000", {}),
        ("put", "/users/00000000-0000-0000-0000-000000000000", {"json": {"email": "new@example.com"}}),
        ("delete", "/users/00000000-0000-0000-0000-000000000000", {}),
        ("get", "/profiles/me", {}),
        ("put", "/profiles/me", {"json": {"name": "Updated"}}),
    ],
)
def test_protected_routes_require_a_token(client_and_app, method, path, kwargs):
    client, _ = client_and_app

    response = getattr(client, method)(path, **kwargs)

    assert response.status_code == 401
    assert response.headers["www-authenticate"] == "Bearer"


def test_invalid_expired_and_inactive_user_tokens_return_401(client_and_app):
    client, app = client_and_app
    user, _ = register_admin(app, email="user@example.com")
    secret = app.state.settings.secret_key
    active_token = jwt.encode(
        {"sub": str(user.id), "exp": datetime.now(timezone.utc) + timedelta(minutes=1)},
        secret,
        algorithm=JWT_ALGORITHM,
    )
    expired = jwt.encode(
        {"sub": str(user.id), "exp": datetime.now(timezone.utc) - timedelta(minutes=1)},
        secret,
        algorithm=JWT_ALGORITHM,
    )

    assert client.get("/auth/me", headers={"Authorization": "Bearer malformed"}).status_code == 401
    assert client.get("/auth/me", headers={"Authorization": f"Bearer {expired}"}).status_code == 401

    app.state.database.table("users").update({"is_active": False}, Query().id == str(user.id))
    assert client.get("/auth/me", headers={"Authorization": f"Bearer {active_token}"}).status_code == 401
    token = login(client, email="user@example.com", password="admin-password")
    assert token.status_code == 401


def test_token_for_deleted_user_returns_401(client_and_app):
    client, app = client_and_app
    register(client)
    token = login(client).json()["access_token"]
    user = app.state.user_service.get_user_by_email("user@example.com")
    app.state.database.table("users").remove(Query().id == str(user.id))

    response = client.get("/auth/me", headers={"Authorization": f"Bearer {token}"})

    assert response.status_code == 401


def test_docs_and_static_pages_remain_public(client_and_app):
    client, _ = client_and_app

    assert client.get("/docs").status_code == 200
    assert client.get("/").status_code == 200
    assert client.get("/uis/backoffice/").status_code == 200


def test_profile_owner_can_update_own_profile(client_and_app):
    client, _ = client_and_app
    register(client)
    headers = auth_headers(client)

    response = client.put("/profiles/me", json={"name": "Updated Name"}, headers=headers)

    assert response.status_code == 200
    assert response.json()["name"] == "Updated Name"


def test_user_access_and_update_permissions(client_and_app):
    client, _ = client_and_app
    own = register(client).json()
    other = register(client, email="other@example.com").json()
    headers = auth_headers(client)

    assert client.get("/users", headers=headers).status_code == 403
    assert client.get(f"/users/{own['id']}", headers=headers).status_code == 200
    assert client.get(f"/users/{other['id']}", headers=headers).status_code == 403
    assert client.put(f"/users/{own['id']}", json={"email": "new@example.com"}, headers=headers).status_code == 200
    assert client.put(f"/users/{own['id']}", json={"role": "admin"}, headers=headers).status_code == 403
    assert client.delete(f"/users/{own['id']}", headers=headers).status_code == 403


def test_admin_can_list_update_and_delete_users_but_not_last_admin(client_and_app):
    client, app = client_and_app
    admin, _ = register_admin(app)
    user_response = register(client)
    user_id = user_response.json()["id"]
    headers = auth_headers(client, email="admin@example.com", password="admin-password")

    listing = client.get("/users", headers=headers)
    assert listing.status_code == 200
    assert all("hashed_password" not in user for user in listing.json())
    assert client.put(f"/users/{user_id}", json={"role": "manager"}, headers=headers).status_code == 200
    assert client.delete(f"/users/{user_id}", headers=headers).status_code == 204
    assert client.delete(f"/users/{admin.id}", headers=headers).status_code == 409
    assert client.put(f"/users/{admin.id}", json={"role": "user"}, headers=headers).status_code == 409
    with pytest.raises(LastActiveAdminError):
        app.state.user_service.update_user(admin.id, UserUpdate(role="user"))