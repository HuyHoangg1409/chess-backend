import React, { useState, useRef, useEffect, act, useCallback } from "react";
import { Chess } from "chess.js";
import { ChessBoardView } from "../../components/ChessBoard/ChessBoardView";
import MoveHistoryTable from "../../components/MoveHistoryTable";
import { playSound } from "../../utils/sounds";
import { getCapturedPieces, getPieceValue } from "../../utils/chessHelper";
import { useChessTimer } from "../../hooks/useChessTimer";

export default function RealGame({ currentUser }) {
  const [game, setGame] = useState(new Chess());
  const [roomIdInput, setRoomIdInput] = useState("");
  const [currentRoom, setCurrentRoom] = useState(null);
  const [isInRoom, setIsInRoom] = useState(false);
  const [gameStarted, setGameStarted] = useState(false);
  const [isCompleted, setIsCompleted] = useState(false);
  const [actualColor, setActualColor] = useState("white");
  const [message, setMessage] = useState("Nhập mã phòng để bắt đầu");

  const [opponent, setOpponent] = useState(null);

  const wsRef = useRef(null);

  const connectWebsocket = (targetRoomId) => {
    if (wsRef.current) {
      wsRef.current.close();
    }

    const backendBaseURL =
      import.meta.env.VITE_API_BASE_URL || "http://localhost:8000";

    const wsBaseURL = backendBaseURL
      .replace(/^http:/, "ws:")
      .replace(/^https:/, "wss:");

    const token = localStorage.getItem("access_token");
    const wsURL = `${wsBaseURL}/ws/${targetRoomId}?token=${token}`;
    const ws = new WebSocket(wsURL);
    wsRef.current = ws;

    ws.onopen = () => {
      setCurrentRoom(targetRoomId);
      setIsInRoom(true);
      setMessage("Đang chờ đối thủ...");
    };

    ws.onmessage = (event) => {
      const data = JSON.parse(event.data);

      switch (data.type) {
        case "init": {
          setActualColor(data.color);
          if (data.fen) {
            const loadedGame = new Chess(data.fen);
            setGame(loadedGame);
          }
          break;
        }

        case "start": {
          playSound("game_start");
          const startedGame = new Chess(data.fen) || undefined;
          setGame(startedGame);
          setGameStarted(true);
          setIsCompleted(false);
          resetTimer(600);
          
          const amIWhite = data.white_player?.username === currentUser.username;
          const myColor = amIWhite ? "white" : "black";
          const opponentData = amIWhite ? data.black_player : data.white_player
          const playerTurn =
          data.turn === (actualColor === "white" ? "white" : "black");
          
          // setActualColor(myColor)
          setOpponent(opponentData);
          setMessage(
            playerTurn
              ? "Trận đấu bắt đầu! Lượt của bạn"
              : "Trận đấu bắt đầu! Lượt của đối thủ",
          );
        }

        case "move": {
          const newGame = new Chess();
          newGame.load(data.fen);
          setGame(newGame);

          if (newGame.inCheck()) {
            playSound("check");
          } else if (data.is_capture) {
            playSound("capture");
          } else {
            playSound("move");
          }

          if (data.is_over) {
            playSound("game_end");
            setIsCompleted(true);
            setGameStarted(false);
            setMessage(data.result || "Trận đấu kết thúc!");
          } else {
            const playerTurn = actualColor === "white" ? "w" : "b";
            setMessage(
              newGame.turn() === playerTurn
                ? "Lượt của bạn"
                : "Lượt của đối thủ",
            );
          }
          break;
        }

        case "player_left": {
          playSound("game_end");
          setGameStarted(false);
          setIsCompleted(true);
          setMessage(data.message);
          break;
        }

        case "error": {
          alert(data.message());
          handleLeaveRoom();
          break;
        }

        default:
          break;
      }
    };

    ws.onclose = () => {
      // setIsInRoom(false);
      // setGameStarted(false);
    };

    ws.onerror = (error) => {
      console.error(error);
      setMessage("Không thể kết nối tới server");
    };
  };

  const handleLeaveRoom = () => {
    if (wsRef.current) {
      wsRef.current.close();
      wsRef.current = null;
    }
    setIsInRoom(false);
    setGameStarted(false);
    setIsCompleted(false);
    setCurrentRoom(null);
    setGame(new Chess());
    setRoomIdInput("");
    setOpponent(null);
    setMessage("Nhập mã phòng để bắt đầu");
  };

  const handleCreateRoom = () => {
    const randomCode = Math.random().toString(36).substring(2, 8).toUpperCase();
    setRoomIdInput(randomCode);
    setMessage("Đã tạo mã. Bấm vào phòng để đợi đối thủ");
    // connectWebsocket(randomCode)
  };

  const handleJoinRoom = () => {
    const targetId = roomIdInput.trim().toUpperCase();
    if (!targetId) {
      setMessage("Vui lòng nhập hoặc tạo mã phòng trước!");
      return;
    }
    connectWebsocket(targetId);
  };

  const handleTimeOut = useCallback((loser) => {
    playSound("game_end");
    setIsCompleted(true);
    setGameStarted(false);
    if (loser === "player") {
      setMessage("Bạn đã hết giờ. Đối thủ thắng");
    }
    else {
      setMessage("Đối thủ hết giờ. Bạn thắng")
    }
  }, []);

  const {playerTime, opponentTime, formatTime, resetTimer} = useChessTimer({
    initialTime: 600,
    gameStarted,
    isCompleted,
    currentTurn: game.turn(),
    playerColor: actualColor,
    onTimeOut: handleTimeOut,
  })

  // const handleCopyRoomCode = () => {}
  const handleStartGame = () => {
    playSound("game_start");
    const newGame = new Chess();
    setGame(newGame);
    setIsCompleted(false);
    setGameStarted(true);

    let assignedColor = selectedColor;
    if (selectedColor === "random") {
      assignedColor = Math.random() < 0.5 ? "white" : "black";
    }
    const selectedTime =
      TIME_CONTROLS.find((t) => t.id === timeControl)?.initialSeconds || 600;
    setActualColor(assignedColor);
    setPlayerTime(selectedTime);
    setOpponentTime(selectedTime);

    setMessage(
      newGame.turn() === (assignedColor === "white" ? "w" : "b")
        ? "Lượt của bạn"
        : "Lượt của đối thủ",
    );
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

    const isMyTurn = game.turn() === (actualColor === "white" ? "w" : "b");
    if (!isMyTurn) return false;

    try {
      const newGame = new Chess();
      newGame.loadPgn(game.pgn());
      const move = newGame.move({
        from: pieceObject.sourceSquare,
        to: pieceObject.targetSquare,
        promotion: pieceObject.promotion || "q",
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

      const uciMove = `${pieceObject.sourceSquare}${pieceObject.targetSquare}${move.promotion ? move.promotion : ""}`;
      if (wsRef.current && wsRef.current.readyState === WebSocket.OPEN) {
        wsRef.current.send(
          JSON.stringify({
            type: "move",
            move: uciMove,
          }),
        );
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

  const playerCapturedValue = playerCaptured.reduce(
    (sum, piece) => sum + getPieceValue(piece),
    0,
  );
  const opponentCapturedValue = opponentCaptured.reduce(
    (sum, piece) => sum + getPieceValue(piece),
    0,
  );

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
              {opponent && opponent.username ? opponent.username.charAt(0).toUpperCase() : 'N'}
            </div>
            <div className="flex flex-col">
              <span className="text-stone-200">
                {isInRoom
                  ? gameStarted
                    ? opponent.username
                    : "Đang chờ đối thủ..."
                  : "Đối thủ"}
              </span>
              <span className="text-xs text-stone-500 font-normal font-mono">
                {opponent && `${opponent.elo} ELO`}
              </span>
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
                  <span className="ml-1 text-xs font-bold text-green-600">
                    +{opponentAdvantage}
                  </span>
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
          allowDragging={
            gameStarted &&
            !isCompleted &&
            game.turn() === (actualColor === "white" ? "w" : "b")
          }
        />

        {/* Thanh thông tin người chơi (dưới) */}
        <div className="flex items-center justify-between text-stone-300 text-sm font-semibold px-1 h-10">
          <div className="flex items-center gap-3">
            <div className="flex justify-center items-center w-8 h-8 rounded-full bg-emerald-600 font-semibold text-white text-sm shadow-md">
              {currentUser?.username
                ? currentUser.username.charAt(0).toUpperCase()
                : "U"}
            </div>
            <div className="flex flex-col">
              <span className="text-stone-100 font-bold">
                {currentUser?.username || "Bạn"}
              </span>
              <span className="text-xs text-stone-500 font-normal font-mono">
                {currentUser?.elo_rating
                  ? `${currentUser.elo_rating} ELO`
                  : "1200 ELO"}
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
                  <span className="ml-1 text-xs font-bold text-green-600">
                    +{playerAdvantage}
                  </span>
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
            <span className="text-base font-bold uppercase tracking-wider text-white">
              Chơi với người
            </span>
            <span
              className={`text-xs px-2 py-0.5 rounded-full font-semibold border ${
                isInRoom
                  ? "bg-emerald-500/10 text-emerald-400 border-emerald-500/20"
                  : "bg-stone-800 text-stone-400 border-stone-700"
              }`}
            >
              {isInRoom ? "Đã vào phòng" : "Trực tuyến"}
            </span>
          </div>
          <p className="text-xs text-stone-400 mt-1">1v1 chess battle</p>
        </div>

        {/* Thông báo trạng thái */}
        <div className="p-3 my-3 rounded-lg bg-button-bg-white text-gray-950 flex items-center justify-between shadow-md">
          <span className="text-sm font-bold uppercase tracking-wide truncate">
            {message}
          </span>
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
              <form
                onSubmit={(e) => {
                  e.preventDefault();
                  handleJoinRoom();
                }}
                className="flex flex-col gap-2"
              >
                <label className="text-xs font-semibold text-stone-400 uppercase tracking-wider">
                  Vào phòng có sẵn
                </label>
                <div className="flex gap-2">
                  <input
                    type="text"
                    value={roomIdInput}
                    onChange={(e) => setRoomIdInput(e.target.value)}
                    placeholder="Nhập mã phòng"
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

              <button
                type="button"
                onClick={handleCreateRoom}
                className="w-full py-2.5 bg-green-600 hover:bg-green-700 text-white font-bold text-sm rounded-xl transition-all shadow-md cursor-pointer flex items-center justify-center gap-2"
              >
                <span>Tạo phòng mới</span>
              </button>
            </div>
          ) : (
            /* Giao diện khi đã vào phòng */
            <div className="flex flex-col gap-2.5">
              <div className="flex items-center justify-between p-2.5 bg-[#1e1d1b] rounded-xl border border-stone-800">
                <div className="flex flex-col">
                  <span className="text-[11px] text-stone-400 uppercase font-semibold">
                    Phòng hiện tại
                  </span>
                  <span className="text-sm font-bold font-mono text-emerald-400">
                    {currentRoom}
                  </span>
                </div>
              </div>

              {!gameStarted ? (
                <div className="flex gap-2">
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
