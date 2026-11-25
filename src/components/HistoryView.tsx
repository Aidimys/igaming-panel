"use client";

import { useState } from "react";
import {
  ArrowUpDown,
  ChevronDown,
  Clock,
  Image as ImageIcon,
  MessageSquare,
  Pin,
  Power,
  RotateCcw,
  Tags,
  Undo2,
} from "lucide-react";
import {
  brandsForOperator,
  canAccessHistoryEntry,
  canEdit,
  currentOperator,
  entryStatus,
  formatDateTime,
  isReverted,
  plural,
  publishDenial,
  timeAgo,
} from "@/lib/logic";
import { usePanel } from "@/lib/store";
import type { HistoryEntry } from "@/lib/types";
import { cn } from "@/lib/utils";
import { fieldName } from "./PublishModal";
import { Art, Btn, Chip, IconBtn, SyncPill } from "./ui";

const KIND_META: Record<string, { label: string; icon: typeof Power }> = {
  status: { label: "Activation", icon: Power },
  position: { label: "Position", icon: ArrowUpDown },
  pin: { label: "Pin", icon: Pin },
  labels: { label: "Labels", icon: Tags },
  image: { label: "Image", icon: ImageIcon },
  revert: { label: "Revert", icon: Undo2 },
};

/** Who changed what, where and when — with one-click rollback and sync status per brand. */
export function HistoryView({ onRevert }: { onRevert: (entryId: string, action: string) => void }) {
  const { state } = usePanel();
  const [expanded, setExpanded] = useState<string | null>(null);
  if (!state) return null;
  const operator = currentOperator(state);
  const accessibleBrandIds = new Set(brandsForOperator(state, operator).map((brand) => brand.id));
  const visibleEntries = state.history.flatMap((entry) => {
    const brands = entry.brands.filter((item) => accessibleBrandIds.has(item.brandId));
    const skipped = entry.skipped.filter((item) => accessibleBrandIds.has(item.brandId));
    if (brands.length === 0 && skipped.length === 0) return [];

    const touchedBrands = new Set([...brands.map((item) => item.brandId), ...skipped.map((item) => item.brandId)]);
    const canSeeAllDetails =
      brands.length === entry.brands.length && skipped.length === entry.skipped.length;
    const visibleEntry: HistoryEntry = {
      ...entry,
      brands,
      skipped,
      scopeLabel: `${touchedBrands.size} accessible ${plural(touchedBrands.size, "brand")}`,
      comment: canSeeAllDetails ? entry.comment : undefined,
    };

    return [{
      entry: visibleEntry,
      canAccessAllBrands: canAccessHistoryEntry(state, operator, entry),
      originalBrandCount: entry.brands.length,
    }];
  });

  return (
    <div className="min-w-0 flex-1 overflow-y-auto px-4 pb-24 pt-4">
      <div className="mb-3 flex items-center justify-between">
        <div>
          <h2 className="text-base font-semibold text-zinc-100">Audit history</h2>
          <p className="text-xs text-zinc-500">Every change is logged with its operator, target brands and a before → after diff. Revert undoes a whole entry in one click.</p>
        </div>
      </div>

      {visibleEntries.map(({ entry, canAccessAllBrands, originalBrandCount }) => (
        <HistoryCard
          key={entry.id}
          entry={entry}
          canAccessAllBrands={canAccessAllBrands}
          originalBrandCount={originalBrandCount}
          expanded={expanded === entry.id}
          onExpand={() => setExpanded(expanded === entry.id ? null : entry.id)}
          onRevert={onRevert}
        />
      ))}

      {visibleEntries.length === 0 && (
        <div className="py-20 text-center text-sm text-zinc-500">No changes yet — publish something from the Games view.</div>
      )}
    </div>
  );
}

function HistoryCard({
  entry,
  canAccessAllBrands,
  originalBrandCount,
  expanded,
  onExpand,
  onRevert,
}: {
  entry: HistoryEntry;
  canAccessAllBrands: boolean;
  originalBrandCount: number;
  expanded: boolean;
  onExpand: () => void;
  onRevert: (entryId: string, action: string) => void;
}) {
  const { state, retry } = usePanel();
  if (!state) return null;

  const operator = state.operators.find((item) => item.id === entry.operatorId);
  const reverted = isReverted(state, entry);
  const status = entryStatus(entry);
  const current = currentOperator(state);
  const denial = publishDenial(current, originalBrandCount) ??
    (!canAccessAllBrands ? "This change also affects brands outside your access, so a full rollback isn't allowed." : null);
  const canRevert = !reverted && !denial && canEdit(current);
  const hasFailed = entry.brands.some((item) => item.sync === "failed");
  const retryDenial = publishDenial(current, entry.brands.filter((item) => item.sync === "failed").length);
  const isRevertEntry = entry.kinds.includes("revert");
  const totalChanges = entry.brands.reduce((sum, item) => sum + item.changes.length, 0);

  return (
    <div
      className={cn(
        "mb-2 overflow-hidden rounded-xl border bg-zinc-900/50",
        isRevertEntry ? "border-sky-500/25" : reverted ? "border-zinc-800 opacity-75" : "border-zinc-800",
      )}
    >
      <div className="flex cursor-pointer items-center gap-3 px-3.5 py-3" onClick={onExpand}>
        <span className="h-9 w-1 shrink-0 rounded-full" style={{ background: operator?.color ?? "#71717a" }} />
        <div className="min-w-0 flex-1">
          <div className="flex flex-wrap items-center gap-2">
            <span className="text-sm font-medium text-zinc-100">{entry.action}</span>
            {isRevertEntry && <Chip tone="sky">rollback</Chip>}
            {reverted && <Chip tone="zinc">reverted</Chip>}
            {entry.kinds.filter((kind) => kind !== "revert").map((kind) => {
              const meta = KIND_META[kind];
              if (!meta) return null;
              return (
                <span key={kind} className="inline-flex items-center gap-1 text-[11px] text-zinc-500">
                  <meta.icon className="h-3 w-3" />
                </span>
              );
            })}
          </div>
          <div className="mt-1 flex flex-wrap items-center gap-x-2 gap-y-0.5 text-[11px] text-zinc-500">
            <span className="font-medium text-zinc-400">{operator?.name}</span>
            <span>·</span>
            <span title={formatDateTime(entry.at)}>{timeAgo(entry.at)}</span>
            <span>·</span>
            <span>{entry.scopeLabel}</span>
            <span>·</span>
            <span>
              {totalChanges} {plural(totalChanges, "row")}
            </span>
            {entry.skipped.length > 0 && (
              <>
                <span>·</span>
                <span className="text-amber-300/80">{entry.skipped.length} skipped</span>
              </>
            )}
            {entry.comment && (
              <span className="inline-flex max-w-64 items-center gap-1 truncate text-zinc-400">
                <MessageSquare className="h-3 w-3 shrink-0" />
                {entry.comment}
              </span>
            )}
          </div>
        </div>

        <div className="flex shrink-0 items-center gap-2" onClick={(event) => event.stopPropagation()}>
          <SyncPill tone={status.tone} label={status.label} />
          {hasFailed && canEdit(current) && !retryDenial && (
            <Btn size="sm" variant="secondary" onClick={() => retry(entry.id)}>
              Retry failed
            </Btn>
          )}
          {canRevert ? (
            <Btn size="sm" variant="secondary" title={denial ?? "Undo this whole change"} onClick={() => onRevert(entry.id, entry.action)}>
              <RotateCcw className="h-3.5 w-3.5" />
              Revert
            </Btn>
          ) : (
            reverted && (
              <span className="inline-flex items-center gap-1 text-[11px] text-zinc-500">
                <Undo2 className="h-3 w-3" />
                undone
              </span>
            )
          )}
          <IconBtn label="Details" onClick={onExpand}>
            <ChevronDown className={cn("h-4 w-4 transition-transform", expanded && "rotate-180")} />
          </IconBtn>
        </div>
      </div>

      {expanded && (
        <div className="space-y-2 border-t border-zinc-800 px-3.5 py-3 anim-fade-in">
          {denial && !reverted && (
            <div className="rounded-lg border border-amber-500/30 bg-amber-500/10 px-3 py-2 text-[11px] text-amber-200">{denial}</div>
          )}
          {entry.brands.map((item) => {
            const brand = state.brands.find((b) => b.id === item.brandId);
            return (
              <div key={item.brandId} className="rounded-lg border border-zinc-800 bg-zinc-950/60">
                <div className="flex items-center gap-2 border-b border-zinc-800/70 px-2.5 py-1.5">
                  <span className="h-2 w-2 rounded-full" style={{ background: brand?.color }} />
                  <span className="text-xs font-medium text-zinc-300">{brand?.name}</span>
                  <span className="flex-1" />
                  {item.sync === "failed" && <span className="text-[11px] text-rose-300">{item.error}</span>}
                  <SyncPill
                    tone={item.sync === "synced" ? "green" : item.sync === "failed" ? "red" : "blue"}
                    label={item.sync === "synced" ? "on platform" : item.sync === "failed" ? "failed" : "sending…"}
                  />
                </div>
                <div className="divide-y divide-zinc-800/50">
                  {item.changes.map((change) => {
                    const game = state.games.find((g) => g.id === change.gameId);
                    return (
                      <div key={change.gameId} className="flex items-start gap-2 px-2.5 py-1.5">
                        {game && <Art icon={game.art.icon} from={game.art.from} to={game.art.to} size="sm" className="h-6 w-6 rounded-md" />}
                        <div className="min-w-0">
                          <div className="text-[11px] font-medium text-zinc-300">{game?.title}</div>
                          <div className="flex flex-wrap gap-x-3">
                            {change.items.map((changeItem, index) => (
                              <span key={index} className="text-[11px]">
                                <span className="text-zinc-500">{fieldName(changeItem.field)}: </span>
                                <span className="text-zinc-500 line-through decoration-rose-400/60">{changeItem.before}</span>
                                <span className="text-zinc-600"> → </span>
                                <span className="text-emerald-300">{changeItem.after}</span>
                              </span>
                            ))}
                          </div>
                        </div>
                      </div>
                    );
                  })}
                </div>
              </div>
            );
          })}

          {entry.skipped.length > 0 && (
            <div className="rounded-lg border border-amber-500/25 bg-amber-500/5 px-2.5 py-2">
              <div className="mb-1 text-[11px] font-semibold text-amber-300">Skipped</div>
              {entry.skipped.map((skip) => (
                <div key={`${skip.brandId}-${skip.gameId}`} className="text-[11px] text-zinc-400">
                  {state.brands.find((b) => b.id === skip.brandId)?.name} — {skip.reason}
                </div>
              ))}
            </div>
          )}

          <div className="flex items-center gap-1.5 pt-1 text-[10px] text-zinc-600">
            <Clock className="h-3 w-3" />
            {formatDateTime(entry.at)} · entry #{entry.id}
            {entry.revertOf && <> · rolls back #{entry.revertOf}</>}
          </div>
        </div>
      )}
    </div>
  );
}
