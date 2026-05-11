import { cn } from "@/lib/utils";
import type { LucideIcon } from "lucide-react";

type Props = {
  label: string;
  value: string;
  hint?: string;
  delta?: { value: string; positive: boolean };
  icon?: LucideIcon;
  intent?: "default" | "positive" | "negative" | "warning";
};

export function KpiCard({ label, value, hint, delta, icon: Icon, intent = "default" }: Props) {
  const valueColor =
    intent === "positive"
      ? "text-positive"
      : intent === "negative"
        ? "text-negative"
        : intent === "warning"
          ? "text-warning"
          : "text-fg-primary";
  return (
    <div className="panel p-4 flex flex-col gap-2.5 min-w-0">
      <div className="flex items-center justify-between gap-2">
        <span className="stat-label truncate">{label}</span>
        {Icon ? <Icon className="w-4 h-4 text-fg-muted shrink-0" /> : null}
      </div>
      <div className="flex items-baseline gap-2 min-w-0">
        <span className={cn("stat-value", valueColor)}>{value}</span>
        {delta ? (
          <span
            className={cn(
              "text-2xs tabular shrink-0",
              delta.positive ? "text-positive" : "text-negative",
            )}
          >
            {delta.value}
          </span>
        ) : null}
      </div>
      {hint ? <span className="text-2xs text-fg-muted truncate">{hint}</span> : null}
    </div>
  );
}
