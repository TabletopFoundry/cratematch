import { persistPlan } from "@/lib/server-data";
import type { PlanId } from "@/lib/types";

export const runtime = "nodejs";

const validPlans = new Set<PlanId>(["discovery", "explorer", "collector"]);

export async function POST(request: Request) {
  try {
    const body = (await request.json()) as { planId?: PlanId };

    if (!body.planId || !validPlans.has(body.planId)) {
      return Response.json({ error: "Select a valid subscription tier." }, { status: 400 });
    }

    persistPlan(body.planId);
    return Response.json({ ok: true });
  } catch {
    return Response.json({ error: "Checkout is temporarily unavailable." }, { status: 500 });
  }
}
