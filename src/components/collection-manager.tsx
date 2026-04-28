"use client";

import { useMemo, useState, useTransition } from "react";
import { useRouter } from "next/navigation";

import { GameCover } from "@/components/game-cover";
import type { CollectionInsight, Game } from "@/lib/types";

type RecommendationCard = {
  game: Game;
  confidence: number;
  reasons: string[];
};

export function CollectionManager({
  availableGames,
  initialOwnedGames,
  insights,
  recommendations,
  ownedCount,
}: {
  availableGames: Game[];
  initialOwnedGames: Game[];
  insights: CollectionInsight[];
  recommendations: RecommendationCard[];
  ownedCount: number;
}) {
  const router = useRouter();
  const [search, setSearch] = useState("");
  const [ownedGames, setOwnedGames] = useState(initialOwnedGames);
  const [status, setStatus] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [pending, startTransition] = useTransition();

  const ownedSlugs = useMemo(() => new Set(ownedGames.map((game) => game.slug)), [ownedGames]);

  const searchResults = useMemo(() => {
    const normalized = search.trim().toLowerCase();
    return availableGames
      .filter((game) => {
        if (!normalized) {
          return !ownedSlugs.has(game.slug);
        }

        return game.title.toLowerCase().includes(normalized) || game.themes.some((theme) => theme.includes(normalized)) || game.mechanics.some((mechanic) => mechanic.includes(normalized));
      })
      .slice(0, 8);
  }, [availableGames, ownedSlugs, search]);

  function mutateCollection(action: "add" | "remove", game: Game) {
    setStatus(null);
    setError(null);

    startTransition(async () => {
      try {
        const response = await fetch("/api/collection", {
          method: action === "add" ? "POST" : "DELETE",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ gameSlug: game.slug }),
        });

        if (!response.ok) {
          const body = (await response.json().catch(() => null)) as { error?: string } | null;
          throw new Error(body?.error ?? "Unable to update collection.");
        }

        setOwnedGames((current) => {
          if (action === "add") {
            return current.some((item) => item.slug === game.slug) ? current : [...current, game].sort((left, right) => left.title.localeCompare(right.title));
          }

          return current.filter((item) => item.slug !== game.slug);
        });
        setStatus(action === "add" ? `${game.title} added to your collection.` : `${game.title} removed from your collection.`);
        router.refresh();
      } catch (mutationError) {
        setError(mutationError instanceof Error ? mutationError.message : "Unable to update collection.");
      }
    });
  }

  return (
    <div className="space-y-6">
      <div className="grid gap-6 lg:grid-cols-[1.1fr_0.9fr]">
        <div className="rounded-[2rem] border border-orange-100 bg-white p-6 shadow-[0_28px_70px_-44px_rgba(154,52,18,0.4)]">
          <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
            <div>
              <p className="text-sm font-semibold uppercase tracking-[0.24em] text-orange-500">Your shelf</p>
              <h3 className="mt-2 text-2xl font-semibold text-stone-950">Manage the games you already own</h3>
            </div>
            <div className="rounded-full border border-orange-200 bg-orange-50 px-4 py-2 text-sm text-stone-700">
              Games owned: {ownedCount}
            </div>
          </div>

          <div className="mt-5">
            <label className="text-sm font-medium text-stone-700" htmlFor="collection-search">
              Add a game to your collection
            </label>
            <input
              id="collection-search"
              value={search}
              onChange={(event) => setSearch(event.target.value)}
              placeholder="Search titles, themes, or mechanics"
              className="mt-2 w-full rounded-2xl border border-orange-200 bg-orange-50/60 px-4 py-3 transition focus:border-orange-400 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-orange-400"
            />
          </div>

          <div className="mt-5 grid gap-3">
            {searchResults.map((game) => {
              const owned = ownedSlugs.has(game.slug);
              return (
                <div key={game.slug} className="flex flex-col gap-3 rounded-[1.5rem] border border-orange-100 p-4 sm:flex-row sm:items-center sm:justify-between">
                  <div>
                    <div className="font-semibold text-stone-950">{game.title}</div>
                    <div className="text-sm text-stone-600">{game.themes.slice(0, 2).join(" • ")} • {game.playTime} min</div>
                  </div>
                  <button
                    type="button"
                    disabled={owned || pending}
                    onClick={() => mutateCollection("add", game)}
                    className={`rounded-full px-4 py-2 text-sm font-medium focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-orange-400 ${owned ? "cursor-not-allowed border border-emerald-200 bg-emerald-50 text-emerald-800" : "bg-stone-950 text-white"}`}
                  >
                    {owned ? "Already owned" : pending ? "Updating..." : "Add game"}
                  </button>
                </div>
              );
            })}
            {!searchResults.length && (
              <div className="rounded-[1.5rem] border border-dashed border-orange-200 bg-orange-50/60 px-4 py-8 text-center text-sm text-stone-600">
                No matching games found. Try a broader title or theme search.
              </div>
            )}
          </div>
        </div>

        <div className="rounded-[2rem] border border-orange-100 bg-gradient-to-br from-amber-50 via-orange-50 to-rose-50 p-6">
          <p className="text-sm font-semibold uppercase tracking-[0.24em] text-orange-500">Gap analysis</p>
          <h3 className="mt-2 text-2xl font-semibold text-stone-950">What your collection is missing</h3>
          <div className="mt-5 space-y-4">
            {insights.map((insight) => (
              <div key={insight.title} className="rounded-[1.5rem] border border-white/70 bg-white/90 p-4 shadow-sm">
                <div className="text-sm font-semibold text-stone-950">{insight.title}</div>
                <p className="mt-2 text-sm text-stone-600">{insight.body}</p>
                <p className="mt-3 text-sm font-medium text-orange-600">Suggested title: {insight.game.title}</p>
              </div>
            ))}
          </div>
        </div>
      </div>

      <div role="status" aria-live="polite">
        {(status || error) && (
          <div className={`rounded-2xl px-4 py-3 text-sm ${status ? "border border-emerald-200 bg-emerald-50 text-emerald-900" : "border border-rose-200 bg-rose-50 text-rose-900"}`}>
            {status ?? error}
          </div>
        )}
      </div>

      <div className="grid gap-6 lg:grid-cols-[1.1fr_0.9fr]">
        <div className="rounded-[2rem] border border-orange-100 bg-white p-6 shadow-[0_28px_70px_-44px_rgba(154,52,18,0.4)]">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm font-semibold uppercase tracking-[0.24em] text-orange-500">Owned games</p>
              <h3 className="mt-2 text-2xl font-semibold text-stone-950">Current collection</h3>
            </div>
            <div className="rounded-full bg-orange-50 px-4 py-2 text-sm text-stone-700">{ownedGames.length} titles tracked</div>
          </div>

          {ownedGames.length ? (
            <div className="mt-5 grid gap-3 sm:grid-cols-2">
              {ownedGames.map((game) => (
                <div key={game.slug} className="rounded-[1.5rem] border border-orange-100 p-4">
                  <div className="flex items-center justify-between gap-3">
                    <div>
                      <div className="font-semibold text-stone-950">{game.title}</div>
                      <div className="text-sm text-stone-600">{game.mechanics.slice(0, 2).join(" • ")}</div>
                    </div>
                    <button
                      type="button"
                      onClick={() => mutateCollection("remove", game)}
                      disabled={pending}
                      className="rounded-full border border-orange-200 px-3 py-1.5 text-xs font-medium text-stone-700 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-orange-400"
                    >
                      Remove
                    </button>
                  </div>
                </div>
              ))}
            </div>
          ) : (
            <div className="mt-5 rounded-[1.5rem] border border-dashed border-orange-200 bg-orange-50/60 px-4 py-10 text-center text-sm text-stone-600">
              Your collection is empty. Add a few owned games to sharpen duplicate prevention and gap analysis.
            </div>
          )}
        </div>

        <div className="rounded-[2rem] border border-orange-100 bg-white p-6 shadow-[0_28px_70px_-44px_rgba(154,52,18,0.4)]">
          <p className="text-sm font-semibold uppercase tracking-[0.24em] text-orange-500">Complementary picks</p>
          <h3 className="mt-2 text-2xl font-semibold text-stone-950">Based on your taste, you’d love...</h3>
          <div className="mt-5 space-y-4">
            {recommendations.map((recommendation) => (
              <div key={recommendation.game.slug} className="grid gap-4 rounded-[1.5rem] border border-orange-100 p-4 sm:grid-cols-[96px_1fr]">
                <GameCover game={recommendation.game} compact />
                <div>
                  <div className="flex items-center justify-between gap-3">
                    <div className="font-semibold text-stone-950">{recommendation.game.title}</div>
                    <div className="rounded-full bg-orange-50 px-3 py-1 text-xs font-semibold text-orange-700">{Math.round(recommendation.confidence * 100)}% fit</div>
                  </div>
                  <p className="mt-2 text-sm text-stone-600">{recommendation.reasons[0]}</p>
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
}
