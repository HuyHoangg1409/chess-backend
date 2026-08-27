import React, { useEffect, useState } from "react";
import { getHistoryList } from "../../services/api";

export default function MatchHistory({ currentUser, onSelectMatchId }) {
  const [matches, setMatches] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchHistory = async () => {
      try {
        const token = localStorage.getItem("access_token");
        const data = await getHistoryList(token);
        setMatches(data || []);
      } catch (error) {
        console.error(error);
      } finally {
        setLoading(false);
      }
    };

    fetchHistory();
  }, []);

  if (loading) {
    return (
      <div className="w-full flex items-center justify-center py-20 text-lg text-stone-400">
        Đang tải lịch sử đấu...
      </div>
    );
  }

  return (
    <div className="w-full max-w-4xl mx-auto p-6 flex flex-col gap-6">
      {/* Tiêu đề */}
      <div className="flex items-center justify-between pb-4 border-b border-chess-border">
        <h1 className="text-2xl font-bold text-white tracking-wide">
          Lịch sử đấu
        </h1>
        <span className="text-sm font-semibold text-stone-400 bg-white/5 px-3 py-1 rounded-lg border border-chess-border">
          {matches.length} trận gần nhất
        </span>
      </div>

      {/* Danh sách trận đấu */}
      {matches.length === 0 ? (
        <div className="py-16 text-center text-stone-400 bg-[#21201d] rounded-xl border border-chess-border">
          Bạn chưa đấu ván nào. Vào chế độ chơi với người để chơi 1 ván mới.
        </div>
      ) : (
        <div className="flex flex-col gap-3">
          {matches.map((match) => {
            const isWin = match.result === "win";
            const isDraw = match.result === "draw";
            const elo = match.elo_change;
            const eloText = elo > 0 ? `+${elo}` : `${elo || 0}`;

            return (
              <div
                key={match.id}
                onClick={() => onSelectMatchId(match.id)}
                className="flex items-center justify-between p-4 bg-[#21201d] hover:bg-[#262421] border border-chess-border rounded-xl transition duration-150 cursor-pointer"
              >
                {/* Trạng thái & Màu cờ */}
                <div className="flex items-center gap-3 w-40">
                  <span
                    className={`px-2.5 py-1 w-[56px] text-center text-xs font-bold rounded-md ${
                      isWin
                        ? "bg-emerald-500/20 text-emerald-400"
                        : isDraw
                          ? "bg-stone-500/20 text-stone-300"
                          : "bg-red-500/20 text-red-400"
                    }`}
                  >
                    {isWin ? "Thắng" : isDraw ? "Hòa" : "Thua"}
                  </span>
                  <span className="text-xs text-stone-400">
                    {match.my_color === "white" ? "Trắng" : "Đen"}
                  </span>
                </div>

                {/* Cặp đấu */}
                <div className="flex-1 text-center font-medium text-sm text-white truncate px-2">
                  <span>
                    {currentUser?.username || "Bạn"}
                  </span>
                  <span className="mx-2 text-stone-500 text-xs font-bold">
                    VS
                  </span>
                  <span>{match.opponent_username || "Đối thủ"}</span>
                </div>

                {/* Ngày tháng */}
                <div className="w-36 text-center text-xs text-stone-400 font-mono hidden sm:block">
                  {match.created_at
                    ? new Date(
                        new Date(match.created_at).getTime() + 7 * 3600 * 1000,
                      ).toLocaleDateString("vi-VN", {
                        day: "2-digit",
                        month: "2-digit",
                        year: "numeric",
                        hour: "2-digit",
                        minute: "2-digit",
                      })
                    : "---"}
                </div>

                {/* ELO & Xem chi tiết */}
                <div className="flex items-center justify-end gap-3 w-32">
                  <span
                    className={`text-xs font-mono font-bold ${
                      isWin
                        ? "text-emerald-400"
                        : isDraw
                          ? "text-stone-400"
                          : "text-red-400"
                    }`}
                  >
                    {eloText} ELO
                  </span>
                  <span className="text-xs text-stone-400 hover:text-white">
                    Xem
                  </span>
                </div>
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}
