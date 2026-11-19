import type { Candidate, CandidateCreate, CandidateListResponse, CandidateNote, CandidateNotesResponse, CandidatePatch } from "@/types/candidate";

const API_BASE_URL = process.env.NEXT_PUBLIC_API_URL;

if (!API_BASE_URL) {
  throw new Error("Falta configurar NEXT_PUBLIC_API_URL en .env.local.");
}

function statusMessage(status: number): string {
  if (status === 401) return "Tu sesión ha caducado. Inicia sesión de nuevo.";
  if (status === 403) return "No tienes permiso para realizar esta acción.";
  if (status === 404) return "No se encontró el registro solicitado. Actualiza la página e inténtalo de nuevo.";
  if (status === 409 || status === 422) return "Revisa los datos e inténtalo de nuevo.";
  if (status >= 500) return "El servicio no está disponible ahora. Inténtalo de nuevo más tarde.";
  return "No se pudo completar la solicitud. Inténtalo de nuevo.";
}

function isCandidate(value: unknown): value is Candidate {
  if (!value || typeof value !== "object") return false;
  const candidate = value as Partial<Candidate>;
  const statuses = ["received", "in_progress", "selected", "discarded"];
  const stages = ["pending", "review", "personal_interview", "technical_interview", "offer_presented"];
  return typeof candidate.id === "string" && candidate.id.length > 0 &&
    typeof candidate.full_name === "string" &&
    typeof candidate.email === "string" &&
    typeof candidate.phone === "string" &&
    typeof candidate.position === "string" &&
    (typeof candidate.linkedin_url === "string" || candidate.linkedin_url === null) &&
    (typeof candidate.cv_url === "string" || candidate.cv_url === null) &&
    typeof candidate.status === "string" && statuses.includes(candidate.status) &&
    typeof candidate.stage === "string" && stages.includes(candidate.stage) &&
    typeof candidate.experience_years === "number" &&
    typeof candidate.notes_count === "number" &&
    typeof candidate.applied_at === "string" &&
    typeof candidate.updated_at === "string";
}

function isCandidateNote(value: unknown): value is CandidateNote {
  if (!value || typeof value !== "object") return false;
  const note = value as Partial<CandidateNote>;
  return typeof note.id === "string" && note.id.length > 0 &&
    typeof note.record_id === "string" &&
    typeof note.content === "string" &&
    typeof note.created_at === "string";
}

async function request(path: string, init?: RequestInit): Promise<Response> {
  try {
    return await fetch(`${API_BASE_URL}${path}`, init);
  } catch {
    throw new Error("No se pudo conectar con el servicio. Comprueba tu conexión e inténtalo de nuevo.");
  }
}

async function parseResponse<T>(response: Response, emptyAllowed = false): Promise<T> {
  if (!response.ok) throw new Error(statusMessage(response.status));
  if (emptyAllowed && response.status === 204) return undefined as T;
  try {
    return await response.json() as T;
  } catch {
    throw new Error("El servicio devolvió una respuesta no válida. Inténtalo de nuevo.");
  }
}

async function getJson<T>(path: string): Promise<T> {
  const response = await request(path, { cache: "no-store" });
  return parseResponse<T>(response);
}

async function sendJson<T>(
  path: string,
  method: "PATCH" | "POST" | "PUT",
  body: unknown,
  isValid: (value: unknown) => value is T,
  invalidResponseMessage: string,
): Promise<T> {
  const response = await request(path, {
    method,
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(body),
  });
  const result = await parseResponse<unknown>(response);
  if (!isValid(result)) throw new Error(invalidResponseMessage);
  return result;
}

async function sendDelete(path: string): Promise<void> {
  const response = await request(path, { method: "DELETE" });
  await parseResponse<void>(response, true);
}

export async function getCandidates(): Promise<Candidate[]> {
  const results: Candidate[] = [];
  const limit = 100;
  let page = 1;
  let total = 0;

  do {
    const response = await getJson<CandidateListResponse>(`/records?page=${page}&limit=${limit}`);
    if (!Array.isArray(response?.data) || !response.data.every(isCandidate) || !Number.isInteger(response.total) || response.total < 0) {
      throw new Error("El servicio devolvió una lista de candidaturas no válida. Actualiza la página o inténtalo de nuevo.");
    }
    results.push(...response.data);
    total = response.total;
    page += 1;
  } while (results.length < total);

  return results;
}

export async function getCandidate(id: string): Promise<Candidate> {
  const candidate = await getJson<unknown>(`/records/${encodeURIComponent(id)}`);
  if (!isCandidate(candidate)) {
    throw new Error("El servicio devolvió datos de candidatura no válidos. Actualiza la página o inténtalo de nuevo.");
  }
  return candidate;
}

export async function createCandidate(data: CandidateCreate): Promise<Candidate> {
  return sendJson("/records", "POST", data, isCandidate,
    "El servicio devolvió datos de candidatura no válidos. Revisa el pipeline e inténtalo de nuevo.");
}

export async function replaceCandidate(id: string, data: CandidateCreate): Promise<Candidate> {
  return sendJson(`/records/${encodeURIComponent(id)}`, "PUT", data, isCandidate,
    "El servicio devolvió datos de candidatura no válidos. Revisa el pipeline e inténtalo de nuevo.");
}

export async function updateCandidate(id: string, patch: CandidatePatch): Promise<Candidate> {
  return sendJson(`/records/${encodeURIComponent(id)}`, "PATCH", patch, isCandidate,
    "El servicio devolvió datos de candidatura no válidos. Actualiza la página e inténtalo de nuevo.");
}

export async function getCandidateNotes(id: string): Promise<CandidateNote[]> {
  const response = await getJson<CandidateNotesResponse>(`/records/${encodeURIComponent(id)}/notes`);
  if (!Array.isArray(response?.data) || !response.data.every(isCandidateNote)) {
    throw new Error("El servicio devolvió una lista de notas no válida. Vuelve a cargar las notas.");
  }
  return response.data;
}

export async function addCandidateNote(id: string, content: string): Promise<CandidateNote> {
  return sendJson(`/records/${encodeURIComponent(id)}/notes`, "POST", { content }, isCandidateNote,
    "El servicio devolvió datos de nota no válidos. Vuelve a cargar las notas e inténtalo de nuevo.");
}

export async function deleteCandidateNote(id: string, noteId: string): Promise<void> {
  await sendDelete(`/records/${encodeURIComponent(id)}/notes/${encodeURIComponent(noteId)}`);
}
