import React from "react";

const PIECE_ORDER = ["q", "r", "b", "n", "p"];

/**
 * Hiển thị danh sách quân cờ đã bị ăn một cách gọn gàng, tự động gom nhóm quân trùng nhau
 * để tránh tràn giao diện trên thiết bị di động khi ăn nhiều quân cờ.
 * 
 * @param {string[]} captured - Mảng chứa ký tự các quân cờ bị ăn (vd: ['p', 'p', 'n', 'q'])
 * @param {'w'|'b'} color - Màu của quân cờ bị ăn
 * @param {number} advantage - Điểm lợi thế vật chất (+1, +3, ...)
 */
export default function CapturedPieces({ captured = [], color = "w", advantage = 0 }) {
  if (!captured || captured.length === 0) return null;

  // Gom nhóm số lượng từng loại quân
  const counts = {};
  for (const piece of captured) {
    counts[piece] = (counts[piece] || 0) + 1;
  }

  // Sắp xếp theo thứ tự giá trị: Hậu -> Xe -> Tượng -> Mã -> Tốt
  const grouped = PIECE_ORDER
    .filter((type) => counts[type] > 0)
    .map((type) => ({ type, count: counts[type] }));

  return (
    <div className="flex items-center gap-1 sm:gap-1.5 bg-button-bg-white px-1.5 sm:px-2 py-0.5 rounded-md border border-stone-800 shadow-inner shrink-0 max-w-full overflow-hidden">
      <div className="flex items-center gap-1 sm:gap-1.5 flex-nowrap">
        {grouped.map(({ type, count }) => (
          <div key={type} className="flex items-center shrink-0">
            <img
              src={`pieces/${color}${type}.svg`}
              alt={type}
              className="w-4 h-4 sm:w-5 sm:h-5 object-contain"
            />
            {count > 1 && (
              <span className="text-[10px] sm:text-xs font-bold text-stone-400 font-mono leading-none ml-0.5">
                {count}
              </span>
            )}
          </div>
        ))}
      </div>
      {advantage > 0 && (
        <span className="ml-0.5 sm:ml-1 text-[11px] sm:text-xs font-bold text-green-500 shrink-0">
          +{advantage}
        </span>
      )}
    </div>
  );
}
