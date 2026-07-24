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

  /**
   * Gọi API từ backend để lấy ngẫu nhiên 1 câu đố từ database và cập nhật lại trạng thái bàn cờ hiện tại.
   */
  const fetchRandomPuzzle = async () => {
    setMessage("");
    try {
      const data = await getRandomPuzzle();
      
      setPuzzle(data);

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
    // boardOrientation: getOppositeTurn(game.fen()),
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
    <>
      <div style={{ width: "500px", maxWidth: "100%" }}>
        <Chessboard options={chessBoardOptions} />
      </div>
      <div style={{ width: '300px', background: '#f8f9fa', padding: '20px', borderRadius: '8px' }}>
            <h2>Thế cờ #{puzzle.puzzle_id}</h2>
            <p><strong>Độ khó:</strong> {puzzle.difficulty}</p>
            
            <div style={{ padding: '10px', marginTop: '15px', borderRadius: '5px', background: '#e2e3e5', fontWeight: 'bold' }}>
              {message}
            </div>

            <button onClick={fetchRandomPuzzle} style={{ marginTop: '20px', width: '100%', padding: '10px', cursor: 'pointer' }}>
              Thế cờ tiếp theo ➡️
            </button>
          </div>
    </>
  );
}

export default App;
