import React, { act } from "react";

export function GameOverModal({
  isOpen,
  winner,
  reason,
  actualColor,
  whiteEloChange,
  blackEloChange,
  currentUser,
  opponent,
  score,
  handlePlayAgain,
  hasOfferedPlayAgain,
  onClose,
  onLeave,
}) {
  if (!isOpen) return null;

  const isDraw = !winner;
  const isWinner = winner === actualColor;

  const myEloChange = actualColor === "white" ? whiteEloChange : blackEloChange;
  const opponentEloChange =
    actualColor === "black" ? whiteEloChange : blackEloChange;
  const myEloSign = myEloChange > 0 ? `+${myEloChange}` : `${myEloChange}`;
  const opponentEloSign =
    opponentEloChange > 0 ? `+${opponentEloChange}` : `${opponentEloChange}`;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/75 backdrop-blur-xs">
      <div className="bg-chess-bg min-h-80 min-w-md flex flex-col gap-5 p-4 border border-chess-border rounded-2xl">
        {/* Tiêu đề */}
        <div className="flex flex-col items-center">
          <h2 className="text-2xl font-black tracking-wider">
            {isDraw ? "HÒA CỜ" : isWinner ? "Bạn thắng!" : "Bạn thua!"}
          </h2>
          <p>{reason || ""}</p>
        </div>

        {/* Bảng so sánh 2 bên*/}
        <div className="w-full flex justify-around pb-2">
          {/* Bản thân */}
          <div className="flex flex-col items-center">
            <div className="flex justify-center items-center w-8 h-8 rounded-full bg-emerald-600 font-semibold text-white">
              {currentUser.username
                ? currentUser.username.charAt(0).toUpperCase()
                : "U"}
            </div>
            <div className="flex flex-col items-center fixed mt-8">
              <span className="">{currentUser.username || "Bạn"}</span>
              <span
                className={`text-xs ${myEloChange < 0 ? "text-red-500" : "text-green-500"}`}
              >
                {myEloSign} ELO
              </span>
            </div>
          </div>

          {/* Tỉ số */}
          <div className="flex flex-col items-center justify-center px-2">
            <div className="bg-stone-900 border border-stone-700/80 px-4 py-1.5 rounded-xl flex items-center gap-2.5 font-mono font-black text-xl shadow-inner">
              <span
                className={
                  score.player > score.opponent
                    ? "text-emerald-400"
                    : "text-stone-200"
                }
              >
                {score.player}
              </span>
              <span className="text-stone-600 text-base font-normal">-</span>
              <span
                className={
                  score.opponent > score.player
                    ? "text-red-400"
                    : "text-stone-200"
                }
              >
                {score.opponent}
              </span>
            </div>
          </div>

          {/* Đối thủ */}
          <div className="flex flex-col items-center">
            <div className="flex justify-center items-center w-8 h-8 rounded-full bg-emerald-600 font-semibold text-white">
              {opponent?.username
                ? opponent.username.charAt(0).toUpperCase()
                : "U"}
            </div>
            <div className="flex flex-col items-center fixed mt-8">
              <span className="">{opponent?.username || "Bạn"}</span>
              <span
                className={`text-xs ${opponentEloChange < 0 ? "text-red-500" : "text-green-500"}`}
              >
                {opponentEloSign} ELO
              </span>
            </div>
          </div>
        </div>

        {/* Các nút chức năng */}
        <div className="flex flex-col mt-auto gap-2">
          <button
            type="button"
            onClick={handlePlayAgain}
            disabled={hasOfferedPlayAgain}
            className="flex-1 py-2.5 rounded-xl font-bold text-sm bg-green-600 hover:bg-green-700 text-white transition-all cursor-pointer disabled:cursor-default flex items-center justify-center gap-1.5 shadow-md disabled:opacity-50"
          >
            <span>Chơi lại</span>
          </button>
          <div className="w-full flex gap-2">
            <button
              type="button"
              onClick={onClose}
              className="w-full py-2.5 bg-stone-700 hover:bg-stone-600 text-stone-200 font-bold text-sm rounded-xl transition cursor-pointer shadow-md"
            >
              🔍 Xem lại ván đấu
            </button>
            <button
              type="button"
              onClick={onLeave}
              className="w-full py-2.5 bg-red-600/80 hover:bg-red-600 text-white font-bold text-sm rounded-xl transition cursor-pointer shadow-md"
            >
              🏃 Rời phòng
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
