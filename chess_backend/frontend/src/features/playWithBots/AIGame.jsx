import React from "react";
import { ChessBoardView } from "../../components/ChessBoard/ChessBoardView";

export default function AIGame() {
  return (
    <>
      <div className="relative w-140 bg-chess-outline p-3.5 rounded-xl shadow-2xl border border-chess-border">
        <ChessBoardView />
      </div>
      <div className="flex flex-col w-85 bg-chess-outline p-3.5 rounded-xl shadow-xl border border-chess-border">
        <div className="pl-3 border-b border-chess-border pb-4 text-xl font-semibold uppercase tracking-wider">
          <span>playing with bot</span>
          <p>Difficulty: </p>
        </div>
        <div className="p-4 mt-4 rounded-lg bg-button-bg-white text-gray-950">
          <span className="text-xl font-semibold uppercase">message</span>
        </div>
        <div className="flex flex-col gap-4 mt-auto text-xl text-white font-semibold">
          <div className="flex gap-3">
              <button className="w-3/6 p-4 rounded-lg bg-green-600 hover:bg-green-600/80 transition-colors duration-350 cursor-pointer uppercase">
                Easy
              </button>
              <button className="w-3/6 p-4 rounded-lg bg-[#ffc800] hover:bg-[#ffc800]/80 transition-colors duration-350 cursor-pointer uppercase">
                Medium
              </button>
          </div>
          <div className="flex gap-3">
              <button className="w-3/6 p-4 rounded-lg bg-[#F99C35] hover:bg-[#F99C35]/80 transition-colors duration-350 cursor-pointer uppercase">
                Hard
              </button>
              <button className="w-3/6 p-4 rounded-lg bg-[#F14738] hover:bg-[#F14738]/80 transition-colors duration-350 cursor-pointer uppercase">
                Extremely Hard
              </button>
          </div>
        </div>
      </div>
    </>
  );
}
