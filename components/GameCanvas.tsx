"use client";

import { Container, Graphics, Stage } from "@pixi/react";
import { BlurFilter } from "pixi.js";
import { useEffect, useMemo, useRef, useState } from "react";
import { gsap } from "gsap";
import styles from "./GameCanvas.module.css";

type FocusTarget = "room" | "window" | "leo" | "drawer" | "coin";
type BranchKey = "save" | "spend";

type DialogueStep = {
  id: string;
  speaker: string;
  text: string;
  focus: FocusTarget;
};

type AudioWindow = Window & typeof globalThis & { webkitAudioContext?: typeof AudioContext };

const introSteps: DialogueStep[] = [
  { id: "wake", speaker: "Narrador", text: "O sol entrou devagar no quarto de Léo, iluminando seu cantinho favorito.", focus: "room" },
  { id: "window", speaker: "Narrador", text: "Com o canto dos pássaros pela manhã, tudo parecia calmo e cheio de possibilidades.", focus: "window" },
  { id: "leo", speaker: "Narrador", text: "Léo percebeu uma moedinha brilhando perto dele e abriu um sorriso de curiosidade.", focus: "leo" },
  { id: "coin", speaker: "Léo", text: "Uau... será que essa moedinha pode me ajudar a chegar mais perto do meu sonho?", focus: "coin" },
  { id: "choice", speaker: "Narrador", text: "O que Léo deve fazer com a moedinha?", focus: "coin" }
];

const branchSteps: Record<BranchKey, DialogueStep[]> = {
  save: [
    { id: "save-1", speaker: "Léo", text: "Vou guardar! Cada moedinha me deixa mais perto da minha bicicleta.", focus: "leo" },
    { id: "save-2", speaker: "Narrador", text: "Léo colocou a moedinha no lugar certo e sentiu orgulho por pensar no futuro.", focus: "drawer" },
    { id: "save-3", speaker: "Narrador", text: "Pouco a pouco, guardar virou parte do caminho para realizar um sonho maior.", focus: "room" }
  ],
  spend: [
    { id: "spend-1", speaker: "Léo", text: "Talvez eu possa comprar alguma coisa agora... isso seria divertido.", focus: "leo" },
    { id: "spend-2", speaker: "Narrador", text: "Mas Léo percebeu que gastar agora pode deixar o sonho da bicicleta mais distante.", focus: "coin" },
    { id: "spend-3", speaker: "Narrador", text: "Ele entendeu que pequenas escolhas mudam o tempo que um sonho leva para acontecer.", focus: "room" }
  ]
};

const focusMap: Record<FocusTarget, { x: number; y: number; scale: number }> = {
  room: { x: 0, y: 0, scale: 1 },
  window: { x: 24, y: 4, scale: 1.07 },
  leo: { x: -70, y: -18, scale: 1.12 },
  drawer: { x: -106, y: -28, scale: 1.14 },
  coin: { x: -122, y: -10, scale: 1.18 }
};

function playBirdChirp(context: AudioContext, destination: GainNode) {
  const now = context.currentTime;
  const oscillator = context.createOscillator();
  const gain = context.createGain();
  const startFrequency = 1450 + Math.random() * 900;

  oscillator.type = "sine";
  oscillator.frequency.setValueAtTime(startFrequency, now);
  oscillator.frequency.exponentialRampToValueAtTime(startFrequency * 1.38, now + 0.08);
  oscillator.frequency.exponentialRampToValueAtTime(startFrequency * 0.86, now + 0.22);

  gain.gain.setValueAtTime(0.0001, now);
  gain.gain.exponentialRampToValueAtTime(0.055, now + 0.025);
  gain.gain.exponentialRampToValueAtTime(0.0001, now + 0.32);

  oscillator.connect(gain).connect(destination);
  oscillator.start(now);
  oscillator.stop(now + 0.34);
}

export function GameCanvas() {
  const [stepIndex, setStepIndex] = useState(0);
  const [started, setStarted] = useState(false);
  const [selectedChoice, setSelectedChoice] = useState<BranchKey | null>(null);
  const [muted, setMuted] = useState(false);
  const camera = useRef({ x: 0, y: 0, scale: 1 });
  const [, forceRender] = useState(0);
  const audioContextRef = useRef<AudioContext | null>(null);
  const masterGainRef = useRef<GainNode | null>(null);
  const birdTimerRef = useRef<number | null>(null);

  const activeSteps = useMemo(() => (selectedChoice ? [...introSteps, ...branchSteps[selectedChoice]] : introSteps), [selectedChoice]);
  const step = activeSteps[stepIndex] ?? activeSteps[activeSteps.length - 1];
  const isChoiceStep = step.id === "choice";
  const isLastStep = stepIndex >= activeSteps.length - 1;

  const dust = useMemo(
    () => Array.from({ length: 42 }, (_, index) => ({
      id: index,
      left: 6 + ((index * 37) % 88),
      top: 7 + ((index * 53) % 70),
      size: 2 + (index % 5),
      delay: (index % 9) * 0.45,
      duration: 5.5 + (index % 6) * 0.45
    })),
    []
  );

  useEffect(() => {
    const target = focusMap[step.focus];
    gsap.to(camera.current, {
      x: target.x,
      y: target.y,
      scale: target.scale,
      duration: 1.35,
      ease: "power2.inOut",
      onUpdate: () => forceRender((value) => value + 1)
    });
  }, [step]);

  useEffect(() => {
    return () => stopAmbientSound();
  }, []);

  useEffect(() => {
    const context = audioContextRef.current;
    const masterGain = masterGainRef.current;
    if (context && masterGain) masterGain.gain.setTargetAtTime(muted ? 0 : 0.18, context.currentTime, 0.08);
  }, [muted]);

  function startAmbientSound() {
    if (audioContextRef.current) return;
    try {
      const AudioContextClass = window.AudioContext || (window as AudioWindow).webkitAudioContext;
      if (!AudioContextClass) return;

      const context = new AudioContextClass();
      const masterGain = context.createGain();
      masterGain.gain.setValueAtTime(muted ? 0 : 0.18, context.currentTime);
      masterGain.connect(context.destination);
      audioContextRef.current = context;
      masterGainRef.current = masterGain;

      playBirdChirp(context, masterGain);
      birdTimerRef.current = window.setInterval(() => {
        if (audioContextRef.current && masterGainRef.current) playBirdChirp(audioContextRef.current, masterGainRef.current);
      }, 2450);
    } catch {
      audioContextRef.current = null;
      masterGainRef.current = null;
    }
  }

  function stopAmbientSound() {
    if (birdTimerRef.current !== null) {
      window.clearInterval(birdTimerRef.current);
      birdTimerRef.current = null;
    }
    masterGainRef.current = null;
    audioContextRef.current?.close();
    audioContextRef.current = null;
  }

  function start() {
    setStarted(true);
    startAmbientSound();
  }

  function next() {
    if (!started) {
      start();
      return;
    }
    if (isChoiceStep && !selectedChoice) return;
    setStepIndex((current) => Math.min(current + 1, activeSteps.length - 1));
  }

  function restart() {
    setStepIndex(0);
    setSelectedChoice(null);
    setStarted(false);
    stopAmbientSound();
  }

  function choose(choice: BranchKey) {
    setSelectedChoice(choice);
  }

  const cameraTransform = `translate(${camera.current.x}px, ${camera.current.y}px) scale(${camera.current.scale})`;

  return (
    <main className={styles.page}>
      <section className={styles.shell}>
        <div className={styles.gameWindow}>
          <div className={styles.canvasWrap} style={{ position: "relative", overflow: "hidden" }}>
            <img
              src="/assets/leo-room-scene.jpg"
              alt="Quarto do Léo pela manhã"
              style={{
                position: "absolute",
                inset: 0,
                width: "100%",
                height: "100%",
                objectFit: "cover",
                transform: cameraTransform,
                transformOrigin: "center center",
                transition: "filter 0.4s ease"
              }}
            />
            <div style={{ position: "absolute", inset: 0, pointerEvents: "none" }}>
              <Stage width={960} height={540} options={{ backgroundAlpha: 0, antialias: true }}>
                <Container x={camera.current.x} y={camera.current.y} scale={camera.current.scale}>
                  <Container x={566} y={330}>
                    <Graphics
                      filters={[new BlurFilter(5)]}
                      draw={(g) => {
                        g.clear();
                        const isFocused = step.focus === "coin" || step.focus === "drawer";
                        g.beginFill(0xfff2a0, isFocused ? 0.34 : 0.18);
                        g.drawCircle(0, 0, isFocused ? 76 : 54);
                        g.endFill();
                      }}
                    />
                    <Graphics
                      draw={(g) => {
                        g.clear();
                        const pulse = step.focus === "coin" || step.focus === "drawer" ? 1 : 0.52;
                        g.beginFill(0xfff2a0, 0.24 * pulse);
                        g.drawCircle(0, 0, 42);
                        g.endFill();
                      }}
                    />
                  </Container>
                </Container>
              </Stage>
            </div>
          </div>

          <div className={styles.cinematicFade} />
          <div className={styles.sunRay} />
          <div className={styles.dustLayer} aria-hidden="true">
            {dust.map((particle) => (
              <span key={particle.id} style={{ left: `${particle.left}%`, top: `${particle.top}%`, width: `${particle.size}px`, height: `${particle.size}px`, animationDelay: `${particle.delay}s`, animationDuration: `${particle.duration}s` }} />
            ))}
          </div>

          <div className={styles.hudTopLeft}><span>Cena {Math.min(stepIndex + 1, activeSteps.length)}/{activeSteps.length}</span></div>
          <div className={styles.hudTopRight}>
            <button aria-label="Som" onClick={() => setMuted((current) => !current)}>{muted ? "×" : "♪"}</button>
            <button aria-label="Reiniciar" onClick={restart}>↺</button>
          </div>

          <div className={`${styles.dialogueBox} ${started ? styles.dialogueVisible : ""}`}>
            <div className={styles.namePlate}>{step.speaker}</div>
            <p>{step.text}</p>

            {isChoiceStep && !selectedChoice ? (
              <div className={styles.choices}>
                <button onClick={() => choose("save")}>Guardar para o sonho</button>
                <button onClick={() => choose("spend")}>Gastar agora</button>
              </div>
            ) : (
              <button className={styles.nextButton} onClick={isLastStep ? restart : next}>{isLastStep ? "↺" : started ? "➜" : "▶"}</button>
            )}
          </div>

          {!started && (
            <div className={styles.startOverlay}>
              <div className={styles.startCard}>
                <span>Uma história interativa</span>
                <h2>A Moedinha de Léo</h2>
                <p>Agora com o quarto do Léo em cena e sequência diferente conforme a escolha do jogador.</p>
                <button onClick={start}>Iniciar jornada</button>
              </div>
            </div>
          )}
        </div>
      </section>
    </main>
  );
}
