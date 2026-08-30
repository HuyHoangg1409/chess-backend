import React, { useState } from "react";
import { sendLoginRequest } from "../services/api";

function Login({ onLoginSuccess, switchToRegister }) {
  const [username, setUsername] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState(false);

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError(false);

    try {
      const data = await sendLoginRequest({ username, password });

      localStorage.setItem("access_token", data.access_token);
      onLoginSuccess(data.access_token);
    } catch (error) {
      setError(true);
      setPassword("");
    }
  };

  return (
    <div className="flex flex-col items-center justify-center min-h-screen bg-chess-bg text-text-white p-4">
      <div className="w-full max-w-[360px] sm:max-w-md bg-chess-outline p-6 rounded-2xl border border-chess-border">
        <div className="font-semibold text-center mb-6">
          <h1 className="text-4xl text-green-500">Chess</h1>
        </div>

        <form onSubmit={handleSubmit} className="flex flex-col gap-4">
          <div>
            <label className="block font-semibold mb-1 text-sm sm:text-base">Username</label>
            <input
              type="text"
              required
              value={username}
              onChange={(e) => {
                setUsername(e.target.value);
              }}
              autoComplete="off"
              placeholder="Username"
              className="w-full px-3.5 py-2.5 sm:px-4 sm:py-3 bg-chess-bg rounded-lg border border-chess-border focus:outline-none focus:border-green-400 transition-colors"
            />
          </div>

          <div>
            <label className="block font-semibold mb-1 text-sm sm:text-base">Password</label>
            <input
              type="password"
              required
              value={password}
              onChange={(e) => {
                setPassword(e.target.value);
              }}
              autoComplete="current-password"
              placeholder="Password"
              className="w-full px-3.5 py-2.5 sm:px-4 sm:py-3 bg-chess-bg rounded-lg border border-chess-border focus:outline-none focus:border-green-400 transition-colors"
            />
          </div>

          {error && <p className="text-red-500 font-semibold text-center text-sm">Tài khoản hoặc mật khẩu không chính xác</p>}

          <button
            type="submit"
            className="w-full py-3 text-lg bg-green-600 text-white rounded-lg hover:bg-green-700 cursor-pointer transition-colors duration-300 tracking-wider"
          >
            ĐĂNG NHẬP
          </button>

          <p className="flex gap-2 justify-center text-center text-sm">
            Chưa có tài khoản?
            <button type="button" onClick={switchToRegister} className="text-green-400 hover:text-green-500 cursor-pointer font-semibold">
              Đăng ký ngay
            </button>
          </p>
        </form>
      </div>
    </div>
  );
}

export default Login;
