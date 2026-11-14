(() => {
  const byId = (id) => document.getElementById(id);
  const labels = {
    status: { open: "Abierta", in_progress: "En curso", resolved: "Resuelta", discarded: "Descartada" },
    origin: { customer: "Cliente", branch: "Sede", internal: "Interno" },
    branch: {
      central: "Central — Sede Valencia",
      valencia_operations: "Valencia — Operaciones",
      miami_office: "Miami Office",
      remote: "Remoto (empleado sin sede fija)",
    },
    category: {
      technical_failure: "Fallo técnico",
      process_error: "Error de proceso",
      client_complaint: "Queja de cliente",
      candidate_issue: "Problema de candidato",
      staff_issue: "Incidencia de personal",
      sla_breach: "Incumplimiento de SLA",
      data_quality: "Calidad de datos",
      other: "Otro",
    },
  };
  const statusTransitions = {
    open: ["in_progress", "discarded"],
    in_progress: ["resolved", "discarded"],
    resolved: [],
    discarded: [],
  };
  let accessToken = null;
  let incidents = [];
  let listBusy = false;
  let summaryBusy = false;

  window.incidentAuthHeaders = () => accessToken ? { Authorization: `Bearer ${accessToken}` } : {};

  function setMessage(id, text, error = false) {
    const element = byId(id);
    element.textContent = text;
    element.classList.toggle("error", error);
  }

  function friendlyApiError(status, data) {
    if (status === 401) return "No se pudo validar la sesión. Inicia sesión de nuevo.";
    if (status === 403) return "Tu cuenta no tiene permiso para realizar esta acción.";
    if (status >= 500) return "El servicio no está disponible ahora. Inténtalo de nuevo más tarde.";
    const field = data?.error?.field;
    const messages = {
      title: "Revisa el título de la incidencia.",
      description: "Revisa la descripción de la incidencia.",
      category: "Selecciona una categoría válida.",
      status: "El cambio de estado no está permitido.",
      origin: "Selecciona un origen válido.",
      branch: "Selecciona una sede válida.",
      request: "Revisa los datos enviados e inténtalo de nuevo.",
      id: "No se encontró una incidencia válida.",
    };
    if (field && messages[field]) return messages[field];
    if (status === 404) return "La incidencia ya no existe. Actualiza el listado.";
    return "No se pudo completar la solicitud. Revisa los datos e inténtalo de nuevo.";
  }

  function isRecord(value) {
    return value !== null && typeof value === "object" && !Array.isArray(value);
  }

  function isIncident(value) {
    return isRecord(value) && typeof value.id === "string" && typeof value.title === "string" &&
      typeof value.description === "string" && Object.prototype.hasOwnProperty.call(labels.category, value.category) &&
      Object.prototype.hasOwnProperty.call(statusTransitions, value.status) &&
      Object.prototype.hasOwnProperty.call(labels.origin, value.origin) &&
      Object.prototype.hasOwnProperty.call(labels.branch, value.branch) &&
      typeof value.created_at === "string" && !Number.isNaN(Date.parse(value.created_at)) &&
      typeof value.updated_at === "string" && !Number.isNaN(Date.parse(value.updated_at));
  }

  function isSummary(value) {
    return isRecord(value) && Number.isInteger(value.total) && value.total >= 0 &&
      [value.by_status, value.by_category, value.by_origin, value.by_branch].every(isRecord) &&
      [...Object.values(value.by_status), ...Object.values(value.by_category),
        ...Object.values(value.by_origin), ...Object.values(value.by_branch)]
        .every((count) => Number.isInteger(count) && count >= 0);
  }

  function changeOptions(status) {
    return statusTransitions[status] || [];
  }

  function userError(message, details = {}) {
    return Object.assign(new Error(message), { ...details, safeForDisplay: true });
  }

  function displayError(error, fallback) {
    return error?.safeForDisplay === true ? error.message : fallback;
  }

  async function requestJson(url, options = {}) {
    const headers = new Headers(options.headers || {});
    headers.set("Accept", "application/json");
    if (accessToken) headers.set("Authorization", `Bearer ${accessToken}`);
    let response;
    try {
      response = await fetch(url, { ...options, headers });
    } catch {
      throw userError("No se pudo conectar con el servicio. Comprueba tu conexión e inténtalo de nuevo.", { status: 0 });
    }
    let data;
    try {
      data = await response.json();
    } catch {
      data = null;
    }
    if (!response.ok) {
      const message = friendlyApiError(response.status, data);
      throw userError(message, { status: response.status, field: data?.error?.field });
    }
    if (data === null) throw userError("El servicio devolvió una respuesta no válida. Inténtalo de nuevo.");
    return data;
  }

  function showManager(visible) {
    byId("manager-content").hidden = !visible;
    byId("auth-panel").hidden = visible;
    if (visible) {
      byId("list-message").textContent = "Cargando incidencias…";
      byId("summary-message").textContent = "Cargando métricas…";
      loadIncidents();
      loadSummary();
    }
  }

  function fieldError(name, text) {
    const control = byId(`incident-${name}`);
    const error = byId(`error-${name}`);
    control?.setAttribute("aria-invalid", text ? "true" : "false");
    if (error) error.textContent = text;
  }

  function clearFieldErrors() {
    for (const name of ["title", "description", "category", "status", "origin", "branch"]) fieldError(name, "");
  }

  function validateForm(form) {
    clearFieldErrors();
    let valid = true;
    const required = ["title", "description", "category", "status", "origin", "branch"];
    for (const name of required) {
      const control = form.elements.namedItem(name);
      if (!String(control.value || "").trim()) {
        fieldError(name, "Este campo es obligatorio.");
        valid = false;
      }
    }
    if (!valid) {
      setMessage("form-message", "Completa los campos obligatorios señalados.", true);
      form.querySelector('[aria-invalid="true"]')?.focus();
    }
    return valid;
  }

  function formatTimestamp(value) {
    const date = new Date(value);
    if (Number.isNaN(date.getTime())) return "Fecha no disponible";
    return new Intl.DateTimeFormat("es-ES", { dateStyle: "medium", timeStyle: "short", timeZone: "Europe/Madrid" }).format(date);
  }

  function createCell(text, tag = "td") {
    const cell = document.createElement(tag);
    cell.textContent = text;
    return cell;
  }

  function renderIncidents() {
    const body = byId("incident-rows");
    body.replaceChildren();
    for (const incident of incidents) {
      const row = document.createElement("tr");
      const descriptionCell = createCell("");
      const title = document.createElement("strong");
      title.textContent = incident.title;
      const description = document.createElement("span");
      description.className = "incident-description";
      description.textContent = incident.description;
      descriptionCell.append(title, description);
      row.append(descriptionCell, createCell(labels.category[incident.category] || incident.category));
      row.append(createCell(`${labels.origin[incident.origin] || incident.origin} · ${labels.branch[incident.branch] || incident.branch}`));
      row.append(createCell(formatTimestamp(incident.created_at)));

      const statusCell = createCell("");
      statusCell.className = "incident-status-cell";
      const select = document.createElement("select");
      select.setAttribute("aria-label", `Estado de ${incident.title}`);
      const currentOption = document.createElement("option");
      currentOption.value = incident.status;
      currentOption.textContent = labels.status[incident.status] || incident.status;
      select.append(currentOption);
      for (const next of changeOptions(incident.status)) {
        const option = document.createElement("option");
        option.value = next;
        option.textContent = labels.status[next];
        select.append(option);
      }
      select.disabled = !changeOptions(incident.status).length;
      select.addEventListener("change", () => changeStatus(incident, select));
      statusCell.append(select);
      row.append(statusCell);
      body.append(row);
    }
  }

  async function loadIncidents() {
    if (!accessToken || listBusy) return;
    listBusy = true;
    byId("refresh-incidents").disabled = true;
    byId("list-message").setAttribute("aria-busy", "true");
    setMessage("list-message", "Cargando incidencias…");
    const params = new URLSearchParams();
    for (const [queryName, controlId] of [["status", "filter-status"], ["origin", "filter-origin"], ["branch", "filter-branch"]]) {
      if (byId(controlId).value) params.set(queryName, byId(controlId).value);
    }
    try {
      const result = await requestJson(`/api/incidents${params.size ? `?${params}` : ""}`);
      if (!Array.isArray(result) || !result.every(isIncident)) {
        throw userError("El servicio devolvió un listado no válido. Actualiza las incidencias e inténtalo de nuevo.");
      }
      incidents = result;
      renderIncidents();
      setMessage("list-message", incidents.length ? `${incidents.length} incidencias encontradas.` : "No hay incidencias para estos filtros.");
    } catch (error) {
      incidents = [];
      renderIncidents();
      setMessage("list-message", `${displayError(error, "No se pudo cargar el listado.")} Vuelve a intentarlo con Actualizar.`, true);
    } finally {
      listBusy = false;
      byId("refresh-incidents").disabled = false;
      byId("list-message").removeAttribute("aria-busy");
    }
  }

  async function changeStatus(incident, select) {
    const previousStatus = incident.status;
    const nextStatus = select.value;
    select.disabled = true;
    select.setAttribute("aria-busy", "true");
    setMessage("list-message", "Actualizando el estado…");
    try {
      const updated = await requestJson(`/api/incidents/${encodeURIComponent(incident.id)}/status`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ status: nextStatus }),
      });
      if (!isIncident(updated)) throw userError("El servicio devolvió una incidencia no válida. Actualiza el listado e inténtalo de nuevo.");
      setMessage("list-message", `Estado actualizado a «${labels.status[nextStatus]}».`);
      await Promise.all([loadIncidents(), loadSummary()]);
    } catch (error) {
      select.value = previousStatus;
      setMessage("list-message", `${displayError(error, "No se pudo actualizar el estado.")} Vuelve a intentarlo.`, true);
    } finally {
      select.removeAttribute("aria-busy");
      select.disabled = !changeOptions(previousStatus).length;
    }
  }

  function renderSummary(summary) {
    const total = byId("summary-total");
    total.replaceChildren();
    const totalTitle = document.createElement("dt");
    totalTitle.textContent = "Total de incidencias";
    const totalValue = document.createElement("dd");
    totalValue.textContent = String(summary.total);
    total.append(totalTitle, totalValue);
    total.hidden = false;

    const dimensions = [
      ["Por estado", summary.by_status, labels.status],
      ["Por categoría", summary.by_category, labels.category],
      ["Por origen", summary.by_origin, labels.origin],
      ["Por sede", summary.by_branch, labels.branch],
    ];
    const grid = byId("summary-breakdowns");
    grid.replaceChildren();
    for (const [title, counts, displayLabels] of dimensions) {
      const section = document.createElement("section");
      section.className = "summary-card";
      const heading = document.createElement("h3");
      heading.textContent = title;
      const list = document.createElement("dl");
      for (const [key, count] of Object.entries(counts || {})) {
        const term = document.createElement("dt");
        term.textContent = displayLabels[key] || key;
        const value = document.createElement("dd");
        value.textContent = String(count);
        list.append(term, value);
      }
      section.append(heading, list);
      grid.append(section);
    }
  }

  async function loadSummary() {
    if (!accessToken || summaryBusy) return;
    summaryBusy = true;
    byId("refresh-summary").disabled = true;
    byId("summary-message").setAttribute("aria-busy", "true");
    setMessage("summary-message", "Cargando métricas…");
    try {
      const summary = await requestJson("/api/incidents/summary");
      if (!isSummary(summary)) throw userError("El servicio devolvió métricas no válidas. Actualiza el resumen e inténtalo de nuevo.");
      renderSummary(summary);
      setMessage("summary-message", "Resumen actualizado.");
    } catch (error) {
      byId("summary-total").hidden = true;
      byId("summary-breakdowns").replaceChildren();
      setMessage("summary-message", `${displayError(error, "No se pudieron cargar las métricas.")} Vuelve a intentarlo con Actualizar.`, true);
    } finally {
      summaryBusy = false;
      byId("refresh-summary").disabled = false;
      byId("summary-message").removeAttribute("aria-busy");
    }
  }

  byId("login-form").addEventListener("submit", async (event) => {
    event.preventDefault();
    const button = byId("login-button");
    button.disabled = true;
    setMessage("login-message", "Iniciando sesión…");
    try {
      const values = new FormData(event.currentTarget);
      const body = new URLSearchParams({ username: values.get("username"), password: values.get("password") });
      const response = await fetch("/auth/login", {
        method: "POST",
        headers: { "Content-Type": "application/x-www-form-urlencoded", Accept: "application/json" },
        body,
      });
      let result = null;
      try {
        result = await response.json();
      } catch {
        // Treat empty or non-JSON responses like an unsuccessful login.
      }
      if (!response.ok || typeof result?.access_token !== "string" || !result.access_token) {
        throw new Error("No se pudo iniciar sesión. Comprueba el email y la contraseña.");
      }
      accessToken = result.access_token;
      byId("session-message").textContent = "Sesión autenticada.";
      byId("login-form").reset();
      setMessage("login-message", "");
      showManager(true);
    } catch (error) {
      setMessage("login-message", "No se pudo iniciar sesión. Comprueba tus datos y que el servicio esté disponible; inténtalo de nuevo.", true);
    } finally {
      button.disabled = false;
    }
  });

  byId("logout-button").addEventListener("click", () => {
    accessToken = null;
    incidents = [];
    renderIncidents();
    byId("summary-total").hidden = true;
    byId("summary-breakdowns").replaceChildren();
    setMessage("list-message", "Inicia sesión para cargar las incidencias.");
    setMessage("summary-message", "Inicia sesión para cargar las métricas.");
    showManager(false);
  });

  byId("incident-form").addEventListener("submit", async (event) => {
    event.preventDefault();
    const form = event.currentTarget;
    if (!validateForm(form)) return;
    const values = new FormData(form);
    const payload = Object.fromEntries(["title", "description", "category", "status", "origin", "branch"].map((name) => [name, String(values.get(name)).trim()]));
    const button = byId("submit-incident");
    button.disabled = true;
    form.setAttribute("aria-busy", "true");
    setMessage("form-message", "Registrando incidencia…");
    try {
      await requestJson("/api/incidents", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload),
      });
      form.reset();
      updateBranchEmphasis();
      clearFieldErrors();
      setMessage("form-message", "Incidencia registrada correctamente.");
      await Promise.all([loadIncidents(), loadSummary()]);
    } catch (error) {
      const field = error?.safeForDisplay === true && ["title", "description", "category", "status", "origin", "branch"].includes(error.field) ? error.field : null;
      const detail = displayError(error, "No se pudo registrar la incidencia.");
      if (field && error?.safeForDisplay === true) fieldError(field, detail);
      setMessage("form-message", `${detail} Vuelve a intentarlo.`, true);
    } finally {
      button.disabled = false;
      form.removeAttribute("aria-busy");
    }
  });

  function updateBranchEmphasis() {
    const highlight = byId("incident-origin").value === "branch";
    byId("branch-field").classList.toggle("branch-highlight", highlight);
    byId("branch-hint").textContent = highlight
      ? "Selecciona la sede desde la que se reporta esta incidencia."
      : "Selecciona la sede relacionada con la incidencia.";
  }

  byId("incident-origin").addEventListener("change", updateBranchEmphasis);
  for (const id of ["filter-status", "filter-origin", "filter-branch"]) byId(id).addEventListener("change", loadIncidents);
  byId("refresh-incidents").addEventListener("click", loadIncidents);
  byId("refresh-summary").addEventListener("click", loadSummary);
  byId("incident-form").addEventListener("input", (event) => {
    if (event.target.name) fieldError(event.target.name, "");
  });
})();
