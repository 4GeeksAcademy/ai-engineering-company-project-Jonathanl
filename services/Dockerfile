FROM python:3.12-slim AS base

ENV PYTHONDONTWRITEBYTECODE=1 \
    PYTHONUNBUFFERED=1 \
    PYTHONPATH=/app \
    VIRTUAL_ENV=/opt/venv \
    PATH="/opt/venv/bin:$PATH"

WORKDIR /app/services
RUN pip install --no-cache-dir uv && uv venv /opt/venv
COPY requirements.txt ./requirements.txt
RUN uv pip install -r requirements.txt

FROM base AS dev
WORKDIR /app
COPY . /app/services
EXPOSE 8000
CMD ["uvicorn", "services.api.app:app", "--host", "0.0.0.0", "--port", "8000", "--reload", "--reload-dir", "/app/services", "--reload-dir", "/app/packages", "--reload-dir", "/app/scripts"]

FROM base AS prod
WORKDIR /app
RUN useradd --create-home --shell /bin/sh appuser \
    && mkdir -p /app/data/runtime /app/scripts /app/packages \
    && chown -R appuser:appuser /app
COPY --chown=appuser:appuser . /app/services
RUN chown -R appuser:appuser /app
USER appuser
EXPOSE 8000
# One worker is intentional: TinyDB uses an in-process lock.
CMD ["uvicorn", "services.api.app:app", "--host", "0.0.0.0", "--port", "8000", "--workers", "1"]

# A plain `docker build` defaults to reload-enabled development.
FROM dev AS default