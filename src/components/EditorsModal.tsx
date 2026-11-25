"use client";

import { Check, Eye, Pencil, ShieldCheck, UserCog } from "lucide-react";
import { brandsForOperator, currentOperator } from "@/lib/logic";
import { usePanel } from "@/lib/store";
import { Avatar, Btn, Chip, Modal } from "./ui";

const ROLE_CARDS = [
  {
    role: "Viewer",
    icon: Eye,
    tone: "text-sky-300",
    points: ["Sees every brand they have access to", "Can't change anything — the Edit button is hidden"],
  },
  {
    role: "Editor",
    icon: Pencil,
    tone: "text-amber-300",
    points: ["Edits games and publishes to one brand at a time", "Multi-brand publishes need a Publisher"],
  },
  {
    role: "Publisher",
    icon: UserCog,
    tone: "text-emerald-300",
    points: ["Full access including bulk changes to many brands", "The role the panel boots with for the demo"],
  },
] as const;

/** Operator permissions: who may view, edit or publish, and for which brands. */
export function EditorsModal({ onClose }: { onClose: () => void }) {
  const { state, setOperator } = usePanel();
  if (!state) return null;
  const current = currentOperator(state);

  return (
    <Modal
      open
      onClose={onClose}
      title={
        <span className="flex items-center gap-2">
          <ShieldCheck className="h-5 w-5 text-emerald-400" />
          Operator permissions
        </span>
      }
      subtitle="Roles are bound to brand groups, so an AM simply doesn't see brands outside their scope. Click “Work as” to switch the demo operator."
      width="max-w-3xl"
      footer={
        <div className="flex w-full items-center justify-between gap-3">
          <span className="text-[11px] text-zinc-500">Safe defaults: no brand is preselected for a change, and bulk actions always pass the pre-flight review.</span>
          <Btn variant="secondary" onClick={onClose}>
            Close
          </Btn>
        </div>
      }
    >
      <div className="mb-4 grid grid-cols-1 gap-2.5 sm:grid-cols-3">
        {ROLE_CARDS.map((card) => (
          <div key={card.role} className="rounded-xl border border-zinc-800 bg-zinc-900/50 p-3.5">
            <div className={`flex items-center gap-2 text-sm font-semibold ${card.tone}`}>
              <card.icon className="h-4 w-4" />
              {card.role}
            </div>
            <ul className="mt-2 space-y-1.5">
              {card.points.map((point) => (
                <li key={point} className="flex items-start gap-1.5 text-[11px] leading-relaxed text-zinc-400">
                  <Check className="mt-0.5 h-3 w-3 shrink-0 text-zinc-600" />
                  {point}
                </li>
              ))}
            </ul>
          </div>
        ))}
      </div>

      <div className="overflow-hidden rounded-xl border border-zinc-800">
        {state.operators.map((operator) => {
          const accessible = brandsForOperator(state, operator);
          return (
            <div key={operator.id} className="flex flex-wrap items-center gap-3 border-b border-zinc-800 px-3.5 py-3 last:border-b-0">
              <Avatar name={operator.name} color={operator.color} size={32} />
              <div className="min-w-0">
                <div className="flex items-center gap-2 text-sm text-zinc-100">
                  {operator.name}
                  {operator.id === current.id && <Chip tone="emerald">you</Chip>}
                </div>
                <div className="text-[11px] text-zinc-500">
                  Access: {operator.access === "all" ? "all brand groups" : operator.access.join(", ")} · {accessible.length} brands
                </div>
              </div>
              <Chip tone={operator.role === "Publisher" ? "emerald" : operator.role === "Editor" ? "amber" : "sky"} className="ml-auto">
                {operator.role}
              </Chip>
              <Btn size="sm" variant={operator.id === current.id ? "secondary" : "ghost"} disabled={operator.id === current.id} onClick={() => setOperator(operator.id)}>
                {operator.id === current.id ? "Current" : "Work as"}
              </Btn>
            </div>
          );
        })}
      </div>
    </Modal>
  );
}
