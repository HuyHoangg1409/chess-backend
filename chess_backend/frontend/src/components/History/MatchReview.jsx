import React, { useEffect, useState } from "react";
import { Chess } from "chess.js";
import { ChessBoardView } from "../ChessBoard/ChessBoardView";
import MoveHistoryTable from "../MoveHistoryTable";
import { getMatchDetail } from "../../services/api";
import { getMovesArrayFromPgn } from "../../utils/chessHelper";

export default function MatchReview({ matchId, onBack }) {
  const [currentStep, setCurrentStep] = useState(null);
  const [fenList, setFenList] = useState([]);
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
          chess.loadPgn(data.pgn);

          const movesHistoryArray = chess.history();
          chess.reset();

          for (const move of movesHistoryArray) {
            chess.move(move);
            fens.push(chess.fen());
          }

          console.log(fens[0]);
          console.log(fens[1]);

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
    setCurrentStep(0);
  };

  const handlePrev = () => {
    setCurrentStep((prev) => Math.max(prev - 1, 0));
  };

  const handleNext = () => {
    setCurrentStep((next) => Math.min(next + 1, fenList.length - 1));
  };

  const handleEnd = () => {
    setCurrentStep(fenList.length - 1);
  };

  if (loading) {
    return (
      <div className="w-full flex items-center justify-center py-20 text-lg text-stone-400">
        Đang tải dữ liệu trận đấu...
      </div>
    );
  }

  const isMyWhite = gameDetail.my_color !== "black";
  const myPlayer = isMyWhite ? gameDetail.white : gameDetail.black;
  const opponentPlayer = isMyWhite ? gameDetail.black : gameDetail.white;
  const myColorLabel = isMyWhite ? "Trắng" : "Đen";
  const opponentColorLabel = isMyWhite ? "Đen" : "Trắng";

  return (
    <>
      {/* Khung bàn cờ bên trái */}
      <div className="flex flex-col gap-3 w-140 bg-chess-outline p-4 rounded-xl shadow-2xl border border-chess-border h-fit self-start">
        {/* Thanh thông tin đối thủ (trên) */}
        <div className="flex items-center justify-between text-stone-300 text-sm font-semibold px-1 h-10">
          <div className="flex items-center gap-3">
            <div className="flex justify-center items-center w-8 h-8 rounded-full bg-emerald-600 font-semibold text-white text-sm border border-stone-600">
              {opponentPlayer?.username
                ? opponentPlayer.username.charAt(0).toUpperCase()
                : isMyWhite
                  ? "B"
                  : "W"}
            </div>
            <div className="flex flex-col">
              <span className="text-stone-200">
                {opponentPlayer?.username || `Đối thủ (${opponentColorLabel})`}
              </span>
              <span className="text-xs text-stone-500 font-normal font-mono">
                {opponentPlayer?.elo_change !== undefined
                  ? `${opponentPlayer.elo_change > 0 ? `+${opponentPlayer.elo_change}` : opponentPlayer.elo_change} ELO`
                  : opponentColorLabel}
              </span>
            </div>
          </div>
        </div>

        {/* Bàn cờ */}
        <ChessBoardView
          key={`${gameDetail.id}-${gameDetail.my_color}`}
          game={new Chess(fenList[currentStep] || undefined)}
          allowDragging={false}
          boardOrientation={gameDetail.my_color || "white"}
        />

        {/* Thanh thông tin người chơi (mình - dưới) */}
        <div className="flex items-center justify-between text-stone-300 text-sm font-semibold px-1 h-10">
          <div className="flex items-center gap-3">
            <div className="flex justify-center items-center w-8 h-8 rounded-full bg-emerald-600 font-semibold text-white text-sm shadow-md">
              {myPlayer?.username
                ? myPlayer.username.charAt(0).toUpperCase()
                : isMyWhite
                  ? "W"
                  : "B"}
            </div>
            <div className="flex flex-col">
              <span className="text-stone-100 font-bold">
                {myPlayer?.username || `Bạn (${myColorLabel})`}
              </span>
              <span className="text-xs text-stone-500 font-normal font-mono">
                {myPlayer?.elo_change !== undefined
                  ? `${myPlayer.elo_change > 0 ? `+${myPlayer.elo_change}` : myPlayer.elo_change} ELO`
                  : myColorLabel}
              </span>
            </div>
          </div>
        </div>
      </div>

      {/* Khung điều khiển bên phải */}
      <div className="flex flex-col w-85 bg-chess-outline p-4 rounded-xl shadow-xl border border-chess-border h-fit self-start">
        {/* Header */}
        <div className="border-b border-chess-border pb-3 flex items-center justify-between">
          <div>
            <span className="text-base font-bold uppercase tracking-wider text-white">
              Xem lại ván đấu
            </span>
            <p className="text-xs text-stone-400 mt-1">
              Mã trận: #{gameDetail.id || matchId}
            </p>
          </div>
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

        {/* Khối điều khiển tua nước đi */}
        <div className="flex items-center justify-center gap-2 pt-3 border-t border-chess-border">
          <button
            type="button"
            onClick={handleStart}
            title="Nước đầu"
            className="px-3 py-1.5 bg-[#2a2824] hover:bg-[#33312c] rounded text-sm font-bold border border-chess-border transition cursor-pointer text-white"
          >
            ⏮
          </button>
          <button
            type="button"
            onClick={handlePrev}
            title="Nước trước"
            className="px-4 py-1.5 bg-[#2a2824] hover:bg-[#33312c] rounded text-sm font-bold border border-chess-border transition cursor-pointer text-white"
          >
            ◀
          </button>
          <button
            type="button"
            onClick={handleNext}
            title="Nước tiếp"
            className="px-4 py-1.5 bg-[#2a2824] hover:bg-[#33312c] rounded text-sm font-bold border border-chess-border transition cursor-pointer text-white"
          >
            ▶
          </button>
          <button
            type="button"
            onClick={handleEnd}
            title="Nước cuối"
            className="px-3 py-1.5 bg-[#2a2824] hover:bg-[#33312c] rounded text-sm font-bold border border-chess-border transition cursor-pointer text-white"
          >
            ⏭
          </button>
        </div>
      </div>
    </>
  );
}
