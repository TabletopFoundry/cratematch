import type { Metadata } from "next";

import { getCommunitySnapshot } from "@/lib/server-data";

export const metadata: Metadata = {
  title: "Community",
  description: "Browse unboxings, subscriber reactions, and featured reviews from the CrateMatch community.",
};

export const runtime = "nodejs";

export default function CommunityPage() {
  const { posts, reviews, stats } = getCommunitySnapshot();

  return (
    <div className="mx-auto flex max-w-7xl flex-col gap-10 px-4 py-12 sm:px-6 lg:px-8">
      <section className="max-w-3xl">
        <p className="text-sm font-semibold uppercase tracking-[0.24em] text-orange-500">Community</p>
        <h1 className="mt-2 text-4xl font-semibold tracking-tight text-stone-950">A warm feed of unboxings, reactions, and subscriber proof points</h1>
        <p className="mt-4 text-lg leading-8 text-stone-600">
          This mock community experience showcases how CrateMatch can turn unboxings into retention-driving social proof.
        </p>
      </section>

      <section className="grid gap-4 md:grid-cols-3">
        {stats.map((stat) => (
          <div key={stat.label} className="rounded-[1.75rem] border border-orange-100 bg-white p-6 shadow-sm">
            <div className="text-3xl font-semibold text-stone-950">{stat.value}</div>
            <div className="mt-2 text-sm text-stone-600 capitalize">{stat.label}</div>
          </div>
        ))}
      </section>

      <section className="grid gap-6 lg:grid-cols-[1.05fr_0.95fr]">
        <div>
          <p className="text-sm font-semibold uppercase tracking-[0.24em] text-orange-500">Recent unboxings</p>
          <div className="mt-5 space-y-4">
            {posts.map((post) => (
              <article key={post.id} className="rounded-[2rem] border border-orange-100 bg-white p-6 shadow-[0_24px_60px_-42px_rgba(154,52,18,0.4)]">
                <div className="flex items-center gap-4">
                  <div className={`flex h-14 w-14 items-center justify-center rounded-2xl bg-gradient-to-br ${post.accent} text-xl shadow-sm`}>
                    📦
                  </div>
                  <div>
                    <div className="font-semibold text-stone-950">{post.name}</div>
                    <div className="text-sm text-stone-500">{post.handle} · {post.location}</div>
                  </div>
                </div>
                <p className="mt-4 text-sm leading-7 text-stone-600">{post.caption}</p>
                <div className="mt-4 flex items-center justify-between text-sm text-stone-500">
                  <span className="rounded-full bg-orange-50 px-3 py-1 font-medium text-orange-700">{post.mood}</span>
                  <span>❤ {post.likes}</span>
                </div>
              </article>
            ))}
          </div>
        </div>

        <div>
          <p className="text-sm font-semibold uppercase tracking-[0.24em] text-orange-500">Featured reviews</p>
          <div className="mt-5 space-y-4">
            {reviews.map((review) => (
              <div key={review.id} className="rounded-[2rem] border border-orange-100 bg-white p-6 shadow-sm">
                <div className="flex items-center justify-between gap-4">
                  <h2 className="text-xl font-semibold text-stone-950">{review.title}</h2>
                  <div className="rounded-full bg-orange-50 px-3 py-1 text-sm font-semibold text-orange-700">{review.rating.toFixed(1)} ★</div>
                </div>
                <p className="mt-3 text-sm leading-7 text-stone-600">“{review.quote}”</p>
                <div className="mt-4 text-sm font-medium text-stone-800">{review.author}</div>
              </div>
            ))}
          </div>
        </div>
      </section>
    </div>
  );
}
