import React, { useState, useRef, useEffect } from "react";
import { Chess } from "chess.js";
import { ChessBoardView } from "../../components/ChessBoard/ChessBoardView";
import MoveHistoryTable from "../../components/MoveHistoryTable";
import { playSound } from "../../utils/sounds";

/**
 * Tính toán danh sách các quân cờ đã bị bắt của cả 2 bên (Trắng và Đen).
 * Dựa trên số lượng quân ban đầu trừ đi số lượng quân còn lại trên bàn cờ.
 * 
 * @param {Chess} game - Đối tượng bàn cờ chess.js hiện tại
 * @returns {{ w: string[], b: string[] }} Danh sách loại quân đã bị ăn (w: quân trắng bị ăn, b: quân đen bị ăn)
 */
const getCapturedPieces = (game) => {
  const initialQuantities = {
    p: 8,
    n: 2,
    b: 2,
    r: 2,
    q: 1,
  };

  const currentCount = {
    w: { p: 0, n: 0, b: 0, r: 0, q: 0 },
    b: { p: 0, n: 0, b: 0, r: 0, q: 0 },
  };

  const board = game.board();
  for (let r = 0; r < 8; r++) {
    for (let c = 0; c < 8; c++) {
      const piece = board[r][c];
      if (piece && piece.type !== "k") {
        currentCount[piece.color][piece.type]++;
      }
    }
  }

  const captured = {
    w: [],
    b: [],
  };

  for (const type of ["p", "n", "b", "r", "q"]) {
    const missing = initialQuantities[type] - currentCount.w[type];
    if (missing > 0) {
      for (let i = 0; i < missing; i++) {
        captured.w.push(type);
      }
    }
  }

  for (const type of ["p", "n", "b", "r", "q"]) {
    const missing = initialQuantities[type] - currentCount.b[type];
    if (missing > 0) {
      for (let i = 0; i < missing; i++) {
        captured.b.push(type);
      }
    }
  }

  return captured;
};

/**
 * Quy đổi giá trị điểm số của từng loại quân cờ để tính chênh lệch vật chất.
 * Pawn = 1, Knight/Bishop = 3, Rook = 5, Queen = 9.
 * 
 * @param {'p'|'n'|'b'|'r'|'q'} type - Loại quân cờ ('p', 'n', 'b', 'r', 'q')
 * @returns {number} Điểm số tương ứng
 */
const getPieceValue = (type) => {
  switch (type) {
    case "p": return 1;
    case "n": return 3;
    case "b": return 3;
    case "r": return 5;
    case "q": return 9;
    default: return 0;
  }
};

const TIME_CONTROLS = [
  { id: "3m", label: "3 phút", type: "Blitz", initialSeconds: 180 },
  { id: "5m", label: "5 phút", type: "Rapid", initialSeconds: 300 },
  { id: "10m", label: "10 phút", type: "Rapid", initialSeconds: 600 },
];

export default function RealGame({ currentUser }) {
  const [game, setGame] = useState(new Chess());
  const [gameStarted, setGameStarted] = useState(false);
  const [isSearching, setIsSearching] = useState(false);
  const [isCompleted, setIsCompleted] = useState(false);
  const [selectedColor, setSelectedColor] = useState("white");
  const [actualColor, setActualColor] = useState("white");
  const [timeControl, setTimeControl] = useState("10m");
  const [message, setMessage] = useState("Sẵn sàng tìm trận");
  const [playerTime, setPlayerTime] = useState(600);
  const [opponentTime, setOpponentTime] = useState(600);

  const timerRef = useRef(null);

  // Cập nhật lại thời gian hiển thị mỗi khi đổi chế độ thời gian (khi trận chưa bắt đầu)
  useEffect(() => {
    const selected = TIME_CONTROLS.find((t) => t.id === timeControl);
    if (selected && !gameStarted) {
      setPlayerTime(selected.initialSeconds);
      setOpponentTime(selected.initialSeconds);
    }
  }, [timeControl, gameStarted]);

  /**
   * Chuyển đổi thời gian từ giây sang chuỗi định dạng hiển thị phút:giây (MM:SS).
   * 
   * @param {number} seconds - Tổng số giây còn lại
   * @returns {string} Chuỗi thời gian đã format (ví dụ: "05:00")
   */
  const formatTime = (seconds) => {
    const mins = Math.floor(seconds / 60);
    const secs = seconds % 60;
    return `${mins.toString().padStart(2, "0")}:${secs.toString().padStart(2, "0")}`;
  };

  /**
   * Khởi tạo và thiết lập bàn cờ mới khi ván đấu chính thức bắt đầu.
   * Xử lý gán màu quân nếu chọn Random, reset thời gian đếm ngược và thông báo lượt đi đầu tiên.
   */
  const handleStartGame = () => {
    playSound("game_start");
    const newGame = new Chess();
    setGame(newGame);
    setIsCompleted(false);
    setIsSearching(false);
    setGameStarted(true);

    let assignedColor = selectedColor;
    if (selectedColor === "random") {
      assignedColor = Math.random() < 0.5 ? "white" : "black";
    }
    const selectedTime = TIME_CONTROLS.find((t) => t.id === timeControl)?.initialSeconds || 600;
    setActualColor(assignedColor);
    setPlayerTime(selectedTime);
    setOpponentTime(selectedTime);

    setMessage(newGame.turn() === (assignedColor === "white" ? "w" : "b") ? "Lượt của bạn" : "Lượt của đối thủ");
  };

  /**
   * Xử lý khi người dùng bấm nút tìm trận.
   */
  const handleFindMatch = () => {
    if (isSearching) {
      setIsSearching(false);
      setMessage("Đã hủy tìm trận");
      return;
    }

    setIsSearching(true);
    setMessage("Đang tìm đối thủ...");

    setTimeout(() => {
      handleStartGame();
    }, 1500);
  };

  /**
   * Xử lý khi người chơi đầu hàng..
   */
  const handleResign = () => {
    playSound("game_end");
    setIsCompleted(true);
    setGameStarted(false);
    setIsSearching(false);
    setMessage("Bạn đã đầu hàng");
  };

  /**
   * Xử lý khi người chơi thực hiện thao tác kéo thả một quân cờ trên bàn cờ.
   * - Kiểm tra tính hợp lệ của nước đi qua thư viện chess.js
   * - Phát âm thanh tương ứng
   * - Kiểm tra trạng thái ván cờ
   * 
   * @param {{ sourceSquare: string, targetSquare: string }} pieceObject - Thông tin ô nguồn và ô đích của nước đi
   * @returns {boolean} True nếu nước đi hợp lệ và được chấp nhận, ngược lại False
   */
  const handlePieceDrop = (pieceObject) => {
    if (!gameStarted || isCompleted) return false;

    try {
      const newGame = new Chess();
      newGame.loadPgn(game.pgn());
      const move = newGame.move({
        from: pieceObject.sourceSquare,
        to: pieceObject.targetSquare,
        promotion: "q",
      });

      if (!move) return false;

      if (newGame.inCheck()) {
        playSound("check");
      } else if (move.isCapture()) {
        playSound("capture");
      } else {
        playSound("move");
      }

      setGame(newGame);

      if (newGame.isGameOver()) {
        playSound("game_end");
        setIsCompleted(true);
        setGameStarted(false);
        if (newGame.isDraw()) {
          setMessage("Hòa cờ!");
        } else {
          const winner = newGame.turn() === "b" ? "Trắng thắng" : "Đen thắng";
          setMessage(`Chiếu bí! ${winner}`);
        }
      } else {
        const playerTurnColor = actualColor === "white" ? "w" : "b";
        setMessage(newGame.turn() === playerTurnColor ? "Lượt của bạn" : "Lượt của đối thủ");
      }

      return true;
    } catch (error) {
      playSound("decline");
      setMessage("Nước đi không hợp lệ");
      return false;
    }
  };

  // Tính toán số lượng và chênh lệch quân bị bắt giữa 2 bên
  const captured = getCapturedPieces(game);
  const playerCaptured = actualColor === "white" ? captured.b : captured.w;
  const opponentCaptured = actualColor === "white" ? captured.w : captured.b;

  const playerCapturedValue = playerCaptured.reduce((sum, piece) => sum + getPieceValue(piece), 0);
  const opponentCapturedValue = opponentCaptured.reduce((sum, piece) => sum + getPieceValue(piece), 0);

  const playerAdvantage = playerCapturedValue - opponentCapturedValue;
  const opponentAdvantage = opponentCapturedValue - playerCapturedValue;

  return (
    <>
      <div className="flex flex-col gap-3.5 w-140 bg-chess-outline p-4 rounded-xl shadow-2xl border border-chess-border">
        <div className="flex items-center justify-between text-stone-300 text-sm font-semibold px-1 h-10">
          <div className="flex items-center gap-3">
            <div className="flex justify-center items-center w-8 h-8 rounded-full bg-stone-700 font-semibold text-white text-sm border border-stone-600">
              {isSearching ? "⏳" : "👨"}
            </div>
            <div className="flex flex-col">
              <span className="text-stone-200">
                {gameStarted ? "Đối thủ (Online)" : isSearching ? "Đang tìm trận..." : "Đối thủ"}
              </span>
              <span className="text-xs text-stone-500 font-normal font-mono">1200 ELO</span>
            </div>
          </div>

          <div className="flex items-center gap-3">
            {opponentCaptured.length > 0 && (
              <div className="flex items-center gap-1.5 bg-button-bg-white px-2 py-0.5 rounded-md border border-stone-800 shadow-inner">
                <div className="flex -space-x-2">
                  {opponentCaptured.map((piece, idx) => (
                    <img
                      key={idx}
                      src={`pieces/${actualColor === "white" ? "w" : "b"}${piece}.svg`}
                      alt={piece}
                      className="w-5 h-5 object-contain"
                    />
                  ))}
                </div>
                {opponentAdvantage > 0 && (
                  <span className="ml-1 text-xs font-bold text-green-600">+{opponentAdvantage}</span>
                )}
              </div>
            )}

            <div className="bg-[#1e1d1b] px-3 py-1.5 rounded-lg border border-stone-800 font-mono text-sm font-bold text-stone-300 shadow-inner">
              {formatTime(opponentTime)}
            </div>
          </div>
        </div>

        <ChessBoardView
          key={`board-${actualColor}`}
          game={game}
          onPieceDrop={handlePieceDrop}
          boardOrientation={actualColor}
          allowDragging={gameStarted && !isCompleted}
        />

        <div className="flex items-center justify-between text-stone-300 text-sm font-semibold px-1 h-10">
          <div className="flex items-center gap-3">
            <div className="flex justify-center items-center w-8 h-8 rounded-full bg-emerald-600 font-semibold text-white text-sm shadow-md">
              {currentUser?.username ? currentUser.username.charAt(0).toUpperCase() : "U"}
            </div>
            <div className="flex flex-col">
              <span className="text-stone-100 font-bold">{currentUser?.username || "Bạn"}</span>
              <span className="text-xs text-stone-500 font-normal font-mono">
                {currentUser?.elo_rating ? `${currentUser.elo_rating} ELO` : "1200 ELO"}
              </span>
            </div>
          </div>

          <div className="flex items-center gap-3">
            {playerCaptured.length > 0 && (
              <div className="flex items-center gap-1.5 bg-button-bg-white px-2 py-0.5 rounded-md border border-stone-800 shadow-inner">
                <div className="flex -space-x-2">
                  {playerCaptured.map((piece, idx) => (
                    <img
                      key={idx}
                      src={`pieces/${actualColor === "white" ? "b" : "w"}${piece}.svg`}
                      alt={piece}
                      className="w-5 h-5 object-contain"
                    />
                  ))}
                </div>
                {playerAdvantage > 0 && (
                  <span className="ml-1 text-xs font-bold text-green-600">+{playerAdvantage}</span>
                )}
              </div>
            )}

            <div className="bg-[#1e1d1b] px-3 py-1.5 rounded-lg border border-stone-800 font-mono text-sm font-bold text-white shadow-inner">
              {formatTime(playerTime)}
            </div>
          </div>
        </div>
      </div>

      <div className="flex flex-col w-85 bg-chess-outline p-4 rounded-xl shadow-xl border border-chess-border">
        <div className="border-b border-chess-border pb-3.5">
          <div className="flex items-center justify-between">
            <span className="text-lg font-bold uppercase tracking-wider text-white">Chơi với người</span>
            <span className="text-xs px-2 py-0.5 rounded-full bg-emerald-500/10 text-emerald-400 font-semibold border border-emerald-500/20">
              Trực tuyến
            </span>
          </div>
          <p className="text-xs text-stone-400 mt-1">Ghép trận ngẫu nhiên 1 vs 1</p>
        </div>

        <div className="p-3.5 my-3 rounded-lg bg-button-bg-white text-gray-950 flex items-center justify-between shadow-md">
          <span className="text-base font-bold uppercase tracking-wide truncate">{message}</span>
          {gameStarted && (
            <span className="w-2.5 h-2.5 rounded-full bg-green-600 animate-ping"></span>
          )}
        </div>

        <MoveHistoryTable history={game.history()} />

        <div className="flex flex-col gap-3.5 w-full mt-auto pt-3 border-t border-chess-border">
          <div className="flex flex-col gap-1.5">
            <label className="text-xs font-semibold text-stone-400 uppercase tracking-wider">Thời gian</label>
            <div className="grid grid-cols-3 gap-1.5 p-1 bg-[#1e1d1b] rounded-xl border border-stone-800/80">
              {TIME_CONTROLS.map((tc) => {
                const isSelected = timeControl === tc.id;
                return (
                  <button
                    key={tc.id}
                    type="button"
                    disabled={gameStarted || isSearching}
                    onClick={() => setTimeControl(tc.id)}
                    className={`flex flex-col items-center justify-center py-1.5 rounded-lg text-xs font-bold transition-all cursor-pointer disabled:cursor-not-allowed disabled:opacity-50 ${
                      isSelected
                        ? "bg-stone-700 text-white shadow-sm ring-1 ring-stone-500"
                        : "text-stone-400 hover:text-stone-200 hover:bg-stone-800/50"
                    }`}
                  >
                    <span>{tc.label}</span>
                    <span className="text-[10px] font-normal text-stone-400">{tc.type}</span>
                  </button>
                );
              })}
            </div>
          </div>

          <div className="flex flex-col gap-1.5">
            <label className="text-xs font-semibold text-stone-400 uppercase tracking-wider">Chọn màu quân</label>
            <div className="grid grid-cols-3 gap-1.5 p-1 bg-[#1e1d1b] rounded-xl border border-stone-800/80">
              <button
                type="button"
                disabled={gameStarted || isSearching}
                onClick={() => setSelectedColor("white")}
                className={`flex items-center justify-center gap-1.5 py-2.5 rounded-lg text-xs font-bold transition-all cursor-pointer disabled:cursor-not-allowed disabled:opacity-50 ${
                  selectedColor === "white"
                    ? "bg-stone-100 text-stone-950 shadow-md ring-1 ring-white"
                    : "text-stone-400 hover:text-stone-200 hover:bg-stone-800/50"
                }`}
              >
                <span className="w-3 h-3 rounded-full bg-white border border-stone-400 inline-block"></span>
                <span>Trắng</span>
              </button>

              <button
                type="button"
                disabled={gameStarted || isSearching}
                onClick={() => setSelectedColor("random")}
                className={`flex items-center justify-center gap-1.5 py-2.5 rounded-lg text-xs font-bold transition-all cursor-pointer disabled:cursor-not-allowed disabled:opacity-50 ${
                  selectedColor === "random"
                    ? "bg-stone-600 text-white shadow-md ring-1 ring-stone-400"
                    : "text-stone-400 hover:text-stone-200 hover:bg-stone-800/50"
                }`}
              >
                <span>Ngẫu nhiên</span>
              </button>

              <button
                type="button"
                disabled={gameStarted || isSearching}
                onClick={() => setSelectedColor("black")}
                className={`flex items-center justify-center gap-1.5 py-2.5 rounded-lg text-xs font-bold transition-all cursor-pointer disabled:cursor-not-allowed disabled:opacity-50 ${
                  selectedColor === "black"
                    ? "bg-stone-900 text-white shadow-md ring-1 ring-stone-600"
                    : "text-stone-400 hover:text-stone-200 hover:bg-stone-800/50"
                }`}
              >
                <span className="w-3 h-3 rounded-full bg-black border border-stone-600 inline-block"></span>
                <span>Đen</span>
              </button>
            </div>
          </div>

          <div className="flex flex-col gap-2.5 mt-1">
            {!gameStarted ? (
              <button
                type="button"
                onClick={handleFindMatch}
                className={`w-full py-3.5 rounded-xl font-bold text-base transition-all duration-200 cursor-pointer shadow-lg flex items-center justify-center gap-2 ${
                  isSearching
                    ? "bg-amber-600 hover:bg-amber-700 text-white animate-pulse"
                    : "bg-green-600 hover:bg-green-700 text-white hover:shadow-green-900/40"
                }`}
              >
                {isSearching ? (
                  <>
                    <span>Đang tìm đối thủ... (Hủy)</span>
                  </>
                ) : (
                  <>
                    <span>Tìm trận ngay</span>
                  </>
                )}
              </button>
            ) : (
              <div className="flex gap-2">
                <button
                  type="button"
                  onClick={handleResign}
                  className="flex-1 py-3 rounded-xl font-bold text-sm bg-red-600/90 hover:bg-red-600 text-white transition-all cursor-pointer flex items-center justify-center gap-1.5 shadow-md"
                >
                  <span>🏳️</span>
                  <span>Đầu hàng</span>
                </button>
                <button
                  type="button"
                  onClick={() => setMessage("Đã gửi lời mời cầu hòa")}
                  className="flex-1 py-3 rounded-xl font-bold text-sm bg-stone-700 hover:bg-stone-600 text-stone-200 transition-all cursor-pointer flex items-center justify-center gap-1.5 shadow-md"
                >
                  <span>🤝</span>
                  <span>Cầu hòa</span>
                </button>
              </div>
            )}
          </div>
        </div>
      </div>
    </>
  );
}