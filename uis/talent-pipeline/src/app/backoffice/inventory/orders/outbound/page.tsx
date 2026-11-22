"use client";

import Link from "next/link";
import { useEffect, useState, type FormEvent } from "react";
import LogoutButton from "@/components/LogoutButton";
import { createAssetExit, getAsset, getAssets, InventoryApiError } from "@/lib/inventory";
import type { Asset, ExitType, NexovaOffice } from "@/types/inventory";

const offices: NexovaOffice[] = ["Valencia", "Miami"];

export default function InventoryOutboundPage() {
  const [assets, setAssets] = useState<Asset[]>([]);
  const [assetsLoading, setAssetsLoading] = useState(true);
  const [assetsError, setAssetsError] = useState("");
  const [selectedAssetId, setSelectedAssetId] = useState("");
  const [currentStock, setCurrentStock] = useState<number | null>(null);
  const [stockLoading, setStockLoading] = useState(false);
  const [stockError, setStockError] = useState("");
  const [quantity, setQuantity] = useState("");
  const [exitType, setExitType] = useState<ExitType>("allocation");
  const [assignedTo, setAssignedTo] = useState("");
  const [office, setOffice] = useState<NexovaOffice>("Valencia");
  const [submitting, setSubmitting] = useState(false);
  const [submitError, setSubmitError] = useState("");
  const [quantityError, setQuantityError] = useState("");
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
          setSelectedAssetId(requestedAssetId);
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

  useEffect(() => {
    if (!selectedAssetId) {
      setCurrentStock(null);
      setStockLoading(false);
      setStockError("");
      return;
    }
    let active = true;
    setCurrentStock(null);
    setStockLoading(true);
    setStockError("");
    getAsset(Number(selectedAssetId))
      .then((asset) => {
        if (!active) return;
        setCurrentStock(asset.current_stock);
        setOffice(asset.office);
      })
      .catch((cause: unknown) => {
        if (active) setStockError(cause instanceof InventoryApiError ? cause.message : "No se pudo consultar el stock del activo.");
      })
      .finally(() => { if (active) setStockLoading(false); });
    return () => { active = false; };
  }, [selectedAssetId]);

  const exceedsStock = currentStock !== null && quantity !== "" && Number(quantity) > currentStock;

  async function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setSubmitError("");
    setQuantityError("");
    setSuccess("");

    if (!selectedAssetId || currentStock === null || stockLoading) {
      setSubmitError("Selecciona un activo y espera a que se consulte su stock actual.");
      return;
    }
    if (exitType === "allocation" && !assignedTo.trim()) {
      setSubmitError("Indica a quién se asigna el activo.");
      return;
    }

    setSubmitting(true);
    try {
      const created = await createAssetExit({
        asset_id: Number(selectedAssetId),
        quantity: Number(quantity),
        exit_type: exitType,
        assigned_to: exitType === "allocation" ? assignedTo.trim() : null,
        office,
      });
      setSuccess(`Salida registrada correctamente: ${created.quantity} unidades de ${created.asset.name}.`);
      setSelectedAssetId("");
      setCurrentStock(null);
      setQuantity("");
      setExitType("allocation");
      setAssignedTo("");
      setOffice("Valencia");
    } catch (cause) {
      const message = cause instanceof InventoryApiError ? cause.message : "No se pudo registrar la salida. Inténtalo de nuevo.";
      if (cause instanceof InventoryApiError && cause.status === 400) setQuantityError(message);
      else setSubmitError(message);
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
          <Link href="/backoffice/inventory/orders/inbound">Entrada</Link>
          <Link href="/backoffice/inventory/orders/outbound" aria-current="page">Salida</Link>
          <Link href="/backoffice/inventory/orders">Historial</Link>
        </nav>
        <div className="user"><span className="user-name">Operaciones</span><LogoutButton /></div>
      </header>

      <main className="container">
        <div className="title-row inventory-title-row">
          <div>
            <p className="eyebrow">Backoffice / Operaciones</p>
            <h1>Registrar salida de activos</h1>
            <p className="lead">Registra una asignación a un empleado o un consumo de materiales.</p>
          </div>
          <Link className="inventory-action-link" href="/backoffice/inventory/products">Volver a activos</Link>
        </div>

        <form className="panel candidate-form inventory-order-form" onSubmit={handleSubmit}>
          {assetsError && (
            <div className="inventory-form-feedback" role="alert">
              <p className="feedback-error">{assetsError}</p>
              <button className="secondary-button" type="button" onClick={() => setReloadKey((value) => value + 1)}>Reintentar carga de activos</button>
            </div>
          )}

          <div className="form-grid">
            <div className="form-field form-field-wide">
              <label htmlFor="outbound-asset">Activo <span aria-hidden="true">*</span></label>
              <select id="outbound-asset" className="control" required value={selectedAssetId} disabled={assetsLoading || Boolean(assetsError)} onChange={(event) => {
                const nextId = event.target.value;
                setSelectedAssetId(nextId);
                setQuantityError("");
                setSubmitError("");
                setSuccess("");
                const selected = assets.find((asset) => String(asset.id) === nextId);
                if (selected) setOffice(selected.office);
              }}>
                <option value="">{assetsLoading ? "Cargando activos…" : "Selecciona un activo"}</option>
                {assets.map((asset) => <option key={asset.id} value={asset.id}>{asset.name} · {asset.sku} · {asset.office}</option>)}
              </select>
              {assets.length === 0 && !assetsLoading && !assetsError && <span className="form-hint">No hay activos disponibles para registrar una salida.</span>}
            </div>

            <div className="form-field form-field-wide">
              <span className="inventory-stock-readout" role="status" aria-live="polite">
                {!selectedAssetId && "Selecciona un activo para consultar el stock actual."}
                {Boolean(selectedAssetId) && stockLoading && "Consultando stock actual…"}
                {Boolean(selectedAssetId) && !stockLoading && currentStock !== null && <>Stock actual: <strong>{currentStock} {currentStock === 1 ? "unidad" : "unidades"}</strong></>}
                {stockError && <span className="feedback-error">{stockError}</span>}
              </span>
            </div>

            <div className="form-field">
              <label htmlFor="outbound-quantity">Cantidad <span aria-hidden="true">*</span></label>
              <input id="outbound-quantity" className="control" type="number" min="1" step="1" required inputMode="numeric" value={quantity} aria-invalid={Boolean(quantityError || exceedsStock)} aria-describedby={quantityError ? "outbound-quantity-error" : exceedsStock ? "outbound-stock-warning" : undefined} onChange={(event) => {
                setQuantity(event.target.value);
                setQuantityError("");
                setSubmitError("");
                setSuccess("");
              }} />
              {exceedsStock && <span id="outbound-stock-warning" className="inventory-stock-warning" role="alert">La cantidad supera el stock disponible ({currentStock}). La API rechazará la salida si no hay existencias suficientes.</span>}
              {quantityError && <span id="outbound-quantity-error" className="field-error" role="alert">{quantityError}</span>}
            </div>

            <div className="form-field">
              <label htmlFor="outbound-office">Oficina <span aria-hidden="true">*</span></label>
              <select id="outbound-office" className="control" required value={office} onChange={(event) => setOffice(event.target.value as NexovaOffice)}>
                {offices.map((item) => <option key={item} value={item}>{item}</option>)}
              </select>
            </div>

            <div className="form-field">
              <label htmlFor="outbound-type">Tipo de salida <span aria-hidden="true">*</span></label>
              <select id="outbound-type" className="control" required value={exitType} onChange={(event) => {
                const nextType = event.target.value as ExitType;
                setExitType(nextType);
                if (nextType === "consumption") setAssignedTo("");
                setSubmitError("");
                setSuccess("");
              }}>
                <option value="allocation">Asignación a empleado</option>
                <option value="consumption">Consumo</option>
              </select>
            </div>

            {exitType === "allocation" && (
              <div className="form-field">
                <label htmlFor="outbound-assigned-to">Asignado a <span aria-hidden="true">*</span></label>
                <input id="outbound-assigned-to" className="control" type="text" required maxLength={200} autoComplete="name" placeholder="Nombre o ID del empleado" value={assignedTo} onChange={(event) => {
                  setAssignedTo(event.target.value);
                  setSubmitError("");
                  setSuccess("");
                }} />
              </div>
            )}
          </div>

          {submitError && <p className="feedback-error inventory-form-feedback" role="alert">{submitError}</p>}
          {success && <p className="feedback-success inventory-form-feedback" role="status">{success}</p>}

          <div className="form-actions">
            <Link className="secondary-button" href="/backoffice/inventory/products">Cancelar</Link>
            <button className="primary-button" type="submit" disabled={submitting || assetsLoading || Boolean(assetsError) || stockLoading || Boolean(stockError) || !selectedAssetId}>
              {submitting ? "Registrando salida…" : "Registrar salida"}
            </button>
          </div>
        </form>
      </main>
    </div>
  );
}
