"use client";

"use client";

import { useEffect, useRef, useState, type ReactNode } from "react";
import { Anchor, Candy, Cherry, Clover, Crown, Diamond, Flame, Gem, Loader2, Moon, Rocket, Sun, Swords, Waves, X, Zap, type LucideIcon } from "lucide-react";
import { cn } from "@/lib/utils";


type BtnVariant = "primary" | "secondary" | "ghost" | "danger";

const BTN_STYLES: Record<BtnVariant, string> = {
  primary: "bg-emerald-500 text-zinc-950 hover:bg-emerald-400 disabled:bg-zinc-800 disabled:text-zinc-500",
  secondary: "bg-zinc-800 text-zinc-100 hover:bg-zinc-700 border border-zinc-700 disabled:opacity-50",
  ghost: "text-zinc-300 hover:bg-zinc-800 hover:text-zinc-100 disabled:opacity-40",
  danger: "bg-rose-600/90 text-white hover:bg-rose-500 disabled:opacity-50",
};

export function Btn({
  variant = "secondary",
  size = "md",
  className,
  children,
  ...rest
}: React.ButtonHTMLAttributes<HTMLButtonElement> & { variant?: BtnVariant; size?: "sm" | "md" }) {
  return (
    <button
      type="button"
      className={cn(
        "inline-flex shrink-0 items-center justify-center gap-1.5 rounded-lg font-medium transition-colors focus-visible:outline-2 focus-visible:outline-emerald-400 disabled:cursor-not-allowed",
        size === "sm" ? "h-7 px-2.5 text-xs" : "h-9 px-3.5 text-sm",
        BTN_STYLES[variant],
        className,
      )}
      {...rest}
    >
      {children}
    </button>
  );
}

export function IconBtn({ label, className, children, ...rest }: React.ButtonHTMLAttributes<HTMLButtonElement> & { label: string }) {
  return (
    <button
      type="button"
      title={label}
      aria-label={label}
      className={cn(
        "inline-flex h-7 w-7 shrink-0 items-center justify-center rounded-md text-zinc-400 transition-colors hover:bg-zinc-800 hover:text-zinc-100 disabled:opacity-30 disabled:hover:bg-transparent",
        className,
      )}
      {...rest}
    >
      {children}
    </button>
  );
}


export function Chip({ tone = "zinc", className, children }: { tone?: string; className?: string; children: ReactNode }) {
  const tones: Record<string, string> = {
    zinc: "bg-zinc-800 text-zinc-300",
    emerald: "bg-emerald-500/15 text-emerald-300",
    rose: "bg-rose-500/15 text-rose-300",
    amber: "bg-amber-500/15 text-amber-300",
    violet: "bg-violet-500/15 text-violet-300",
    sky: "bg-sky-500/15 text-sky-300",
  };
  return (
    <span
      className={cn(
        "inline-flex max-w-40 items-center truncate rounded-md px-1.5 py-0.5 text-[11px] font-medium",
        tones[tone] ?? tones.zinc,
        className,
      )}
    >
      {children}
    </span>
  );
}

export function Spinner({ className }: { className?: string }) {
  return <Loader2 className={cn("h-3.5 w-3.5 animate-spin", className)} />;
}


export function Toggle({ checked, onChange, disabled, label }: { checked: boolean; onChange: (v: boolean) => void; disabled?: boolean; label?: string }) {
  return (
    <button
      type="button"
      role="switch"
      aria-checked={checked}
      aria-label={label}
      title={label}
      disabled={disabled}
      onClick={() => onChange(!checked)}
      className={cn(
        "relative h-5 w-9 shrink-0 rounded-full transition-colors disabled:cursor-not-allowed disabled:opacity-40",
        checked ? "bg-emerald-500" : "bg-zinc-700",
      )}
    >
      <span
        className={cn(
          "absolute top-0.5 h-4 w-4 rounded-full bg-white shadow transition-all",
          checked ? "left-4.5" : "left-0.5",
        )}
      />
    </button>
  );
}


export function Segmented<T extends string>({
  value,
  options,
  onChange,
  className,
}: {
  value: T;
  options: { value: T; label: ReactNode; title?: string }[];
  onChange: (v: T) => void;
  className?: string;
}) {
  return (
    <div className={cn("inline-flex rounded-lg border border-zinc-700 bg-zinc-900 p-0.5", className)}>
      {options.map((option) => (
        <button
          key={option.value}
          type="button"
          title={option.title}
          onClick={() => onChange(option.value)}
          className={cn(
            "inline-flex h-7 items-center justify-center gap-1 rounded-md px-2.5 text-xs font-medium transition-colors",
            value === option.value ? "bg-zinc-700 text-zinc-100" : "text-zinc-400 hover:text-zinc-200",
          )}
        >
          {option.label}
        </button>
      ))}
    </div>
  );
}


export function Select({
  value,
  onChange,
  options,
  label,
  className,
}: {
  value: string;
  onChange: (v: string) => void;
  options: { value: string; label: string }[];
  label?: string;
  className?: string;
}) {
  return (
    <label className={cn("relative inline-flex items-center", className)}>
      {label && <span className="pointer-events-none absolute left-2.5 text-[11px] text-zinc-500">{label}</span>}
      <select
        value={value}
        onChange={(event) => onChange(event.target.value)}
        className={cn(
          "h-9 cursor-pointer appearance-none rounded-lg border border-zinc-700 bg-zinc-900 pr-7 text-sm text-zinc-200 hover:border-zinc-600 focus:outline-none",
          label ? "pl-14" : "pl-3",
        )}
      >
        {options.map((option) => (
          <option key={option.value} value={option.value}>
            {option.label}
          </option>
        ))}
      </select>
      <svg viewBox="0 0 20 20" className="pointer-events-none absolute right-2 h-4 w-4 fill-zinc-500">
        <path d="M5.5 8l4.5 4.5L14.5 8z" />
      </svg>
    </label>
  );
}


const GAME_ICONS: Record<string, LucideIcon> = {
  flame: Flame,
  moon: Moon,
  crown: Crown,
  zap: Zap,
  gem: Gem,
  rocket: Rocket,
  cherry: Cherry,
  clover: Clover,
  waves: Waves,
  candy: Candy,
  diamond: Diamond,
  anchor: Anchor,
  swords: Swords,
  sun: Sun,
};

export function Art({ icon, from, to, size = "md", className }: { icon: string; from: string; to: string; size?: "sm" | "md" | "lg"; className?: string }) {
  const Icon = GAME_ICONS[icon] ?? Gem;
  const sizes = { sm: "h-8 w-8 rounded-lg", md: "h-10 w-10 rounded-xl", lg: "h-14 w-14 rounded-2xl" };
  const iconSizes = { sm: "h-4 w-4", md: "h-5 w-5", lg: "h-7 w-7" };
  return (
    <div
      className={cn("flex shrink-0 items-center justify-center text-white", sizes[size], className)}
      style={{ backgroundImage: `linear-gradient(135deg, ${from}, ${to})` }}
    >
      <Icon className={iconSizes[size]} />
    </div>
  );
}


export function Avatar({ name, color, size = 24 }: { name: string; color: string; size?: number }) {
  const initials = name
    .split(" ")
    .map((part) => part[0])
    .join("")
    .slice(0, 2)
    .toUpperCase();
  return (
    <span
      className="inline-flex shrink-0 items-center justify-center rounded-full font-semibold text-zinc-950"
      style={{ background: color, width: size, height: size, fontSize: size * 0.42 }}
    >
      {initials}
    </span>
  );
}


export function Modal({ open, onClose, title, subtitle, width = "max-w-2xl", children, footer }: {
  open: boolean;
  onClose: () => void;
  title: ReactNode;
  subtitle?: ReactNode;
  width?: string;
  children: ReactNode;
  footer?: ReactNode;
}) {
  useEffect(() => {
    if (!open) return;
    const onKey = (event: KeyboardEvent) => {
      if (event.key === "Escape") onClose();
    };
    document.addEventListener("keydown", onKey);
    return () => document.removeEventListener("keydown", onKey);
  }, [open, onClose]);

  if (!open) return null;
  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
      <div className="absolute inset-0 bg-black/70 backdrop-blur-sm anim-fade-in" onClick={onClose} />
      <div className={cn("relative flex max-h-[88vh] w-full flex-col overflow-hidden rounded-2xl border border-zinc-800 bg-zinc-900 shadow-2xl anim-fade-up", width)}>
        <div className="flex items-start justify-between gap-4 border-b border-zinc-800 px-5 py-4">
          <div>
            <h2 className="text-base font-semibold text-zinc-100">{title}</h2>
            {subtitle && <div className="mt-0.5 text-xs text-zinc-400">{subtitle}</div>}
          </div>
          <IconBtn label="Close" onClick={onClose}>
            <X className="h-4 w-4" />
          </IconBtn>
        </div>
        <div className="flex-1 overflow-y-auto px-5 py-4">{children}</div>
        {footer && <div className="flex items-center justify-between gap-3 border-t border-zinc-800 bg-zinc-900/80 px-5 py-3.5">{footer}</div>}
      </div>
    </div>
  );
}


export function Popover({
  trigger,
  children,
  align = "left",
  width = "w-72",
  panelClassName,
}: {
  trigger: (open: boolean) => ReactNode;
  children: (close: () => void) => ReactNode;
  align?: "left" | "right";
  width?: string;
  panelClassName?: string;
}) {
  const [open, setOpen] = useState(false);
  const ref = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (!open) return;
    const onDoc = (event: MouseEvent) => {
      if (ref.current && !ref.current.contains(event.target as Node)) setOpen(false);
    };
    const onKey = (event: KeyboardEvent) => {
      if (event.key === "Escape") setOpen(false);
    };
    document.addEventListener("mousedown", onDoc);
    document.addEventListener("keydown", onKey);
    return () => {
      document.removeEventListener("mousedown", onDoc);
      document.removeEventListener("keydown", onKey);
    };
  }, [open]);

  return (
    <div className="relative" ref={ref}>
      <div onClick={() => setOpen((v) => !v)}>{trigger(open)}</div>
      {open && (
        <div
          className={cn(
            "absolute top-full z-40 mt-1.5 overflow-hidden rounded-xl border border-zinc-700 bg-zinc-900 shadow-xl anim-fade-up",
            align === "left" ? "left-0" : "right-0",
            width,
            panelClassName,
          )}
        >
          {children(() => setOpen(false))}
        </div>
      )}
    </div>
  );
}



export function FieldRow({ title, children, hint, right }: { title: string; children?: ReactNode; hint?: ReactNode; right?: ReactNode }) {
  return (
    <div className="rounded-xl border border-zinc-800 bg-zinc-900/60 p-3.5">
      <div className="flex items-center justify-between gap-3">
        <div className="text-sm font-medium text-zinc-200">{title}</div>
        {right}
      </div>
      {children}
      {hint && <div className="mt-2 text-xs leading-relaxed text-zinc-500">{hint}</div>}
    </div>
  );
}

export function SyncPill({ tone, label }: { tone: "green" | "amber" | "red" | "blue"; label: string }) {
  const tones = {
    green: "bg-emerald-500/15 text-emerald-300 border-emerald-500/30",
    amber: "bg-amber-500/15 text-amber-300 border-amber-500/30",
    red: "bg-rose-500/15 text-rose-300 border-rose-500/30",
    blue: "bg-sky-500/15 text-sky-300 border-sky-500/30",
  };
  return (
    <span className={cn("inline-flex items-center gap-1.5 rounded-full border px-2 py-0.5 text-[11px] font-medium", tones[tone])}>
      {tone === "blue" && <Spinner className="h-3 w-3" />}
      {tone === "red" && <Zap className="h-3 w-3" />}
      {label}
    </span>
  );
}
