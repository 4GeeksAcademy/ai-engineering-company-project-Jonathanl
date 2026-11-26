"""Script para ejecutar seed de inventario."""

import sys
from pathlib import Path

# Agregar proyecto al path
sys.path.insert(0, str(Path(__file__).parent.parent.parent))

from dotenv import load_dotenv
load_dotenv()

from sqlmodel import Session
from services.api.database import get_sqlmodel_engine_instance
from services.api.seed_inventory import seed_inventory


def main():
    """Ejecuta el seed de inventario."""
    try:
        engine = get_sqlmodel_engine_instance()
        with Session(engine) as session:
            seed_inventory(session)
        print("\n✅ Seed ejecutado exitosamente")
        return 0
    except Exception as e:
        print(f"\n❌ Error al ejecutar seed: {e}", file=sys.stderr)
        import traceback
        traceback.print_exc()
        return 1


if __name__ == "__main__":
    sys.exit(main())
