const byId = (id) => document.getElementById(id);
const reasons = {
  malformed_row: "Fila CSV mal formada",
  ticket_id_missing: "Falta ticket_id",
  ticket_id_invalid: "Formato de ticket_id inválido",
  ticket_id_duplicate: "ticket_id duplicado",
  date_missing: "Falta date",
  date_invalid: "Fecha inválida",
  client_company_missing: "Falta client_company",
  category_invalid: "Categoría ausente o inválida",
  description_invalid: "Descripción vacía o menor de 5 caracteres",
  agent_id_invalid: "agent_id ausente o inválido",
  status_invalid: "Estado ausente o inválido",
  email_invalid: "Email ausente o inválido",
  closed_score_missing: "Ticket CLOSED sin satisfacción",
  score_invalid: "Satisfacción no entera o fuera de 1–5",
};
const message = (text, error = false) => {
  byId("message").textContent = text;
  byId("message").classList.toggle("error", error);
};

function userError(text) {
  return Object.assign(new Error(text), { safeForDisplay: true });
}

async function responseJson(response, fallback) {
  let result = null;
  try {
    result = await response.json();
  } catch {
    // Error responses can be empty or non-JSON (for example, proxy HTML).
  }
  if (!response.ok) throw userError(fallback);
  if (result === null) throw userError("El servidor devolvió una respuesta no válida. Inténtalo de nuevo.");
  return result;
}

function tableRows(id, entries, total) {
  const body = byId(id);
  body.replaceChildren();
  for (const [label, count] of entries) {
    const row = document.createElement("tr");
    const values = total === undefined ? [label, count] : [label, count, `${total ? (count / total * 100).toFixed(1) : "0.0"}%`];
    for (const value of values) {
      const cell = document.createElement("td");
      cell.textContent = value;
      row.append(cell);
    }
    body.append(row);
  }
}

function showResults(result) {
  const count = (value) => Number.isInteger(value) && value >= 0;
  const isRecord = (value) => value !== null && typeof value === "object" && !Array.isArray(value);
  const isCountRecord = (value) => isRecord(value) && Object.values(value).every(count);
  if (!isRecord(result) || ![result.total, result.valid, result.invalid].every(count) ||
      !isRecord(result.satisfaction) ||
      !(result.satisfaction.average === null || Number.isFinite(result.satisfaction.average)) ||
      ![result.satisfaction.scored, result.satisfaction.closed].every(count) ||
      !isCountRecord(result.satisfaction.distribution) || !isCountRecord(result.categories) ||
      !isCountRecord(result.statuses) || !isCountRecord(result.invalid_reasons)) {
    throw userError("El servicio devolvió un análisis no válido. Vuelve a cargar el CSV e inténtalo de nuevo.");
  }
  for (const key of ["total", "valid", "invalid"]) byId(key).textContent = result[key];
  byId("average").textContent = result.satisfaction.average === null ? "N/A" : `${result.satisfaction.average.toFixed(2)} / 5`;
  tableRows("categories", ["TECHNICAL", "BILLING", "ACCESS", "HR_QUERY", "COMPLAINT"].map((key) => [key, result.categories[key]]), result.valid);
  tableRows("statuses", ["OPEN", "CLOSED", "DISCARDED"].map((key) => [key, result.statuses[key]]), result.valid);
  tableRows("satisfaction", Object.entries(result.satisfaction.distribution), result.satisfaction.scored);
  byId("scored").textContent = `${result.satisfaction.scored} de ${result.satisfaction.closed} tickets cerrados puntuados`;
  tableRows("reasons", Object.entries(result.invalid_reasons).map(([key, count]) => [reasons[key] || key, count]));
  byId("invalid-table").hidden = result.invalid === 0;
  byId("quality").textContent = result.invalid ? `${result.invalid} registros excluidos. Una fila puede incumplir varias reglas.` : "Sin registros inválidos.";
  byId("results").hidden = false;
}

byId("file").addEventListener("change", () => {
  byId("download").disabled = true;
  byId("results").hidden = true;
  message("Sin análisis cargado.");
});

byId("upload-form").addEventListener("submit", async (event) => {
  event.preventDefault();
  const file = byId("file").files[0];
  if (!file) return;
  byId("download").disabled = true;
  byId("results").hidden = true;
  if (!file.name.toLowerCase().endsWith(".csv")) return message("Selecciona un archivo CSV.", true);
  if (!file.size) return message("El archivo está vacío.", true);
  if (file.size > 5 * 1024 * 1024) return message("El archivo supera el límite de 5 MB.", true);
  byId("analyze").disabled = true;
  byId("file").disabled = true;
  byId("upload-form").setAttribute("aria-busy", "true");
  message("Analizando incidencias…");
  const form = new FormData();
  form.append("file", file);
  try {
    const response = await fetch("/api/incidents/analyze", { method: "POST", body: form, headers: window.incidentAuthHeaders ? window.incidentAuthHeaders() : {} });
    const result = await responseJson(response, "No se pudo analizar el archivo. Revisa el CSV e inténtalo de nuevo.");
    showResults(result);
    byId("download").disabled = false;
    message(result.invalid ? `Análisis completado: ${result.invalid} registros inválidos.` : "Análisis completado.");
  } catch (error) {
    const detail = error instanceof TypeError
      ? "No se pudo conectar con el servicio. Comprueba tu conexión."
      : error && error.safeForDisplay === true ? error.message : "No se pudo analizar el archivo.";
    message(`${detail} Puedes volver a intentarlo.`, true);
  } finally {
    byId("analyze").disabled = false;
    byId("file").disabled = false;
    byId("upload-form").removeAttribute("aria-busy");
  }
});

byId("download").addEventListener("click", async () => {
  byId("download").disabled = true;
  try {
    const response = await fetch("/api/incidents/results/export", { headers: window.incidentAuthHeaders ? window.incidentAuthHeaders() : {} });
    if (!response.ok) {
      throw userError("No se pudo descargar el CSV. Vuelve a analizar las incidencias e inténtalo de nuevo.");
    }
    message("Preparando descarga…");
    const url = URL.createObjectURL(await response.blob());
    const link = document.createElement("a");
    link.href = url;
    link.download = "results.csv";
    document.body.append(link);
    link.click();
    link.remove();
    setTimeout(() => URL.revokeObjectURL(url), 1000);
    message("Resultados descargados.");
  } catch (error) {
    const detail = error instanceof TypeError
      ? "No se pudo conectar con el servicio. Comprueba tu conexión."
      : error && error.safeForDisplay === true ? error.message : "No se pudo descargar el CSV.";
    message(`${detail} Puedes volver a intentarlo.`, true);
  } finally {
    byId("download").disabled = false;
  }
});

if (window.lucide) window.lucide.createIcons();