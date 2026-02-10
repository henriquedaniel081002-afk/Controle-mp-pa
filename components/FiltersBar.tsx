"use client";

import type { ChangeEvent } from "react";
import { useEffect, useId, useState } from "react";

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
  const [isOpen, setIsOpen] = useState(false);
  const dialogTitleId = useId();

  useEffect(() => {
    if (!isOpen) return;
    const onKeyDown = (event: KeyboardEvent) => {
      if (event.key === "Escape") setIsOpen(false);
    };
    window.addEventListener("keydown", onKeyDown);
    return () => window.removeEventListener("keydown", onKeyDown);
  }, [isOpen]);

  return (
    <div className="flex flex-col gap-3 rounded-2xl border border-zinc-800 bg-zinc-900 p-4 shadow-sm">
      <div className="flex flex-col gap-3 lg:flex-row lg:items-center">
        <input
          className="w-full rounded-xl border border-zinc-800 bg-zinc-950 px-4 py-2 text-sm text-zinc-100 placeholder:text-zinc-500 outline-none transition focus:border-brand-500"
          placeholder={searchPlaceholder}
          value={searchValue}
          onChange={(event: ChangeEvent<HTMLInputElement>) => onSearchChange(event.target.value)}
        />
        <div className="flex w-full flex-col gap-2 lg:w-auto lg:flex-row lg:items-center">
          <button
            className="w-full rounded-xl border border-brand-500 bg-zinc-950 px-4 py-2 text-sm font-semibold text-zinc-100 hover:bg-zinc-900 lg:w-auto"
            onClick={() => setIsOpen(true)}
            type="button"
          >
            Filtros
          </button>
          <button
            className="w-full rounded-xl border border-zinc-800 bg-zinc-950 px-4 py-2 text-sm font-semibold text-zinc-200 hover:border-brand-500 hover:text-white lg:w-auto"
            onClick={onClear}
            type="button"
          >
            Limpar filtros
          </button>
        </div>
      </div>

      {/* Modal de filtros (mobile e desktop) */}
      {isOpen ? (
        <div
          className="fixed inset-0 z-50 flex items-end justify-center bg-black/60 p-3 lg:items-center"
          role="dialog"
          aria-modal="true"
          aria-labelledby={dialogTitleId}
          onMouseDown={(event) => {
            // fecha clicando no backdrop (sem fechar ao clicar dentro do painel)
            if (event.target === event.currentTarget) setIsOpen(false);
          }}
        >
          <div className="w-full max-w-4xl rounded-2xl border border-zinc-800 bg-zinc-950 shadow-xl">
            <div className="flex items-center justify-between gap-3 border-b border-zinc-800 px-4 py-3">
              <div className="flex flex-col">
                <h2 id={dialogTitleId} className="text-sm font-semibold text-zinc-100">
                  Filtros
                </h2>
                <p className="text-xs text-zinc-500">Ajuste os filtros abaixo. As mudanças são aplicadas automaticamente.</p>
              </div>
              <button
                className="rounded-xl border border-zinc-800 bg-zinc-900 px-3 py-2 text-xs font-semibold text-zinc-200 hover:border-brand-500 hover:text-white"
                onClick={() => setIsOpen(false)}
                type="button"
              >
                Fechar
              </button>
            </div>

            <div className="max-h-[70vh] overflow-auto px-4 py-4 lg:max-h-[75vh]">
              <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-4">
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

            <div className="flex flex-col gap-2 border-t border-zinc-800 p-4 lg:flex-row lg:items-center lg:justify-end">
              <button
                className="w-full rounded-xl border border-zinc-800 bg-zinc-900 px-4 py-2 text-sm font-semibold text-zinc-200 hover:border-brand-500 hover:text-white lg:w-auto"
                onClick={() => {
                  onClear();
                }}
                type="button"
              >
                Limpar filtros
              </button>
              <button
                className="w-full rounded-xl border border-brand-500 bg-zinc-950 px-4 py-2 text-sm font-semibold text-zinc-100 hover:bg-zinc-900 lg:w-auto"
                onClick={() => setIsOpen(false)}
                type="button"
              >
                OK
              </button>
            </div>
          </div>
        </div>
      ) : null}
    </div>
  );
};
