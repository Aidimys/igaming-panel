"use client";

import { createContext, useCallback, useContext, useEffect, useMemo, useRef, useState, type ReactNode } from "react";
import {
  applyPlan,
  computePlan,
  currentOperator,
  describeAction,
  draftKinds,
  historyScopeLabel,
  markSync,
  operatorCanAccess,
  revertEntry,
  startRetry,
} from "./logic";
import { createInitialState } from "./seed";
import type { Draft, PanelState, Scope } from "./types";

interface PanelApi {
  state: PanelState | null;
  setOperator: (id: string) => void;
  setScope: (scope: Scope) => void;
  setDataset: (size: 12 | 50) => void;
  setSimulateFailures: (on: boolean) => void;
  /** Back to the initial demo data */
  reset: () => void;
  /** Publishes the draft; returns the History entry id (null when there is nothing to publish) */
  publish: (draft: Draft) => string | null;
  retry: (entryId: string) => void;
  /** Reverts a History entry; returns false when it isn't allowed */
  revert: (entryId: string) => boolean;
}

const PanelContext = createContext<PanelApi | null>(null);

export function PanelProvider({ children }: { children: ReactNode }) {
  const [state, setState] = useState<PanelState | null>(null);
  // Latest state for event handlers; updated together with the React state.
  const latest = useRef<PanelState | null>(null);
  const timers = useRef<Set<ReturnType<typeof setTimeout>>>(new Set());
  const dataset = useRef<12 | 50>(12);

  const replaceState = useCallback((next: PanelState) => {
    timers.current.forEach((timer) => clearTimeout(timer));
    timers.current.clear();
    latest.current = next;
    setState(next);
  }, []);

  // Platforms answer with a short delay; one "unstable" platform times out on the first attempt.
  const scheduleSync = useCallback((entryId: string, brandIds: string[], snapshot: PanelState) => {
    brandIds.forEach((brandId, index) => {
      const brand = snapshot.brands.find((item) => item.id === brandId);
      const fails = Boolean(snapshot.simulateFailures && brand?.flaky && !snapshot.flakyUsed[brandId]);
      const timer = setTimeout(
        () => {
          timers.current.delete(timer);
          setState((prev) => (prev ? markSync(prev, entryId, brandId, !fails) : prev));
        },
        fails ? 1700 + index * 60 : 500 + index * 130,
      );
      timers.current.add(timer);
    });
  }, []);

  useEffect(() => {
    const initial = createInitialState(dataset.current);
    latest.current = initial;
    setState(initial);
    const pending = timers.current;
    return () => {
      pending.forEach((timer) => clearTimeout(timer));
      pending.clear();
    };
  }, []);

  useEffect(() => {
    latest.current = state;
  }, [state]);

  const setOperator = useCallback((id: string) => {
    setState((prev) => (prev ? { ...prev, operatorId: id, scope: "all" } : prev));
  }, []);

  const setScope = useCallback((scope: Scope) => {
    setState((prev) => (prev ? { ...prev, scope } : prev));
  }, []);

  const replaceDataset = useCallback(
    (size: 12 | 50) => {
      dataset.current = size;
      replaceState(createInitialState(size));
    },
    [replaceState],
  );

  const setDataset = useCallback((size: 12 | 50) => void replaceDataset(size), [replaceDataset]);
  const reset = useCallback(() => void replaceDataset(dataset.current), [replaceDataset]);

  const setSimulateFailures = useCallback((on: boolean) => {
    setState((prev) => (prev ? { ...prev, simulateFailures: on } : prev));
  }, []);

  const publish = useCallback(
    (draft: Draft): string | null => {
      const current = latest.current;
      if (!current) return null;
      const operator = currentOperator(current);
      const plan = computePlan(current, draft, operator);
      if (plan.brandCount === 0) return null;

      const id = `h${current.seq}`;
      const next = applyPlan(current, plan, {
        id,
        at: new Date().toISOString(),
        operatorId: operator.id,
        action: describeAction(draft),
        kinds: draftKinds(draft),
        comment: draft.comment.trim() || undefined,
        scopeLabel: historyScopeLabel(current, operator, draft.scope, plan.skipped.length),
      });
      replaceState(next);
      scheduleSync(id, next.history[0].brands.map((item) => item.brandId), next);
      return id;
    },
    [replaceState, scheduleSync],
  );

  const retry = useCallback(
    (entryId: string) => {
      const current = latest.current;
      if (!current) return;
      const operator = currentOperator(current);
      const entry = current.history.find((item) => item.id === entryId);
      const retryableIds = entry?.brands
        .filter((item) => {
          const brand = current.brands.find((candidate) => candidate.id === item.brandId);
          return item.sync === "failed" && brand !== undefined && operatorCanAccess(operator, brand);
        })
        .map((item) => item.brandId) ?? [];
      const next = startRetry(current, entryId, operator);
      if (next === current) return;
      replaceState(next);
      scheduleSync(entryId, retryableIds, next);
    },
    [replaceState, scheduleSync],
  );

  const revert = useCallback(
    (entryId: string): boolean => {
      const current = latest.current;
      if (!current) return false;
      const entry = current.history.find((item) => item.id === entryId);
      if (!entry) return false;
      const next = revertEntry(current, entry, currentOperator(current), `h${current.seq}`, new Date().toISOString());
      if (!next) return false;
      replaceState(next);
      scheduleSync(next.history[0].id, next.history[0].brands.map((item) => item.brandId), next);
      return true;
    },
    [replaceState, scheduleSync],
  );

  const api = useMemo<PanelApi>(
    () => ({ state, setOperator, setScope, setDataset, setSimulateFailures, reset, publish, retry, revert }),
    [state, setOperator, setScope, setDataset, setSimulateFailures, reset, publish, retry, revert],
  );

  return <PanelContext.Provider value={api}>{children}</PanelContext.Provider>;
}

export function usePanel(): PanelApi {
  const context = useContext(PanelContext);
  if (!context) throw new Error("usePanel must be used inside <PanelProvider>");
  return context;
}
