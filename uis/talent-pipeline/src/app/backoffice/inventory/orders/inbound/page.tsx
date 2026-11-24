"use client";

import Link from "next/link";
import { useEffect, useState, type FormEvent } from "react";
import LogoutButton from "@/components/LogoutButton";
import { createAssetEntry, getAssets, InventoryApiError } from "@/lib/inventory";
import type { Asset, NexovaOffice } from "@/types/inventory";

const offices: NexovaOffice[] = ["Valencia", "Miami"];

export default function InventoryInboundPage() {
  const [assets, setAssets] = useState<Asset[]>([]);
  const [assetsLoading, setAssetsLoading] = useState(true);
  const [assetsError, setAssetsError] = useState("");
  const [assetId, setAssetId] = useState("");
  const [quantity, setQuantity] = useState("");
  const [supplier, setSupplier] = useState("");
  const [office, setOffice] = useState<NexovaOffice>("Valencia");
  const [submitting, setSubmitting] = useState(false);
  const [submitError, setSubmitError] = useState("");
  const [success, setSuccess] = useState("");
  const [reloadKey, setReloadKey] = useState(0);

  useEffect(() => {
    let active = true;
    async function loadAssets() {
      setAssetsLoading(true);
      setAssetsError("");
      try {
        const result = await getAssets();
        if (!active) return;
        setAssets(result);
        const requestedAssetId = new URLSearchParams(window.location.search).get("assetId");
        if (requestedAssetId && result.some((asset) => String(asset.id) === requestedAssetId)) {
          setAssetId(requestedAssetId);
          const selected = result.find((asset) => String(asset.id) === requestedAssetId);
          if (selected) setOffice(selected.office);
        }
      } catch (cause) {
        if (active) setAssetsError(cause instanceof InventoryApiError ? cause.message : "No se pudieron cargar los activos. Inténtalo de nuevo.");
      } finally {
        if (active) setAssetsLoading(false);
      }
    }
    void loadAssets();
    return () => { active = false; };
  }, [reloadKey]);

  async function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setSubmitError("");
    setSuccess("");
    const selected = assets.find((asset) => String(asset.id) === assetId);
    if (!selected) {
      setSubmitError("Selecciona un activo de la lista.");
      return;
    }

    setSubmitting(true);
    try {
      const created = await createAssetEntry({
        asset_id: Number(assetId),
        quantity: Number(quantity),
        supplier: supplier.trim(),
        office,
      });
      setSuccess(`Entrada registrada correctamente: ${created.quantity} unidades de ${created.asset.name}.`);
      setAssetId("");
      setQuantity("");
      setSupplier("");
      setOffice("Valencia");
    } catch (cause) {
      setSubmitError(cause instanceof InventoryApiError ? cause.message : "No se pudo registrar la entrada. Inténtalo de nuevo.");
    } finally {
      setSubmitting(false);
    }
  }

  return (
    <div className="shell">
      <header className="topbar">
        <Link className="brand" href="/">nexova<span>.</span></Link>
        <nav className="nav" aria-label="Navegación del backoffice">
          <Link href="/">Candidaturas</Link>
          <Link href="/backoffice/inventory/products">Activos</Link>
          <Link href="/backoffice/inventory/orders/inbound" aria-current="page">Entrada</Link>
          <Link href="/backoffice/inventory/orders/outbound">Salida</Link>
          <Link href="/backoffice/inventory/orders">Historial</Link>
        </nav>
        <div className="user"><span className="user-name">Operaciones</span><LogoutButton /></div>
      </header>

      <main className="container">
        <div className="title-row inventory-title-row">
          <div>
            <p className="eyebrow">Backoffice / Operaciones</p>
            <h1>Registrar entrada de activos</h1>
            <p className="lead">Registra una compra o entrega recibida por Nexova.</p>
          </div>
          <Link className="inventory-action-link" href="/backoffice/inventory/products">Volver a activos</Link>
        </div>

        <form className="panel candidate-form inventory-order-form" onSubmit={handleSubmit}>
          {assetsError && <div className="inventory-form-feedback" role="alert"><p className="feedback-error">{assetsError}</p><button className="secondary-button" type="button" onClick={() => setReloadKey((value) => value + 1)}>Reintentar carga de activos</button></div>}
          <div className="form-grid">
            <div className="form-field form-field-wide">
              <label htmlFor="inbound-asset">Activo <span aria-hidden="true">*</span></label>
              <select id="inbound-asset" className="control" required value={assetId} disabled={assetsLoading || Boolean(assetsError)} onChange={(event) => {
                const nextId = event.target.value;
                setAssetId(nextId);
                const selected = assets.find((asset) => String(asset.id) === nextId);
                if (selected) setOffice(selected.office);
                setSubmitError("");
                setSuccess("");
              }}>
                <option value="">{assetsLoading ? "Cargando activos…" : "Selecciona un activo"}</option>
                {assets.map((asset) => <option key={asset.id} value={asset.id}>{asset.name} · {asset.sku} · {asset.office}</option>)}
              </select>
              {assets.length === 0 && !assetsLoading && !assetsError && <span className="form-hint">No hay activos disponibles para registrar una entrada.</span>}
            </div>
            <div className="form-field">
              <label htmlFor="inbound-quantity">Cantidad recibida <span aria-hidden="true">*</span></label>
              <input id="inbound-quantity" className="control" type="number" min="1" step="1" required inputMode="numeric" value={quantity} onChange={(event) => { setQuantity(event.target.value); setSubmitError(""); setSuccess(""); }} />
            </div>
            <div className="form-field">
              <label htmlFor="inbound-office">Oficina receptora <span aria-hidden="true">*</span></label>
              <select id="inbound-office" className="control" required value={office} onChange={(event) => setOffice(event.target.value as NexovaOffice)}>
                {offices.map((item) => <option key={item} value={item}>{item}</option>)}
              </select>
            </div>
            <div className="form-field form-field-wide">
              <label htmlFor="inbound-supplier">Proveedor <span aria-hidden="true">*</span></label>
              <input id="inbound-supplier" className="control" type="text" required maxLength={200} value={supplier} placeholder="Nombre del proveedor o vendedor" onChange={(event) => { setSupplier(event.target.value); setSubmitError(""); setSuccess(""); }} />
            </div>
          </div>
          {submitError && <p className="feedback-error inventory-form-feedback" role="alert">{submitError}</p>}
          {success && <p className="feedback-success inventory-form-feedback" role="status">{success}</p>}
          <div className="form-actions">
            <Link className="secondary-button" href="/backoffice/inventory/products">Cancelar</Link>
            <button className="primary-button" type="submit" disabled={submitting || assetsLoading || Boolean(assetsError) || assets.length === 0}>{submitting ? "Registrando entrada…" : "Registrar entrada"}</button>
          </div>
        </form>
      </main>
    </div>
  );
}
