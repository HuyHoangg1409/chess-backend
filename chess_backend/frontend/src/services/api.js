const BASE_URL = import.meta.env.VITE_API_BASE_URL || "http://localhost:8000";

const request = async (endpoint, options = {}) => {
  const defaultHeader = {
    "Content-Type": "application/json",
    ...options.headers,
  };

  try {
    const response = await fetch(`${BASE_URL}${endpoint}`, {
      ...options,
      headers: defaultHeader,
    });
    if (!response.ok) {
      throw new Error(`Lỗi gọi api ${endpoint}`);
    }
    return await response.json();
  } catch (error) {
    console.error("API Error: ", error);
    throw error;
  }
};

/**
 * Lấy ngẫu nhiên 1 puzzle với độ khó ngẫu nhiên từ database.
 * @returns {Promise<Object>} Dữ liệu JSON chứa thông tin puzzle
 */
export const getRandomPuzzle = async () => {
  return await request("/puzzles/random", { method: "GET" });
};

/**
 * Lấy thông tin của 1 puzzle với ID cụ thể từ database.
 * @param {number} puzzleId - ID của puzzle cần lấy
 * @returns {Promise<Object>} Dữ liệu JSON chứa thông tin puzzle
 */
export const getPuzzleById = async (puzzleId) => {
  return await request(`/puzzles/${puzzleId}`, { method: "GET" });
};

/**
 * Gửi yêu cầu đăng nhập lên server.
 * @param {Object} userData - Thông tin đăng nhập của người dùng bao gồm "username" và "password"
 * @returns {Promise<Object>} Dữ liệu JSON trả về từ server khi đăng nhập thành công bao gồm "access_token" và "token_type"
 */
export const sendLoginRequest = async (userData) => {
  return await request("/auth/login", {
    method: "POST",
    body: JSON.stringify(userData),
  });
};

/**
 * Gửi yêu cầu đăng ký người dùng mới lên server với thông tin từ userData.
 * @param {Object} userData - Thông tin đăng ký của người dùng bao gồm "username" và "password"
 * @returns {Promise<Object>} Dữ liệu JSON trả về từ server khi đăng ký thành công bao gồm "user_id", "username" và "elo_rating"
 */
export const sendRegisterRequest = async (userData) => {
  return await request("/auth/register", {
    method: "POST",
    body: JSON.stringify(userData),
  });
};

/**
 * Lấy thông tin của người dùng hiện tại dựa trên access token.
 * @param {string} token - Chuỗi JWT dùng để xác thực người dùng
 * @returns {Promise<Object>} Dữ liệu JSON trả về từ server khi xác thực người dùng thành công bao gồm "user_id", "username" và "elo_rating"
 */
export const getCurrentUser = async (token) => {
  return await request("/auth/me", {
    method: "GET",
    headers: { Authorization: `Bearer ${token}` },
  });
};

/**
 * Gửi đáp án của người chơi lên server để kiểm tra.
 * @param {int} puzzle_id - ID của câu đố cần kiểm tra
 * @param {string} userAnswer - Các nước đi người chơi đã đi
 * @param {string} token - Chuỗi JWT dùng để xác thực người dùng
 * @returns {Promise<Object>} Dữ liệu JSON trả về từ server bao gồm "is_correct", "is_completed" và "message"
 */
export const checkPuzzle = async (puzzle_id, userAnswer, token) => {
  return await request(`/puzzles/${puzzle_id}/check`, {
    method: "POST",
    headers: { Authorization: `Bearer ${token}` },
    body: JSON.stringify({ puzzle_id: puzzle_id, user_move: userAnswer }),
  });
};

/**
 * Gửi request đến endpoint /puzzles/help để lấy nước đi chính xác tại moveIndex.
 * @param {int} puzzle_id - ID của câu đố cần lấy đáp án
 * @param {int} moveIndex - Index của đáp án cần lấy
 * @param {string} token - Chuỗi JWT dùng để xác thực người dùng
 * @returns {Promise<Object>} Dữ liệu JSON trả về từ server bao gồm "hint" là nước đi chính xác tại moveIndex
 */
export const getHelp = async (puzzle_id, moveIndex, token) => {
  return await request(`/puzzles/${puzzle_id}/hints`, {
    method: "POST",
    headers: {
      Authorization: `Bearer ${token}`,
    },
    body: JSON.stringify({ puzzle_id: puzzle_id, move_index: moveIndex }),
  });
};

/**
 * Gửi request đến endpoint /history/add để cập nhật lịch sử giải đố của người chơi vào database.
 * @param {int} puzzle_id - ID của puzzle
 * @param {boolean} status - True nếu người chơi giải đúng, False nếu người chơi giải sai
 * @param {string} token - Chuỗi JWT dùng để xác thực người dùng
 * @returns {Promise<Object>} Dữ liệu JSON trả về từ server bao gồm "message"
 */
export const addPuzzleHistory = async (puzzle_id, status, token) => {
  return await request("/puzzle-histories", {
    method: "POST",
    headers: {
      Authorization: `Bearer ${token}`,
    },
    body: JSON.stringify({ puzzle_id: puzzle_id, is_correct: status }),
  });
};

/**
 * Gửi request đến endpoint /ai/move để lấy nước đi tốt nhất của bot với thuật toán có độ sâu tương ứng với độ khó
 * @param {string} fen - Chuỗi FEN của thế cờ hiện tại
 * @param {int} difficult - Độ khó của bot mà người chơi chọn
 * @returns {Promise<Object>} - Dữ liệu JSON trả về từ server bao gồm "best_move"
 */
export const getAIBestMove = async (fen, difficult) => {
  return await request("/ai/move", {
    method: "POST",
    body: JSON.stringify({ fen: fen, difficult: Number(difficult) }),
  });
};

/**
 * Gửi request đến endpoint /matches/my-history để lấy danh sách lịch sử đấu.
 */
export const getHistoryList = async (token) => {
  return await request("/matches", {
    method: "GET",
    headers: { Authorization: `Bearer ${token}` },
  });
};

/**
 * Gửi request đến endpoint /matches/{match_id} để lấy chi tiết ván đấu.
 * @param {number} matchId - Id của trận đấu
 */
export const getMatchDetail = async (matchId, token) => {
  return await request(`/matches/${matchId}`, {
    method: "GET",
    headers: { Authorization: `Bearer ${token}` },
  });
};