"use client";

import { useState, useTransition, type KeyboardEvent } from "react";
import { useRouter } from "next/navigation";

import type { BoxDecision } from "@/lib/types";

export function BoxDecisionPanel({
  gameSlug,
  monthLabel,
  initialDecision,
}: {
  gameSlug: string;
  monthLabel: string;
  initialDecision: BoxDecision;
}) {
  const router = useRouter();
  const [decision, setDecision] = useState<BoxDecision>(initialDecision);
  const [message, setMessage] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [pending, startTransition] = useTransition();
  const decisionOptions: Array<{ value: BoxDecision; title: string; body: string }> = [
    { value: "keep", title: "Keep it", body: "Lock this pick into your collection preview." },
    { value: "return", title: "Return / swap preview", body: "Signal that you’d rather rotate into a backup option." },
  ];

  function handleDecisionKeyDown(event: KeyboardEvent<HTMLButtonElement>, optionIndex: number) {
    let nextIndex = optionIndex;

    if (event.key === "ArrowRight" || event.key === "ArrowDown") {
      event.preventDefault();
      nextIndex = (optionIndex + 1) % decisionOptions.length;
    } else if (event.key === "ArrowLeft" || event.key === "ArrowUp") {
      event.preventDefault();
      nextIndex = (optionIndex - 1 + decisionOptions.length) % decisionOptions.length;
    } else {
      return;
    }

    const nextDecision = decisionOptions[nextIndex];
    if (!nextDecision) {
      return;
    }

    updateDecision(nextDecision.value);
    const container = event.currentTarget.parentElement;
    const nextButton = container?.children[nextIndex] as HTMLElement | undefined;
    nextButton?.focus();
  }

  function updateDecision(nextDecision: BoxDecision) {
    setError(null);
    setMessage(null);

    startTransition(async () => {
      try {
        const response = await fetch("/api/box-decision", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ gameSlug, decision: nextDecision, monthLabel }),
        });

        if (!response.ok) {
          const body = (await response.json().catch(() => null)) as { error?: string } | null;
          throw new Error(body?.error ?? "Unable to update your decision.");
        }

        setDecision(nextDecision);
        setMessage(nextDecision === "keep" ? "Marked to keep in your crate history." : "Marked as a return-for-swap preview decision.");
        router.refresh();
      } catch (decisionError) {
        setError(decisionError instanceof Error ? decisionError.message : "Unable to update your decision.");
      }
    });
  }

  return (
    <div className="rounded-[1.75rem] border border-orange-100 bg-white p-5 shadow-[0_20px_60px_-36px_rgba(154,52,18,0.35)]">
      <p className="text-sm font-semibold uppercase tracking-[0.24em] text-orange-500">Keep / return preview</p>
      <h3 className="mt-2 text-xl font-semibold text-stone-950">Decide how this month’s reveal lands on your shelf</h3>
      <p className="mt-2 text-sm text-stone-600">This is a mock workflow for the MVP, designed to demonstrate how subscribers could react before the next recommendation cycle.</p>
      <div className="mt-5 grid gap-3 sm:grid-cols-2" role="radiogroup" aria-label="Keep or return this month’s box">
        {decisionOptions.map((option, optionIndex) => {
          const active = decision === option.value;
          return (
            <button
              key={option.value}
              type="button"
              role="radio"
              aria-checked={active}
              tabIndex={active ? 0 : -1}
              onClick={() => updateDecision(option.value)}
              onKeyDown={(event) => handleDecisionKeyDown(event, optionIndex)}
              disabled={pending}
              className={`rounded-2xl border px-4 py-4 text-left transition focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-orange-400 ${
                option.value === "keep"
                  ? active
                    ? "border-emerald-300 bg-emerald-50 text-emerald-900"
                    : "border-orange-200 bg-orange-50/60 text-stone-700"
                  : active
                    ? "border-rose-300 bg-rose-50 text-rose-900"
                    : "border-orange-200 bg-orange-50/60 text-stone-700"
              }`}
            >
              <div className="font-semibold">{option.title}</div>
              <div className="mt-1 text-sm">{option.body}</div>
            </button>
          );
        })}
      </div>
      <div className="mt-4 text-xs uppercase tracking-[0.2em] text-stone-500">Current status: {pending ? "saving" : decision}</div>
      <div role="status" aria-live="polite">
        {(message || error) && (
          <div className={`mt-4 rounded-2xl px-4 py-3 text-sm ${message ? "border border-emerald-200 bg-emerald-50 text-emerald-900" : "border border-rose-200 bg-rose-50 text-rose-900"}`}>
            {message ?? error}
          </div>
        )}
      </div>
    </div>
  );
}
