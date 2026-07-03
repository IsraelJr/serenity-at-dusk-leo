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
  intro: "/assets/D5C982C9-ECC5-4402-931B-CCB79367D38D.png?v=real-upload-4",
  spend: "/assets/2231B40B-39F3-4E29-B7B0-F667C01E3E4B.png?v=spend-3",
  save: "/assets/8F68982B-ED7B-494D-A763-0D5AEA20ED21.png?v=save-3"
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
  "spend-leo": { x: -7, y: -3, scale: 1.1, glowX: 72, glowY: 46 },
  "spend-door": { x: -12, y: -4, scale: 1.15, glowX: 78, glowY: 45 },
  "spend-coin": { x: -10, y: -4, scale: 1.17, glowX: 75, glowY: 45 }
};

export function GameCanvasReal() {
  const [started, setStarted] = useState(false);
  const [index, setIndex] = useState(0);
  const [branch, setBranch] = useState<Branch | null>(null);
  const [transitioning, setTransitioning] = useState(false);
  const [displayScene, setDisplayScene] = useState<SceneKey>("intro");
  const [incomingScene, setIncomingScene] = useState<SceneKey | null>(null);
  const [incomingVisible, setIncomingVisible] = useState(false);
  const [transitionKind, setTransitionKind] = useState<Branch | "restart" | null>(null);

  const steps = useMemo(() => (branch ? [...intro, ...endings[branch]] : intro), [branch]);
  const step = steps[index] ?? steps[steps.length - 1];
  const isChoice = step.focus === "choice" && !branch;
  const isLast = index >= steps.length - 1;
  const cam = camera[step.focus] ?? camera.room;
  const transitionMs = transitionKind === "spend" ? 1150 : 900;

  function next() {
    if (!started) {
      setStarted(true);
      return;
    }
    setIndex((current) => Math.min(current + 1, steps.length - 1));
  }

  function restart() {
    setTransitionKind("restart");
    setIncomingScene("intro");
    setTransitioning(true);
    window.setTimeout(() => setIncomingVisible(true), 40);
    window.setTimeout(() => {
      setStarted(false);
      setIndex(0);
      setBranch(null);
      setDisplayScene("intro");
      setIncomingScene(null);
      setIncomingVisible(false);
      setTransitioning(false);
      setTransitionKind(null);
    }, 820);
  }

  function choose(nextBranch: Branch) {
    setTransitionKind(nextBranch);
    setIncomingScene(nextBranch);
    setIncomingVisible(false);
    setTransitioning(true);
    window.setTimeout(() => setIncomingVisible(true), 40);
    window.setTimeout(() => {
      setBranch(nextBranch);
      setIndex(intro.length);
      setDisplayScene(nextBranch);
      setIncomingScene(null);
      setIncomingVisible(false);
      setTransitioning(false);
      setTransitionKind(null);
    }, nextBranch === "spend" ? 1180 : 920);
  }

  return (
    <main className={styles.page}>
      <section className={styles.shell}>
        <div className={styles.gameWindow}>
          <div className={styles.canvasWrap} style={{ position: "relative", overflow: "hidden", background: "#081a3b" }}>
            <img
              src={scenes[displayScene]}
              alt="Cena atual da história do Léo"
              style={{
                position: "absolute",
                inset: 0,
                width: "100%",
                height: "100%",
                objectFit: "cover",
                opacity: transitioning ? 0.92 : 1,
                transform: `translate(${cam.x}%, ${cam.y}%) scale(${transitioning ? Math.max(1.02, cam.scale * 1.02) : cam.scale})`,
                transformOrigin: "center center",
                transition: `transform 1.45s ease-in-out, opacity ${transitionMs}ms ease-in-out, filter ${transitionMs}ms ease-in-out`,
                filter: transitioning ? "blur(2px) brightness(0.82)" : "blur(0) brightness(1)"
              }}
            />

            {incomingScene && (
              <img
                src={scenes[incomingScene]}
                alt="Próxima cena da história do Léo"
                style={{
                  position: "absolute",
                  inset: 0,
                  width: "100%",
                  height: "100%",
                  objectFit: "cover",
                  opacity: incomingVisible ? 1 : 0,
                  transform: incomingVisible
                    ? "translate(0%, 0%) scale(1)"
                    : transitionKind === "spend"
                      ? "translate(3%, 0%) scale(1.04)"
                      : "translate(0%, 1%) scale(1.04)",
                  transformOrigin: "center center",
                  transition: `opacity ${transitionMs}ms ease-in-out, transform ${transitionMs}ms ease-in-out, filter ${transitionMs}ms ease-in-out`,
                  filter: incomingVisible ? "blur(0) brightness(1)" : "blur(5px) brightness(0.7)"
                }}
              />
            )}

            <div style={{ position: "absolute", left: `${cam.glowX}%`, top: `${cam.glowY}%`, width: 120, height: 120, borderRadius: 999, background: "rgba(255, 242, 160, 0.34)", filter: "blur(10px)", opacity: transitioning ? 0.35 : 1, transform: "translate(-50%, -50%)", transition: "left 1.3s ease, top 1.3s ease, opacity 0.45s ease" }} />
            <div
              aria-hidden="true"
              style={{
                position: "absolute",
                inset: 0,
                pointerEvents: "none",
                background: transitionKind === "spend"
                  ? "linear-gradient(90deg, rgba(255,205,95,0.22), rgba(3,10,28,0.46), rgba(255,205,95,0.15))"
                  : "radial-gradient(circle at center, rgba(255,230,130,0.22), rgba(3,10,28,0.48))",
                opacity: transitioning ? 1 : 0,
                transition: `opacity ${transitionMs}ms ease-in-out`
              }}
            />
          </div>

          <div className={styles.cinematicFade} />
          <div className={styles.sunRay} />
          <div className={styles.hudTopLeft}><span>Cena {Math.min(index + 1, steps.length)}/{steps.length}</span></div>
          <div className={styles.hudTopRight}><button aria-label="Reiniciar" onClick={restart}>↺</button></div>

          <div className={`${styles.dialogueBox} ${started ? styles.dialogueVisible : ""}`} style={{ opacity: transitioning ? 0 : undefined, transform: transitioning ? "translate(-50%, 18px)" : undefined, transition: "opacity 0.35s ease, transform 0.35s ease" }}>
            <div className={styles.namePlate}>{step.speaker}</div>
            <p>{step.text}</p>
            {isChoice ? (
              <div className={styles.choices}>
                <button disabled={transitioning} onClick={() => choose("save")}>Guardar para o sonho</button>
                <button disabled={transitioning} onClick={() => choose("spend")}>Gastar agora</button>
              </div>
            ) : (
              <button disabled={transitioning} className={styles.nextButton} onClick={isLast ? restart : next}>{isLast ? "↺" : started ? "➜" : "▶"}</button>
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

          <div aria-hidden="true" style={{ display: "none" }}>
            <img src={scenes.intro} alt="" />
            <img src={scenes.save} alt="" />
            <img src={scenes.spend} alt="" />
          </div>
        </div>
      </section>
    </main>
  );
}
