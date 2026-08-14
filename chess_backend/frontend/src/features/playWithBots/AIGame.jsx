import React, { useCallback, useState } from "react";
import { Chess } from "chess.js";
import { ChessBoardView } from "../../components/ChessBoard/ChessBoardView";
import { getAIGreedyMove } from "../../services/api";

export default function AIGame({ currentUser }) {
  const [game, setGame] = useState(new Chess());
  const [isAIThinking, setIsAIThinking] = useState(false);
  const [message, setMessage] = useState("");
  const [difficulty, setdifficulty] = useState(null);
  const playerColor = "w";

  const fetchAITurn = useCallback(async (currentFen) => {
    setIsAIThinking(true);
    setMessage("Bot thinking...");

    const response = await getAIGreedyMove(currentFen, 1);
    const bestMove = response.best_move;

    const newGame = new Chess(currentFen);
    const move = newGame.move({
      from: bestMove.substring(0, 2),
      to: bestMove.substring(2, 4),
      promotion: bestMove.length > 4 ? bestMove[4] : undefined,
    });
    setGame(newGame);
    setIsAIThinking(false);
    setMessage("Player turn...");
  }, []);

  const handlePieceDrop = (pieceObject, selectedPromotion = null) => {
    if (isAIThinking || game.turn() != playerColor) return false;

    try {
      const newGame = new Chess(game.fen());
      const move = newGame.move({
        from: pieceObject.sourceSquare,
        to: pieceObject.targetSquare,
        promotion: "q",
      });

      if (move == null) {
        setMessage("Nước đi không hợp lệ");
        return false;
      }

      const fen_position = newGame.fen();
      setGame(newGame);
      if (!newGame.isGameOver()) {
        setTimeout(() => fetchAITurn(fen_position), 250);
      }

      return true;
    } catch (error) {
      console.error(error);
      return false;
    }
  };

  const handleSelectDifficulty = (level) => {
    setdifficulty(level);
    setGame(new Chess());
  };

  return (
    <>
      <div className="relative w-140 bg-chess-outline p-3.5 rounded-xl shadow-2xl border border-chess-border">
        <ChessBoardView game={game} onPieceDrop={handlePieceDrop} />
      </div>
      <div className="flex flex-col w-85 bg-chess-outline p-3.5 rounded-xl shadow-xl border border-chess-border">
        <div className="pl-3 border-b border-chess-border pb-4 text-xl font-semibold uppercase tracking-wider">
          <span>playing with bot</span>
          <p>difficulty: </p>
        </div>
        <div className="p-4 mt-4 rounded-lg bg-button-bg-white text-gray-950">
          <span className="text-xl font-semibold uppercase">{difficulty}</span>
        </div>
        <div className="flex flex-col gap-4 mt-auto text-xl text-white font-semibold">
          <div className="flex gap-3">
            <button
              onClick={() => {
                handleSelectDifficulty(1);
              }}
              className="w-3/6 p-4 rounded-lg bg-green-600 hover:bg-green-600/80 transition-colors duration-350 cursor-pointer uppercase"
            >
              Easy
            </button>
            <button
              onClick={() => {
                handleSelectDifficulty(2);
              }}
              className="w-3/6 p-4 rounded-lg bg-[#ffc800] hover:bg-[#ffc800]/80 transition-colors duration-350 cursor-pointer uppercase"
            >
              Medium
            </button>
          </div>
          <div className="flex gap-3">
            <button
              onClick={() => {
                handleSelectDifficulty(3);
              }}
              className="w-3/6 p-4 rounded-lg bg-[#F99C35] hover:bg-[#F99C35]/80 transition-colors duration-350 cursor-pointer uppercase"
            >
              Hard
            </button>
            <button
              onClick={() => {
                handleSelectDifficulty(4);
              }}
              className="w-3/6 p-4 rounded-lg bg-[#F14738] hover:bg-[#F14738]/80 transition-colors duration-350 cursor-pointer uppercase"
            >
              Extremely Hard
            </button>
          </div>
        </div>
      </div>
    </>
  );
}
