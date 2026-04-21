import type { Metadata } from "next";

import { CollectionManager } from "@/components/collection-manager";
import { ComponentErrorBoundary } from "@/components/component-error-boundary";
import { getCollectionSnapshot } from "@/lib/server-data";

export const metadata: Metadata = {
  title: "Collection Intelligence",
  description: "Manage your board game collection, discover gaps, and get complementary recommendations that expand your shelf.",
};

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

export default function CollectionPage() {
  const snapshot = getCollectionSnapshot();

  return (
    <div className="mx-auto flex max-w-7xl flex-col gap-10 px-4 py-12 sm:px-6 lg:px-8">
      <section className="max-w-3xl">
        <p className="text-sm font-semibold uppercase tracking-[0.24em] text-orange-500">Collection intelligence</p>
        <h1 className="mt-2 text-4xl font-semibold tracking-tight text-stone-950">Own your shelf, sharpen your recommendations</h1>
        <p className="mt-4 text-lg leading-8 text-stone-600">
          Add owned games, reveal underrepresented mechanics, and surface complementary titles that expand rather than repeat your shelf.
        </p>
      </section>

      <ComponentErrorBoundary sectionName="Collection manager">
      <CollectionManager
        availableGames={snapshot.availableGames}
        initialOwnedGames={snapshot.ownedGames}
        insights={snapshot.insights}
        recommendations={snapshot.recommendations}
        duplicateCount={snapshot.duplicateCount}
      />
      </ComponentErrorBoundary>
    </div>
  );
}
