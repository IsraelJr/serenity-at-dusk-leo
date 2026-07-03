"use client";

import { Container, Graphics, Sprite, Stage } from "@pixi/react";
import { BlurFilter } from "pixi.js";
import { useEffect, useRef, useState } from "react";
import { gsap } from "gsap";
import { Howl } from "howler";
import styles from "./GameCanvas.module.css";

type DialogueStep = {
  id: string;
  speaker: string;
  text: string;
  focus: "room" | "window" | "leo" | "drawer" | "coin";
};

const steps: DialogueStep[] = [
  {
    id: "wake",
    speaker: "Narrador",
    text: "O sol entrou bem devagar no quarto de Léo.",
    focus: "window"
  },
  {
    id: "leo",
    speaker: "Narrador",
    text: "Léo abriu os olhos e sentiu que aquele dia tinha algo diferente.",
    focus: "leo"
  },
  {
    id: "drawer",
    speaker: "Narrador",
    text: "Perto da cama, uma pequena moedinha parecia esperar por ele.",
    focus: "drawer"
  },
  {
    id: "coin",
    speaker: "Léo",
    text: "Uau... por que ela está brilhando?",
    focus: "coin"
  },
  {
    id: "choice",
    speaker: "Narrador",
    text: "A moedinha fez uma pergunta silenciosa: o que você quer fazer hoje?",
    focus: "coin"
  }
];

const focusMap = {
  room: { x: 0, y: 0, scale: 1 },
  window: { x: -42, y: 12, scale: 1.08 },
  leo: { x: -96, y: -28, scale: 1.16 },
  drawer: { x: -150, y: -42, scale: 1.18 },
  coin: { x: -235, y: -80, scale: 1.28 }
};

export function GameCanvas() {
  const [stepIndex, setStepIndex] = useState(0);
  const [started, setStarted] = useState(false);
  const [selectedChoice, setSelectedChoice] = useState<string | null>(null);
  const camera = useRef({ x: 0, y: 0, scale: 1 });
  const [, forceRender] = useState(0);
  const soundRef = useRef<Howl | null>(null);

  const step = steps[stepIndex];
  const isChoiceStep = step.id === "choice";

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
    return () => {
      soundRef.current?.stop();
    };
  }, []);

  function start() {
    setStarted(true);
    try {
      soundRef.current = new Howl({
        src: ["/audio/morning-placeholder.mp3"],
        loop: true,
        volume: 0.22,
        html5: true
      });
      soundRef.current.play();
    } catch {
      soundRef.current = null;
    }
  }

  function next() {
    if (!started) {
      start();
      return;
    }
    if (isChoiceStep) return;
    setStepIndex((current) => Math.min(current + 1, steps.length - 1));
  }

  function choose(choice: string) {
    setSelectedChoice(choice);
  }

  return (
    <main className={styles.page}>
      <section className={styles.shell}>
        <header className={styles.header}>
          <div>
            <p>Visual novel infantil</p>
            <h1>Serenity at Dusk do Léo</h1>
          </div>
          <span>Fase 1.6 — Navegável no browser</span>
        </header>

        <div className={styles.gameWindow}>
          <div className={styles.canvasWrap}>
            <Stage width={960} height={540} options={{ backgroundColor: 0x071c45, antialias: true }}>
              <Container x={camera.current.x} y={camera.current.y} scale={camera.current.scale}>
                <Sprite image="/assets/scene-room-mvp.svg" width={960} height={540} />

                <Container x={684} y={336}>
                  <Graphics
                    filters={[new BlurFilter(4)]}
                    draw={(g) => {
                      g.clear();
                      g.beginFill(0xfff2a0, 0.32);
                      g.drawCircle(0, 0, 78);
                      g.endFill();
                    }}
                  />
                  <Graphics
                    draw={(g) => {
                      g.clear();
                      const pulse = step.focus === "coin" || step.focus === "drawer" ? 1 : 0.55;
                      g.beginFill(0xfff2a0, 0.38 * pulse);
                      g.drawCircle(0, 0, 48);
                      g.endFill();
                    }}
                  />
                </Container>

                <Graphics
                  draw={(g) => {
                    g.clear();
                    for (let i = 0; i < 34; i += 1) {
                      const x = 72 + ((i * 83) % 820);
                      const y = 48 + ((i * 51) % 390);
                      g.beginFill(0xffffff, 0.18);
                      g.drawCircle(x, y, 1.5 + (i % 3));
                      g.endFill();
                    }
                  }}
                />
              </Container>
            </Stage>
          </div>

          <div className={styles.hudTopLeft}>
            <span>Cena {stepIndex + 1}/5</span>
          </div>

          <div className={styles.hudTopRight}>
            <button aria-label="Música">♪</button>
            <button aria-label="Som">◉</button>
          </div>

          <div className={styles.dialogueBox}>
            <div className={styles.namePlate}>{step.speaker}</div>
            <p>{selectedChoice ? `Léo escolheu: ${selectedChoice}. Essa consequência entra na próxima etapa.` : step.text}</p>

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
              <h2>A Moedinha Brilhante</h2>
              <p>Protótipo navegável para validar ritmo, câmera, texto e interface.</p>
              <button onClick={start}>Iniciar jornada</button>
            </div>
          )}
        </div>
      </section>
    </main>
  );
}
