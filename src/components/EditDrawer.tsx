"use client";

import { useState } from "react";
import { ArrowUpToLine, CalendarClock, Image as ImageIcon, Pin, Tags, Trash2, Upload, X, Zap } from "lucide-react";
import { IMAGES, LABELS } from "@/lib/data";
import { brandsForOperator, canEdit, currentOperator, emptyDraft, scopeIds } from "@/lib/logic";
import { usePanel } from "@/lib/store";
import type { Draft } from "@/lib/types";
import { cn } from "@/lib/utils";
import { ScopeSelector } from "./ScopeSelector";
import { Art, Btn, Chip, FieldRow, IconBtn, Segmented, Toggle } from "./ui";

/**
 * Edit mode: one draft that can cover one game on one brand or many games on many
 * brands. Nothing is applied directly — "Review changes" opens the pre-flight summary.
 */
export function EditDrawer({ gameIds, onClose, onReview }: {
  gameIds: string[];
  onClose: () => void;
  onReview: (draft: Draft) => void;
}) {
  const { state } = usePanel();
  const [draft, setDraft] = useState<Draft>(() => emptyDraft(gameIds, []));
  if (!state) return null;

  const operator = currentOperator(state);
  const editable = canEdit(operator);
  if (!editable) return null;

  const available = brandsForOperator(state, operator);
  const targetCount = scopeIds(available, draft.scope).length;
  const games = state.games.filter((game) => draft.gameIds.includes(game.id));
  const singleGame = draft.gameIds.length === 1;
  const patch = (part: Partial<Draft>) => setDraft((prev) => ({ ...prev, ...part }));

  // Which local names the added labels map to on the target brands.
  const targetBrandIds = scopeIds(available, draft.scope);
  const labelHints = draft.labels.add.map((labelId) => {
    const global = LABELS.find((l) => l.id === labelId)?.name ?? labelId;
    const names = new Set<string>();
    const unmapped: string[] = [];
    for (const brandId of targetBrandIds) {
      const brand = state.brands.find((b) => b.id === brandId)!;
      const local = brand.labelMap[labelId];
      if (local == null) unmapped.push(brand.name);
      else if (local !== global) names.add(local);
    }
    return { labelId, global, aliases: [...names], unmapped };
  });

  const setImage = (value: string | null) => patch({ image: { ...draft.image, enabled: true, value } });

  return (
    <aside className="absolute inset-y-0 right-0 z-30 flex w-full max-w-md flex-col border-l border-zinc-800 bg-zinc-950 shadow-2xl anim-slide-in">
      <div className="flex items-center justify-between border-b border-zinc-800 px-4 py-3">
        <div>
          <h2 className="flex items-center gap-2 text-base font-semibold text-zinc-100">
            <Zap className="h-4 w-4 text-emerald-400" />
            Edit mode
          </h2>
          <p className="mt-0.5 text-xs text-zinc-500">
            {singleGame ? "Single game" : `${draft.gameIds.length} games`} · changes apply to selected brands at once
          </p>
        </div>
        <IconBtn label="Close" onClick={onClose}>
          <X className="h-4 w-4" />
        </IconBtn>
      </div>

      <div className="min-h-0 flex-1 space-y-3 overflow-y-auto px-4 py-3">
        {/* Games in scope of this edit */}
        <div className="rounded-xl border border-zinc-800 bg-zinc-900/60 p-3">
          <div className="mb-2 text-[11px] font-semibold uppercase tracking-wide text-zinc-500">Games to change</div>
          <div className="flex flex-wrap gap-1.5">
            {games.map((game) => (
              <span key={game.id} className="inline-flex items-center gap-1.5 rounded-lg bg-zinc-800 py-1 pl-1 pr-2">
                <Art icon={game.art.icon} from={game.art.from} to={game.art.to} size="sm" className="h-6 w-6 rounded-md" />
                <span className="text-xs text-zinc-200">{game.title}</span>
                {games.length > 1 && (
                  <button
                    type="button"
                    title="Remove from this edit"
                    onClick={() => {
                      const rest = draft.gameIds.filter((id) => id !== game.id);
                      if (rest.length > 0) patch({ gameIds: rest });
                    }}
                    className="text-zinc-500 hover:text-rose-300"
                  >
                    <X className="h-3 w-3" />
                  </button>
                )}
              </span>
            ))}
          </div>
          {!singleGame && (
            <p className="mt-2 text-[11px] leading-relaxed text-amber-300/70">
              Position changes work for one game at a time — remove extra games here or split the request.
            </p>
          )}
        </div>

        {/* Target brands */}
        <FieldRow title="Apply to brands" hint="A change can hit one brand, a group or all — each brand keeps its own settings unless you overwrite them here.">
          <div className="mt-2">
            <ScopeSelector value={draft.scope} onChange={(scope) => patch({ scope })} />
            <div className="mt-1.5 text-[11px] text-zinc-500">{targetCount} of {available.length} accessible brands in target</div>
          </div>
        </FieldRow>

        {/* Status */}
        <FieldRow
          title="Activation"
          right={
            <Toggle
              checked={draft.status.enabled}
              onChange={(v) => patch({ status: { ...draft.status, enabled: v } })}
              label="Enable status change"
            />
          }
        >
          {draft.status.enabled && (
            <div className="mt-2.5">
              <Segmented
                value={draft.status.value}
                onChange={(v) => patch({ status: { ...draft.status, value: v } })}
                options={[
                  { value: "active", label: "Activate" },
                  { value: "inactive", label: "Deactivate" },
                ]}
              />
              {draft.status.value === "inactive" && (
                <p className="mt-2 text-[11px] text-zinc-500">
                  Deactivated games disappear from the lobby but keep their settings, so they can be switched back on later.
                </p>
              )}
            </div>
          )}
        </FieldRow>

        {/* Position */}
        <FieldRow
          title="Position in lobby"
          right={
            <Toggle
              checked={draft.position.enabled}
              disabled={!singleGame}
              onChange={(v) => patch({ position: { ...draft.position, enabled: v } })}
              label="Enable position change"
            />
          }
          hint={singleGame ? "Pinning holds the place: the game won't be pushed down by everyday changes until the pin is removed or expires." : undefined}
        >
          {draft.position.enabled && singleGame && (
            <div className="mt-2.5 space-y-2.5">
              <Segmented
                value={draft.position.action}
                onChange={(v) => patch({ position: { ...draft.position, action: v } })}
                options={[
                  { value: "top", label: <span className="inline-flex items-center gap-1"><ArrowUpToLine className="h-3.5 w-3.5" />Top</span> },
                  { value: "up", label: "Up" },
                  { value: "down", label: "Down" },
                  { value: "exact", label: "Exact #" },
                ]}
              />
              {draft.position.action === "exact" && (
                <input
                  type="number"
                  min={1}
                  value={draft.position.value}
                  onChange={(event) => patch({ position: { ...draft.position, value: Math.max(1, Number(event.target.value) || 1) } })}
                  className="h-8 w-24 rounded-lg border border-zinc-700 bg-zinc-950 px-2 text-sm text-zinc-200 focus:border-zinc-500 focus:outline-none"
                />
              )}
              <label className="flex items-center gap-2 text-xs text-zinc-300">
                <Toggle
                  checked={draft.position.pin}
                  onChange={(v) => patch({ position: { ...draft.position, pin: v } })}
                  label="Pin position"
                />
                <Pin className="h-3.5 w-3.5 text-amber-300" />
                Pin position
              </label>
              {draft.position.pin && (
                <label className="flex items-center gap-2 text-xs text-zinc-400">
                  <CalendarClock className="h-3.5 w-3.5 text-zinc-500" />
                  Auto-unpin
                  <input
                    type="date"
                    value={draft.position.pinUntil}
                    onChange={(event) => patch({ position: { ...draft.position, pinUntil: event.target.value } })}
                    className="h-8 rounded-lg border border-zinc-700 bg-zinc-950 px-2 text-xs text-zinc-200 focus:border-zinc-500 focus:outline-none"
                  />
                  <span className="text-[11px] text-zinc-600">optional</span>
                </label>
              )}
            </div>
          )}
        </FieldRow>

        {/* Labels */}
        <FieldRow
          title="Labels"
          right={<Toggle checked={draft.labels.enabled} onChange={(v) => patch({ labels: { ...draft.labels, enabled: v } })} label="Enable label change" />}
        >
          {draft.labels.enabled && (
            <div className="mt-2.5 space-y-2.5">
              <div className="flex flex-wrap gap-1.5">
                {LABELS.filter((label) => !draft.labels.add.includes(label.id)).map((label) => (
                  <button key={label.id} type="button" onClick={() => patch({ labels: { ...draft.labels, add: [...draft.labels.add, label.id] } })}>
                    <Chip tone={label.tone} className="border border-dashed border-current/40 opacity-80 hover:opacity-100">
                      + {label.name}
                    </Chip>
                  </button>
                ))}
              </div>
              {(draft.labels.add.length > 0 || draft.labels.remove.length > 0) && (
                <div className="space-y-1.5 rounded-lg bg-zinc-950 p-2">
                  {draft.labels.add.map((labelId) => {
                    const label = LABELS.find((l) => l.id === labelId)!;
                    return (
                      <div key={labelId} className="flex items-center justify-between gap-2">
                        <span className="flex items-center gap-1.5 text-xs text-zinc-300">
                          <Tags className="h-3.5 w-3.5 text-emerald-400" />
                          add <Chip tone={label.tone}>{label.name}</Chip>
                        </span>
                        <button type="button" onClick={() => patch({ labels: { ...draft.labels, add: draft.labels.add.filter((id) => id !== labelId) } })} className="text-zinc-500 hover:text-rose-300">
                          <Trash2 className="h-3.5 w-3.5" />
                        </button>
                      </div>
                    );
                  })}
                  {draft.labels.remove.map((labelId) => {
                    const label = LABELS.find((l) => l.id === labelId)!;
                    return (
                      <div key={labelId} className="flex items-center justify-between gap-2">
                        <span className="flex items-center gap-1.5 text-xs text-zinc-300">
                          <Trash2 className="h-3.5 w-3.5 text-rose-400" />
                          remove <Chip tone={label.tone}>{label.name}</Chip>
                        </span>
                        <button type="button" onClick={() => patch({ labels: { ...draft.labels, remove: draft.labels.remove.filter((id) => id !== labelId) } })} className="text-zinc-500 hover:text-rose-300">
                          <X className="h-3.5 w-3.5" />
                        </button>
                      </div>
                    );
                  })}
                </div>
              )}
              <div className="flex items-center gap-2 text-xs text-zinc-400">
                <span className="text-zinc-500">Auto-remove added labels after</span>
                <select
                  value={draft.labels.ttlDays ?? ""}
                  onChange={(event) => patch({ labels: { ...draft.labels, ttlDays: event.target.value ? Number(event.target.value) : null } })}
                  className="h-7 rounded-md border border-zinc-700 bg-zinc-950 px-1.5 text-xs text-zinc-200 focus:outline-none"
                >
                  <option value="">never</option>
                  <option value="7">7 days</option>
                  <option value="14">14 days</option>
                  <option value="30">30 days</option>
                </select>
                <span className="inline-flex items-center gap-1 text-[11px] text-zinc-600">
                  <CalendarClock className="h-3 w-3" />
                  stops forgotten “New” badges
                </span>
              </div>
              {labelHints.map((hint) => (
                <p key={hint.labelId} className="text-[11px] leading-relaxed text-zinc-500">
                  {hint.aliases.length > 0 && (
                    <span>
                      On target brands “{hint.global}” appears as <span className="text-zinc-300">{hint.aliases.map((a) => `“${a}”`).join(", ")}</span>
                      {hint.unmapped.length > 0 && "; "}
                    </span>
                  )}
                  {hint.unmapped.length > 0 && (
                    <span className="text-amber-300/80">
                      no equivalent on {hint.unmapped.join(", ")} — the panel will ask before publishing.
                    </span>
                  )}
                  {hint.aliases.length === 0 && hint.unmapped.length === 0 && <span>“{hint.global}” exists on every target brand.</span>}
                </p>
              ))}
            </div>
          )}
        </FieldRow>

        {/* Artwork */}
        <FieldRow
          title="Artwork"
          right={<Toggle checked={draft.image.enabled} onChange={(v) => patch({ image: { ...draft.image, enabled: v } })} label="Enable image change" />}
          hint="Uploading once pushes the image to every target brand. Brands with their own artwork keep it unless you tick the overwrite box."
        >
          {draft.image.enabled && (
            <div className="mt-2.5 space-y-2.5">
              <div className="grid grid-cols-2 gap-2">
                <button
                  type="button"
                  onClick={() => setImage(null)}
                  className={cn(
                    "flex items-center gap-2 rounded-lg border p-2 text-left text-xs transition-colors",
                    draft.image.value === null ? "border-emerald-400 bg-emerald-500/10 text-zinc-100" : "border-zinc-700 text-zinc-300 hover:border-zinc-500",
                  )}
                >
                  <ImageIcon className="h-4 w-4 text-zinc-500" />
                  Default artwork
                </button>
                {IMAGES.map((image) => (
                  <button
                    key={image.id}
                    type="button"
                    onClick={() => setImage(image.id)}
                    className={cn(
                      "flex items-center gap-2 rounded-lg border p-2 text-left text-xs transition-colors",
                      draft.image.value === image.id ? "border-emerald-400 bg-emerald-500/10 text-zinc-100" : "border-zinc-700 text-zinc-300 hover:border-zinc-500",
                    )}
                  >
                    <span className="h-6 w-9 shrink-0 rounded" style={{ backgroundImage: `linear-gradient(135deg, ${image.from}, ${image.to})` }} />
                    {image.name}
                  </button>
                ))}
                <button
                  type="button"
                  onClick={() => setImage("upload:demo-upload")}
                  className={cn(
                    "flex items-center gap-2 rounded-lg border border-dashed p-2 text-left text-xs transition-colors",
                    draft.image.value === "upload:demo-upload" ? "border-emerald-400 text-zinc-100" : "border-zinc-700 text-zinc-400 hover:border-zinc-500",
                  )}
                >
                  <Upload className="h-4 w-4" />
                  Upload file…
                </button>
              </div>
              {draft.image.value !== undefined && draft.image.value !== null && (
                <label className="flex items-center gap-2 text-xs text-zinc-300">
                  <Toggle
                    checked={draft.image.overwriteLocal}
                    onChange={(v) => patch({ image: { ...draft.image, overwriteLocal: v } })}
                    label="Overwrite brand-specific artwork"
                  />
                  also replace brand-specific artwork
                </label>
              )}
            </div>
          )}
        </FieldRow>

        {/* Comment */}
        <FieldRow title="Comment">
          <input
            value={draft.comment}
            onChange={(event) => patch({ comment: event.target.value })}
            placeholder="e.g. Provider request #4821 — lands in History"
            className="mt-2 h-9 w-full rounded-lg border border-zinc-700 bg-zinc-950 px-2.5 text-sm text-zinc-200 placeholder:text-zinc-600 focus:border-zinc-500 focus:outline-none"
          />
        </FieldRow>
      </div>

      <div className="flex items-center justify-between gap-3 border-t border-zinc-800 bg-zinc-950 px-4 py-3">
        <span className="text-[11px] text-zinc-500">Nothing is applied until you review the diff.</span>
        <Btn variant="primary" disabled={!targetCount} onClick={() => onReview(draft)}>
          Review changes →
        </Btn>
      </div>
    </aside>
  );
}
