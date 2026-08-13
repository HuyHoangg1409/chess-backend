import React, { useState, useEffect, useRef } from "react";

import { getCurrentUser } from "./services/api";
import Login from "./components/Login";
import Header from "./components/Header";
import Footer from "./components/Footer";
import PuzzleGame from "./features/puzzle/PuzzleGame";
import Register from "./components/Register";
import Auth from "./components/Auth";

function App() {
  const [token, setToken] = useState(localStorage.getItem("access_token"));
  const [currentUser, setCurrentUser] = useState(null);

  /**
   * Effect tự động chạy và cập nhật thông tin người dùng vào currentUser khi state "token" thay đổi.
   */
  useEffect(() => {
    const fetchUserData = async () => {
      const localToken = localStorage.getItem("access_token");
      if (!localToken) return;

      try {
        const userData = await getCurrentUser(localToken);

        setCurrentUser(userData);
        // await fetchRandomPuzzle();
      } catch (error) {
        console.error("Token hết hạn hoặc bị lỗi: ", error);
        localStorage.removeItem("access_token");
        setToken(null);
      }
    };

    fetchUserData();
  }, [token]);

  const handleLogout = () => {
    localStorage.removeItem("access_token");
    setToken(null);
    setCurrentUser(null);
  };

  const handleUpdateElo = (elo_changed) => {
    setCurrentUser((prev) => ({
      ...prev,
      elo_rating: Math.max(prev.elo_rating + elo_changed, 0),
    }));
  };

  if (!localStorage.getItem("access_token")) {
    return (
      <Auth
        onLoginSuccess={(newToken) => {
          localStorage.setItem("access_token", newToken);
          setToken(newToken);
        }}
      />
    );
  }

  if (!currentUser) {
    return (
      <div className="flex justify-center items-center min-h-screen bg-chess-bg text-white">
        <p className="text-xl font-semibold">Loading User Data...</p>
      </div>
    );
  }

  return (
    <div className="flex flex-col items-center justify-between min-h-screen bg-chess-bg text-text-white p-6">
      <Header currentUser={currentUser}/>

      <PuzzleGame currentUser={currentUser} onUpdateElo={handleUpdateElo} onLogout={handleLogout} />

      <Footer />
    </div>
  );
}

export default App;
