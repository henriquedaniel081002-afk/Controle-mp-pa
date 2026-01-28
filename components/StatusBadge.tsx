import type { StatusLabel } from "@/lib/types";

type StatusBadgeProps = {
  status: StatusLabel;
};

const statusStyles: Record<StatusLabel, string> = {
  Crítico: "bg-red-500/20 text-red-200",
  Atenção: "bg-amber-500/20 text-amber-200",
  Regular: "bg-emerald-500/20 text-emerald-200",
  Excesso: "bg-violet-500/20 text-violet-200",
  "Sem consumo": "bg-zinc-800 text-zinc-200"
};

export const StatusBadge = ({ status }: StatusBadgeProps) => {
  return (
    <span className={`rounded-full px-3 py-1 text-xs font-semibold ${statusStyles[status]}`}>{status}</span>
  );
};
