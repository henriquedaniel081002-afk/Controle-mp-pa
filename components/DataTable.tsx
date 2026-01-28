"use client";

import type { ReactNode } from "react";

export type Column<T> = {
  key: string;
  header: string;
  className?: string;
  render: (row: T) => ReactNode;
  sortable?: boolean;
};

export type SortState = {
  key: string;
  direction: "asc" | "desc";
};

type DataTableProps<T> = {
  columns: Column<T>[];
  data: T[];
  sort: SortState;
  onSortChange: (next: SortState) => void;
  onRowClick?: (row: T) => void;
};

const isDescriptionHeader = (header: string) => {
  const h = (header || "").toLowerCase();
  return h.includes("descr") || h.includes("descricao") || h.includes("descrição");
};

export const DataTable = <T,>({ columns, data, sort, onSortChange, onRowClick }: DataTableProps<T>) => {
  const handleSort = (column: Column<T>) => {
    if (!column.sortable) return;
    const isSame = sort.key === column.key;
    const nextDirection = isSame && sort.direction === "asc" ? "desc" : "asc";
    onSortChange({ key: column.key, direction: nextDirection });
  };

  const sortableColumns = columns.filter((c) => c.sortable);

  return (
    <>
      {/* MOBILE: cards (sem scroll interno) */}
      <div className="md:hidden">
        {sortableColumns.length > 0 && (
          <div className="mb-3 rounded-2xl border border-zinc-800 bg-zinc-900 px-4 py-3 shadow-sm">
            <div className="mb-2 text-xs font-semibold uppercase tracking-wide text-zinc-400">
              Ordenação
            </div>
            <div className="flex flex-wrap gap-2">
              {sortableColumns.map((column) => {
                const active = sort.key === column.key;
                return (
                  <button
                    key={column.key}
                    type="button"
                    onClick={() => handleSort(column)}
                    className={`rounded-full border px-3 py-1.5 text-xs font-semibold ${
                      active
                        ? "border-brand-500/40 bg-brand-500/15 text-brand-200"
                        : "border-zinc-800 bg-zinc-950 text-zinc-300"
                    }`}
                    aria-label={`Ordenar por ${column.header}`}
                  >
                    {column.header}
                    {active && (
                      <span className="ml-2 text-[10px] text-brand-300">
                        {sort.direction === "asc" ? "▲" : "▼"}
                      </span>
                    )}
                  </button>
                );
              })}
            </div>
          </div>
        )}

        <div className="space-y-3">
          {data.map((row, index) => {
            const descriptionCols = columns.filter((c) => isDescriptionHeader(c.header));
            const primary = descriptionCols.length > 0 ? descriptionCols : [columns[0]].filter(Boolean);
            const secondaryKeys = new Set(primary.map((c) => c.key));
            const secondary = columns.filter((c) => !secondaryKeys.has(c.key));

            return (
              <div
                key={index}
                className={`rounded-2xl border border-zinc-800 bg-zinc-900 p-4 shadow-sm ${
                  onRowClick ? "cursor-pointer hover:bg-zinc-800/40" : ""
                }`}
                onClick={() => onRowClick?.(row)}
                role={onRowClick ? "button" : undefined}
                tabIndex={onRowClick ? 0 : undefined}
                onKeyDown={(e) => {
                  if (!onRowClick) return;
                  if (e.key === "Enter" || e.key === " ") onRowClick(row);
                }}
              >
                {/* Primário (geralmente descrição) */}
                <div className="space-y-1">
                  {primary.map((col) => (
                    <div key={col.key} className="text-sm font-semibold text-zinc-100 whitespace-normal break-words">
                      {col.render(row)}
                    </div>
                  ))}
                </div>

                {/* Secundário (metadados) */}
                {secondary.length > 0 && (
                  <div className="mt-3 grid grid-cols-2 gap-2">
                    {secondary.map((col) => (
                      <div
                        key={col.key}
                        className="rounded-xl border border-zinc-800 bg-zinc-950 px-3 py-2"
                      >
                        <div className="text-[10px] font-semibold uppercase tracking-wide text-zinc-500">
                          {col.header}
                        </div>
                        <div className="mt-1 text-xs text-zinc-200 whitespace-normal break-words">
                          {col.render(row)}
                        </div>
                      </div>
                    ))}
                  </div>
                )}
              </div>
            );
          })}
        </div>
      </div>

      {/* DESKTOP: manter exatamente o comportamento/visual atual */}
      <div className="hidden md:block">
        <div className="overflow-x-auto rounded-2xl border border-zinc-800 bg-zinc-900 shadow-sm">
          <table className="min-w-full text-left text-sm">
            <thead className="bg-zinc-950 text-xs uppercase text-zinc-400">
              <tr>
                {columns.map((column) => (
                  <th key={column.key} className={`px-4 py-3 ${column.className ?? ""}`} scope="col">
                    <button
                      className={`flex items-center gap-2 font-semibold ${
                        column.sortable ? "hover:text-brand-300" : "cursor-default"
                      }`}
                      onClick={() => handleSort(column)}
                      type="button"
                    >
                      {column.header}
                      {sort.key === column.key && (
                        <span className="text-[10px] text-brand-400">{sort.direction === "asc" ? "▲" : "▼"}</span>
                      )}
                    </button>
                  </th>
                ))}
              </tr>
            </thead>
            <tbody className="divide-y divide-zinc-800">
              {data.map((row, index) => (
                <tr
                  key={index}
                  className={`hover:bg-zinc-800/50 ${onRowClick ? "cursor-pointer" : ""}`}
                  onClick={() => onRowClick?.(row)}
                >
                  {columns.map((column) => (
                    <td key={column.key} className={`px-4 py-3 ${column.className ?? ""}`}>
                      {column.render(row)}
                    </td>
                  ))}
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    </>
  );
};
