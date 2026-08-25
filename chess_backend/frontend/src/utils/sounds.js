const sounds = {
  move: new Audio("/audio/move.mp3"),
  capture: new Audio("/audio/capture.mp3"),
  check: new Audio("/audio/move-check.mp3"),
  correct: new Audio("/audio/correct.mp3"),
  decline: new Audio("/audio/decline.mp3"),
  game_start: new Audio("/audio/game-start.mp3"),
  game_end: new Audio("/audio/game-end.mp3"),
  room_join: new Audio("/audio/room-join.mp3"),
  room_left: new Audio("/audio/room-left.mp3"),
};

/**
 * Phát sound effect tương ứng với soundName chỉ định và tự động tua lại ban đầu trước khi phát.
 * @param {'move' | 'capture' | 'check' | 'correct' | 'decline' | 'game_start' | 'game_end' | 'room_join' | 'room_left'} soundName - Tên của âm thanh cần phát
 */
export const playSound = (soundName) => {
  const sound = sounds[soundName];
  if (sound) {
    if (soundName === "decline") {
      sound.volume = 0.5;
    } else if (soundName === "move") {
      sound.volume = 1.0;
    } else if (soundName === "room_join") {
      sound.volume = 0.2;
    } else if (soundName === "room_left") {
      sound.volume = 0.2;
    }
    sound.currentTime = 0;
    sound.play().catch(() => {});
  }
};
