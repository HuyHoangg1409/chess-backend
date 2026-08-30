import React from "react";
import { Chessboard } from "react-chessboard";

const PUZZLE_BOARD_OPTIONS = (
  game,
  boardOrientation,
  onPieceDrop,
  allowDragging,
  onPromotionCheck,
  onPromotionPieceSelect,
  boardAnimationDuration,
) => ({
  id: "puzzle-board",
  position: game ? game.fen() : "8/8/8/8/8/8/8/8 w - - 0 1",
  boardOrientation: boardOrientation,
  onPieceDrop: onPieceDrop,
  allowDragging: allowDragging,

  onPromotionCheck: onPromotionCheck,
  onPromotionPieceSelect: onPromotionPieceSelect,

  animationDurationInMs: boardAnimationDuration,
  draggingPieceGhostStyle: { opacity: 0, filter: `blur(0px)` },
  customBoardStyle: { touchAction: "none" },
  darkSquareStyle: { backgroundColor: "var(--color-chess-dark)" },
  lightSquareStyle: { backgroundColor: "var(--color-chess-light)" },
});

export const ChessBoardView = ({
  game,
  boardOrientation = "white",
  onPieceDrop,
  allowDragging = true,
  onPromotionCheck,
  onPromotionPieceSelect,
  boardAnimationDuration,
}) => {
  return (
    <div className="touch-none select-none">
      <Chessboard
        options={PUZZLE_BOARD_OPTIONS(
          game,
          boardOrientation,
          onPieceDrop,
          allowDragging,
          onPromotionCheck,
          onPromotionPieceSelect,
          boardAnimationDuration,
        )}
      />
    </div>
  );
};
