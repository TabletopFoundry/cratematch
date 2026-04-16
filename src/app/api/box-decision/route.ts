import { persistBoxDecision } from "@/lib/server-data";
import type { BoxDecision } from "@/lib/types";

export const runtime = "nodejs";

const validDecisions = new Set<BoxDecision>(["keep", "return", "undecided"]);

export async function POST(request: Request) {
  try {
    const body = (await request.json()) as { gameSlug?: string; decision?: BoxDecision };

    if (!body.gameSlug || typeof body.gameSlug !== "string" || body.gameSlug.trim().length === 0 || body.gameSlug.length > 100) {
      return Response.json({ error: "Provide a valid game slug." }, { status: 400 });
    }

    if (!body.decision || !validDecisions.has(body.decision)) {
      return Response.json({ error: "Pick a valid box decision." }, { status: 400 });
    }

    const snapshot = persistBoxDecision(body.decision, body.gameSlug);
    return Response.json({ ok: true, snapshot });
  } catch {
    return Response.json({ error: "Unable to update your decision." }, { status: 500 });
  }
}
