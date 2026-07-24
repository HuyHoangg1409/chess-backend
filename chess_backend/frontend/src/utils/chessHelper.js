/**
 * Chuyển đổi chuỗi nước đi thành mảng các nước đi riêng lẻ.
 * @param {string} moveString - Chuỗi chứa các nước đi cách nhau bởi " "
 * @returns {string[]} Trả về mảng chứa các chuỗi nước đi
 */
export const correctMovesArray = (moveString) => {
  if (!moveString) {
    return [];
  }
  return moveString.trim().split(" ");
};

/**
 * Xác định lượt đi hiện tại dựa trên chuỗi FEN hiện tại của bàn cờ.
 * @param {string} FEN_position - Chuỗi FEN hiện tại của bàn cờ
 * @returns {string} Trả về "black" nếu đến lượt đen, "white" nếu đến lượt trắng
 */
export const getTurn = (FEN_position) => {
  const FENArray = FEN_position.split(" ");
  if (FENArray[1] == "b") {
    return "black";
  } else {
    return "white";
  }
};

/**
 * Xác định lượt đi ngược lại của đối thủ dựa trên chuỗi FEN hiện tại của bàn cờ.
 * @param {string} FEN_position - Chuỗi FEN hiện tại của bàn cờ
 * @returns {string} Trả về "white" nếu đến lượt đen, "black" nếu đến lượt trắng
 */
export const getOppositeTurn = (FEN_position) => {
  const FENArray = FEN_position.split(" ");
  if (FENArray[1] == "b") {
    return "white";
  } else {
    return "black";
  }
};

/**
 * Tách 1 chuỗi nước đi UCI thành 1 đối tượng gồm ô đi và ô đến.
 * @param {string} move - Chuỗi nước đi dạng UCI 
 * @returns {{from: string, to: string}|null} Trả về đối tượng chứa "from" và "to" hoặc null nếu chuỗi UCI không hợp lệ
 */
export const getMove = (move) => {
  if (!move || move.length < 4) {
    return null;
  }
  return {
    from: move.slice(0, 2),
    to: move.slice(2, 4),
  };
};

/**
 * Lấy nước đi đầu tiên từ chuỗi các nước đi đúng.
 * @param {string} correct_moves - Chuỗi các nước đi đúng của câu đố
 * @returns {{from: string, to: string, promotion: string}} Trả về đối tượng nước đi đầu tiên kèm cấu hình mặc định phong cấp hậu
 */
export const makeFirstMove = (correct_moves) => {
  const firstMove = correctMovesArray(correct_moves)[0];
  return {
    from: getMove(firstMove).from,
    to: getMove(firstMove).to,
    promotion: "q",
  };
};
