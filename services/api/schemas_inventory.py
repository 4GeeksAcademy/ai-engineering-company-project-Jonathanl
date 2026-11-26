"""Pydantic schemas for inventory API requests and responses."""

from datetime import datetime
from typing import Optional
from pydantic import BaseModel, Field


# ============================================================================
# ASSET Schemas
# ============================================================================

class AssetRequest(BaseModel):
    """Schema para crear un nuevo Asset."""
    name: str = Field(..., min_length=1, description="Nombre del activo")
    sku: str = Field(..., min_length=1, description="Código SKU único")
    category: str = Field(..., description="hardware | peripherals | office_supplies | training_materials")
    office: str = Field(..., description="Valencia o Miami")


class AssetResponse(BaseModel):
    """Schema para respuestas de Asset con stock calculado."""
    id: int
    name: str
    sku: str
    category: str
    office: str
    current_stock: int = Field(description="Calculado: SUM(entries) - SUM(exits)")

    class Config:
        from_attributes = True


# ============================================================================
# ASSET ENTRY (Inbound) Schemas
# ============================================================================

class AssetEntryRequest(BaseModel):
    """Schema para registrar una entrada de activos (compra/entrega)."""
    asset_id: int = Field(..., gt=0, description="ID del activo")
    quantity: int = Field(..., gt=0, description="Cantidad recibida")
    supplier: str = Field(..., min_length=1, description="Nombre del proveedor")
    office: str = Field(..., description="Valencia o Miami")


class AssetEntryResponse(BaseModel):
    """Schema para respuesta de AssetEntry."""
    id: int
    asset_id: int
    quantity: int
    supplier: str
    office: str
    created_at: datetime
    user_uuid: str
    asset: AssetResponse = Field(description="Datos del activo")

    class Config:
        from_attributes = True


# ============================================================================
# ASSET EXIT (Outbound) Schemas
# ============================================================================

class AssetExitRequest(BaseModel):
    """Schema para registrar una salida de activos (asignación/consumo)."""
    asset_id: int = Field(..., gt=0, description="ID del activo")
    quantity: int = Field(..., gt=0, description="Cantidad asignada/consumida")
    exit_type: str = Field(..., description="allocation o consumption")
    assigned_to: Optional[str] = Field(
        default=None,
        description="Nombre/ID del empleado si exit_type=allocation. NULL si consumption."
    )
    office: str = Field(..., description="Valencia o Miami")

    def validate_assigned_to(self):
        """Valida que assigned_to sea coherente con exit_type."""
        if self.exit_type == "allocation" and not self.assigned_to:
            raise ValueError("assigned_to es obligatorio cuando exit_type es 'allocation'")
        if self.exit_type == "consumption" and self.assigned_to:
            raise ValueError("assigned_to debe ser NULL cuando exit_type es 'consumption'")


class AssetExitResponse(BaseModel):
    """Schema para respuesta de AssetExit."""
    id: int
    asset_id: int
    quantity: int
    exit_type: str
    assigned_to: Optional[str]
    office: str
    created_at: datetime
    user_uuid: str
    asset: AssetResponse = Field(description="Datos del activo")

    class Config:
        from_attributes = True


# ============================================================================
# Combined Schemas for GET /inventory/orders
# ============================================================================

class OrderResponse(BaseModel):
    """Respuesta genérica para órdenes (entries + exits)."""
    id: int
    type: str = Field(description="'entry' o 'exit'")
    asset_id: int
    quantity: int
    office: str
    created_at: datetime
    user_uuid: str
    asset: AssetResponse = Field(description="Datos del activo")
    
    # Campos específicos de entry
    supplier: Optional[str] = Field(default=None, description="Solo en entries")
    
    # Campos específicos de exit
    exit_type: Optional[str] = Field(default=None, description="Solo en exits: allocation o consumption")
    assigned_to: Optional[str] = Field(default=None, description="Solo en exits con allocation")
