import React from "react";

const MENU_ITEMS = [
  { id: "puzzle", label: "Giải đố" },
  { id: "ai", label: "Chơi với máy" },
  { id: "real-time", label: "Chơi với người" },
  { id: "history", label: "Lịch sử đấu" },
];

/**
 * Sidebar hoạt động theo 2 chế độ:
 * - Mobile/Tablet (< lg): Sliding drawer từ trái, phủ overlay khi mở.
 *   Trạng thái mở/đóng được điều khiển qua props `isOpen` / `onClose` từ App.jsx.
 * - Desktop (>= lg): Sticky sidebar cố định bên trái, luôn hiển thị.
 */
export default function Sidebar({ currentUser, currentMode, onSelectMode, onLogout, isOpen, onClose }) {
  const handleItemClick = (id) => {
    onSelectMode(id);
    // Tự đóng drawer trên Mobile/Tablet sau khi chọn chế độ
    if (onClose) onClose();
  };

  return (
    <>
      {/* === BACKDROP OVERLAY ===
          Chỉ hiển thị trên Mobile/Tablet khi drawer đang mở.
          Click vào overlay để đóng drawer. */}
      <div
        className={`fixed inset-0 z-40 bg-black/60 backdrop-blur-sm transition-opacity duration-300 lg:hidden ${
          isOpen ? "opacity-100 pointer-events-auto" : "opacity-0 pointer-events-none"
        }`}
        onClick={onClose}
        aria-hidden="true"
      />

      {/* === SIDEBAR / DRAWER ===
          Mobile/Tablet: fixed, trượt từ trái (translate-x), z-50 để phủ trên overlay.
          Desktop: static, sticky, luôn dịch về vị trí gốc (lg:translate-x-0). */}
      <aside
        className={`
          fixed top-0 left-0 bottom-0 z-50 w-72 max-w-[80vw]
          bg-chess-bg border-r border-aside-border-right
          flex flex-col justify-between p-4
          transition-transform duration-300 ease-in-out
          lg:static lg:z-auto lg:w-64 lg:p-3 lg:bg-transparent
          lg:h-[calc(100vh-8rem)] lg:sticky lg:top-28 lg:shrink-0
          lg:translate-x-0
          ${isOpen ? "translate-x-0 shadow-2xl" : "-translate-x-full"}
        `}
      >
        {/* --- Top section --- */}
        <div>
          {/* Header trong drawer: có nút đóng ❌ trên Mobile, căn giữa trên Desktop */}
          <div className="flex items-center justify-between pb-4 mb-4 border-b border-aside-border-right/60 lg:justify-center lg:py-2">
            <div className="flex items-center gap-2">
              <span className="text-2xl">♟️</span>
              <h1 className="text-xl font-bold tracking-wide text-white">Chess App</h1>
            </div>
            {/* Nút đóng — ẩn trên Desktop */}
            <button
              onClick={onClose}
              className="lg:hidden p-1.5 rounded-lg text-text-white hover:text-white hover:bg-white/10 transition-colors"
              aria-label="Đóng menu"
            >
              <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
              </svg>
            </button>
          </div>

          {/* Navigation Items */}
          <nav className="space-y-1.5">
            <p className="px-3 text-xs font-semibold text-zinc-400 uppercase tracking-wider mb-2">
              Chế độ chơi
            </p>
            {MENU_ITEMS.map((item) => {
              const isActive = currentMode === item.id;
              return (
                <button
                  key={item.id}
                  onClick={() => handleItemClick(item.id)}
                  className={`flex items-center w-full px-3.5 py-2.5 cursor-pointer rounded-xl font-medium text-base transition-all duration-150 ${
                    isActive
                      ? "bg-white/15 text-white font-semibold shadow-sm"
                      : "text-text-white hover:bg-white/5 hover:text-white"
                  }`}
                >
                  <span>{item.label}</span>
                </button>
              );
            })}
          </nav>
        </div>

        {/* --- User Card & Logout --- */}
        <div className="flex items-center gap-3 p-3 mt-auto bg-white/5 rounded-xl border border-chess-border">
          <div className="flex justify-center items-center w-8 h-8 rounded-full bg-emerald-600 font-semibold text-white shrink-0">
            {currentUser?.username ? currentUser.username.charAt(0).toUpperCase() : "U"}
          </div>
          <div className="flex flex-col text-left overflow-hidden min-w-0 flex-1">
            <span className="text-sm font-semibold text-white truncate">{currentUser?.username}</span>
            <span className="text-xs font-mono text-zinc-400">
              {currentUser?.pvp_elo} <span className="text-[10px]">ELO</span>
            </span>
          </div>
          <button
            onClick={onLogout}
            title="Đăng xuất"
            aria-label="Logout"
            className="flex items-center justify-center shrink-0 w-8 h-8 text-white bg-red-500/90 text-base rounded-lg border border-red-400/20 cursor-pointer hover:bg-red-600 transition-colors"
          >
            🚪
          </button>
        </div>
      </aside>
    </>
  );
}
