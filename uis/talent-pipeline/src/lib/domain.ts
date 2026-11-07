import type { CandidateStage, CandidateStatus } from "@/types/candidate";

export const statusLabels: Record<CandidateStatus, string> = {
  received: "Recibida",
  in_progress: "En proceso",
  selected: "Seleccionada",
  discarded: "Descartada",
};

export const stageLabels: Record<CandidateStage, string> = {
  pending: "Pendiente",
  review: "Revisión de perfil",
  personal_interview: "Entrevista personal",
  technical_interview: "Entrevista técnica",
  offer_presented: "Oferta presentada",
};

export const statusOptions = Object.entries(statusLabels) as [CandidateStatus, string][];
export const stageOptions = Object.entries(stageLabels) as [CandidateStage, string][];

export function getInitials(name: string): string {
  return name
    .split(/\s+/)
    .slice(0, 2)
    .map((part) => part[0] ?? "")
    .join("")
    .toUpperCase();
}

export function formatCandidateDate(date: string): string {
  const parsed = new Date(date);
  return Number.isNaN(parsed.getTime())
    ? date
    : new Intl.DateTimeFormat("es-ES", { dateStyle: "long" }).format(parsed);
}