export const AUTH_TOKEN_KEY = "nexova_access_token";
const AUTH_API_BASE = "/nexova-api";

export function logout(): void {
  localStorage.removeItem(AUTH_TOKEN_KEY);
  window.location.assign("/login");
}

export type RegisterData = {
  email: string;
  password: string;
  name?: string;
  phone?: string;
  address?: string;
};

export type AuthField = "email" | "password" | "name" | "phone" | "address";
export type CurrentAccount = {
  email: string;
  role: "admin" | "manager" | "user";
  profile: { name: string | null; phone: string | null; address: string | null };
};

export class AuthRequestError extends Error {
  fieldErrors: Partial<Record<AuthField, string>>;

  constructor(message: string, fieldErrors: Partial<Record<AuthField, string>> = {}) {
    super(message);
    this.name = "AuthRequestError";
    this.fieldErrors = fieldErrors;
  }
}

type ApiErrorBody = {
  detail?: string | Array<{ loc?: Array<string | number>; msg?: string }>;
  error?: string;
};

function fieldFromLocation(location: Array<string | number> = []): AuthField | undefined {
  const field = location.at(-1);
  return ["email", "password", "name", "phone", "address"].includes(String(field))
    ? (field as AuthField)
    : undefined;
}

async function throwApiError(
  response: Response,
  options: { conflictField?: AuthField } = {},
): Promise<never> {
  let body: ApiErrorBody = {};
  try {
    body = await response.json() as ApiErrorBody;
  } catch {
    // Use the HTTP status when the response is not JSON.
  }

  const fieldErrors: Partial<Record<AuthField, string>> = {};
  if (Array.isArray(body.detail)) {
    for (const issue of body.detail) {
      const field = fieldFromLocation(issue.loc);
      if (field && !fieldErrors[field]) fieldErrors[field] = issue.msg ?? "Revisa este campo.";
    }
  }

  const detail = typeof body.detail === "string" ? body.detail : body.error;
  const fallback = response.status === 409
    ? "Ya existe una cuenta con ese email."
    : response.status === 401
      ? "Email o contraseña incorrectos."
      : `No se pudo completar la solicitud (HTTP ${response.status}).`;
  const message = detail ?? fallback;

  if (response.status === 409 && options.conflictField) {
    fieldErrors[options.conflictField] = message;
  }

  throw new AuthRequestError(message, fieldErrors);
}

async function authenticatedRequest<T>(path: string, init: RequestInit = {}): Promise<T> {
  const token = localStorage.getItem(AUTH_TOKEN_KEY);
  if (!token) throw new AuthRequestError("Tu sesión no está iniciada. Vuelve a iniciar sesión.");

  const response = await fetch(`${AUTH_API_BASE}${path}`, {
    ...init,
    headers: {
      ...(init.body ? { "Content-Type": "application/json" } : {}),
      ...init.headers,
      Authorization: `Bearer ${token}`,
    },
  });
  if (response.status === 401) {
    localStorage.removeItem(AUTH_TOKEN_KEY);
    window.location.assign("/login");
    throw new AuthRequestError("Tu sesión ha caducado. Inicia sesión de nuevo.");
  }
  if (!response.ok) await throwApiError(response);
  return response.json() as Promise<T>;
}

export function getCurrentAccount(): Promise<CurrentAccount> {
  return authenticatedRequest<CurrentAccount>("/auth/me");
}

export function updateMyProfile(data: { name: string; phone: string; address: string }): Promise<CurrentAccount["profile"]> {
  return authenticatedRequest<CurrentAccount["profile"]>("/profiles/me", {
    method: "PUT",
    body: JSON.stringify(data),
  });
}

export async function registerAndLogin(data: RegisterData): Promise<void> {
  const registration = await fetch(`${AUTH_API_BASE}/users`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(data),
  });
  if (!registration.ok) await throwApiError(registration, { conflictField: "email" });

  const credentials = new URLSearchParams({ username: data.email, password: data.password });
  const login = await fetch(`${AUTH_API_BASE}/auth/login`, {
    method: "POST",
    headers: { "Content-Type": "application/x-www-form-urlencoded" },
    body: credentials,
  });
  if (!login.ok) {
    throw new AuthRequestError("La cuenta se creó, pero no se pudo iniciar sesión. Intenta acceder desde el formulario de login.");
  }

  const result = await login.json() as { access_token: string };
  localStorage.setItem(AUTH_TOKEN_KEY, result.access_token);
}

export async function login(email: string, password: string): Promise<void> {
  const credentials = new URLSearchParams({ username: email, password });
  const response = await fetch(`${AUTH_API_BASE}/auth/login`, {
    method: "POST",
    headers: { "Content-Type": "application/x-www-form-urlencoded" },
    body: credentials,
  });
  if (!response.ok) await throwApiError(response);

  const result = await response.json() as { access_token: string };
  localStorage.setItem(AUTH_TOKEN_KEY, result.access_token);
}
