import type { Brand, Game, GameBrandState, Label, Operator } from "./types";
import { stateKey } from "./utils";

/** Everything in this file is demo data for the prototype. */

export const ALL_PROVIDERS = ["PlayNova", "ReelCraft", "GemStudio", "LuckyFish"];

/** One label for the whole company; each brand maps it to its own name (see Brand.labelMap). */
export const LABELS: Label[] = [
  { id: "new", name: "New", tone: "emerald" },
  { id: "hot", name: "Hot", tone: "rose" },
  { id: "jackpot", name: "Jackpot", tone: "amber" },
  { id: "tournament", name: "Tournament", tone: "violet" },
  { id: "exclusive", name: "Exclusive", tone: "sky" },
];

export const labelName = (id: string) => LABELS.find((label) => label.id === id)?.name ?? id;

export interface ImageOption {
  id: string;
  name: string;
  from: string;
  to: string;
  tag?: string;
}

/** Ready-made artwork operators can pick instead of uploading a file. */
export const IMAGES: ImageOption[] = [
  { id: "promo-en", name: "Promo banner (EN)", from: "#0f766e", to: "#134e4a", tag: "PROMO" },
  { id: "promo-es", name: "Promo banner (ES)", from: "#9d174d", to: "#4c0519", tag: "OFERTA" },
  { id: "holiday", name: "Holiday artwork", from: "#1e3a8a", to: "#0c4a6e", tag: "WINTER" },
];

export const GAMES: Game[] = [
  { id: "dragons-vault", title: "Dragon's Vault", provider: "PlayNova", kind: "Slot", releasedDaysAgo: 210, art: { icon: "flame", from: "#f97316", to: "#b91c1c" } },
  { id: "wolf-moon", title: "Wolf Moon", provider: "PlayNova", kind: "Slot", releasedDaysAgo: 340, art: { icon: "moon", from: "#6366f1", to: "#7e22ce" } },
  { id: "pharaohs-secret", title: "Pharaoh's Secret", provider: "GemStudio", kind: "Slot", releasedDaysAgo: 2, art: { icon: "crown", from: "#f59e0b", to: "#92400e" } },
  { id: "neon-rush", title: "Neon Rush", provider: "ReelCraft", kind: "Instant", releasedDaysAgo: 120, art: { icon: "zap", from: "#d946ef", to: "#6d28d9" } },
  { id: "jungle-jewels", title: "Jungle Jewels", provider: "ReelCraft", kind: "Slot", releasedDaysAgo: 75, art: { icon: "gem", from: "#10b981", to: "#065f46" } },
  { id: "cosmic-cash", title: "Cosmic Cash", provider: "LuckyFish", kind: "Slot", releasedDaysAgo: 1, art: { icon: "rocket", from: "#8b5cf6", to: "#3730a3" } },
  { id: "sweet-storm", title: "Sweet Storm", provider: "LuckyFish", kind: "Slot", releasedDaysAgo: 4, art: { icon: "cherry", from: "#fb7185", to: "#9f1239" } },
  { id: "lucky-clover", title: "Lucky Clover", provider: "PlayNova", kind: "Slot", releasedDaysAgo: 400, art: { icon: "clover", from: "#22c55e", to: "#15803d" } },
  { id: "book-of-tides", title: "Book of Tides", provider: "PlayNova", kind: "Slot", releasedDaysAgo: 95, art: { icon: "waves", from: "#0ea5e9", to: "#1e40af" } },
  { id: "candy-comet", title: "Candy Comet", provider: "GemStudio", kind: "Slot", releasedDaysAgo: 60, art: { icon: "candy", from: "#f472b6", to: "#be185d" } },
  { id: "crystal-cavern", title: "Crystal Cavern", provider: "GemStudio", kind: "Slot", releasedDaysAgo: 180, art: { icon: "diamond", from: "#22d3ee", to: "#0369a1" } },
  { id: "pirates-plunder", title: "Pirate's Plunder", provider: "ReelCraft", kind: "Slot", releasedDaysAgo: 260, art: { icon: "anchor", from: "#64748b", to: "#1e293b" } },
  { id: "viking-voyage", title: "Viking Voyage", provider: "ReelCraft", kind: "Live", releasedDaysAgo: 150, art: { icon: "swords", from: "#38bdf8", to: "#1e3a8a" } },
  { id: "aztec-arrow", title: "Aztec Arrow", provider: "GemStudio", kind: "Instant", releasedDaysAgo: 310, art: { icon: "sun", from: "#a3e635", to: "#4d7c0f" } },
];

export const OPERATORS: Operator[] = [
  { id: "kirill", name: "Kirill M.", role: "Publisher", access: "all", color: "#34d399" },
  { id: "maria", name: "Maria K.", role: "Editor", access: ["EU", "LatAm"], color: "#fbbf24" },
  { id: "alex", name: "Alex P.", role: "Viewer", access: "all", color: "#c084fc" },
  { id: "dana", name: "Dana L.", role: "Editor", access: ["LatAm"], color: "#f472b6" },
];

const DEFAULT_LABELS: Record<string, string> = { new: "New", hot: "Hot", jackpot: "Jackpot", tournament: "Tournament", exclusive: "Exclusive" };

interface BrandOptions {
  without?: string[];
  labels?: Record<string, string | null>;
  flaky?: boolean;
}

function makeBrand(id: string, name: string, group: string, region: string, platform: string, color: string, opts: BrandOptions = {}): Brand {
  return {
    id,
    name,
    group,
    region,
    platform,
    color,
    allowedProviders: ALL_PROVIDERS.filter((provider) => !opts.without?.includes(provider)),
    labelMap: { ...DEFAULT_LABELS, ...opts.labels },
    flaky: opts.flaky ?? false,
  };
}

const BASE_BRANDS: Brand[] = [
  makeBrand("golden-ace", "Golden Ace", "EU", "EU · MGA", "LobbyOS", "#f59e0b"),
  makeBrand("novaspin", "NovaSpin", "EU", "EU · MGA", "LobbyOS", "#6366f1", { labels: { hot: "Trending" } }),
  makeBrand("lucky-harbor", "Lucky Harbor", "EU", "EU · MGA", "SpinEngine", "#0ea5e9", { labels: { hot: "Top Games" } }),
  makeBrand("starfall", "Starfall", "EU", "EU · MGA", "SpinEngine", "#8b5cf6", { labels: { tournament: null } }),
  makeBrand("emerald-isle", "Emerald Isle", "EU", "EU · Ireland", "LobbyOS", "#10b981", { labels: { hot: "Popular" } }),
  makeBrand("rio-fortuna", "Rio Fortuna", "LatAm", "LatAm · Brazil", "SpinEngine", "#22c55e", { without: ["GemStudio"], labels: { hot: "Quentes" } }),
  makeBrand("andes-gold", "Andes Gold", "LatAm", "LatAm · Peru", "LobbyOS", "#eab308"),
  makeBrand("carnaval-slots", "Carnaval Slots", "LatAm", "LatAm · Brazil", "SpinEngine", "#ec4899", { without: ["GemStudio"], labels: { hot: "Em Alta" } }),
  makeBrand("bit-royale", "Bit Royale", "Crypto", "Crypto · Curaçao", "CoinBack", "#f43f5e", { without: ["LuckyFish"], labels: { hot: null } }),
  makeBrand("coin-comet", "Coin Comet", "Crypto", "Crypto · Curaçao", "CoinBack", "#14b8a6"),
  makeBrand("monte-crypto", "Monte Crypto", "Crypto", "Crypto · Curaçao", "CoinBack", "#a855f7", { labels: { hot: "Trending", tournament: null } }),
  makeBrand("satoshi-spins", "Satoshi Spins", "Crypto", "Crypto · Curaçao", "LobbyOS", "#f97316", { flaky: true }),
];

const EXTRA_BRANDS: [string, string, string, string][] = [
  ["amber-ace", "Amber Ace", "EU", "#d97706"],
  ["bluebird", "Bluebird", "EU", "#2563eb"],
  ["coral-crown", "Coral Crown", "EU", "#e11d48"],
  ["dune-dash", "Dune Dash", "EU", "#0d9488"],
  ["echo-empire", "Echo Empire", "EU", "#7c3aed"],
  ["frost-fang", "Frost Fang", "EU", "#0284c7"],
  ["glacier-gold", "Glacier Gold", "EU", "#ca8a04"],
  ["harbor-lights", "Harbor Lights", "EU", "#059669"],
  ["ivory-iris", "Ivory Iris", "EU", "#4f46e5"],
  ["jade-joker", "Jade Joker", "EU", "#ea580c"],
  ["rio-ruby", "Rio Ruby", "LatAm", "#db2777"],
  ["lima-luck", "Lima Luck", "LatAm", "#16a34a"],
  ["samba-spins", "Samba Spins", "LatAm", "#dc2626"],
  ["pacific-play", "Pacific Play", "LatAm", "#0891b2"],
  ["andes-aurora", "Andes Aurora", "LatAm", "#9333ea"],
  ["tango-treasure", "Tango Treasure", "LatAm", "#d97706"],
  ["cozumel-cash", "Cozumel Cash", "LatAm", "#2563eb"],
  ["patagonia-play", "Patagonia Play", "LatAm", "#0d9488"],
  ["salvador-star", "Salvador Star", "LatAm", "#e11d48"],
  ["orinoco-ace", "Orinoco Ace", "LatAm", "#7c3aed"],
  ["token-titan", "Token Titan", "Crypto", "#ca8a04"],
  ["blockbounty", "BlockBounty", "Crypto", "#059669"],
  ["hash-king", "Hash King", "Crypto", "#4f46e5"],
  ["cipher-city", "Cipher City", "Crypto", "#ea580c"],
  ["altcoin-arcade", "Altcoin Arcade", "Crypto", "#db2777"],
  ["defi-dynasty", "DeFi Dynasty", "Crypto", "#16a34a"],
  ["wallet-whale", "Wallet Whale", "Crypto", "#0891b2"],
  ["node-nine", "Node Nine", "Crypto", "#9333ea"],
  ["stable-star", "Stable Star", "Crypto", "#dc2626"],
  ["sakura-spins", "Sakura Spins", "Asia", "#e11d48"],
  ["lotus-luck", "Lotus Luck", "Asia", "#16a34a"],
  ["dragon-gate", "Dragon Gate", "Asia", "#dc2626"],
  ["manila-moon", "Manila Moon", "Asia", "#0284c7"],
  ["siam-star", "Siam Star", "Asia", "#d97706"],
  ["hanoi-hotspot", "Hanoi Hotspot", "Asia", "#2563eb"],
  ["bali-bonus", "Bali Bonus", "Asia", "#0d9488"],
  ["tiger-temple", "Tiger Temple", "Asia", "#ea580c"],
  ["mandalay-moon", "Mandalay Moon", "Asia", "#7c3aed"],
];

const EXTRA_REGIONS: Record<string, string[]> = {
  EU: ["EU · Estonia", "EU · Ireland", "EU · Romania", "EU · Denmark", "EU · Greece", "EU · Malta"],
  LatAm: ["LatAm · Mexico", "LatAm · Colombia", "LatAm · Chile", "LatAm · Argentina", "LatAm · Brazil", "LatAm · Peru"],
  Crypto: ["Crypto · Curaçao"],
  Asia: ["Asia · Philippines", "Asia · Thailand", "Asia · Vietnam", "Asia · Indonesia"],
};

const EXTRA_PLATFORMS: Record<string, string[]> = {
  EU: ["LobbyOS", "SpinEngine"],
  LatAm: ["SpinEngine"],
  Crypto: ["CoinBack"],
  Asia: ["TigerLobby"],
};

/** Brands 13–50, generated so the panel can be shown at scale. */
function extraBrands(): Brand[] {
  const hotAliases = ["Hot", "Trending", "Popular", "Top Games"];
  return EXTRA_BRANDS.map(([id, name, group, color], i) =>
    makeBrand(id, name, group, EXTRA_REGIONS[group][i % EXTRA_REGIONS[group].length], EXTRA_PLATFORMS[group][i % EXTRA_PLATFORMS[group].length], color, {
      without: i % 6 === 2 ? ["GemStudio"] : i % 6 === 5 ? ["LuckyFish"] : [],
      labels: { hot: i % 5 === 3 ? null : hotAliases[i % hotAliases.length], tournament: i % 7 === 4 ? null : "Tournament" },
      flaky: i % 13 === 4,
    }),
  );
}

function mulberry32(seed: number) {
  return () => {
    let t = (seed += 0x6d2b79f5);
    t = Math.imul(t ^ (t >>> 15), t | 1);
    t ^= t + Math.imul(t ^ (t >>> 7), t | 61);
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
  };
}

function shuffle<T>(items: T[], rnd: () => number): T[] {
  const result = [...items];
  for (let i = result.length - 1; i > 0; i--) {
    const j = Math.floor(rnd() * (i + 1));
    [result[i], result[j]] = [result[j], result[i]];
  }
  return result;
}

/** Games that are switched off on every brand when the demo starts (used to show activation). */
const OFF_EVERYWHERE = ["pharaohs-secret", "cosmic-cash"];
/** Games that are always on, so the demo scenarios work the same way on every load. */
const ALWAYS_ON = ["dragons-vault", "wolf-moon", "jungle-jewels", "candy-comet", "pirates-plunder", "sweet-storm"];

function baseLabels(game: Game, rnd: () => number): string[] {
  if (game.id === "jungle-jewels") return ["hot", "jackpot"];
  const roll = rnd();
  if (roll < 0.3) return ["hot"];
  if (roll < 0.45) return ["jackpot"];
  if (roll < 0.55) return ["tournament"];
  if (roll < 0.6) return ["exclusive"];
  return [];
}

export interface Dataset {
  brands: Brand[];
  states: Record<string, GameBrandState>;
  orders: Record<string, string[]>;
}

export function createDataset(size: 12 | 50): Dataset {
  const brands = size === 12 ? BASE_BRANDS : [...BASE_BRANDS, ...extraBrands()];
  const rnd = mulberry32(7);
  const states: Record<string, GameBrandState> = {};
  const orders: Record<string, string[]> = {};

  for (const brand of brands) {
    const active = GAMES.filter(
      (game) => brand.allowedProviders.includes(game.provider) && !OFF_EVERYWHERE.includes(game.id) && (ALWAYS_ON.includes(game.id) || rnd() > 0.16),
    );
    orders[brand.id] = shuffle(
      active.map((game) => game.id),
      rnd,
    );
    for (const game of GAMES) {
      const on = orders[brand.id].includes(game.id);
      states[stateKey(game.id, brand.id)] = { active: on, labels: on ? baseLabels(game, rnd) : [], labelExpiry: {}, image: null, pinned: false };
    }
  }

  return { brands, states, orders };
}
