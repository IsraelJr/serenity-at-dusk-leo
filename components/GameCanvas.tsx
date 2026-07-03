"use client";

import { Container, Graphics, Sprite, Stage } from "@pixi/react";
import { BlurFilter } from "pixi.js";
import { useEffect, useMemo, useRef, useState } from "react";
import { gsap } from "gsap";
import styles from "./GameCanvas.module.css";

type DialogueStep = {
  id: string;
  speaker: string;
  text: string;
  focus: "room" | "window" | "leo" | "drawer" | "coin";
};

type AudioWindow = Window & typeof globalThis & { webkitAudioContext?: typeof AudioContext };

const steps: DialogueStep[] = [
  { id: "wake", speaker: "Narrador", text: "O sol entrou bem devagar no quarto de Léo.", focus: "window" },
  { id: "leo", speaker: "Narrador", text: "Léo abriu os olhos e sentiu que aquele dia tinha algo diferente.", focus: "leo" },
  { id: "drawer", speaker: "Narrador", text: "Perto da cama, uma pequena moedinha parecia esperar por ele.", focus: "drawer" },
  { id: "coin", speaker: "Léo", text: "Uau... por que ela está brilhando?", focus: "coin" },
  { id: "choice", speaker: "Narrador", text: "A moedinha fez uma pergunta silenciosa: o que você quer fazer hoje?", focus: "coin" }
];

const focusMap = {
  room: { x: 0, y: 0, scale: 1 },
  window: { x: 0, y: 10, scale: 1.08 },
  leo: { x: -82, y: -30, scale: 1.16 },
  drawer: { x: -126, y: -42, scale: 1.18 },
  coin: { x: -230, y: -70, scale: 1.28 }
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
  const [selectedChoice, setSelectedChoice] = useState<string | null>(null);
  const [muted, setMuted] = useState(false);
  const camera = useRef({ x: 0, y: 0, scale: 1 });
  const [, forceRender] = useState(0);
  const audioContextRef = useRef<AudioContext | null>(null);
  const masterGainRef = useRef<GainNode | null>(null);
  const birdTimerRef = useRef<number | null>(null);

  const step = steps[stepIndex];
  const isChoiceStep = step.id === "choice";

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
      duration: 1.55,
      ease: "power2.inOut",
      onUpdate: () => forceRender((value) => value + 1)
    });
  }, [step.focus]);

  useEffect(() => {
    return () => stopAmbientSound();
  }, []);

  useEffect(() => {
    const context = audioContextRef.current;
    const masterGain = masterGainRef.current;
    if (context && masterGain) {
      masterGain.gain.setTargetAtTime(muted ? 0 : 0.18, context.currentTime, 0.08);
    }
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
        if (audioContextRef.current && masterGainRef.current) {
          playBirdChirp(audioContextRef.current, masterGainRef.current);
        }
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
    if (isChoiceStep) return;
    setStepIndex((current) => Math.min(current + 1, steps.length - 1));
  }

  function restart() {
    setStepIndex(0);
    setSelectedChoice(null);
    setStarted(false);
    stopAmbientSound();
  }

  function choose(choice: string) {
    setSelectedChoice(choice);
  }

  return (
    <main className={styles.page}>
      <section className={styles.shell}>
        <div className={styles.gameWindow}>
          <div className={styles.canvasWrap}>
            <Stage width={960} height={540} options={{ backgroundColor: 0x071c45, antialias: true }}>
              <Container x={camera.current.x} y={camera.current.y} scale={camera.current.scale}>
                <Sprite image="/assets/leo-room-scene.jpg" width={960} height={540} />

                <Container x={575} y={214}>
                  <Graphics
                    filters={[new BlurFilter(4)]}
                    draw={(g) => {
                      g.clear();
                      const isFocused = step.focus === "coin" || step.focus === "drawer";
                      g.beginFill(0xfff2a0, isFocused ? 0.34 : 0.18);
                      g.drawCircle(0, 0, isFocused ? 82 : 58);
                      g.endFill();
                    }}
                  />
                  <Graphics
                    draw={(g) => {
                      g.clear();
                      const pulse = step.focus === "coin" || step.focus === "drawer" ? 1 : 0.52;
                      g.beginFill(0xfff2a0, 0.24 * pulse);
                      g.drawCircle(0, 0, 44);
                      g.endFill();
                    }}
                  />
                </Container>
              </Container>
            </Stage>
          </div>

          <div className={styles.cinematicFade} />
          <div className={styles.sunRay} />
          <div className={styles.dustLayer} aria-hidden="true">
            {dust.map((particle) => (
              <span key={particle.id} style={{ left: `${particle.left}%`, top: `${particle.top}%`, width: `${particle.size}px`, height: `${particle.size}px`, animationDelay: `${particle.delay}s`, animationDuration: `${particle.duration}s` }} />
            ))}
          </div>

          <div className={styles.hudTopLeft}><span>Cena {stepIndex + 1}/5</span></div>
          <div className={styles.hudTopRight}>
            <button aria-label="Som" onClick={() => setMuted((current) => !current)}>{muted ? "×" : "♪"}</button>
            <button aria-label="Reiniciar" onClick={restart}>↺</button>
          </div>

          <div className={`${styles.dialogueBox} ${started ? styles.dialogueVisible : ""}`}>
            <div className={styles.namePlate}>{step.speaker}</div>
            <p key={selectedChoice ?? step.id}>{selectedChoice ? `Léo escolheu: ${selectedChoice}. Essa consequência entra na próxima etapa.` : step.text}</p>

            {isChoiceStep && !selectedChoice ? (
              <div className={styles.choices}>
                <button onClick={() => choose("guardar para o sonho")}>Guardar para o sonho</button>
                <button onClick={() => choose("comprar algo agora")}>Comprar algo agora</button>
              </div>
            ) : (
              <button className={styles.nextButton} onClick={next}>{started ? "➜" : "▶"}</button>
            )}
          </div>

          {!started && (
            <div className={styles.startOverlay}>
              <div className={styles.startCard}>
                <span>Uma história interativa</span>
                <h2>A Moedinha Brilhante</h2>
                <p>Uma cena jogável para validar atmosfera, câmera, texto, brilho e interface.</p>
                <button onClick={start}>Iniciar jornada</button>
              </div>
            </div>
          )}
        </div>
      </section>
    </main>
  );
}
