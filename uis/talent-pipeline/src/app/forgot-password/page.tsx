"use client";

import Link from "next/link";
import { FormEvent, useState } from "react";
import { requestPasswordReset } from "@/lib/auth";

export default function ForgotPasswordPage() {
  const [email, setEmail] = useState("");
  const [submitted, setSubmitted] = useState(false);
  const [error, setError] = useState("");
  const [isSubmitting, setIsSubmitting] = useState(false);

  async function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setError("");
    setIsSubmitting(true);
    try {
      await requestPasswordReset(email.trim());
      setSubmitted(true);
    } catch {
      setError("No se pudo enviar la solicitud. Inténtalo de nuevo más tarde.");
    } finally {
      setIsSubmitting(false);
    }
  }

  return (
    <main className="auth-page">
      <section className="auth-card" aria-labelledby="forgot-title">
        <Link className="brand auth-brand" href="/">nexova<span>.</span></Link>
        <p className="eyebrow">People &amp; Talent</p>
        <h1 id="forgot-title">Recupera tu contraseña</h1>
        {submitted ? <>
          <p className="lead" role="status">Si esa dirección está registrada, recibirás un enlace en breve.</p>
          <p className="auth-switch"><Link href="/login">Volver a iniciar sesión</Link></p>
        </> : <>
          <p className="lead">Introduce el email asociado a tu cuenta.</p>
          <form className="auth-form" onSubmit={handleSubmit}>
            <div className="form-field">
              <label htmlFor="email">Email</label>
              <input className="control" id="email" type="email" autoComplete="email" required value={email} onChange={(event) => setEmail(event.target.value)} />
            </div>
            {error && <p className="feedback-error" role="alert">{error}</p>}
            <button className="primary-button auth-submit" type="submit" disabled={isSubmitting}>{isSubmitting ? "Enviando…" : "Enviar enlace"}</button>
          </form>
          <p className="auth-switch"><Link href="/login">Volver a iniciar sesión</Link></p>
        </>}
      </section>
    </main>
  );
}
