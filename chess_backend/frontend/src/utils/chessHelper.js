import { Chess } from 'chess.js';

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

/**
 * Tính toán danh sách các quân cờ đã bị bắt của cả 2 bên (Trắng và Đen).
 * Dựa trên số lượng quân ban đầu trừ đi số lượng quân còn lại trên bàn cờ.
 * 
 * @param {import('chess.js').Chess} game - Đối tượng bàn cờ chess.js hiện tại
 * @returns {{ w: string[], b: string[] }} Danh sách loại quân đã bị ăn (w: quân trắng bị ăn, b: quân đen bị ăn)
 */
export const getCapturedPieces = (game) => {
  const initialQuantities = {
    p: 8,
    n: 2,
    b: 2,
    r: 2,
    q: 1,
  };

  const currentCount = {
    w: { p: 0, n: 0, b: 0, r: 0, q: 0 },
    b: { p: 0, n: 0, b: 0, r: 0, q: 0 },
  };

  const board = game.board();
  for (let r = 0; r < 8; r++) {
    for (let c = 0; c < 8; c++) {
      const piece = board[r][c];
      if (piece && piece.type !== "k") {
        currentCount[piece.color][piece.type]++;
      }
    }
  }

  const captured = {
    w: [],
    b: [],
  };

  for (const type of ["p", "n", "b", "r", "q"]) {
    const missing = initialQuantities[type] - currentCount.w[type];
    if (missing > 0) {
      for (let i = 0; i < missing; i++) {
        captured.w.push(type);
      }
    }
  }

  for (const type of ["p", "n", "b", "r", "q"]) {
    const missing = initialQuantities[type] - currentCount.b[type];
    if (missing > 0) {
      for (let i = 0; i < missing; i++) {
        captured.b.push(type);
      }
    }
  }

  return captured;
};

/**
 * Quy đổi giá trị điểm số của từng loại quân cờ để tính chênh lệch vật chất.
 * Pawn = 1, Knight/Bishop = 3, Rook = 5, Queen = 9.
 * 
 * @param {'p'|'n'|'b'|'r'|'q'} type - Loại quân cờ ('p', 'n', 'b', 'r', 'q')
 * @returns {number} Điểm số tương ứng
 */
export const getPieceValue = (type) => {
  switch (type) {
    case "p": return 1;
    case "n": return 3;
    case "b": return 3;
    case "r": return 5;
    case "q": return 9;
    default: return 0;
  }
};

/**
 * Format lịch sử nước đi theo từng pair.
 * 
 * @param {Array} history - Lịch sử các nước đi
 */
export const formatMoveHistory = (history = []) => {
  const pairs = [];
  for (let i = 0; i < history.length; i += 2) {
    pairs.push({
      moveNumber: Math.floor(i / 2) + 1,
      white: history[i] || "",
      black: history[i + 1] || "",
    });
  }
  return pairs;
};

/**
 * Lấy mảng lịch sử nước đi từ chuỗi pgn.
 */
export const getMovesArrayFromPgn = (pgn) => {
  if (pgn == null) return null;
  const game = new Chess()
  game.loadPgn(pgn)

  const moves = game.history();
  return moves;
}