"use client";

import { AnimatePresence, motion } from "framer-motion";
import { useEffect, useMemo, useState } from "react";
import { SceneId, story } from "@/data/story";
import { defaultProgress, loadProgress, resetProgress, saveProgress } from "@/lib/progress";
import { Sparkles } from "./Sparkles";
import styles from "./ScenePlayer.module.css";

export function ScenePlayer() {
  const [sceneId, setSceneId] = useState<SceneId>("start");
  const [lineIndex, setLineIndex] = useState(0);
  const [progress, setProgress] = useState(defaultProgress);

  const scene = story[sceneId];
  const currentText = useMemo(() => scene.text.slice(0, lineIndex + 1), [scene, lineIndex]);
  const hasMoreText = lineIndex < scene.text.length - 1;

  useEffect(() => {
    const stored = loadProgress();
    setProgress(stored);
    setSceneId(stored.lastScene ?? "start");
  }, []);

  useEffect(() => setLineIndex(0), [sceneId]);

  function playTinyChime() {
    try {
      const AudioContextClass = window.AudioContext || (window as unknown as { webkitAudioContext: typeof AudioContext }).webkitAudioContext;
      const context = new AudioContextClass();
      const oscillator = context.createOscillator();
      const gain = context.createGain();
      oscillator.type = "sine";
      oscillator.frequency.setValueAtTime(880, context.currentTime);
      oscillator.frequency.exponentialRampToValueAtTime(1320, context.currentTime + 0.18);
      gain.gain.setValueAtTime(0.0001, context.currentTime);
      gain.gain.exponentialRampToValueAtTime(0.08, context.currentTime + 0.03);
      gain.gain.exponentialRampToValueAtTime(0.0001, context.currentTime + 0.4);
      oscillator.connect(gain).connect(context.destination);
      oscillator.start();
      oscillator.stop(context.currentTime + 0.42);
    } catch {}
  }

  function goTo(next: SceneId, choiceLabel?: string) {
    playTinyChime();
    const nextScene = story[next];
    const updated = {
      ...progress,
      lastScene: next,
      choicesMade: choiceLabel ? [...progress.choicesMade, { at: sceneId, choice: choiceLabel, next }] : progress.choicesMade,
      endingsUnlocked: nextScene.kind === "ending" && !progress.endingsUnlocked.includes(next) ? [...progress.endingsUnlocked, next] : progress.endingsUnlocked
    };
    setProgress(updated);
    saveProgress(updated);
    setSceneId(next);
  }

  function continueScene() {
    if (hasMoreText) {
      setLineIndex((current) => current + 1);
      return;
    }
    if (scene.next) goTo(scene.next);
  }

  function restart() {
    resetProgress();
    setProgress(defaultProgress);
    setSceneId("start");
  }

  return (
    <main className={styles.shell}>
      <section className={styles.stage}>
        <AnimatePresence mode="wait">
          <motion.div key={scene.id} className={styles.scene} initial={{ opacity: 0, scale: 1.04 }} animate={{ opacity: 1, scale: 1 }} exit={{ opacity: 0, scale: 0.98 }} transition={{ duration: 0.75, ease: "easeOut" }}>
            <motion.img src={scene.image} alt="Cena ilustrada de Léo" className={styles.art} animate={{ scale: [1, 1.035, 1], x: [0, -8, 0] }} transition={{ duration: 12, repeat: Infinity, ease: "easeInOut" }} />
            <div className={styles.sunGlow} />
            <Sparkles />
          </motion.div>
        </AnimatePresence>

        <motion.div className={styles.panel} initial={{ y: 24, opacity: 0 }} animate={{ y: 0, opacity: 1 }} transition={{ delay: 0.2 }}>
          {scene.eyebrow && <p className={styles.eyebrow}>{scene.eyebrow}</p>}
          <h1>{scene.title}</h1>

          <div className={styles.dialogue}>
            <AnimatePresence>
              {currentText.map((line, index) => (
                <motion.p key={`${scene.id}-${index}`} initial={{ opacity: 0, y: 8 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0 }}>
                  {line}
                </motion.p>
              ))}
            </AnimatePresence>
          </div>

          {scene.kind === "choice" && !hasMoreText && scene.choices ? (
            <div className={styles.choices}>
              {scene.choices.map((choice) => (
                <button key={choice.next} className={`${styles.choice} ${styles[choice.tone]}`} onClick={() => goTo(choice.next, choice.label)}>
                  {choice.label}
                </button>
              ))}
            </div>
          ) : scene.kind === "ending" && !hasMoreText ? (
            <div className={styles.endingBox}>
              <strong>Aprendizado:</strong>
              <span>{scene.lesson}</span>
              <div className={styles.endingActions}>
                <button onClick={() => goTo("first_choice")} className={styles.secondary}>Tentar outra escolha</button>
                <button onClick={restart} className={styles.primary}>Voltar ao começo</button>
              </div>
            </div>
          ) : (
            <button className={styles.primary} onClick={continueScene}>{hasMoreText ? "Continuar" : scene.next ? "Avançar" : "Começar"}</button>
          )}

          <footer className={styles.footer}>
            <span>Finais encontrados: {progress.endingsUnlocked.length}/2</span>
            <button onClick={restart} className={styles.linkButton}>Reiniciar</button>
          </footer>
        </motion.div>
      </section>
    </main>
  );
}
