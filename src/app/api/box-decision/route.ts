import { getCurrentBoxMonth, persistBoxDecision } from "@/lib/server-data";
import type { BoxDecision } from "@/lib/types";

export const runtime = "nodejs";

const validDecisions = new Set<BoxDecision>(["keep", "return", "undecided"]);
const MONTH_PATTERN = /^\d{4}-\d{2}$/;

export async function POST(request: Request) {
  try {
    const body = (await request.json()) as { gameSlug?: string; decision?: BoxDecision; monthLabel?: string };

    if (!body.gameSlug || typeof body.gameSlug !== "string" || body.gameSlug.trim().length === 0 || body.gameSlug.length > 100) {
      return Response.json({ error: "Provide a valid game slug." }, { status: 400 });
    }

    if (!body.decision || !validDecisions.has(body.decision)) {
      return Response.json({ error: "Pick a valid box decision." }, { status: 400 });
    }

    if (!body.monthLabel || typeof body.monthLabel !== "string" || !MONTH_PATTERN.test(body.monthLabel)) {
      return Response.json({ error: "Provide a valid month label (YYYY-MM)." }, { status: 400 });
    }

    const serverMonth = getCurrentBoxMonth();
    if (body.monthLabel !== serverMonth) {
      return Response.json(
        { error: "Month mismatch — your session shows a different month than the server. Please refresh the page." },
        { status: 409 },
      );
    }

    persistBoxDecision(body.decision, body.gameSlug, body.monthLabel);
    return Response.json({ ok: true });
  } catch {
    return Response.json({ error: "Unable to update your decision." }, { status: 500 });
  }
}
