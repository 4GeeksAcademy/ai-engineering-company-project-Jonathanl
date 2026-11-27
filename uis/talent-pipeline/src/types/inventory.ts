export type AssetCategory =
  | "hardware"
  | "peripherals"
  | "office_supplies"
  | "training_materials";

export type NexovaOffice = "Valencia" | "Miami";
export type ExitType = "allocation" | "consumption";

/** Activo Nexova; current_stock se calcula en el backend y nunca se modifica directamente. */
export type Asset = {
  id: number;
  name: string;
  sku: string;
  category: AssetCategory;
  office: NexovaOffice;
  current_stock: number;
};

export type AssetEntryCreate = {
  asset_id: number;
  quantity: number;
  supplier: string;
  office: NexovaOffice;
};

export type AssetEntry = AssetEntryCreate & {
  id: number;
  created_at: string;
  user_uuid: string;
  asset: Asset;
};

export type AssetExitCreate = {
  asset_id: number;
  quantity: number;
  exit_type: ExitType;
  assigned_to: string | null;
  office: NexovaOffice;
};

export type AssetExit = AssetExitCreate & {
  id: number;
  created_at: string;
  user_uuid: string;
  asset: Asset;
};

export type InventoryEntryOrder = {
  id: number;
  type: "entry";
  asset_id: number;
  quantity: number;
  office: NexovaOffice;
  created_at: string;
  user_uuid: string;
  asset: Asset;
  supplier: string;
  exit_type?: never;
  assigned_to?: never;
};

export type InventoryExitOrder = {
  id: number;
  type: "exit";
  asset_id: number;
  quantity: number;
  office: NexovaOffice;
  created_at: string;
  user_uuid: string;
  asset: Asset;
  exit_type: ExitType;
  assigned_to: string | null;
  supplier?: never;
};

/** Movimiento devuelto por GET /inventory/orders, discriminado por type. */
export type InventoryOrder = InventoryEntryOrder | InventoryExitOrder;
