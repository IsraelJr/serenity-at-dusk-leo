import type { SceneId } from "@/data/story";

export type Progress = {
  lastScene: SceneId;
  endingsUnlocked: SceneId[];
  choicesMade: { at: string; choice: string; next: SceneId }[];
};

export const defaultProgress: Progress = {
  lastScene: "start",
  endingsUnlocked: [],
  choicesMade: []
};

export function loadProgress(): Progress {
  return defaultProgress;
}

export function saveProgress(_progress: Progress) {
  return;
}

export function resetProgress() {
  return;
}
