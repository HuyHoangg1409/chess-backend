const BASE_URL = import.meta.env.VITE_API_BASE_URL || "http://localhost:8000";

/**
 * Lấy ngẫu nhiên 1 puzzle với độ khó ngẫu nhiên từ database.
 * @returns {Promise<Object>} Dữ liệu JSON chứa thông tin puzzle
 */
export const getRandomPuzzle = async () => {
  try {
    const response = await fetch(`${BASE_URL}/puzzles/randomWithoutDifficulty`);
    if (!response.ok) {
      throw new Error("Không lấy được puzzle");
    }
    return await response.json();
  } catch (error) {
    console.error("API Error: ", error);
    throw error;
  }
};

/**
 * Lấy thông tin của 1 puzzle với ID cụ thể từ database.
 * @param {number} puzzleId - ID của puzzle cần lấy
 * @returns {Promise<Object>} Dữ liệu JSON chứa thông tin puzzle
 */
export const getPuzzleById = async (puzzleId) => {
  try {
    const response = await fetch(`${BASE_URL}/puzzles/${puzzleId}`);
    if (!response.ok) {
      throw new Error("Không lấy được puzzle với id tương ứng");
    }
    return await response.json();
  } catch (error) {
    console.error("API Error: ", error);
    throw error;
  }
};

/**
 * Gửi yêu cầu đăng nhập lên server.
 * @param {Object} userData - Thông tin đăng nhập của người dùng bao gồm "username" và "password"
 * @returns {Promise<Object>} Dữ liệu JSON trả về từ server khi đăng nhập thành công bao gồm "access_token" và "token_type"
 */
export const sendLoginRequest = async (userData) => {
  try {
    const response = await fetch(`${BASE_URL}/login`, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify(userData),
    });
    if (!response.ok) {
      throw new Error("Không đăng nhập được");
    }
    return await response.json();
  } catch (error) {
    console.error("API Error: ", error);
    throw error;
  }
};

/**
 * Gửi yêu cầu đăng ký người dùng mới lên server với thông tin từ userData.
 * @param {Object} userData - Thông tin đăng ký của người dùng bao gồm "username" và "password"
 * @returns {Promise<Object>} Dữ liệu JSON trả về từ server khi đăng ký thành công bao gồm "user_id", "username" và "elo_rating"
 */
export const sendRegisterRequest = async (userData) => {
  try {
    const response = await fetch(`${BASE_URL}/register`, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify(userData),
    });
    if (!response.ok) {
      throw new Error("Lỗi khi đăng ký tài khoản");
    }
    return await response.json();
  } catch (error) {
    console.error("API Error: ", error);
    throw error;
  }
};

/**
 * Lấy thông tin của người dùng hiện tại dựa trên access token.
 * @param {string} token - Chuỗi JWT dùng để xác thực người dùng
 * @returns {Promise<Object>} Dữ liệu JSON trả về từ server khi xác thực người dùng thành công bao gồm "user_id", "username" và "elo_rating"
 */
export const getCurrentUser = async (token) => {
  try {
    const response = await fetch(`${BASE_URL}/auth/me`, {
      method: "GET",
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${token}`,
      },
    });
    if (!response.ok) {
      throw new Error("Không thể xác minh người dùng");
    }
    return await response.json();
  } catch (error) {
    console.error("API Error: ", error);
    throw error;
  }
};

/**
 * Gửi đáp án của người chơi lên server để kiểm tra.
 * @param {int} puzzle_id - ID của câu đố cần kiểm tra
 * @param {string} userAnswer - Các nước đi người chơi đã đi
 * @param {string} token - Chuỗi JWT dùng để xác thực người dùng
 * @returns {Promise<Object>} Dữ liệu JSON trả về từ server bao gồm "is_correct", "is_completed" và "message"
 */
export const checkPuzzle = async (puzzle_id, userAnswer, token) => {
  try {
    const response = await fetch(`${BASE_URL}/puzzles/check`, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${token}`,
      },
      body: JSON.stringify({ puzzle_id: puzzle_id, user_move: userAnswer }),
    });
    if (!response.ok) {
      throw new Error("Không kết nối được api /puzzles/check");
    }
    return await response.json();
  } catch (error) {
    console.error("API Error: ", error);
    throw error;
  }
};

/**
 * Gửi request đến api /puzzles/help để lấy nước đi chính xác tại moveIndex.
 * @param {int} puzzle_id - ID của câu đố cần lấy đáp án
 * @param {int} moveIndex - Index của đáp án cần lấy
 * @param {string} token - Chuỗi JWT dùng để xác thực người dùng
 * @returns {Promise<Object>} Dữ liệu JSON trả về từ server bao gồm "hint" là nước đi chính xác tại moveIndex
 */
export const getHelp = async (puzzle_id, moveIndex, token) => {
  try {
    const response = await fetch(`${BASE_URL}/puzzles/help`, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${token}`,
      },
      body: JSON.stringify({ puzzle_id: puzzle_id, move_index: moveIndex }),
    });
    if (!response.ok) {
      throw new Error("Không kết nối được api /puzzles/help");
    }
    return await response.json();
  } catch (error) {
    console.error("API Error: ", error);
    throw error;
  }
};

/**
 * Gửi request đến api /history/add để cập nhật lịch sử giải đố của người chơi vào database.
 * @param {int} puzzle_id - ID của puzzle
 * @param {boolean} status - True nếu người chơi giải đúng, False nếu người chơi giải sai
 * @param {string} token - Chuỗi JWT dùng để xác thực người dùng
 * @returns {Promise<Object>} Dữ liệu JSON trả về từ server bao gồm "message"
 */
export const addPuzzleHistory = async (puzzle_id, status, token) => {
  try {
    const response = await fetch(`${BASE_URL}/history/add`, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${token}`,
      },
      body: JSON.stringify({ puzzle_id: puzzle_id, is_correct: status }),
    });
    if (!response.ok) {
      throw new Error("Không kết nối được api /history/add");
    }
    return await response.json();
  } catch (error) {
    console.error("API Error: ", error);
    throw error;
  }
};
