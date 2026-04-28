import { getPastBoxes } from "@/lib/db";
import { persistFeedback } from "@/lib/server-data";

export const runtime = "nodejs";

export async function POST(request: Request) {
  try {
    const body = (await request.json()) as {
      boxMonth?: string;
      gameSlug?: string;
      rating?: number;
      tags?: string[];
      comment?: string;
    };

    if (!body.boxMonth || typeof body.boxMonth !== "string" || body.boxMonth.trim().length === 0 || body.boxMonth.length > 20) {
      return Response.json({ error: "Provide a valid box month (max 20 characters)." }, { status: 400 });
    }

    if (!body.gameSlug || typeof body.gameSlug !== "string" || body.gameSlug.trim().length === 0 || body.gameSlug.length > 100) {
      return Response.json({ error: "Provide a valid game slug (max 100 characters)." }, { status: 400 });
    }

    if (typeof body.rating !== "number" || !Number.isInteger(body.rating) || body.rating < 1 || body.rating > 5) {
      return Response.json({ error: "Rating must be an integer between 1 and 5." }, { status: 400 });
    }

    if (body.tags !== undefined && (!Array.isArray(body.tags) || body.tags.some((t) => typeof t !== "string" || t.length > 50))) {
      return Response.json({ error: "Tags must be an array of strings (max 50 chars each)." }, { status: 400 });
    }

    if (body.comment !== undefined && (typeof body.comment !== "string" || body.comment.length > 2000)) {
      return Response.json({ error: "Comment must be a string of at most 2000 characters." }, { status: 400 });
    }

    const pastBoxes = getPastBoxes();
    const trimmedMonth = body.boxMonth.trim();
    const trimmedSlug = body.gameSlug.trim();
    const targetBox = pastBoxes.find((b) => b.boxMonth === trimmedMonth);
    if (!targetBox) {
      return Response.json({ error: "No delivery found for that month." }, { status: 400 });
    }
    if (targetBox.gameSlug !== trimmedSlug) {
      return Response.json({ error: "Game slug doesn't match the delivered game." }, { status: 400 });
    }

    persistFeedback({
      boxMonth: trimmedMonth,
      gameSlug: trimmedSlug,
      rating: body.rating,
      tags: (body.tags ?? []).map((t) => t.trim().slice(0, 50)),
      comment: (body.comment ?? "").trim().slice(0, 2000),
    });

    return Response.json({ ok: true });
  } catch {
    return Response.json({ error: "Unable to save feedback." }, { status: 500 });
  }
}
