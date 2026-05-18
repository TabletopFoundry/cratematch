import "server-only";

import Database from "better-sqlite3";
import fs from "node:fs";
import path from "node:path";

import { GAME_CATALOG } from "@/lib/catalog";

import { buildDemoSeedDataset, DEMO_SEED_VERSION } from "./seed-data";

declare global {
  var __crateMatchDb: Database.Database | undefined;
}

const DATA_DIR = path.join(process.cwd(), "data");
const DB_PATH = path.join(DATA_DIR, "cratematch.db");
const DEMO_SEED_META_KEY = "demo_seed_version";

export const DEMO_USER_ID = "demo-user";

function ensureDataDir() {
  if (!fs.existsSync(DATA_DIR)) {
    fs.mkdirSync(DATA_DIR, { recursive: true });
  }
}

function isDemoSeedEnabled() {
  return process.env.NODE_ENV !== "production" || process.env.CRATEMATCH_ENABLE_DEMO_SEED === "true";
}

function getMetaValue(db: Database.Database, key: string) {
  const row = db.prepare("SELECT value FROM app_meta WHERE key = ?").get(key) as { value: string } | undefined;
  return row?.value;
}

function setMetaValue(db: Database.Database, key: string, value: string) {
  db.prepare(
    `INSERT INTO app_meta (key, value)
     VALUES (?, ?)
     ON CONFLICT(key) DO UPDATE SET value = excluded.value`
  ).run(key, value);
}

function seedCatalog(db: Database.Database) {
  const upsertGame = db.prepare(`
    INSERT INTO games (slug, title, year, description, themes, mechanics, min_players, max_players, play_time, complexity, price)
    VALUES (@slug, @title, @year, @description, @themes, @mechanics, @min_players, @max_players, @play_time, @complexity, @price)
    ON CONFLICT(slug) DO UPDATE SET
      title = excluded.title,
      year = excluded.year,
      description = excluded.description,
      themes = excluded.themes,
      mechanics = excluded.mechanics,
      min_players = excluded.min_players,
      max_players = excluded.max_players,
      play_time = excluded.play_time,
      complexity = excluded.complexity,
      price = excluded.price
  `);

  db.transaction(() => {
    GAME_CATALOG.forEach((game) => {
      upsertGame.run({
        slug: game.slug,
        title: game.title,
        year: game.year,
        description: game.description,
        themes: JSON.stringify(game.themes),
        mechanics: JSON.stringify(game.mechanics),
        min_players: game.minPlayers,
        max_players: game.maxPlayers,
        play_time: game.playTime,
        complexity: game.complexity,
        price: game.price,
      });
    });
  })();
}

function ensureBaseProfile(db: Database.Database) {
  const { baseProfile } = buildDemoSeedDataset();

  db.prepare(
    `INSERT INTO user_profile (user_id, name, plan_id, ideal_player_count, ideal_play_time, complexity_target, onboarding_complete, billing_status)
     VALUES (?, ?, ?, ?, ?, ?, ?, ?)
     ON CONFLICT(user_id) DO NOTHING`
  ).run(
    baseProfile.userId,
    baseProfile.name,
    baseProfile.planId,
    baseProfile.idealPlayerCount,
    baseProfile.idealPlayTime,
    baseProfile.complexityTarget,
    baseProfile.onboardingComplete ? 1 : 0,
    baseProfile.billingStatus,
  );
}

function seedDemoUser(db: Database.Database) {
  const dataset = buildDemoSeedDataset();

  db.transaction(() => {
    db.prepare(
      `INSERT INTO user_profile (user_id, name, plan_id, ideal_player_count, ideal_play_time, complexity_target, onboarding_complete, billing_status)
       VALUES (?, ?, ?, ?, ?, ?, ?, ?)
       ON CONFLICT(user_id) DO UPDATE SET
         name = excluded.name,
         plan_id = excluded.plan_id,
         ideal_player_count = excluded.ideal_player_count,
         ideal_play_time = excluded.ideal_play_time,
         complexity_target = excluded.complexity_target,
         onboarding_complete = excluded.onboarding_complete,
         billing_status = excluded.billing_status`
    ).run(
      dataset.profile.userId,
      dataset.profile.name,
      dataset.profile.planId,
      dataset.profile.idealPlayerCount,
      dataset.profile.idealPlayTime,
      dataset.profile.complexityTarget,
      dataset.profile.onboardingComplete ? 1 : 0,
      dataset.profile.billingStatus,
    );

    [
      "DELETE FROM quiz_answers WHERE user_id = ?",
      "DELETE FROM user_themes WHERE user_id = ?",
      "DELETE FROM user_mechanics WHERE user_id = ?",
      "DELETE FROM user_collection WHERE user_id = ?",
      "DELETE FROM past_boxes WHERE user_id = ?",
      "DELETE FROM box_decisions WHERE user_id = ?",
      "DELETE FROM box_feedback WHERE user_id = ?",
      "DELETE FROM recommendation_snapshots WHERE user_id = ?",
    ].forEach((statement) => db.prepare(statement).run(dataset.profile.userId));

    const insertAnswer = db.prepare("INSERT INTO quiz_answers (user_id, game_slug, rating) VALUES (?, ?, ?)");
    dataset.answers.forEach((answer) => insertAnswer.run(dataset.profile.userId, answer.gameSlug, answer.rating));

    const insertTheme = db.prepare("INSERT INTO user_themes (user_id, theme) VALUES (?, ?)");
    dataset.themes.forEach((theme) => insertTheme.run(dataset.profile.userId, theme));

    const insertMechanic = db.prepare("INSERT INTO user_mechanics (user_id, mechanic) VALUES (?, ?)");
    dataset.mechanics.forEach((mechanic) => insertMechanic.run(dataset.profile.userId, mechanic));

    const insertCollection = db.prepare("INSERT INTO user_collection (user_id, game_slug) VALUES (?, ?)");
    dataset.currentCollection.forEach((gameSlug) => insertCollection.run(dataset.profile.userId, gameSlug));

    const insertPastBox = db.prepare("INSERT INTO past_boxes (user_id, box_month, game_slug, note) VALUES (?, ?, ?, ?)");
    const insertDecision = db.prepare("INSERT INTO box_decisions (user_id, box_month, game_slug, decision) VALUES (?, ?, ?, ?)");
    const insertFeedback = db.prepare("INSERT INTO box_feedback (user_id, box_month, game_slug, rating, tags, comment) VALUES (?, ?, ?, ?, ?, ?)");
    dataset.pastBoxes.forEach((box) => {
      insertPastBox.run(dataset.profile.userId, box.boxMonth, box.gameSlug, box.note);
      insertDecision.run(dataset.profile.userId, box.boxMonth, box.gameSlug, box.decision);
      insertFeedback.run(dataset.profile.userId, box.boxMonth, box.gameSlug, box.feedback.rating, JSON.stringify(box.feedback.tags), box.feedback.comment);
    });

    const insertSnapshot = db.prepare(
      `INSERT INTO recommendation_snapshots (user_id, snapshot_month, rank, game_slug, score, confidence, reasons, overlap_themes, overlap_mechanics, liked_titles, selection_status)
       VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`
    );
    dataset.recommendationSnapshots.forEach((snapshot) => {
      insertSnapshot.run(
        dataset.profile.userId,
        snapshot.snapshotMonth,
        snapshot.rank,
        snapshot.gameSlug,
        snapshot.score,
        snapshot.confidence,
        JSON.stringify(snapshot.reasons),
        JSON.stringify(snapshot.overlapThemes),
        JSON.stringify(snapshot.overlapMechanics),
        JSON.stringify(snapshot.likedTitles),
        snapshot.selectionStatus,
      );
    });

    setMetaValue(db, DEMO_SEED_META_KEY, DEMO_SEED_VERSION);
  })();
}

function createDatabase() {
  ensureDataDir();
  const db = new Database(DB_PATH);
  db.pragma("journal_mode = WAL");
  db.pragma("foreign_keys = ON");

  db.exec(`
    CREATE TABLE IF NOT EXISTS games (
      slug TEXT PRIMARY KEY,
      title TEXT NOT NULL,
      year INTEGER NOT NULL,
      description TEXT NOT NULL,
      themes TEXT NOT NULL,
      mechanics TEXT NOT NULL,
      min_players INTEGER NOT NULL,
      max_players INTEGER NOT NULL,
      play_time INTEGER NOT NULL,
      complexity REAL NOT NULL,
      price REAL NOT NULL
    );

    CREATE TABLE IF NOT EXISTS user_profile (
      user_id TEXT PRIMARY KEY,
      name TEXT NOT NULL,
      plan_id TEXT NOT NULL,
      ideal_player_count INTEGER NOT NULL,
      ideal_play_time INTEGER NOT NULL,
      complexity_target REAL NOT NULL,
      onboarding_complete INTEGER NOT NULL DEFAULT 0,
      billing_status TEXT NOT NULL DEFAULT 'trial'
    );

    CREATE TABLE IF NOT EXISTS quiz_answers (
      user_id TEXT NOT NULL,
      game_slug TEXT NOT NULL,
      rating TEXT NOT NULL,
      PRIMARY KEY (user_id, game_slug)
    );

    CREATE TABLE IF NOT EXISTS user_themes (
      user_id TEXT NOT NULL,
      theme TEXT NOT NULL,
      PRIMARY KEY (user_id, theme)
    );

    CREATE TABLE IF NOT EXISTS user_mechanics (
      user_id TEXT NOT NULL,
      mechanic TEXT NOT NULL,
      PRIMARY KEY (user_id, mechanic)
    );

    CREATE TABLE IF NOT EXISTS user_collection (
      user_id TEXT NOT NULL,
      game_slug TEXT NOT NULL,
      PRIMARY KEY (user_id, game_slug)
    );

    CREATE TABLE IF NOT EXISTS box_decisions (
      user_id TEXT NOT NULL,
      box_month TEXT NOT NULL,
      game_slug TEXT NOT NULL,
      decision TEXT NOT NULL,
      updated_at TEXT NOT NULL DEFAULT CURRENT_TIMESTAMP,
      PRIMARY KEY (user_id, box_month)
    );

    CREATE TABLE IF NOT EXISTS past_boxes (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      user_id TEXT NOT NULL,
      box_month TEXT NOT NULL,
      game_slug TEXT NOT NULL,
      note TEXT NOT NULL
    );

    CREATE TABLE IF NOT EXISTS box_feedback (
      user_id TEXT NOT NULL,
      box_month TEXT NOT NULL,
      game_slug TEXT NOT NULL,
      rating INTEGER NOT NULL CHECK(rating BETWEEN 1 AND 5),
      tags TEXT NOT NULL DEFAULT '[]',
      comment TEXT NOT NULL DEFAULT '',
      created_at TEXT NOT NULL DEFAULT CURRENT_TIMESTAMP,
      PRIMARY KEY (user_id, box_month)
    );

    CREATE TABLE IF NOT EXISTS recommendation_snapshots (
      user_id TEXT NOT NULL,
      snapshot_month TEXT NOT NULL,
      rank INTEGER NOT NULL,
      game_slug TEXT NOT NULL,
      score REAL NOT NULL,
      confidence REAL NOT NULL,
      reasons TEXT NOT NULL,
      overlap_themes TEXT NOT NULL,
      overlap_mechanics TEXT NOT NULL,
      liked_titles TEXT NOT NULL,
      selection_status TEXT NOT NULL,
      created_at TEXT NOT NULL DEFAULT CURRENT_TIMESTAMP,
      PRIMARY KEY (user_id, snapshot_month, rank)
    );

    CREATE TABLE IF NOT EXISTS app_meta (
      key TEXT PRIMARY KEY,
      value TEXT NOT NULL
    );
  `);

  seedCatalog(db);
  ensureBaseProfile(db);

  if (isDemoSeedEnabled() && getMetaValue(db, DEMO_SEED_META_KEY) !== DEMO_SEED_VERSION) {
    seedDemoUser(db);
  }

  return db;
}

export function getDb() {
  if (!global.__crateMatchDb) {
    global.__crateMatchDb = createDatabase();
  }

  return global.__crateMatchDb;
}
