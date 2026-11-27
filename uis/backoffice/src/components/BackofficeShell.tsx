"use client";

import { FormEvent, useEffect, useState } from "react";

interface HealthState {
  loading: boolean;
  backendReachable: boolean;
}

interface SessionUser {
  email: string;
  role: string;
}

interface OperationalSnapshot {
  incidentsTotal: number | null;
  suppliersCount: number | null;
  inventoryCount: number | null;
}

export function BackofficeShell() {
  const [health, setHealth] = useState<HealthState>({
    loading: true,
    backendReachable: false,
  });
  const [token, setToken] = useState<string | null>(null);
  const [user, setUser] = useState<SessionUser | null>(null);
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [message, setMessage] = useState("Inicia sesión con tu cuenta interna para cargar módulos.");
  const [submitting, setSubmitting] = useState(false);
  const [snapshot, setSnapshot] = useState<OperationalSnapshot>({
    incidentsTotal: null,
    suppliersCount: null,
    inventoryCount: null,
  });

  useEffect(() => {
    let active = true;
    fetch("/api/health", { cache: "no-store" })
      .then((res) => (res.ok ? res.json() : null))
      .then((data) => {
        if (!active) return;
        setHealth({
          loading: false,
          backendReachable: Boolean(data?.backendReachable),
        });
      })
      .catch(() => {
        if (!active) return;
        setHealth({ loading: false, backendReachable: false });
      });
    return () => {
      active = false;
    };
  }, []);

  async function loadOperationalData(accessToken: string) {
    const headers = { Authorization: `Bearer ${accessToken}` };

    const [meRes, incRes, supRes, invRes] = await Promise.allSettled([
      fetch("/backend/auth/me", { headers }),
      fetch("/backend/api/incidents/summary", { headers }),
      fetch("/backend/api/suppliers", { headers }),
      fetch("/backend/inventory/products", { headers }),
    ]);

    if (meRes.status === "fulfilled" && meRes.value.ok) {
      const meData = await meRes.value.json();
      setUser({ email: meData.email, role: meData.role });
    }

    let incidentsTotal: number | null = null;
    if (incRes.status === "fulfilled" && incRes.value.ok) {
      const data = await incRes.value.json();
      if (typeof data?.total === "number") incidentsTotal = data.total;
    }

    let suppliersCount: number | null = null;
    if (supRes.status === "fulfilled" && supRes.value.ok) {
      const data = await supRes.value.json();
      if (Array.isArray(data)) suppliersCount = data.length;
      else if (Array.isArray(data?.items)) suppliersCount = data.items.length;
    }

    let inventoryCount: number | null = null;
    if (invRes.status === "fulfilled" && invRes.value.ok) {
      const data = await invRes.value.json();
      if (Array.isArray(data)) inventoryCount = data.length;
    }

    setSnapshot({ incidentsTotal, suppliersCount, inventoryCount });
  }

  async function handleLogin(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setSubmitting(true);
    setMessage("Verificando credenciales...");

    try {
      const body = new URLSearchParams({
        username: email.trim(),
        password,
      });

      const response = await fetch("/backend/auth/login", {
        method: "POST",
        headers: { "Content-Type": "application/x-www-form-urlencoded" },
        body,
      });

      if (!response.ok) {
        setMessage("Credenciales incorrectas o servicio no disponible.");
        return;
      }

      const data = await response.json();
      if (!data?.access_token) {
        setMessage("No se recibió token de acceso.");
        return;
      }

      setToken(data.access_token);
      setPassword("");
      setMessage("Sesión iniciada en memoria. Datos sincronizados con la API interna.");
      await loadOperationalData(data.access_token);
    } catch {
      setMessage("No se pudo conectar con la API interna.");
    } finally {
      setSubmitting(false);
    }
  }

  function handleLogout() {
    setToken(null);
    setUser(null);
    setSnapshot({ incidentsTotal: null, suppliersCount: null, inventoryCount: null });
    setMessage("Sesión cerrada.");
  }

  return (
    <div className="layout">
      <aside className="sidebar">
        <div className="sidebar-brand">
          Nexova Backoffice
          <small>Operaciones internas</small>
        </div>
        <nav className="sidebar-nav" aria-label="Navegación interna">
          <a href="#resumen" className="active">
            Panel general
          </a>
          <a href="#acceso">Autenticación</a>
          <a href="#modulos">Módulos activos</a>
          <a href="/backend/docs" target="_blank" rel="noreferrer">
            API Docs (FastAPI)
          </a>
        </nav>
      </aside>

      <main className="content">
        <header className="topbar" id="resumen">
          <div>
            <h1>Panel de operaciones internas</h1>
            <p className="subtitle">
              Conectado internamente al servicio FastAPI mediante red Docker.
            </p>
          </div>
          {health.loading ? (
            <span className="badge badge-warn">Comprobando backend...</span>
          ) : health.backendReachable ? (
            <span className="badge badge-ok">Backend conectado</span>
          ) : (
            <span className="badge badge-err">Backend sin conexión</span>
          )}
        </header>

        <section className="grid" aria-label="Resumen operativo">
          <article className="card">
            <h2>Incidencias</h2>
            <div className="metric">
              {snapshot.incidentsTotal !== null ? snapshot.incidentsTotal : "—"}
            </div>
            <p>Total de incidencias registradas en el gestor interno.</p>
          </article>

          <article className="card">
            <h2>Proveedores</h2>
            <div className="metric">
              {snapshot.suppliersCount !== null ? snapshot.suppliersCount : "—"}
            </div>
            <p>Registros disponibles en el directorio de proveedores.</p>
          </article>

          <article className="card">
            <h2>Inventario</h2>
            <div className="metric">
              {snapshot.inventoryCount !== null ? snapshot.inventoryCount : "—"}
            </div>
            <p>Activos cargados en el módulo de inventario (Supabase).</p>
          </article>
        </section>

        <section id="acceso" className="card" style={{ marginBottom: "1.25rem" }}>
          <h2>Acceso de personal interno</h2>
          {token ? (
            <div>
              <p>
                Sesión activa{user ? ` como ${user.email} (${user.role})` : ""}. El token se
                conserva únicamente en memoria de página.
              </p>
              <div style={{ display: "flex", gap: "0.75rem", flexWrap: "wrap" }}>
                <button
                  type="button"
                  className="btn btn-primary"
                  onClick={() => loadOperationalData(token)}
                >
                  Actualizar métricas
                </button>
                <button type="button" className="btn btn-secondary" onClick={handleLogout}>
                  Cerrar sesión
                </button>
              </div>
            </div>
          ) : (
            <form onSubmit={handleLogin} className="form-grid">
              <div className="field">
                <label htmlFor="bo-email">Email corporativo</label>
                <input
                  id="bo-email"
                  type="email"
                  required
                  autoComplete="username"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  placeholder="usuario@nexova.com"
                />
              </div>
              <div className="field">
                <label htmlFor="bo-password">Contraseña</label>
                <input
                  id="bo-password"
                  type="password"
                  required
                  autoComplete="current-password"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                />
              </div>
              <div>
                <button type="submit" className="btn btn-primary" disabled={submitting}>
                  {submitting ? "Entrando..." : "Iniciar sesión"}
                </button>
              </div>
            </form>
          )}
          <p className="status-msg" role="status" aria-live="polite">
            {message}
          </p>
        </section>

        <section id="modulos" className="card">
          <h2>Módulos y rutas disponibles</h2>
          <p>
            Todas las llamadas del navegador pasan por el proxy interno de Next.js hacia el
            servicio Docker del backend sin depender de direcciones locales fijas.
          </p>
          <ul className="list">
            <li>
              <strong>Autenticación y perfiles:</strong> /auth/login, /auth/me, /users, /profiles
            </li>
            <li>
              <strong>Gestor de incidencias:</strong> /api/incidents, /api/incidents/summary y
              análisis CSV
            </li>
            <li>
              <strong>Proveedores:</strong> /api/suppliers
            </li>
            <li>
              <strong>Inventario:</strong> /inventory/products
            </li>
          </ul>
        </section>
      </main>
    </div>
  );
}
