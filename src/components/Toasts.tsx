"use client";

import { CircleAlert, CircleCheck, Info, X } from "lucide-react";
import { cn } from "@/lib/utils";

export interface ToastItem {
  id: number;
  tone: "success" | "error" | "info";
  message: string;
  action?: { label: string; run: () => void };
}

const ICONS = { success: CircleCheck, error: CircleAlert, info: Info };
const STYLES = {
  success: "border-emerald-500/40 text-emerald-300",
  error: "border-rose-500/40 text-rose-300",
  info: "border-sky-500/40 text-sky-300",
};

export function Toasts({ items, onDismiss }: { items: ToastItem[]; onDismiss: (id: number) => void }) {
  return (
    <div className="pointer-events-none fixed bottom-4 right-4 z-60 flex w-80 flex-col gap-2">
      {items.map((toast) => {
        const Icon = ICONS[toast.tone];
        return (
          <div
            key={toast.id}
            className={cn(
              "pointer-events-auto flex items-start gap-2.5 rounded-xl border bg-zinc-900 px-3.5 py-3 shadow-xl anim-fade-up",
              STYLES[toast.tone],
            )}
          >
            <Icon className="mt-0.5 h-4 w-4 shrink-0" />
            <div className="min-w-0 flex-1 text-xs text-zinc-200">{toast.message}</div>
            {toast.action && (
              <button
                type="button"
                onClick={() => {
                  toast.action!.run();
                  onDismiss(toast.id);
                }}
                className="shrink-0 text-xs font-medium text-emerald-300 underline-offset-2 hover:underline"
              >
                {toast.action.label}
              </button>
            )}
            <button type="button" onClick={() => onDismiss(toast.id)} className="shrink-0 text-zinc-500 hover:text-zinc-300">
              <X className="h-3.5 w-3.5" />
            </button>
          </div>
        );
      })}
    </div>
  );
}
