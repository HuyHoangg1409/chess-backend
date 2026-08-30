import React, { useEffect, useState } from "react";
import { Chess } from "chess.js";
import { ChessBoardView } from "../ChessBoard/ChessBoardView";
import MoveHistoryTable from "../MoveHistoryTable";
import { getMatchDetail } from "../../services/api";
import { getMovesArrayFromPgn } from "../../utils/chessHelper";
import { playSound } from "../../utils/sounds";

export default function MatchReview({ matchId, onBack }) {
  const [currentStep, setCurrentStep] = useState(null);
  const [fenList, setFenList] = useState([]);
  const [soundList, setSoundList] = useState([]);
  const [loading, setLoading] = useState(true);
  const [gameDetail, setGameDetail] = useState({
    id: null,
    my_color: "white",
    result: "",
    winner: null,
    fen: null,
    pgn: null,
    black: [],
    white: [],
  });

  useEffect(() => {
    const fetchMatchDetail = async () => {
      try {
        const token = localStorage.getItem("access_token");
        const data = await getMatchDetail(matchId, token);

        if (data && data.pgn) {
          const chess = new Chess();

          const fens = [chess.fen()];
          const sounds = [""];
          chess.loadPgn(data.pgn);

          const movesHistoryArray = chess.history();
          chess.reset();

          for (const move of movesHistoryArray) {
            const aMove = chess.move(move);
            if (chess.inCheck()) {
              sounds.push("check");
            } else if (aMove.captured) {
              sounds.push("capture");
            } else sounds.push("move");
            fens.push(chess.fen());
          }

          setSoundList(sounds);
          setFenList(fens);
          setCurrentStep(fens.length - 1);
        }

        setGameDetail({
          id: data.id,
          my_color: data.my_color,
          result: data.result,
          winner: data.winner,
          fen: data.fen,
          pgn: data.pgn,
          black: data.black,
          white: data.white,
        });
      } catch (error) {
        console.error(error);
      } finally {
        setLoading(false);
      }
    };

    fetchMatchDetail();
  }, [matchId]);

  const handleStart = () => {
    if (currentStep > 0) playSound("move");
    setCurrentStep(0);
  };

  const handlePrev = () => {
    if (currentStep > 0) playSound("move");
    setCurrentStep((prev) => Math.max(prev - 1, 0));
  };

  const handleNext = () => {
    if (currentStep < fenList.length - 1) playSound(soundList[currentStep + 1]);
    setCurrentStep((next) => Math.min(next + 1, fenList.length - 1));
  };

  const handleEnd = () => {
    if (currentStep < fenList.length - 1) playSound("move");
    setCurrentStep(fenList.length - 1);
  };

  if (loading) {
    return (
      <div className="flex-1 flex items-center justify-center min-h-[60vh] text-stone-400 text-lg">
        <span className="animate-pulse">Đang tải dữ liệu trận đấu...</span>
      </div>
    );
  }

  const isMyWhite = gameDetail.my_color !== "black";
  const opponentPlayer = isMyWhite ? gameDetail.black : gameDetail.white;
  const opponentColorLabel = isMyWhite ? "Đen" : "Trắng";

  /* ---------- Shared sub-components ---------- */

  /** Thanh thông tin đối thủ (trên bàn cờ) kèm nút Quay lại bên phải */
  const OpponentBar = () => (
    <div className="flex items-center justify-between text-stone-300 text-sm font-semibold px-1 h-10 gap-2">
      <div className="flex items-center gap-2 min-w-0">
        <div className="flex justify-center items-center w-8 h-8 rounded-full bg-emerald-600 font-semibold text-white text-sm border border-stone-600 shrink-0">
          {opponentPlayer?.username
            ? opponentPlayer.username.charAt(0).toUpperCase()
            : isMyWhite ? "B" : "W"}
        </div>
        <div className="flex flex-col min-w-0">
          <span className="text-stone-200 truncate">
            {opponentPlayer?.username || `Đối thủ (${opponentColorLabel})`}
          </span>
          <span className="text-xs text-stone-500 font-normal font-mono">
            {opponentPlayer?.elo_change !== undefined
              ? `${opponentPlayer.elo_change > 0 ? `+${opponentPlayer.elo_change}` : opponentPlayer.elo_change} ELO`
              : opponentColorLabel}
          </span>
        </div>
      </div>

      {onBack && (
        <button
          type="button"
          onClick={onBack}
          className="px-3 py-1.5 text-xs font-semibold bg-stone-800 hover:bg-stone-700 text-stone-300 border border-stone-700 rounded-lg transition cursor-pointer shrink-0"
        >
          ← Quay lại
        </button>
      )}
    </div>
  );

  /** Cụm 4 nút điều hướng */
  const NavButtons = ({ mobile = false }) => (
    <div className={`flex items-center justify-center gap-2 ${mobile ? "py-2" : "pt-3 border-t border-chess-border"}`}>
      {[
        { label: "⏮", title: "Nước đầu", onClick: handleStart },
        { label: "◀", title: "Nước trước", onClick: handlePrev },
        { label: "▶", title: "Nước tiếp", onClick: handleNext },
        { label: "⏭", title: "Nước cuối", onClick: handleEnd },
      ].map(({ label, title, onClick }) => (
        <button
          key={title}
          type="button"
          onClick={onClick}
          title={title}
          className={`bg-[#2a2824] hover:bg-[#33312c] rounded border border-chess-border transition cursor-pointer text-white font-bold ${
            mobile ? "px-5 py-3 text-lg flex-1" : "px-3 py-1.5 text-sm"
          }`}
        >
          {label}
        </button>
      ))}
    </div>
  );

  return (
    <div className="flex flex-col lg:flex-row gap-4 w-full items-start">

      {/* ===== CỘT TRÁI: Bàn cờ ===== */}
      <div className="flex flex-col gap-2 w-full lg:w-140">

        {/* Khung bàn cờ */}
        <div className="flex flex-col gap-3 w-full bg-chess-outline p-4 rounded-xl shadow-2xl border border-chess-border h-fit self-start">
          <OpponentBar />

          <ChessBoardView
            key={`${gameDetail.id}-${gameDetail.my_color}`}
            game={new Chess(fenList[currentStep] || undefined)}
            allowDragging={false}
            boardOrientation={gameDetail.my_color || "white"}
          />
        </div>

        {/* Nút điều hướng (Mobile only - dưới bàn cờ, to rõ, dễ bấm) */}
        <div className="lg:hidden">
          <NavButtons mobile />
        </div>

        {/* Bảng nước đi (Mobile only - cuộn được, chiều cao cố định) */}
        <div className="lg:hidden bg-chess-outline rounded-xl border border-chess-border overflow-hidden">
          <div className="px-3 py-2 border-b border-chess-border text-xs font-bold text-stone-400 uppercase tracking-wider">
            Danh sách nước đi
          </div>
          <div className="overflow-y-auto max-h-44">
            <MoveHistoryTable
              history={getMovesArrayFromPgn(gameDetail.pgn)}
              currentStep={currentStep}
              onSelectStep={(step) => setCurrentStep(step)}
            />
          </div>
        </div>
      </div>

      {/* ===== CỘT PHẢI: Panel điều khiển (Desktop only) ===== */}
      <div className="hidden lg:flex flex-col w-85 bg-chess-outline p-4 rounded-xl shadow-xl border border-chess-border h-fit self-start">
        {/* Header */}
        <div className="border-b border-chess-border pb-3 flex items-center justify-between">
          <span className="text-base font-bold uppercase tracking-wider text-white">
            Xem lại ván đấu
          </span>
          {onBack && (
            <button
              type="button"
              onClick={onBack}
              className="px-3 py-1 text-xs font-semibold bg-stone-800 hover:bg-stone-700 text-stone-300 border border-stone-700 rounded-lg transition-all cursor-pointer"
            >
              ← Quay lại
            </button>
          )}
        </div>

        {/* Bảng lịch sử nước đi */}
        <MoveHistoryTable
          history={getMovesArrayFromPgn(gameDetail.pgn)}
          currentStep={currentStep}
          onSelectStep={(step) => setCurrentStep(step)}
          className="h-64 my-3"
        />

        {/* Nút điều hướng */}
        <NavButtons />
      </div>
    </div>
  );
}
