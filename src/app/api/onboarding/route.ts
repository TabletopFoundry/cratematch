import { ALL_THEMES, ALL_MECHANICS } from "@/lib/catalog";
import { persistOnboarding } from "@/lib/server-data";
import type { PlanId, QuizAnswer, RatingValue } from "@/lib/types";

export const runtime = "nodejs";

export async function POST(request: Request) {
  try {
    const body = (await request.json()) as {
      name?: string;
      planId?: PlanId;
      idealPlayerCount?: number;
      idealPlayTime?: number;
      complexityTarget?: number;
      themes?: string[];
      mechanics?: string[];
      answers?: QuizAnswer[];
    };

    if (!body.name || typeof body.name !== "string" || body.name.trim().length === 0 || body.name.length > 100) {
      return Response.json({ error: "Name is required (max 100 characters)." }, { status: 400 });
    }

    const validPlans = new Set<PlanId>(["discovery", "explorer", "collector"]);
    if (!body.planId || !validPlans.has(body.planId)) {
      return Response.json({ error: "Select a valid plan: discovery, explorer, or collector." }, { status: 400 });
    }

    if (!Array.isArray(body.themes) || body.themes.some((t) => typeof t !== "string" || t.length > 50)) {
      return Response.json({ error: "Themes must be an array of strings (max 50 chars each)." }, { status: 400 });
    }

    if (body.themes.length > 20) {
      return Response.json({ error: "Select up to 20 themes." }, { status: 400 });
    }

    if (!Array.isArray(body.mechanics) || body.mechanics.some((m) => typeof m !== "string" || m.length > 50)) {
      return Response.json({ error: "Mechanics must be an array of strings (max 50 chars each)." }, { status: 400 });
    }

    if (body.mechanics.length > 20) {
      return Response.json({ error: "Select up to 20 mechanics." }, { status: 400 });
    }

    if (!Array.isArray(body.answers)) {
      return Response.json({ error: "Answers must be an array." }, { status: 400 });
    }

    const validRatings = new Set<RatingValue>(["loved", "liked", "neutral", "disliked", "unplayed"]);
    const sanitizedAnswers: QuizAnswer[] = (body.answers as unknown[])
      .filter(
        (a): a is Record<string, unknown> =>
          a !== null && typeof a === "object" && typeof (a as Record<string, unknown>).gameSlug === "string" && typeof (a as Record<string, unknown>).rating === "string",
      )
      .filter((a) => {
        const slug = a.gameSlug as string;
        const rating = a.rating as string;
        return slug.length > 0 && slug.length <= 100 && validRatings.has(rating as RatingValue);
      })
      .map((a) => ({ gameSlug: (a.gameSlug as string).trim(), rating: a.rating as RatingValue }));

    if (sanitizedAnswers.length > 50) {
      return Response.json({ error: "Too many quiz answers." }, { status: 400 });
    }

    const validThemes = new Set<string>(ALL_THEMES);
    const validMechanics = new Set<string>(ALL_MECHANICS);
    const sanitizedThemes = body.themes.map((t) => t.trim().slice(0, 50)).filter((t) => validThemes.has(t));
    const sanitizedMechanics = body.mechanics.map((m) => m.trim().slice(0, 50)).filter((m) => validMechanics.has(m));

    const playerCount = Number(body.idealPlayerCount ?? 4);
    if (!Number.isFinite(playerCount) || playerCount < 1 || playerCount > 6) {
      return Response.json({ error: "Ideal player count must be between 1 and 6." }, { status: 400 });
    }

    const playTime = Number(body.idealPlayTime ?? 90);
    if (!Number.isFinite(playTime) || playTime < 20 || playTime > 180) {
      return Response.json({ error: "Ideal play time must be between 20 and 180 minutes." }, { status: 400 });
    }

    const complexity = Number(body.complexityTarget ?? 3);
    if (!Number.isFinite(complexity) || complexity < 1 || complexity > 5) {
      return Response.json({ error: "Complexity target must be between 1 and 5." }, { status: 400 });
    }

    persistOnboarding({
      name: body.name.trim().slice(0, 100),
      planId: body.planId,
      idealPlayerCount: playerCount,
      idealPlayTime: playTime,
      complexityTarget: complexity,
      themes: sanitizedThemes,
      mechanics: sanitizedMechanics,
      answers: sanitizedAnswers,
    });

    return Response.json({ ok: true });
  } catch {
    return Response.json({ error: "Unable to save onboarding right now." }, { status: 500 });
  }
}
