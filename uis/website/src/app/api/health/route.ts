import { NextResponse } from "next/server";

export const dynamic = "force-dynamic";

export async function GET() {
  const backendUrl = (process.env.BACKEND_URL ?? "http://backend:8000").replace(/\/$/, "");
  let backendReachable = false;

  try {
    const response = await fetch(`${backendUrl}/openapi.json`, {
      cache: "no-store",
      signal: AbortSignal.timeout(2500),
    });
    backendReachable = response.ok;
  } catch {
    backendReachable = false;
  }

  return NextResponse.json({
    status: "ok",
    app: "website",
    backendReachable,
  });
}
