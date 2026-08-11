import React, { useState } from "react";
import { sendRegisterRequest } from "../services/api";

export default function Register({ switchToLogin }) {
  const [formData, setFormData] = useState({
    username: "",
    password: "",
    confirmPassword: "",
  });
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);

  /**
   * Cập nhật dữ liệu từ ô nhập vào formData
   */
  const handleChange = (e) => {
    const { name, value } = e.target;
    setFormData((prevData) => ({
      ...prevData,
      [name]: value,
    }));
  };

  /**
   * Kiểm tra hợp lệ thông tin đăng ký của người dùng.
   * @param {*} username - Tên tài khoản của người dùng
   * @param {*} password - Mật khẩu
   * @param {*} confirmedPassword - Mật khẩu xác nhận
   * @returns {string|null} Trả về chuỗi báo lỗi nếu có lỗi hoặc trả về null nếu thông tin đăng ký hợp lệ
   */
  const checkUserAndPass = (username, password, confirmedPassword) => {
    if (!username || !username.trim()) {
      return "Tài khoản không được để trống";
    }

    if (password != confirmedPassword) {
      return "Mật khẩu xác nhận không khớp";
    }

    const userRegex = /^[a-zA-Z0-9]+$/;
    const passRegex = /^[a-zA-Z0-9!@#_$]+$/;
    if (!userRegex.test(username)) {
      return "Tài khoản không được chứa kí tự đặc biệt";
    }
    if (!passRegex.test(password)) {
      return "Mật khẩu chỉ được chứa các kí tự a-z, A-Z, 0-9 và các kí tự đặc biệt [!,@,#,_,$]";
    }

    if (username.length < 5 || username.length > 20) {
      return "Tài khoản phải có độ dài từ 5 đến 20 kí tự";
    }
    if (password.length < 6) {
      return "Mật khẩu quá ngắn";
    }
    return null;
  };

  /**
   * Xử lý sự kiện người dùng nhấn nút đăng ký.
   */
  const handleSubmit = async (e) => {
    e.preventDefault();

    const error = checkUserAndPass(
      formData.username,
      formData.password,
      formData.confirmPassword,
    );
    if (error) {
      setError(error);
      return;
    }

    setLoading(true);
    try {
      const data = await sendRegisterRequest({
        username: formData.username,
        password: formData.password,
      });
      alert("Đăng ký thành công");
      switchToLogin();
    } catch (error) {
      setError(error);
    } finally {
      setLoading(false);
    }
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
            <p className="text-red-500 font-semibold text-center">{error}</p>
          )}

          <button
            type="submit"
            disabled={loading}
            className="w-full py-4 text-xl font-bold bg-green-600 text-white rounded-lg hover:bg-green-700 cursor-pointer transition-colors duration-300 tracking-wider"
          >
            {loading ? "Đang xử lý..." : "ĐĂNG KÝ"}
          </button>

          <p className="flex gap-4 justify-center text-center">
            Đã có tài khoản?
            <button
              type="button"
              onClick={switchToLogin}
              className="text-green-400 hover:text-green-500 cursor-pointer font-semibold"
            >
              Đăng nhập ngay
            </button>
          </p>
        </form>
      </div>
    </div>
  );
}
