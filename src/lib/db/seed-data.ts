import type { BoxDecision, QuizAnswer, UserProfile } from "@/lib/types";
import { GAME_CATALOG } from "@/lib/catalog";
import { getRecommendations } from "@/lib/recommendations";

export const DEMO_SEED_VERSION = "2026-05-rich-demo-v1";
export const DEMO_RECOMMENDATION_LIMIT = 5;

const DAY_IN_MONTH = 1;

const DEMO_BASE_PROFILE: UserProfile = {
  userId: "demo-user",
  name: "Demo subscriber",
  planId: "explorer",
  idealPlayerCount: 4,
  idealPlayTime: 90,
  complexityTarget: 3,
  onboardingComplete: false,
  billingStatus: "trial",
};

export const DEMO_PROFILE: UserProfile = {
  userId: DEMO_BASE_PROFILE.userId,
  name: "Avery",
  planId: "collector",
  idealPlayerCount: 4,
  idealPlayTime: 95,
  complexityTarget: 3.3,
  onboardingComplete: true,
  billingStatus: "active",
};

export const DEMO_QUIZ_ANSWERS: QuizAnswer[] = [
  { gameSlug: "wingspan", rating: "loved" },
  { gameSlug: "azul", rating: "liked" },
  { gameSlug: "spirit-island", rating: "liked" },
  { gameSlug: "terraforming-mars", rating: "loved" },
  { gameSlug: "codenames", rating: "neutral" },
  { gameSlug: "catan", rating: "disliked" },
  { gameSlug: "scythe", rating: "liked" },
  { gameSlug: "ticket-to-ride", rating: "neutral" },
  { gameSlug: "dominion", rating: "loved" },
  { gameSlug: "pandemic", rating: "liked" },
  { gameSlug: "carcassonne", rating: "liked" },
  { gameSlug: "splendor", rating: "liked" },
  { gameSlug: "root", rating: "neutral" },
  { gameSlug: "everdell", rating: "loved" },
  { gameSlug: "seven-wonders", rating: "unplayed" },
];

export const DEMO_THEMES = ["nature", "fantasy", "cozy", "space", "historical", "adventure", "mythology", "mystery"] as const;
export const DEMO_MECHANICS = ["engine-building", "worker-placement", "cooperative", "deck-building", "tableau-building", "resource-management", "hand-management", "route-building"] as const;
export const DEMO_STARTING_COLLECTION = [
  "wingspan",
  "azul",
  "ticket-to-ride",
  "pandemic",
  "splendor",
  "cascadia",
  "everdell",
  "root",
  "dominion",
  "scythe",
  "spirit-island",
  "terraforming-mars",
  "carcassonne",
  "brass-birmingham",
  "concordia",
  "calico",
  "flamecraft",
  "meadow",
  "res-arcana",
  "puerto-rico",
] as const;

const DEMO_PAST_BOX_TEMPLATES = [
  {
    gameSlug: "parks",
    note: "A scenic reset crate after a run of heavier euros, tuned for cozy weeknight table time.",
    decision: "keep" as BoxDecision,
    feedback: {
      rating: 5,
      tags: ["Perfect fit", "Great theme", "Good solo option"],
      comment: "The table presence landed immediately and it became our go-to calm weeknight pick.",
    },
  },
  {
    gameSlug: "heat-pedal-to-the-metal",
    note: "A deliberate speed-focused edge case to test whether your group wanted a more adrenaline-heavy crate.",
    decision: "return" as BoxDecision,
    feedback: {
      rating: 2,
      tags: ["Fun mechanics", "Great for groups", "Not my style"],
      comment: "Clever system, but the racing tension missed the exploratory vibe we usually want from CrateMatch.",
    },
  },
  {
    gameSlug: "lost-ruins-of-arnak",
    note: "Adventure-first worker placement matched to your love of engine turns and discovery arcs.",
    decision: "keep" as BoxDecision,
    feedback: {
      rating: 5,
      tags: ["Perfect fit", "Fun mechanics", "Great theme"],
      comment: "This felt laser-targeted: deck-building, exploration, and just enough crunch for our main group.",
    },
  },
  {
    gameSlug: "sleeping-gods",
    note: "A narrative campaign experiment from the curator bench to probe your appetite for long-form adventure boxes.",
    decision: "return" as BoxDecision,
    feedback: {
      rating: 3,
      tags: ["Great theme", "Too complex", "Not my style"],
      comment: "Beautiful worldbuilding, but the campaign commitment was bigger than the amount of repeat time we have.",
    },
  },
  {
    gameSlug: "viticulture",
    note: "A comfort-food euro leaning into shared planning, smooth worker placement, and relaxed table talk.",
    decision: "keep" as BoxDecision,
    feedback: {
      rating: 5,
      tags: ["Perfect fit", "Fun mechanics", "Great theme"],
      comment: "Exactly the kind of medium-weight engine builder we hoped the service would find for us.",
    },
  },
  {
    gameSlug: "the-crew",
    note: "A compact travel-friendly cooperative crate picked for mixed-experience nights and shorter sessions.",
    decision: "keep" as BoxDecision,
    feedback: {
      rating: 4,
      tags: ["Fun mechanics", "Great for groups"],
      comment: "The mission structure made it easy to teach and surprisingly sticky for our regular crew.",
    },
  },
  {
    gameSlug: "mystic-vale",
    note: "A card-crafting curveball to test your tolerance for push-your-luck engines with a lighter rules load.",
    decision: "keep" as BoxDecision,
    feedback: {
      rating: 4,
      tags: ["Fun mechanics", "Great theme"],
      comment: "Not our usual lane, but the transparent-card system felt fresh without fighting our preferences.",
    },
  },
  {
    gameSlug: "obsession",
    note: "A collector-tier curation pick with strong thematic immersion and plenty of planning depth.",
    decision: "keep" as BoxDecision,
    feedback: {
      rating: 5,
      tags: ["Perfect fit", "Great theme", "Fun mechanics"],
      comment: "The recommendation explanation was dead on — this is now one of the most requested games on our shelf.",
    },
  },
] as const;

type DemoPastBox = {
  boxMonth: string;
  gameSlug: string;
  note: string;
  decision: BoxDecision;
  feedback: {
    rating: number;
    tags: string[];
    comment: string;
  };
};

type RecommendationSnapshotSeed = {
  snapshotMonth: string;
  gameSlug: string;
  rank: number;
  score: number;
  confidence: number;
  reasons: string[];
  overlapThemes: string[];
  overlapMechanics: string[];
  likedTitles: string[];
  selectionStatus: "past-keep" | "past-return" | "alternate" | "current-match" | "current-alternate";
};

export type DemoSeedDataset = {
  baseProfile: UserProfile;
  profile: UserProfile;
  answers: QuizAnswer[];
  themes: string[];
  mechanics: string[];
  pastBoxes: DemoPastBox[];
  currentCollection: string[];
  recommendationSnapshots: RecommendationSnapshotSeed[];
  currentMonth: string;
};

function startOfMonth(date: Date) {
  return new Date(date.getFullYear(), date.getMonth(), DAY_IN_MONTH);
}

function addMonths(date: Date, delta: number) {
  return new Date(date.getFullYear(), date.getMonth() + delta, DAY_IN_MONTH);
}

function formatMonth(date: Date) {
  return `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, "0")}`;
}

function buildMonthlySnapshots({
  boxMonth,
  gameSlug,
  selectionStatus,
  ownedSlugs,
  shippedSlugs,
}: {
  boxMonth: string;
  gameSlug?: string;
  selectionStatus: RecommendationSnapshotSeed["selectionStatus"];
  ownedSlugs: string[];
  shippedSlugs: string[];
}) {
  const recommendations = getRecommendations({
    catalog: GAME_CATALOG,
    profile: DEMO_PROFILE,
    answers: DEMO_QUIZ_ANSWERS,
    preferredThemes: [...DEMO_THEMES],
    preferredMechanics: [...DEMO_MECHANICS],
    ownedSlugs,
    shippedSlugs,
  });

  const ranked = recommendations.slice(0, DEMO_RECOMMENDATION_LIMIT).map((recommendation, index) => ({
    snapshotMonth: boxMonth,
    gameSlug: recommendation.game.slug,
    rank: index + 1,
    score: recommendation.score,
    confidence: recommendation.confidence,
    reasons: recommendation.reasons,
    overlapThemes: recommendation.overlaps.themes,
    overlapMechanics: recommendation.overlaps.mechanics,
    likedTitles: recommendation.overlaps.likedTitles,
    selectionStatus: index === 0 ? selectionStatus : "current-alternate",
  }));

  if (!gameSlug) {
    return ranked.map((snapshot, index) => ({
      ...snapshot,
      selectionStatus: index === 0 ? selectionStatus : "current-alternate",
    }));
  }

  const deliveredRecommendation = recommendations.find((recommendation) => recommendation.game.slug === gameSlug);
  if (!deliveredRecommendation || ranked.some((snapshot) => snapshot.gameSlug === gameSlug)) {
    return ranked.map((snapshot) => ({
      ...snapshot,
      selectionStatus: snapshot.gameSlug === gameSlug ? selectionStatus : "alternate",
    }));
  }

  return [
    ...ranked.map((snapshot) => ({
      ...snapshot,
      selectionStatus: "alternate" as const,
    })),
    {
      snapshotMonth: boxMonth,
      gameSlug: deliveredRecommendation.game.slug,
      rank: recommendations.findIndex((recommendation) => recommendation.game.slug === gameSlug) + 1,
      score: deliveredRecommendation.score,
      confidence: deliveredRecommendation.confidence,
      reasons: deliveredRecommendation.reasons,
      overlapThemes: deliveredRecommendation.overlaps.themes,
      overlapMechanics: deliveredRecommendation.overlaps.mechanics,
      likedTitles: deliveredRecommendation.overlaps.likedTitles,
      selectionStatus,
    },
  ].sort((left, right) => left.rank - right.rank);
}

export function buildDemoSeedDataset(referenceDate = new Date()): DemoSeedDataset {
  const currentMonthDate = startOfMonth(referenceDate);
  const currentMonth = formatMonth(currentMonthDate);
  const firstPastMonthOffset = -DEMO_PAST_BOX_TEMPLATES.length;
  const currentCollection: string[] = [...DEMO_STARTING_COLLECTION];
  const shippedSlugs: string[] = [];

  const pastBoxes = DEMO_PAST_BOX_TEMPLATES.map((template, index) => {
    const month = formatMonth(addMonths(currentMonthDate, firstPastMonthOffset + index));
    return {
      boxMonth: month,
      gameSlug: template.gameSlug,
      note: template.note,
      decision: template.decision,
      feedback: {
        rating: template.feedback.rating,
        tags: [...template.feedback.tags],
        comment: template.feedback.comment,
      },
    };
  });

  const recommendationSnapshots = pastBoxes.flatMap((box) => {
    const snapshots = buildMonthlySnapshots({
      boxMonth: box.boxMonth,
      gameSlug: box.gameSlug,
      selectionStatus: box.decision === "keep" ? "past-keep" : "past-return",
      ownedSlugs: [...currentCollection],
      shippedSlugs: [...shippedSlugs],
    });

    shippedSlugs.push(box.gameSlug);
    if (box.decision === "keep" && !currentCollection.includes(box.gameSlug)) {
      currentCollection.push(box.gameSlug);
    }

    return snapshots;
  });

  recommendationSnapshots.push(
    ...buildMonthlySnapshots({
      boxMonth: currentMonth,
      selectionStatus: "current-match",
      ownedSlugs: [...currentCollection],
      shippedSlugs: [...shippedSlugs],
    })
  );

  return {
    baseProfile: { ...DEMO_BASE_PROFILE },
    profile: { ...DEMO_PROFILE },
    answers: DEMO_QUIZ_ANSWERS.map((answer) => ({ ...answer })),
    themes: [...DEMO_THEMES],
    mechanics: [...DEMO_MECHANICS],
    pastBoxes,
    currentCollection,
    recommendationSnapshots,
    currentMonth,
  };
}
