"use client";

import { usePathname, useRouter } from "next/navigation";
import { useEffect, useState } from "react";
import { AUTH_TOKEN_KEY } from "@/lib/auth";

const PUBLIC_PATHS = new Set(["/login", "/register"]);
type GuardState = "checking" | "authenticated" | "unavailable";

export default function AuthGuard({ children }: Readonly<{ children: React.ReactNode }>) {
  const pathname = usePathname();
  const router = useRouter();
  const [state, setState] = useState<GuardState>("checking");
  const [verifiedPath, setVerifiedPath] = useState("");
  const [retry, setRetry] = useState(0);

  useEffect(() => {
    if (PUBLIC_PATHS.has(pathname)) {
      setState("authenticated");
      return;
    }

    let active = true;
    const token = localStorage.getItem(AUTH_TOKEN_KEY);
    if (!token) {
      router.replace("/login");
      return;
    }

    setState("checking");
    fetch("/nexova-api/auth/me", {
      headers: { Authorization: `Bearer ${token}` },
      cache: "no-store",
    })
      .then((response) => {
        if (!active) return;
        if (response.status === 401) {
          localStorage.removeItem(AUTH_TOKEN_KEY);
          router.replace("/login");
          return;
        }
        if (!response.ok) {
          setState("unavailable");
          setVerifiedPath(pathname);
          return;
        }
        setState("authenticated");
        setVerifiedPath(pathname);
      })
      .catch(() => {
        if (active) {
          setState("unavailable");
          setVerifiedPath(pathname);
        }
      });

    return () => { active = false; };
  }, [pathname, retry, router]);

  if (PUBLIC_PATHS.has(pathname)) return children;
  if (verifiedPath === pathname && state === "authenticated") return children;
  if (verifiedPath === pathname && state === "unavailable") {
    return (
      <main className="auth-page">
        <section className="auth-card" role="alert">
          <p className="eyebrow">Sesión</p>
          <h1>No se pudo verificar tu sesión</h1>
          <p className="lead">Comprueba que la API está disponible e inténtalo de nuevo.</p>
          <button className="primary-button auth-submit" type="button" onClick={() => setRetry((value) => value + 1)}>Reintentar</button>
        </section>
      </main>
    );
  }

  return <main className="container"><section className="panel state" role="status">Verificando sesión…</section></main>;
}
