import React, { useRef, useEffect } from "react";
import { formatMoveHistory } from "../utils/chessFormat";

export default function MoveHistoryTable({ history = [] }) {
  const scrollRef = useRef(null);
  const movePairs = formatMoveHistory(history);

  useEffect(() => {
    if (scrollRef.current) {
      scrollRef.current.scrollTop = scrollRef.current.scrollHeight;
    }
  }, [history]);

  return (
    <div className="flex flex-col h-80">
      <div className="grid grid-cols-12 px-4 py-2.5 border-b border-chess-border text-sm font-bold text-text-white uppercase tracking-wider">
        <span className="col-span-2"></span>
        <span className="col-span-5 flex items-center gap-1.5">
          <span className="w-3.5 h-3.5 rounded-full bg-white"></span>
          White
        </span>
        <span className="col-span-5 flex items-center gap-1.5">
          <span className="w-3.5 h-3.5 rounded-full bg-black border border-stone-600"></span>
          Black
        </span>
      </div>

      <div
        ref={scrollRef}
        className="overflow-y-auto scroll-smooth scrollbar-thumb-stone-700 scrollbar-track-transparent"
      >
        {movePairs.map((pair, index) => {
          const isWhiteActivate = history.length - 1 == index * 2;
          const isBlackActivate = history.length - 1 == index * 2 + 1;
          return (
            <div
              key={index}
              className={`grid grid-cols-12 items-center px-4 py-1.5 font-semibold text-xs text-white transition-colors ${index % 2 == 0 ? "bg-[#262522]" : "bg-[#21201d]"
                }`}
            >
              <span className="col-span-2">{pair.moveNumber}</span>
              <div className="col-span-5">
                <span
                  className={`inline-block rounded px-2 py-0.5 ml-2 transition-colors duration-200 ${isWhiteActivate ? "bg-[#63b413]" : " hover:bg-stone-700/50"}`}
                >
                  {pair.white}
                </span>
              </div>
              <div className="col-span-5">
                <span
                  className={`inline-block rounded px-2 py-0.5 ml-2 transition-colors duration-200 ${isBlackActivate ? "bg-[#63b413]" : " hover:bg-stone-700/50"}`}
                >
                  {pair.black}
                </span>
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}
