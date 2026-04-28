import type { Metadata } from "next";

import { ComponentErrorBoundary } from "@/components/component-error-boundary";
import { PlanSelector } from "@/components/plan-selector";
import { getPlansSnapshot } from "@/lib/server-data";

export const metadata: Metadata = {
  title: "Subscription Plans",
  description: "Compare Discovery, Explorer, and Collector subscription tiers. Choose the board game crate that matches your shelf ambition.",
};

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

export default function PlansPage() {
  const { profile, plans, cutoff } = getPlansSnapshot();

  return (
    <div className="mx-auto flex max-w-7xl flex-col gap-10 px-4 py-12 sm:px-6 lg:px-8">
      <section className="max-w-3xl">
        <p className="text-sm font-semibold uppercase tracking-[0.24em] text-orange-500">Subscription plans</p>
        <h1 className="mt-2 text-4xl font-semibold tracking-tight text-stone-950">Pick the crate tier that matches your shelf ambition</h1>
        <p className="mt-4 text-lg leading-8 text-stone-600">
          Discovery, Explorer, and Collector are all available in this MVP. Mock checkout persists the selected tier and refreshes downstream recommendations.
        </p>
        <div className="mt-6 inline-flex rounded-full border border-orange-200 bg-white px-4 py-2 text-sm text-stone-700">
          Active demo tier: <span className="ml-2 font-semibold capitalize text-orange-600">{profile.planId}</span>
        </div>
      </section>

      <ComponentErrorBoundary sectionName="Plan selector">
        <PlanSelector plans={plans} currentPlan={profile.planId} cutoff={cutoff} />
      </ComponentErrorBoundary>
    </div>
  );
}
