import type { Game } from "@/lib/types";

function hashFromTitle(title: string) {
  return title.split("").reduce((acc, character) => acc + character.charCodeAt(0), 0);
}

function emojiFromTheme(theme: string) {
  switch (theme) {
    case "nature":
      return "🌿";
    case "fantasy":
      return "🗡️";
    case "sci-fi":
      return "🚀";
    case "historical":
      return "🏛️";
    case "horror":
      return "🕯️";
    case "animals":
      return "🦊";
    case "cozy":
      return "☕";
    case "mystery":
      return "🔍";
    case "economics":
      return "💰";
    case "city-building":
      return "🏗️";
    case "adventure":
      return "🧭";
    case "space":
      return "🪐";
    case "culture":
      return "🎭";
    case "mythology":
      return "⚡";
    case "travel":
      return "✈️";
    case "social":
      return "🎉";
    default:
      return "🎲";
  }
}

export function GameCover({ game, compact = false }: { game: Game; compact?: boolean }) {
  const hash = hashFromTitle(game.title);
  const hueA = hash % 360;
  const hueB = (hash * 1.7) % 360;
  const emoji = emojiFromTheme(game.themes[0] ?? "");

  return (
    <div
      role="img"
      aria-label={`${game.title} cover art`}
      className={`relative overflow-hidden rounded-[1.75rem] border border-white/60 shadow-[0_24px_50px_-24px_rgba(92,45,0,0.45)] ${compact ? "aspect-[4/5]" : "aspect-[5/6]"}`}
      style={{
        backgroundImage: `linear-gradient(145deg, hsl(${hueA} 80% 74%), hsl(${hueB} 72% 44%))`,
      }}
    >
      <div className="absolute inset-0 bg-[radial-gradient(circle_at_top_left,rgba(255,255,255,0.42),transparent_35%),radial-gradient(circle_at_bottom_right,rgba(17,24,39,0.24),transparent_35%)]" />
      <div className="relative flex h-full flex-col justify-between p-5 text-white">
        <div className="flex items-center justify-between text-xs font-semibold uppercase tracking-[0.28em] text-white/80">
          <span>{game.year}</span>
          <span>{game.themes[0] ?? "curated"}</span>
        </div>
        <div className="space-y-3">
          <div className="text-4xl">{emoji}</div>
          <div>
            <h3 className={`${compact ? "text-lg" : "text-2xl"} font-semibold leading-tight`}>{game.title}</h3>
            <p className="mt-2 text-sm text-white/80">{game.mechanics.slice(0, 2).join(" • ")}</p>
          </div>
        </div>
      </div>
    </div>
  );
}
