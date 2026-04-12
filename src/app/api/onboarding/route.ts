import { persistOnboarding } from "@/lib/server-data";
import type { PlanId, QuizAnswer } from "@/lib/types";

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

    if (!body.name || !body.planId || !body.answers || !Array.isArray(body.themes) || !Array.isArray(body.mechanics)) {
      return Response.json({ error: "Missing onboarding fields." }, { status: 400 });
    }

    const snapshot = persistOnboarding({
      name: body.name,
      planId: body.planId,
      idealPlayerCount: Number(body.idealPlayerCount ?? 4),
      idealPlayTime: Number(body.idealPlayTime ?? 90),
      complexityTarget: Number(body.complexityTarget ?? 3),
      themes: body.themes,
      mechanics: body.mechanics,
      answers: body.answers,
    });

    return Response.json({ ok: true, snapshot });
  } catch {
    return Response.json({ error: "Unable to save onboarding right now." }, { status: 500 });
  }
}
