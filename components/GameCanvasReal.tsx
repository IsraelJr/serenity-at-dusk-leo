"use client";

import { useEffect, useMemo, useRef, useState } from "react";
import styles from "./GameCanvas.module.css";

type Branch = "save" | "spend";
type SceneKey = "intro" | "save" | "spend";
type Step = { speaker: string; text: string; focus: string; scene: SceneKey };
type Camera = { x: number; y: number; scale: number; glowX: number; glowY: number };
type AudioWindow = Window & typeof globalThis & { webkitAudioContext?: typeof AudioContext };

const scenes: Record<SceneKey, string> = {
  intro: "/assets/D5C982C9-ECC5-4402-931B-CCB79367D38D.png?v=calm-intro-1",
  spend: "/assets/2231B40B-39F3-4E29-B7B0-F667C01E3E4B.png?v=calm-spend-1",
  save: "/assets/8F68982B-ED7B-494D-A763-0D5AEA20ED21.png?v=calm-save-1"
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
  "far-room": { x: 0, y: 0, scale: 0.92, glowX: 48, glowY: 42 },
  "open-room": { x: 0, y: 0, scale: 0.96, glowX: 50, glowY: 45 },
  "sunny-room": { x: 1, y: 1, scale: 1.01, glowX: 18, glowY: 25 },
  "leo-bed": { x: -3, y: -2, scale: 1.05, glowX: 47, glowY: 50 },
  "coin-close": { x: -8, y: -4, scale: 1.12, glowX: 58, glowY: 58 },
  "save-main": { x: -3, y: -3, scale: 1.08, glowX: 55, glowY: 55 },
  "spend-main": { x: -8, y: -3, scale: 1.08, glowX: 74, glowY: 45 }
};

function playSoftBird(context: AudioContext, output: GainNode) {
  const now = context.currentTime;
  const notes = [980 + Math.random() * 260, 1220 + Math.random() * 320, 1080 + Math.random() * 240];

  notes.forEach((frequency, index) => {
    const osc = context.createOscillator();
    const gain = context.createGain();
    const start = now + index * 0.115;

    osc.type = "triangle";
    osc.frequency.setValueAtTime(frequency, start);
    osc.frequency.exponentialRampToValueAtTime(frequency * 1.12, start + 0.055);
    osc.frequency.exponentialRampToValueAtTime(frequency * 0.96, start + 0.16);

    gain.gain.setValueAtTime(0.0001, start);
    gain.gain.exponentialRampToValueAtTime(0.018, start + 0.035);
    gain.gain.exponentialRampToValueAtTime(0.0001, start + 0.24);

    osc.connect(gain).connect(output);
    osc.start(start);
    osc.stop(start + 0.26);
  });
}

export function GameCanvasReal() {
  const [started, setStarted] = useState(false);
  const [cinematicIntro, setCinematicIntro] = useState(false);
  const [introSettled, setIntroSettled] = useState(false);
  const [index, setIndex] = useState(0);
  const [branch, setBranch] = useState<Branch | null>(null);
  const [displayScene, setDisplayScene] = useState<SceneKey>("intro");
  const [transitioning, setTransitioning] = useState(false);
  const [transitionKind, setTransitionKind] = useState<Branch | "restart" | null>(null);
  const [lockedCamera, setLockedCamera] = useState<Camera | null>(null);
  const audioContextRef = useRef<AudioContext | null>(null);
  const audioGainRef = useRef<GainNode | null>(null);
  const birdTimerRef = useRef<number | null>(null);

  const steps = useMemo(() => (branch ? [...intro, ...endings[branch]] : intro), [branch]);
  const step = steps[index] ?? steps[steps.length - 1];
  const isChoice = !branch && index === intro.length - 1;
  const isLast = index >= steps.length - 1;

  const normalCam = camera[step.focus] ?? camera["open-room"];
  const introCam = introSettled ? camera["sunny-room"] : camera["far-room"];
  const cam = lockedCamera ?? (cinematicIntro ? introCam : started ? normalCam : camera["far-room"]);

  useEffect(() => {
    return () => stopBirds();
  }, []);

  function startBirds() {
    if (audioContextRef.current) return;
    try {
      const AudioContextClass = window.AudioContext || (window as AudioWindow).webkitAudioContext;
      if (!AudioContextClass) return;
      const context = new AudioContextClass();
      const gain = context.createGain();
      gain.gain.setValueAtTime(0.11, context.currentTime);
      gain.connect(context.destination);
      audioContextRef.current = context;
      audioGainRef.current = gain;
      window.setTimeout(() => playSoftBird(context, gain), 420);
      birdTimerRef.current = window.setInterval(() => {
        if (audioContextRef.current && audioGainRef.current) playSoftBird(audioContextRef.current, audioGainRef.current);
      }, 3400);
    } catch {
      audioContextRef.current = null;
      audioGainRef.current = null;
    }
  }

  function stopBirds() {
    if (birdTimerRef.current !== null) {
      window.clearInterval(birdTimerRef.current);
      birdTimerRef.current = null;
    }
    audioGainRef.current = null;
    audioContextRef.current?.close();
    audioContextRef.current = null;
  }

  function startStory() {
    setStarted(true);
    setCinematicIntro(true);
    setIntroSettled(false);
    startBirds();
    window.setTimeout(() => setIntroSettled(true), 180);
    window.setTimeout(() => setCinematicIntro(false), 3600);
  }

  function next() {
    if (!started) {
      startStory();
      return;
    }
    if (cinematicIntro || transitioning) return;
    setIndex((current) => Math.min(current + 1, steps.length - 1));
  }

  function restart() {
    if (transitioning) return;
    setTransitionKind("restart");
    setLockedCamera(camera["far-room"]);
    setTransitioning(true);
    window.setTimeout(() => {
      setStarted(false);
      setCinematicIntro(false);
      setIntroSettled(false);
      setIndex(0);
      setBranch(null);
      setDisplayScene("intro");
      stopBirds();
    }, 420);
    window.setTimeout(() => {
      setTransitioning(false);
      setTransitionKind(null);
      setLockedCamera(null);
    }, 980);
  }

  function choose(nextBranch: Branch) {
    if (transitioning) return;
    const targetCamera = nextBranch === "save" ? camera["save-main"] : camera["spend-main"];

    setTransitionKind(nextBranch);
    setLockedCamera(targetCamera);
    setTransitioning(true);

    window.setTimeout(() => {
      setDisplayScene(nextBranch);
      setBranch(nextBranch);
      setIndex(intro.length);
    }, 520);

    window.setTimeout(() => {
      setTransitioning(false);
      setTransitionKind(null);
    }, 1280);

    window.setTimeout(() => setLockedCamera(null), 1500);
  }

  const shouldHideDialogue = !started || cinematicIntro || transitioning;
  const imageTransform = `translate(${cam.x}%, ${cam.y}%) scale(${cam.scale})`;
  const transitionOverlay = transitionKind === "spend"
    ? "linear-gradient(90deg, rgba(255,210,120,0.18), rgba(4,10,26,0.86), rgba(255,210,120,0.12))"
    : "radial-gradient(circle at center, rgba(255,232,145,0.22), rgba(4,10,26,0.86))";

  return (
    <main className={styles.page}>
      <section className={styles.shell}>
        <div className={styles.gameWindow}>
          <div className={styles.canvasWrap} style={{ position: "relative", overflow: "hidden", background: "#081a3b" }}>
            <img
              src={scenes[displayScene]}
              alt="Cena da história do Léo"
              style={{
                position: "absolute",
                inset: 0,
                width: "100%",
                height: "100%",
                objectFit: "cover",
                transform: imageTransform,
                transformOrigin: "center center",
                transition: transitioning ? "none" : "transform 3.4s cubic-bezier(0.22, 1, 0.36, 1), filter 0.5s ease-in-out",
                filter: transitioning ? "brightness(0.72)" : "brightness(1)"
              }}
            />

            <div style={{ position: "absolute", left: `${cam.glowX}%`, top: `${cam.glowY}%`, width: 150, height: 150, borderRadius: 999, background: "rgba(255, 239, 143, 0.3)", filter: "blur(14px)", opacity: transitioning ? 0.12 : 1, transform: "translate(-50%, -50%)", transition: transitioning ? "none" : "left 3.4s cubic-bezier(0.22, 1, 0.36, 1), top 3.4s cubic-bezier(0.22, 1, 0.36, 1), opacity 0.45s ease" }} />

            <div aria-hidden="true" style={{ position: "absolute", inset: 0, pointerEvents: "none", background: transitionOverlay, opacity: transitioning ? 1 : 0, transition: "opacity 0.52s ease-in-out" }} />
          </div>

          <div className={styles.cinematicFade} />
          <div className={styles.sunRay} />
          <div className={styles.hudTopLeft}><span>{cinematicIntro ? "Manhã" : `Cena ${Math.min(index + 1, steps.length)}/${steps.length}`}</span></div>
          <div className={styles.hudTopRight}><button aria-label="Reiniciar" onClick={restart}>↺</button></div>

          {!shouldHideDialogue && (
            <div className={`${styles.dialogueBox} ${styles.dialogueVisible}`}>
              <div className={styles.namePlate}>{step.speaker}</div>
              <p>{step.text}</p>
              {isChoice ? (
                <div className={styles.choices}>
                  <button onClick={() => choose("save")}>Guardar para o sonho</button>
                  <button onClick={() => choose("spend")}>Gastar agora</button>
                </div>
              ) : (
                <button className={styles.nextButton} onClick={isLast ? restart : next}>{isLast ? "↺" : "➜"}</button>
              )}
            </div>
          )}

          {!started && (
            <div className={styles.startOverlay}>
              <div className={styles.startCard}>
                <span>Uma história interativa</span>
                <h2>A Moedinha de Léo</h2>
                <p>Um dia ensolarado, passarinhos cantando e uma escolha importante.</p>
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
