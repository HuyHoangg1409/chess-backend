import React, { useRef, useEffect, useState } from "react";
import { playSound } from "../../utils/sounds";
import { Chess, Move } from "chess.js";
import { ChessBoardView } from "../../components/ChessBoard/ChessBoardView";
import { getAIBestMove } from "../../services/api";
import MoveHistoryTable from "../../components/MoveHistoryTable";

export default function AIGame({ currentUser }) {
  const [game, setGame] = useState(new Chess());
  const [isAIThinking, setIsAIThinking] = useState(false);
  const [message, setMessage] = useState("");
  const [difficulty, setDifficulty] = useState(1);
  const [isCompleted, setIsCompleted] = useState(false);
  const [gameStarted, setGameStarted] = useState(false);
  const [selectedColor, setSelectedColor] = useState("white");

  const currentRequestIdRef = useRef(0);
  
  const handleGameStart = () => {
    currentRequestIdRef.current++;
    playSound("game_start");
    const newGame = new Chess();
    setGame(newGame);
    setIsCompleted(false);
    setGameStarted(true);
    setIsAIThinking(false);
    setMessage("Game Started");
    if (selectedColor == "black") {
      fetchAITurn(newGame);
    }
  };

  const handleGameRestart = () => {
    handleGameStart();
  };

  const handleGameResign = () => {
    playSound("game_end");
    setIsCompleted(true);
    setIsAIThinking(false);
    setGameStarted(false);
    setMessage("Bot wins");
  };

  useEffect(() => {
    setIsCompleted(false);
  }, [difficulty]);

  const fetchAITurn = async (currentGame) => {
    const requestId = ++currentRequestIdRef.current;
    setIsAIThinking(true);

    try{
    const response = await getAIBestMove(currentGame.fen(), difficulty);
    const bestMove = response.best_move;

    if (requestId != currentRequestIdRef.current) {
      return;
    }
    setGame((prevGame) => {
      if (prevGame.fen() !== currentGame.fen()) {
        return prevGame;
      }});

    const newGame = new Chess();
    newGame.loadPgn(currentGame.pgn());
    const move = newGame.move({
      from: bestMove.substring(0, 2),
      to: bestMove.substring(2, 4),
      promotion: bestMove.length > 4 ? bestMove[4] : undefined,
    });

    if (newGame.inCheck()) {
      playSound("check");
    } else if (move.isCapture()) {
      playSound("capture");
    } else playSound("move");

    setGame(newGame);
    if (newGame.isGameOver()) {
      if (newGame.isDraw()) {
        playSound("game_end");
        setMessage("Draw");
      } else {
        handleGameResign();
      }
      return;
    }

    setMessage("Player turn...");
  } catch(e){
    setMessage("Bot đang ốm")
  } finally{
      if (requestId === currentRequestIdRef.current) {
        setIsAIThinking(false);
      }
  }};

  const handlePieceDrop = (pieceObject, selectedPromotion = null) => {
    const playerColor = selectedColor === "white" ? "w" : "b";
    if (isAIThinking || game.turn() !== playerColor) return false;
    if (isCompleted) {
      handleGameResign();
      return false;
    }

    try {
      const newGame = new Chess();
      newGame.loadPgn(game.pgn());
      const move = newGame.move({
        from: pieceObject.sourceSquare,
        to: pieceObject.targetSquare,
        promotion: "q",
      });

      if (move == null) {
        return false;
      }
      if (newGame.inCheck()) {
        playSound("check");
      } else if (move.isCapture()) {
        playSound("capture");
      } else playSound("move");

      setGame(newGame);
      setMessage("Bot thinking...");
      if (!newGame.isGameOver()) {
        fetchAITurn(newGame);
      } else {
        if (newGame.isDraw()) {
          playSound("game_end");
          setMessage("Draw");
        } else {
          playSound("correct");
          setMessage("Player Wins");
        }
        setIsCompleted(true);
        setGameStarted(false);
      }

      return true;
    } catch (error) {
      setMessage("Nước đi không hợp lệ");
      playSound("decline");
      return false;
    }
  };

  const handleSelectDifficulty = (level) => {
    setDifficulty(level);
    setGame(new Chess());
  };

  return (
    <>
      <div className="relative w-140 bg-chess-outline p-3.5 rounded-xl shadow-2xl border border-chess-border">
        <ChessBoardView
          key={`board-${selectedColor}`}
          game={game}
          onPieceDrop={handlePieceDrop}
          boardOrientation={selectedColor}
          allowDragging={!isCompleted && gameStarted}
        />
      </div>

      <div className="flex flex-col w-85 bg-chess-outline p-3.5 rounded-xl shadow-xl border border-chess-border">
        <div className="pl-3 border-b border-chess-border pb-4 text-xl font-semibold uppercase tracking-wider">
          <span>Chơi với máy</span>
          <p>Độ khó: {difficulty}</p>
        </div>

        <div className="p-4 mt-4 rounded-lg bg-button-bg-white text-gray-950">
          <span className="text-xl font-semibold uppercase">{message}</span>
        </div>

        <MoveHistoryTable history={game.history()} />

        <div className="flex flex-col gap-4 w-full mt-auto">
          <div className="flex flex-row items-center justify-between gap-4">
            <div className="relative grow">
              <select
                value={difficulty || 1}
                onChange={(e) => handleSelectDifficulty(Number(e.target.value))}
                disabled={isAIThinking || gameStarted}
                className="w-full text-left appearance-none bg-[#1e1d1b] rounded-xl px-4 py-3 text-base font-bold text-stone-100 focus:outline-none focus:ring-2 focus:ring-[#81b64c] cursor-pointer transition-all disabled:opacity-50"
              >
                <option value={1} className="bg-[#262522] py-2">
                  Dễ
                </option>
                <option value={2} className="bg-[#262522] py-2">
                  Vừa
                </option>
                <option value={3} className="bg-[#262522] py-2">
                  Khó
                </option>
                <option value={4} className="bg-[#262522] py-2">
                  Cực khó
                </option>
              </select>
            </div>
            <div className="grow">
              <div className="grid grid-cols-2 gap-1 p-1 bg-[#1e1d1b] rounded-xl">
                <button
                  type="button"
                  disabled={gameStarted}
                  onClick={() => {
                    setSelectedColor("white");
                  }}
                  className={`flex items-center justify-center gap-2 px-4 py-3 rounded-lg text-sm font-bold transition-all cursor-pointer disabled:cursor-not-allowed disabled:opacity-50 ${
                    selectedColor === "white"
                      ? "bg-stone-100 text-stone-950 shadow-md ring-1 ring-white"
                      : "text-stone-400 hover:text-stone-200 hover:bg-stone-800"
                  }`}
                >
                  Trắng
                </button>
                <button
                  type="button"
                  disabled={gameStarted}
                  onClick={() => {
                    setSelectedColor("black");
                  }}
                  className={`flex items-center justify-center gap-2 px-4 py-3 rounded-lg text-sm font-bold transition-all cursor-pointer disabled:cursor-not-allowed disabled:opacity-50 ${
                    selectedColor === "black"
                      ? "bg-stone-800 text-white shadow-md ring-1 ring-stone-600"
                      : "text-stone-400 hover:text-stone-200 hover:bg-stone-800"
                  }`}
                >
                  Đen
                </button>
              </div>
            </div>
            <button
              type="button"
              disabled={!gameStarted}
              onClick={handleGameResign}
              title="Đầu hàng"
              className="flex items-center justify-center px-3 py-3 rounded-lg text-xl transition-all duration-200 cursor-pointer disabled:cursor-not-allowed disabled:opacity-50 text-red-500 hover:text-red-400 hover:bg-stone-800 group"
            >
              <span className="inline-block transition-transform duration-200 group-hover:scale-125">
                🏳️
              </span>
            </button>
          </div>
          <div className="flex flex-col gap-4 mt-auto text-xl text-white font-semibold">
            <button
              onClick={gameStarted ? handleGameRestart : handleGameStart}
              className="p-4 rounded-lg bg-green-600 hover:bg-green-700 transition-colors duration-350 cursor-pointer text-xl font-semibold"
            >
              {gameStarted ? "Chơi lại" : "Chơi ngay"}
            </button>
          </div>
        </div>
      </div>
    </>
  );
}
