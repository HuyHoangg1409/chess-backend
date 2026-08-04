import React, { useState, useEffect, useRef } from "react";
import { Chessboard, defaultDarkSquareStyle } from "react-chessboard";
import { Chess } from "chess.js";

import { getRandomPuzzle } from "./services/api";
import {
  correctMovesArray,
  getTurn,
  getOppositeTurn,
  getMove,
} from "./utils/chessHelper";

function App() {
  const [puzzle, setPuzzle] = useState(null);
  const [game, setGame] = useState(new Chess());
  const [message, setMessage] = useState("");
  const [moveIndex, setMoveIndex] = useState(0);
  const [boardOrientation, setBoardOrientation] = useState("white");

  const soundsRef = useRef({
    move: new Audio("/move.mp3"),
    capture: new Audio("/capture.mp3"),
    check: new Audio("/move-check.mp3"),
    correct: new Audio("/correct.mp3"),
    decline: new Audio("/decline.mp3"),
  });

  /**
   * Gọi API từ backend để lấy ngẫu nhiên 1 câu đố từ database và cập nhật lại trạng thái bàn cờ hiện tại.
   */
  const fetchRandomPuzzle = async () => {
    setMessage("");
    try {
      const data = await getRandomPuzzle();

      setPuzzle(data);

      setBoardOrientation(getOppositeTurn(data.fen_position));

      const newGame = new Chess(data.fen_position);
      setGame(newGame);

      const movesArray = correctMovesArray(data.correct_moves);
      console.log(movesArray);
      makeEngineMove(newGame, movesArray, 0);
    } catch (error) {
      setMessage("Can't Load Puzzle");
      throw error;
    }
  };

  useEffect(() => {
    fetchRandomPuzzle();
  }, []);

  const playSound = (soundName) => {
    const sound = soundsRef.current[soundName];
    if (sound) {
      sound.currentTime = 0;
      sound.play().catch(() => {});
    }
  };

  /**
   * Xử lý logic máy tự động đi các nước đi đúng bên phía đối thủ trong chế độ giải đố.
   * Hàm kiểm tra tiến trình câu đố, lấy nước đi tương ứng từ mảng "movesArray",
   * cập nhật trạng thái bàn cờ rồi chuyển lượt sang người chơi hoặc hoàn thành câu đố.
   * @param {Object} currentGame - Đối tượng quản lý trạng thái bàn cờ hiện tại
   * @param {*} movesArray - Mảng chứa danh sách các nước đi chuẩn theo đáp án của câu đố
   * @param {*} index - Chỉ mục hiện tại của nước đi mà engine cần thực hiện trong "movesArray"
   * @returns {void} - Không trả về giá trị
   */
  const makeEngineMove = (currentGame, movesArray, index) => {
    if (index >= movesArray.length) {
      playSound("correct");
      setMessage("Puzzle Done");
      return;
    }

    setMessage("Computer Turn...");

    const engineMoves = getMove(movesArray[index]);
    if (!engineMoves) return;
    console.log(engineMoves);

    const newGame = new Chess(currentGame.fen());
    newGame.move({
      from: engineMoves.from,
      to: engineMoves.to,
      promotion: "q",
    });
    setGame(newGame);

    const nextIndex = index + 1;
    setMoveIndex(nextIndex);

    if (nextIndex >= movesArray.length) {
      playSound("correct");
      setMessage("Puzzle Done");
    } else {
      setMessage("Player Turn...");
    }
  };

  /**
   * Xử lý logic khi người chơi kéo thả quân cờ trên bàn cờ.
   *
   * @param {Object} pieceObject - Đối tượng chứa thông tin quân cờ và nước đi bao gồm "piece", "sourceSquare" và "targetSquare"
   * @returns {boolean} Trả về true nếu nước đi hợp lệ và false nếu nước đi không hợp lệ
   */
  const makeAMove = (pieceObject) => {
    if (moveIndex % 2 === 0) {
      return false;
    }
    if (!puzzle) return false;

    const movesArray = correctMovesArray(puzzle.correct_moves);

    if (moveIndex >= movesArray.length) return false;

    try {
      const userMove = `${pieceObject.sourceSquare}${pieceObject.targetSquare}`;
      console.log(userMove);

      if (userMove !== movesArray[moveIndex]) {
        playSound("decline");
        setMessage("Incorrect Answer");
        return false;
      }

      const newGame = new Chess(game.fen());
      const move = newGame.move({
        from: pieceObject.sourceSquare,
        to: pieceObject.targetSquare,
        promotion: "q",
      });
      setGame(newGame);

      if (move) {
        if (newGame.inCheck()) {
          playSound("check");
        }
        else if (move.captured) {
          playSound("capture");
        }
        else {
          playSound("move");
        }
      }

      const nextIndex = moveIndex + 1;
      setMoveIndex(nextIndex);

      if (nextIndex >= movesArray.length) {
        playSound("correct");
        setMessage("Puzzle Done");
      } else {
        makeEngineMove(newGame, movesArray, nextIndex);
      }
      return true;
    } catch (error) {
      return false;
      throw error;
    }
  };

  /**
   * Cấu hình các thuộc tính và sự kiện của bàn cờ bao gồm id, position -> thế cờ hiện tại, onPieceDrop -> hàm xử lý khi thả quân cờ
   */
  const chessBoardOptions = {
    id: "board-01",
    boardOrientation: boardOrientation,
    onPieceDrop: makeAMove,
    position: game.fen(),
    darkSquareStyle: { backgroundColor: "var(--color-chess-dark)" },
    lightSquareStyle: { backgroundColor: "var(--color-chess-light)" },
  };

  if (!puzzle) {
    return (
      <div>
        <p>Loading Puzzles</p>
      </div>
    );
  }
  return (
    <div className="flex flex-col items-center justify-between min-h-screen bg-chess-bg text-text-white p-6">
      <header className="flex justify-between items-center w-full max-w-7xl py-4 border-b-2 border-white mb-8">
        <div className="flex items-center">
          <h2 className="text-4xl text-green-600 font-bold">CHESS</h2>
        </div>

        <div className="flex items-baseline gap-2.5 ">
          <span className="text-2xl font-semibold text-red-400">USER</span>
          <span className="text-green-500">1200 ELO</span>
        </div>
      </header>

      <main className="flex justify-between w-full max-w-6xl">
        <div className="w-140 bg-chess-outline p-3.5 rounded-xl shadow-2xl border border-chess-border">
          <Chessboard options={chessBoardOptions} />
        </div>

        <div className="flex flex-col w-85 bg-chess-outline p-3.5 rounded-xl shadow-xl border border-chess-border">
          <div className="pl-3 border-b border-chess-border pb-4 text-xl font-semibold uppercase tracking-wider">
            <span>Puzzle {puzzle.puzzle_id}</span>
            <p>Difficulty: {puzzle.difficulty}</p>
          </div>

          <div className="p-4 mt-4 rounded-lg bg-button-bg-white text-gray-950">
            <span className="text-xl font-semibold uppercase">{message}</span>
          </div>

          <div className="flex flex-col gap-4 mt-auto text-xl text-white font-semibold">
            <button
              onClick={fetchRandomPuzzle}
              className="p-4 rounded-lg bg-green-600 hover:bg-green-700 transition-colors duration-350 cursor-pointer uppercase"
            >
              Next Puzzle
            </button>
            <button className="p-4 rounded-lg bg-green-600 hover:bg-green-700 transition-colors duration-300 cursor-pointer uppercase">
              Help
            </button>
          </div>
        </div>
      </main>

      <footer className="w-full">
        <div className="flex justify-center gap-4 mt-10">
          <a href="" className="hover:text-white transition-colors">
            Privacy
          </a>
          <a href="" className="hover:text-white transition-colors">
            Terms
          </a>
          <a href="" className="hover:text-white transition-colors">
            Github
          </a>
        </div>
      </footer>
    </div>
  );
}

export default App;
