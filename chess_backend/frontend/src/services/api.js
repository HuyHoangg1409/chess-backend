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
