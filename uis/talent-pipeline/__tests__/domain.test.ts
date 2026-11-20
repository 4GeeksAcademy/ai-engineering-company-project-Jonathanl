import { formatCandidateDate, getInitials } from "@/lib/domain";

describe("getInitials", () => {
  it("returns the uppercase initials of the first two name parts", () => {
    expect(getInitials("  ana   García López ")).toBe("AG");
  });

  it("returns an empty string for an empty name", () => {
    expect(getInitials("")).toBe("");
  });
});

describe("formatCandidateDate", () => {
  it("formats a valid date using the Spanish locale", () => {
    expect(formatCandidateDate("2024-01-15T12:00:00Z")).toBe("15 de enero de 2024");
  });

  it("returns the original value when the date is invalid", () => {
    expect(formatCandidateDate("no-es-una-fecha")).toBe("no-es-una-fecha");
  });
});
