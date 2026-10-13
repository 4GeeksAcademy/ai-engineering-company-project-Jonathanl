import pytest

from services.api import settings


def test_load_settings_reads_dotenv_file(tmp_path, monkeypatch):
    env_file = tmp_path / ".env"
    env_file.write_text("SECRET_KEY=test-secret\nACCESS_TOKEN_EXPIRE_MINUTES=45\n")
    monkeypatch.setattr(settings, "ENV_FILE", env_file)
    monkeypatch.delenv("SECRET_KEY", raising=False)
    monkeypatch.delenv("ACCESS_TOKEN_EXPIRE_MINUTES", raising=False)

    result = settings.load_settings()

    assert result.secret_key == "test-secret"
    assert result.access_token_expire_minutes == 45


@pytest.mark.parametrize(
    "environment",
    [
        {},
        {"SECRET_KEY": "test-secret"},
        {"ACCESS_TOKEN_EXPIRE_MINUTES": "45"},
        {"SECRET_KEY": "test-secret", "ACCESS_TOKEN_EXPIRE_MINUTES": "0"},
        {"SECRET_KEY": "test-secret", "ACCESS_TOKEN_EXPIRE_MINUTES": "invalid"},
    ],
)
def test_load_settings_rejects_missing_or_invalid_values(tmp_path, monkeypatch, environment):
    monkeypatch.setattr(settings, "ENV_FILE", tmp_path / "missing.env")
    monkeypatch.delenv("SECRET_KEY", raising=False)
    monkeypatch.delenv("ACCESS_TOKEN_EXPIRE_MINUTES", raising=False)
    for key, value in environment.items():
        monkeypatch.setenv(key, value)

    with pytest.raises(RuntimeError):
        settings.load_settings()