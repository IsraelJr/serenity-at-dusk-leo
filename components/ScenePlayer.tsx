"use client";

import { AnimatePresence, motion } from "framer-motion";
import { useEffect, useState } from "react";
import { SceneId, story } from "@/data/story";
import { defaultProgress, loadProgress, resetProgress, saveProgress } from "@/lib/progress";
import { Sparkles } from "./Sparkles";
import styles from "./ScenePlayer.module.css";

export function ScenePlayer() {
  const [sceneId, setSceneId] = useState<SceneId>("start");
  const [lineIndex, setLineIndex] = useState(0);
  const [progress, setProgress] = useState(defaultProgress);

  const scene = story[sceneId];
  const currentLine = scene.text[lineIndex];
  const hasMoreText = lineIndex < scene.text.length - 1;
  const canShowChoices = scene.kind === "choice" && !hasMoreText && scene.choices;
  const canShowEnding = scene.kind === "ending" && !hasMoreText;

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
      playTinyChime();
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
      <section className={styles.gameFrame}>
        <div className={styles.topBar}>
          <span>Serenity at Dusk do Léo</span>
          <button onClick={restart}>Reiniciar</button>
        </div>

        <div className={styles.imageFrame}>
          <AnimatePresence mode="wait">
            <motion.div key={scene.id} className={styles.scene} initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} transition={{ duration: 0.55, ease: "easeOut" }}>
              <motion.img src={scene.image} alt="Cena ilustrada de Léo" className={styles.art} animate={{ scale: [1, 1.025, 1] }} transition={{ duration: 14, repeat: Infinity, ease: "easeInOut" }} />
              <div className={styles.sunGlow} />
              <Sparkles />
            </motion.div>
          </AnimatePresence>
        </div>

        <motion.div className={styles.dialogueFrame} initial={{ opacity: 0, y: 16 }} animate={{ opacity: 1, y: 0 }}>
          <div className={styles.namePlate}>{scene.title}</div>

          <AnimatePresence mode="wait">
            <motion.p key={`${scene.id}-${lineIndex}`} className={styles.dialogueLine} initial={{ opacity: 0, y: 8 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: -4 }}>
              {currentLine}
            </motion.p>
          </AnimatePresence>

          {canShowChoices ? (
            <div className={styles.choices}>
              {scene.choices!.map((choice) => (
                <button key={choice.next} className={`${styles.choice} ${styles[choice.tone]}`} onClick={() => goTo(choice.next, choice.label)}>
                  {choice.label}
                </button>
              ))}
            </div>
          ) : canShowEnding ? (
            <div className={styles.endingActions}>
              <p className={styles.lesson}>{scene.lesson}</p>
              <button onClick={() => goTo("first_choice")} className={styles.secondary}>Tentar outra escolha</button>
              <button onClick={restart} className={styles.primary}>Voltar ao começo</button>
            </div>
          ) : (
            <button className={styles.nextButton} onClick={continueScene} aria-label="Avançar diálogo">
              {scene.next && !hasMoreText ? "Começar" : "➜"}
            </button>
          )}

          <div className={styles.progress}>Finais: {progress.endingsUnlocked.length}/2</div>
        </motion.div>
      </section>
    </main>
  );
}
