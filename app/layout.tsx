import type { Metadata } from "next";
import "./globals.css";

export const metadata: Metadata = {
  title: "Serenity at of Léo",
  description: "Visual novel infantil sobre escolhas financeiras simples.",
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="pt-BR">
      <body>{children}</body>
    </html>
  );
}
