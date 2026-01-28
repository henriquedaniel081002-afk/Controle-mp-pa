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

export const DataTable = <T,>({ columns, data, sort, onSortChange, onRowClick }: DataTableProps<T>) => {
  const handleSort = (column: Column<T>) => {
    if (!column.sortable) return;
    const isSame = sort.key === column.key;
    const nextDirection = isSame && sort.direction === "asc" ? "desc" : "asc";
    onSortChange({ key: column.key, direction: nextDirection });
  };

  return (
    <div className="overflow-x-auto rounded-2xl border border-zinc-800 bg-zinc-900 shadow-sm">
      <table className="min-w-full text-left text-sm">
        <thead className="bg-zinc-950 text-xs uppercase text-zinc-400">
          <tr>
            {columns.map((column) => (
              <th
                key={column.key}
                className={`px-4 py-3 ${column.className ?? ""}`}
                scope="col"
              >
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
  );
};
