import type {
  AvailabilityStatus,
  Candidate,
  CandidateStatus,
  SeniorityLevel,
} from "../types/models.js";

export interface CandidateFilterCriteria {
  skills?: string[];
  seniority?: SeniorityLevel;
  availability?: AvailabilityStatus[];
  status?: CandidateStatus;
  minYearsOfExperience?: number;
  maxYearsOfExperience?: number;
  minExpectedSalary?: number;
  maxExpectedSalary?: number;
}

export interface CandidateSortCriterion {
  field: "expectedSalary" | "yearsOfExperience" | "fullName";
  order: "asc" | "desc";
}

export function filterCandidates(
  candidates: Candidate[],
  criteria: CandidateFilterCriteria,
): Candidate[] {
  return candidates.filter((candidate) => {
    const candidateSkills = new Set(candidate.skills.map((skill) => skill.toLowerCase()));
    const matchesSkills = (criteria.skills ?? []).every((skill) =>
      candidateSkills.has(skill.toLowerCase()),
    );
    const matchesSeniority = criteria.seniority === undefined || candidate.seniority === criteria.seniority;
    const matchesAvailability =
      criteria.availability === undefined || criteria.availability.includes(candidate.availability);
    const matchesStatus = criteria.status === undefined || candidate.status === criteria.status;
    const matchesMinimumExperience =
      criteria.minYearsOfExperience === undefined ||
      candidate.yearsOfExperience >= criteria.minYearsOfExperience;
    const matchesMaximumExperience =
      criteria.maxYearsOfExperience === undefined ||
      candidate.yearsOfExperience <= criteria.maxYearsOfExperience;
    const matchesMinimumSalary =
      criteria.minExpectedSalary === undefined ||
      candidate.expectedSalary >= criteria.minExpectedSalary;
    const matchesMaximumSalary =
      criteria.maxExpectedSalary === undefined ||
      candidate.expectedSalary <= criteria.maxExpectedSalary;

    return (
      matchesSkills &&
      matchesSeniority &&
      matchesAvailability &&
      matchesStatus &&
      matchesMinimumExperience &&
      matchesMaximumExperience &&
      matchesMinimumSalary &&
      matchesMaximumSalary
    );
  });
}

export function filterCandidatesBySkills(
  candidates: Candidate[],
  requiredSkills: string[],
): Candidate[] {
  const normalizedRequiredSkills = requiredSkills.map((skill) => skill.toLowerCase());

  return candidates.filter((candidate) => {
    const candidateSkills = new Set(candidate.skills.map((skill) => skill.toLowerCase()));
    return normalizedRequiredSkills.every((skill) => candidateSkills.has(skill));
  });
}

export function filterCandidatesBySeniority(
  candidates: Candidate[],
  seniority: SeniorityLevel,
): Candidate[] {
  return candidates.filter((candidate) => candidate.seniority === seniority);
}

export function filterCandidatesByAvailability(
  candidates: Candidate[],
  availability: AvailabilityStatus[],
): Candidate[] {
  const acceptedAvailability = new Set(availability);
  return candidates.filter((candidate) => acceptedAvailability.has(candidate.availability));
}

export function sortCandidatesBySalary(
  candidates: Candidate[],
  order: "asc" | "desc",
): Candidate[] {
  const direction = order === "asc" ? 1 : -1;
  return [...candidates].sort(
    (candidateA, candidateB) =>
      direction * (candidateA.expectedSalary - candidateB.expectedSalary),
  );
}

export function sortCandidatesByExperience(
  candidates: Candidate[],
  order: "asc" | "desc",
): Candidate[] {
  const direction = order === "asc" ? 1 : -1;
  return [...candidates].sort(
    (candidateA, candidateB) =>
      direction * (candidateA.yearsOfExperience - candidateB.yearsOfExperience),
  );
}

export function sortCandidatesByMultipleFields(
  candidates: Candidate[],
  criteria: CandidateSortCriterion[],
): Candidate[] {
  return [...candidates].sort((candidateA, candidateB) => {
    for (const criterion of criteria) {
      const comparison = criterion.field === "fullName"
        ? candidateA.fullName.localeCompare(candidateB.fullName)
        : candidateA[criterion.field] - candidateB[criterion.field];

      if (comparison !== 0) {
        return criterion.order === "asc" ? comparison : -comparison;
      }
    }

    return 0;
  });
}
