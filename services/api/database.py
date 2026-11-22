import os
from pathlib import Path
from threading import RLock

from tinydb import TinyDB
from sqlalchemy.orm import Session
from sqlalchemy import create_engine
from sqlmodel import SQLModel


class CompanyDatabase:
    def __init__(self, db_path: Path):
        self.db_path = Path(db_path)
        self.db_path.parent.mkdir(parents=True, exist_ok=True)
        self._db = TinyDB(self.db_path)
        self.lock = RLock()

    def table(self, name: str):
        return self._db.table(name)

    def close(self):
        self._db.close()


# SQLModel Engine para Supabase/PostgreSQL (Inventario)
def get_sqlmodel_engine():
    """Crea el motor SQLAlchemy/SQLModel para Supabase."""
    database_url = os.getenv("DATABASE_URL")
    if not database_url:
        raise ValueError(
            "DATABASE_URL no está configurada. Verifica tu archivo .env"
        )
    
    # Crear engine con configuración para Supabase
    engine = create_engine(
        database_url,
        echo=False,  # Cambiar a True para debug SQL
        pool_pre_ping=True,  # Verificar conexión antes de usar
    )
    return engine


# Instancia global del engine (inicializado en app startup)
_sqlmodel_engine = None


def initialize_sqlmodel_engine():
    """Inicializar el motor de SQLModel al startup de la app."""
    global _sqlmodel_engine
    if _sqlmodel_engine is None:
        _sqlmodel_engine = get_sqlmodel_engine()
        # Crear todas las tablas definidas en SQLModel
        SQLModel.metadata.create_all(_sqlmodel_engine)


def get_sqlmodel_engine_instance():
    """Retorna la instancia global del engine."""
    global _sqlmodel_engine
    if _sqlmodel_engine is None:
        initialize_sqlmodel_engine()
    return _sqlmodel_engine


def get_db_session() -> Session:
    """
    Dependencia para inyectar sesión SQLModel por request.
    Se usa con Depends(get_db_session) en los endpoints.
    """
    from sqlalchemy.orm import sessionmaker
    
    engine = get_sqlmodel_engine_instance()
    SessionLocal = sessionmaker(bind=engine, class_=Session, expire_on_commit=False)
    session = SessionLocal()
    try:
        yield session
    finally:
        session.close()