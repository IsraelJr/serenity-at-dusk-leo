"use client";

import { useMemo, useState } from "react";
import styles from "./GameCanvas.module.css";

type Branch = "save" | "spend";
type SceneKey = "intro" | "save" | "spend";

type Step = {
  speaker: string;
  text: string;
  focus: string;
  scene: SceneKey;
};

const scenes: Record<SceneKey, string> = {
  intro: "/assets/D5C982C9-ECC5-4402-931B-CCB79367D38D.png?v=real-upload-2",
  spend: "/assets/2231B40B-39F3-4E29-B7B0-F667C01E3E4B.png?v=spend-1",
  save: "/assets/8F68982B-ED7B-494D-A763-0D5AEA20ED21.png?v=save-1"
};

const intro: Step[] = [
  { speaker: "Narrador", text: "O sol entrou devagar no quarto de Léo, iluminando seu cantinho favorito.", focus: "room", scene: "intro" },
  { speaker: "Narrador", text: "Léo percebeu uma moedinha brilhando perto dele e abriu um sorriso de curiosidade.", focus: "leo", scene: "intro" },
  { speaker: "Léo", text: "Uau... será que essa moedinha pode me ajudar a chegar mais perto do meu sonho?", focus: "coin", scene: "intro" },
  { speaker: "Narrador", text: "O que Léo deve fazer com a moedinha?", focus: "choice", scene: "intro" }
];

const endings: Record<Branch, Step[]> = {
  save: [
    { speaker: "Léo", text: "Vou guardar! Assim fico mais perto do meu sonho.", focus: "save-leo", scene: "save" },
    { speaker: "Narrador", text: "Léo colocou a moedinha no porquinho azul com muito cuidado.", focus: "save-coin", scene: "save" },
    { speaker: "Narrador", text: "Guardar um pouco de cada vez é uma forma inteligente de fazer sonhos crescerem.", focus: "save-room", scene: "save" }
  ],
  spend: [
    { speaker: "Léo", text: "Vou sair do quarto e gastar essa moedinha!", focus: "spend-leo", scene: "spend" },
    { speaker: "Narrador", text: "Léo saiu animado, pensando no que poderia comprar naquele momento.", focus: "spend-door", scene: "spend" },
    { speaker: "Narrador", text: "Mas gastar agora pode afastar um pouquinho os sonhos maiores.", focus: "spend-coin", scene: "spend" }
  ]
};

const camera: Record<string, { x: number; y: number; scale: number; glowX: number; glowY: number }> = {
  room: { x: 0, y: 0, scale: 1, glowX: 56, glowY: 58 },
  leo: { x: -6, y: -4, scale: 1.12, glowX: 47, glowY: 50 },
  coin: { x: -10, y: -5, scale: 1.18, glowX: 58, glowY: 58 },
  choice: { x: -10, y: -5, scale: 1.18, glowX: 58, glowY: 58 },
  "save-leo": { x: -2, y: -3, scale: 1.1, glowX: 48, glowY: 49 },
  "save-coin": { x: -8, y: -7, scale: 1.2, glowX: 58, glowY: 56 },
  "save-room": { x: 0, y: 0, scale: 1, glowX: 58, glowY: 56 },
  "spend-leo": { x: -8, y: -4, scale: 1.13, glowX: 72, glowY: 46 },
  "spend-door": { x: -13, y: -5, scale: 1.18, glowX: 78, glowY: 45 },
  "spend-coin": { x: -11, y: -5, scale: 1.2, glowX: 75, glowY: 45 }
};

export function GameCanvasReal() {
  const [started, setStarted] = useState(false);
  const [index, setIndex] = useState(0);
  const [branch, setBranch] = useState<Branch | null>(null);

  const steps = useMemo(() => (branch ? [...intro, ...endings[branch]] : intro), [branch]);
  const step = steps[index] ?? steps[steps.length - 1];
  const isChoice = step.focus === "choice" && !branch;
  const isLast = index >= steps.length - 1;
  const cam = camera[step.focus] ?? camera.room;
  const sceneImage = scenes[step.scene];

  function next() {
    if (!started) {
      setStarted(true);
      return;
    }
    setIndex((current) => Math.min(current + 1, steps.length - 1));
  }

  function restart() {
    setStarted(false);
    setIndex(0);
    setBranch(null);
  }

  function choose(nextBranch: Branch) {
    setBranch(nextBranch);
    setIndex(intro.length);
  }

  return (
    <main className={styles.page}>
      <section className={styles.shell}>
        <div className={styles.gameWindow}>
          <div className={styles.canvasWrap} style={{ position: "relative", overflow: "hidden" }}>
            <img
              key={sceneImage}
              src={sceneImage}
              alt="Cena da história do Léo"
              style={{
                position: "absolute",
                inset: 0,
                width: "100%",
                height: "100%",
                objectFit: "cover",
                transform: `translate(${cam.x}%, ${cam.y}%) scale(${cam.scale})`,
                transformOrigin: "center center",
                transition: "transform 1.3s ease-in-out, opacity 0.6s ease-in-out"
              }}
            />
            <div style={{ position: "absolute", left: `${cam.glowX}%`, top: `${cam.glowY}%`, width: 120, height: 120, borderRadius: 999, background: "rgba(255, 242, 160, 0.34)", filter: "blur(10px)", transform: "translate(-50%, -50%)", transition: "left 1.3s ease, top 1.3s ease" }} />
          </div>

          <div className={styles.cinematicFade} />
          <div className={styles.sunRay} />
          <div className={styles.hudTopLeft}><span>Cena {Math.min(index + 1, steps.length)}/{steps.length}</span></div>
          <div className={styles.hudTopRight}><button aria-label="Reiniciar" onClick={restart}>↺</button></div>

          <div className={`${styles.dialogueBox} ${started ? styles.dialogueVisible : ""}`}>
            <div className={styles.namePlate}>{step.speaker}</div>
            <p>{step.text}</p>
            {isChoice ? (
              <div className={styles.choices}>
                <button onClick={() => choose("save")}>Guardar para o sonho</button>
                <button onClick={() => choose("spend")}>Gastar agora</button>
              </div>
            ) : (
              <button className={styles.nextButton} onClick={isLast ? restart : next}>{isLast ? "↺" : started ? "➜" : "▶"}</button>
            )}
          </div>

          {!started && (
            <div className={styles.startOverlay}>
              <div className={styles.startCard}>
                <span>Uma história interativa</span>
                <h2>A Moedinha de Léo</h2>
                <p>Escolha se Léo vai guardar ou gastar a moedinha.</p>
                <button onClick={next}>Iniciar jornada</button>
              </div>
            </div>
          )}
        </div>
      </section>
    </main>
  );
}
