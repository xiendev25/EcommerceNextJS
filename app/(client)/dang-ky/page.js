"use client";

import { useState, useEffect } from "react";
import Link from "next/link";

const API_BASE = process.env.NEXT_PUBLIC_API_BASE_URL;

export default function RegisterPage() {
  const [showPassword, setShowPassword] = useState(false);
  const [showRePassword, setShowRePassword] = useState(false);
  const [loading, setLoading] = useState(false);

  const [formData, setFormData] = useState({
    fullName: "",
    userName: "",
    email: "",
    phoneNumber: "",
    password: "",
    rePassword: "",
  });

  const [errors, setErrors] = useState({});
  const [serverError, setServerError] = useState("");

  // FIX SSR localStorage
  useEffect(() => {
    if (typeof window !== "undefined") {
      const token = localStorage.getItem("token");

      if (token) {
        alert("Bạn đã đăng nhập rồi!");
        window.location.href = "/";
      }
    }
  }, []);

  const handleChange = (e) => {
    const { name, value } = e.target;

    setFormData((prev) => ({
      ...prev,
      [name]: value,
    }));

    setErrors((prev) => ({
      ...prev,
      [name]: "",
    }));

    setServerError("");
  };

  const validateForm = () => {
    const newErrors = {};

    const fullName = formData.fullName.trim();
    const userName = formData.userName.trim();
    const email = formData.email.trim().toLowerCase();
    const phone = formData.phoneNumber.replace(/\D/g, "");
    const password = formData.password;
    const rePassword = formData.rePassword;

    if (!fullName) newErrors.fullName = "Vui lòng nhập Họ và tên!";
    if (!userName) newErrors.userName = "Vui lòng nhập Tên người dùng!";

    if (!email) {
      newErrors.email = "Vui lòng nhập Email!";
    } else if (!/\S+@\S+\.\S+/.test(email)) {
      newErrors.email = "Email không hợp lệ!";
    }

    if (!phone) {
      newErrors.phoneNumber = "Vui lòng nhập Số điện thoại!";
    } else if (!/^\d{10}$/.test(phone)) {
      newErrors.phoneNumber = "Số điện thoại phải gồm 10 số!";
    }

    if (!password) {
      newErrors.password = "Vui lòng nhập Mật khẩu!";
    } else if (password.length < 8) {
      newErrors.password = "Mật khẩu phải có ít nhất 8 ký tự!";
    }

    if (!rePassword) {
      newErrors.rePassword = "Vui lòng nhập Xác nhận mật khẩu!";
    } else if (password !== rePassword) {
      newErrors.rePassword = "Mật khẩu không khớp!";
    }

    setErrors(newErrors);

    return {
      ok: Object.keys(newErrors).length === 0,
      cleaned: { fullName, userName, email, phone, password },
    };
  };

  async function handleSubmit(e) {
    e.preventDefault();

    if (loading) return;

    const { ok, cleaned } = validateForm();

    if (!ok) return;

    setLoading(true);
    setServerError("");

    try {
      const verifyRedirect =
        typeof window !== "undefined"
          ? `${window.location.origin}/xac-thuc-thanh-cong`
          : "";

      const res = await fetch(`${API_BASE}/register`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          name: cleaned.fullName,
          email: cleaned.email,
          phone: cleaned.phone,
          username: cleaned.userName,
          password: cleaned.password,
          verifyRedirect,
        }),
      });

      if (res.status === 409) {
        const data = await res.json().catch(() => ({}));

        setServerError(
          data?.message || "Email/Tên người dùng đã tồn tại."
        );

        setLoading(false);
        return;
      }

      if (!res.ok) {
        const errorData = await res.json().catch(() => ({}));

        throw new Error(errorData?.message || "Đăng ký thất bại!");
      }

      const email = encodeURIComponent(cleaned.email);

      window.location.href = `/kiem-tra-email?email=${email}`;
    } catch (e) {
      setServerError(e.message || "Đăng ký thất bại!");
      setLoading(false);
    }
  }

  return (
    <div className="min-h-screen flex items-center justify-center p-4 mt-30 mb-30">
      <div className="w-full max-w-md">
        <div className="bg-white rounded-2xl shadow-xl p-8 space-y-6">

          <div className="text-center space-y-2">
            <h1 className="text-3xl font-bold text-gray-900">
              Đăng ký tài khoản
            </h1>
            <p className="text-gray-600">
              Đăng ký để bắt đầu mua sắm ngay!
            </p>
          </div>

          {serverError && (
            <div className="bg-red-50 text-red-700 text-sm p-3 rounded-lg border border-red-200">
              {serverError}
            </div>
          )}

          <form onSubmit={handleSubmit} className="space-y-4">

            <input
              type="text"
              name="fullName"
              placeholder="Họ và tên"
              value={formData.fullName}
              onChange={handleChange}
              className="w-full border p-3 rounded-lg"
            />

            <input
              type="text"
              name="userName"
              placeholder="Tên người dùng"
              value={formData.userName}
              onChange={handleChange}
              className="w-full border p-3 rounded-lg"
            />

            <input
              type="email"
              name="email"
              placeholder="Email"
              value={formData.email}
              onChange={handleChange}
              className="w-full border p-3 rounded-lg"
            />

            <input
              type="tel"
              name="phoneNumber"
              placeholder="Số điện thoại"
              value={formData.phoneNumber}
              onChange={handleChange}
              className="w-full border p-3 rounded-lg"
            />

            <input
              type={showPassword ? "text" : "password"}
              name="password"
              placeholder="Mật khẩu"
              value={formData.password}
              onChange={handleChange}
              className="w-full border p-3 rounded-lg"
            />

            <input
              type={showRePassword ? "text" : "password"}
              name="rePassword"
              placeholder="Nhập lại mật khẩu"
              value={formData.rePassword}
              onChange={handleChange}
              className="w-full border p-3 rounded-lg"
            />

            <button
              type="submit"
              disabled={loading}
              className="w-full bg-blue-600 text-white py-3 rounded-lg"
            >
              {loading ? "Đang tạo tài khoản..." : "Tạo tài khoản"}
            </button>

          </form>

          <div className="text-center text-sm text-gray-600">
            Bạn đã có tài khoản?{" "}
            <Link
              href="/dang-nhap"
              className="text-blue-600 font-semibold"
            >
              Đăng nhập
            </Link>
          </div>

        </div>
      </div>
    </div>
  );
}
