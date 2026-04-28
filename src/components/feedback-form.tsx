"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";

import type { Game } from "@/lib/types";

const FEEDBACK_TAGS = [
  "Perfect fit",
  "Fun mechanics",
  "Great theme",
  "Too complex",
  "Too simple",
  "Not my style",
  "Great for groups",
  "Good solo option",
];

type BoxWithFeedback = {
  boxMonth: string;
  gameSlug: string;
  note: string;
  game?: Game;
  feedback: { rating: number; tags: string[]; comment: string } | null;
};

export function FeedbackForm({ pastBoxes }: { pastBoxes: BoxWithFeedback[] }) {
  const router = useRouter();
  const [pendingBoxMonth, setPendingBoxMonth] = useState<string | null>(null);
  const [status, setStatus] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [ratings, setRatings] = useState<Record<string, number>>(
    Object.fromEntries(pastBoxes.filter((b) => b.feedback).map((b) => [b.boxMonth, b.feedback!.rating]))
  );
  const [tags, setTags] = useState<Record<string, string[]>>(
    Object.fromEntries(pastBoxes.filter((b) => b.feedback).map((b) => [b.boxMonth, b.feedback!.tags]))
  );
  const [comments, setComments] = useState<Record<string, string>>(
    Object.fromEntries(pastBoxes.filter((b) => b.feedback).map((b) => [b.boxMonth, b.feedback!.comment]))
  );

  function toggleTag(boxMonth: string, tag: string) {
    setTags((current) => {
      const existing = current[boxMonth] ?? [];
      return {
        ...current,
        [boxMonth]: existing.includes(tag) ? existing.filter((t) => t !== tag) : [...existing, tag],
      };
    });
  }

  async function submitFeedback(box: BoxWithFeedback) {
    const rating = ratings[box.boxMonth];
    if (!rating) {
      setError("Select a star rating before submitting.");
      return;
    }

    setError(null);
    setStatus(null);
    setPendingBoxMonth(box.boxMonth);

    try {
      const response = await fetch("/api/feedback", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          boxMonth: box.boxMonth,
          gameSlug: box.gameSlug,
          rating,
          tags: tags[box.boxMonth] ?? [],
          comment: comments[box.boxMonth] ?? "",
        }),
      });

      if (!response.ok) {
        const body = (await response.json().catch(() => null)) as { error?: string } | null;
        throw new Error(body?.error ?? "Unable to save feedback.");
      }

      setStatus(`Feedback for ${box.game?.title ?? box.gameSlug} saved successfully.`);
      router.refresh();
    } catch (feedbackError) {
      setError(feedbackError instanceof Error ? feedbackError.message : "Unable to save feedback.");
    } finally {
      setPendingBoxMonth(null);
    }
  }

  if (!pastBoxes.length) {
    return (
      <div className="rounded-[2rem] border border-dashed border-orange-200 bg-orange-50/70 px-6 py-12 text-center text-stone-600">
        No past boxes to review yet. Your feedback history will appear here after your first delivery.
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div role="status" aria-live="polite">
        {(status || error) && (
          <div className={`rounded-2xl px-4 py-3 text-sm ${status ? "border border-emerald-200 bg-emerald-50 text-emerald-900" : "border border-rose-200 bg-rose-50 text-rose-900"}`}>
            {status ?? error}
          </div>
        )}
      </div>

      {pastBoxes.map((box) => {
        const currentRating = ratings[box.boxMonth] ?? 0;
        const currentTags = tags[box.boxMonth] ?? [];
        const hasFeedback = !!box.feedback;

        return (
          <div key={box.boxMonth} className="rounded-[2rem] border border-orange-100 bg-white p-6 shadow-[0_28px_70px_-44px_rgba(154,52,18,0.4)]">
            <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
              <div>
                <p className="text-sm font-semibold uppercase tracking-[0.24em] text-orange-500">{box.boxMonth} crate</p>
                <h3 className="mt-2 text-2xl font-semibold text-stone-950">{box.game?.title ?? box.gameSlug}</h3>
                <p className="mt-2 text-sm text-stone-600">{box.note}</p>
              </div>
              {hasFeedback && (
                <span className="rounded-full border border-emerald-200 bg-emerald-50 px-3 py-1 text-xs font-semibold text-emerald-700">
                  Feedback submitted
                </span>
              )}
            </div>

            <div className="mt-5">
              <div className="text-sm font-medium text-stone-700" id={`rating-label-${box.boxMonth}`}>Rate this crate</div>
              <div
                className="mt-2 flex gap-2"
                role="radiogroup"
                aria-label={`Rating for ${box.game?.title ?? box.gameSlug}`}
                aria-labelledby={`rating-label-${box.boxMonth}`}
              >
                {[1, 2, 3, 4, 5].map((star) => (
                  <button
                    key={star}
                    type="button"
                    role="radio"
                    aria-checked={currentRating === star}
                    aria-label={`${star} out of 5 stars`}
                    tabIndex={currentRating === star || (currentRating === 0 && star === 1) ? 0 : -1}
                    onClick={() => setRatings((current) => ({ ...current, [box.boxMonth]: star }))}
                    onKeyDown={(event) => {
                      let next = star;
                      if (event.key === "ArrowRight" || event.key === "ArrowDown") {
                        event.preventDefault();
                        next = star < 5 ? star + 1 : 1;
                      } else if (event.key === "ArrowLeft" || event.key === "ArrowUp") {
                        event.preventDefault();
                        next = star > 1 ? star - 1 : 5;
                      } else {
                        return;
                      }
                      setRatings((current) => ({ ...current, [box.boxMonth]: next }));
                      const container = event.currentTarget.parentElement;
                      const nextButton = container?.children[next - 1] as HTMLElement | undefined;
                      nextButton?.focus();
                    }}
                    className={`flex h-11 w-11 items-center justify-center rounded-xl border text-lg transition focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-orange-400 ${
                      currentRating >= star
                        ? "border-orange-500 bg-orange-500 text-white shadow-lg shadow-orange-200"
                        : "border-orange-200 bg-white text-stone-400 hover:border-orange-400 hover:text-orange-500"
                    }`}
                  >
                    ★
                  </button>
                ))}
              </div>
            </div>

            <div className="mt-5">
              <div className="text-sm font-medium text-stone-700">Tags (optional)</div>
              <div className="mt-2 flex flex-wrap gap-2">
                {FEEDBACK_TAGS.map((tag) => {
                  const active = currentTags.includes(tag);
                  return (
                    <button
                      key={tag}
                      type="button"
                      aria-pressed={active}
                      onClick={() => toggleTag(box.boxMonth, tag)}
                      className={`rounded-full border px-3 py-1.5 text-xs font-medium transition focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-orange-400 ${
                        active
                          ? "border-orange-500 bg-orange-500 text-white"
                          : "border-orange-200 bg-white text-stone-700 hover:border-orange-400"
                      }`}
                    >
                      {active && <span aria-hidden="true">✓ </span>}{tag}
                    </button>
                  );
                })}
              </div>
            </div>

            <div className="mt-5">
              <label className="text-sm font-medium text-stone-700" htmlFor={`comment-${box.boxMonth}`}>
                Additional comments (optional)
              </label>
              <textarea
                id={`comment-${box.boxMonth}`}
                value={comments[box.boxMonth] ?? ""}
                onChange={(event) => setComments((current) => ({ ...current, [box.boxMonth]: event.target.value }))}
                placeholder="Tell us what you thought..."
                rows={3}
                maxLength={2000}
                className="mt-2 w-full rounded-2xl border border-orange-200 bg-orange-50/60 px-4 py-3 text-sm transition focus:border-orange-400 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-orange-400"
              />
              <div className="mt-1 text-right text-xs text-stone-400">
                {(comments[box.boxMonth] ?? "").length}/2000
              </div>
            </div>

            <button
              type="button"
              onClick={() => submitFeedback(box)}
              disabled={pendingBoxMonth === box.boxMonth || !currentRating}
              className="mt-4 rounded-full bg-stone-950 px-5 py-2.5 text-sm font-medium text-white shadow-lg shadow-stone-950/10 disabled:cursor-not-allowed disabled:opacity-50 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-orange-400"
            >
              {pendingBoxMonth === box.boxMonth ? "Saving..." : hasFeedback ? "Update feedback" : "Submit feedback"}
            </button>
          </div>
        );
      })}
    </div>
  );
}
