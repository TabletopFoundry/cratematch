import { persistCollection } from "@/lib/server-data";

export const runtime = "nodejs";

async function handle(request: Request, action: "add" | "remove") {
  try {
    const body = (await request.json()) as { gameSlug?: string };

    if (!body.gameSlug || typeof body.gameSlug !== "string" || body.gameSlug.trim().length === 0 || body.gameSlug.length > 100) {
      return Response.json({ error: "Choose a valid game to update your collection (max 100 characters)." }, { status: 400 });
    }

    const snapshot = persistCollection(action, body.gameSlug);
    return Response.json({ ok: true, snapshot });
  } catch {
    return Response.json({ error: "Unable to update collection." }, { status: 500 });
  }
}

export async function POST(request: Request) {
  return handle(request, "add");
}

export async function DELETE(request: Request) {
  return handle(request, "remove");
}
