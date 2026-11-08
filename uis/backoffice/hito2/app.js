import { filterCandidates, sortCandidatesByMultipleFields } from "./generated/utils/collections.js";
import { binarySearchCandidateBySalary, findCandidateByEmail, findCandidateById } from "./generated/utils/search.js";
import { calculateAverageSalary, calculateCandidateScore, calculateVacancyFillRate, countCandidatesByStatus, findTopSkills, groupCandidatesBySeniority, rankCandidatesForVacancy } from "./generated/utils/transformations.js";
import { validateCandidate, validateVacancy } from "./generated/utils/validations.js";

const candidates = [
  { id: "C-2024-0451", fullName: "María González", email: "maria.gonzalez@email.com", phone: "+56912345678", yearsOfExperience: 5, skills: ["TypeScript", "React", "Node.js", "PostgreSQL"], englishLevel: "B2", seniority: "Semi-Senior", currentSalary: 3500, expectedSalary: 4200, availability: "1 month", location: "Valencia, España", remoteOnly: false, status: "Active" },
  { id: "C-2024-0452", fullName: "Juan Pérez", email: "juan.perez@email.com", phone: "+56987654321", yearsOfExperience: 3, skills: ["JavaScript", "React", "CSS", "HTML"], englishLevel: "B1", seniority: "Junior", currentSalary: 2200, expectedSalary: 2800, availability: "Immediate", location: "Miami, Florida, Estados Unidos", remoteOnly: true, status: "Active" },
  { id: "C-2024-0453", fullName: "Carolina Silva", email: "carolina.silva@email.com", phone: "+56911223344", yearsOfExperience: 8, skills: ["TypeScript", "Node.js", "PostgreSQL", "Docker", "AWS"], englishLevel: "C1", seniority: "Senior", currentSalary: 5500, expectedSalary: 6500, availability: "2 weeks", location: "Valencia, España", remoteOnly: false, status: "Active" },
  { id: "C-2024-0454", fullName: "Lucía Fernández", email: "lucia.fernandez@email.com", phone: "+34600111222", yearsOfExperience: 6, skills: ["TypeScript", "React", "Node.js", "Docker"], englishLevel: "C1", seniority: "Senior", currentSalary: 6000, expectedSalary: 6800, availability: "Immediate", location: "Madrid, España", remoteOnly: true, status: "In process" },
  { id: "C-2024-0455", fullName: "Andrés Torres", email: "andres.torres@email.com", phone: "+13055550123", yearsOfExperience: 11, skills: ["Java", "AWS", "Kubernetes", "Leadership"], englishLevel: "C2", seniority: "Lead", currentSalary: 7200, expectedSalary: 8500, availability: "1 month", location: "Miami, Florida, Estados Unidos", remoteOnly: true, status: "Hired" },
];

const sampleVacancy = {
  id: "V-2024-0892", title: "Senior Full-Stack Developer", companyName: "TechCorp Solutions",
  requiredSkills: ["TypeScript", "React", "Node.js"], preferredSkills: ["PostgreSQL", "Docker"],
  minYearsExperience: 4, maxYearsExperience: 8, requiredEnglishLevel: "B2", requiredSeniority: "Senior",
  salaryRangeMin: 5000, salaryRangeMax: 7000, isRemote: true, location: "Remote", status: "Open",
};

let visibleCandidates = [...candidates];
const currencyFormatter = new Intl.NumberFormat("es-ES", { style: "currency", currency: "USD", maximumFractionDigits: 0 });
const statusElement = document.querySelector("#status");
const candidateRows = document.querySelector("#candidate-rows");
const candidateCount = document.querySelector("#candidate-count");

function displayStatus(message, isError = false) {
  statusElement.textContent = message;
  statusElement.className = `mt-4 text-sm ${isError ? "text-rose-200" : "text-cyan-100"}`;
}

function renderCandidates() {
  candidateCount.textContent = `${visibleCandidates.length} de ${candidates.length} candidatos`;
  candidateRows.replaceChildren();

  if (visibleCandidates.length === 0) {
    const row = document.createElement("tr");
    const cell = document.createElement("td");
    cell.colSpan = 5;
    cell.className = "px-4 py-8 text-center text-slate-500";
    cell.textContent = "No hay candidatos para mostrar.";
    row.append(cell);
    candidateRows.append(row);
    return;
  }

  for (const candidate of visibleCandidates) {
    const row = document.createElement("tr");
    const identityCell = document.createElement("td");
    identityCell.className = "px-4 py-3";
    const name = document.createElement("div");
    name.className = "font-bold text-slate-800";
    name.textContent = candidate.fullName;
    const email = document.createElement("div");
    email.className = "text-xs text-slate-500";
    email.textContent = candidate.email;
    identityCell.append(name, email);

    const values = [
      `${candidate.yearsOfExperience} años`,
      candidate.seniority,
      currencyFormatter.format(candidate.expectedSalary),
      candidate.availability,
    ];
    row.append(identityCell);
    for (const value of values) {
      const cell = document.createElement("td");
      cell.className = "whitespace-nowrap px-4 py-3";
      cell.textContent = value;
      row.append(cell);
    }
    candidateRows.append(row);
  }
}

function renderRanking() {
  const ranking = document.querySelector("#ranking");
  ranking.replaceChildren();
  if (visibleCandidates.length === 0) {
    ranking.textContent = "No hay candidatos para rankear.";
    return;
  }

  const results = rankCandidatesForVacancy(visibleCandidates, sampleVacancy);
  for (const [index, result] of results.entries()) {
    const item = document.createElement("div");
    item.className = "flex items-center justify-between gap-3 rounded-lg border border-slate-200 px-3 py-2";
    const candidateName = document.createElement("span");
    candidateName.textContent = `${index + 1}. ${result.candidate.fullName}`;
    const score = document.createElement("span");
    score.className = "rounded-full bg-cyan-100 px-2.5 py-1 font-bold text-cyan-900";
    score.textContent = `${result.score}/100`;
    item.append(candidateName, score);
    ranking.append(item);
  }
}

function reportCard(title, value, detail = "") {
  const card = document.createElement("article");
  card.className = "rounded-xl bg-slate-50 p-4";
  const heading = document.createElement("h3");
  heading.className = "text-sm font-bold text-slate-600";
  heading.textContent = title;
  const mainValue = document.createElement("p");
  mainValue.className = "mt-2 text-2xl font-black text-slate-900";
  mainValue.textContent = value;
  card.append(heading, mainValue);
  if (detail) {
    const description = document.createElement("p");
    description.className = "mt-2 text-xs leading-relaxed text-slate-500";
    description.textContent = detail;
    card.append(description);
  }
  return card;
}

function renderReports() {
  const reports = document.querySelector("#reports");
  reports.replaceChildren();
  const statuses = countCandidatesByStatus(visibleCandidates);
  const seniorityGroups = groupCandidatesBySeniority(visibleCandidates);
  const topSkills = findTopSkills(visibleCandidates, 3);
  const hiredProcesses = visibleCandidates.map((candidate, index) => ({
    id: `SP-DEMO-${index + 1}`, candidateId: candidate.id, vacancyId: sampleVacancy.id,
    stage: candidate.status === "Hired" ? "Hired" : "Screening", score: calculateCandidateScore(candidate, sampleVacancy),
    notes: "Proceso de demostración", createdAt: new Date("2026-01-01"), updatedAt: new Date("2026-01-02"),
  }));

  reports.append(
    reportCard("Salario esperado promedio", currencyFormatter.format(calculateAverageSalary(visibleCandidates))),
    reportCard("Estados de candidatos", `${visibleCandidates.length} total`, `Activos ${statuses.Active} · En proceso ${statuses["In process"]} · Contratados ${statuses.Hired} · Inactivos ${statuses.Inactive}`),
    reportCard("Seniority", `${Object.values(seniorityGroups).reduce((total, group) => total + group.length, 0)} agrupados`, `Junior ${seniorityGroups.Junior.length} · Semi-Senior ${seniorityGroups["Semi-Senior"].length} · Senior ${seniorityGroups.Senior.length} · Lead ${seniorityGroups.Lead.length} · Executive ${seniorityGroups.Executive.length}`),
    reportCard("Top habilidades", topSkills.map(({ skill, count }) => `${skill} (${count})`).join(", ") || "Sin datos", "Cantidad de candidatos con cada habilidad"),
    reportCard("Tasa de contratación demo", `${calculateVacancyFillRate(hiredProcesses)}%`, "Basada en candidatos visibles cuyo estado es Hired"),
  );
}

document.querySelector("#filter-form").addEventListener("submit", (event) => {
  event.preventDefault();
  const form = new FormData(event.currentTarget);
  const skills = String(form.get("skills") ?? "").split(",").map((skill) => skill.trim()).filter(Boolean);
  const minExperienceValue = String(form.get("minExperience") ?? "");
  const maxSalaryValue = String(form.get("maxSalary") ?? "");
  const criteria = {
    skills,
    seniority: String(form.get("seniority") || "") || undefined,
    availability: String(form.get("availability") || "") ? [String(form.get("availability"))] : undefined,
    status: String(form.get("status") || "") || undefined,
    minYearsOfExperience: minExperienceValue ? Number(minExperienceValue) : undefined,
    maxExpectedSalary: maxSalaryValue ? Number(maxSalaryValue) : undefined,
  };
  visibleCandidates = filterCandidates(candidates, criteria);
  renderCandidates();
  document.querySelector("#ranking").replaceChildren();
  document.querySelector("#reports").replaceChildren();
  displayStatus(`Filtros aplicados: ${visibleCandidates.length} candidatos coinciden.`);
});

document.querySelector("#clear-filter").addEventListener("click", () => {
  document.querySelector("#filter-form").reset();
  visibleCandidates = [...candidates];
  renderCandidates();
  displayStatus("Filtros eliminados; mostrando todos los candidatos.");
});

document.querySelector("#search-form").addEventListener("submit", (event) => {
  event.preventDefault();
  const query = new FormData(event.currentTarget).get("query").trim();
  const candidate = findCandidateById(candidates, query) ?? findCandidateByEmail(candidates, query);
  displayStatus(candidate ? `Encontrado: ${candidate.fullName} (${candidate.id}).` : "No se encontró ningún candidato con ese ID o email.", !candidate);
});

document.querySelector("#salary-search-form").addEventListener("submit", (event) => {
  event.preventDefault();
  const targetSalary = Number(new FormData(event.currentTarget).get("salary"));
  const sortedCandidates = sortCandidatesByMultipleFields(candidates, [{ field: "expectedSalary", order: "asc" }]);
  const index = binarySearchCandidateBySalary(sortedCandidates, targetSalary);
  displayStatus(index >= 0 ? `Búsqueda binaria: ${sortedCandidates[index].fullName} ocupa el índice ${index} en el array ordenado.` : `No hay candidato con salario esperado exacto de ${currencyFormatter.format(targetSalary)}.`, index < 0);
});

document.querySelector("#sort-form").addEventListener("submit", (event) => {
  event.preventDefault();
  const form = new FormData(event.currentTarget);
  const field = String(form.get("field"));
  const order = String(form.get("order"));
  visibleCandidates = sortCandidatesByMultipleFields(visibleCandidates, [{ field, order }]);
  renderCandidates();
  displayStatus(`Candidatos ordenados por ${field === "fullName" ? "nombre" : field === "expectedSalary" ? "salario esperado" : "experiencia"} (${order === "asc" ? "ascendente" : "descendente"}).`);
});

document.querySelector("#rank-button").addEventListener("click", () => {
  const candidateValidation = candidates.map(validateCandidate);
  const vacancyValidation = validateVacancy(sampleVacancy);
  if (!vacancyValidation.valid || candidateValidation.some((result) => !result.valid)) {
    displayStatus("Hay datos de muestra que no superan las validaciones.", true);
    return;
  }
  renderRanking();
  displayStatus("Ranking calculado y datos validados correctamente.");
});

document.querySelector("#reports-button").addEventListener("click", () => {
  renderReports();
  displayStatus("Reportes generados para los candidatos visibles.");
});

document.querySelector("#reset-data").addEventListener("click", () => {
  visibleCandidates = [...candidates];
  document.querySelector("#filter-form").reset();
  renderCandidates();
  document.querySelector("#ranking").replaceChildren();
  document.querySelector("#reports").replaceChildren();
  displayStatus("Datos de muestra restablecidos.");
});

renderCandidates();
displayStatus("Utilidades listas. Selecciona una operación para comenzar.");
