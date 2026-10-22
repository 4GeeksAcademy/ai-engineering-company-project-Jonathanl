"use client";

import { useEffect, useState } from "react";
import { useParams } from "next/navigation";
import CandidateForm from "@/components/CandidateForm";
import { getCandidate } from "@/lib/api";
import type { Candidate } from "@/types/candidate";

export default function EditCandidatePage() {
  const { id } = useParams<{ id: string }>();
  const [candidate, setCandidate] = useState<Candidate | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [reloadKey, setReloadKey] = useState(0);

  useEffect(() => {
    let active = true;
    async function load() {
      setLoading(true);
      setError("");
      try {
        const result = await getCandidate(id);
        if (active) setCandidate(result);
      } catch (cause) {
        if (active) setError(cause instanceof Error ? cause.message : "No se pudo cargar la candidatura.");
      } finally {
        if (active) setLoading(false);
      }
    }
    void load();
    return () => { active = false; };
  }, [id, reloadKey]);

  if (loading) return <main className="container"><section className="panel state" role="status"><span className="loading-dot" />Cargando datos de la candidatura…</section></main>;
  if (error) return <main className="container"><section className="panel state error" role="alert"><strong>No se pudo cargar la candidatura.</strong><p>{error}</p><button type="button" className="control" onClick={() => setReloadKey((key) => key + 1)}>Volver a intentar</button></section></main>;
  return candidate ? <CandidateForm mode="edit" candidate={candidate} /> : null;
}
