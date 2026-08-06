const BASE_URL = "http://127.0.0.1:8000";

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
        'Content-Type': 'application/json'
      },
      body: JSON.stringify(userData)
    });
    if (!response.ok) {
      throw new Error("Không đăng nhập được");
    }
    return await response.json();
  } catch (error) {
    console.error("API Error: ", error);
    throw error;
  }
}
