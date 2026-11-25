"use client";

import { useMemo, useState } from "react";
import { CircleAlert, CircleCheck, FileDiff, Lock, Send } from "lucide-react";
import { computePlan, currentOperator, plural, publishDenial } from "@/lib/logic";
import { usePanel } from "@/lib/store";
import type { Draft } from "@/lib/types";
import { Art, Btn, Chip, Modal } from "./ui";

export function PublishModal({ draft, onClose, onPublished }: {
  draft: Draft;
  onClose: () => void;
  onPublished: (entryId: string) => void;
}) {
  const { state, publish } = usePanel();
  // Decisions made inside the review stay here until publish or cancel.
  const [resolutions, setResolutions] = useState<Record<string, string>>(draft.resolutions);
  const fullDraft = useMemo<Draft>(() => ({ ...draft, resolutions }), [draft, resolutions]);
  const plan = useMemo(() => (state ? computePlan(state, fullDraft, currentOperator(state)) : null), [state, fullDraft]);
  if (!state || !plan) return null;

  const operator = currentOperator(state);
  const denial = publishDenial(operator, plan.brandCount);
  const games = state.games.filter((game) => draft.gameIds.includes(game.id));
  const changeCount = plan.changed.reduce((sum, row) => sum + row.changes.length, 0);
  const skippedBrands = [...new Set(plan.skipped.map((row) => row.brandId))];

  return (
    <Modal
      open
      onClose={onClose}
      width="max-w-3xl"
      title={
        <span className="flex items-center gap-2">
          <FileDiff className="h-5 w-5 text-emerald-400" />
          Review changes before publish
        </span>
      }
      subtitle={
        <span className="flex flex-wrap items-center gap-2">
          <span>
            {plan.pending.length > 0 && plan.brandCount === 0
              ? `${games.length} ${plural(games.length, "game")} · ${plan.pending.length} open ${plural(plan.pending.length, "decision")}`
              : `${games.length} ${plural(games.length, "game")} · ${plan.brandCount} ${plural(plan.brandCount, "brand")} · ${changeCount} ${plural(changeCount, "change")}`}
          </span>
          {skippedBrands.length > 0 && (
            <Chip tone="amber">
              {skippedBrands.length} {plural(skippedBrands.length, "brand")} skipped by license rules
            </Chip>
          )}
        </span>
      }
      footer={
        <div className="w-full">
          {denial && (
            <div className="mb-3 flex items-start gap-2 rounded-lg border border-amber-500/30 bg-amber-500/10 px-3 py-2 text-xs text-amber-200">
              <Lock className="mt-0.5 h-3.5 w-3.5 shrink-0" />
              {denial}
            </div>
          )}
          <div className="flex items-center justify-between gap-3">
            <span className="text-[11px] text-zinc-500">
              {plan.pending.length > 0
                ? `${plan.pending.length} open ${plural(plan.pending.length, "question")} must be resolved first`
                : "Every change is logged and can be reverted from History"}
            </span>
            <span className="flex gap-2">
              <Btn variant="ghost" onClick={onClose}>
                Cancel
              </Btn>
              <Btn
                variant="primary"
                disabled={plan.pending.length > 0 || Boolean(denial) || plan.changed.length === 0}
                onClick={() => {
                  const entryId = publish(fullDraft);
                  if (entryId) onPublished(entryId);
                }}
              >
                <Send className="h-4 w-4" />
                Publish to {plan.brandCount} {plural(plan.brandCount, "brand")}
              </Btn>
            </span>
          </div>
        </div>
      }
    >
      {/* Decisions */}
      {plan.pending.length > 0 && (
        <div className="mb-4 space-y-2">
          <div className="text-xs font-semibold uppercase tracking-wide text-amber-300">Needs your decision ({plan.pending.length})</div>
          {plan.pending.map((issue) => (
            <div key={issue.id} className="rounded-xl border border-amber-500/30 bg-amber-500/5 p-3">
              <div className="flex items-start gap-2">
                <CircleAlert className="mt-0.5 h-4 w-4 shrink-0 text-amber-300" />
                <div className="min-w-0 flex-1">
                  <div className="text-sm text-zinc-200">{issue.message}</div>
                  {issue.options && (
                    <div className="mt-2 flex flex-wrap gap-1.5">
                      {issue.options.map((option) => (
                        <Btn key={option.id} size="sm" variant="secondary" onClick={() => setResolutions((prev) => ({ ...prev, [issue.id]: option.id }))}>
                          {option.label}
                        </Btn>
                      ))}
                    </div>
                  )}
                </div>
              </div>
            </div>
          ))}
        </div>
      )}

      {plan.changed.length === 0 ? (
        <div className="py-10 text-center text-sm text-zinc-400">
          {plan.pending.length > 0
            ? "Resolve the open questions above to calculate the final changes."
            : "Nothing would change — the selected brands already match this configuration."}
        </div>
      ) : (
        <div className="space-y-3">
          {/* Brand groups */}
          {plan.brands
            .filter((group) => group.rows.some((row) => row.apply && row.changes.length > 0))
            .map((group) => {
              const brand = state.brands.find((b) => b.id === group.brandId)!;
              const rows = group.rows.filter((row) => row.apply && row.changes.length > 0);
              return (
                <div key={group.brandId} className="rounded-xl border border-zinc-800 bg-zinc-900/50">
                  <div className="flex items-center gap-2.5 border-b border-zinc-800 px-3 py-2.5">
                    <span className="h-2.5 w-2.5 rounded-full" style={{ background: brand.color }} />
                    <span className="text-sm font-medium text-zinc-200">{brand.name}</span>
                    <span className="text-[11px] text-zinc-500">{brand.region}</span>
                    <span className="ml-auto text-[11px] text-zinc-500">
                      {rows.length} {plural(rows.length, "row")} · {rows.reduce((sum, row) => sum + row.changes.length, 0)} changes
                    </span>
                  </div>
                  <div className="divide-y divide-zinc-800/60">
                    {rows.map((row) => {
                      const game = games.find((item) => item.id === row.gameId)!;
                      return (
                        <div key={row.gameId} className="flex items-start gap-2.5 px-3 py-2.5">
                          <Art icon={game.art.icon} from={game.art.from} to={game.art.to} size="sm" />
                          <div className="min-w-0 flex-1">
                            <div className="text-xs font-medium text-zinc-300">{game.title}</div>
                            <div className="mt-1 flex flex-wrap gap-x-3 gap-y-1">
                              {row.changes.map((change, index) => (
                                <span key={index} className="inline-flex items-center gap-1 text-[11px]">
                                  <span className="text-zinc-500">{fieldName(change.field)}:</span>
                                  <span className="text-zinc-500 line-through decoration-rose-400/60">{change.before}</span>
                                  <span className="text-zinc-600">→</span>
                                  <span className="text-emerald-300">{change.after}</span>
                                </span>
                              ))}
                            </div>
                            {row.notes.length > 0 && <div className="mt-1 text-[11px] italic text-sky-300/80">{row.notes.join(" · ")}</div>}
                            {row.issues
                              .filter((issue) => issue.resolved)
                              .map((issue) => (
                                <div key={issue.id} className="mt-1 flex items-center gap-1 text-[11px] text-emerald-300/80">
                                  <CircleCheck className="h-3 w-3" />
                                  {issue.options?.find((option) => option.id === draft.resolutions[issue.id])?.label ?? issue.message}
                                </div>
                              ))}
                          </div>
                        </div>
                      );
                    })}
                  </div>
                </div>
              );
            })}

          {/* License skips */}
          {plan.skipped.length > 0 && (
            <div className="rounded-xl border border-amber-500/30 bg-amber-500/5 p-3">
              <div className="mb-1.5 text-xs font-semibold text-amber-300">Skipped by rules (not applied)</div>
              <div className="space-y-1">
                {plan.skipped.map((row) => (
                  <div key={`${row.brandId}-${row.gameId}`} className="flex items-center gap-2 text-xs text-zinc-300">
                    <span className="font-medium">{state.brands.find((b) => b.id === row.brandId)?.name}</span>
                    <span className="text-zinc-500">{state.games.find((g) => g.id === row.gameId)?.title}</span>
                    <span className="text-[11px] text-amber-200/80">{row.blocked}</span>
                  </div>
                ))}
              </div>
              <div className="mt-1.5 text-[11px] text-zinc-500">
                Skips are recorded in History, so the client always sees why a brand was left out.
              </div>
            </div>
          )}

          {/* Comment */}
          {draft.comment.trim() && (
            <div className="rounded-xl border border-zinc-800 bg-zinc-900/50 px-3 py-2.5 text-xs text-zinc-400">
              <span className="text-zinc-500">Comment: </span>
              {draft.comment}
            </div>
          )}
        </div>
      )}
    </Modal>
  );
}

export function fieldName(field: string): string {
  return { status: "Status", position: "Position", pin: "Pin", label: "Label", image: "Image" }[field] ?? field;
}
