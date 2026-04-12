"use client";

import { useState, useTransition } from "react";
import { useRouter } from "next/navigation";

import type { PlanId } from "@/lib/types";

type Plan = {
  id: PlanId;
  name: string;
  price: string;
  description: string;
  features: string[];
  accent: string;
};

export function PlanSelector({ plans, currentPlan, cutoff }: { plans: Plan[]; currentPlan: PlanId; cutoff: string }) {
  const router = useRouter();
  const [selectedPlan, setSelectedPlan] = useState<PlanId>(currentPlan);
  const [status, setStatus] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [pending, startTransition] = useTransition();

  function handleCheckout() {
    setStatus(null);
    setError(null);

    startTransition(async () => {
      try {
        const response = await fetch("/api/checkout", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ planId: selectedPlan }),
        });

        if (!response.ok) {
          const body = (await response.json().catch(() => null)) as { error?: string } | null;
          throw new Error(body?.error ?? "Checkout is temporarily unavailable.");
        }

        setStatus(`Mock checkout complete. ${plans.find((plan) => plan.id === selectedPlan)?.name} is now active for the demo profile.`);
        router.refresh();
      } catch (checkoutError) {
        setError(checkoutError instanceof Error ? checkoutError.message : "Checkout is temporarily unavailable.");
      }
    });
  }

  return (
    <div className="space-y-6">
      <div className="grid gap-4 lg:grid-cols-3">
        {plans.map((plan) => {
          const active = selectedPlan === plan.id;
          return (
            <button
              key={plan.id}
              type="button"
              onClick={() => setSelectedPlan(plan.id)}
              className={`rounded-[1.75rem] border p-6 text-left transition ${active ? "border-orange-400 bg-white shadow-[0_24px_60px_-38px_rgba(194,65,12,0.55)]" : "border-orange-100 bg-white/80 hover:border-orange-300"}`}
            >
              <div className={`inline-flex rounded-full bg-gradient-to-r px-3 py-1 text-xs font-semibold uppercase tracking-[0.24em] text-white ${plan.accent}`}>
                {plan.name}
              </div>
              <div className="mt-4 text-3xl font-semibold text-stone-950">{plan.price}<span className="text-sm font-medium text-stone-500"> / month</span></div>
              <p className="mt-3 text-sm text-stone-600">{plan.description}</p>
              <ul className="mt-5 space-y-2 text-sm text-stone-700">
                {plan.features.map((feature) => (
                  <li key={feature} className="flex gap-2">
                    <span className="mt-0.5 text-orange-500">✦</span>
                    <span>{feature}</span>
                  </li>
                ))}
              </ul>
            </button>
          );
        })}
      </div>

      <div className="grid gap-6 rounded-[2rem] border border-orange-100 bg-white p-6 shadow-[0_28px_70px_-44px_rgba(154,52,18,0.4)] lg:grid-cols-[1.1fr_0.9fr]">
        <div>
          <p className="text-sm font-semibold uppercase tracking-[0.24em] text-orange-500">Mock checkout</p>
          <h3 className="mt-2 text-2xl font-semibold text-stone-950">Plan confirmation & billing preview</h3>
          <div className="mt-5 grid gap-4 sm:grid-cols-2">
            <div className="rounded-2xl border border-orange-100 bg-orange-50/60 p-4">
              <div className="text-xs uppercase tracking-[0.2em] text-stone-500">Selected plan</div>
              <div className="mt-2 text-lg font-semibold text-stone-950">{plans.find((plan) => plan.id === selectedPlan)?.name}</div>
            </div>
            <div className="rounded-2xl border border-orange-100 bg-orange-50/60 p-4">
              <div className="text-xs uppercase tracking-[0.2em] text-stone-500">Billing cadence</div>
              <div className="mt-2 text-lg font-semibold text-stone-950">Monthly, auto-renewing</div>
            </div>
            <div className="rounded-2xl border border-orange-100 bg-orange-50/60 p-4">
              <div className="text-xs uppercase tracking-[0.2em] text-stone-500">Shipping scope</div>
              <div className="mt-2 text-lg font-semibold text-stone-950">US launch demo</div>
            </div>
            <div className="rounded-2xl border border-orange-100 bg-orange-50/60 p-4">
              <div className="text-xs uppercase tracking-[0.2em] text-stone-500">Cutoff policy</div>
              <div className="mt-2 text-lg font-semibold text-stone-950">{cutoff}</div>
            </div>
          </div>
        </div>
        <div className="rounded-[1.75rem] border border-orange-100 bg-gradient-to-br from-amber-50 via-orange-50 to-rose-50 p-5">
          <div className="space-y-3 text-sm text-stone-600">
            <p>This MVP uses a mock payment action rather than live billing. It still persists plan selection locally with SQLite.</p>
            <p>You’ll immediately see the selected tier reflected across the monthly match and subscription views.</p>
          </div>
          {(status || error) && (
            <div className={`mt-4 rounded-2xl px-4 py-3 text-sm ${status ? "border border-emerald-200 bg-emerald-50 text-emerald-900" : "border border-rose-200 bg-rose-50 text-rose-900"}`}>
              {status ?? error}
            </div>
          )}
          <button
            type="button"
            onClick={handleCheckout}
            disabled={pending}
            className="mt-6 w-full rounded-full bg-stone-950 px-5 py-3 text-sm font-medium text-white shadow-lg shadow-stone-950/10 disabled:cursor-not-allowed disabled:opacity-50"
          >
            {pending ? "Processing payment..." : "Complete mock checkout"}
          </button>
        </div>
      </div>
    </div>
  );
}
