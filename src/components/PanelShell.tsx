"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import { canAccessHistoryEntry, computePlan, currentOperator, publishDenial } from "@/lib/logic";
import { usePanel } from "@/lib/store";
import type { Draft } from "@/lib/types";
import { EditDrawer } from "./EditDrawer";
import { EditorsModal } from "./EditorsModal";
import { GameDetails } from "./GameDetails";
import { GamesView } from "./GamesView";
import { HistoryView } from "./HistoryView";
import { PublishModal } from "./PublishModal";
import { Toasts, type ToastItem } from "./Toasts";
import { TopBar, type View } from "./TopBar";

export default function PanelShell() {
  const { state, revert } = usePanel();
  const [view, setView] = useState<View>("games");
  const [detailsId, setDetailsId] = useState<string | null>(null);
  const [editTarget, setEditTarget] = useState<string[] | null>(null);
  const [publishDraft, setPublishDraft] = useState<Draft | null>(null);
  const [rolesOpen, setRolesOpen] = useState(false);
  const [selectedIds, setSelectedIds] = useState<string[]>([]);
  const [toasts, setToasts] = useState<ToastItem[]>([]);
  const toastSeq = useRef(0);

  const toast = useCallback((tone: ToastItem["tone"], message: string, action?: ToastItem["action"]) => {
    const id = ++toastSeq.current;
    setToasts((prev) => [...prev.slice(-3), { id, tone, message, action }]);
    setTimeout(() => setToasts((prev) => prev.filter((item) => item.id !== id)), 6500);
  }, []);

  const dismissToast = useCallback((id: number) => setToasts((prev) => prev.filter((item) => item.id !== id)), []);

  // Keyboard shortcut: Escape closes the topmost layer.
  useEffect(() => {
    const onKey = (event: KeyboardEvent) => {
      if (event.key !== "Escape") return;
      if (publishDraft || rolesOpen) return; // handled by Modal
      if (editTarget) setEditTarget(null);
      else if (detailsId) setDetailsId(null);
    };
    document.addEventListener("keydown", onKey);
    return () => document.removeEventListener("keydown", onKey);
  }, [publishDraft, rolesOpen, editTarget, detailsId]);

  if (!state) {
    return (
      <div className="flex h-screen items-center justify-center">
        <div className="text-sm text-zinc-500">Loading demo data…</div>
      </div>
    );
  }

  /** Opens the pre-flight review; a draft that changes nothing just reports why. */
  const openPublish = (draft: Draft) => {
    const plan = computePlan(state, draft, currentOperator(state));
    if (plan.brandCount === 0 && plan.pending.length === 0) {
      toast("info", "Nothing would change — the target brands already match this configuration.");
      return;
    }
    setPublishDraft(draft);
  };

  const handlePublished = (entryId: string) => {
    void entryId;
    setPublishDraft(null);
    setEditTarget(null);
    setDetailsId(null);
    setSelectedIds([]);
    toast("success", "Published — the change is rolling out to the platforms.", {
      label: "Open history",
      run: () => setView("history"),
    });
  };

  const handleRevert = (entryId: string, action: string) => {
    const entry = state.history.find((item) => item.id === entryId);
    const operator = currentOperator(state);
    const denial = entry
      ? publishDenial(operator, entry.brands.length) ??
        (!canAccessHistoryEntry(state, operator, entry) ? "This change affects brands outside your access." : null)
      : null;
    const ok = !denial && revert(entryId);
    toast(
      ok ? "success" : "error",
      ok
        ? `Reverted: ${action}. Previous settings are being restored on every affected brand.`
        : (denial ?? "This change can't be reverted."),
    );
  };

  const toggleSelect = (gameId: string) =>
    setSelectedIds((prev) => (prev.includes(gameId) ? prev.filter((id) => id !== gameId) : [...prev, gameId]));

  return (
    <div className="flex h-screen flex-col overflow-hidden">
      <TopBar view={view} onView={setView} onOpenRoles={() => setRolesOpen(true)} />

      <main className="relative flex min-h-0 flex-1">
        {view === "games" ? (
          <GamesView
            selectedIds={selectedIds}
            onToggleSelect={toggleSelect}
            onOpenDetails={(gameId) => {
              setDetailsId(gameId);
              setEditTarget(null);
            }}
            onOpenEdit={(gameIds) => {
              setEditTarget(gameIds);
              setDetailsId(null);
            }}
            detailsOpen={Boolean(editTarget)}
          />
        ) : (
          <HistoryView onRevert={handleRevert} />
        )}

        {detailsId && !editTarget && (
          <GameDetails
            gameId={detailsId}
            onClose={() => setDetailsId(null)}
            onOpenEdit={(gameIds) => {
              setEditTarget(gameIds);
              setSelectedIds([]);
            }}
            onQuickEdit={openPublish}
          />
        )}

        {editTarget && (
          <EditDrawer gameIds={editTarget} onClose={() => setEditTarget(null)} onReview={openPublish} />
        )}
      </main>

      {publishDraft && <PublishModal draft={publishDraft} onClose={() => setPublishDraft(null)} onPublished={handlePublished} />}
      {rolesOpen && <EditorsModal onClose={() => setRolesOpen(false)} />}
      <Toasts items={toasts} onDismiss={dismissToast} />
    </div>
  );
}
