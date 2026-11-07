"use client";

import Link from "next/link";
import { useState, type FormEvent } from "react";
import { createCandidate, replaceCandidate } from "@/lib/api";
import type { Candidate, CandidateCreate } from "@/types/candidate";

type CandidateFormProps = {
  mode: "create" | "edit";
  candidate?: Candidate;
};

type FormValues = {
  full_name: string;
  email: string;
  phone: string;
  position: string;
  linkedin_url: string;
  cv_url: string;
  experience_years: string;
};

const emptyValues: FormValues = {
  full_name: "",
  email: "",
  phone: "",
  position: "",
  linkedin_url: "",
  cv_url: "",
  experience_years: "",
};

function initialValues(candidate?: Candidate): FormValues {
  if (!candidate) return emptyValues;
  return {
    full_name: candidate.full_name,
    email: candidate.email,
    phone: candidate.phone,
    position: candidate.position,
    linkedin_url: candidate.linkedin_url ?? "",
    cv_url: candidate.cv_url ?? "",
    experience_years: String(candidate.experience_years),
  };
}

export default function CandidateForm({ mode, candidate }: CandidateFormProps) {
  const [values, setValues] = useState<FormValues>(() => initialValues(candidate));
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState("");
  const [success, setSuccess] = useState("");
  const [savedCandidateId, setSavedCandidateId] = useState("");
  const [savedCandidate, setSavedCandidate] = useState<Candidate | null>(null);

  function updateField(field: keyof FormValues, value: string) {
    setValues((current) => ({ ...current, [field]: value }));
    setSuccess("");
    setSavedCandidateId("");
    setSavedCandidate(null);
  }

  async function submit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setError("");
    setSuccess("");
    setSavedCandidateId("");

    if (!event.currentTarget.checkValidity()) {
      event.currentTarget.reportValidity();
      setError("Revisa los campos obligatorios y los formatos indicados.");
      return;
    }

    const name = values.full_name.trim();
    const email = values.email.trim();
    const phone = values.phone.trim();
    const position = values.position.trim();
    const years = Number(values.experience_years);

    if (!name || !email || !phone || !position || values.experience_years === "") {
      setError("Completa todos los campos obligatorios antes de continuar.");
      return;
    }
    if (!Number.isFinite(years) || years < 0) {
      setError("Los años de experiencia deben ser un número igual o mayor que cero.");
      return;
    }

    const payload: CandidateCreate = {
      full_name: name,
      email,
      phone,
      position,
      linkedin_url: values.linkedin_url.trim() || null,
      cv_url: values.cv_url.trim() || null,
      experience_years: years,
    };

    setSubmitting(true);
    try {
      const saved = mode === "create"
        ? await createCandidate(payload)
        : await replaceCandidate(candidate!.id, payload);
      setSuccess(mode === "create" ? "La candidatura se registró correctamente." : "Los datos de la candidatura se actualizaron correctamente.");
      setSavedCandidateId(saved.id);
      if (mode === "edit") {
        setSavedCandidate(saved);
        setValues(initialValues(saved));
      } else {
        setValues(emptyValues);
      }
    } catch (cause) {
      setError(cause instanceof Error ? cause.message : "No se pudo guardar la candidatura. Inténtalo de nuevo.");
    } finally {
      setSubmitting(false);
    }
  }

  const isCreate = mode === "create";

  return (
    <div className="shell">
      <header className="topbar">
        <Link className="brand" href="/">nexova<span>.</span></Link>
        <nav className="nav" aria-label="Navegación principal"><Link href="/" aria-current="page">Candidaturas</Link><a href="/#equipo">Equipo</a><a href="/#informes">Informes</a></nav>
        <div className="user"><span className="avatar" aria-hidden="true">PT</span><span className="user-name">People &amp; Talent</span></div>
      </header>
      <main className="container">
        <Link className="back" href={isCreate ? "/" : `/candidates/${encodeURIComponent(candidate!.id)}`}>← {isCreate ? "Volver al pipeline" : "Volver a la candidatura"}</Link>
        <div className="form-heading"><p className="eyebrow">People &amp; Talent / Selección</p><h1>{isCreate ? "Registrar candidatura" : "Editar candidatura"}</h1><p className="lead">{isCreate ? "Añade un nuevo perfil al pipeline de selección de Nexova." : `Actualiza los datos de ${(savedCandidate ?? candidate)?.full_name ?? "la candidatura"}.`}</p></div>
        <form className="panel candidate-form" onSubmit={submit} noValidate>
          <h2 className="section-title">Datos del perfil</h2>
          <div className="form-grid">
            <div className="form-field"><label htmlFor="full_name">Nombre completo <span aria-hidden="true">*</span></label><input className="control" id="full_name" name="full_name" autoComplete="name" required value={values.full_name} onChange={(event) => updateField("full_name", event.target.value)} /></div>
            <div className="form-field"><label htmlFor="email">Correo electrónico <span aria-hidden="true">*</span></label><input className="control" id="email" name="email" type="email" autoComplete="email" required value={values.email} onChange={(event) => updateField("email", event.target.value)} /></div>
            <div className="form-field"><label htmlFor="phone">Teléfono <span aria-hidden="true">*</span></label><input className="control" id="phone" name="phone" type="tel" autoComplete="tel" required value={values.phone} onChange={(event) => updateField("phone", event.target.value)} /></div>
            <div className="form-field"><label htmlFor="position">Puesto <span aria-hidden="true">*</span></label><input className="control" id="position" name="position" required value={values.position} onChange={(event) => updateField("position", event.target.value)} /></div>
            <div className="form-field"><label htmlFor="experience_years">Años de experiencia <span aria-hidden="true">*</span></label><input className="control" id="experience_years" name="experience_years" type="number" min="0" step="0.5" required value={values.experience_years} onChange={(event) => updateField("experience_years", event.target.value)} /></div>
            <div className="form-field"><label htmlFor="linkedin_url">Perfil de LinkedIn</label><input className="control" id="linkedin_url" name="linkedin_url" type="url" placeholder="https://linkedin.com/in/…" value={values.linkedin_url} onChange={(event) => updateField("linkedin_url", event.target.value)} /></div>
            <div className="form-field form-field-wide"><label htmlFor="cv_url">Enlace al currículum</label><input className="control" id="cv_url" name="cv_url" type="url" placeholder="https://…" value={values.cv_url} onChange={(event) => updateField("cv_url", event.target.value)} /></div>
          </div>
          <p className="form-required">* Campos obligatorios</p>
          {error && <p className="feedback-error" role="alert">{error}</p>}
          {success && <div className="feedback-success" role="status"><p>{success}</p>{savedCandidateId && <Link className="view-link" href={`/candidates/${encodeURIComponent(savedCandidateId)}`}>Ver candidatura →</Link>}</div>}
          <div className="form-actions"><Link className="secondary-button" href={isCreate ? "/" : `/candidates/${encodeURIComponent(candidate!.id)}`}>Cancelar</Link><button className="primary-button" type="submit" disabled={submitting}>{submitting ? "Guardando…" : isCreate ? "Registrar candidatura" : "Guardar cambios"}</button></div>
        </form>
      </main>
    </div>
  );
}
