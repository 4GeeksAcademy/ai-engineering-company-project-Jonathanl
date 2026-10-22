"use client";

import Link from "next/link";
import { useParams } from "next/navigation";
import { useEffect, useState } from "react";
import { addCandidateNote, deleteCandidateNote, getCandidate, getCandidateNotes, updateCandidate } from "@/lib/api";
import { formatCandidateDate, getInitials, stageLabels, stageOptions, statusLabels, statusOptions } from "@/lib/domain";
import type { Candidate, CandidateNote, CandidateStage, CandidateStatus } from "@/types/candidate";

export default function CandidateDetailPage() {
  const params = useParams<{ id: string }>();
  const id = params.id;
  const [candidate, setCandidate] = useState<Candidate | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [notes, setNotes] = useState<CandidateNote[]>([]);
  const [notesLoading, setNotesLoading] = useState(true);
  const [notesError, setNotesError] = useState("");
  const [noteContent, setNoteContent] = useState("");
  const [noteSaving, setNoteSaving] = useState(false);
  const [noteFeedback, setNoteFeedback] = useState("");
  const [noteError, setNoteError] = useState("");
  const [updatingField, setUpdatingField] = useState<"status" | "stage" | "" > ("");
  const [deletingNoteId, setDeletingNoteId] = useState("");
  const [addingNote, setAddingNote] = useState(false);
  const [updateFeedback, setUpdateFeedback] = useState("");
  const [updateError, setUpdateError] = useState("");
  const [notesReloadKey, setNotesReloadKey] = useState(0);

  useEffect(() => {
    let active = true;
    async function loadCandidate() {
      setLoading(true);
      setError("");
      try {
        const data = await getCandidate(id);
        if (active) setCandidate(data);
      } catch (cause) {
        if (active) setError(cause instanceof Error ? cause.message : "No se pudo cargar la candidatura.");
      } finally {
        if (active) setLoading(false);
      }
    }
    void loadCandidate();
    return () => { active = false; };
  }, [id]);

  useEffect(() => {
    let active = true;
    async function loadNotes() {
      setNotesLoading(true);
      setNotesError("");
      try {
        const data = await getCandidateNotes(id);
        if (active) setNotes(data);
      } catch (cause) {
        if (active) setNotesError(cause instanceof Error ? cause.message : "No se pudieron cargar las notas.");
      } finally {
        if (active) setNotesLoading(false);
      }
    }
    void loadNotes();
    return () => { active = false; };
  }, [id, notesReloadKey]);

  async function changeCandidateField(field: "status", value: CandidateStatus): Promise<void>;
  async function changeCandidateField(field: "stage", value: CandidateStage): Promise<void>;
  async function changeCandidateField(field: "status" | "stage", value: CandidateStatus | CandidateStage) {
    if (!candidate || !value || value === candidate[field]) return;
    setUpdatingField(field);
    setUpdateFeedback("");
    setUpdateError("");
    try {
      const updated = await updateCandidate(id, { [field]: value });
      setCandidate(updated);
      setUpdateFeedback(field === "status" ? "Estado actualizado." : "Etapa actualizada.");
    } catch (cause) {
      setUpdateError(cause instanceof Error ? cause.message : "No se pudo actualizar el proceso.");
    } finally {
      setUpdatingField("");
    }
  }

  async function submitNote(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();
    if (addingNote || deletingNoteId) return;
    const content = noteContent.trim();
    if (!content) {
      setNoteError("Escribe una nota antes de guardarla.");
      return;
    }
    setAddingNote(true);
    setNoteSaving(true);
    setNoteError("");
    setNoteFeedback("");
    try {
      const note = await addCandidateNote(id, content);
      setNotes((current) => [note, ...current]);
      setNoteContent("");
      setNoteFeedback("Nota añadida.");
      setCandidate((current) => current ? { ...current, notes_count: current.notes_count + 1 } : current);
    } catch (cause) {
      setNoteError(cause instanceof Error ? cause.message : "No se pudo añadir la nota.");
    } finally {
      setAddingNote(false);
      setNoteSaving(false);
    }
  }

  async function removeNote(noteId: string) {
    if (deletingNoteId || addingNote) return;
    setDeletingNoteId(noteId);
    setNoteError("");
    setNoteFeedback("");
    try {
      await deleteCandidateNote(id, noteId);
      setNotes((current) => current.filter((note) => note.id !== noteId));
      setCandidate((current) => current ? { ...current, notes_count: Math.max(0, current.notes_count - 1) } : current);
      setNoteFeedback("Nota eliminada.");
    } catch (cause) {
      setNoteError(cause instanceof Error ? cause.message : "No se pudo eliminar la nota.");
    } finally {
      setDeletingNoteId("");
    }
  }

  return (
    <div className="shell">
      <header className="topbar">
        <Link className="brand" href="/">nexova<span>.</span></Link>
        <nav className="nav" aria-label="Navegación principal">
          <Link href="/" aria-current="page">Candidaturas</Link><a href="/#equipo">Equipo</a><a href="/#informes">Informes</a>
        </nav>
        <div className="user"><span className="avatar" aria-hidden="true">PT</span><span className="user-name">People &amp; Talent</span></div>
      </header>
      <main className="container">
        <Link className="back" href="/">← Volver al pipeline</Link>
        {loading ? <section className="panel state" role="status"><span className="loading-dot" />Cargando candidatura…</section> : error ? <section className="panel state error" role="alert"><strong>No se pudo cargar la candidatura.</strong><p>{error}</p><Link className="back" href="/">Volver al pipeline</Link></section> : candidate ? (
          <>
            <section className="panel detail-head">
              <span className="detail-avatar" aria-hidden="true">{getInitials(candidate.full_name)}</span>
              <div className="detail-identity"><p className="eyebrow">Detalle de candidatura</p><h1 className="detail-name">{candidate.full_name}</h1><div className="detail-meta">{candidate.position} · {candidate.email}</div><div className="detail-pills"><span className="pill pill-blue">{statusLabels[candidate.status] ?? candidate.status}</span><span className="pill">{stageLabels[candidate.stage] ?? candidate.stage}</span></div></div>
              <Link className="secondary-button edit-candidate-link" href={`/candidates/${encodeURIComponent(candidate.id)}/edit`}>Editar candidatura</Link>
            </section>
            <div className="detail-grid">
              <section className="panel section-card"><h2 className="section-title">Información del perfil</h2><div className="fields">
                <div><div className="field-label">Nombre completo</div><div className="field-value">{candidate.full_name}</div></div>
                <div><div className="field-label">Puesto</div><div className="field-value">{candidate.position}</div></div>
                <div><div className="field-label">Correo electrónico</div><div className="field-value"><a href={`mailto:${candidate.email}`}>{candidate.email}</a></div></div>
                <div><div className="field-label">Teléfono</div><div className="field-value"><a href={`tel:${candidate.phone}`}>{candidate.phone}</a></div></div>
                <div><div className="field-label">LinkedIn</div><div className="field-value">{candidate.linkedin_url ? <a href={candidate.linkedin_url} target="_blank" rel="noreferrer">Ver perfil ↗</a> : "No indicado"}</div></div>
                <div><div className="field-label">Currículum</div><div className="field-value">{candidate.cv_url ? <a href={candidate.cv_url} target="_blank" rel="noreferrer">Abrir CV ↗</a> : "No indicado"}</div></div>
                <div><div className="field-label">Experiencia</div><div className="field-value">{candidate.experience_years} {candidate.experience_years === 1 ? "año" : "años"}</div></div>
                <div><div className="field-label">Fecha de candidatura</div><div className="field-value">{formatCandidateDate(candidate.applied_at)}</div></div>
              </div></section>
              <aside className="panel section-card"><h2 className="section-title">Proceso de selección</h2>
                <label className="field-label" htmlFor="candidate-status">Estado actual</label>
                <select id="candidate-status" className="control select" style={{ width: "100%", marginTop: 8 }} value={candidate.status} disabled={Boolean(updatingField)} onChange={(event) => void changeCandidateField("status", event.target.value as CandidateStatus)}>
                  {statusOptions.map(([value, label]) => <option key={value} value={value}>{label}</option>)}
                </select>
                <label className="field-label" htmlFor="candidate-stage" style={{ display: "block", marginTop: 20 }}>Etapa actual</label>
                <select id="candidate-stage" className="control select" style={{ width: "100%", marginTop: 8 }} value={candidate.stage} disabled={Boolean(updatingField)} onChange={(event) => void changeCandidateField("stage", event.target.value as CandidateStage)}>
                  {stageOptions.map(([value, label]) => <option key={value} value={value}>{label}</option>)}
                </select>
                {updatingField && <p className="subtle" role="status">Guardando cambio…</p>}
                {updateFeedback && <p className="feedback-success" role="status">{updateFeedback}</p>}
                {updateError && <p className="feedback-error" role="alert">{updateError}</p>}
                <div style={{ marginTop: 24 }}><div className="field-label">Última actualización</div><div className="field-value">{formatCandidateDate(candidate.updated_at)}</div></div>
              </aside>
            </div>
            <section className="panel section-card notes-card">
              <h2 className="section-title">Notas internas <span className="count">({notes.length})</span></h2>
              <form className="note-form" onSubmit={submitNote}>
                <label className="field-label" htmlFor="new-note">Añadir nota para el equipo</label>
                <textarea id="new-note" className="control note-input" value={noteContent} onChange={(event) => setNoteContent(event.target.value)} placeholder="Escribe una nota interna sobre esta candidatura…" rows={3} maxLength={2000} />
                <button className="primary-button" type="submit" disabled={noteSaving || Boolean(deletingNoteId) || !noteContent.trim()}>{noteSaving ? "Guardando…" : "Añadir nota"}</button>
              </form>
              {noteFeedback && <p className="feedback-success" role="status">{noteFeedback}</p>}
              {noteError && <p className="feedback-error" role="alert">{noteError}</p>}
              {notesLoading ? <p className="state" role="status"><span className="loading-dot" />Cargando notas…</p> : notesError ? <div className="state error" role="alert"><p>No se pudieron cargar las notas.</p><p>{notesError}</p><button type="button" className="control" onClick={() => setNotesReloadKey((value) => value + 1)}>Volver a intentar</button></div> : notes.length === 0 ? <p className="state">Todavía no hay notas para esta candidatura.</p> : (
                <ul className="notes-list">{notes.map((note) => <li className="note-item" key={note.id}><div><p className="note-content">{note.content}</p><time className="subtle" dateTime={note.created_at}>{formatCandidateDate(note.created_at)}</time></div><button className="delete-button" type="button" disabled={Boolean(deletingNoteId)} onClick={() => void removeNote(note.id)} aria-label={`Eliminar nota del ${formatCandidateDate(note.created_at)}`}>{deletingNoteId === note.id ? "Eliminando…" : "Eliminar"}</button></li>)}</ul>
              )}
            </section>
          </>
        ) : null}
      </main>
    </div>
  );
}
