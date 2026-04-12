"use client";

import { useMemo, useState, useTransition } from "react";
import { useRouter } from "next/navigation";

import { RATING_OPTIONS } from "@/lib/catalog";
import { buildTasteRadar } from "@/lib/recommendations";
import type { Game, PlanId, QuizAnswer, RadarDatum, UserProfile } from "@/lib/types";
import { TasteRadarChart } from "@/components/taste-radar-chart";

const quizStepSize = 5;

type WizardProps = {
  quizGames: Game[];
  allThemes: string[];
  allMechanics: string[];
  initialProfile: UserProfile;
  initialAnswers: QuizAnswer[];
  initialThemes: string[];
  initialMechanics: string[];
  initialRadarData: RadarDatum[];
};

export function OnboardingWizard({
  quizGames,
  allThemes,
  allMechanics,
  initialProfile,
  initialAnswers,
  initialThemes,
  initialMechanics,
  initialRadarData,
}: WizardProps) {
  const router = useRouter();
  const [step, setStep] = useState(0);
  const [pending, startTransition] = useTransition();
  const [message, setMessage] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [name, setName] = useState(initialProfile.name);
  const [planId, setPlanId] = useState<PlanId>(initialProfile.planId);
  const [idealPlayerCount, setIdealPlayerCount] = useState(initialProfile.idealPlayerCount);
  const [idealPlayTime, setIdealPlayTime] = useState(initialProfile.idealPlayTime);
  const [complexityTarget, setComplexityTarget] = useState(initialProfile.complexityTarget);
  const [themes, setThemes] = useState(initialThemes);
  const [mechanics, setMechanics] = useState(initialMechanics);
  const [answers, setAnswers] = useState<Record<string, QuizAnswer["rating"]>>(
    Object.fromEntries(initialAnswers.map((answer) => [answer.gameSlug, answer.rating]))
  );

  const steps = ["Rate 1-5", "Rate 6-10", "Rate 11-15", "Themes", "Mechanics", "Preferences", "Summary"];
  const quizStepCount = Math.ceil(quizGames.length / quizStepSize);
  const answeredCount = Object.values(answers).filter((rating) => rating !== "unplayed").length;
  const radarData = useMemo(
    () =>
      buildTasteRadar({
        answers: quizGames.map((game) => ({ gameSlug: game.slug, rating: answers[game.slug] ?? "unplayed" })),
        themes,
        mechanics,
        profile: {
          ...initialProfile,
          name,
          planId,
          idealPlayerCount,
          idealPlayTime,
          complexityTarget,
        },
      }),
    [answers, complexityTarget, idealPlayTime, idealPlayerCount, initialProfile, mechanics, name, planId, quizGames, themes]
  );

  const currentQuizGames = quizGames.slice(step * quizStepSize, step * quizStepSize + quizStepSize);
  const canSubmit = answeredCount >= 12 && themes.length >= 2 && mechanics.length >= 2;

  const payload = {
    name,
    planId,
    idealPlayerCount,
    idealPlayTime,
    complexityTarget,
    themes,
    mechanics,
    answers: quizGames.map((game) => ({ gameSlug: game.slug, rating: answers[game.slug] ?? "unplayed" })),
  };

  function toggleChoice(value: string, collection: string[], setter: (next: string[]) => void) {
    if (collection.includes(value)) {
      setter(collection.filter((item) => item !== value));
      return;
    }

    setter([...collection, value]);
  }

  async function persist(currentMessage: string) {
    setError(null);
    setMessage(null);

    const response = await fetch("/api/onboarding", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(payload),
    });

    if (!response.ok) {
      const body = (await response.json().catch(() => null)) as { error?: string } | null;
      throw new Error(body?.error ?? "Unable to save onboarding right now.");
    }

    setMessage(currentMessage);
    router.refresh();
  }

  function handleSaveProgress() {
    startTransition(async () => {
      try {
        await persist("Progress saved. You can leave and resume anytime.");
      } catch (saveError) {
        setError(saveError instanceof Error ? saveError.message : "Unable to save progress.");
      }
    });
  }

  function handleSubmit() {
    if (!canSubmit) {
      setError("Rate at least 12 games and choose at least two themes and mechanics before finishing.");
      return;
    }

    startTransition(async () => {
      try {
        await persist("Taste profile saved. Your monthly crate preview is refreshed below.");
      } catch (saveError) {
        setError(saveError instanceof Error ? saveError.message : "Unable to complete onboarding.");
      }
    });
  }

  return (
    <div className="space-y-6">
      <div className="overflow-hidden rounded-[2rem] border border-orange-100 bg-white shadow-[0_32px_80px_-48px_rgba(154,52,18,0.45)]">
        <div className="border-b border-orange-100 bg-gradient-to-r from-amber-50 via-orange-50 to-rose-50 px-6 py-5">
          <div className="flex flex-col gap-3 md:flex-row md:items-center md:justify-between">
            <div>
              <p className="text-sm font-semibold uppercase tracking-[0.25em] text-orange-500">Step {step + 1} of {steps.length}</p>
              <h2 className="mt-2 text-2xl font-semibold text-stone-950">{steps[step]}</h2>
              <p className="mt-2 text-sm text-stone-600">Resume-safe onboarding: save anytime, return later, and CrateMatch will keep your profile in sync.</p>
            </div>
            <div className="rounded-3xl bg-white/90 px-4 py-3 text-sm text-stone-600 shadow-sm ring-1 ring-orange-100">
              <div className="font-semibold text-stone-900">Anchor ratings completed</div>
              <div className="mt-1 text-2xl font-semibold text-orange-600">{answeredCount} / 15</div>
            </div>
          </div>
          <div className="mt-4 grid grid-cols-7 gap-2">
            {steps.map((label, index) => (
              <div key={label} className="space-y-2">
                <div className={`h-2 rounded-full ${index <= step ? "bg-orange-500" : "bg-orange-100"}`} />
                <p className="text-xs text-stone-500">{label}</p>
              </div>
            ))}
          </div>
        </div>

        <div className="space-y-6 px-6 py-6">
          {step < quizStepCount && (
            <div className="space-y-6">
              {currentQuizGames.map((game) => (
                <div key={game.slug} className="rounded-[1.5rem] border border-orange-100 bg-orange-50/50 p-5">
                  <div className="flex flex-col gap-3 lg:flex-row lg:items-center lg:justify-between">
                    <div>
                      <h3 className="text-lg font-semibold text-stone-950">{game.title}</h3>
                      <p className="text-sm text-stone-600">{game.description}</p>
                    </div>
                    <div className="text-xs uppercase tracking-[0.2em] text-orange-500">{game.themes.slice(0, 2).join(" • ")}</div>
                  </div>
                  <div className="mt-4 grid gap-2 sm:grid-cols-5" role="radiogroup" aria-label={`Rate ${game.title}`}>
                    {RATING_OPTIONS.map((option) => {
                      const active = (answers[game.slug] ?? "unplayed") === option.value;
                      return (
                        <button
                          key={option.value}
                          type="button"
                          onClick={() => setAnswers((current) => ({ ...current, [game.slug]: option.value }))}
                          className={`rounded-2xl border px-3 py-3 text-sm font-medium transition ${active ? "border-orange-500 bg-orange-500 text-white shadow-lg shadow-orange-200" : "border-orange-200 bg-white text-stone-700 hover:border-orange-400 hover:text-orange-700"}`}
                        >
                          {option.label}
                        </button>
                      );
                    })}
                  </div>
                </div>
              ))}
            </div>
          )}

          {step === quizStepCount && (
            <div>
              <h3 className="text-lg font-semibold text-stone-950">Pick favorite themes</h3>
              <p className="mt-1 text-sm text-stone-600">Choose at least two. These steer the emotional tone of your crate.</p>
              <div className="mt-4 flex flex-wrap gap-3">
                {allThemes.map((theme) => {
                  const active = themes.includes(theme);
                  return (
                    <button
                      key={theme}
                      type="button"
                      onClick={() => toggleChoice(theme, themes, setThemes)}
                      className={`rounded-full border px-4 py-2 text-sm font-medium capitalize transition ${active ? "border-orange-500 bg-orange-500 text-white" : "border-orange-200 bg-white text-stone-700 hover:border-orange-400"}`}
                    >
                      {theme}
                    </button>
                  );
                })}
              </div>
            </div>
          )}

          {step === quizStepCount + 1 && (
            <div>
              <h3 className="text-lg font-semibold text-stone-950">Pick favorite mechanisms</h3>
              <p className="mt-1 text-sm text-stone-600">Choose what you want to feel at the table each month.</p>
              <div className="mt-4 flex flex-wrap gap-3">
                {allMechanics.map((mechanic) => {
                  const active = mechanics.includes(mechanic);
                  return (
                    <button
                      key={mechanic}
                      type="button"
                      onClick={() => toggleChoice(mechanic, mechanics, setMechanics)}
                      className={`rounded-full border px-4 py-2 text-sm font-medium transition ${active ? "border-orange-500 bg-orange-500 text-white" : "border-orange-200 bg-white text-stone-700 hover:border-orange-400"}`}
                    >
                      {mechanic.replace(/-/g, " ")}
                    </button>
                  );
                })}
              </div>
            </div>
          )}

          {step === quizStepCount + 2 && (
            <div className="grid gap-6 lg:grid-cols-2">
              <label className="space-y-2 text-sm font-medium text-stone-700">
                <span>Name</span>
                <input
                  value={name}
                  onChange={(event) => setName(event.target.value)}
                  className="w-full rounded-2xl border border-orange-200 bg-white px-4 py-3 outline-none ring-0 transition focus:border-orange-400"
                  placeholder="Your first name"
                />
              </label>

              <label className="space-y-2 text-sm font-medium text-stone-700">
                <span>Plan</span>
                <select
                  value={planId}
                  onChange={(event) => setPlanId(event.target.value as PlanId)}
                  className="w-full rounded-2xl border border-orange-200 bg-white px-4 py-3 outline-none transition focus:border-orange-400"
                >
                  <option value="discovery">Discovery</option>
                  <option value="explorer">Explorer</option>
                  <option value="collector">Collector</option>
                </select>
              </label>

              <label className="space-y-2 text-sm font-medium text-stone-700">
                <span>Ideal player count: {idealPlayerCount}</span>
                <input
                  type="range"
                  min={1}
                  max={6}
                  value={idealPlayerCount}
                  onChange={(event) => setIdealPlayerCount(Number(event.target.value))}
                  className="w-full accent-orange-500"
                />
              </label>

              <label className="space-y-2 text-sm font-medium text-stone-700">
                <span>Ideal play time: {idealPlayTime} min</span>
                <input
                  type="range"
                  min={20}
                  max={180}
                  step={5}
                  value={idealPlayTime}
                  onChange={(event) => setIdealPlayTime(Number(event.target.value))}
                  className="w-full accent-orange-500"
                />
              </label>

              <label className="space-y-2 text-sm font-medium text-stone-700 lg:col-span-2">
                <span>Complexity target: {complexityTarget.toFixed(1)} / 5</span>
                <input
                  type="range"
                  min={1}
                  max={5}
                  step={0.1}
                  value={complexityTarget}
                  onChange={(event) => setComplexityTarget(Number(event.target.value))}
                  className="w-full accent-orange-500"
                />
              </label>
            </div>
          )}

          {step === quizStepCount + 3 && (
            <div className="grid gap-6 lg:grid-cols-[1.1fr_0.9fr]">
              <div className="space-y-4 rounded-[1.75rem] border border-orange-100 bg-gradient-to-br from-orange-50 to-amber-50 p-5">
                <p className="text-sm font-semibold uppercase tracking-[0.25em] text-orange-500">Profile summary</p>
                <h3 className="text-2xl font-semibold text-stone-950">{name || "Your"} taste profile is ready for curation</h3>
                <p className="text-sm text-stone-600">
                  Built from {answeredCount} anchor ratings, {themes.length} theme picks, {mechanics.length} mechanic picks, and a target table of {idealPlayerCount} players around {idealPlayTime} minutes.
                </p>
                <div className="grid gap-3 sm:grid-cols-2">
                  <div className="rounded-2xl bg-white px-4 py-4 ring-1 ring-orange-100">
                    <div className="text-xs uppercase tracking-[0.2em] text-stone-500">Favorite themes</div>
                    <div className="mt-2 text-sm font-medium text-stone-900 capitalize">{themes.slice(0, 4).join(", ")}</div>
                  </div>
                  <div className="rounded-2xl bg-white px-4 py-4 ring-1 ring-orange-100">
                    <div className="text-xs uppercase tracking-[0.2em] text-stone-500">Favorite mechanics</div>
                    <div className="mt-2 text-sm font-medium text-stone-900">{mechanics.slice(0, 4).map((item) => item.replace(/-/g, " ")).join(", ")}</div>
                  </div>
                </div>
                {!canSubmit && (
                  <div className="rounded-2xl border border-amber-300 bg-amber-50 px-4 py-3 text-sm text-amber-900">
                    Rate at least 12 games and pick two themes/mechanics to unlock monthly curation.
                  </div>
                )}
              </div>
              <div className="rounded-[1.75rem] border border-orange-100 bg-white p-4">
                <TasteRadarChart data={radarData.length ? radarData : initialRadarData} />
              </div>
            </div>
          )}

          {(message || error) && (
            <div className={`rounded-2xl px-4 py-3 text-sm ${message ? "border border-emerald-200 bg-emerald-50 text-emerald-900" : "border border-rose-200 bg-rose-50 text-rose-900"}`}>
              {message ?? error}
            </div>
          )}
        </div>

        <div className="flex flex-col gap-3 border-t border-orange-100 bg-stone-50 px-6 py-5 sm:flex-row sm:items-center sm:justify-between">
          <div className="flex gap-3">
            <button
              type="button"
              onClick={() => setStep((current) => Math.max(0, current - 1))}
              disabled={step === 0 || pending}
              className="rounded-full border border-orange-200 bg-white px-5 py-2 text-sm font-medium text-stone-700 disabled:cursor-not-allowed disabled:opacity-50"
            >
              Back
            </button>
            <button
              type="button"
              onClick={handleSaveProgress}
              disabled={pending}
              className="rounded-full border border-orange-200 bg-white px-5 py-2 text-sm font-medium text-orange-700 disabled:cursor-not-allowed disabled:opacity-50"
            >
              {pending ? "Saving..." : "Save progress"}
            </button>
          </div>
          <div className="flex gap-3">
            {step < steps.length - 1 ? (
              <button
                type="button"
                onClick={() => {
                  setError(null);
                  setMessage(null);
                  setStep((current) => Math.min(steps.length - 1, current + 1));
                }}
                disabled={pending}
                className="rounded-full bg-stone-950 px-5 py-2 text-sm font-medium text-white shadow-lg shadow-stone-950/10 disabled:cursor-not-allowed disabled:opacity-50"
              >
                Continue
              </button>
            ) : (
              <button
                type="button"
                onClick={handleSubmit}
                disabled={pending}
                className="rounded-full bg-orange-500 px-5 py-2 text-sm font-medium text-white shadow-lg shadow-orange-300 disabled:cursor-not-allowed disabled:opacity-50"
              >
                {pending ? "Finishing..." : "Finish onboarding"}
              </button>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
