const BASE_URL = "http://127.0.0.1:8000"

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