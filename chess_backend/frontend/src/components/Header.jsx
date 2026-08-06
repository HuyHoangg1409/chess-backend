import React from "react";

export default function Header({ currentUser, onLogout }) {
  return (
    <header className="flex justify-between items-center w-full max-w-7xl py-4 border-b-2 border-white mb-8">
      <div className="flex items-center">
        <h2 className="text-4xl text-green-600 font-bold">CHESS</h2>
      </div>

      <button
        onClick={onLogout}
        className="px-4 py-2 bg-rose-600 hover:bg-rose-500 text-white font-bold rounded-lg text-sm cursor-pointer"
      >
        Log Out
      </button>

      <div className="flex items-baseline gap-2.5 ">
        <span className="text-2xl font-semibold text-red-400">
          {currentUser.username}
        </span>
        <span className="text-green-500">{currentUser.elo_rating} ELO</span>
      </div>
    </header>
  );
}
