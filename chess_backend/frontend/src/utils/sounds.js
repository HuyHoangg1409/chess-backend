const sounds = {
  move: new Audio("/audio/move.mp3"),
  capture: new Audio("/audio/capture.mp3"),
  check: new Audio("/audio/move-check.mp3"),
  correct: new Audio("/audio/correct.mp3"),
  decline: new Audio("/audio/decline.mp3"),
};

/**
 * Phát sound effect tương ứng với soundName chỉ định và tự động tua lại ban đầu trước khi phát.
 * @param {'move' | 'capture' | 'check' | 'correct' | 'decline'} soundName - Tên của âm thanh cần phát
 */
export const playSound = (soundName) => {
  const sound = sounds[soundName];
  if (sound) {
    if (soundName === "decline") {
      sound.volume = 0.5;
    } else if (soundName === "move") {
      sound.volume = 1.0;
    }
    sound.currentTime = 0;
    sound.play().catch(() => {});
  }
};
