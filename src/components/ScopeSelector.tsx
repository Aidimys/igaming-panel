"use client";

import { useState } from "react";
import { Check, ChevronDown, Layers, Search, CircleAlert } from "lucide-react";
import { brandGroups, scopeIds, scopeLabel, brandsForOperator, currentOperator } from "@/lib/logic";
import { usePanel } from "@/lib/store";
import type { Scope } from "@/lib/types";
import { cn } from "@/lib/utils";
import { Btn, Popover } from "./ui";

/**
 * Brand selection used both for the working filter in the General view and as
 * the target of a change in Edit mode. "All" always means "everything I can access",
 * so a new brand is covered automatically (scalability requirement).
 */
export function ScopeSelector({
  value,
  onChange,
  align = "left",
  triggerClassName,
}: {
  value: Scope;
  onChange: (scope: Scope) => void;
  align?: "left" | "right";
  triggerClassName?: string;
}) {
  const { state } = usePanel();
  const [query, setQuery] = useState("");
  if (!state) return null;

  const available = brandsForOperator(state, currentOperator(state));
  const selected = scopeIds(available, value);
  const groups = brandGroups(available);
  const lowered = query.trim().toLowerCase();

  const visible = groups
    .map((group) => ({ ...group, brands: group.ids.map((id) => available.find((brand) => brand.id === id)!).filter(Boolean) }))
    .filter((group) => !lowered || group.brands.some((brand) => brand.name.toLowerCase().includes(lowered) || group.name.toLowerCase().includes(lowered)));

  const toggle = (brandId: string) => {
    const next = new Set(value === "all" ? available.map((brand) => brand.id) : value);
    if (next.has(brandId)) next.delete(brandId);
    else next.add(brandId);
    // An explicit list keeps the operator's exact choice, even if it is "everything".
    onChange([...next]);
  };

  const toggleGroup = (ids: string[]) => {
    const next = new Set(value === "all" ? available.map((brand) => brand.id) : value);
    const allIn = ids.every((id) => next.has(id));
    for (const id of ids) {
      if (allIn) next.delete(id);
      else next.add(id);
    }
    onChange([...next]);
  };

  return (
    <Popover
      align={align}
      width="w-80"
      trigger={(open) => (
        <Btn variant="secondary" className={triggerClassName}>
          <Layers className="h-4 w-4 text-emerald-400" />
          <span className="max-w-44 truncate">{scopeLabel(available, value)}</span>
          <ChevronDown className={cn("h-4 w-4 text-zinc-500 transition-transform", open && "rotate-180")} />
        </Btn>
      )}
    >
      {() => (
        <div>
          <div className="border-b border-zinc-800 p-3">
            <div className="flex items-center justify-between gap-2">
              <div className="text-xs font-semibold uppercase tracking-wide text-zinc-400">Target brands</div>
              <div className="flex gap-1">
                <Btn size="sm" variant="ghost" onClick={() => onChange("all")}>
                  All ({available.length})
                </Btn>
                <Btn size="sm" variant="ghost" onClick={() => onChange([])}>
                  None
                </Btn>
              </div>
            </div>
            {available.length > 10 && (
              <div className="relative mt-2">
                <Search className="pointer-events-none absolute left-2.5 top-1/2 h-3.5 w-3.5 -translate-y-1/2 text-zinc-500" />
                <input
                  value={query}
                  onChange={(event) => setQuery(event.target.value)}
                  placeholder="Search brands…"
                  className="h-8 w-full rounded-lg border border-zinc-700 bg-zinc-950 pl-8 pr-2 text-sm text-zinc-200 placeholder:text-zinc-600 focus:border-zinc-500 focus:outline-none"
                />
              </div>
            )}
          </div>
          <div className="max-h-80 overflow-y-auto p-1.5">
            {visible.map((group) => {
              const allIn = group.ids.every((id) => selected.includes(id));
              return (
                <div key={group.name} className="mb-1">
                  <div className="flex items-center justify-between px-2 py-1">
                    <span className="text-[11px] font-semibold uppercase tracking-wide text-zinc-500">{group.name}</span>
                    <button type="button" onClick={() => toggleGroup(group.ids)} className="text-[11px] font-medium text-emerald-400 hover:text-emerald-300">
                      {allIn ? "clear" : "select all"}
                    </button>
                  </div>
                  {group.brands.map((brand) => {
                    const checked = selected.includes(brand.id);
                    return (
                      <button
                        key={brand.id}
                        type="button"
                        onClick={() => toggle(brand.id)}
                        className={cn(
                          "flex w-full items-center gap-2.5 rounded-lg px-2 py-1.5 text-left transition-colors hover:bg-zinc-800",
                          checked && "bg-zinc-800/70",
                        )}
                      >
                        <span
                          className={cn(
                            "flex h-4 w-4 shrink-0 items-center justify-center rounded border",
                            checked ? "border-emerald-400 bg-emerald-500 text-zinc-950" : "border-zinc-600",
                          )}
                        >
                          {checked && <Check className="h-3 w-3" />}
                        </span>
                        <span className="h-2 w-2 shrink-0 rounded-full" style={{ background: brand.color }} />
                        <span className="min-w-0 flex-1">
                          <span className="block truncate text-sm text-zinc-200">{brand.name}</span>
                          <span className="block truncate text-[11px] text-zinc-500">
                            {brand.region} · {brand.platform}
                          </span>
                        </span>
                        {brand.allowedProviders.length < 4 && (
                          <span
                            title={`License: no ${brand.allowedProviders.length < 4 ? missingProviders(brand.allowedProviders) : ""}`}
                            className="flex shrink-0 items-center gap-0.5 text-[10px] text-amber-400/80"
                          >
                            <CircleAlert className="h-3 w-3" />
                          </span>
                        )}
                      </button>
                    );
                  })}
                </div>
              );
            })}
            {visible.length === 0 && <div className="px-3 py-6 text-center text-sm text-zinc-500">Nothing found</div>}
          </div>
          <div className="border-t border-zinc-800 px-3 py-2 text-[11px] text-zinc-500">
            {selected.length === available.length ? "All brands selected" : `${selected.length} of ${available.length} brands selected`}
          </div>
        </div>
      )}
    </Popover>
  );
}

function missingProviders(allowed: string[]): string {
  const all = ["PlayNova", "ReelCraft", "GemStudio", "LuckyFish"];
  const missing = all.filter((provider) => !allowed.includes(provider));
  return missing.join(", ") + " restricted by license";
}
