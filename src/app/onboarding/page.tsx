import type { Metadata } from "next";

import { ComponentErrorBoundary } from "@/components/component-error-boundary";
import { OnboardingWizard } from "@/components/onboarding-wizard";
import { getOnboardingSnapshot, getProfileSummaryLine } from "@/lib/server-data";

export const metadata: Metadata = {
  title: "Taste Quiz",
  description: "Rate 15 board games, choose themes and mechanics, and build your personalized taste profile for monthly curation.",
};

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

export default function OnboardingPage() {
  const snapshot = getOnboardingSnapshot();

  return (
    <div className="mx-auto flex max-w-7xl flex-col gap-10 px-4 py-12 sm:px-6 lg:px-8">
      <section className="grid gap-6 lg:grid-cols-[0.9fr_1.1fr] lg:items-start">
        <div className="space-y-5 rounded-[2rem] border border-orange-100 bg-gradient-to-br from-amber-50 via-orange-50 to-rose-50 p-6 shadow-[0_28px_70px_-44px_rgba(154,52,18,0.4)]">
          <div>
            <p className="text-sm font-semibold uppercase tracking-[0.24em] text-orange-500">Taste profile onboarding</p>
            <h1 className="mt-2 text-4xl font-semibold tracking-tight text-stone-950">Teach CrateMatch what belongs in your box</h1>
            <p className="mt-4 text-base leading-8 text-stone-600">
              Rate 15 familiar games, choose the themes and mechanisms that click, and dial in the cadence of your ideal game night.
            </p>
          </div>
          <div className="rounded-[1.75rem] border border-white/80 bg-white/90 p-5">
            <div className="text-sm font-semibold text-stone-950">Current demo profile snapshot</div>
            <p className="mt-3 text-sm leading-7 text-stone-600">
              {getProfileSummaryLine(snapshot.profile, snapshot.themes, snapshot.mechanics)}
            </p>
          </div>
          <div className="rounded-[1.75rem] border border-white/80 bg-white/90 p-5 text-sm text-stone-600">
            <div className="font-semibold text-stone-950">Required for curation</div>
            <ul className="mt-3 space-y-2">
              <li>• At least 12 anchor ratings</li>
              <li>• Two or more themes and mechanics</li>
              <li>• Target player count, play time, and weight</li>
            </ul>
          </div>
        </div>

        <ComponentErrorBoundary sectionName="Onboarding wizard">
        <OnboardingWizard
          quizGames={snapshot.quizGames}
          allThemes={snapshot.allThemes}
          allMechanics={snapshot.allMechanics}
          initialProfile={snapshot.profile}
          initialAnswers={snapshot.answers}
          initialThemes={snapshot.themes}
          initialMechanics={snapshot.mechanics}
          initialRadarData={snapshot.radarData}
        />
        </ComponentErrorBoundary>
      </section>
    </div>
  );
}
