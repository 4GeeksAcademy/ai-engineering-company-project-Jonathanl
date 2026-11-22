import { AUTH_TOKEN_KEY } from "@/lib/auth";
import type {
  Asset,
  AssetEntry,
  AssetEntryCreate,
  AssetExit,
  AssetExitCreate,
  InventoryOrder,
} from "@/types/inventory";

const INVENTORY_API_BASE = "/nexova-api/inventory";

type ApiErrorBody = {
  error?: string | { message?: string };
  detail?: string | Array<{ loc?: Array<string | number>; msg?: string }>;
};

/** Error explícito de la API de inventario; status es 0 para fallos de red. */
export class InventoryApiError extends Error {
  readonly status: number;

  constructor(message: string, status: number) {
    super(message);
    this.name = "InventoryApiError";
    this.status = status;
  }
}

function fallbackMessage(status: number): string {
  if (status === 0) return "No se pudo conectar con el servicio de inventario. Comprueba tu conexión e inténtalo de nuevo.";
  if (status === 400) return "No se pudo completar la operación. Revisa los datos e inténtalo de nuevo.";
  if (status === 401) return "Tu sesión ha caducado. Inicia sesión de nuevo.";
  if (status === 403) return "No tienes permiso para realizar esta operación.";
  if (status === 404) return "No se encontró el activo o movimiento solicitado.";
  if (status === 422) return "Los datos enviados no son válidos. Revisa el formulario.";
  if (status >= 500) return "El servicio de inventario no está disponible ahora. Inténtalo de nuevo más tarde.";
  return `No se pudo completar la solicitud (HTTP ${status}).`;
}

function errorMessage(body: ApiErrorBody, status: number): string {
  if (typeof body.error === "string" && body.error.trim()) return body.error;
  if (body.error && typeof body.error === "object" && typeof body.error.message === "string" && body.error.message.trim()) {
    return body.error.message;
  }
  if (typeof body.detail === "string" && body.detail.trim()) return body.detail;
  if (Array.isArray(body.detail)) {
    const messages = body.detail
      .map((issue) => issue.msg?.trim())
      .filter((message): message is string => Boolean(message));
    if (messages.length) return messages.join(" ");
  }
  return fallbackMessage(status);
}

async function parseError(response: Response): Promise<InventoryApiError> {
  let body: ApiErrorBody = {};
  try {
    const parsed: unknown = await response.json();
    if (parsed && typeof parsed === "object") body = parsed as ApiErrorBody;
  } catch {
    // Respuestas no JSON usan un mensaje local legible basado en el status.
  }
  return new InventoryApiError(errorMessage(body, response.status), response.status);
}

async function request<T>(path: string, init: RequestInit = {}): Promise<T> {
  const token = localStorage.getItem(AUTH_TOKEN_KEY);
  if (!token) {
    throw new InventoryApiError("Tu sesión no está iniciada. Inicia sesión para continuar.", 401);
  }

  let response: Response;
  try {
    response = await fetch(`${INVENTORY_API_BASE}${path}`, {
      ...init,
      cache: "no-store",
      headers: {
        Accept: "application/json",
        ...(init.body ? { "Content-Type": "application/json" } : {}),
        ...init.headers,
        Authorization: `Bearer ${token}`,
      },
    });
  } catch {
    throw new InventoryApiError(fallbackMessage(0), 0);
  }

  if (response.status === 401) {
    localStorage.removeItem(AUTH_TOKEN_KEY);
    if (window.location.pathname !== "/login") {
      const requestedPath = `${window.location.pathname}${window.location.search}`;
      window.location.assign(`/login?next=${encodeURIComponent(requestedPath)}`);
    }
    throw await parseError(response);
  }
  if (!response.ok) throw await parseError(response);

  try {
    return await response.json() as T;
  } catch {
    throw new InventoryApiError("El servicio de inventario devolvió una respuesta no válida.", response.status);
  }
}

/** Obtiene todos los activos con stock calculado. */
export function getAssets(): Promise<Asset[]> {
  return request<Asset[]>("/products");
}

/** Obtiene un activo y su stock actual. */
export function getAsset(assetId: number): Promise<Asset> {
  return request<Asset>(`/products/${encodeURIComponent(assetId)}`);
}

/** Registra una entrada de activos (compra o entrega recibida). */
export function createAssetEntry(data: AssetEntryCreate): Promise<AssetEntry> {
  return request<AssetEntry>("/orders/inbound", {
    method: "POST",
    body: JSON.stringify(data),
  });
}

/** Registra una salida de activos (asignación o consumo). */
export function createAssetExit(data: AssetExitCreate): Promise<AssetExit> {
  return request<AssetExit>("/orders/outbound", {
    method: "POST",
    body: JSON.stringify(data),
  });
}

/** Obtiene el historial combinado de entradas y salidas. */
export function getInventoryOrders(): Promise<InventoryOrder[]> {
  return request<InventoryOrder[]>("/orders");
}
