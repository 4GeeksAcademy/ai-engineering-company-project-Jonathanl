"""Router para gestión de inventario - endpoints bajo /inventory."""

from datetime import datetime, timezone
from uuid import UUID

from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy.orm import Session
from sqlmodel import select, func

from services.api.database import get_db_session
from services.api.models import Asset, AssetEntry, AssetExit
from services.api.schemas_inventory import (
    AssetRequest, AssetResponse,
    AssetEntryRequest, AssetEntryResponse,
    AssetExitRequest, AssetExitResponse,
    OrderResponse,
)
from services.api.security import get_current_user
from services.api.user_models import User


router = APIRouter(prefix="/inventory", tags=["inventory"])


# ============================================================================
# Funciones auxiliares
# ============================================================================

def calculate_current_stock(session: Session, asset_id: int) -> int:
    """Calcula el stock actual de un activo como SUM(entries) - SUM(exits)."""
    # Suma de entradas
    entries_sum = session.exec(
        select(func.sum(AssetEntry.quantity)).where(AssetEntry.asset_id == asset_id)
    ).first() or 0
    
    # Suma de salidas
    exits_sum = session.exec(
        select(func.sum(AssetExit.quantity)).where(AssetExit.asset_id == asset_id)
    ).first() or 0
    
    return entries_sum - exits_sum


def asset_to_response(session: Session, asset: Asset) -> AssetResponse:
    """Convierte un modelo Asset a AssetResponse con stock calculado."""
    current_stock = calculate_current_stock(session, asset.id)
    return AssetResponse(
        id=asset.id,
        name=asset.name,
        sku=asset.sku,
        category=asset.category,
        office=asset.office,
        current_stock=current_stock,
    )


# ============================================================================
# GET /inventory/products
# ============================================================================

@router.get("/products", response_model=list[AssetResponse])
def list_assets(
    session: Session = Depends(get_db_session),
    current_user: User = Depends(get_current_user),
):
    """Lista todos los activos con stock actual calculado."""
    assets = session.exec(select(Asset)).all()
    return [asset_to_response(session, asset) for asset in assets]


# ============================================================================
# POST /inventory/products
# ============================================================================

@router.post("/products", response_model=AssetResponse, status_code=status.HTTP_201_CREATED)
def create_asset(
    asset_request: AssetRequest,
    session: Session = Depends(get_db_session),
    current_user: User = Depends(get_current_user),
):
    """Registra un nuevo activo."""
    # Verificar que el SKU no exista
    existing = session.exec(select(Asset).where(Asset.sku == asset_request.sku)).first()
    if existing:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail=f"El SKU '{asset_request.sku}' ya existe."
        )
    
    asset = Asset(**asset_request.dict())
    session.add(asset)
    session.commit()
    session.refresh(asset)
    
    return asset_to_response(session, asset)


# ============================================================================
# GET /inventory/products/{id}
# ============================================================================

@router.get("/products/{asset_id}", response_model=AssetResponse)
def get_asset(
    asset_id: int,
    session: Session = Depends(get_db_session),
    current_user: User = Depends(get_current_user),
):
    """Obtiene un activo específico con su stock actual."""
    asset = session.exec(select(Asset).where(Asset.id == asset_id)).first()
    if not asset:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail=f"Activo con ID {asset_id} no encontrado."
        )
    
    return asset_to_response(session, asset)


# ============================================================================
# POST /inventory/orders/inbound
# ============================================================================

@router.post("/orders/inbound", response_model=AssetEntryResponse, status_code=status.HTTP_201_CREATED)
def create_asset_entry(
    entry_request: AssetEntryRequest,
    session: Session = Depends(get_db_session),
    current_user: User = Depends(get_current_user),
):
    """Registra una entrada de activos (compra/entrega)."""
    # Verificar que el activo existe
    asset = session.exec(select(Asset).where(Asset.id == entry_request.asset_id)).first()
    if not asset:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail=f"Activo con ID {entry_request.asset_id} no encontrado."
        )
    
    # Crear la entrada
    entry = AssetEntry(
        **entry_request.dict(),
        user_uuid=str(current_user.id),
        created_at=datetime.now(timezone.utc),
    )
    session.add(entry)
    session.commit()
    session.refresh(entry)
    
    # Cargar la relación del activo
    session.refresh(entry, ["asset"])
    
    return AssetEntryResponse(
        **entry.dict(),
        asset=asset_to_response(session, asset),
    )


# ============================================================================
# POST /inventory/orders/outbound
# ============================================================================

@router.post("/orders/outbound", response_model=AssetExitResponse, status_code=status.HTTP_201_CREATED)
def create_asset_exit(
    exit_request: AssetExitRequest,
    session: Session = Depends(get_db_session),
    current_user: User = Depends(get_current_user),
):
    """Registra una salida de activos (asignación/consumo)."""
    # Validar coherencia de assigned_to con exit_type
    if exit_request.exit_type == "allocation" and not exit_request.assigned_to:
        raise HTTPException(
            status_code=status.HTTP_422_UNPROCESSABLE_ENTITY,
            detail="assigned_to es obligatorio cuando exit_type es 'allocation'."
        )
    if exit_request.exit_type == "consumption" and exit_request.assigned_to:
        raise HTTPException(
            status_code=status.HTTP_422_UNPROCESSABLE_ENTITY,
            detail="assigned_to debe ser NULL cuando exit_type es 'consumption'."
        )
    
    # Verificar que el activo existe
    asset = session.exec(select(Asset).where(Asset.id == exit_request.asset_id)).first()
    if not asset:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail=f"Activo con ID {exit_request.asset_id} no encontrado."
        )
    
    # Verificar que hay suficiente stock
    current_stock = calculate_current_stock(session, exit_request.asset_id)
    if exit_request.quantity > current_stock:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail=f"Insufficient stock for asset '{asset.name}'. Available: {current_stock}, requested: {exit_request.quantity}."
        )
    
    # Crear la salida
    exit_record = AssetExit(
        **exit_request.dict(),
        user_uuid=str(current_user.id),
        created_at=datetime.now(timezone.utc),
    )
    session.add(exit_record)
    session.commit()
    session.refresh(exit_record)
    
    # Cargar la relación del activo
    session.refresh(exit_record, ["asset"])
    
    return AssetExitResponse(
        **exit_record.dict(),
        asset=asset_to_response(session, asset),
    )


# ============================================================================
# GET /inventory/orders
# ============================================================================

@router.get("/orders")
def list_orders(
    session: Session = Depends(get_db_session),
    current_user: User = Depends(get_current_user),
):
    """Lista todas las órdenes (entradas y salidas)."""
    # Obtener todas las entradas
    entries = session.exec(select(AssetEntry)).all()
    entries_response = []
    for entry in entries:
        asset = session.exec(select(Asset).where(Asset.id == entry.asset_id)).first()
        entries_response.append({
            "id": entry.id,
            "type": "entry",
            "asset_id": entry.asset_id,
            "quantity": entry.quantity,
            "office": entry.office,
            "created_at": entry.created_at,
            "user_uuid": entry.user_uuid,
            "asset": asset_to_response(session, asset),
            "supplier": entry.supplier,
        })
    
    # Obtener todas las salidas
    exits = session.exec(select(AssetExit)).all()
    exits_response = []
    for exit_record in exits:
        asset = session.exec(select(Asset).where(Asset.id == exit_record.asset_id)).first()
        exits_response.append({
            "id": exit_record.id,
            "type": "exit",
            "asset_id": exit_record.asset_id,
            "quantity": exit_record.quantity,
            "office": exit_record.office,
            "created_at": exit_record.created_at,
            "user_uuid": exit_record.user_uuid,
            "asset": asset_to_response(session, asset),
            "exit_type": exit_record.exit_type,
            "assigned_to": exit_record.assigned_to,
        })
    
    # Combinar y ordenar por created_at descendente
    all_orders = entries_response + exits_response
    all_orders.sort(key=lambda x: x["created_at"], reverse=True)
    
    return all_orders
