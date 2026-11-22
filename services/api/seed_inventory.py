"""Seed data for inventory (Asset, AssetEntry, AssetExit)."""

from datetime import datetime, timedelta, timezone
from uuid import UUID
from sqlmodel import Session, select, func

from services.api.models import Asset, AssetEntry, AssetExit


# UUID de demostración para el usuario que crea los registros
DEMO_USER_UUID = "00000000-0000-0000-0000-000000000001"


def seed_inventory(session: Session) -> None:
    """
    Inserta datos semilla de inventario en Supabase.
    Se ejecuta manualmente y solo si las tablas están vacías.
    """
    
    # Verificar si ya existen datos
    existing_assets = session.exec(select(Asset)).first()
    if existing_assets:
        print("✓ Datos de inventario ya existen. Saltando seed.")
        return
    
    print("🌱 Creando datos semilla de inventario...")
    
    # ========================================================================
    # 1. Crear Assets
    # ========================================================================
    
    assets_data = [
        {
            "name": 'Portátil 14" Business',
            "sku": "NXV-IT-001",
            "category": "hardware",
            "office": "Valencia",
        },
        {
            "name": 'Portátil 14" Business',
            "sku": "NXV-IT-002",
            "category": "hardware",
            "office": "Miami",
        },
        {
            "name": "Ratón ergonómico",
            "sku": "NXV-PER-001",
            "category": "peripherals",
            "office": "Valencia",
        },
        {
            "name": "Hub USB-C",
            "sku": "NXV-PER-002",
            "category": "peripherals",
            "office": "Miami",
        },
        {
            "name": "Resma de papel A4",
            "sku": "NXV-OFF-001",
            "category": "office_supplies",
            "office": "Valencia",
        },
        {
            "name": "Cuaderno de formación en liderazgo",
            "sku": "NXV-TRN-001",
            "category": "training_materials",
            "office": "Valencia",
        },
    ]
    
    assets = []
    for asset_data in assets_data:
        asset = Asset(**asset_data)
        session.add(asset)
        assets.append(asset)
    
    session.commit()
    
    # No usar refresh para evitar issue con Supabase pooler prepared statements
    # Los IDs se obtienen de session.exec(select(...)) después
    
    print(f"✓ {len(assets_data)} assets creados")
    
    # Obtener los assets creados desde la BD para tener IDs correctos
    assets = session.exec(select(Asset)).all()
    
    # ========================================================================
    # 2. Crear AssetEntries (Compras/Entregas)
    # ========================================================================
    
    base_date = datetime.now(timezone.utc) - timedelta(days=30)
    
    entries_data = [
        {
            "asset_id": assets[0].id,  # NXV-IT-001
            "quantity": 10,
            "supplier": "TechDistrib Valencia S.L.",
            "office": "Valencia",
            "created_at": base_date,
            "user_uuid": DEMO_USER_UUID,
        },
        {
            "asset_id": assets[0].id,  # NXV-IT-001
            "quantity": 5,
            "supplier": "TechDistrib Valencia S.L.",
            "office": "Valencia",
            "created_at": base_date + timedelta(days=5),
            "user_uuid": DEMO_USER_UUID,
        },
        {
            "asset_id": assets[1].id,  # NXV-IT-002
            "quantity": 8,
            "supplier": "Office Depot Miami",
            "office": "Miami",
            "created_at": base_date + timedelta(days=10),
            "user_uuid": DEMO_USER_UUID,
        },
        {
            "asset_id": assets[2].id,  # NXV-PER-001
            "quantity": 20,
            "supplier": "Periféricos Iberia",
            "office": "Valencia",
            "created_at": base_date + timedelta(days=15),
            "user_uuid": DEMO_USER_UUID,
        },
        {
            "asset_id": assets[4].id,  # NXV-OFF-001
            "quantity": 50,
            "supplier": "Papel Plus España",
            "office": "Valencia",
            "created_at": base_date + timedelta(days=20),
            "user_uuid": DEMO_USER_UUID,
        },
    ]
    
    entries = []
    for entry_data in entries_data:
        entry = AssetEntry(**entry_data)
        session.add(entry)
        entries.append(entry)
    
    session.commit()
    print(f"✓ {len(entries)} asset entries (inbound) creadas")
    
    # ========================================================================
    # 3. Crear AssetExits (Asignaciones/Consumos)
    # ========================================================================
    
    exits_data = [
        {
            "asset_id": assets[0].id,  # NXV-IT-001
            "quantity": 3,
            "exit_type": "allocation",
            "assigned_to": "Juan García",
            "office": "Valencia",
            "created_at": base_date + timedelta(days=25),
            "user_uuid": DEMO_USER_UUID,
        },
        {
            "asset_id": assets[0].id,  # NXV-IT-001
            "quantity": 3,
            "exit_type": "allocation",
            "assigned_to": "María López",
            "office": "Valencia",
            "created_at": base_date + timedelta(days=26),
            "user_uuid": DEMO_USER_UUID,
        },
        {
            "asset_id": assets[2].id,  # NXV-PER-001
            "quantity": 15,
            "exit_type": "consumption",
            "assigned_to": None,
            "office": "Valencia",
            "created_at": base_date + timedelta(days=27),
            "user_uuid": DEMO_USER_UUID,
        },
        {
            "asset_id": assets[4].id,  # NXV-OFF-001
            "quantity": 10,
            "exit_type": "consumption",
            "assigned_to": None,
            "office": "Valencia",
            "created_at": base_date + timedelta(days=28),
            "user_uuid": DEMO_USER_UUID,
        },
    ]
    
    exits = []
    for exit_data in exits_data:
        exit_record = AssetExit(**exit_data)
        session.add(exit_record)
        exits.append(exit_record)
    
    session.commit()
    print(f"✓ {len(exits)} asset exits (outbound) creadas")
    
    # ========================================================================
    # 4. Resumen de Stock
    # ========================================================================
    
    print("\n📊 Stock final después del seed:")
    for asset in assets:
        entries_sum = session.exec(
            select(func.sum(AssetEntry.quantity)).where(AssetEntry.asset_id == asset.id)
        ).first() or 0
        exits_sum = session.exec(
            select(func.sum(AssetExit.quantity)).where(AssetExit.asset_id == asset.id)
        ).first() or 0
        current_stock = entries_sum - exits_sum
        print(f"  {asset.sku}: {current_stock} unidades (entradas: {entries_sum}, salidas: {exits_sum})")
    
    print("\n✅ Seed completado!")
