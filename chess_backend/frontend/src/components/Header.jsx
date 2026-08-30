import React from "react";

/**
 * Header nhận thêm prop `onToggleSidebar` để mở/đóng drawer trên Mobile/Tablet.
 * Nút Hamburger chỉ hiển thị khi < lg (lg:hidden).
 */
export default function Header({ currentUser, onToggleSidebar }) {
  return (
    <header className="sticky top-0 z-50 bg-chess-bg border-b-2 border-white w-full">
      <div className="flex justify-between items-center w-full max-w-7xl mx-auto px-4 sm:px-6 pt-4 pb-2">
        {/* === HAMBURGER BUTTON (Mobile/Tablet only) ===
            Ẩn trên Desktop (lg:hidden). Kích hoạt mở/đóng Drawer Sidebar. */}
        <button
          onClick={onToggleSidebar}
          className="lg:hidden flex flex-col justify-center items-center w-10 h-10 rounded-lg hover:bg-white/10 transition-colors gap-1.5"
          aria-label="Mở menu điều hướng"
        >
          <span className="block w-5 h-0.5 bg-white rounded-full" />
          <span className="block w-5 h-0.5 bg-white rounded-full" />
          <span className="block w-5 h-0.5 bg-white rounded-full" />
        </button>

        {/* === LOGO (Desktop: hiển thị từ vị trí này; Mobile: ẩn vì Sidebar đã có logo) === */}
        <div className="flex items-center lg:block">
          <h2 className="text-3xl sm:text-4xl text-green-600 font-bold">CHESS</h2>
        </div>

        {/* === USER INFO CARD === */}
        <div className="flex items-center gap-5">
          <div className="flex items-center gap-3 bg-[#17171A] px-3 py-1.5 rounded-lg border border-chess-border">
            <div className="flex justify-center items-center w-8 h-8 rounded-full bg-emerald-600 font-semibold text-white shrink-0">
              {currentUser?.username ? currentUser.username.charAt(0).toUpperCase() : "U"}
            </div>
            <div className="flex flex-col text-left">
              <span className="text-sm font-semibold text-white">{currentUser?.username}</span>
              <span className="text-xs font-mono text-zinc-400">
                {currentUser?.pvp_elo} <span>ELO</span>
              </span>
            </div>
          </div>
        </div>
      </div>
    </header>
  );
}
