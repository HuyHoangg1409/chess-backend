import React, { useState, useRef, useEffect } from "react";
import { Chess } from "chess.js";
import { ChessBoardView } from "../../components/ChessBoard/ChessBoardView";
import MoveHistoryTable from "../../components/MoveHistoryTable";
import { playSound } from "../../utils/sounds";
import { getCapturedPieces, getPieceValue } from "../../utils/chessHelper";

export default function RealGame({ currentUser }) {
  const [game, setGame] = useState(new Chess());
  const [roomIdInput, setRoomIdInput] = useState("");
  const [createRoomIdInput, setCreateRoomIdInput] = useState("");
  const [currentRoom, setCurrentRoom] = useState(null);
  const [isInRoom, setIsInRoom] = useState(false);
  const [gameStarted, setGameStarted] = useState(false);
  const [isCompleted, setIsCompleted] = useState(false);
  const [actualColor, setActualColor] = useState("white");
  const [message, setMessage] = useState("Nhập mã phòng để bắt đầu");
  const [copied, setCopied] = useState(false);

  const [playerTime, setPlayerTime] = useState(600);
  const [opponentTime, setOpponentTime] = useState(600);

  /**
   * Định dạng thời gian hiển thị (MM:SS)
   */
  const formatTime = (seconds) => {
    const mins = Math.floor(seconds / 60);
    const secs = seconds % 60;
    return `${mins.toString().padStart(2, "0")}:${secs.toString().padStart(2, "0")}`;
  };

  const handleJoinRoom = () => {

  }

  const handleLeaveRoom = () => {
    
  }

  const handleCreateRoom = () => {

  }

  const handleCopyRoomCode = () => {

  }

  /**
   * Khởi tạo và thiết lập bàn cờ mới khi ván đấu chính thức bắt đầu.
   * Xử lý gán màu quân nếu chọn Random, reset thời gian đếm ngược và thông báo lượt đi đầu tiên.
   */
  const handleStartGame = () => {
    playSound("game_start");
    const newGame = new Chess();
    setGame(newGame);
    setIsCompleted(false);
    setGameStarted(true);
    setPlayerTime(600);
    setOpponentTime(600);
    setMessage(newGame.turn() === (actualColor === "white" ? "w" : "b") ? "Lượt của bạn" : "Lượt của đối thủ");
  };

  /**
   * Xử lý khi người chơi đầu hàng
   */
  const handleResign = () => {
    playSound("game_end");
    setIsCompleted(true);
    setGameStarted(false);
    setMessage("Bạn đã đầu hàng");
  };

  /**
   * Xử lý khi thực hiện nước đi trên bàn cờ
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
      {/* Khung bàn cờ bên trái: sử dụng h-fit self-start để ôm vừa vặn nội dung, không bị kéo dãn */}
      <div className="flex flex-col gap-3 w-140 bg-chess-outline p-4 rounded-xl shadow-2xl border border-chess-border h-fit self-start">
        {/* Thanh thông tin đối thủ (trên) */}
        <div className="flex items-center justify-between text-stone-300 text-sm font-semibold px-1 h-10">
          <div className="flex items-center gap-3">
            <div className="flex justify-center items-center w-8 h-8 rounded-full bg-stone-700 font-semibold text-white text-sm border border-stone-600">
              {isInRoom ? (gameStarted ? "⚔️" : "⏳") : "👤"}
            </div>
            <div className="flex flex-col">
              <span className="text-stone-200">
                {isInRoom
                  ? gameStarted
                    ? "Đối thủ (Online)"
                    : "Đang chờ đối thủ..."
                  : "Đối thủ"}
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

        {/* Bàn cờ */}
        <ChessBoardView
          key={`board-${actualColor}`}
          game={game}
          onPieceDrop={handlePieceDrop}
          boardOrientation={actualColor}
          allowDragging={gameStarted && !isCompleted}
        />

        {/* Thanh thông tin người chơi (dưới) */}
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

      {/* Khung điều khiển & phòng bên phải: sử dụng h-fit self-start gọn gàng */}
      <div className="flex flex-col w-85 bg-chess-outline p-4 rounded-xl shadow-xl border border-chess-border h-fit self-start">
        {/* Header */}
        <div className="border-b border-chess-border pb-3">
          <div className="flex items-center justify-between">
            <span className="text-base font-bold uppercase tracking-wider text-white">Chơi với người</span>
            <span className={`text-xs px-2 py-0.5 rounded-full font-semibold border ${
              isInRoom
                ? "bg-emerald-500/10 text-emerald-400 border-emerald-500/20"
                : "bg-stone-800 text-stone-400 border-stone-700"
            }`}>
              {isInRoom ? "Đã vào phòng" : "Trực tuyến"}
            </span>
          </div>
          <p className="text-xs text-stone-400 mt-1">1v1 chess battle</p>
        </div>

        {/* Thông báo trạng thái */}
        <div className="p-3 my-3 rounded-lg bg-button-bg-white text-gray-950 flex items-center justify-between shadow-md">
          <span className="text-sm font-bold uppercase tracking-wide truncate">{message}</span>
          {gameStarted && (
            <span className="w-2.5 h-2.5 rounded-full bg-green-600 animate-ping shrink-0 ml-2"></span>
          )}
        </div>

        {/* Bảng lịch sử nước đi */}
        <MoveHistoryTable history={game.history()} className="h-52" />

        {/* Khối điều khiển / Nhập mã phòng */}
        <div className="flex flex-col gap-3 w-full pt-3 border-t border-chess-border mt-2">
          {!isInRoom ? (
            /* Giao diện tạo/nhập mã phòng */
            <div className="flex flex-col gap-4">
              <form onSubmit={(e) => { e.preventDefault(); handleCreateRoom(); }} className="flex flex-col gap-2">
                <label className="text-xs font-semibold text-stone-400 uppercase tracking-wider">
                  Tạo phòng mới
                </label>
                <div className="flex gap-2">
                  <input
                    type="text"
                    value={createRoomIdInput}
                    onChange={(e) => setCreateRoomIdInput(e.target.value)}
                    placeholder="Nhập mã phòng muốn tạo..."
                    className="flex-1 bg-[#1e1d1b] border border-stone-700 focus:border-green-500 focus:ring-1 focus:ring-green-500 rounded-xl px-3 py-2 text-sm text-stone-100 placeholder-stone-500 focus:outline-none transition-all"
                  />
                  <button
                    type="submit"
                    disabled={!createRoomIdInput.trim()}
                    className="px-4 py-2 bg-green-600 hover:bg-green-700 disabled:opacity-50 disabled:cursor-not-allowed text-white font-bold text-sm rounded-xl transition-all shadow-md cursor-pointer flex items-center justify-center shrink-0"
                  >
                    Tạo phòng
                  </button>
                </div>
              </form>

              <form onSubmit={(e) => { e.preventDefault(); handleJoinRoom(); }} className="flex flex-col gap-2">
                <label className="text-xs font-semibold text-stone-400 uppercase tracking-wider">
                  Vào phòng có sẵn
                </label>
                <div className="flex gap-2">
                  <input
                    type="text"
                    value={roomIdInput}
                    onChange={(e) => setRoomIdInput(e.target.value)}
                    placeholder="Nhập mã phòng (vd: 1234)..."
                    className="flex-1 bg-[#1e1d1b] border border-stone-700 focus:border-green-500 focus:ring-1 focus:ring-green-500 rounded-xl px-3 py-2 text-sm text-stone-100 placeholder-stone-500 focus:outline-none transition-all"
                  />
                  <button
                    type="submit"
                    disabled={!roomIdInput.trim()}
                    className="px-4 py-2 bg-green-600 hover:bg-green-700 disabled:opacity-50 disabled:cursor-not-allowed text-white font-bold text-sm rounded-xl transition-all shadow-md cursor-pointer flex items-center justify-center shrink-0"
                  >
                    Vào phòng
                  </button>
                </div>
              </form>
            </div>
          ) : (
            /* Giao diện khi đã vào phòng */
            <div className="flex flex-col gap-2.5">
              <div className="flex items-center justify-between p-2.5 bg-[#1e1d1b] rounded-xl border border-stone-800">
                <div className="flex flex-col">
                  <span className="text-[11px] text-stone-400 uppercase font-semibold">Phòng hiện tại</span>
                  <span className="text-sm font-bold font-mono text-emerald-400">{currentRoom}</span>
                </div>
                <button
                  type="button"
                  onClick={handleCopyRoomCode}
                  className="px-2.5 py-1 text-xs font-semibold bg-stone-800 hover:bg-stone-700 text-stone-300 rounded-lg border border-stone-700 transition-all cursor-pointer flex items-center gap-1"
                >
                  {copied ? "✓ Đã chép" : "📋 Sao chép"}
                </button>
              </div>

              {!gameStarted ? (
                <div className="flex gap-2">
                  <button
                    type="button"
                    onClick={handleStartGame}
                    className="flex-1 py-2.5 rounded-xl font-bold text-sm bg-green-600 hover:bg-green-700 text-white transition-all cursor-pointer shadow-md"
                  >
                    Bắt đầu
                  </button>
                  <button
                    type="button"
                    onClick={handleLeaveRoom}
                    className="px-3.5 py-2.5 rounded-xl font-bold text-sm bg-stone-800 hover:bg-stone-700 text-stone-300 transition-all cursor-pointer border border-stone-700"
                  >
                    Rời phòng
                  </button>
                </div>
              ) : (
                <div className="flex gap-2">
                  <button
                    type="button"
                    onClick={handleResign}
                    className="flex-1 py-2.5 rounded-xl font-bold text-sm bg-red-600/90 hover:bg-red-600 text-white transition-all cursor-pointer flex items-center justify-center gap-1.5 shadow-md"
                  >
                    <span>🏳️</span>
                    <span>Đầu hàng</span>
                  </button>
                  <button
                    type="button"
                    onClick={handleLeaveRoom}
                    className="px-3 py-2.5 rounded-xl font-bold text-sm bg-stone-800 hover:bg-stone-700 text-stone-300 transition-all cursor-pointer border border-stone-700"
                  >
                    Rời phòng
                  </button>
                </div>
              )}
            </div>
          )}
        </div>
      </div>
    </>
  );
}