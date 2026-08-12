import React, { useEffect, useState, useRef } from "react";
import {
  Chessboard,
  defaultDarkSquareStyle,
  defaultDraggingPieceGhostStyle,
} from "react-chessboard";
import { Chess } from "chess.js";
import { playSound } from "../../utils/sounds";
import { ChessBoardView } from "../../components/ChessBoard/ChessBoardView";
import {
  checkPuzzle,
  getPuzzleById,
  getRandomPuzzle,
  getHelp,
  addPuzzleHistory,
} from "../../services/api";
import {
  correctMovesArray,
  getTurn,
  getOppositeTurn,
  getMove,
} from "../../utils/chessHelper";
import PromotionDialog from "../../components/PromotionDialog";

export default function PuzzleGame({ onUpdateElo }) {
  const [puzzle, setPuzzle] = useState(null);
  const [game, setGame] = useState(null);
  const [boardOrientation, setBoardOrientation] = useState("white");
  const [message, setMessage] = useState("");
  const [moveIndex, setMoveIndex] = useState(0);
  const [isFailed, setIsFailed] = useState(false);
  const [isCompleted, setIsCompleted] = useState(false);
  const [moveHistory, setMoveHistory] = useState([]);
  const [boardAnimationDuration, setBoardAnimationDuration] = useState(200);
  const [promotionData, setPromotionData] = useState(null);

  const isFetchingRef = useRef(false);

  /**
   * Gọi API từ backend để lấy ngẫu nhiên 1 câu đố từ database và cập nhật lại trạng thái bàn cờ hiện tại.
   */
  const fetchRandomPuzzle = async () => {
    if (isFetchingRef.current) {
      return;
    }
    isFetchingRef.current = true;

    setMessage("");
    setMoveIndex(0);
    setMoveHistory([]);
    setIsCompleted(false);
    setIsFailed(false);

    try {
      // const data = await getPuzzleById(273139);
      const data = await getRandomPuzzle();

      const newGame = new Chess(data.fen_position);
      const movesArray = correctMovesArray(data.correct_moves);
      const boardOrientation = getOppositeTurn(data.fen_position);

      setPuzzle(data);
      setBoardOrientation(boardOrientation);
      setGame(newGame);

      setTimeout(() => {
        playSound("move");
        makeEngineMove(newGame, movesArray, 0);
        isFetchingRef.current = false;
      }, 600);
    } catch (error) {
      setMessage("Can't Load Puzzlee: ", error);
      isFetchingRef.current = false;
      throw error;
    }
  };

  useEffect(() => {
    fetchRandomPuzzle();
  }, []);

  /**
   * Xử lý sự kiện người chơi ấn vào nút View Solution để xem đáp án.
   * Tự động chạy qua 1 lượt tất cả các nước đi chính xác từ vị trí đi sai của người chơi.
   */
  const showSolution = async () => {
    if (!puzzle || isCompleted) return;
    setBoardAnimationDuration(200);
    setIsCompleted(true);

    const movesArray = correctMovesArray(puzzle.correct_moves);
    const newGame = new Chess(game.fen());
    for (let i = moveIndex; i < movesArray.length; i++) {
      await new Promise((resolve) => setTimeout(resolve, 700));

      const moveStr = movesArray[i];

      const sourceSquare = moveStr.substring(0, 2);
      const targetSquare = moveStr.substring(2, 4);
      const promotion = moveStr[4] || undefined;

      const move = newGame.move({
        from: sourceSquare,
        to: targetSquare,
        promotion: promotion,
      });

      if (move) {
        playSound("move");
        setGame(new Chess(newGame.fen()));
      }
    }
    playSound("correct");
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
    setBoardAnimationDuration(200);

    if (index >= movesArray.length) {
      console.log("Đáp án chính xác, cộng ", response.elo_changed, " elo");
      playSound("correct");
      onUpdateElo(response.elo_changed);
      setMessage(`Puzzle Done (+${response.elo_changed} ELO)`);
      setIsCompleted(true);
      addPuzzleHistory(
        puzzle.puzzle_id,
        true,
        localStorage.getItem("access_token"),
      );
      return;
    }

    setMessage("Computer Turn...");

    const engineMoves = getMove(movesArray[index]);
    if (!engineMoves) return;

    const newGame = new Chess(currentGame.fen());
    const move = newGame.move({
      from: engineMoves.from,
      to: engineMoves.to,
      promotion: "q",
    });
    setGame(newGame);

    if (move) {
      if (move.captured) {
        playSound("capture");
      } else {
        playSound("move");
      }
    }

    setMoveHistory((prev) => [...prev, movesArray[index]]);

    const nextIndex = index + 1;
    setMoveIndex(nextIndex);

    if (nextIndex >= movesArray.length) {
      console.log("Đáp án chính xác, cộng ", response.elo_changed, " elo");
      playSound("correct");
      onUpdateElo(response.elo_changed);
      setMessage(`Puzzle Done (+${response.elo_changed} ELO)`);
      setIsCompleted(true);
      addPuzzleHistory(
        puzzle.puzzle_id,
        true,
        localStorage.getItem("access_token"),
      );
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
  const makeAMove = (pieceObject, selectedPromotion = null) => {
    if (isFailed || isCompleted) return false;

    setBoardAnimationDuration(0);

    const isPromotion = handlePromotionCheck(
      pieceObject.sourceSquare,
      pieceObject.targetSquare,
      pieceObject.piece?.pieceType || "P",
    );

    if (isPromotion && !selectedPromotion) {
      setPromotionData({
        sourceSquare: pieceObject.sourceSquare,
        targetSquare: pieceObject.targetSquare,
        pieceObject: pieceObject,
      });
      return false;
    }

    const promotionPiece = selectedPromotion || "q";
    const newGame = new Chess(game.fen());
    let move = null;
    try {
      playSound("move");
      move = newGame.move({
        from: pieceObject.sourceSquare,
        to: pieceObject.targetSquare,
        promotion: promotionPiece,
      });
    } catch (e) {
      playSound("decline");

      return false;
    }

    if (!move) return false;
    setGame(newGame);

    const promotionChar = move.promotion ? move.promotion : "";
    const userMove = `${pieceObject.sourceSquare}${pieceObject.targetSquare}${promotionChar}`;
    const newHistory = [...moveHistory, userMove];

    if (moveIndex % 2 === 0) {
      return false;
    }
    if (!puzzle) return false;

    const movesArray = correctMovesArray(puzzle.correct_moves);

    if (moveIndex >= movesArray.length) return false;

    checkPuzzle(
      puzzle.puzzle_id,
      newHistory.join(" "),
      localStorage.getItem("access_token"),
    )
      .then((response) => {
        if (!response.is_correct) {
          console.log(
            "Đáp án chưa chính xác, trừ ",
            response.elo_changed,
            " elo",
          );
          playSound("decline");
          onUpdateElo(response.elo_changed);
          newGame.undo();

          setIsFailed(true);
          setMessage(`Incorrect Answer (${response.elo_changed} ELO)`);
          setBoardAnimationDuration(200);
          setGame(new Chess(newGame.fen()));

          addPuzzleHistory(
            puzzle.puzzle_id,
            false,
            localStorage.getItem("access_token"),
          );
          return false;
        }

        setMoveHistory(newHistory);

        if (move) {
          if (newGame.inCheck()) {
            playSound("check");
          } else if (move.captured) {
            playSound("capture");
          } else {
            playSound("move");
          }
        }

        const nextIndex = moveIndex + 1;
        setMoveIndex(nextIndex);

        if (nextIndex >= movesArray.length) {
          console.log("Đáp án chính xác, cộng ", response.elo_changed, " elo");
          playSound("correct");
          onUpdateElo(response.elo_changed);
          setMessage(`Puzzle Done (+${response.elo_changed} ELO)`);
          setIsCompleted(true);
          addPuzzleHistory(
            puzzle.puzzle_id,
            true,
            localStorage.getItem("access_token"),
          );
        } else {
          makeEngineMove(newGame, movesArray, nextIndex);
        }
        return true;
      })
      .catch((error) => {
        console.error("Lỗi kết nối API: ", error);
      });
  };

  /**
   * Kiểm tra nước đi có phải là phong cấp hay không.
   * @param {string} sourceSquare - Ô xuất phát của quân cờ
   * @param {string} targetSquare - Ô đích đến của quân cờ
   * @param {string} piece - Loại quân cờ thực hiện nước đi
   * @returns {boolean} Trả về true nếu nước đi là phong cấp, false nếu nước đi không phải phong cấp
   */
  const handlePromotionCheck = (sourceSquare, targetSquare, piece) => {
    const isPawn = piece.toUpperCase().endsWith("P");

    const isWhitePromotion = isPawn && targetSquare[1] == "8";
    const isBlackPromotion = isPawn && targetSquare[1] == "1";

    return isWhitePromotion || isBlackPromotion;
  };

  /**
   * Xử lý sự kiện người chơi chọn ô phong cấp.
   * Đóng bảng chọn và thực hiện nước đi với loại phong cấp được chọn.
   * @param {char} promotionPiece - Kí tự đại diện cho quân muốn phong cấp
   * @returns {void}
   */
  const handlePromotionPieceSelect = (promotionPiece) => {
    if (!promotionData) return;

    const { pieceObject } = promotionData;
    setPromotionData(null);

    makeAMove(pieceObject, promotionPiece);
  };

  /**
   * Xử lý sự kiện khi người chơi nhấn vào hút Help để nhận trợ giúp.
   * Tự động đi nước đi tiếp theo cho người chơi.
   */
  const handleGetHelp = async () => {
    if (!puzzle || isCompleted) {
      return;
    }
    if (!isCompleted) {
      setMessage("Solving...");
    }
    const data = await getHelp(
      puzzle.puzzle_id,
      moveIndex,
      localStorage.getItem("access_token"),
    );
    makeAMove(
      {
        sourceSquare: data.hint.substring(0, 2),
        targetSquare: data.hint.substring(2, 4),
      },
      data.hint.length == 5 ? data.hint[4] : "q",
    );
    setBoardAnimationDuration(200);
  };

  if (!puzzle || !game) {
    return (
      <div>
        <p>Loading Puzzles</p>
      </div>
    );
  }

  return (
    <main className="flex justify-between w-full max-w-6xl">
      <div className="relative w-140 bg-chess-outline p-3.5 rounded-xl shadow-2xl border border-chess-border">
        <ChessBoardView
          key={puzzle.puzzle_id}
          game={game}
          boardOrientation={boardOrientation}
          onPieceDrop={makeAMove}
          allowDragging={!isFailed}
          onPromotionCheck={handlePromotionCheck}
          onPromotionPieceSelect={handlePromotionPieceSelect}
          boardAnimationDuration={boardAnimationDuration}
        />

        <PromotionDialog
          promotionData={promotionData}
          onSelect={(pieceType) => handlePromotionPieceSelect(pieceType)}
        />
      </div>

      <div className="flex flex-col w-85 bg-chess-outline p-3.5 rounded-xl shadow-xl border border-chess-border">
        <div className="pl-3 border-b border-chess-border pb-4 text-xl font-semibold uppercase tracking-wider">
          <span>
            Puzzle {puzzle.puzzle_id} - {puzzle.rating} ELO
          </span>
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
          {!isFailed && (
            <button
              onClick={handleGetHelp}
              className="p-4 rounded-lg bg-green-600 hover:bg-green-700 transition-colors duration-300 cursor-pointer uppercase"
            >
              Help
            </button>
          )}
          {isFailed && (
            <button
              onClick={showSolution}
              className="p-4 rounded-lg bg-green-600 hover:bg-green-700 transition-colors duration-300 cursor-pointer uppercase"
            >
              View solution
            </button>
          )}
        </div>
      </div>
    </main>
  );
}
