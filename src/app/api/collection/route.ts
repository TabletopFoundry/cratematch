import { persistCollection } from "@/lib/server-data";

export const runtime = "nodejs";

async function handle(request: Request, action: "add" | "remove") {
  try {
    const body = (await request.json()) as { gameSlug?: string };

    if (!body.gameSlug) {
      return Response.json({ error: "Choose a game to update your collection." }, { status: 400 });
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
