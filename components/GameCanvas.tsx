"use client";

import { Container, Graphics, Stage, Text } from "@pixi/react";
import { BlurFilter, TextStyle } from "pixi.js";
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
    text: "Na gaveta azul, uma pequena moedinha parecia esperar por ele.",
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
  window: { x: 34, y: 22, scale: 1.07 },
  leo: { x: -72, y: -18, scale: 1.12 },
  drawer: { x: -150, y: -28, scale: 1.14 },
  coin: { x: -210, y: -44, scale: 1.22 }
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
    return () => soundRef.current?.stop();
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
          <span>Fase 1.5 — Cena cinematográfica</span>
        </header>

        <div className={styles.gameWindow}>
          <div className={styles.canvasWrap}>
            <Stage width={960} height={540} options={{ backgroundColor: 0xf7d88d, antialias: true }}>
              <Container x={camera.current.x} y={camera.current.y} scale={camera.current.scale}>
                <Graphics
                  draw={(g) => {
                    g.clear();
                    g.beginFill(0xfff0c8);
                    g.drawRect(0, 0, 960, 540);
                    g.endFill();
                    g.beginFill(0xf9d59a);
                    g.drawRect(0, 0, 960, 170);
                    g.endFill();
                    g.beginFill(0xbfeaff);
                    g.drawRoundedRect(70, 60, 230, 160, 18);
                    g.endFill();
                    g.beginFill(0xffd23f);
                    g.drawCircle(110, 90, 32);
                    g.endFill();
                    g.beginFill(0x8a542d);
                    g.drawRoundedRect(610, 240, 250, 150, 20);
                    g.endFill();
                    g.beginFill(0x4c76d4);
                    g.drawRoundedRect(72, 355, 390, 102, 28);
                    g.endFill();
                    g.beginFill(0x9a5b2a);
                    g.drawRoundedRect(570, 390, 285, 92, 18);
                    g.endFill();
                    g.beginFill(0xd89042);
                    g.drawRoundedRect(592, 414, 238, 43, 10);
                    g.endFill();
                  }}
                />

                <Container x={332} y={205}>
                  <Graphics
                    draw={(g) => {
                      g.clear();
                      g.beginFill(0x5b2b12);
                      g.drawEllipse(0, -38, 92, 45);
                      g.endFill();
                      g.beginFill(0xffd39a);
                      g.drawCircle(0, 0, 70);
                      g.endFill();
                      g.beginFill(0x2b1a12);
                      g.drawCircle(-25, -10, 7);
                      g.drawCircle(25, -10, 7);
                      g.endFill();
                      g.lineStyle(7, 0x7a3215, 1);
                      g.moveTo(-22, 28);
                      g.quadraticCurveTo(0, 48, 30, 28);
                      g.beginFill(0xe73524);
                      g.drawRoundedRect(-45, 65, 90, 90, 28);
                      g.endFill();
                    }}
                  />
                </Container>

                <Container x={760} y={404}>
                  <Graphics
                    filters={[new BlurFilter(2)]}
                    draw={(g) => {
                      g.clear();
                      g.beginFill(0xfff2a0, 0.45);
                      g.drawCircle(0, 0, 58);
                      g.endFill();
                    }}
                  />
                  <Graphics
                    draw={(g) => {
                      g.clear();
                      g.beginFill(0xf7b813);
                      g.lineStyle(7, 0xb66b00, 1);
                      g.drawCircle(0, 0, 34);
                      g.endFill();
                    }}
                  />
                  <Text text="$" x={-12} y={-22} style={new TextStyle({ fontSize: 42, fill: "#ffffff", fontWeight: "bold" })} />
                </Container>

                <Graphics
                  draw={(g) => {
                    g.clear();
                    for (let i = 0; i < 26; i += 1) {
                      const x = 90 + ((i * 73) % 780);
                      const y = 50 + ((i * 47) % 420);
                      g.beginFill(0xffffff, 0.28);
                      g.drawCircle(x, y, 2 + (i % 4));
                      g.endFill();
                    }
                  }}
                />
              </Container>
            </Stage>
          </div>

          {!started && (
            <div className={styles.startOverlay}>
              <h2>A Moedinha Brilhante</h2>
              <p>Uma cena teste para validar o clima, a câmera e o ritmo do jogo.</p>
              <button onClick={start}>Iniciar jornada</button>
            </div>
          )}
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
      </section>
    </main>
  );
}
