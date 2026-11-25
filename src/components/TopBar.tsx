"use client";

import { Check, ChevronDown, Grid2x2, History, Layers, RotateCcw, Users, Zap, ZapOff } from "lucide-react";
import { currentOperator } from "@/lib/logic";
import { usePanel } from "@/lib/store";
import { cn } from "@/lib/utils";
import { Avatar, Btn, IconBtn, Popover, Toggle } from "./ui";

export type View = "games" | "history";

/** Roles and access are configured in the Roles modal; switching operator shows how permissions change the UI. */
function OperatorSwitcher() {
  const { state, setOperator } = usePanel();
  if (!state) return null;
  const current = currentOperator(state);

  return (
    <Popover
      align="right"
      width="w-72"
      trigger={(open) => (
        <Btn variant="secondary">
          <Avatar name={current.name} color={current.color} />
          <span className="hidden text-left sm:block">
            <span className="block text-xs font-medium leading-3.5 text-zinc-100">{current.name}</span>
            <span className="block text-[10px] leading-3 text-zinc-400">{current.role}</span>
          </span>
          <ChevronDown className={cn("h-4 w-4 text-zinc-500 transition-transform", open && "rotate-180")} />
        </Btn>
      )}
    >
      {(close) => (
        <div className="p-1.5">
          <div className="px-2 py-1.5 text-[11px] font-semibold uppercase tracking-wide text-zinc-500">Work as</div>
          {state.operators.map((operator) => (
            <button
              key={operator.id}
              type="button"
              onClick={() => {
                setOperator(operator.id);
                close();
              }}
              className={cn(
                "flex w-full items-center gap-2.5 rounded-lg px-2 py-2 text-left transition-colors hover:bg-zinc-800",
                operator.id === current.id && "bg-zinc-800/70",
              )}
            >
              <Avatar name={operator.name} color={operator.color} />
              <span className="min-w-0 flex-1">
                <span className="block truncate text-sm text-zinc-200">{operator.name}</span>
                <span className="block truncate text-[11px] text-zinc-500">
                  {operator.role} · {operator.access === "all" ? "All groups" : operator.access.join(", ")}
                </span>
              </span>
              {operator.id === current.id && <Check className="h-4 w-4 text-emerald-400" />}
            </button>
          ))}
          <div className="mt-1 border-t border-zinc-800 px-2 pb-1 pt-2 text-[11px] leading-relaxed text-zinc-500">
            Roles define what an operator may publish. Viewers see everything but cannot edit.
          </div>
        </div>
      )}
    </Popover>
  );
}

export function TopBar({ view, onView, onOpenRoles }: { view: View; onView: (view: View) => void; onOpenRoles: () => void }) {
  const { state, setDataset, setSimulateFailures, reset } = usePanel();
  if (!state) return null;

  return (
    <header className="flex h-14 shrink-0 items-center gap-3 border-b border-zinc-800 bg-zinc-950/95 px-4">
      <div className="flex items-center gap-2.5">
        <span className="flex h-8 w-8 items-center justify-center rounded-lg bg-gradient-to-br from-emerald-400 to-teal-600 text-zinc-950">
          <Layers className="h-4.5 w-4.5" />
        </span>
        <div className="leading-tight">
          <div className="text-sm font-semibold text-zinc-100">Multi-Brand Content Panel</div>
          <div className="text-[10px] text-zinc-500">Games · Images · Ordering · Labels</div>
        </div>
      </div>

      <nav className="ml-4 flex items-center gap-1">
        {(
          [
            { id: "games", label: "Games", icon: Grid2x2 },
            { id: "history", label: "History", icon: History, badge: state.history.length },
          ] as const
        ).map((tab) => (
          <button
            key={tab.id}
            type="button"
            onClick={() => onView(tab.id)}
            className={cn(
              "inline-flex h-8 items-center gap-1.5 rounded-lg px-3 text-sm font-medium transition-colors",
              view === tab.id ? "bg-zinc-800 text-zinc-100" : "text-zinc-400 hover:bg-zinc-900 hover:text-zinc-200",
            )}
          >
            <tab.icon className="h-4 w-4" />
            {tab.label}
            {"badge" in tab && tab.badge > 0 && (
              <span className="rounded-full bg-zinc-700 px-1.5 text-[10px] font-semibold text-zinc-300">{tab.badge}</span>
            )}
          </button>
        ))}
      </nav>

      <div className="ml-auto flex items-center gap-1.5">
        <div
          className="mr-1 hidden items-center gap-2 rounded-lg border border-zinc-800 bg-zinc-900 px-2.5 py-1.5 md:flex"
          title="Simulates a platform timing out on the first attempt so the failure handling can be demonstrated"
        >
          {state.simulateFailures ? <Zap className="h-3.5 w-3.5 text-amber-400" /> : <ZapOff className="h-3.5 w-3.5 text-zinc-500" />}
          <span className="text-xs text-zinc-400">Simulate failures</span>
          <Toggle checked={state.simulateFailures} onChange={setSimulateFailures} label="Simulate failures" />
        </div>

        <div className="hidden items-center rounded-lg border border-zinc-800 bg-zinc-900 p-0.5 lg:flex" title="10 brands today, 50+ tomorrow — the panel stays the same">
          {([12, 50] as const).map((size) => (
            <button
              key={size}
              type="button"
              onClick={() => setDataset(size)}
              className={cn(
                "h-7 rounded-md px-2.5 text-xs font-medium transition-colors",
                state.dataset === size ? "bg-zinc-700 text-zinc-100" : "text-zinc-400 hover:text-zinc-200",
              )}
            >
              {size} brands
            </button>
          ))}
        </div>

        <IconBtn label="Reset demo data" onClick={reset}>
          <RotateCcw className="h-4 w-4" />
        </IconBtn>
        <Btn variant="secondary" onClick={onOpenRoles} title="Operator permissions">
          <Users className="h-4 w-4" />
          <span className="hidden sm:inline">Roles</span>
        </Btn>
        <OperatorSwitcher />
      </div>
    </header>
  );
}
