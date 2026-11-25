import { GAMES, OPERATORS, createDataset } from "./data";
import { applyPlan, computePlan, describeAction, draftKinds, emptyDraft, historyScopeLabel } from "./logic";
import type { Draft, PanelState, Scope } from "./types";
import { stateKey } from "./utils";

const MINUTE = 60_000;
const HOUR = 60 * MINUTE;
const DAY = 24 * HOUR;

/** A change made before the demo starts, replayed through the same logic as live changes. */
interface Seed {
  /** How long ago the change was made */
  ago: number;
  operatorId: string;
  gameIds: string[];
  scope: Scope;
  patch: Partial<Draft>;
  comment?: string;
}

function seeds(state: PanelState, now: number): Seed[] {
  const eu = state.brands.filter((brand) => brand.group === "EU").map((brand) => brand.id);

  // Brands where Candy Comet is switched off need a decision before its position can be set.
  const candyDecisions = Object.fromEntries(
    state.brands
      .filter((brand) => eu.includes(brand.id) && !state.states[stateKey("candy-comet", brand.id)].active)
      .map((brand) => [`${stateKey("candy-comet", brand.id)}|inactive`, brand.allowedProviders.includes("GemStudio") ? "activate" : "skip"]),
  );

  return [
    {
      ago: 4 * DAY,
      operatorId: "kirill",
      gameIds: ["wolf-moon"],
      scope: ["golden-ace", "rio-fortuna"],
      patch: { position: { enabled: true, action: "top", value: 1, pin: true, pinUntil: new Date(now + 5 * DAY).toISOString().slice(0, 10) } },
      comment: "Provider deal: top placement until the end of the month",
    },
    {
      ago: 2 * DAY - 3 * HOUR,
      operatorId: "kirill",
      gameIds: ["cosmic-cash"],
      scope: "all",
      patch: { status: { enabled: true, value: "active" } },
      comment: "Go-live request from LuckyFish",
    },
    {
      ago: DAY + 2 * HOUR,
      operatorId: "kirill",
      gameIds: ["cosmic-cash", "pharaohs-secret", "sweet-storm"],
      scope: "all",
      patch: { labels: { enabled: true, add: ["new"], remove: [], ttlDays: 14 } },
      comment: "Weekly release: 3 new games",
    },
    {
      ago: 26 * HOUR,
      operatorId: "dana",
      gameIds: ["sweet-storm"],
      scope: ["rio-fortuna"],
      patch: { image: { enabled: true, value: "promo-es", overwriteLocal: false } },
      comment: "Local promo banner (PT)",
    },
    {
      ago: 9 * HOUR,
      operatorId: "kirill",
      gameIds: ["candy-comet"],
      scope: eu,
      patch: { position: { enabled: true, action: "exact", value: 4, pin: false, pinUntil: "" }, resolutions: candyDecisions },
      comment: "Weekend promo",
    },
    {
      ago: 6 * HOUR,
      operatorId: "maria",
      gameIds: ["pirates-plunder"],
      scope: ["golden-ace"],
      patch: { status: { enabled: true, value: "inactive" } },
      comment: "Broken bonus round — provider ticket #4821",
    },
    {
      ago: 2 * HOUR,
      operatorId: "maria",
      gameIds: ["jungle-jewels"],
      scope: ["novaspin"],
      patch: { labels: { enabled: true, add: [], remove: ["hot"], ttlDays: null } },
      comment: "Brand request in Telegram",
    },
  ];
}

/** Fresh demo state: generated data plus a few days of realistic History. */
export function createInitialState(size: 12 | 50): PanelState {
  const dataset = createDataset(size);
  const now = Date.now();

  let state: PanelState = {
    dataset: size,
    brands: dataset.brands,
    games: GAMES,
    states: dataset.states,
    orders: dataset.orders,
    operators: OPERATORS,
    operatorId: "kirill",
    scope: "all",
    history: [],
    simulateFailures: true,
    flakyUsed: {},
    seq: 1,
  };

  for (const seed of seeds(state, now)) {
    const operator = OPERATORS.find((item) => item.id === seed.operatorId) ?? OPERATORS[0];
    const draft: Draft = { ...emptyDraft(seed.gameIds, seed.scope), ...seed.patch };
    const plan = computePlan(state, draft, operator);
    if (plan.changed.length === 0) continue;
    state = applyPlan(state, plan, {
      id: `h${state.seq}`,
      at: new Date(now - seed.ago).toISOString(),
      operatorId: operator.id,
      action: describeAction(draft),
      kinds: draftKinds(draft),
      comment: seed.comment,
      scopeLabel: historyScopeLabel(state, operator, seed.scope, plan.skipped.length),
    });
  }

  // Past changes are already on every platform.
  const history = state.history.map((entry) => ({ ...entry, brands: entry.brands.map((item) => ({ ...item, sync: "synced" as const })) }));

  return { ...state, history };
}
