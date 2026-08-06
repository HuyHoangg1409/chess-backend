import React, { useState } from "react";

export default function Register() {
  const [formData, setFormData] = useState({
    username: "",
    password: "",
    confirmPassword: "",
  });
  const [error, setError] = useState(false);

  const handleChange = (e) => {
    const { name, value } = e.target;
    setFormData((prevData) => ({
      ...prevData,
      [name]: value,
    }));
};

const handleSubmit = async (e) => {
    e.preventDefault();
    console.log(formData);
  };

  return (
    <div className="flex flex-col items-center justify-center min-h-screen bg-chess-bg text-text-white">
      <div className="w-full max-w-md bg-chess-outline p-8 pt-4 rounded-2xl border border-chess-border">
        <div className="font-semibold text-center mb-8">
          <h1 className="text-5xl text-green-500">Chess</h1>
        </div>

        <form onSubmit={handleSubmit} className="flex flex-col gap-5">
          <div>
            <label
              htmlFor="username-input"
              className="block font-semibold mb-2"
            >
              Username
            </label>
            <input
              id="username-input"
              name="username"
              type="text"
              required
              value={formData.username}
              onChange={handleChange}
              autoComplete="off"
              placeholder="Username"
              className="w-full px-4 py-3 bg-chess-bg rounded-lg border border-chess-border focus:outline-none focus:border-green-400 transition-colors"
            />
          </div>

          <div>
            <label
              htmlFor="password-input"
              className="block font-semibold mb-2"
            >
              Password
            </label>
            <input
              id="password-input"
              name="password"
              type="password"
              required
              value={formData.password}
              onChange={handleChange}
              autoComplete="new-password"
              placeholder="Password"
              className="w-full px-4 py-3 bg-chess-bg rounded-lg border border-chess-border focus:outline-none focus:border-green-400 transition-colors"
            />
          </div>

          <div>
            <label
              htmlFor="confirmPassword-input"
              className="block font-semibold mb-2"
            >
              Confirm Password
            </label>
            <input
              id="confirmPassword-input"
              name="confirmPassword"
              type="password"
              required
              value={formData.confirmPassword}
              onChange={handleChange}
              autoComplete="new-password"
              placeholder="Confirm Password"
              className="w-full px-4 py-3 bg-chess-bg rounded-lg border border-chess-border focus:outline-none focus:border-green-400 transition-colors"
            />
          </div>

          {error && (
            <p className="text-red-500 font-semibold text-center">
              Tài khoản hoặc mật khẩu không chính xác
            </p>
          )}

          <button
            type="submit"
            className="w-full py-4 mb-auto text-xl font-semibold bg-green-600 text-white rounded-lg hover:bg-green-700 cursor-pointer transition-colors duration-300"
          >
            REGISTER
          </button>
        </form>
      </div>
    </div>
  );
}
