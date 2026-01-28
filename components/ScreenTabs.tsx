"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";

type ScreenTabsProps = {
  className?: string;
};

export const ScreenTabs = ({ className }: ScreenTabsProps) => {
  const pathname = usePathname();
  const isPa = pathname === "/pa" || pathname === "/";
  const isMp = pathname === "/mp";

  const base =
    "inline-flex items-center justify-center rounded-full px-4 py-2 text-sm font-semibold transition focus:outline-none focus:ring-2 focus:ring-brand-500/40";

  return (
    <div className={`flex flex-wrap gap-2 ${className ?? ""}`}>
      <Link
        href="/pa"
        className={
          isPa
            ? `${base} bg-brand-600 text-white hover:bg-brand-700`
            : `${base} border border-zinc-700 bg-zinc-900 text-zinc-200 hover:border-brand-500 hover:text-white`
        }
      >
        PA
      </Link>
      <Link
        href="/mp"
        className={
          isMp
            ? `${base} bg-brand-600 text-white hover:bg-brand-700`
            : `${base} border border-zinc-700 bg-zinc-900 text-zinc-200 hover:border-brand-500 hover:text-white`
        }
      >
        MP
      </Link>
    </div>
  );
};
