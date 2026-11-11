"use client";

import Link from "next/link";
import { useRouter, useSearchParams } from "next/navigation";
import { FormEvent, Suspense, useState } from "react";
import { resetPassword } from "@/lib/auth";

function ResetPasswordForm() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const token = searchParams.get("token") ?? "";
  const [newPassword, setNewPassword] = useState("");
  const [confirmation, setConfirmation] = useState("");
  const [error, setError] = useState("");
  const [isSubmitting, setIsSubmitting] = useState(false);

  async function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setError("");
    if (!token) {
      setError("Falta el token de recuperación. Solicita un enlace nuevo.");
      return;
    }
    if (newPassword !== confirmation) {
      setError("Las contraseñas no coinciden.");
      return;
    }
    setIsSubmitting(true);
    try {
      await resetPassword(token, newPassword);
      router.replace("/login?passwordReset=success");
    } catch (cause) {
      setError(cause instanceof Error ? cause.message : "El enlace no es válido o ha caducado. Solicita uno nuevo.");
    } finally {
      setIsSubmitting(false);
    }
  }

  return (
    <main className="auth-page">
      <section className="auth-card" aria-labelledby="reset-title">
        <Link className="brand auth-brand" href="/">nexova<span>.</span></Link>
        <p className="eyebrow">People &amp; Talent</p>
        <h1 id="reset-title">Establece una nueva contraseña</h1>
        <p className="lead">Elige una contraseña nueva para tu cuenta.</p>
        <form className="auth-form" onSubmit={handleSubmit}>
          <div className="form-field">
            <label htmlFor="new-password">Nueva contraseña</label>
            <input className="control" id="new-password" type="password" autoComplete="new-password" minLength={8} maxLength={128} required value={newPassword} onChange={(event) => setNewPassword(event.target.value)} />
          </div>
          <div className="form-field">
            <label htmlFor="confirmation">Confirmar contraseña</label>
            <input className="control" id="confirmation" type="password" autoComplete="new-password" required value={confirmation} onChange={(event) => setConfirmation(event.target.value)} />
          </div>
          {error && <p className="feedback-error" role="alert">{error}</p>}
          <button className="primary-button auth-submit" type="submit" disabled={isSubmitting}>{isSubmitting ? "Actualizando…" : "Cambiar contraseña"}</button>
        </form>
        <p className="auth-switch"><Link href="/forgot-password">Solicitar otro enlace</Link></p>
      </section>
    </main>
  );
}

export default function ResetPasswordPage() {
  return <Suspense fallback={<main className="auth-page"><section className="auth-card" role="status">Cargando formulario…</section></main>}><ResetPasswordForm /></Suspense>;
}
