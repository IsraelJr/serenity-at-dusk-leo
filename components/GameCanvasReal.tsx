"use client";

import { useMemo, useState } from "react";
import styles from "./GameCanvas.module.css";

type Branch = "save" | "spend";

const sceneImage = "/assets/D5C982C9-ECC5-4402-931B-CCB79367D38D.png?v=real-upload-1";

const intro = [
  { speaker: "Narrador", text: "O sol entrou devagar no quarto de Léo, iluminando seu cantinho favorito.", focus: "room" },
  { speaker: "Narrador", text: "Léo percebeu uma moedinha brilhando perto dele e abriu um sorriso de curiosidade.", focus: "leo" },
  { speaker: "Léo", text: "Uau... será que essa moedinha pode me ajudar a chegar mais perto do meu sonho?", focus: "coin" },
  { speaker: "Narrador", text: "O que Léo deve fazer com a moedinha?", focus: "choice" }
];

const endings: Record<Branch, { speaker: string; text: string; focus: string }[]> = {
  save: [
    { speaker: "Léo", text: "Vou guardar! Cada moedinha me deixa mais perto da minha bicicleta.", focus: "leo" },
    { speaker: "Narrador", text: "Léo guardou a moedinha e sentiu orgulho por pensar no futuro.", focus: "coin" },
    { speaker: "Narrador", text: "Pequenas escolhas de hoje podem fazer grandes sonhos crescerem amanhã.", focus: "room" }
  ],
  spend: [
    { speaker: "Léo", text: "Talvez eu possa comprar alguma coisa agora... isso seria divertido.", focus: "leo" },
    { speaker: "Narrador", text: "Mas Léo percebeu que gastar agora deixaria o sonho um pouco mais distante.", focus: "coin" },
    { speaker: "Narrador", text: "Ele aprendeu que todo sonho pede paciência e boas escolhas.", focus: "room" }
  ]
};

const camera: Record<string, { x: number; y: number; scale: number; glowX: number; glowY: number }> = {
  room: { x: 0, y: 0, scale: 1, glowX: 56, glowY: 58 },
  leo: { x: -6, y: -4, scale: 1.12, glowX: 47, glowY: 50 },
  coin: { x: -10, y: -5, scale: 1.18, glowX: 58, glowY: 58 },
  choice: { x: -10, y: -5, scale: 1.18, glowX: 58, glowY: 58 }
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
              src={sceneImage}
              alt="Quarto do Léo pela manhã"
              style={{
                position: "absolute",
                inset: 0,
                width: "100%",
                height: "100%",
                objectFit: "cover",
                transform: `translate(${cam.x}%, ${cam.y}%) scale(${cam.scale})`,
                transformOrigin: "center center",
                transition: "transform 1.3s ease-in-out"
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
                <p>Agora usando a imagem real enviada no GitHub.</p>
                <button onClick={next}>Iniciar jornada</button>
              </div>
            </div>
          )}
        </div>
      </section>
    </main>
  );
}
