"use client";

import Link from "next/link";
import LogoutButton from "@/components/LogoutButton";
import { FormEvent, useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { AuthRequestError, getCurrentAccount, updateMyProfile } from "@/lib/auth";
import type { CurrentAccount } from "@/lib/auth";

export default function AccountProfilePage() {
  const router = useRouter();
  const [account, setAccount] = useState<CurrentAccount | null>(null);
  const [values, setValues] = useState({ name: "", phone: "", address: "" });
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState("");
  const [success, setSuccess] = useState("");

  useEffect(() => {
    let active = true;
    getCurrentAccount()
      .then((data) => {
        if (!active) return;
        setAccount(data);
        setValues({
          name: data.profile.name ?? "",
          phone: data.profile.phone ?? "",
          address: data.profile.address ?? "",
        });
      })
      .catch((cause: unknown) => {
        if (active) setError(cause instanceof AuthRequestError ? cause.message : "No se pudo cargar el perfil. Inténtalo de nuevo.");
      })
      .finally(() => { if (active) setLoading(false); });
    return () => { active = false; };
  }, []);

  async function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setError("");
    setSuccess("");
    setSaving(true);
    try {
      const profile = await updateMyProfile(values);
      setAccount((current) => current ? { ...current, profile } : current);
      setValues({ name: profile.name ?? "", phone: profile.phone ?? "", address: profile.address ?? "" });
      setSuccess("Tu perfil se actualizó correctamente.");
    } catch (cause) {
      setError(cause instanceof Error ? cause.message : "No se pudo actualizar el perfil.");
    } finally {
      setSaving(false);
    }
  }

  return (
    <div className="shell">
      <header className="topbar">
        <Link className="brand" href="/">nexova<span>.</span></Link>
        <nav className="nav" aria-label="Navegación principal">
          <Link href="/">Candidaturas</Link>
          <Link href="/account/profile" aria-current="page">Mi perfil</Link>
        </nav>
        <div className="user"><span className="user-name">Cuenta</span><LogoutButton /></div>
      </header>
      <main className="container">
        <div className="title-row form-heading">
          <div><p className="eyebrow">Cuenta / Perfil</p><h1>Mi perfil</h1><p className="lead">Consulta y actualiza tus datos de contacto.</p></div>
        </div>
        <section className="panel candidate-form profile-card" aria-labelledby="profile-title">
          {loading ? <p className="state" role="status">Cargando perfil…</p> : error && !account ? <div className="state error" role="alert"><p>{error}</p><Link className="secondary-button" href="/login">Ir a iniciar sesión</Link></div> : account && <>
            <h2 id="profile-title">Datos de la cuenta</h2>
            <p className="profile-email"><strong>Email</strong><span>{account.email}</span></p>
            <form className="auth-form profile-form" onSubmit={handleSubmit}>
              <div className="form-field"><label htmlFor="name">Nombre</label><input className="control" id="name" autoComplete="name" value={values.name} onChange={(event) => setValues((current) => ({ ...current, name: event.target.value }))} /></div>
              <div className="form-field"><label htmlFor="phone">Teléfono</label><input className="control" id="phone" type="tel" autoComplete="tel" value={values.phone} onChange={(event) => setValues((current) => ({ ...current, phone: event.target.value }))} /></div>
              <div className="form-field"><label htmlFor="address">Dirección</label><input className="control" id="address" autoComplete="street-address" value={values.address} onChange={(event) => setValues((current) => ({ ...current, address: event.target.value }))} /></div>
              {error && <p className="feedback-error" role="alert">{error}</p>}
              {success && <p className="feedback-success" role="status">{success}</p>}
              <button className="primary-button auth-submit profile-submit" type="submit" disabled={saving}>{saving ? "Guardando…" : "Guardar cambios"}</button>
            </form>
          </>}
        </section>
      </main>
    </div>
  );
}
