import type { Metadata } from "next";
import "./globals.css";

export const metadata: Metadata = {
  title: "AuraStudio — Agendamento Multi-Cliente & IA de Layouts",
  description:
    "Plataforma de agência para criar layouts com IA, editar legendas e agendar postagens automáticas no Instagram (Feed, Reels, Stories), TikTok e Facebook.",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="pt-BR" className="dark">
      <body className="min-h-screen bg-zinc-950 text-zinc-100 antialiased selection:bg-indigo-500/30 selection:text-indigo-200">
        {children}
      </body>
    </html>
  );
}
