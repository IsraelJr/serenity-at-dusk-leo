"use client";

import dynamic from "next/dynamic";

const LoadedGameCanvas = dynamic(() => import("./GameCanvasFixed").then((mod) => mod.GameCanvasFixed), {
  ssr: false,
  loading: () => <main>Carregando A Moedinha de Léo...</main>
});

export function GameCanvasClient() {
  return <LoadedGameCanvas />;
}
