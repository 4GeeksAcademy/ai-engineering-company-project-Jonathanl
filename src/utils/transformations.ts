import type {
  Candidate,
  CandidateStatus,
  EnglishLevel,
  SelectionProcess,
  SeniorityLevel,
  Vacancy,
} from "../types/models.js";

export type CandidateNumericField = "yearsOfExperience" | "currentSalary" | "expectedSalary";

export interface NumericSummary {
  sum: number;
  average: number;
  max: number | null;
  min: number | null;
}

const SENIORITY_ORDER: SeniorityLevel[] = [
  "Junior",
  "Semi-Senior",
  "Senior",
  "Lead",
  "Executive",
];

const ENGLISH_LEVEL_ORDER: EnglishLevel[] = [
  "A1",
  "A2",
  "B1",
  "B2",
  "C1",
  "C2",
  "Native",
];

function normalizeSkills(skills: string[]): Set<string> {
  return new Set(skills.map((skill) => skill.toLowerCase()));
}

function calculateSkillsScore(candidate: Candidate, vacancy: Vacancy): number {
  const candidateSkills = normalizeSkills(candidate.skills);
  const requiredSkills = vacancy.requiredSkills.map((skill) => skill.toLowerCase());
  const matchingRequiredSkills = requiredSkills.filter((skill) => candidateSkills.has(skill)).length;
  let score = 0;

  if (requiredSkills.length > 0) {
    if (matchingRequiredSkills === requiredSkills.length) {
      score += 40;
    } else if (matchingRequiredSkills >= requiredSkills.length / 2) {
      score += 20;
    }
  }

  const matchingPreferredSkills = vacancy.preferredSkills.filter((skill) =>
    candidateSkills.has(skill.toLowerCase()),
  ).length;
  score += Math.min(matchingPreferredSkills * 10, 20);

  // The briefing's category limit is 40, so required and preferred skill points share that cap.
  return Math.min(score, 40);
}

function calculateExperienceScore(candidate: Candidate, vacancy: Vacancy): number {
  const experience = candidate.yearsOfExperience;

  if (experience >= vacancy.minYearsExperience && experience <= vacancy.maxYearsExperience) {
    return 20;
  }

  const distance = experience < vacancy.minYearsExperience
    ? vacancy.minYearsExperience - experience
    : experience - vacancy.maxYearsExperience;

  return distance <= 2 ? 10 : 0;
}

function calculateSeniorityScore(candidate: Candidate, vacancy: Vacancy): number {
  const candidateLevel = SENIORITY_ORDER.indexOf(candidate.seniority);
  const requiredLevel = SENIORITY_ORDER.indexOf(vacancy.requiredSeniority);

  if (candidateLevel === requiredLevel) {
    return 15;
  }

  return Math.abs(candidateLevel - requiredLevel) === 1 ? 7 : 0;
}

function calculateEnglishScore(candidate: Candidate, vacancy: Vacancy): number {
  return ENGLISH_LEVEL_ORDER.indexOf(candidate.englishLevel) >=
    ENGLISH_LEVEL_ORDER.indexOf(vacancy.requiredEnglishLevel)
    ? 15
    : 0;
}

function calculateSalaryScore(candidate: Candidate, vacancy: Vacancy): number {
  if (
    candidate.expectedSalary >= vacancy.salaryRangeMin &&
    candidate.expectedSalary <= vacancy.salaryRangeMax
  ) {
    return 10;
  }

  if (
    candidate.expectedSalary > vacancy.salaryRangeMax &&
    candidate.expectedSalary <= vacancy.salaryRangeMax * 1.2
  ) {
    return 5;
  }

  return 0;
}

export function calculateCandidateScore(candidate: Candidate, vacancy: Vacancy): number {
  return (
    calculateSkillsScore(candidate, vacancy) +
    calculateExperienceScore(candidate, vacancy) +
    calculateSeniorityScore(candidate, vacancy) +
    calculateEnglishScore(candidate, vacancy) +
    calculateSalaryScore(candidate, vacancy)
  );
}

export function rankCandidatesForVacancy(
  candidates: Candidate[],
  vacancy: Vacancy,
): Array<{ candidate: Candidate; score: number }> {
  return candidates
    .map((candidate) => ({ candidate, score: calculateCandidateScore(candidate, vacancy) }))
    .sort((candidateA, candidateB) => candidateB.score - candidateA.score);
}

export function groupCandidatesBySeniority(
  candidates: Candidate[],
): Record<SeniorityLevel, Candidate[]> {
  const groups: Record<SeniorityLevel, Candidate[]> = {
    Junior: [],
    "Semi-Senior": [],
    Senior: [],
    Lead: [],
    Executive: [],
  };

  for (const candidate of candidates) {
    groups[candidate.seniority].push(candidate);
  }

  return groups;
}

export function countCandidatesByStatus(
  candidates: Candidate[],
): Record<CandidateStatus, number> {
  const counts: Record<CandidateStatus, number> = {
    Active: 0,
    "In process": 0,
    Hired: 0,
    Inactive: 0,
  };

  for (const candidate of candidates) {
    counts[candidate.status] += 1;
  }

  return counts;
}

export function calculateAverageSalary(candidates: Candidate[]): number {
  if (candidates.length === 0) {
    return 0;
  }

  const totalSalary = candidates.reduce(
    (total, candidate) => total + candidate.expectedSalary,
    0,
  );
  return Math.round((totalSalary / candidates.length) * 100) / 100;
}

export function sumCandidateValues(
  candidates: Candidate[],
  field: CandidateNumericField,
): number {
  return candidates.reduce((total, candidate) => total + candidate[field], 0);
}

export function findMaximumCandidateValue(
  candidates: Candidate[],
  field: CandidateNumericField,
): number | null {
  if (candidates.length === 0) {
    return null;
  }

  return candidates.reduce(
    (maximum, candidate) => Math.max(maximum, candidate[field]),
    candidates[0][field],
  );
}

export function findMinimumCandidateValue(
  candidates: Candidate[],
  field: CandidateNumericField,
): number | null {
  if (candidates.length === 0) {
    return null;
  }

  return candidates.reduce(
    (minimum, candidate) => Math.min(minimum, candidate[field]),
    candidates[0][field],
  );
}

export function summarizeCandidateValues(
  candidates: Candidate[],
  field: CandidateNumericField,
): NumericSummary {
  const sum = sumCandidateValues(candidates, field);

  return {
    sum,
    average: candidates.length === 0 ? 0 : Math.round((sum / candidates.length) * 100) / 100,
    max: findMaximumCandidateValue(candidates, field),
    min: findMinimumCandidateValue(candidates, field),
  };
}

export function findTopSkills(
  candidates: Candidate[],
  topN: number,
): Array<{ skill: string; count: number }> {
  if (topN <= 0) {
    return [];
  }

  const skillCounts = new Map<string, { skill: string; count: number }>();

  for (const candidate of candidates) {
    const candidateSkills = new Set(candidate.skills.map((skill) => skill.toLowerCase()));

    for (const normalizedSkill of candidateSkills) {
      const displaySkill = candidate.skills.find(
        (skill) => skill.toLowerCase() === normalizedSkill,
      );
      const existing = skillCounts.get(normalizedSkill);

      if (existing) {
        existing.count += 1;
      } else if (displaySkill !== undefined) {
        skillCounts.set(normalizedSkill, { skill: displaySkill, count: 1 });
      }
    }
  }

  return [...skillCounts.values()]
    .sort(
      (skillA, skillB) =>
        skillB.count - skillA.count || skillA.skill.localeCompare(skillB.skill),
    )
    .slice(0, Math.floor(topN));
}

export function calculateVacancyFillRate(processes: SelectionProcess[]): number {
  if (processes.length === 0) {
    return 0;
  }

  const hiredProcesses = processes.filter((process) => process.stage === "Hired").length;
  return Math.round((hiredProcesses / processes.length) * 10000) / 100;
}
