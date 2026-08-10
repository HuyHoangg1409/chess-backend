import React from "react";

export default function PromotionDialog({ promotionData, onSelect }) {
  if (!promotionData) return null;

  const { targetSquare } = promotionData;
  const color = targetSquare[1] == "8" ? "w" : "b";

  const options = [
    { type: "q", label: "Hậu" },
    { type: "r", label: "Xe" },
    { type: "n", label: "Mã" },
    { type: "b", label: "Tịnh" },
  ];

  return (
    <div className="absolute flex items-center justify-center z-100 inset-0 bg-black/40">
      <div className="flex gap-2 rounded-2xl p-3 bg-white">
        {options.map((item) => {
          const localImageURL = `pieces/${color}${item.type}.svg`;
          return (
            <button
              key={item.type}
              onClick={() => onSelect(item.type)}
              className="w-14 h-14 rounded-xl cursor-pointer flex items-center justify-center bg-gray hover:bg-gray-300 "
            >
              <img src={localImageURL} alt={item.label} className="w-full h-full object-contain pointer-events-none"/>
            </button>
          );
        })}
      </div>
    </div>
  );
}
