import React, { useState, useEffect } from "react";
import { Chessboard } from "react-chessboard";
import { Chess } from "chess.js";

import { getRandomPuzzle } from "./services/api";
import { correctMovesArray, getTurn, getOppositeTurn } from "./utils/chessHelper";

function App() {
  const [puzzle, setPuzzle] = useState(null);
  const [game, setGame] = useState(new Chess());
  const [message, setMessage] = useState("");

  /**
   * Gọi API từ backend để lấy ngẫu nhiên 1 câu đố từ database và cập nhật lại trạng thái bàn cờ hiện tại.
   */
  const fetchRandomPuzzle = async () => {
    setMessage("");
    try {
      const data = await getRandomPuzzle();
      setPuzzle(data);
      setGame(new Chess(data.fen_position));
    } catch (error) {
      setMessage("Không thể tải câu đố");
      throw error;
    }
  };

  useEffect(() => {
    fetchRandomPuzzle();
  }, []);

  /**
   * Xử lý logic khi người chơi kéo thả quân cờ trên bàn cờ.
   *
   * @param {Object} pieceObject - Đối tượng chứa thông tin quân cờ và nước đi bao gồm "piece", "sourceSquare" và "targetSquare"
   * @returns {boolean} Trả về true nếu nước đi hợp lệ và false nếu nước đi không hợp lệ
   */
  const makeAMove = (pieceObject) => {
    try {
      const sourceSquare = pieceObject.sourceSquare;
      const targetSquare = pieceObject.targetSquare;
      const newGame = new Chess(game.fen());
      const move = newGame.move({
        from: sourceSquare,
        to: targetSquare,
        promotion: "q",
      });

      if (move == null) {
        return false;
      }

      const userMove = `${sourceSquare}${targetSquare}`;

      setGame(newGame);
      const correctMovesArray = correctMovesArray(puzzle.correct_moves);
      if (userMove == correctMovesArray[0]) {
        setMessage("Nước đi chính xác");
      } else {
        setMessage("Nước đi chưa đúng");
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
    boardOrientation: getOppositeTurn(game.fen()),
    onPieceDrop: (sourceSquare, targetSquare) => {
      const validMove = makeAMove(sourceSquare, targetSquare);
      return validMove;
    },
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
      <div>
        <h3>ID puzzle: {puzzle.puzzle_id}</h3>
        <h3>Difficult: {puzzle.difficulty}</h3>
        <code style={{ wordBreak: "break-all" }}>{puzzle.fen_position}</code>

        <button onClick={fetchRandomPuzzle}>Change Puzzle</button>
      </div>
    </>
  );
}

export default App;
