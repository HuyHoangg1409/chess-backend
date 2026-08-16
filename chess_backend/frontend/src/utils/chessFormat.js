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

export default formatMoveHistory;