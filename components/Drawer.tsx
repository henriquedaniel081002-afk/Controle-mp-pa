"use client";

import type { ReactNode } from "react";

type DrawerProps = {
  open: boolean;
  onClose: () => void;
  title: string;
  children: ReactNode;
};

export const Drawer = ({ open, onClose, title, children }: DrawerProps) => {
  if (!open) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-end justify-center bg-black/60 px-4 py-6 sm:items-center">
      <button
        aria-label="Fechar"
        className="absolute inset-0 h-full w-full cursor-default"
        onClick={onClose}
        type="button"
      />
      <div className="relative z-10 flex max-h-[90vh] w-full max-w-4xl flex-col overflow-hidden rounded-2xl border border-zinc-800 bg-zinc-900 shadow-xl">
        <div className="flex items-center justify-between border-b border-zinc-800 px-6 py-4">
          <h2 className="text-lg font-semibold text-zinc-100">{title}</h2>
          <button
            className="rounded-full border border-zinc-700 bg-zinc-950 px-3 py-1 text-sm text-zinc-200 hover:border-brand-500 hover:text-white"
            onClick={onClose}
            type="button"
          >
            Fechar
          </button>
        </div>
        <div className="overflow-y-auto px-6 py-5">{children}</div>
      </div>
    </div>
  );
};
