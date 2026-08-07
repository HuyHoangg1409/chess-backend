import React from "react";

export default function Header({ currentUser, onLogout }) {
  return (
    <header className="flex justify-between items-center w-full max-w-7xl py-4 border-b-2 border-white mb-8">
      <div className="flex items-center">
        <h2 className="text-4xl text-green-600 font-bold">CHESS</h2>
      </div>

      <div className="flex items-center gap-5">
        <div className="position- flex items-center gap-3 bg-[#17171A] px-3 py-1.5 rounded-lg border border-chess-border">
          <div className="flex justify-center items-center w-8 h-8 rounded-full bg-emerald-600 font-semibold text-white">
            {currentUser.username?currentUser.username.charAt(0).toUpperCase():'U'}
          </div>

          <div className="flex flex-col text-left">
            <span className="text-sm font-semibold text-white">{currentUser.username}</span>
            <span className="text-xs font-mono">{currentUser.elo_rating} <span>ELO</span></span>
          </div>
        </div>

        <button onClick={onLogout} className="flex items-center justify-center size-9 leading-none text-white bg-red-600 text-xl rounded-full border border-chess-border cursor-pointer hover:bg-red-700 transition-colors duration-300">⏻</button>
      </div>
    </header>
  );
}
