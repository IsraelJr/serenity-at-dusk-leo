"use client";

import { motion } from "framer-motion";
import styles from "./Sparkles.module.css";

const sparkles = Array.from({ length: 18 }, (_, index) => ({
  id: index,
  left: `${8 + ((index * 17) % 84)}%`,
  top: `${8 + ((index * 23) % 76)}%`,
  delay: index * 0.19
}));

export function Sparkles() {
  return (
    <div className={styles.layer} aria-hidden="true">
      {sparkles.map((sparkle) => (
        <motion.span
          key={sparkle.id}
          className={styles.sparkle}
          style={{ left: sparkle.left, top: sparkle.top }}
          animate={{ opacity: [0, 1, 0], scale: [0.6, 1.2, 0.6], y: [0, -14, 0] }}
          transition={{ duration: 2.6, repeat: Infinity, delay: sparkle.delay }}
        />
      ))}
    </div>
  );
}
