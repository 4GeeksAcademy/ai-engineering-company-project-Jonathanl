import type { Config } from "jest";

const config: Config = {
  preset: "ts-jest",
  testEnvironment: "node",
  roots: ["<rootDir>/__tests__"],
  moduleNameMapper: {
    "^@/(.*)$": "<rootDir>/src/$1",
  },
  collectCoverageFrom: ["src/lib/domain.ts", "src/lib/api.ts"],
  coverageDirectory: "coverage",
  coverageReporters: ["text", "lcov"],
};

export default config;
