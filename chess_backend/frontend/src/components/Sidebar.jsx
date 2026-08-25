import React from "react";

const MENU_ITEMS = [
  { id: "puzzle", label: "Giải đố" },
  { id: "ai", label: "Chơi với máy" },
  { id: "real-time", label: "Chơi với người"}
];

export default function Sidebar({ currentUser, currentMode, onSelectMode, onLogout }) {
  return (
    <aside className="flex flex-col text-text-white bg-transparent min-h-140 w-62 p-3 sticky top-0 shrink-0 border-r border-aside-border-right">
      <div>
        <div className="flex items-end justify-center gap-2 py-3 mb-6 border-b border-aside-border-right/60">
          <span className="text-2xl">♟️</span>
          <h1 className="text-2xl font-semibold tracking-wide text-white">Chess App</h1>
        </div>

        <nav className="space-y-1">
          <p className="px-3 text-sm font-semibold text-text-white tracking-wide mb-1">Chế độ chơi</p>
          {MENU_ITEMS.map((item) => {
            const isActive = currentMode == item.id;

            return(
                <button key={item.id} onClick={()=>onSelectMode(item.id)} className={`flex flex-col w-full items-start px-3 py-2.5 cursor-pointer rounded-lg transition-colors duration-75 ${isActive? "bg-white/15":"text-text-white hover:bg-white/5 hover:text-white"}`}>
                    <span className="font-medium text-lg">{item.label}</span>
                </button>
            )
          })}
        </nav>
      </div>

      <div className="flex items-center gap-3 p-3 mt-auto bg-white/5 rounded-xl border border-chess-border">
          <div className="flex justify-center items-center w-8 h-8 rounded-full bg-emerald-600 font-semibold text-white">
            {currentUser.username?currentUser.username.charAt(0).toUpperCase():'U'}
          </div>
          <div className="flex flex-col text-left overflow-hidden">
            <span className="text-sm font-semibold text-white truncate">{currentUser.username}</span>
            <span className="text-xs font-mono">{currentUser.pvp_elo} <span>ELO</span></span>
          </div>

          <button onClick={onLogout} className="flex items-center justify-center ml-auto size-9 leading-none text-white bg-red-500 text-xl rounded-full border border-chess-border cursor-pointer hover:bg-red-600 transition-colors duration-300">🏃</button>
      </div>
    </aside>
  );
}
