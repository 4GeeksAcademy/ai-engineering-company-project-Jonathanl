"use client";

import Link from "next/link";
import { useEffect, useMemo, useState } from "react";
import LogoutButton from "@/components/LogoutButton";
import { getAssets, InventoryApiError } from "@/lib/inventory";
import type { Asset, AssetCategory, NexovaOffice } from "@/types/inventory";

const categoryLabels: Record<AssetCategory, string> = {
  hardware: "Hardware",
  peripherals: "Periféricos",
  office_supplies: "Material de oficina",
  training_materials: "Material de formación",
};

// Umbrales visuales de stock: 0 = sin stock (rojo), 1–5 = bajo (ámbar), 6 o más = saludable (verde).
function getStockStatus(stock: number): { label: string; className: string } {
  if (stock <= 0) return { label: "Sin stock", className: "inventory-stock inventory-stock-out" };
  if (stock <= 5) return { label: "Stock bajo", className: "inventory-stock inventory-stock-low" };
  return { label: "Stock saludable", className: "inventory-stock inventory-stock-healthy" };
}

export default function InventoryProductsPage() {
  const [assets, setAssets] = useState<Asset[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [search, setSearch] = useState("");
  const [officeFilter, setOfficeFilter] = useState<"" | NexovaOffice>("");
  const [categoryFilter, setCategoryFilter] = useState<"" | AssetCategory>("");
  const [reloadKey, setReloadKey] = useState(0);

  useEffect(() => {
    let active = true;
    async function load() {
      setLoading(true);
      setError("");
      try {
        const result = await getAssets();
        if (active) setAssets(result);
      } catch (cause) {
        if (active) {
          setError(cause instanceof InventoryApiError
            ? cause.message
            : "No se pudieron cargar los activos. Inténtalo de nuevo.");
        }
      } finally {
        if (active) setLoading(false);
      }
    }
    void load();
    return () => { active = false; };
  }, [reloadKey]);

  const filteredAssets = useMemo(() => {
    const query = search.trim().toLocaleLowerCase("es");
    return assets.filter((asset) => {
      const matchesQuery = !query || asset.name.toLocaleLowerCase("es").includes(query) || asset.sku.toLocaleLowerCase("es").includes(query);
      return matchesQuery && (!officeFilter || asset.office === officeFilter) && (!categoryFilter || asset.category === categoryFilter);
    });
  }, [assets, categoryFilter, officeFilter, search]);

  const lowStockCount = assets.filter((asset) => asset.current_stock > 0 && asset.current_stock <= 5).length;
  const outOfStockCount = assets.filter((asset) => asset.current_stock <= 0).length;

  return (
    <div className="shell">
      <header className="topbar">
        <Link className="brand" href="/">nexova<span>.</span></Link>
        <nav className="nav" aria-label="Navegación del backoffice">
          <Link href="/">Candidaturas</Link>
          <Link href="/backoffice/inventory/products" aria-current="page">Activos</Link>
          <Link href="/backoffice/inventory/orders/inbound">Entrada</Link>
          <Link href="/backoffice/inventory/orders/outbound">Salida</Link>
          <Link href="/backoffice/inventory/orders">Historial</Link>
        </nav>
        <div className="user"><span className="user-name">Operaciones</span><LogoutButton /></div>
      </header>

      <main className="container">
        <div className="title-row inventory-title-row">
          <div>
            <p className="eyebrow">Backoffice / Operaciones</p>
            <h1>Activos y stock</h1>
            <p className="lead">Consulta las existencias actuales por activo y oficina.</p>
          </div>
          {!loading && !error && <span className="count">{filteredAssets.length} de {assets.length} activos</span>}
        </div>

        {!loading && !error && (
          <section className="inventory-summary" aria-label="Resumen del inventario">
            <article className="panel inventory-summary-card"><span>Total de activos</span><strong>{assets.length}</strong></article>
            <article className="panel inventory-summary-card"><span>Stock bajo</span><strong className="inventory-summary-low">{lowStockCount}</strong></article>
            <article className="panel inventory-summary-card"><span>Sin stock</span><strong className="inventory-summary-out">{outOfStockCount}</strong></article>
          </section>
        )}

        <section className="panel inventory-panel" aria-label="Inventario de activos">
          <div className="filters inventory-filters" aria-label="Filtros de activos">
            <label className="sr-only" htmlFor="asset-search">Buscar por nombre o SKU</label>
            <input
              id="asset-search"
              className="control search"
              type="search"
              placeholder="Buscar activo o SKU…"
              value={search}
              onChange={(event) => setSearch(event.target.value)}
            />
            <label className="sr-only" htmlFor="office-filter">Filtrar por oficina</label>
            <select id="office-filter" className="control select" value={officeFilter} onChange={(event) => setOfficeFilter(event.target.value as "" | NexovaOffice)}>
              <option value="">Todas las oficinas</option>
              <option value="Valencia">Valencia</option>
              <option value="Miami">Miami</option>
            </select>
            <label className="sr-only" htmlFor="category-filter">Filtrar por categoría</label>
            <select id="category-filter" className="control select" value={categoryFilter} onChange={(event) => setCategoryFilter(event.target.value as "" | AssetCategory)}>
              <option value="">Todas las categorías</option>
              {Object.entries(categoryLabels).map(([value, label]) => <option key={value} value={value}>{label}</option>)}
            </select>
          </div>

          {loading && <div className="state" role="status"><span className="loading-dot" aria-hidden="true" />Cargando activos…</div>}
          {!loading && error && (
            <div className="state inventory-error-state" role="alert">
              <p className="error">{error}</p>
              <button className="secondary-button" type="button" onClick={() => setReloadKey((value) => value + 1)}>Reintentar</button>
            </div>
          )}
          {!loading && !error && filteredAssets.length === 0 && (
            <div className="state" role="status">{assets.length === 0 ? "No hay activos registrados." : "No hay activos que coincidan con los filtros."}</div>
          )}
          {!loading && !error && filteredAssets.length > 0 && (
            <div className="table-wrap inventory-table-wrap" tabIndex={0} aria-label="Tabla desplazable de activos">
              <table className="candidate-table inventory-table">
                <caption className="sr-only">Activos Nexova y stock actual por oficina</caption>
                <thead><tr>
                  <th scope="col">Activo</th>
                  <th scope="col">SKU</th>
                  <th scope="col">Categoría</th>
                  <th scope="col">Oficina</th>
                  <th scope="col">Stock actual</th>
                  <th scope="col">Acciones</th>
                </tr></thead>
                <tbody>
                  {filteredAssets.map((asset) => {
                    const stockStatus = getStockStatus(asset.current_stock);
                    return (
                      <tr key={asset.id}>
                        <td><span className="inventory-asset-name">{asset.name}</span></td>
                        <td><code className="inventory-sku">{asset.sku}</code></td>
                        <td>{categoryLabels[asset.category]}</td>
                        <td>{asset.office}</td>
                        <td><span className={stockStatus.className} aria-label={`${asset.current_stock} unidades, ${stockStatus.label}`}><strong>{asset.current_stock}</strong><span>{stockStatus.label}</span></span></td>
                        <td>
                          <div className="inventory-actions">
                            <Link className="inventory-action-link" href={`/backoffice/inventory/orders/inbound?assetId=${asset.id}`}>Registrar entrada</Link>
                            <Link className="inventory-action-link" href={`/backoffice/inventory/orders/outbound?assetId=${asset.id}`}>Registrar salida</Link>
                          </div>
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
          )}
        </section>
      </main>
    </div>
  );
}
