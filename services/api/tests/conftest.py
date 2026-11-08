import pytest


@pytest.fixture(autouse=True)
def auth_environment(monkeypatch):
    monkeypatch.setenv("SECRET_KEY", "test-auth-secret-key-for-api-suite")
    monkeypatch.setenv("ACCESS_TOKEN_EXPIRE_MINUTES", "5")