"use client";

import Link from "next/link";
import { useEffect, useState } from "react";
import LogoutButton from "@/components/LogoutButton";
import { getInventoryOrders, InventoryApiError } from "@/lib/inventory";
import type { InventoryOrder } from "@/types/inventory";

function formatDate(value: string): string {
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return value;
  return new Intl.DateTimeFormat("es-ES", { dateStyle: "medium", timeStyle: "short" }).format(date);
}

export default function InventoryOrdersPage() {
  const [orders, setOrders] = useState<InventoryOrder[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [reloadKey, setReloadKey] = useState(0);

  useEffect(() => {
    let active = true;
    async function loadOrders() {
      setLoading(true);
      setError("");
      try {
        const result = await getInventoryOrders();
        if (active) setOrders(result);
      } catch (cause) {
        if (active) setError(cause instanceof InventoryApiError ? cause.message : "No se pudo cargar el historial de órdenes. Inténtalo de nuevo.");
      } finally {
        if (active) setLoading(false);
      }
    }
    void loadOrders();
    return () => { active = false; };
  }, [reloadKey]);

  return (
    <div className="shell">
      <header className="topbar">
        <Link className="brand" href="/">nexova<span>.</span></Link>
        <nav className="nav" aria-label="Navegación del backoffice">
          <Link href="/">Candidaturas</Link>
          <Link href="/backoffice/inventory/products">Activos</Link>
          <Link href="/backoffice/inventory/orders/inbound">Entrada</Link>
          <Link href="/backoffice/inventory/orders/outbound">Salida</Link>
          <Link href="/backoffice/inventory/orders" aria-current="page">Historial</Link>
        </nav>
        <div className="user"><span className="user-name">Operaciones</span><LogoutButton /></div>
      </header>

      <main className="container">
        <div className="title-row inventory-title-row">
          <div>
            <p className="eyebrow">Backoffice / Operaciones</p>
            <h1>Historial de movimientos</h1>
            <p className="lead">Consulta las entradas y salidas registradas de activos.</p>
          </div>
          {!loading && !error && <span className="count">{orders.length} movimientos</span>}
        </div>

        <section className="panel inventory-panel" aria-label="Historial de movimientos de activos">
          {loading && <div className="state" role="status"><span className="loading-dot" aria-hidden="true" />Cargando historial…</div>}
          {!loading && error && <div className="state inventory-error-state" role="alert"><p className="error">{error}</p><button className="secondary-button" type="button" onClick={() => setReloadKey((value) => value + 1)}>Reintentar</button></div>}
          {!loading && !error && orders.length === 0 && <div className="state" role="status">Todavía no hay movimientos registrados.</div>}
          {!loading && !error && orders.length > 0 && (
            <div className="table-wrap inventory-table-wrap" tabIndex={0} aria-label="Tabla desplazable del historial">
              <table className="candidate-table inventory-table">
                <caption className="sr-only">Historial de entradas y salidas de activos Nexova</caption>
                <thead><tr>
                  <th scope="col">Tipo</th>
                  <th scope="col">Activo</th>
                  <th scope="col">Cantidad</th>
                  <th scope="col">Detalle</th>
                  <th scope="col">Oficina</th>
                  <th scope="col">Fecha de creación</th>
                  <th scope="col">Usuario (UUID)</th>
                </tr></thead>
                <tbody>
                  {orders.map((order) => (
                    <tr key={`${order.type}-${order.id}`}>
                      <td><span className={`inventory-order-type ${order.type === "entry" ? "inventory-order-type-entry" : "inventory-order-type-exit"}`}>{order.type === "entry" ? "Entrada" : "Salida"}</span></td>
                      <td><span className="inventory-asset-name">{order.asset.name}</span><br /><code className="inventory-sku">{order.asset.sku}</code></td>
                      <td>{order.quantity}</td>
                      <td>{order.type === "entry" ? `Proveedor: ${order.supplier}` : order.exit_type === "allocation" ? `Asignación a: ${order.assigned_to ?? "—"}` : "Consumo"}</td>
                      <td>{order.office}</td>
                      <td>{formatDate(order.created_at)}</td>
                      <td><code className="inventory-user-uuid">{order.user_uuid}</code></td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </section>
      </main>
    </div>
  );
}
