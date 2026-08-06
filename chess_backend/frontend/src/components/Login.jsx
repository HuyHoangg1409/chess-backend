import React, { useState } from "react";
import { sendLoginRequest } from "../services/api";

function Login({onLoginSuccess}) {
  const [username, setUsername] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState(false);

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError(false);
    
    try{
        const data = await sendLoginRequest({username, password});
    
        localStorage.setItem("access_token", data.access_token);
        onLoginSuccess(data.access_token);
    } catch (error) {
        setError(true);
        setPassword("");
    }
  }


  return (
    <div className="flex flex-col items-center justify-center min-h-screen bg-chess-bg text-text-white">
      <div className="w-full max-w-md bg-chess-outline p-8 pt-4 rounded-2xl border border-chess-border">
        <div className="font-semibold text-center mb-8">
          <h1 className="text-5xl text-green-500">Chess</h1>
        </div>

        <form onSubmit={handleSubmit} className="flex flex-col gap-5">
          <div>
            <label className="block font-semibold mb-2">Username</label>
            <input
              type="text"
              required
              value={username}
              onChange={(e) => {
                setUsername(e.target.value);
              }}
              autoComplete="off"
              placeholder="Username"
              className="w-full px-4 py-3 bg-chess-bg rounded-lg border border-chess-border focus:outline-none focus:border-green-400 transition-colors"
            />
          </div>

          <div>
            <label className="block font-semibold mb-2">Password</label>
            <input
              type="password"
              required
              value={password}
              onChange={(e) => {
                setPassword(e.target.value);
              }}
              autoComplete="new-password"
              placeholder="Password"
              className="w-full px-4 py-3 bg-chess-bg rounded-lg border border-chess-border focus:outline-none focus:border-green-400 transition-colors"
            />
          </div>

          {error && <p className="text-red-500 font-semibold text-center">Tài khoản hoặc mật khẩu không chính xác</p>}

          <button
            type="submit"
            className="w-full py-4 mb-auto text-xl bg-green-600 text-white rounded-lg hover:bg-green-700 cursor-pointer transition-colors duration-300"
          >
            LOGIN
          </button>
        </form>
      </div>
    </div>
  );
}

export default Login;
