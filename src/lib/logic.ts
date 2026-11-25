import { IMAGES, labelName } from "./data";
import type {
  Brand,
  Change,
  Draft,
  GameBrandState,
  HistoryBrand,
  HistoryEntry,
  Issue,
  Operator,
  PanelState,
  Plan,
  PlanBrand,
  PlanRow,
  Scope,
} from "./types";
import { stateKey } from "./utils";


export const clamp = (value: number, min: number, max: number) => Math.min(Math.max(value, min), max);

export const plural = (count: number, one: string, many = `${one}s`) => (count === 1 ? one : many);

const MONTHS = ["Jan", "Feb", "Mar", "Apr", "May", "Jun", "Jul", "Aug", "Sep", "Oct", "Nov", "Dec"];

function toDate(value: string) {
  // Date-only strings ("2026-11-30") are read as UTC by default; keep them local.
  return new Date(value.length === 10 ? `${value}T00:00:00` : value);
}

export function formatDate(value: string) {
  const date = toDate(value);
  return `${date.getDate()} ${MONTHS[date.getMonth()]}`;
}

export function formatDateTime(value: string, withTime = true) {
  const date = toDate(value);
  const day = formatDate(value);
  if (!withTime) return day;
  return `${day}, ${String(date.getHours()).padStart(2, "0")}:${String(date.getMinutes()).padStart(2, "0")}`;
}

export function timeAgo(value: string, now = Date.now()) {
  const minutes = Math.floor(Math.max(0, now - toDate(value).getTime()) / 60_000);
  if (minutes < 1) return "just now";
  if (minutes < 60) return `${minutes} min ago`;
  const hours = Math.floor(minutes / 60);
  if (hours < 24) return `${hours} h ago`;
  const days = Math.floor(hours / 24);
  return days < 7 ? `${days} d ago` : formatDateTime(value, false);
}

function move(list: string[], id: string, to: number) {
  const from = list.indexOf(id);
  if (from < 0) return;
  list.splice(from, 1);
  list.splice(clamp(to, 0, list.length), 0, id);
}

function remove(list: string[], id: string) {
  const index = list.indexOf(id);
  if (index >= 0) list.splice(index, 1);
}

export function imageLabel(id: string | null) {
  if (id === null) return "Default artwork";
  if (id.startsWith("upload:")) return "Uploaded image";
  return IMAGES.find((image) => image.id === id)?.name ?? "Custom image";
}

export function currentOperator(state: PanelState): Operator {
  return state.operators.find((operator) => operator.id === state.operatorId) ?? state.operators[0];
}

export function operatorCanAccess(operator: Operator, brand: Brand) {
  return operator.access === "all" || operator.access.includes(brand.group);
}

export function brandsForOperator(state: PanelState, operator: Operator): Brand[] {
  return state.brands.filter((brand) => operatorCanAccess(operator, brand));
}

export function canAccessHistoryEntry(state: PanelState, operator: Operator, entry: HistoryEntry): boolean {
  return entry.brands.every((item) => {
    const brand = state.brands.find((candidate) => candidate.id === item.brandId);
    return brand !== undefined && operatorCanAccess(operator, brand);
  });
}

export function scopeIds(available: Brand[], scope: Scope): string[] {
  if (scope === "all") return available.map((brand) => brand.id);
  const wanted = new Set(scope);
  return available.filter((brand) => wanted.has(brand.id)).map((brand) => brand.id);
}

export function scopeToBrands(state: PanelState, operator: Operator, scope: Scope): Brand[] {
  const ids = new Set(scopeIds(brandsForOperator(state, operator), scope));
  return state.brands.filter((brand) => ids.has(brand.id));
}

export function brandGroups(available: Brand[]): { name: string; ids: string[] }[] {
  const groups: { name: string; ids: string[] }[] = [];
  for (const brand of available) {
    const group = groups.find((item) => item.name === brand.group);
    if (group) group.ids.push(brand.id);
    else groups.push({ name: brand.group, ids: [brand.id] });
  }
  return groups;
}

const sameIds = (a: string[], b: string[]) => a.length === b.length && a.every((id, index) => id === b[index]);

/** Short name of a brand selection: "All brands (12)", "EU (5)", "Golden Ace +2" */
export function scopeLabel(available: Brand[], scope: Scope): string {
  const ids = scopeIds(available, scope);
  if (ids.length === available.length) return `All brands (${available.length})`;
  if (ids.length === 0) return "No brands";
  const group = brandGroups(available).find((item) => sameIds(item.ids, ids));
  if (group) return `${group.name} (${ids.length})`;
  const first = available.find((brand) => brand.id === ids[0])?.name ?? "Brand";
  return ids.length === 1 ? first : `${first} +${ids.length - 1}`;
}


export const canEdit = (operator: Operator) => operator.role !== "Viewer";

/** Returns why the operator can't publish, or null when publishing is allowed. */
export function publishDenial(operator: Operator, brandCount: number): string | null {
  if (operator.role === "Viewer") return "Your role is view-only, so you can't publish changes.";
  if (operator.role === "Editor" && brandCount > 1) {
    return `Your Editor role covers changes to one brand at a time. Ask a Publisher to confirm this change (${brandCount} brands).`;
  }
  return null;
}

/** Brand scope as shown in History, e.g. "All brands (12) · 1 skipped". */
export function historyScopeLabel(state: PanelState, operator: Operator, scope: Scope, skipped: number) {
  const base = scopeLabel(brandsForOperator(state, operator), scope);
  return skipped > 0 ? `${base} · ${skipped} skipped` : base;
}

/* --------------------------------------------------------------------------
 * Draft
 * ------------------------------------------------------------------------ */

export function emptyDraft(gameIds: string[], scope: Scope): Draft {
  return {
    gameIds,
    scope,
    status: { enabled: false, value: "active" },
    position: { enabled: false, action: "top", value: 1, pin: false, pinUntil: "" },
    pin: { enabled: false, value: true },
    labels: { enabled: false, add: [], remove: [], ttlDays: null },
    image: { enabled: false, value: undefined, overwriteLocal: false },
    resolutions: {},
    comment: "",
  };
}

/** At least one change is switched on and filled in. */
export function draftHasIntent(draft: Draft): boolean {
  return (
    draft.status.enabled ||
    draft.position.enabled ||
    draft.pin.enabled ||
    (draft.labels.enabled && (draft.labels.add.length > 0 || draft.labels.remove.length > 0)) ||
    (draft.image.enabled && draft.image.value !== undefined)
  );
}

export function draftKinds(draft: Draft): string[] {
  const kinds: string[] = [];
  if (draft.status.enabled) kinds.push("status");
  if (draft.position.enabled) kinds.push("position");
  if (draft.pin.enabled) kinds.push("pin");
  if (draft.labels.enabled && (draft.labels.add.length > 0 || draft.labels.remove.length > 0)) kinds.push("labels");
  if (draft.image.enabled && draft.image.value !== undefined) kinds.push("image");
  return kinds;
}

const POSITION_ACTIONS = { top: "Moved to top", up: "Moved up", down: "Moved down", exact: "Set position" } as const;

const quoted = (names: string[]) => names.map((name) => `“${name}”`).join(", ");

/** Short description of a draft, used as the action name in History. */
export function describeAction(draft: Draft): string {
  const parts: string[] = [];
  if (draft.status.enabled) parts.push(draft.status.value === "active" ? "Activated" : "Deactivated");
  if (draft.position.enabled) parts.push(draft.position.action === "exact" ? `Set position #${draft.position.value || 1}` : POSITION_ACTIONS[draft.position.action]);
  if (draft.pin.enabled) parts.push(draft.pin.value ? "Pinned" : "Unpinned");
  if (draft.labels.enabled && (draft.labels.add.length > 0 || draft.labels.remove.length > 0)) {
    const add = draft.labels.add.map(labelName);
    const remove = draft.labels.remove.map(labelName);
    if (add.length > 0 && remove.length > 0) parts.push("Updated labels");
    else if (add.length > 0) parts.push(`Added ${plural(add.length, "label")} ${quoted(add)}`);
    else parts.push(`Removed ${plural(remove.length, "label")} ${quoted(remove)}`);
  }
  if (draft.image.enabled && draft.image.value !== undefined) parts.push(draft.image.value === null ? "Reset image" : "Changed image");
  return parts.length > 0 ? parts.join(" · ") : "No changes";
}

/* --------------------------------------------------------------------------
 * Pre-flight check: what the draft will do on every brand
 * ------------------------------------------------------------------------ */

export function computePlan(state: PanelState, draft: Draft, operator: Operator): Plan {
  const available = brandsForOperator(state, operator);
  const scope = scopeIds(available, draft.scope);
  const games = state.games.filter((game) => draft.gameIds.includes(game.id));
  const title = (gameId: string) => state.games.find((game) => game.id === gameId)?.title ?? gameId;
  const multi = games.length > 1;
  const deactivating = draft.status.enabled && draft.status.value === "inactive";
  const ttlIso = draft.labels.ttlDays ? new Date(Date.now() + draft.labels.ttlDays * 86_400_000).toISOString() : null;

  const planBrands: PlanBrand[] = [];
  const rows: PlanRow[] = [];

  for (const brandId of scope) {
    const brand = state.brands.find((item) => item.id === brandId);
    if (!brand) continue;

    const orderBefore = state.orders[brandId] ?? [];
    // Working copy of the lobby order: changed only if something is published.
    const work = [...orderBefore];
    const working: Record<string, GameBrandState> = {};
    const touch = (gameId: string): GameBrandState => {
      if (!working[gameId]) {
        const source = state.states[stateKey(gameId, brandId)];
        working[gameId] = { ...source, labels: [...source.labels], labelExpiry: { ...source.labelExpiry } };
      }
      return working[gameId];
    };
    const brandRows: PlanRow[] = [];

    for (const game of games) {
      const key = stateKey(game.id, brandId);
      const before = state.states[key];
      const next = touch(game.id);
      const row: PlanRow = { gameId: game.id, brandId, apply: true, changes: [], notes: [], issues: [], createLabels: [] };
      brandRows.push(row);
      const allowed = brand.allowedProviders.includes(game.provider);

      // A license restriction only stops a game from being switched on.
      if (draft.status.enabled && draft.status.value === "active" && !before.active && !allowed) {
        row.apply = false;
        row.blocked = `Restricted by the ${brand.region} license: ${game.provider} games can't be shown here`;
        continue;
      }

      let willBeActive = next.active;

      // ---- Status -------------------------------------------------------
      if (draft.status.enabled) {
        const target = draft.status.value === "active";
        if (target !== next.active) {
          next.active = target;
          willBeActive = target;
          row.changes.push({ field: "status", before: before.active ? "Active" : "Inactive", after: target ? "Active" : "Inactive" });
          if (target) work.push(game.id);
          else remove(work, game.id);
          if (!target && next.pinned) {
            next.pinned = false;
            delete next.pinnedUntil;
            row.changes.push({ field: "pin", before: "Pinned", after: "Not pinned (game switched off)" });
          }
        }
      }

      // ---- Labels -------------------------------------------------------
      if (draft.labels.enabled) {
        for (const labelId of draft.labels.add) {
          if (next.labels.includes(labelId)) continue;
          const global = labelName(labelId);
          const local = brand.labelMap[labelId];
          const id = `${key}|label|${labelId}`;
          const choice = draft.resolutions[id];
          const issue = (message: string, resolved: boolean, options?: Issue["options"]): Issue => ({
            id,
            kind: "label",
            severity: "warning",
            brandName: brand.name,
            gameTitle: game.title,
            message,
            resolved,
            options,
          });
          if (local != null) {
            next.labels.push(labelId);
            if (ttlIso) next.labelExpiry[labelId] = ttlIso;
            row.changes.push({ field: "label", before: "—", after: `+ ${local === global ? global : `${global} → ${local}`}` });
          } else if (choice === "create") {
            next.labels.push(labelId);
            if (ttlIso) next.labelExpiry[labelId] = ttlIso;
            row.createLabels.push(labelId);
            row.changes.push({ field: "label", before: "—", after: `+ ${global} (new label)` });
            row.issues.push(issue(`${brand.name}: label “${global}” will be created`, true));
          } else if (choice === "skip") {
            row.issues.push(issue(`${brand.name}: label “${global}” skipped`, true));
          } else {
            row.issues.push(
              issue(`${brand.name}: no label for “${global}”`, false, [
                { id: "create", label: `Create “${global}” on ${brand.name}` },
                { id: "skip", label: `Skip this label on ${brand.name}` },
              ]),
            );
          }
        }
        for (const labelId of draft.labels.remove) {
          const index = next.labels.indexOf(labelId);
          if (index < 0) continue;
          next.labels.splice(index, 1);
          delete next.labelExpiry[labelId];
          row.changes.push({ field: "label", before: `− ${brand.labelMap[labelId] ?? labelName(labelId)}`, after: "—" });
        }
      }

      // ---- Image --------------------------------------------------------
      if (draft.image.enabled && draft.image.value !== undefined) {
        const target = draft.image.value;
        if (next.image !== target) {
          const previous = next.image;
          // A new artwork keeps brand-specific images unless the operator says otherwise.
          if (previous && target !== null && !draft.image.overwriteLocal) {
            row.notes.push(`${brand.name} keeps its own image`);
          } else {
            next.image = target;
            row.changes.push({ field: "image", before: imageLabel(previous), after: imageLabel(target) });
          }
        }
      }

      // ---- Position (one game at a time) ---------------------------------
      if (draft.position.enabled && !multi && !deactivating) {
        if (!willBeActive) {
          const id = `${key}|inactive`;
          const choice = draft.resolutions[id];
          const issue = (message: string, resolved: boolean, options?: Issue["options"]): Issue => ({
            id,
            kind: "inactive",
            severity: "warning",
            brandName: brand.name,
            gameTitle: game.title,
            message,
            resolved,
            options,
          });
          if (choice === "activate" && allowed) {
            next.active = true;
            willBeActive = true;
            work.push(game.id);
            row.changes.push({ field: "status", before: "Inactive", after: "Active" });
            row.issues.push(issue(`${brand.name}: the game was switched off — it is switched on so the position can be set`, true));
          } else if (choice === "skip") {
            row.issues.push(issue(`${brand.name}: position skipped, the game stays switched off`, true));
          } else {
            const options = allowed
              ? [
                  { id: "activate", label: `Also switch on for ${brand.name}` },
                  { id: "skip", label: `Skip position for ${brand.name}` },
                ]
              : [{ id: "skip", label: `Skip position for ${brand.name}` }];
            row.issues.push(issue(`${brand.name}: the game is switched off, so its lobby position can't be changed`, false, options));
          }
        }

        if (willBeActive) {
          const current = work.indexOf(game.id);
          const last = work.length - 1;
          let target = current;
          if (draft.position.action === "top") target = 0;
          else if (draft.position.action === "up") target = Math.max(0, current - 1);
          else if (draft.position.action === "down") target = Math.min(last, current + 1);
          else target = clamp(Number.isFinite(draft.position.value) ? Math.round(draft.position.value) : 1, 1, work.length) - 1;

          if (target !== current) {
            // Games that would have to move to make room for this one.
            const blockers = work
              .slice(Math.min(current, target), Math.max(current, target) + 1)
              .filter((id) => id !== game.id && state.states[stateKey(id, brandId)].pinned);
            const id = `${key}|pinned`;
            const choice = draft.resolutions[id];
            const names = quoted(blockers.map(title));
            const issue = (message: string, resolved: boolean, options?: Issue["options"]): Issue => ({
              id,
              kind: "pinned",
              severity: "warning",
              brandName: brand.name,
              gameTitle: game.title,
              message,
              resolved,
              options,
            });
            const positionChange = (to: number) => row.changes.push({ field: "position", before: `#${current + 1}`, after: `#${to + 1}` });
            // First free slot below the pinned games.
            const below = blockers.length > 0 ? Math.max(...blockers.map((blocker) => work.indexOf(blocker))) + 1 : target;

            if (blockers.length === 0) {
              move(work, game.id, target);
              positionChange(target);
            } else if (choice === "skip") {
              row.issues.push(issue(`${brand.name}: position left unchanged`, true));
            } else if (choice === "replace") {
              for (const blocker of blockers) {
                const blockerState = touch(blocker);
                blockerState.pinned = false;
                delete blockerState.pinnedUntil;
              }
              move(work, game.id, target);
              positionChange(target);
              row.notes.push(`${brand.name}: ${names} unpinned and moved ${target < current ? "down" : "up"}`);
              row.issues.push(issue(`${brand.name}: ${names} replaced`, true));
            } else if (choice === "below" && target < current) {
              if (below !== current) {
                move(work, game.id, below);
                positionChange(below);
              }
              row.issues.push(issue(`${brand.name}: placed at #${below + 1}, below the pinned game`, true));
            } else {
              const firstBlocker = state.states[stateKey(blockers[0], brandId)];
              const until = firstBlocker.pinnedUntil ? ` until ${formatDate(firstBlocker.pinnedUntil)}` : "";
              const options = [
                ...(target < current ? [{ id: "below", label: `Place at #${below + 1}, below the pinned game` }] : []),
                { id: "replace", label: `Replace: unpin ${names} and move ${target < current ? "down" : "up"}` },
                { id: "skip", label: `Leave position unchanged on ${brand.name}` },
              ];
              row.issues.push(issue(`${brand.name}: #${work.indexOf(blockers[0]) + 1} is taken by pinned ${names}${until}`, false, options));
            }
          }

          if (draft.position.pin && !next.pinned) {
            next.pinned = true;
            next.pinnedUntil = draft.position.pinUntil || undefined;
            row.changes.push({
              field: "pin",
              before: "Not pinned",
              after: draft.position.pinUntil ? `Pinned until ${formatDate(draft.position.pinUntil)}` : "Pinned",
            });
          }
        }
      }

      // ---- Pin / unpin without moving (quick action on an active game) ----
      if (!draft.position.enabled && draft.pin.enabled && willBeActive && next.pinned !== draft.pin.value) {
        const wasPinned = next.pinned;
        const wasUntil = next.pinnedUntil;
        next.pinned = draft.pin.value;
        if (!draft.pin.value) delete next.pinnedUntil;
        row.changes.push({
          field: "pin",
          before: wasPinned ? (wasUntil ? `Pinned until ${formatDate(wasUntil)}` : "Pinned") : "Not pinned",
          after: draft.pin.value ? "Pinned" : "Not pinned",
        });
      }
    }

    // Keep only the games that really change.
    const statesAfter: Record<string, GameBrandState> = {};
    for (const [gameId, after] of Object.entries(working)) {
      const before = state.states[stateKey(gameId, brandId)];
      if (JSON.stringify(after) !== JSON.stringify(before)) statesAfter[gameId] = after;
    }
    for (const row of brandRows) {
      if (row.apply && statesAfter[row.gameId]) row.after = statesAfter[row.gameId];
    }
    planBrands.push({ brandId, rows: brandRows, orderBefore, orderAfter: work, statesAfter });
    rows.push(...brandRows);
  }

  const changed = rows.filter((row) => row.apply && row.changes.length > 0);
  return {
    scopeIds: scope,
    brands: planBrands,
    rows,
    changed,
    ready: changed.filter((row) => row.issues.every((issue) => issue.resolved)),
    pending: rows.flatMap((row) => row.issues.filter((issue) => !issue.resolved)),
    skipped: rows.filter((row) => !row.apply),
    brandCount: new Set(changed.map((row) => row.brandId)).size,
  };
}

/* --------------------------------------------------------------------------
 * Applying a plan, reverting and syncing
 * ------------------------------------------------------------------------ */

interface ApplyMeta {
  id: string;
  at: string;
  operatorId: string;
  action: string;
  kinds: string[];
  comment?: string;
  scopeLabel: string;
}

/** Applies a checked plan and puts a new entry on top of History (brands start as "pending"). */
export function applyPlan(state: PanelState, plan: Plan, meta: ApplyMeta): PanelState {
  const states = { ...state.states };
  const orders = { ...state.orders };
  let brands = state.brands;
  const entryBrands: HistoryBrand[] = [];
  const skipped = plan.skipped.map((row) => ({ brandId: row.brandId, gameId: row.gameId, reason: row.blocked ?? "Skipped" }));

  for (const group of plan.brands) {
    const changedRows = group.rows.filter((row) => row.apply && row.changes.length > 0);
    if (changedRows.length === 0) continue;

    const statesBefore: Record<string, GameBrandState> = {};
    for (const gameId of Object.keys(group.statesAfter)) statesBefore[gameId] = state.states[stateKey(gameId, group.brandId)];
    orders[group.brandId] = group.orderAfter;
    for (const [gameId, after] of Object.entries(group.statesAfter)) states[stateKey(gameId, group.brandId)] = after;

    const created = changedRows.flatMap((row) => row.createLabels);
    if (created.length > 0) {
      brands = brands.map((brand) =>
        brand.id === group.brandId
          ? { ...brand, labelMap: { ...brand.labelMap, ...Object.fromEntries(created.map((labelId) => [labelId, labelName(labelId)])) } }
          : brand,
      );
    }

    entryBrands.push({
      brandId: group.brandId,
      changes: changedRows.map((row) => ({ gameId: row.gameId, items: row.changes })),
      statesBefore,
      statesAfter: group.statesAfter,
      orderBefore: group.orderBefore,
      orderAfter: group.orderAfter,
      sync: "pending",
    });
  }

  const entry: HistoryEntry = {
    id: meta.id,
    at: meta.at,
    operatorId: meta.operatorId,
    action: meta.action,
    kinds: meta.kinds,
    comment: meta.comment,
    gameIds: [...new Set(plan.rows.map((row) => row.gameId))],
    scopeLabel: meta.scopeLabel,
    brands: entryBrands,
    skipped,
  };

  return { ...state, brands, states, orders, history: [entry, ...state.history], seq: state.seq + 1 };
}

function diffChanges(gameId: string, before: GameBrandState, after: GameBrandState, orderBefore: string[], orderAfter: string[]): Change[] {
  const items: Change[] = [];
  if (before.active !== after.active) {
    items.push({ field: "status", before: before.active ? "Active" : "Inactive", after: after.active ? "Active" : "Inactive" });
  }
  const positionBefore = orderBefore.indexOf(gameId) + 1;
  const positionAfter = orderAfter.indexOf(gameId) + 1;
  if (positionAfter > 0 && positionBefore !== positionAfter) {
    items.push({ field: "position", before: positionBefore > 0 ? `#${positionBefore}` : "—", after: `#${positionAfter}` });
  }
  if (before.pinned !== after.pinned) {
    const pinnedText = (state: GameBrandState) => (state.pinned ? (state.pinnedUntil ? `Pinned until ${formatDate(state.pinnedUntil)}` : "Pinned") : "Not pinned");
    items.push({ field: "pin", before: pinnedText(before), after: pinnedText(after) });
  }
  for (const labelId of after.labels) {
    if (!before.labels.includes(labelId)) items.push({ field: "label", before: "—", after: `+ ${labelName(labelId)}` });
  }
  for (const labelId of before.labels) {
    if (!after.labels.includes(labelId)) items.push({ field: "label", before: `− ${labelName(labelId)}`, after: "—" });
  }
  if (before.image !== after.image) {
    items.push({ field: "image", before: imageLabel(before.image), after: imageLabel(after.image) });
  }
  return items;
}

/**
 * Undoes an entry: every game it touched gets its previous settings back and
 * returns to its previous place in the lobby order. Later changes to other games are kept.
 */
export function revertEntry(state: PanelState, entry: HistoryEntry, operator: Operator, newId: string, at: string): PanelState | null {
  if (publishDenial(operator, entry.brands.length) || !canAccessHistoryEntry(state, operator, entry)) return null;

  const states = { ...state.states };
  const orders = { ...state.orders };
  const entryBrands: HistoryBrand[] = [];

  for (const item of entry.brands) {
    const orderNow = [...(orders[item.brandId] ?? state.orders[item.brandId] ?? [])];
    const orderBefore = [...orderNow];
    // Games this entry moved in the lobby order: position changes, activations and deactivations.
    const moved = [
      ...new Set(
        item.orderBefore
          .filter((gameId) => item.orderAfter.indexOf(gameId) !== item.orderBefore.indexOf(gameId))
          .concat(item.orderAfter.filter((gameId) => !item.orderBefore.includes(gameId))),
      ),
    ];
    const gameIds = [...new Set([...Object.keys(item.statesBefore), ...moved])];

    const statesBefore: Record<string, GameBrandState> = {};
    const statesAfter: Record<string, GameBrandState> = {};
    for (const gameId of gameIds) statesBefore[gameId] = state.states[stateKey(gameId, item.brandId)];

    // Restore the settings the entry overwrote.
    for (const [gameId, before] of Object.entries(item.statesBefore)) {
      states[stateKey(gameId, item.brandId)] = before;
      statesAfter[gameId] = before;
    }

    // Put every moved game back where it was, keeping games touched by later entries in place.
    for (const gameId of moved) remove(orderNow, gameId);
    const toRestore = moved
      .filter((gameId) => states[stateKey(gameId, item.brandId)].active)
      .sort((a, b) => item.orderBefore.indexOf(a) - item.orderBefore.indexOf(b));
    for (const gameId of toRestore) {
      orderNow.splice(clamp(item.orderBefore.indexOf(gameId), 0, orderNow.length), 0, gameId);
    }
    orders[item.brandId] = orderNow;

    entryBrands.push({
      brandId: item.brandId,
      changes: gameIds
        .map((gameId) => ({ gameId, items: diffChanges(gameId, statesBefore[gameId], statesAfter[gameId] ?? statesBefore[gameId], orderBefore, orderNow) }))
        .filter((change) => change.items.length > 0),
      statesBefore,
      statesAfter,
      orderBefore,
      orderAfter: orderNow,
      sync: "pending",
    });
  }

  const newEntry: HistoryEntry = {
    id: newId,
    at,
    operatorId: operator.id,
    action: `Reverted: ${entry.action}`,
    kinds: ["revert"],
    comment: `Undoes change #${entry.id}`,
    gameIds: entry.gameIds,
    scopeLabel: entry.scopeLabel,
    brands: entryBrands,
    skipped: [],
    revertOf: entry.id,
  };

  return { ...state, states, orders, history: [newEntry, ...state.history], seq: state.seq + 1 };
}

/** Puts the failed brands of an entry back to "pending" so they can be retried. */
export function startRetry(state: PanelState, entryId: string, operator: Operator): PanelState {
  const entry = state.history.find((item) => item.id === entryId);
  if (!entry) return state;
  const retryable = entry.brands.filter((item) => {
    const brand = state.brands.find((candidate) => candidate.id === item.brandId);
    return item.sync === "failed" && brand !== undefined && operatorCanAccess(operator, brand);
  });
  if (publishDenial(operator, retryable.length)) return state;
  const retryableIds = new Set(retryable.map((item) => item.brandId));
  let changed = false;
  const history = state.history.map((entry) => {
    if (entry.id !== entryId) return entry;
    const brands = entry.brands.map((item) => {
      if (!retryableIds.has(item.brandId)) return item;
      changed = true;
      return { ...item, sync: "pending" as const, error: undefined };
    });
    return { ...entry, brands };
  });
  return changed ? { ...state, history } : state;
}

/** Records the platform's answer for one brand of an entry. */
export function markSync(state: PanelState, entryId: string, brandId: string, ok: boolean): PanelState {
  let failed = false;
  const history = state.history.map((entry) => {
    if (entry.id !== entryId) return entry;
    const brands = entry.brands.map((item) => {
      if (item.brandId !== brandId || item.sync !== "pending") return item;
      if (ok) return { ...item, sync: "synced" as const };
      failed = true;
      return { ...item, sync: "failed" as const, error: "Timeout: the platform didn't answer in 30 s" };
    });
    return { ...entry, brands };
  });
  return failed ? { ...state, history, flakyUsed: { ...state.flakyUsed, [brandId]: true } } : { ...state, history };
}

/* --------------------------------------------------------------------------
 * History helpers
 * ------------------------------------------------------------------------ */

export function entryStatus(entry: HistoryEntry): { tone: "green" | "amber" | "red" | "blue"; label: string } {
  const total = entry.brands.length;
  const pending = entry.brands.filter((item) => item.sync === "pending").length;
  const failed = entry.brands.filter((item) => item.sync === "failed").length;
  if (pending > 0) return { tone: "blue", label: `Syncing ${total - pending} of ${total}…` };
  if (failed === total && total > 0) return { tone: "red", label: `Failed on ${total} ${plural(total, "brand")}` };
  if (failed > 0) return { tone: "amber", label: `Partial: ${total - failed} synced, ${failed} failed` };
  return { tone: "green", label: total > 0 ? `Synced (${total})` : "Nothing to sync" };
}

/** Newest change per game, to show "Updated" in the games list. */
export function lastChangePerGame(history: HistoryEntry[]): Record<string, HistoryEntry> {
  const result: Record<string, HistoryEntry> = {};
  for (const entry of history) {
    for (const gameId of entry.gameIds) {
      if (!result[gameId]) result[gameId] = entry;
    }
  }
  return result;
}

export const isReverted = (state: PanelState, entry: HistoryEntry) => state.history.some((item) => item.revertOf === entry.id);
