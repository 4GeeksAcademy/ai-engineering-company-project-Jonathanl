"""SQLModel ORM models for inventory management."""

from datetime import datetime, timezone
from typing import Optional
from sqlmodel import Field, SQLModel, Relationship


class Asset(SQLModel, table=True):
    """Representa un activo (producto) de la empresa."""
    
    id: Optional[int] = Field(default=None, primary_key=True)
    name: str = Field(index=True)
    sku: str = Field(unique=True, index=True)
    category: str = Field(
        description="Category: hardware, peripherals, office_supplies, training_materials"
    )
    office: str = Field(description="Valencia or Miami")
    
    # Relaciones
    entries: list["AssetEntry"] = Relationship(back_populates="asset")
    exits: list["AssetExit"] = Relationship(back_populates="asset")


class AssetEntry(SQLModel, table=True):
    """Representa una entrada de activos (compra/entrega recibida)."""
    
    id: Optional[int] = Field(default=None, primary_key=True)
    asset_id: int = Field(foreign_key="asset.id", index=True)
    quantity: int = Field(gt=0, description="Unidades recibidas")
    supplier: str = Field(description="Nombre del proveedor")
    office: str = Field(description="Valencia or Miami")
    created_at: datetime = Field(default_factory=lambda: datetime.now(timezone.utc))
    user_uuid: str = Field(description="UUID del usuario (TinyDB) que registró la entrada")
    
    # Relación
    asset: Asset = Relationship(back_populates="entries")


class AssetExit(SQLModel, table=True):
    """Representa una salida de activos (asignación o consumo)."""
    
    id: Optional[int] = Field(default=None, primary_key=True)
    asset_id: int = Field(foreign_key="asset.id", index=True)
    quantity: int = Field(gt=0, description="Unidades asignadas/consumidas")
    exit_type: str = Field(
        description="allocation (asignado a empleado) o consumption (consumido)"
    )
    assigned_to: Optional[str] = Field(
        default=None,
        description="Nombre/ID del empleado si exit_type=allocation. NULL si consumption."
    )
    office: str = Field(description="Valencia or Miami")
    created_at: datetime = Field(default_factory=lambda: datetime.now(timezone.utc))
    user_uuid: str = Field(description="UUID del usuario (TinyDB) que registró la salida")
    
    # Relación
    asset: Asset = Relationship(back_populates="exits")
