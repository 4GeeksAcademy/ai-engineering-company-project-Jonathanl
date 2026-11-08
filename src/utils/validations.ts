import type {
  AvailabilityStatus,
  Candidate,
  CandidateStatus,
  EnglishLevel,
  SeniorityLevel,
  Vacancy,
  VacancyStatus,
} from "../types/models.js";

export interface ValidationResult {
  valid: boolean;
  errors: string[];
}

function isRecord(value: unknown): value is Record<string, unknown> {
  return typeof value === "object" && value !== null && !Array.isArray(value);
}

function hasNonEmptyString(value: unknown): value is string {
  return typeof value === "string" && value.trim().length > 0;
}

function isFiniteNumber(value: unknown): value is number {
  return typeof value === "number" && Number.isFinite(value);
}

function isOneOf<T extends string>(value: unknown, choices: readonly T[]): value is T {
  return typeof value === "string" && choices.includes(value as T);
}

const ENGLISH_LEVELS: readonly EnglishLevel[] = [
  "A1", "A2", "B1", "B2", "C1", "C2", "Native",
];
const SENIORITY_LEVELS: readonly SeniorityLevel[] = [
  "Junior", "Semi-Senior", "Senior", "Lead", "Executive",
];
const AVAILABILITY_STATUSES: readonly AvailabilityStatus[] = [
  "Immediate", "2 weeks", "1 month", "Not available",
];
const CANDIDATE_STATUSES: readonly CandidateStatus[] = [
  "Active", "In process", "Hired", "Inactive",
];
const VACANCY_STATUSES: readonly VacancyStatus[] = ["Open", "In progress", "Closed", "On hold"];

function hasOnlyNonEmptyStrings(value: unknown): value is string[] {
  return Array.isArray(value) && value.length > 0 && value.every(hasNonEmptyString);
}

export function isValidEmail(email: string): boolean {
  if (typeof email !== "string") {
    return false;
  }

  const atIndex = email.indexOf("@");
  const dotIndex = email.lastIndexOf(".");

  return (
    atIndex > 0 &&
    atIndex === email.lastIndexOf("@") &&
    dotIndex > atIndex + 1 &&
    dotIndex < email.length - 1 &&
    !/\s/.test(email)
  );
}

export function validateCandidate(candidate: Candidate): ValidationResult {
  const errors: string[] = [];
  if (!isRecord(candidate)) {
    return { valid: false, errors: ["candidate must be an object."] };
  }

  if (!hasNonEmptyString(candidate.id)) errors.push("id is required.");
  if (!hasNonEmptyString(candidate.fullName)) errors.push("fullName is required.");
  if (!hasNonEmptyString(candidate.email) || !isValidEmail(candidate.email)) {
    errors.push("email must be a valid email address.");
  }
  if (!hasNonEmptyString(candidate.phone)) errors.push("phone must not be empty.");
  if (
    !isFiniteNumber(candidate.yearsOfExperience) ||
    candidate.yearsOfExperience < 0 ||
    candidate.yearsOfExperience > 50
  ) {
    errors.push("yearsOfExperience must be between 0 and 50.");
  }
  if (
    !Array.isArray(candidate.skills) ||
    !candidate.skills.every(hasNonEmptyString) ||
    candidate.skills.length === 0
  ) {
    errors.push("skills must contain at least one non-empty skill.");
  }
  if (!isOneOf(candidate.englishLevel, ENGLISH_LEVELS)) errors.push("englishLevel is invalid.");
  if (!isOneOf(candidate.seniority, SENIORITY_LEVELS)) errors.push("seniority is invalid.");
  if (!isFiniteNumber(candidate.currentSalary) || candidate.currentSalary <= 0) {
    errors.push("currentSalary must be greater than 0.");
  }
  if (!isFiniteNumber(candidate.expectedSalary) || candidate.expectedSalary <= 0) {
    errors.push("expectedSalary must be greater than 0.");
  }
  if (!isOneOf(candidate.availability, AVAILABILITY_STATUSES)) {
    errors.push("availability is invalid.");
  }
  if (!hasNonEmptyString(candidate.location)) errors.push("location is required.");
  if (typeof candidate.remoteOnly !== "boolean") errors.push("remoteOnly must be a boolean.");
  if (!isOneOf(candidate.status, CANDIDATE_STATUSES)) errors.push("status is invalid.");

  return { valid: errors.length === 0, errors };
}

export function validateVacancy(vacancy: Vacancy): ValidationResult {
  const errors: string[] = [];
  if (!isRecord(vacancy)) {
    return { valid: false, errors: ["vacancy must be an object."] };
  }

  if (!hasNonEmptyString(vacancy.id)) errors.push("id is required.");
  if (!hasNonEmptyString(vacancy.title)) errors.push("title is required.");
  if (!hasNonEmptyString(vacancy.companyName)) errors.push("companyName is required.");
  if (!hasOnlyNonEmptyStrings(vacancy.requiredSkills)) {
    errors.push("requiredSkills must contain at least one non-empty skill.");
  }
  if (!Array.isArray(vacancy.preferredSkills) || !vacancy.preferredSkills.every(hasNonEmptyString)) {
    errors.push("preferredSkills must be an array of non-empty skills.");
  }
  if (!isFiniteNumber(vacancy.minYearsExperience) || vacancy.minYearsExperience < 0) {
    errors.push("minYearsExperience must be greater than or equal to 0.");
  }
  if (
    !isFiniteNumber(vacancy.maxYearsExperience) ||
    isFiniteNumber(vacancy.minYearsExperience) &&
      vacancy.maxYearsExperience < vacancy.minYearsExperience
  ) {
    errors.push("maxYearsExperience must be greater than or equal to minYearsExperience.");
  }
  if (!isOneOf(vacancy.requiredEnglishLevel, ENGLISH_LEVELS)) {
    errors.push("requiredEnglishLevel is invalid.");
  }
  if (!isOneOf(vacancy.requiredSeniority, SENIORITY_LEVELS)) {
    errors.push("requiredSeniority is invalid.");
  }
  if (!isFiniteNumber(vacancy.salaryRangeMin) || vacancy.salaryRangeMin <= 0) {
    errors.push("salaryRangeMin must be greater than 0.");
  }
  if (!isFiniteNumber(vacancy.salaryRangeMax) || vacancy.salaryRangeMax <= 0) {
    errors.push("salaryRangeMax must be greater than 0.");
  }
  if (
    isFiniteNumber(vacancy.salaryRangeMax) &&
    isFiniteNumber(vacancy.salaryRangeMin) &&
    vacancy.salaryRangeMax < vacancy.salaryRangeMin
  ) {
    errors.push("salaryRangeMax must be greater than or equal to salaryRangeMin.");
  }
  if (typeof vacancy.isRemote !== "boolean") errors.push("isRemote must be a boolean.");
  if (!hasNonEmptyString(vacancy.location)) errors.push("location is required.");
  if (!isOneOf(vacancy.status, VACANCY_STATUSES)) errors.push("status is invalid.");

  return { valid: errors.length === 0, errors };
}
