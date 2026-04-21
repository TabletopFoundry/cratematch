import { getDb } from "@/lib/db";

export const runtime = "nodejs";

export function GET() {
  try {
    const db = getDb();
    const row = db.prepare("SELECT COUNT(*) AS count FROM games").get() as { count: number } | undefined;
    const gameCount = row?.count ?? 0;

    return Response.json({
      status: "healthy",
      timestamp: new Date().toISOString(),
      version: process.env.npm_package_version ?? "0.1.0",
      database: {
        connected: true,
        gameCount,
      },
    });
  } catch {
    return Response.json(
      {
        status: "unhealthy",
        timestamp: new Date().toISOString(),
        database: { connected: false },
      },
      { status: 503 },
    );
  }
}
