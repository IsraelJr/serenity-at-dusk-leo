"use client";

import { useEffect, useMemo, useState } from "react";
import styles from "./GameCanvas.module.css";

type Branch = "save" | "spend";
type SceneKey = "intro" | "save" | "spend";
type Step = { speaker: string; text: string; focus: string; scene: SceneKey };
type Camera = { x: number; y: number; scale: number; glowX: number; glowY: number };

const scenes: Record<SceneKey, string> = {
  intro: "/assets/D5C982C9-ECC5-4402-931B-CCB79367D38D.png?v=single-crossfade-intro-1",
  spend: "/assets/2231B40B-39F3-4E29-B7B0-F667C01E3E4B.png?v=single-crossfade-spend-1",
  save: "/assets/8F68982B-ED7B-494D-A763-0D5AEA20ED21.png?v=single-crossfade-save-1"
};

const intro: Step[] = [
  { speaker: "Narrador", text: "Léo acordou em um dia ensolarado e muito gostoso para brincar lá fora.", focus: "sunny-room", scene: "intro" },
  { speaker: "Narrador", text: "A luz entrava pela janela, e o quarto parecia cheio de possibilidades.", focus: "sunny-room", scene: "intro" },
  { speaker: "Narrador", text: "Então Léo levantou da cama, se trocou e olhou ao redor do quarto.", focus: "leo-bed", scene: "intro" },
  { speaker: "Narrador", text: "Foi aí que ele viu uma moedinha brilhando perto dele.", focus: "leo-bed", scene: "intro" },
  { speaker: "Léo", text: "Uau... será que essa moedinha pode me ajudar a chegar mais perto do meu sonho?", focus: "coin-close", scene: "intro" },
  { speaker: "Narrador", text: "O que Léo deve fazer com a moedinha?", focus: "coin-close", scene: "intro" }
];

const endings: Record<Branch, Step[]> = {
  save: [
    { speaker: "Léo", text: "Vou guardar! Assim fico mais perto do meu sonho.", focus: "save-main", scene: "save" },
    { speaker: "Narrador", text: "Léo colocou a moedinha no porquinho azul com muito cuidado.", focus: "save-main", scene: "save" },
    { speaker: "Narrador", text: "Guardar um pouco de cada vez é uma forma inteligente de fazer sonhos crescerem.", focus: "save-main", scene: "save" }
  ],
  spend: [
    { speaker: "Léo", text: "Vou sair do quarto e gastar essa moedinha!", focus: "spend-main", scene: "spend" },
    { speaker: "Narrador", text: "Léo saiu animado, pensando no que poderia comprar naquele momento.", focus: "spend-main", scene: "spend" },
    { speaker: "Narrador", text: "Mas gastar agora pode afastar um pouquinho os sonhos maiores.", focus: "spend-main", scene: "spend" }
  ]
};

const camera: Record<string, Camera> = {
  "far-room": { x: 0, y: 0, scale: 0.3, glowX: 48, glowY: 42 },
  "sunny-room": { x: 1, y: 1, scale: 1.01, glowX: 18, glowY: 25 },
  "leo-bed": { x: -3, y: -2, scale: 1.05, glowX: 47, glowY: 50 },
  "coin-close": { x: -8, y: -4, scale: 1.12, glowX: 58, glowY: 58 },
  "save-main": { x: -3, y: -3, scale: 1.08, glowX: 55, glowY: 55 },
  "spend-main": { x: -8, y: -3, scale: 1.08, glowX: 74, glowY: 45 }
};

const CROSSFADE_MS = 1200;
const PHRASE_FADE_MS = 460;

function cameraTransform(cam: Camera) {
  return `translate(${cam.x}%, ${cam.y}%) scale(${cam.scale})`;
}

export function GameCanvasReal() {
  const [started, setStarted] = useState(false);
  const [cinematicIntro, setCinematicIntro] = useState(false);
  const [introMoveStarted, setIntroMoveStarted] = useState(false);
  const [index, setIndex] = useState(0);
  const [renderedIndex, setRenderedIndex] = useState(0);
  const [branch, setBranch] = useState<Branch | null>(null);
  const [displayScene, setDisplayScene] = useState<SceneKey>("intro");
  const [transitioning, setTransitioning] = useState(false);
  const [phraseChanging, setPhraseChanging] = useState(false);
  const [choicesVisible, setChoicesVisible] = useState(false);
  const [incomingScene, setIncomingScene] = useState<SceneKey | null>(null);
  const [incomingVisible, setIncomingVisible] = useState(false);
  const [outgoingCamera, setOutgoingCamera] = useState<Camera | null>(null);
  const [incomingCamera, setIncomingCamera] = useState<Camera | null>(null);

  const steps = useMemo(() => (branch ? [...intro, ...endings[branch]] : intro), [branch]);
  const step = steps[index] ?? steps[steps.length - 1];
  const renderedStep = steps[renderedIndex] ?? step;
  const isChoice = !branch && renderedIndex === intro.length - 1;
  const isLast = renderedIndex >= steps.length - 1;

  const normalCam = camera[step.focus] ?? camera["far-room"];
  const introCam = introMoveStarted ? camera["sunny-room"] : camera["far-room"];
  const activeCamera = cinematicIntro ? introCam : started ? normalCam : camera["far-room"];
  const baseCamera = outgoingCamera ?? activeCamera;
  const nextCamera = incomingCamera ?? activeCamera;
  const shouldHideDialogue = !started || cinematicIntro || transitioning;

  useEffect(() => {
    if (!isChoice || shouldHideDialogue || phraseChanging) {
      setChoicesVisible(false);
      return;
    }

    setChoicesVisible(false);
    const timer = window.setTimeout(() => setChoicesVisible(true), 1000);
    return () => window.clearTimeout(timer);
  }, [isChoice, shouldHideDialogue, phraseChanging, renderedIndex]);

  function startStory() {
    setStarted(true);
    setCinematicIntro(true);
    setIntroMoveStarted(false);
    window.setTimeout(() => setIntroMoveStarted(true), 1000);
    window.setTimeout(() => {
      setRenderedIndex(0);
      setIndex(0);
      setCinematicIntro(false);
    }, 4600);
  }

  function changePhrase(nextIndex: number) {
    if (phraseChanging || transitioning) return;
    setPhraseChanging(true);
    window.setTimeout(() => {
      setIndex(nextIndex);
      setRenderedIndex(nextIndex);
      window.setTimeout(() => setPhraseChanging(false), PHRASE_FADE_MS);
    }, PHRASE_FADE_MS);
  }

  function next() {
    if (!started) {
      startStory();
      return;
    }
    if (cinematicIntro || transitioning || phraseChanging) return;
    changePhrase(Math.min(renderedIndex + 1, steps.length - 1));
  }

  function finishTransition(targetScene: SceneKey, targetBranch: Branch | null, targetIndex: number) {
    setDisplayScene(targetScene);
    setBranch(targetBranch);
    setIndex(targetIndex);
    setRenderedIndex(targetIndex);
    setPhraseChanging(false);
    setChoicesVisible(false);
    setIncomingVisible(false);
    setIncomingScene(null);
    setTransitioning(false);
    setOutgoingCamera(null);
    setIncomingCamera(null);
  }

  function restart() {
    if (transitioning) return;
    const targetCam = camera["far-room"];
    setOutgoingCamera(activeCamera);
    setIncomingCamera(targetCam);
    setIncomingScene("intro");
    setIncomingVisible(false);
    setTransitioning(true);
    setChoicesVisible(false);
    window.setTimeout(() => setIncomingVisible(true), 40);
    window.setTimeout(() => {
      setStarted(false);
      setCinematicIntro(false);
      setIntroMoveStarted(false);
      finishTransition("intro", null, 0);
    }, CROSSFADE_MS + 80);
  }

  function choose(nextBranch: Branch) {
    if (transitioning || !choicesVisible) return;
    const targetCam = nextBranch === "save" ? camera["save-main"] : camera["spend-main"];
    setOutgoingCamera(activeCamera);
    setIncomingCamera(targetCam);
    setIncomingScene(nextBranch);
    setIncomingVisible(false);
    setTransitioning(true);
    setChoicesVisible(false);
    window.setTimeout(() => setIncomingVisible(true), 40);
    window.setTimeout(() => finishTransition(nextBranch, nextBranch, intro.length), CROSSFADE_MS + 80);
  }

  const dialogueClassName = `${styles.dialogueBox} ${styles.dialogueVisible} ${isChoice ? styles.choiceDialogue : ""}`;
  const choicesClassName = `${styles.choices} ${choicesVisible ? styles.choicesVisible : ""}`;

  return (
    <main className={styles.page}>
      <section className={styles.shell}>
        <div className={styles.gameWindow}>
          <div className={styles.canvasWrap} style={{ position: "relative", overflow: "hidden", background: "#081a3b" }}>
            <img
              src={scenes[displayScene]}
              alt=""
              aria-hidden="true"
              style={{
                position: "absolute",
                inset: 0,
                width: "100%",
                height: "100%",
                objectFit: "cover",
                filter: "blur(18px) brightness(0.72)",
                transform: "scale(1.08)",
                opacity: started && !transitioning ? 0.55 : 0,
                transition: "opacity 900ms ease-in-out"
              }}
            />

            <img
              src={scenes[displayScene]}
              alt="Cena atual da história do Léo"
              style={{
                position: "absolute",
                inset: 0,
                width: "100%",
                height: "100%",
                objectFit: baseCamera.scale < 0.75 ? "contain" : "cover",
                opacity: !started ? 0 : incomingVisible ? 0 : 1,
                transform: cameraTransform(baseCamera),
                transformOrigin: "center center",
                transition: transitioning
                  ? `opacity ${CROSSFADE_MS}ms ease-in-out`
                  : "transform 3.6s cubic-bezier(0.22, 1, 0.36, 1), opacity 900ms ease-in-out"
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
                  objectFit: nextCamera.scale < 0.75 ? "contain" : "cover",
                  opacity: incomingVisible ? 1 : 0,
                  transform: cameraTransform(nextCamera),
                  transformOrigin: "center center",
                  transition: `opacity ${CROSSFADE_MS}ms ease-in-out`
                }}
              />
            )}

            <div style={{ position: "absolute", left: `${baseCamera.glowX}%`, top: `${baseCamera.glowY}%`, width: 150, height: 150, borderRadius: 999, background: "rgba(255, 239, 143, 0.3)", filter: "blur(14px)", opacity: !started ? 0 : transitioning ? 0.3 : 1, transform: "translate(-50%, -50%)", transition: transitioning ? `opacity ${CROSSFADE_MS}ms ease-in-out` : "left 3.6s cubic-bezier(0.22, 1, 0.36, 1), top 3.6s cubic-bezier(0.22, 1, 0.36, 1), opacity 900ms ease-in-out" }} />
          </div>

          <div className={styles.cinematicFade} />
          <div className={styles.sunRay} />
          <div className={styles.hudTopLeft}><span>{cinematicIntro ? "Manhã" : `Cena ${Math.min(renderedIndex + 1, steps.length)}/${steps.length}`}</span></div>
          <div className={styles.hudTopRight}><button aria-label="Reiniciar" onClick={restart}>↺</button></div>

          {!shouldHideDialogue && (
            <div className={dialogueClassName}>
              <div className={styles.namePlate}>{renderedStep.speaker}</div>
              <p className={`${styles.phraseText} ${phraseChanging ? styles.phraseChanging : ""}`}>{renderedStep.text}</p>
              {isChoice ? (
                <div className={choicesClassName}>
                  <button disabled={!choicesVisible} onClick={() => choose("save")}>Guardar para o sonho</button>
                  <button disabled={!choicesVisible} onClick={() => choose("spend")}>Gastar agora</button>
                </div>
              ) : (
                <button aria-label="Próxima fala" className={styles.coinNextButton} onClick={isLast ? restart : next}></button>
              )}
            </div>
          )}

          {!started && (
            <div className={styles.startOverlay}>
              <div className={styles.startCard}>
                <span>Uma história interativa</span>
                <h2>A Moedinha de Léo</h2>
                <p>Um dia ensolarado, uma manhã calma e uma escolha importante.</p>
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
