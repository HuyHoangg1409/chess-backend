import React, { useState, useEffect, useRef } from "react";

import { getCurrentUser } from "./services/api";
import Login from "./components/Login";
import Header from "./components/Header";
import Footer from "./components/Footer";
import PuzzleGame from "./components/PuzzleGame";
import Register from "./components/Register";

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

  if (!localStorage.getItem("access_token")) {
    return (
      // <Login
      //   onLoginSuccess={(newToken) => {
      //     setToken(newToken);
      //   }}
      // />
      <Register/>
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
      <Header currentUser={currentUser} onLogout={handleLogout} />

      <PuzzleGame />

      <Footer />
    </div>
  );
}

export default App;
