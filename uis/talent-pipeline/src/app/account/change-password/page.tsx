"use client";

import Link from "next/link";
import { FormEvent, useState } from "react";
import LogoutButton from "@/components/LogoutButton";
import { AuthRequestError, changePassword } from "@/lib/auth";

export default function ChangePasswordPage() {
  const [currentPassword, setCurrentPassword] = useState("");
  const [newPassword, setNewPassword] = useState("");
  const [confirmation, setConfirmation] = useState("");
  const [error, setError] = useState("");
  const [success, setSuccess] = useState("");
  const [isSubmitting, setIsSubmitting] = useState(false);

  async function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setError("");
    setSuccess("");
    if (newPassword !== confirmation) {
      setError("La nueva contraseña y su confirmación no coinciden.");
      return;
    }
    setIsSubmitting(true);
    try {
      await changePassword(currentPassword, newPassword);
      setCurrentPassword("");
      setNewPassword("");
      setConfirmation("");
      setSuccess("Tu contraseña se actualizó correctamente.");
    } catch (cause) {
      setError(cause instanceof AuthRequestError ? cause.message : "No se pudo actualizar la contraseña. Inténtalo de nuevo.");
    } finally {
      setIsSubmitting(false);
    }
  }

  return (
    <div className="shell">
      <header className="topbar">
        <Link className="brand" href="/">nexova<span>.</span></Link>
        <nav className="nav" aria-label="Navegación principal">
          <Link href="/">Candidaturas</Link>
          <Link href="/account/profile">Mi perfil</Link>
          <Link href="/account/change-password" aria-current="page">Contraseña</Link>
        </nav>
        <div className="user"><span className="user-name">Cuenta</span><LogoutButton /></div>
      </header>
      <main className="container">
        <div className="title-row form-heading">
          <div><p className="eyebrow">Cuenta / Seguridad</p><h1>Cambiar contraseña</h1><p className="lead">Confirma tu contraseña actual para establecer una nueva.</p></div>
        </div>
        <section className="panel candidate-form profile-card" aria-labelledby="change-password-title">
          <h2 id="change-password-title">Seguridad de la cuenta</h2>
          <form className="auth-form profile-form" onSubmit={handleSubmit}>
            <div className="form-field"><label htmlFor="current-password">Contraseña actual</label><input className="control" id="current-password" type="password" autoComplete="current-password" required value={currentPassword} onChange={(event) => setCurrentPassword(event.target.value)} /></div>
            <div className="form-field"><label htmlFor="new-password">Nueva contraseña</label><input className="control" id="new-password" type="password" autoComplete="new-password" minLength={8} maxLength={128} required value={newPassword} onChange={(event) => setNewPassword(event.target.value)} /></div>
            <div className="form-field"><label htmlFor="confirmation">Confirmar nueva contraseña</label><input className="control" id="confirmation" type="password" autoComplete="new-password" required value={confirmation} onChange={(event) => setConfirmation(event.target.value)} /></div>
            {error && <p className="feedback-error" role="alert">{error}</p>}
            {success && <p className="feedback-success" role="status">{success}</p>}
            <button className="primary-button auth-submit profile-submit" type="submit" disabled={isSubmitting}>{isSubmitting ? "Actualizando…" : "Actualizar contraseña"}</button>
          </form>
        </section>
      </main>
    </div>
  );
}
