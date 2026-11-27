const fetchMock = jest.fn();
let getCandidate: typeof import("@/lib/api").getCandidate;

const validCandidate = {
  id: "candidate-1",
  full_name: "Ana García",
  email: "ana@example.com",
  phone: "123456",
  position: "Ingeniera",
  linkedin_url: null,
  cv_url: null,
  status: "received",
  stage: "pending",
  experience_years: 4,
  notes_count: 0,
  applied_at: "2024-01-15T12:00:00Z",
  updated_at: "2024-01-15T12:00:00Z",
};

describe("getCandidate", () => {
  const originalFetch = global.fetch;
  const originalApiUrl = process.env.NEXT_PUBLIC_API_URL;

  beforeAll(() => {
    process.env.NEXT_PUBLIC_API_URL = "https://api.example.test";
    ({ getCandidate } = require("@/lib/api") as typeof import("@/lib/api"));
  });

  beforeEach(() => {
    fetchMock.mockReset();
    global.fetch = fetchMock;
  });

  afterAll(() => {
    global.fetch = originalFetch;
    if (originalApiUrl === undefined) delete process.env.NEXT_PUBLIC_API_URL;
    else process.env.NEXT_PUBLIC_API_URL = originalApiUrl;
  });

  it("returns a valid candidate from the API", async () => {
    fetchMock.mockResolvedValue({ ok: true, status: 200, json: async () => validCandidate });

    await expect(getCandidate("candidate-1")).resolves.toEqual(validCandidate);
  });

  it("rejects an API payload that is not a valid candidate", async () => {
    fetchMock.mockResolvedValue({ ok: true, status: 200, json: async () => ({ id: "candidate-1" }) });

    await expect(getCandidate("candidate-1")).rejects.toThrow(
      "El servicio devolvió datos de candidatura no válidos.",
    );
  });
});
