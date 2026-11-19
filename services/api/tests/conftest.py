import sys
from pathlib import Path

import pytest

ROOT = Path(__file__).resolve().parents[3]
if str(ROOT) not in sys.path:
    sys.path.insert(0, str(ROOT))


@pytest.fixture(autouse=True)
def auth_environment(monkeypatch):
    monkeypatch.setenv("SECRET_KEY", "test-auth-secret-key-for-api-suite")
    monkeypatch.setenv("ACCESS_TOKEN_EXPIRE_MINUTES", "5")