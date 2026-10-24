import type { Candidate } from "../types/models.js";

export function findCandidateById(candidates: Candidate[], id: string): Candidate | null {
  return candidates.find((candidate) => candidate.id === id) ?? null;
}

export function findCandidateByEmail(candidates: Candidate[], email: string): Candidate | null {
  const normalizedEmail = email.toLowerCase();
  return (
    candidates.find((candidate) => candidate.email.toLowerCase() === normalizedEmail) ?? null
  );
}

export function binarySearchCandidateBySalary(
  sortedCandidates: Candidate[],
  targetSalary: number,
): number {
  let low = 0;
  let high = sortedCandidates.length - 1;

  while (low <= high) {
    const middle = Math.floor((low + high) / 2);
    const salary = sortedCandidates[middle].expectedSalary;

    if (salary === targetSalary) {
      return middle;
    }

    if (salary < targetSalary) {
      low = middle + 1;
    } else {
      high = middle - 1;
    }
  }

  return -1;
}
