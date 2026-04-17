import { ComponentErrorBoundary } from "@/components/component-error-boundary";
import { FeedbackForm } from "@/components/feedback-form";
import { getFeedbackSnapshot } from "@/lib/server-data";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

export default function FeedbackPage() {
  const { pastBoxes } = getFeedbackSnapshot();

  return (
    <div className="mx-auto flex max-w-4xl flex-col gap-10 px-4 py-12 sm:px-6 lg:px-8">
      <section className="max-w-3xl">
        <p className="text-sm font-semibold uppercase tracking-[0.24em] text-orange-500">Post-delivery feedback</p>
        <h1 className="mt-2 text-4xl font-semibold tracking-tight text-stone-950">Rate your past crates</h1>
        <p className="mt-4 text-lg leading-8 text-stone-600">
          Help CrateMatch learn your preferences. Rate each delivery 1&ndash;5 stars, tag what worked (or didn&apos;t), and leave optional notes.
          Your feedback directly improves future recommendations.
        </p>
      </section>

      <ComponentErrorBoundary sectionName="Feedback form">
        <FeedbackForm pastBoxes={pastBoxes} />
      </ComponentErrorBoundary>
    </div>
  );
}
