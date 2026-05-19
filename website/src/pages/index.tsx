import type { ReactNode } from 'react';
import Link from '@docusaurus/Link';
import Layout from '@theme/Layout';
import CodeBlock from '@theme/CodeBlock';

const features = [
  {
    icon: '🎯',
    title: 'Taste-aware curation',
    body: 'A 15-game quiz, theme/mechanic preferences, and complexity sliders feed a content-based scoring engine — not random picks.',
  },
  {
    icon: '🧠',
    title: 'Explainable matches',
    body: 'Every monthly box ships with a confidence score and human-readable reasons: which themes match, which mechanics fit, which loved games it resembles.',
  },
  {
    icon: '📚',
    title: 'Collection intelligence',
    body: 'Owned games guard against duplicates, surface complementary suggestions, and inform gap analysis across themes and mechanics.',
  },
  {
    icon: '🪶',
    title: 'Zero-config local dev',
    body: 'SQLite via better-sqlite3 auto-creates and seeds 65 real games, a demo subscriber, and 8 months of crate history on first run.',
  },
  {
    icon: '🧩',
    title: 'Three transparent tiers',
    body: 'Discovery, Explorer, and Collector plans set a budget that scores candidates — no opaque pricing, no warehouse roulette.',
  },
];

function HeroSection(): ReactNode {
  return (
    <header className="hero-cm">
      <h1>One box. The right game. Every month.</h1>
      <p className="lead">
        CrateMatch is a personalized board game subscription MVP. It learns your taste, respects what you already own,
        and explains every pick — so the crate on your doorstep actually fits your table.
      </p>
      <div className="hero-cta">
        <Link className="button button--primary button--lg" to="/getting-started/quick-start">
          Get Started →
        </Link>
        <Link className="button button--secondary button--lg" to="https://github.com/TabletopFoundry/cratematch">
          View on GitHub
        </Link>
        <Link className="button button--outline button--secondary button--lg" to="/why">
          Why CrateMatch?
        </Link>
      </div>
      <div className="install-pill">
        <span>$</span>
        <code>git clone https://github.com/TabletopFoundry/cratematch && cd cratematch && npm install && npm run dev</code>
      </div>
    </header>
  );
}

function FeatureGrid(): ReactNode {
  return (
    <section className="feature-grid">
      {features.map((f) => (
        <div key={f.title} className="feature-card">
          <div className="icon" aria-hidden>{f.icon}</div>
          <h3>{f.title}</h3>
          <p>{f.body}</p>
        </div>
      ))}
    </section>
  );
}

function CodeShowcase(): ReactNode {
  const sample = `import { recommendBox } from "@/lib/recommendations";

const pick = recommendBox({
  profile,           // taste sliders + preferred themes/mechanics
  quizAnswers,       // 15 rated games
  collectionSlugs,   // games the subscriber already owns
  planBudget: 55,    // Explorer tier
});

console.log(pick.game.title);        // → "Wingspan"
console.log(pick.confidence);        // → 0.82
console.log(pick.reasons);
// [
//   "Strong overlap with themes you loved: nature, engine-building",
//   "Plays well at your ideal 3-player count",
//   "Similar in feel to Terraforming Mars, which you loved",
// ]`;
  return (
    <section className="section-narrow">
      <h2>Recommendations you can read</h2>
      <p>
        CrateMatch's engine returns a score, a confidence value, and an array of plain-English reasons.
        No black box — every monthly crate explains itself.
      </p>
      <CodeBlock language="ts">{sample}</CodeBlock>
      <div className="cta-row">
        <Link className="button button--primary" to="/concepts/recommendation-engine">How scoring works</Link>
        <Link className="button button--secondary" to="/reference/api">API reference</Link>
      </div>
    </section>
  );
}

export default function Home(): ReactNode {
  return (
    <Layout
      title="CrateMatch — Personalized board game subscriptions"
      description="A personalized board game subscription MVP with content-based curation, collection intelligence, and transparent recommendation explanations."
    >
      <HeroSection />
      <FeatureGrid />
      <CodeShowcase />
    </Layout>
  );
}
