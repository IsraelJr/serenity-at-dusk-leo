"use client";

import { useEffect, useMemo, useRef, useState } from "react";
import styles from "./GameCanvas.module.css";

type Branch = "save" | "spend";
type SceneKey = "intro" | "save" | "spend";

type Step = { speaker: string; text: string; focus: string; scene: SceneKey };
type Camera = { x: number; y: number; scale: number; glowX: number; glowY: number };
type AudioWindow = Window & typeof globalThis & { webkitAudioContext?: typeof AudioContext };

const scenes: Record<SceneKey, string> = {
  intro: "/assets/D5C982C9-ECC5-4402-931B-CCB79367D38D.png?v=real-upload-6",
  spend: "/assets/2231B40B-39F3-4E29-B7B0-F667C01E3E4B.png?v=spend-5",
  save: "/assets/8F68982B-ED7B-494D-A763-0D5AEA20ED21.png?v=save-5"
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
    { speaker: "Narrador", text: "Guardar um pouco de cada vez é uma forma inteligente de fazer sonhos crescerem.", focus: "save-soft", scene: "save" }
  ],
  spend: [
    { speaker: "Léo", text: "Vou sair do quarto e gastar essa moedinha!", focus: "spend-main", scene: "spend" },
    { speaker: "Narrador", text: "Léo saiu animado, pensando no que poderia comprar naquele momento.", focus: "spend-main", scene: "spend" },
    { speaker: "Narrador", text: "Mas gastar agora pode afastar um pouquinho os sonhos maiores.", focus: "spend-soft", scene: "spend" }
  ]
};

const camera: Record<string, Camera> = {
  "silent-open": { x: 0, y: 0, scale: 1, glowX: 52, glowY: 48 },
  "silent-window": { x: 2, y: 1, scale: 1.055, glowX: 18, glowY: 25 },
  "sunny-room": { x: 2, y: 1, scale: 1.055, glowX: 18, glowY: 25 },
  "leo-bed": { x: -4, y: -2, scale: 1.08, glowX: 47, glowY: 50 },
  "coin-close": { x: -9, y: -4, scale: 1.15, glowX: 58, glowY: 58 },
  "save-main": { x: -3, y: -3, scale: 1.1, glowX: 55, glowY: 55 },
  "save-soft": { x: -2, y: -2, scale: 1.07, glowX: 57, glowY: 55 },
  "spend-main": { x: -8, y: -3, scale: 1.1, glowX: 74, glowY: 45 },
  "spend-soft": { x: -7, y: -3, scale: 1.08, glowX: 76, glowY: 45 }
};

function playBird(context: AudioContext, output: GainNode) {
  const now = context.currentTime;
  const osc = context.createOscillator();
  const gain = context.createGain();
  const frequency = 1450 + Math.random() * 850;
  osc.type = "sine";
  osc.frequency.setValueAtTime(frequency, now);
  osc.frequency.exponentialRampToValueAtTime(frequency * 1.35, now + 0.09);
  osc.frequency.exponentialRampToValueAtTime(frequency * 0.9, now + 0.22);
  gain.gain.setValueAtTime(0.0001, now);
  gain.gain.exponentialRampToValueAtTime(0.045, now + 0.025);
  gain.gain.exponentialRampToValueAtTime(0.0001, now + 0.3);
  osc.connect(gain).connect(output);
  osc.start(now);
  osc.stop(now + 0.32);
}

export function GameCanvasReal() {
  const [started, setStarted] = useState(false);
  const [cinematicIntro, setCinematicIntro] = useState(false);
  const [silentFocus, setSilentFocus] = useState("silent-open");
  const [index, setIndex] = useState(0);
  const [branch, setBranch] = useState<Branch | null>(null);
  const [transitioning, setTransitioning] = useState(false);
  const [displayScene, setDisplayScene] = useState<SceneKey>("intro");
  const [incomingScene, setIncomingScene] = useState<SceneKey | null>(null);
  const [incomingVisible, setIncomingVisible] = useState(false);
  const [transitionKind, setTransitionKind] = useState<Branch | "restart" | null>(null);
  const audioContextRef = useRef<AudioContext | null>(null);
  const audioGainRef = useRef<GainNode | null>(null);
  const birdTimerRef = useRef<number | null>(null);

  const steps = useMemo(() => (branch ? [...intro, ...endings[branch]] : intro), [branch]);
  const step = steps[index] ?? steps[steps.length - 1];
  const isChoice = step.focus === "coin-close" && !branch && index === intro.length - 1;
  const isLast = index >= steps.length - 1;
  const cam = camera[cinematicIntro ? silentFocus : step.focus] ?? camera["silent-open"];
  const incomingCam = transitionKind === "save" ? camera["save-main"] : transitionKind === "spend" ? camera["spend-main"] : camera["silent-open"];
  const transitionMs = transitionKind === "spend" ? 1150 : 900;

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
      gain.gain.setValueAtTime(0.18, context.currentTime);
      gain.connect(context.destination);
      audioContextRef.current = context;
      audioGainRef.current = gain;
      playBird(context, gain);
      birdTimerRef.current = window.setInterval(() => {
        if (audioContextRef.current && audioGainRef.current) playBird(audioContextRef.current, audioGainRef.current);
      }, 2100);
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
    setSilentFocus("silent-open");
    startBirds();
    window.setTimeout(() => setSilentFocus("silent-window"), 900);
    window.setTimeout(() => setCinematicIntro(false), 3200);
  }

  function next() {
    if (!started) {
      startStory();
      return;
    }
    if (cinematicIntro) return;
    setIndex((current) => Math.min(current + 1, steps.length - 1));
  }

  function restart() {
    setTransitionKind("restart");
    setIncomingScene("intro");
    setIncomingVisible(false);
    setTransitioning(true);
    window.setTimeout(() => setIncomingVisible(true), 40);
    window.setTimeout(() => {
      setStarted(false);
      setCinematicIntro(false);
      setSilentFocus("silent-open");
      setIndex(0);
      setBranch(null);
      setDisplayScene("intro");
      setIncomingScene(null);
      setIncomingVisible(false);
      setTransitioning(false);
      setTransitionKind(null);
      stopBirds();
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
      window.setTimeout(() => {
        setIncomingScene(null);
        setIncomingVisible(false);
        setTransitioning(false);
        setTransitionKind(null);
      }, 80);
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
                opacity: transitioning && incomingScene ? 0.9 : 1,
                transform: `translate(${cam.x}%, ${cam.y}%) scale(${transitioning ? Math.max(1.02, cam.scale * 1.02) : cam.scale})`,
                transformOrigin: "center center",
                transition: `transform 2.1s ease-in-out, opacity ${transitionMs}ms ease-in-out, filter ${transitionMs}ms ease-in-out`,
                filter: transitioning ? "blur(1.5px) brightness(0.86)" : "blur(0) brightness(1)"
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
                    ? `translate(${incomingCam.x}%, ${incomingCam.y}%) scale(${incomingCam.scale})`
                    : transitionKind === "spend"
                      ? `translate(${incomingCam.x + 3}%, ${incomingCam.y}%) scale(${incomingCam.scale + 0.03})`
                      : `translate(${incomingCam.x}%, ${incomingCam.y + 1}%) scale(${incomingCam.scale + 0.03})`,
                  transformOrigin: "center center",
                  transition: `opacity ${transitionMs}ms ease-in-out, transform ${transitionMs}ms ease-in-out, filter ${transitionMs}ms ease-in-out`,
                  filter: incomingVisible ? "blur(0) brightness(1)" : "blur(4px) brightness(0.76)"
                }}
              />
            )}

            <div style={{ position: "absolute", left: `${cam.glowX}%`, top: `${cam.glowY}%`, width: 120, height: 120, borderRadius: 999, background: "rgba(255, 242, 160, 0.34)", filter: "blur(10px)", opacity: transitioning ? 0.35 : 1, transform: "translate(-50%, -50%)", transition: "left 2.1s ease, top 2.1s ease, opacity 0.45s ease" }} />
            <div aria-hidden="true" style={{ position: "absolute", inset: 0, pointerEvents: "none", background: transitionKind === "spend" ? "linear-gradient(90deg, rgba(255,205,95,0.2), rgba(3,10,28,0.4), rgba(255,205,95,0.13))" : "radial-gradient(circle at center, rgba(255,230,130,0.22), rgba(3,10,28,0.42))", opacity: transitioning ? 1 : 0, transition: `opacity ${transitionMs}ms ease-in-out` }} />
          </div>

          <div className={styles.cinematicFade} />
          <div className={styles.sunRay} />
          <div className={styles.hudTopLeft}><span>{cinematicIntro ? "Manhã" : `Cena ${Math.min(index + 1, steps.length)}/${steps.length}`}</span></div>
          <div className={styles.hudTopRight}><button aria-label="Reiniciar" onClick={restart}>↺</button></div>

          {!cinematicIntro && (
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

          <div aria-hidden="true" style={{ display: "none" }}><img src={scenes.intro} alt="" /><img src={scenes.save} alt="" /><img src={scenes.spend} alt="" /></div>
        </div>
      </section>
    </main>
  );
}
