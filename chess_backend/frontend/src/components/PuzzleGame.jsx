import React, { useEffect, useState, useRef } from "react";
import { Chessboard, defaultDarkSquareStyle } from "react-chessboard";
import { Chess } from "chess.js";
import { checkPuzzle, getPuzzleById, getRandomPuzzle } from "../services/api";
import {
  correctMovesArray,
  getTurn,
  getOppositeTurn,
  getMove,
} from "../utils/chessHelper";
import PromotionDialog from "./PromotionDialog";

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
  const soundsRef = useRef({
    move: new Audio("/audio/move.mp3"),
    capture: new Audio("/audio/capture.mp3"),
    check: new Audio("/audio/move-check.mp3"),
    correct: new Audio("/audio/correct.mp3"),
    decline: new Audio("/audio/decline.mp3"),
  });

  /**
   * Phát sound effect tương ứng với soundName chỉ định và tự động tua lại ban đầu trước khi phát
   * @param {string} soundName - Tên âm thanh cần phát
   */
  const playSound = (soundName) => {
    const sound = soundsRef.current[soundName];
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
      const data = await getPuzzleById(738933);
      // const data = await getPuzzleById(241361);
      // const data = await getRandomPuzzle();

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
      playSound("correct");
      setMessage(`Puzzle Done (+${response.elo_changed} ELO)`);
      console.log("Đáp án chính xác, cộng ", response.elo_changed, " elo");
      onUpdateElo(response.elo_changed);
      return;
    }

    setMessage("Computer Turn...");

    const engineMoves = getMove(movesArray[index]);
    if (!engineMoves) return;
    console.log(engineMoves);

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
      playSound("correct");
      setMessage(`Puzzle Done (+${response.elo_changed} ELO)`);
      console.log("Đáp án chính xác, cộng ", response.elo_changed, " elo");
      onUpdateElo(response.elo_changed);
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
      pieceObject.piece.pieceType,
    );
    console.log("p", isPromotion);

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
      console.error(e);

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

    console.log(newHistory.join(" "));

    checkPuzzle(
      puzzle.puzzle_id,
      newHistory.join(" "),
      localStorage.getItem("access_token"),
    )
      .then((response) => {
        if (!response.is_correct) {
          playSound("decline");
          setMessage(`Incorrect Answer (${response.elo_changed} ELO)`);

          setIsFailed(true);
          console.log(
            "Đáp án chưa chính xác, trừ ",
            response.elo_changed,
            " elo",
          );
          newGame.undo();
          setBoardAnimationDuration(200);
          setGame(new Chess(newGame.fen()));

          onUpdateElo(response.elo_changed);

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
          playSound("correct");
          setMessage(`Puzzle Done (+${response.elo_changed} ELO)`);
          console.log("Đáp án chính xác, cộng ", response.elo_changed, " elo");
          onUpdateElo(response.elo_changed);
        } else {
          makeEngineMove(newGame, movesArray, nextIndex);
        }
        return true;
      })
      .catch((error) => {
        console.error("Lỗi kết nối API: ", error);
      });
  };

  const handlePromotionCheck = (sourceSquare, targetSquare, piece) => {
    // console.log(piece);

    const isPawn = piece.toUpperCase().endsWith("P");
    // console.log(isPawn);

    const isWhitePromotion = isPawn && targetSquare[1] == "8";
    const isBlackPromotion = isPawn && targetSquare[1] == "1";

    return isWhitePromotion || isBlackPromotion;
  };

  const handlePromotionPieceSelect = (promotionPiece) => {
    if (!promotionData) return;

    const { pieceObject } = promotionData;
    setPromotionData(null);

    makeAMove(pieceObject, promotionPiece);
  };

  /**
   * Cấu hình các thuộc tính và sự kiện của bàn cờ bao gồm id, position -> thế cờ hiện tại, onPieceDrop -> hàm xử lý khi thả quân cờ
   */
  const chessBoardOptions = {
    id: "board-01",
    position: game ? game.fen() : "8/8/8/8/8/8/8/8 w - - 0 1",
    boardOrientation: boardOrientation,
    onPieceDrop: makeAMove,
    allowDragging: !isFailed,

    onPromotionCheck: handlePromotionCheck,
    onPromotionPieceSelect: handlePromotionPieceSelect,

    animationDurationInMs: boardAnimationDuration,
    darkSquareStyle: { backgroundColor: "var(--color-chess-dark)" },
    lightSquareStyle: { backgroundColor: "var(--color-chess-light)" },
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
        <Chessboard key={puzzle.puzzle_id} options={chessBoardOptions} />

        <PromotionDialog
          promotionData={promotionData}
          onSelect={(pieceType) => handlePromotionPieceSelect(pieceType)}
        />
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
          {!isFailed && (
            <button className="p-4 rounded-lg bg-green-600 hover:bg-green-700 transition-colors duration-300 cursor-pointer uppercase">
              Help
            </button>
          )}
          {isFailed && (
            <button className="p-4 rounded-lg bg-green-600 hover:bg-green-700 transition-colors duration-300 cursor-pointer uppercase">
              View solution
            </button>
          )}
        </div>
      </div>
    </main>
  );
}
