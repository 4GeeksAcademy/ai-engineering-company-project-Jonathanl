#!/usr/bin/env python3
"""Test script para verificar conexión a Supabase y creación de tablas."""

import os
import sys
import logging
from pathlib import Path
from sqlalchemy import text

# Agregar proyecto al path
sys.path.insert(0, str(Path(__file__).parent))

logging.basicConfig(level=logging.INFO)
logger = logging.getLogger(__name__)

# Cargar .env
from dotenv import load_dotenv
load_dotenv()

def test_connection():
    """Prueba la conexión a Supabase y verifica que el motor se inicializa."""
    try:
        from services.api.database import initialize_sqlmodel_engine, get_sqlmodel_engine_instance
        
        logger.info("🔄 Inicializando SQLModel engine...")
        initialize_sqlmodel_engine()
        
        logger.info("✅ Engine inicializado correctamente")
        
        engine = get_sqlmodel_engine_instance()
        logger.info(f"📊 URL: {engine.url}")
        
        # Intentar una conexión de prueba
        with engine.connect() as conn:
            result = conn.execute(text("SELECT 1 as test"))
            test_result = result.fetchone()
            logger.info(f"✅ Conexión a Supabase exitosa: {test_result}")
        
        logger.info("🎉 TODO FUNCIONA - Listo para FASE 2")
        return True
        
    except Exception as e:
        logger.error(f"❌ Error: {e}", exc_info=True)
        return False

if __name__ == "__main__":
    success = test_connection()
    sys.exit(0 if success else 1)
