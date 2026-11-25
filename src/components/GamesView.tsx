"use client";

import { useState } from "react";
import { ChevronRight, Circle, CircleSlash, History as HistoryIcon, Lock, PenLine, Pin, Search, Shapes } from "lucide-react";
import { LABELS } from "@/lib/data";
import { brandsForOperator, currentOperator, canEdit, lastChangePerGame, scopeIds, timeAgo } from "@/lib/logic";
import { usePanel } from "@/lib/store";
import type { Game } from "@/lib/types";
import { cn, stateKey } from "@/lib/utils";
import { ScopeSelector } from "./ScopeSelector";
import { Art, Avatar, Btn, Chip, Select } from "./ui";

type StatusFilter = "all" | "active" | "inactive" | "mixed";
type SortMode = "curated" | "newest" | "title";

interface Props {
  selectedIds: string[];
  onToggleSelect: (gameId: string) => void;
  onOpenDetails: (gameId: string) => void;
  onOpenEdit: (gameIds: string[]) => void;
  detailsOpen: boolean;
}

export function GamesView({ selectedIds, onToggleSelect, onOpenDetails, onOpenEdit, detailsOpen }: Props) {
  const { state, setScope } = usePanel();
  const [query, setQuery] = useState("");
  const [provider, setProvider] = useState("all");
  const [status, setStatus] = useState<StatusFilter>("all");
  const [label, setLabel] = useState("all");
  const [sort, setSort] = useState<SortMode>("curated");

  if (!state) return null;
  const operator = currentOperator(state);
  const editable = canEdit(operator);
  const scoped = scopeIds(brandsForOperator(state, operator), state.scope);
  const lastChanges = lastChangePerGame(state.history);

  const games = (() => {
    const lowered = query.trim().toLowerCase();
    let list = state.games.filter((game) => {
      if (provider !== "all" && game.provider !== provider) return false;
      if (lowered && !`${game.title} ${game.provider}`.toLowerCase().includes(lowered)) return false;
      if (label !== "all" && !scoped.some((brandId) => state.states[stateKey(game.id, brandId)]?.labels.includes(label))) return false;
      if (status !== "all") {
        const activeCount = scoped.filter((brandId) => state.states[stateKey(game.id, brandId)]?.active).length;
        if (status === "active" && activeCount !== scoped.length) return false;
        if (status === "inactive" && activeCount !== 0) return false;
        if (status === "mixed" && (activeCount === 0 || activeCount === scoped.length)) return false;
      }
      return true;
    });
    if (sort === "newest") list = [...list].sort((a, b) => a.releasedDaysAgo - b.releasedDaysAgo);
    if (sort === "title") list = [...list].sort((a, b) => a.title.localeCompare(b.title));
    return list;
  })();

  return (
    <div className="flex min-w-0 flex-1 flex-col">
      {/* Toolbar */}
      <div className="flex flex-wrap items-center gap-2 border-b border-zinc-800 bg-zinc-950/60 px-4 py-2.5">
        <ScopeSelector value={state.scope} onChange={setScope} />

        <div className="relative">
          <Search className="pointer-events-none absolute left-2.5 top-1/2 h-3.5 w-3.5 -translate-y-1/2 text-zinc-500" />
          <input
            value={query}
            onChange={(event) => setQuery(event.target.value)}
            placeholder="Search games or providers…"
            className="h-9 w-56 rounded-lg border border-zinc-700 bg-zinc-900 pl-8 pr-2 text-sm text-zinc-200 placeholder:text-zinc-600 focus:border-zinc-500 focus:outline-none"
          />
        </div>

        <Select
          value={provider}
          onChange={setProvider}
          options={[{ value: "all", label: "All providers" }, ...[...new Set(state.games.map((game) => game.provider))].map((p) => ({ value: p, label: p }))]}
        />
        <Select
          value={status}
          onChange={(v) => setStatus(v as StatusFilter)}
          options={[
            { value: "all", label: "Any status" },
            { value: "active", label: "Active everywhere" },
            { value: "inactive", label: "Inactive" },
            { value: "mixed", label: "Mixed" },
          ]}
        />
        <Select
          value={label}
          onChange={setLabel}
          options={[{ value: "all", label: "Any label" }, ...LABELS.map((l) => ({ value: l.id, label: l.name }))]}
        />
        <Select
          value={sort}
          onChange={(v) => setSort(v as SortMode)}
          options={[
            { value: "curated", label: "Sort: default" },
            { value: "newest", label: "Sort: newest" },
            { value: "title", label: "Sort: A→Z" },
          ]}
        />

        <div className="ml-auto flex items-center gap-2">
          {selectedIds.length > 0 ? (
            <>
              <span className="text-xs text-zinc-400">
                {selectedIds.length} game{selectedIds.length > 1 ? "s" : ""} selected
              </span>
              <Btn variant="primary" onClick={() => onOpenEdit(selectedIds)} disabled={!editable}>
                <PenLine className="h-4 w-4" />
                Edit selected
              </Btn>
            </>
          ) : (
            editable && (
              <span className="hidden text-xs text-zinc-500 sm:block">Tick games to edit several at once, or open a game for single-brand actions</span>
            )
          )}
        </div>
      </div>

      {/* Scope summary line */}
      <div className="flex items-center gap-2 px-4 pt-3 text-xs text-zinc-500">
        <Shapes className="h-3.5 w-3.5" />
        Showing game states across <span className="font-medium text-zinc-300">{scoped.length}</span> target brand{scoped.length === 1 ? "" : "s"}
        {scoped.length !== state.brands.length && <span>· change the selection in the brands menu</span>}
        {!editable && (
          <span className="ml-auto inline-flex items-center gap-1 text-amber-300/80">
            <Lock className="h-3 w-3" /> View-only role — editing is disabled
          </span>
        )}
      </div>

      {/* Games list */}
      <div className="min-h-0 flex-1 overflow-y-auto px-4 pb-24 pt-2">
        {games.map((game) => (
          <GameRow
            key={game.id}
            game={game}
            scoped={scoped}
            selected={selectedIds.includes(game.id)}
            onToggleSelect={() => onToggleSelect(game.id)}
            onOpen={() => onOpenDetails(game.id)}
            editable={editable}
            dimmed={detailsOpen}
            lastChange={lastChanges[game.id]}
          />
        ))}
        {games.length === 0 && (
          <div className="flex flex-col items-center gap-2 py-20 text-center">
            <Search className="h-8 w-8 text-zinc-700" />
            <div className="text-sm text-zinc-400">No games match the current filters</div>
            <Btn
              variant="ghost"
              onClick={() => {
                setQuery("");
                setProvider("all");
                setStatus("all");
                setLabel("all");
              }}
            >
              Clear filters
            </Btn>
          </div>
        )}
      </div>
    </div>
  );
}

function GameRow({
  game,
  scoped,
  selected,
  onToggleSelect,
  onOpen,
  editable,
  dimmed,
  lastChange,
}: {
  game: Game;
  scoped: string[];
  selected: boolean;
  onToggleSelect: () => void;
  onOpen: () => void;
  editable: boolean;
  dimmed: boolean;
  lastChange?: { operatorId: string; at: string };
}) {
  const { state } = usePanel();
  if (!state) return null;

  const states = scoped.map((brandId) => ({ brandId, state: state.states[stateKey(game.id, brandId)] }));
  const activeCount = states.filter((item) => item.state?.active).length;
  const total = states.length;
  const pinnedCount = states.filter((item) => item.state?.pinned).length;
  // Labels the game carries on at least one target brand.
  const labelIds = [...new Set(states.flatMap((item) => item.state?.labels ?? []))];
  const operator = state.operators.find((item) => item.id === lastChange?.operatorId);
  const showDots = total <= 16 && total > 0;

  return (
    <div
      className={cn(
        "group mb-1.5 flex cursor-pointer items-center gap-3 rounded-xl border border-transparent px-3 py-2.5 transition-colors hover:border-zinc-800 hover:bg-zinc-900",
        selected && "border-emerald-500/40 bg-emerald-500/5 hover:border-emerald-500/50",
        dimmed && "pointer-events-none opacity-60",
      )}
      onClick={onOpen}
    >
      <input
        type="checkbox"
        checked={selected}
        disabled={!editable}
        onClick={(event) => event.stopPropagation()}
        onChange={onToggleSelect}
        className="h-4 w-4 shrink-0 cursor-pointer accent-emerald-500 disabled:cursor-not-allowed"
      />
      <Art icon={game.art.icon} from={game.art.from} to={game.art.to} />
      <div className="min-w-0 flex-1">
        <div className="flex items-center gap-2">
          <span className="truncate text-sm font-medium text-zinc-100">{game.title}</span>
          {game.releasedDaysAgo <= 7 && <Chip tone="emerald">just added</Chip>}
          {pinnedCount > 0 && (
            <span title={`Pinned on ${pinnedCount} brand${pinnedCount > 1 ? "s" : ""}`}>
              <Pin className="h-3.5 w-3.5 text-amber-300" />
            </span>
          )}
        </div>
        <div className="mt-0.5 flex items-center gap-1.5 text-xs text-zinc-500">
          <span>{game.provider}</span>
          <span>·</span>
          <span>{game.kind}</span>
          {labelIds.length > 0 && <span className="ml-1.5 flex gap-1">{labelIds.slice(0, 3).map((id) => <Chip key={id} tone={LABELS.find((l) => l.id === id)?.tone}>{LABELS.find((l) => l.id === id)?.name}</Chip>)}</span>}
        </div>
      </div>

      {/* Per-brand status: dots for small scopes, a fraction for 50 brands */}
      <div className="hidden items-center md:flex" onClick={(event) => event.stopPropagation()}>
        {showDots ? (
          <span className="flex items-center gap-1">
            {states.map((item) => (
              <span
                key={item.brandId}
                title={`${state.brands.find((b) => b.id === item.brandId)?.name}: ${item.state?.active ? "Active" : "Inactive"}`}
                className={cn("h-2 w-2 rounded-full", item.state?.active ? "bg-emerald-400" : "bg-zinc-700")}
              />
            ))}
          </span>
        ) : (
          <span className="flex items-center gap-1.5 text-xs">
            {activeCount === total ? (
              <span className="inline-flex items-center gap-1 text-emerald-300">
                <Circle className="h-2 w-2 fill-emerald-400 text-emerald-400" /> {activeCount}/{total}
              </span>
            ) : activeCount === 0 ? (
              <span className="inline-flex items-center gap-1 text-zinc-500">
                <CircleSlash className="h-3 w-3" /> 0/{total}
              </span>
            ) : (
              <span className="inline-flex items-center gap-1 text-amber-300">
                {activeCount}/{total} mixed
              </span>
            )}
          </span>
        )}
      </div>

      {lastChange && operator && (
        <span className="hidden w-44 shrink-0 items-center gap-1.5 text-[11px] text-zinc-500 xl:flex" title="Latest change touching this game">
          <Avatar name={operator.name} color={operator.color} size={18} />
          <span className="truncate">
            {operator.name.split(" ")[0]} · {timeAgo(lastChange.at)}
          </span>
          <HistoryIcon className="h-3 w-3 shrink-0 opacity-60" />
        </span>
      )}

      <ChevronRight className="h-4 w-4 shrink-0 text-zinc-600 transition-transform group-hover:translate-x-0.5" />
    </div>
  );
}
