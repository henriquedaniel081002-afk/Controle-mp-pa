import "./globals.css";
import type { ReactNode } from "react";

export const metadata = {
  title: "Controle PA/MP",
  description: "Controle de estoque PA/MP"
};

export default function RootLayout({ children }: { children: ReactNode }) {
  return (
    <html lang="pt-BR">
      <body className="min-h-screen">{children}</body>
    </html>
  );
}
