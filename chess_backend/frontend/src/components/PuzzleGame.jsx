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

export default function PuzzleGame() {
  const [puzzle, setPuzzle] = useState(null);
  const [game, setGame] = useState(null);
  const [boardOrientation, setBoardOrientation] = useState("white");
  const [message, setMessage] = useState("");
  const [moveIndex, setMoveIndex] = useState(0);
  const [isFailed, setIsFailed] = useState(false);
  const [isCompleted, setIsCompleted] = useState(false);
  const [moveHistory, setMoveHistory] = useState([]);

  const isFetchingRef = useRef(false);
  const soundsRef = useRef({
    move: new Audio("/move.mp3"),
    capture: new Audio("/capture.mp3"),
    check: new Audio("/move-check.mp3"),
    correct: new Audio("/correct.mp3"),
    decline: new Audio("/decline.mp3"),
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
      // const data = await getPuzzleById(738933);
      const data = await getPuzzleById(241361);
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
    if (index >= movesArray.length) {
      playSound("correct");
      setMessage("Puzzle Done");
      console.log("Đáp án chính xác, cộng ", response.elo_changed, " elo");
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

    setMoveHistory((prev) => [...prev, movesArray[index]]);

    const nextIndex = index + 1;
    setMoveIndex(nextIndex);

    if (nextIndex >= movesArray.length) {
      playSound("correct");
      setMessage("Puzzle Done");
      console.log("Đáp án chính xác, cộng ", response.elo_changed, " elo");
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
    if (isFailed || isCompleted) return false;

    const newGame = new Chess(game.fen());
    let move = null;
    try {
      move = newGame.move({
        from: pieceObject.sourceSquare,
        to: pieceObject.targetSquare,
        // promotion: 'q',
      });
    } catch (e) {
      playSound("decline");
      return false;
    }

    if (!move) return false;
    setGame(newGame);

    const userMove = `${pieceObject.sourceSquare}${pieceObject.targetSquare}`;
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
          setIsFailed(true);
          setMessage("Incorrect Answer");
          console.log(
            "Đáp án chưa chính xác, trừ ",
            response.elo_changed,
            " elo",
          );
          newGame.undo();
          setGame(new Chess(newGame.fen()));
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
          setMessage("Puzzle Done");
          console.log("Đáp án chính xác, cộng ", response.elo_changed, " elo");
        } else {
          makeEngineMove(newGame, movesArray, nextIndex);
        }
        return true;
      })
      .catch((error) => {
        console.error("Lỗi kết nối API: ", error);
      });
  };

  if (!puzzle || !game) {
    return (
      <div>
        <p>Loading Puzzles</p>
      </div>
    );
  }

  /**
   * Cấu hình các thuộc tính và sự kiện của bàn cờ bao gồm id, position -> thế cờ hiện tại, onPieceDrop -> hàm xử lý khi thả quân cờ
   */
  const chessBoardOptions = {
    id: "board-01",
    boardOrientation: boardOrientation,
    onPieceDrop: makeAMove,
    allowDragging: !isFailed,
    position: game ? game.fen() : "8/8/8/8/8/8/8/8 w - - 0 1",
    animationDurationInMs: 300,
    darkSquareStyle: { backgroundColor: "var(--color-chess-dark)" },
    lightSquareStyle: { backgroundColor: "var(--color-chess-light)" },
  };

  return (
    <main className="flex justify-between w-full max-w-6xl">
      <div className="w-140 bg-chess-outline p-3.5 rounded-xl shadow-2xl border border-chess-border">
        <Chessboard key={puzzle.puzzle_id} options={chessBoardOptions} />
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
          {!isFailed&&(<button className="p-4 rounded-lg bg-green-600 hover:bg-green-700 transition-colors duration-300 cursor-pointer uppercase">
            Help
          </button>)}
          {isFailed&&(<button className="p-4 rounded-lg bg-green-600 hover:bg-green-700 transition-colors duration-300 cursor-pointer uppercase">
            View solution
          </button>)}
        </div>
      </div>
    </main>
  );
}
