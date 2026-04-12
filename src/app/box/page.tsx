import { BoxDecisionPanel } from "@/components/box-decision-panel";
import { GameCover } from "@/components/game-cover";
import { getBoxSnapshot } from "@/lib/server-data";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

export default function BoxPage() {
  const { currentMatch, alternatives, pastBoxes, decision, monthLabel, reviewQueueSize, profile } = getBoxSnapshot();

  if (!currentMatch) {
    return (
      <div className="mx-auto max-w-4xl px-4 py-16 sm:px-6 lg:px-8">
        <div className="rounded-[2rem] border border-dashed border-orange-200 bg-orange-50/70 px-6 py-12 text-center text-stone-600">
          We need a completed taste profile before revealing this month’s match. Head to onboarding to unlock the preview.
        </div>
      </div>
    );
  }

  return (
    <div className="mx-auto flex max-w-7xl flex-col gap-10 px-4 py-12 sm:px-6 lg:px-8">
      <section className="grid gap-8 lg:grid-cols-[0.95fr_1.05fr] lg:items-start">
        <div className="space-y-5">
          <div className="inline-flex rounded-full border border-orange-200 bg-white px-4 py-2 text-xs font-semibold uppercase tracking-[0.24em] text-orange-500">
            {monthLabel} crate reveal
          </div>
          <div>
            <h1 className="text-4xl font-semibold tracking-tight text-stone-950">This month’s match: {currentMatch.game.title}</h1>
            <p className="mt-4 text-lg leading-8 text-stone-600">
              Crafted for {profile.idealPlayerCount}-player nights, your current {profile.planId} tier, and a fit score of {Math.round(currentMatch.confidence * 100)}%.
            </p>
          </div>
          <div className="grid gap-4 sm:grid-cols-3">
            <div className="rounded-[1.5rem] border border-orange-100 bg-white px-5 py-4 shadow-sm">
              <div className="text-xs uppercase tracking-[0.2em] text-stone-500">Play time</div>
              <div className="mt-2 text-xl font-semibold text-stone-950">{currentMatch.game.playTime} min</div>
            </div>
            <div className="rounded-[1.5rem] border border-orange-100 bg-white px-5 py-4 shadow-sm">
              <div className="text-xs uppercase tracking-[0.2em] text-stone-500">Players</div>
              <div className="mt-2 text-xl font-semibold text-stone-950">{currentMatch.game.minPlayers}-{currentMatch.game.maxPlayers}</div>
            </div>
            <div className="rounded-[1.5rem] border border-orange-100 bg-white px-5 py-4 shadow-sm">
              <div className="text-xs uppercase tracking-[0.2em] text-stone-500">Complexity</div>
              <div className="mt-2 text-xl font-semibold text-stone-950">{currentMatch.game.complexity.toFixed(1)} / 5</div>
            </div>
          </div>
          <GameCover game={currentMatch.game} />
        </div>

        <div className="space-y-6">
          <div className="rounded-[2rem] border border-orange-100 bg-white p-6 shadow-[0_28px_70px_-44px_rgba(154,52,18,0.4)]">
            <p className="text-sm font-semibold uppercase tracking-[0.24em] text-orange-500">Why this game?</p>
            <h2 className="mt-2 text-2xl font-semibold text-stone-950">A transparent explanation, not vague AI magic</h2>
            <ul className="mt-5 space-y-3 text-sm leading-7 text-stone-600">
              {currentMatch.reasons.map((reason) => (
                <li key={reason} className="flex gap-3 rounded-2xl border border-orange-100 bg-orange-50/60 px-4 py-3">
                  <span className="mt-0.5 text-orange-500">✦</span>
                  <span>{reason}</span>
                </li>
              ))}
            </ul>
            <div className="mt-5 flex flex-wrap gap-2">
              {currentMatch.game.mechanics.map((mechanic) => (
                <span key={mechanic} className="rounded-full border border-orange-200 px-3 py-1 text-xs font-semibold uppercase tracking-[0.18em] text-stone-600">
                  {mechanic.replace(/-/g, " ")}
                </span>
              ))}
            </div>
          </div>

          <BoxDecisionPanel gameSlug={currentMatch.game.slug} monthLabel={monthLabel} initialDecision={decision} />
        </div>
      </section>

      <section className="grid gap-6 lg:grid-cols-[1.1fr_0.9fr]">
        <div className="rounded-[2rem] border border-orange-100 bg-white p-6 shadow-[0_28px_70px_-44px_rgba(154,52,18,0.4)]">
          <p className="text-sm font-semibold uppercase tracking-[0.24em] text-orange-500">Past boxes</p>
          <h2 className="mt-2 text-2xl font-semibold text-stone-950">Your recent crate history</h2>
          <div className="mt-5 space-y-4">
            {pastBoxes.map((box) => (
              <div key={box.boxMonth} className="rounded-[1.5rem] border border-orange-100 p-4">
                <div className="flex items-center justify-between gap-4">
                  <div>
                    <div className="text-sm font-semibold uppercase tracking-[0.18em] text-orange-500">{box.boxMonth}</div>
                    <div className="mt-1 text-lg font-semibold text-stone-950">{box.game?.title ?? box.gameSlug}</div>
                  </div>
                  <div className="rounded-full bg-orange-50 px-3 py-1 text-xs font-semibold text-stone-700">History</div>
                </div>
                <p className="mt-3 text-sm leading-7 text-stone-600">{box.note}</p>
              </div>
            ))}
          </div>
        </div>

        <div className="space-y-6">
          <div className="rounded-[2rem] border border-orange-100 bg-gradient-to-br from-amber-50 via-orange-50 to-rose-50 p-6">
            <p className="text-sm font-semibold uppercase tracking-[0.24em] text-orange-500">Backup matches</p>
            <h2 className="mt-2 text-2xl font-semibold text-stone-950">If inventory shifts, these stay on deck</h2>
            <div className="mt-5 space-y-4">
              {alternatives.map((alternative) => (
                <div key={alternative.game.slug} className="rounded-[1.5rem] border border-white/80 bg-white/90 p-4 shadow-sm">
                  <div className="flex items-center justify-between gap-3">
                    <div className="font-semibold text-stone-950">{alternative.game.title}</div>
                    <div className="rounded-full bg-orange-50 px-3 py-1 text-xs font-semibold text-orange-700">{Math.round(alternative.confidence * 100)}% fit</div>
                  </div>
                  <p className="mt-2 text-sm text-stone-600">{alternative.reasons[0]}</p>
                </div>
              ))}
            </div>
          </div>
          <div className="rounded-[2rem] border border-orange-100 bg-white p-6 shadow-sm">
            <p className="text-sm font-semibold uppercase tracking-[0.24em] text-orange-500">Operational state</p>
            <h2 className="mt-2 text-2xl font-semibold text-stone-950">Review queue status</h2>
            <p className="mt-3 text-sm leading-7 text-stone-600">
              {reviewQueueSize} low-confidence candidates remain in the merchandiser review lane. This preview auto-finalized because your fit score cleared the confidence threshold.
            </p>
          </div>
        </div>
      </section>
    </div>
  );
}
