"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import { FormEvent, useEffect, useState } from "react";
import { AuthRequestError, login } from "@/lib/auth";

export default function LoginPage() {
  const router = useRouter();
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState("");
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [passwordResetSuccess, setPasswordResetSuccess] = useState(false);

  useEffect(() => {
    setPasswordResetSuccess(new URLSearchParams(window.location.search).get("passwordReset") === "success");
  }, []);

  async function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setError("");
    setIsSubmitting(true);
    try {
      await login(email.trim(), password);
      router.replace("/");
    } catch (cause) {
      setError(cause instanceof AuthRequestError ? cause.message : "No se pudo conectar con el servicio. Inténtalo de nuevo.");
    } finally {
      setIsSubmitting(false);
    }
  }

  return (
    <main className="auth-page">
      <section className="auth-card" aria-labelledby="login-title">
        <Link className="brand auth-brand" href="/">nexova<span>.</span></Link>
        <p className="eyebrow">People &amp; Talent</p>
        <h1 id="login-title">Inicia sesión</h1>
        <p className="lead">Accede a tu espacio de trabajo.</p>
        {passwordResetSuccess && <p className="feedback-success" role="status">Contraseña actualizada. Ya puedes iniciar sesión.</p>}
        <form className="auth-form" onSubmit={handleSubmit}>
          <div className="form-field">
            <label htmlFor="email">Email</label>
            <input className="control" id="email" type="email" autoComplete="email" required value={email} onChange={(event) => setEmail(event.target.value)} />
          </div>
          <div className="form-field">
            <label htmlFor="password">Contraseña</label>
            <input className="control" id="password" type="password" autoComplete="current-password" required value={password} onChange={(event) => setPassword(event.target.value)} />
          </div>
          <p className="auth-switch auth-forgot-link"><Link href="/forgot-password">¿Olvidaste tu contraseña?</Link></p>
          {error && <p className="feedback-error" role="alert">{error}</p>}
          <button className="primary-button auth-submit" type="submit" disabled={isSubmitting}>{isSubmitting ? "Accediendo…" : "Iniciar sesión"}</button>
        </form>
        <p className="auth-switch">¿Aún no tienes cuenta? <Link href="/register">Regístrate</Link></p>
      </section>
    </main>
  );
}
