"use client";

import type { ChangeEvent } from "react";

export type FilterOption = {
  label: string;
  value: string;
};

export type FiltersBarProps = {
  searchPlaceholder: string;
  searchValue: string;
  onSearchChange: (value: string) => void;
  filters: {
    label: string;
    value: string;
    options: FilterOption[];
    onChange: (value: string) => void;
  }[];
  onClear: () => void;
};

export const FiltersBar = ({
  searchPlaceholder,
  searchValue,
  onSearchChange,
  filters,
  onClear
}: FiltersBarProps) => {
  return (
    <div className="flex flex-col gap-3 rounded-2xl border border-zinc-800 bg-zinc-900 p-4 shadow-sm">
      <div className="flex flex-col gap-3 lg:flex-row lg:items-center">
        <input
          className="w-full rounded-xl border border-zinc-800 bg-zinc-950 px-4 py-2 text-sm text-zinc-100 placeholder:text-zinc-500 outline-none transition focus:border-brand-500"
          placeholder={searchPlaceholder}
          value={searchValue}
          onChange={(event: ChangeEvent<HTMLInputElement>) => onSearchChange(event.target.value)}
        />
        <button
          className="w-full rounded-xl border border-zinc-800 bg-zinc-950 px-4 py-2 text-sm font-semibold text-zinc-200 hover:border-brand-500 hover:text-white lg:w-auto"
          onClick={onClear}
          type="button"
        >
          Limpar filtros
        </button>
      </div>
      <div className="grid gap-3 md:grid-cols-2 lg:grid-cols-4">
        {filters.map((filter) => (
          <label key={filter.label} className="flex flex-col gap-1 text-xs font-semibold text-zinc-400">
            {filter.label}
            <select
              className="rounded-xl border border-zinc-800 bg-zinc-900 px-3 py-2 text-sm font-normal text-zinc-100"
              value={filter.value}
              onChange={(event) => filter.onChange(event.target.value)}
            >
              <option value="">Todos</option>
              {filter.options.map((option) => (
                <option key={option.value} value={option.value}>
                  {option.label}
                </option>
              ))}
            </select>
          </label>
        ))}
      </div>
    </div>
  );
};
