import type { Candidate, CandidateCreate, CandidateListResponse, CandidateNote, CandidateNotesResponse, CandidatePatch } from "@/types/candidate";

const API_BASE_URL = process.env.NEXT_PUBLIC_API_URL;

if (!API_BASE_URL) {
  throw new Error("Falta configurar NEXT_PUBLIC_API_URL en .env.local.");
}

async function getJson<T>(path: string): Promise<T> {
  const response = await fetch(`${API_BASE_URL}${path}`, { cache: "no-store" });
  if (!response.ok) {
    const detail = await response.text();
    throw new Error(detail || `La API respondió con el estado ${response.status}.`);
  }
  return response.json() as Promise<T>;
}

async function sendJson<T>(path: string, method: "PATCH" | "POST" | "PUT", body: unknown): Promise<T> {
  const response = await fetch(`${API_BASE_URL}${path}`, {
    method,
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(body),
  });
  if (!response.ok) {
    const detail = await response.text();
    throw new Error(detail || `La API respondió con el estado ${response.status}.`);
  }
  return response.json() as Promise<T>;
}

async function sendDelete(path: string): Promise<void> {
  const response = await fetch(`${API_BASE_URL}${path}`, { method: "DELETE" });
  if (!response.ok) {
    const detail = await response.text();
    throw new Error(detail || `La API respondió con el estado ${response.status}.`);
  }
}

export async function getCandidates(): Promise<Candidate[]> {
  const results: Candidate[] = [];
  const limit = 100;
  let page = 1;
  let total = 0;

  do {
    const response = await getJson<CandidateListResponse>(`/records?page=${page}&limit=${limit}`);
    results.push(...response.data);
    total = response.total;
    page += 1;
  } while (results.length < total);

  return results;
}

export async function getCandidate(id: string): Promise<Candidate> {
  return getJson<Candidate>(`/records/${encodeURIComponent(id)}`);
}

export async function createCandidate(data: CandidateCreate): Promise<Candidate> {
  return sendJson<Candidate>("/records", "POST", data);
}

export async function replaceCandidate(id: string, data: CandidateCreate): Promise<Candidate> {
  return sendJson<Candidate>(`/records/${encodeURIComponent(id)}`, "PUT", data);
}

export async function updateCandidate(id: string, patch: CandidatePatch): Promise<Candidate> {
  return sendJson<Candidate>(`/records/${encodeURIComponent(id)}`, "PATCH", patch);
}

export async function getCandidateNotes(id: string): Promise<CandidateNote[]> {
  const response = await getJson<CandidateNotesResponse>(`/records/${encodeURIComponent(id)}/notes`);
  return response.data;
}

export async function addCandidateNote(id: string, content: string): Promise<CandidateNote> {
  return sendJson<CandidateNote>(`/records/${encodeURIComponent(id)}/notes`, "POST", { content });
}

export async function deleteCandidateNote(id: string, noteId: string): Promise<void> {
  await sendDelete(`/records/${encodeURIComponent(id)}/notes/${encodeURIComponent(noteId)}`);
}
