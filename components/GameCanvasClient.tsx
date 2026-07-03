"use client";

import dynamic from "next/dynamic";

const LoadedGameCanvas = dynamic(() => import("./GameCanvasReal").then((mod) => mod.GameCanvasReal), {
  ssr: false,
  loading: () => <main>Carregando A Moedinha de Léo...</main>
});

export function GameCanvasClient() {
  return <LoadedGameCanvas />;
}
