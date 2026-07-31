import React, { useState, useEffect } from "react";
import { Chessboard } from "react-chessboard";
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
      setMessage("Không thể tải câu đố");
      throw error;
    }
  };

  useEffect(() => {
    fetchRandomPuzzle();
  }, []);

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
      setMessage("Hoàn thành câu đố");
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
      setMessage("Hoàn thành câu đố");
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
        setMessage("Đáp án chưa chính xác");
        return false;
      }

      const newGame = new Chess(game.fen());
      newGame.move({
        from: pieceObject.sourceSquare,
        to: pieceObject.targetSquare,
        promotion: "q",
      });
      setGame(newGame);

      const nextIndex = moveIndex + 1;
      setMoveIndex(nextIndex);

      if (nextIndex >= movesArray.length) {
        setMessage("Hoàn thành câu đố");
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
      <header className="flex justify-between items-center w-full max-w-5xl py-4 border-b-2 border-white mb-8">
        <div className="flex items-center">
          <h2 className="text-4xl text-green-600 font-bold">CHESS</h2>
        </div>

        <div className="flex items-baseline gap-2.5 ">
          <span className="text-2xl font-semibold text-red-400">USER</span>
          <span className="text-green-500">1200 ELO</span>
        </div>
      </header>

      <main className="flex justify-between w-210">
        <div className="max-w-2/5">
          <Chessboard options={chessBoardOptions} />
        </div>

        <div>
          <h2>Puzzles</h2>
          <button>Next Puzzle</button>
        </div>
      </main>

      <footer className="flex">
        <div>I'm a foot</div>
      </footer>
    </div>
  );
}

export default App;
