import React, { useState, useEffect } from "react";

function App() {
  const [puzzle, setPuzzle] = useState(null);

  const fetchRandomPuzzle = () => {
    fetch("http://127.0.0.1:8000/puzzles/randomWithoutDifficulty")
      .then((response) => response.json())
      .then((data) => {
        console.log("Data from database: ", data);
        setPuzzle(data);
      })
      .catch((error) => console.error("Error: ", error));
  };

  useEffect(() => {
    fetchRandomPuzzle();
  }, []);

  if (!puzzle) {
    return (
      <div>
        <p>Loading Puzzles</p>
      </div>
    );
  }
  return (
    <div>
      <h3>ID puzzle: {puzzle.puzzle_id}</h3>
      <h3>Difficult: {puzzle.difficulty}</h3>
      <code style={{ wordBreak: "break-all" }}>{puzzle.fen_position}</code>

      <button onClick={fetchRandomPuzzle}>Change Puzzle</button>
    </div>
  );
}

export default App;
