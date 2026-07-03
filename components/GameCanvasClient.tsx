"use client";

import dynamic from "next/dynamic";

const LoadedGameCanvas = dynamic(() => import("./GameCanvas").then((mod) => mod.GameCanvas), {
  ssr: false,
  loading: () => <main>Carregando Serenity at Dusk do Léo...</main>
});

export function GameCanvasClient() {
  return <LoadedGameCanvas />;
}
