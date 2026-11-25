"use client";

import { useState } from "react";
import {
  ArrowDown,
  ArrowUp,
  ArrowUpToLine,
  CalendarDays,
  ChevronDown,
  Lock,
  Package,
  PenLine,
  Pin,
  PinOff,
  Plus,
  X,
} from "lucide-react";
import { IMAGES, LABELS } from "@/lib/data";
import { brandsForOperator, canEdit, currentOperator, emptyDraft, formatDate, scopeIds, timeAgo } from "@/lib/logic";
import { usePanel } from "@/lib/store";
import type { Brand, Draft, Game, GameBrandState } from "@/lib/types";
import { cn, stateKey } from "@/lib/utils";
import { Art, Btn, Chip, IconBtn, Select, Toggle } from "./ui";

/** Right-side panel with the per-brand breakdown of one game. */
export function GameDetails({ gameId, onClose, onOpenEdit, onQuickEdit }: {
  gameId: string;
  onClose: () => void;
  onOpenEdit: (gameIds: string[]) => void;
  onQuickEdit: (draft: Draft) => void;
}) {
  const { state } = usePanel();
  const [expanded, setExpanded] = useState<string | null>(null);
  if (!state) return null;

  const game = state.games.find((item) => item.id === gameId);
  if (!game) return null;

  const operator = currentOperator(state);
  const editable = canEdit(operator);
  const scoped = scopeIds(brandsForOperator(state, operator), state.scope);
  const brands = state.brands.filter((brand) => scoped.includes(brand.id));
  const activeCount = brands.filter((brand) => state.states[stateKey(game.id, brand.id)]?.active).length;

  return (
    <aside className="absolute inset-y-0 right-0 z-30 flex w-full max-w-md flex-col border-l border-zinc-800 bg-zinc-950 shadow-2xl anim-slide-in">
      <div className="flex items-start gap-3 border-b border-zinc-800 px-4 py-3.5">
        <Art icon={game.art.icon} from={game.art.from} to={game.art.to} size="lg" />
        <div className="min-w-0 flex-1">
          <h2 className="truncate text-base font-semibold text-zinc-100">{game.title}</h2>
          <div className="mt-0.5 flex flex-wrap items-center gap-x-2 gap-y-1 text-xs text-zinc-500">
            <span>{game.provider}</span>
            <span>·</span>
            <span>{game.kind}</span>
            <span className="inline-flex items-center gap-1">
              <CalendarDays className="h-3 w-3" />
              {game.releasedDaysAgo <= 1 ? "released today" : `${game.releasedDaysAgo} d in catalog`}
            </span>
          </div>
          <div className="mt-2 flex items-center gap-2">
            <Btn size="sm" variant="primary" disabled={!editable} onClick={() => onOpenEdit([game.id])}>
              <PenLine className="h-3.5 w-3.5" />
              Edit on {scoped.length > 1 ? `${scoped.length} brands` : "brand"}
            </Btn>
            {!editable && (
              <span className="inline-flex items-center gap-1 text-[11px] text-amber-300/80">
                <Lock className="h-3 w-3" /> view-only
              </span>
            )}
          </div>
        </div>
        <IconBtn label="Close" onClick={onClose}>
          <X className="h-4 w-4" />
        </IconBtn>
      </div>

      <div className="flex items-center justify-between border-b border-zinc-800 px-4 py-2 text-xs text-zinc-400">
        <span>
          {activeCount} of {brands.length} target brands show this game
        </span>
        <span className="text-zinc-600">states are per-brand</span>
      </div>

      <div className="min-h-0 flex-1 overflow-y-auto px-3 py-2">
        {brands.map((brand) => (
          <BrandRow
            key={brand.id}
            brand={brand}
            game={game}
            expanded={expanded === brand.id}
            onExpand={() => setExpanded(expanded === brand.id ? null : brand.id)}
            editable={editable}
            onQuickEdit={onQuickEdit}
          />
        ))}
      </div>
    </aside>
  );
}

function BrandRow({
  brand,
  game,
  expanded,
  onExpand,
  editable,
  onQuickEdit,
}: {
  brand: Brand;
  game: Game;
  expanded: boolean;
  onExpand: () => void;
  editable: boolean;
  onQuickEdit: (draft: Draft) => void;
}) {
  const { state } = usePanel();
  if (!state) return null;

  const key = stateKey(game.id, brand.id);
  const gameBrand: GameBrandState = state.states[key];
  const position = state.orders[brand.id]?.indexOf(game.id) ?? -1;
  const blocked = !brand.allowedProviders.includes(game.provider);
  const lastTouching = state.history.find((entry) => entry.brands.some((item) => item.brandId === brand.id && entry.gameIds.includes(game.id)));
  const lastOperator = state.operators.find((operator) => operator.id === lastTouching?.operatorId);

  const draft = (patch: Partial<Draft>): Draft => ({ ...emptyDraft([game.id], [brand.id]), ...patch });

  return (
    <div className="mb-1.5 rounded-xl border border-zinc-800 bg-zinc-900/50">
      <button type="button" onClick={onExpand} className="flex w-full items-center gap-2.5 px-3 py-2.5 text-left">
        <span className="h-2.5 w-2.5 shrink-0 rounded-full" style={{ background: brand.color }} />
        <span className="min-w-0 flex-1">
          <span className="block truncate text-sm font-medium text-zinc-200">{brand.name}</span>
          <span className="block truncate text-[11px] text-zinc-500">
            {brand.region} · {brand.platform}
          </span>
        </span>
        {blocked && <Chip tone="rose">license</Chip>}
        {position >= 0 && (
          <span className="inline-flex items-center gap-1 rounded-md bg-zinc-800 px-1.5 py-0.5 text-[11px] font-medium text-zinc-300">
            #{position + 1}
            {gameBrand.pinned && <Pin className="h-3 w-3 text-amber-300" />}
          </span>
        )}
        <Toggle
          checked={gameBrand.active}
          disabled={!editable || blocked || expanded}
          onChange={(next) =>
            onQuickEdit(draft({ status: { enabled: true, value: next ? "active" : "inactive" } }))
          }
          label={`${gameBrand.active ? "Deactivate" : "Activate"} on ${brand.name}`}
        />
        <ChevronDown className={cn("h-4 w-4 shrink-0 text-zinc-500 transition-transform", expanded && "rotate-180")} />
      </button>

      {expanded && (
        <div className="space-y-3 border-t border-zinc-800 px-3 py-3 anim-fade-in">
          {/* Position */}
          <div>
            <div className="mb-1.5 text-[11px] font-semibold uppercase tracking-wide text-zinc-500">Position in lobby</div>
            {position < 0 ? (
              <div className="text-xs text-zinc-500">Game is inactive — activate it first to manage its position.</div>
            ) : (
              <div className="flex items-center gap-1.5">
                <IconBtn
                  label="Move to top"
                  disabled={!editable}
                  onClick={() => onQuickEdit(draft({ position: { enabled: true, action: "top", value: 1, pin: false, pinUntil: "" } }))}
                >
                  <ArrowUpToLine className="h-4 w-4" />
                </IconBtn>
                <IconBtn
                  label="Move up"
                  disabled={!editable || position === 0}
                  onClick={() => onQuickEdit(draft({ position: { enabled: true, action: "up", value: 1, pin: false, pinUntil: "" } }))}
                >
                  <ArrowUp className="h-4 w-4" />
                </IconBtn>
                <IconBtn
                  label="Move down"
                  disabled={!editable}
                  onClick={() => onQuickEdit(draft({ position: { enabled: true, action: "down", value: 1, pin: false, pinUntil: "" } }))}
                >
                  <ArrowDown className="h-4 w-4" />
                </IconBtn>
                <span className="mx-1 text-xs text-zinc-400">#{position + 1}</span>
                <span className="flex-1" />
                <Btn
                  size="sm"
                  variant="ghost"
                  disabled={!editable}
                  onClick={() => onQuickEdit(draft({ pin: { enabled: true, value: !gameBrand.pinned } }))}
                  title={gameBrand.pinned ? "Unpin" : "Pin to hold the place"}
                >
                  {gameBrand.pinned ? <PinOff className="h-3.5 w-3.5" /> : <Pin className="h-3.5 w-3.5" />}
                  {gameBrand.pinned && gameBrand.pinnedUntil ? `until ${formatDate(gameBrand.pinnedUntil)}` : gameBrand.pinned ? "Unpin" : "Pin"}
                </Btn>
              </div>
            )}
          </div>

          {/* Labels */}
          <div>
            <div className="mb-1.5 text-[11px] font-semibold uppercase tracking-wide text-zinc-500">Labels</div>
            <div className="flex flex-wrap items-center gap-1.5">
              {gameBrand.labels.length === 0 && <span className="text-xs text-zinc-600">No labels</span>}
              {gameBrand.labels.map((labelId) => (
                <span key={labelId} className="group/chip inline-flex items-center gap-1">
                  <Chip tone={LABELS.find((l) => l.id === labelId)?.tone}>
                    {brand.labelMap[labelId] ?? LABELS.find((l) => l.id === labelId)?.name}
                  </Chip>
                  {editable && (
                    <button
                      type="button"
                      title={`Remove from ${brand.name}`}
                      className="text-zinc-600 hover:text-rose-300"
                      onClick={() => onQuickEdit(draft({ labels: { enabled: true, add: [], remove: [labelId], ttlDays: null } }))}
                    >
                      <X className="h-3 w-3" />
                    </button>
                  )}
                </span>
              ))}
              {editable && (
                <span className="relative inline-flex">
                  <details className="group/add">
                    <summary className="inline-flex cursor-pointer list-none items-center gap-1 rounded-md border border-dashed border-zinc-700 px-1.5 py-0.5 text-[11px] text-zinc-400 hover:border-zinc-500 hover:text-zinc-200">
                      <Plus className="h-3 w-3" /> add
                    </summary>
                    <div className="absolute bottom-full left-0 z-20 mb-1 w-44 rounded-lg border border-zinc-700 bg-zinc-900 p-1 shadow-xl">
                      {LABELS.filter((label) => !gameBrand.labels.includes(label.id)).map((label) => (
                        <button
                          key={label.id}
                          type="button"
                          className="flex w-full items-center justify-between rounded-md px-2 py-1.5 text-left text-xs text-zinc-300 hover:bg-zinc-800"
                          onClick={(event) => {
                            event.currentTarget.closest("details")?.removeAttribute("open");
                            onQuickEdit(draft({ labels: { enabled: true, add: [label.id], remove: [], ttlDays: null } }));
                          }}
                        >
                          {label.name}
                          <span className="text-[10px] text-zinc-500">as “{brand.labelMap[label.id] ?? "new label"}”</span>
                        </button>
                      ))}
                    </div>
                  </details>
                </span>
              )}
            </div>
          </div>

          {/* Artwork */}
          <div>
            <div className="mb-1.5 text-[11px] font-semibold uppercase tracking-wide text-zinc-500">Artwork</div>
            <div className="flex items-center gap-2">
              <Package className="h-4 w-4 text-zinc-600" />
              <Select
                value={gameBrand.image ?? "default"}
                onChange={(value) =>
                  onQuickEdit(
                    draft({ image: { enabled: true, value: value === "default" ? null : value, overwriteLocal: true } }),
                  )
                }
                options={[
                  { value: "default", label: "Default artwork" },
                  ...IMAGES.map((image) => ({ value: image.id, label: image.name })),
                  ...(gameBrand.image?.startsWith("upload:") ? [{ value: gameBrand.image, label: "Uploaded image" }] : []),
                ]}
                className="w-full [&_select]:w-full"
              />
            </div>
          </div>

          {/* Last touch */}
          {lastTouching && lastOperator && (
            <div className="border-t border-zinc-800 pt-2.5 text-[11px] text-zinc-500">
              Last change here: “{lastTouching.action}” · {lastOperator.name} · {timeAgo(lastTouching.at)}
              {gameBrand.labelExpiry[Object.keys(gameBrand.labelExpiry)[0]] && (
                <span> · label auto-removes on {formatDate(Object.values(gameBrand.labelExpiry)[0])}</span>
              )}
            </div>
          )}
        </div>
      )}
    </div>
  );
}
