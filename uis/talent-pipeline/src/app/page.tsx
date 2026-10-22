"use client";

import Link from "next/link";
import { usePathname, useRouter, useSearchParams } from "next/navigation";
import { Suspense, useEffect, useMemo, useState } from "react";
import { getCandidates } from "@/lib/api";
import { getInitials, stageLabels, stageOptions, statusLabels, statusOptions } from "@/lib/domain";
import type { Candidate } from "@/types/candidate";

function statusClass(status: string) {
  if (status === "selected") return "pill pill-green";
  if (status === "in_progress") return "pill pill-blue";
  if (status === "received") return "pill pill-orange";
  return "pill";
}

function CandidatesList() {
  const router = useRouter();
  const pathname = usePathname();
  const searchParams = useSearchParams();
  const [candidates, setCandidates] = useState<Candidate[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [reloadKey, setReloadKey] = useState(0);
  const [search, setSearch] = useState("");
  const requestedStatus = searchParams.get("status") ?? "";
  const requestedStage = searchParams.get("stage") ?? "";
  const statusFilter = statusOptions.some(([value]) => value === requestedStatus) ? requestedStatus : "";
  const stageFilter = stageOptions.some(([value]) => value === requestedStage) ? requestedStage : "";

  function updateFilters(nextStatus: string, nextStage: string) {
    const params = new URLSearchParams(searchParams.toString());
    if (nextStatus) params.set("status", nextStatus);
    else params.delete("status");
    if (nextStage) params.set("stage", nextStage);
    else params.delete("stage");
    const query = params.toString();
    router.replace(query ? `${pathname}?${query}` : pathname, { scroll: false });
  }

  useEffect(() => {
    let active = true;
    async function loadCandidates() {
      setLoading(true);
      setError("");
      try {
        const data = await getCandidates();
        if (active) setCandidates(data);
      } catch (cause) {
        if (active) setError(cause instanceof Error ? cause.message : "No se pudieron cargar las candidaturas.");
      } finally {
        if (active) setLoading(false);
      }
    }
    void loadCandidates();
    return () => { active = false; };
  }, [reloadKey]);

  const filteredCandidates = useMemo(() => {
    const normalizedSearch = search.trim().toLocaleLowerCase("es");
    return candidates.filter((candidate) => {
      const matchesStatus = !statusFilter || candidate.status === statusFilter;
      const matchesStage = !stageFilter || candidate.stage === stageFilter;
      const matchesSearch = !normalizedSearch ||
        candidate.full_name.toLocaleLowerCase("es").includes(normalizedSearch) ||
        candidate.email.toLocaleLowerCase("es").includes(normalizedSearch);
      return matchesStatus && matchesStage && matchesSearch;
    });
  }, [candidates, search, stageFilter, statusFilter]);

  return (
    <div className="shell">
      <header className="topbar">
        <Link className="brand" href="/">nexova<span>.</span></Link>
        <nav className="nav" aria-label="Navegación principal">
          <Link href="/" aria-current="page">Candidaturas</Link>
          <a href="#equipo">Equipo</a>
          <a href="#informes">Informes</a>
        </nav>
        <div className="user"><span className="avatar" aria-hidden="true">PT</span><span className="user-name">People &amp; Talent</span></div>
      </header>

      <main className="container">
        <div className="title-row">
          <div><p className="eyebrow">People &amp; Talent / Selección</p><h1>Pipeline de candidaturas</h1><p className="lead">Todos los perfiles y su progreso en el proceso de selección.</p></div>
          <Link className="primary-button create-candidate-link" href="/candidates/new">+ Registrar candidatura</Link>
          {!loading && !error && <span className="count">{filteredCandidates.length} de {candidates.length} candidaturas</span>}
        </div>

        <section className="panel" aria-label="Candidaturas">
          <div className="filters" aria-label="Filtros de candidaturas">
            <label className="sr-only" htmlFor="candidate-search">Buscar por nombre o correo electrónico</label>
            <input
              id="candidate-search"
              className="control search"
              type="search"
              placeholder="Buscar por nombre o email…"
              value={search}
              onChange={(event) => setSearch(event.target.value)}
            />
            <label className="sr-only" htmlFor="status-filter">Filtrar por estado</label>
            <select
              id="status-filter"
              className="control select"
              value={statusFilter}
              onChange={(event) => updateFilters(event.target.value, stageFilter)}
            >
              <option value="">Todos los estados</option>
              {statusOptions.map(([value, label]) => <option key={value} value={value}>{label}</option>)}
            </select>
            <label className="sr-only" htmlFor="stage-filter">Filtrar por etapa</label>
            <select
              id="stage-filter"
              className="control select"
              value={stageFilter}
              onChange={(event) => updateFilters(statusFilter, event.target.value)}
            >
              <option value="">Todas las etapas</option>
              {stageOptions.map(([value, label]) => <option key={value} value={value}>{label}</option>)}
            </select>
          </div>
          {loading ? (
            <div className="state" role="status"><span className="loading-dot" />Cargando candidaturas…</div>
          ) : error ? (
            <div className="state error" role="alert"><strong>No se pudieron cargar las candidaturas.</strong><p>{error}</p><button className="control" onClick={() => setReloadKey((value) => value + 1)}>Volver a intentar</button></div>
          ) : candidates.length === 0 ? (
            <div className="state">Todavía no hay candidaturas registradas.</div>
          ) : filteredCandidates.length === 0 ? (
            <div className="state">No hay candidaturas que coincidan con la búsqueda y los filtros.</div>
          ) : (
            <div className="table-wrap">
              <table className="candidate-table">
                <thead><tr><th scope="col">Candidata/o</th><th scope="col">Puesto</th><th scope="col">Estado</th><th scope="col">Etapa actual</th><th scope="col"><span className="sr-only">Detalle</span></th></tr></thead>
                <tbody>{filteredCandidates.map((candidate) => (
                  <tr key={candidate.id}>
                    <td><div className="person"><span className="person-avatar" aria-hidden="true">{getInitials(candidate.full_name)}</span><div><div className="person-name">{candidate.full_name}</div><div className="subtle">{candidate.email}</div></div></div></td>
                    <td>{candidate.position}</td>
                    <td><span className={statusClass(candidate.status)}>{statusLabels[candidate.status] ?? candidate.status}</span></td>
                    <td>{stageLabels[candidate.stage] ?? candidate.stage}</td>
                    <td><Link className="view-link" href={`/candidates/${encodeURIComponent(candidate.id)}`}>Ver candidatura <span aria-hidden="true">→</span></Link></td>
                  </tr>
                ))}</tbody>
              </table>
            </div>
          )}
        </section>
      </main>
    </div>
  );
}

export default function CandidatesPage() {
  return (
    <Suspense fallback={<main className="container"><section className="panel state" role="status"><span className="loading-dot" />Cargando pipeline…</section></main>}>
      <CandidatesList />
    </Suspense>
  );
}
