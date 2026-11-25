export type Role = "Viewer" | "Editor" | "Publisher";

/** Brands a view or a change applies to. "all" = every brand the operator has access to. */
export type Scope = "all" | string[];

export type LabelTone = "emerald" | "rose" | "amber" | "violet" | "sky";

export interface Label {
  id: string;
  name: string;
  tone: LabelTone;
}

export interface Brand {
  id: string;
  name: string;
  /** Brand group used for bulk selection, e.g. "EU", "LatAm", "Crypto" */
  group: string;
  /** Market and license, e.g. "EU · MGA" */
  region: string;
  /** Back-office platform the brand runs on */
  platform: string;
  /** Game providers allowed by the brand's license */
  allowedProviders: string[];
  /** Global label id -> name of the same label on the brand's platform (null = the brand has no such label) */
  labelMap: Record<string, string | null>;
  color: string;
  /** Demo only: the platform answers with a timeout on the first attempt */
  flaky: boolean;
}

export interface Game {
  id: string;
  title: string;
  provider: string;
  kind: "Slot" | "Live" | "Instant";
  releasedDaysAgo: number;
  art: { icon: string; from: string; to: string };
}

/** Settings of one game on one brand. */
export interface GameBrandState {
  active: boolean;
  /** Global label ids */
  labels: string[];
  /** Global label id -> ISO date when the label should be removed automatically */
  labelExpiry: Record<string, string>;
  /** null = default artwork, otherwise an image id (see IMAGES) or "upload:<object url>" */
  image: string | null;
  pinned: boolean;
  pinnedUntil?: string;
}

export type SyncStatus = "pending" | "synced" | "failed";

export type ChangeField = "status" | "position" | "pin" | "label" | "image";

export interface Change {
  field: ChangeField;
  before: string;
  after: string;
}

/** What the operator has filled in the Edit panel. */
export interface Draft {
  gameIds: string[];
  scope: Scope;
  status: { enabled: boolean; value: "active" | "inactive" };
  position: { enabled: boolean; action: "top" | "up" | "down" | "exact"; value: number; pin: boolean; pinUntil: string };
  /** Pin or unpin without moving the game */
  pin: { enabled: boolean; value: boolean };
  labels: { enabled: boolean; add: string[]; remove: string[]; ttlDays: number | null };
  /** value: undefined = nothing picked yet, null = default artwork, otherwise an image id */
  image: { enabled: boolean; value: string | null | undefined; overwriteLocal: boolean };
  /** issue id -> chosen option id */
  resolutions: Record<string, string>;
  comment: string;
}

export type IssueKind = "license" | "inactive" | "pinned" | "label";

/** Something the operator has to accept or decide on before publishing. */
export interface Issue {
  id: string;
  kind: IssueKind;
  severity: "blocked" | "warning";
  brandName: string;
  gameTitle: string;
  message: string;
  resolved: boolean;
  options?: { id: string; label: string }[];
}

/** One game on one brand. */
export interface PlanRow {
  gameId: string;
  brandId: string;
  /** false = the brand is skipped for this game */
  apply: boolean;
  blocked?: string;
  changes: Change[];
  notes: string[];
  issues: Issue[];
  /** Labels that don't exist on the brand yet and will be created */
  createLabels: string[];
  after?: GameBrandState;
}

export interface PlanBrand {
  brandId: string;
  rows: PlanRow[];
  orderBefore: string[];
  orderAfter: string[];
  /** Changed games only (may include other games that were moved or unpinned) */
  statesAfter: Record<string, GameBrandState>;
}

/** Result of checking a draft against the current data before anything is published. */
export interface Plan {
  scopeIds: string[];
  brands: PlanBrand[];
  rows: PlanRow[];
  /** Rows that will change something */
  changed: PlanRow[];
  /** Changed rows without open questions */
  ready: PlanRow[];
  /** Open questions that block publishing */
  pending: Issue[];
  /** Rows that can't be applied */
  skipped: PlanRow[];
  /** Number of brands with at least one change */
  brandCount: number;
}

export interface HistoryBrand {
  brandId: string;
  changes: { gameId: string; items: Change[] }[];
  statesBefore: Record<string, GameBrandState>;
  statesAfter: Record<string, GameBrandState>;
  orderBefore: string[];
  orderAfter: string[];
  sync: SyncStatus;
  error?: string;
}

export interface SkippedBrand {
  brandId: string;
  gameId: string;
  reason: string;
}

export interface HistoryEntry {
  id: string;
  at: string;
  operatorId: string;
  action: string;
  /** Change types: status, position, labels, image, revert */
  kinds: string[];
  comment?: string;
  gameIds: string[];
  scopeLabel: string;
  brands: HistoryBrand[];
  skipped: SkippedBrand[];
  revertOf?: string;
}

export interface Operator {
  id: string;
  name: string;
  role: Role;
  /** "all" or the brand groups the operator works with */
  access: "all" | string[];
  color: string;
}

export interface PanelState {
  dataset: 12 | 50;
  brands: Brand[];
  games: Game[];
  states: Record<string, GameBrandState>;
  /** Order of active games in the lobby of each brand */
  orders: Record<string, string[]>;
  operators: Operator[];
  operatorId: string;
  scope: Scope;
  history: HistoryEntry[];
  simulateFailures: boolean;
  /** Brands whose platform already failed once (used only by the failure simulation) */
  flakyUsed: Record<string, boolean>;
  seq: number;
}
