'use client';

import { useState } from 'react';
import Link from 'next/link';

const API_BASE = process.env.NEXT_PUBLIC_API_BASE_URL;

export default function RegisterPage() {
    const [showPassword, setShowPassword] = useState(false);
    const [showRePassword, setShowRePassword] = useState(false);
    const [loading, setLoading] = useState(false);
    const [formData, setFormData] = useState({
        fullName: '',
        userName: '',
        email: '',
        phoneNumber: '',
        password: '',
        rePassword: ''
    });
    const [errors, setErrors] = useState({});
    const [serverError, setServerError] = useState('');

    const handleChange = (e) => {
        const { name, value } = e.target;
        setFormData(prev => ({ ...prev, [name]: value }));
        setErrors(prev => ({ ...prev, [name]: '' }));
        setServerError('');
    };

    if (localStorage.getItem('token')) {
        alert('Bạn đã đăng nhập rồi!');
        window.location.href = '/';
        return;
    }

    const validateForm = () => {
        const newErrors = {};
        const fullName = formData.fullName.trim();
        const userName = formData.userName.trim();
        const email = formData.email.trim().toLowerCase();
        const phone = formData.phoneNumber.replace(/\D/g, ''); // chỉ giữ số
        const password = formData.password;
        const rePassword = formData.rePassword;

        if (!fullName) newErrors.fullName = 'Vui lòng nhập Họ và tên!';
        if (!userName) newErrors.userName = 'Vui lòng nhập Tên người dùng!';

        if (!email) {
            newErrors.email = 'Vui lòng nhập Email!';
        } else if (!/\S+@\S+\.\S+/.test(email)) {
            newErrors.email = 'Email không hợp lệ!';
        }

        if (!phone) {
            newErrors.phoneNumber = 'Vui lòng nhập Số điện thoại!';
        } else if (!/^\d{10}$/.test(phone)) {
            newErrors.phoneNumber = 'Số điện thoại phải gồm 10 số!';
        }

        if (!password) {
            newErrors.password = 'Vui lòng nhập Mật khẩu!';
        } else if (password.length < 8) {
            newErrors.password = 'Mật khẩu phải có ít nhất 8 ký tự!';
        }

        if (!rePassword) {
            newErrors.rePassword = 'Vui lòng nhập Xác nhận mật khẩu!';
        } else if (password !== rePassword) {
            newErrors.rePassword = 'Mật khẩu không khớp!';
        }

        setErrors(newErrors);
        return { ok: Object.keys(newErrors).length === 0, cleaned: { fullName, userName, email, phone, password } };
    };

    async function handleSubmit(e) {
        e.preventDefault();
        if (loading) return;

        const { ok, cleaned } = validateForm();
        if (!ok) return;

        setLoading(true);
        setServerError('');

        try {
            // Tuỳ chọn: frontend gửi URL sẽ chuyển hướng sau khi xác thực thành công
            const verifyRedirect = `${window.location.origin}/xac-thuc-thanh-cong`;

            const res = await fetch(`${API_BASE}/register`, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({
                    name: cleaned.fullName,
                    email: cleaned.email,
                    phone: cleaned.phone,
                    username: cleaned.userName,
                    password: cleaned.password,
                    verifyRedirect, // nếu BE hỗ trợ, dùng để build link xác thực
                }),
            });

            // 409: trùng email/username (theo bạn nói)
            if (res.status === 409) {
                const data = await res.json().catch(() => ({}));
                setServerError(data?.message || 'Email/Tên người dùng đã tồn tại.');
                setLoading(false);
                return;
            }

            if (!res.ok) {
                const errorData = await res.json().catch(() => ({}));
                throw new Error(errorData?.message || 'Đăng ký thất bại!');
            }

            // Đăng ký xong → dẫn sang trang nhắc người dùng kiểm tra email
            // (Không auto đăng nhập để buộc xác thực)
            const email = encodeURIComponent(cleaned.email);
            window.location.href = `/kiem-tra-email?email=${email}`;
        } catch (e) {
            setServerError(e.message || 'Đăng ký thất bại!');
            setLoading(false);
        }
    }

    return (
        <div className="min-h-screen flex items-center justify-center p-4 mt-30 mb-30">
            <div className="w-full max-w-md">
                <div className="bg-white rounded-2xl shadow-xl p-8 space-y-6">
                    <div className="text-center space-y-2">
                        <h1 className="text-3xl font-bold text-gray-900">Đăng ký tài khoản</h1>
                        <p className="text-gray-600">Đăng ký để bắt đầu mua sắm ngay!</p>
                    </div>

                    {serverError && (
                        <div className="bg-red-50 text-red-700 text-sm p-3 rounded-lg border border-red-200">
                            <i className="fa-solid fa-circle-exclamation mr-2" />
                            {serverError}
                        </div>
                    )}

                    <form onSubmit={handleSubmit} className="space-y-4">
                        {/* Họ & tên */}
                        <div>
                            <label htmlFor="fullName" className="block text-sm font-medium text-gray-700 mb-1">
                                Họ và Tên
                            </label>
                            <div className="relative">
                                <i className="fa-solid fa-user absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-gray-400" />
                                <input
                                    type="text"
                                    id="fullName"
                                    name="fullName"
                                    value={formData.fullName}
                                    onChange={handleChange}
                                    placeholder="Nhập họ và tên"
                                    className={`w-full pl-10 pr-4 py-3 border ${errors.fullName ? 'border-red-500' : 'border-gray-300'
                                        } rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all outline-none`}
                                />
                            </div>
                            {errors.fullName && <p className="mt-1 text-sm text-red-500">{errors.fullName}</p>}
                        </div>

                        {/* Username */}
                        <div>
                            <label htmlFor="userName" className="block text-sm font-medium text-gray-700 mb-1">
                                Tên người dùng
                            </label>
                            <div className="relative">
                                <i className="fa-solid fa-user absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-gray-400" />
                                <input
                                    type="text"
                                    id="userName"
                                    name="userName"
                                    value={formData.userName}
                                    onChange={handleChange}
                                    placeholder="Nhập tên người dùng"
                                    className={`w-full pl-10 pr-4 py-3 border ${errors.userName ? 'border-red-500' : 'border-gray-300'
                                        } rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all outline-none`}
                                />
                            </div>
                            {errors.userName && <p className="mt-1 text-sm text-red-500">{errors.userName}</p>}
                        </div>

                        {/* Email */}
                        <div>
                            <label htmlFor="email" className="block text-sm font-medium text-gray-700 mb-1">
                                Email
                            </label>
                            <div className="relative">
                                <i className="fa-solid fa-envelope absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-gray-400" />
                                <input
                                    type="email"
                                    id="email"
                                    name="email"
                                    value={formData.email}
                                    onChange={handleChange}
                                    placeholder="Nhập email"
                                    className={`w-full pl-10 pr-4 py-3 border ${errors.email ? 'border-red-500' : 'border-gray-300'
                                        } rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all outline-none`}
                                />
                            </div>
                            {errors.email && <p className="mt-1 text-sm text-red-500">{errors.email}</p>}
                        </div>

                        {/* Phone */}
                        <div>
                            <label htmlFor="phoneNumber" className="block text-sm font-medium text-gray-700 mb-1">
                                Số điện thoại
                            </label>
                            <div className="relative">
                                <i className="fa-solid fa-phone absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-gray-400" />
                                <input
                                    type="tel"
                                    id="phoneNumber"
                                    name="phoneNumber"
                                    value={formData.phoneNumber}
                                    onChange={handleChange}
                                    placeholder="Nhập số điện thoại (10 số)"
                                    className={`w-full pl-10 pr-4 py-3 border ${errors.phoneNumber ? 'border-red-500' : 'border-gray-300'
                                        } rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all outline-none`}
                                />
                            </div>
                            {errors.phoneNumber && <p className="mt-1 text-sm text-red-500">{errors.phoneNumber}</p>}
                        </div>

                        {/* Password */}
                        <div>
                            <label htmlFor="password" className="block text-sm font-medium text-gray-700 mb-1">
                                Mật khẩu
                            </label>
                            <div className="relative">
                                <i className="fa-solid fa-lock absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-gray-400" />
                                <input
                                    type={showPassword ? 'text' : 'password'}
                                    id="password"
                                    name="password"
                                    value={formData.password}
                                    onChange={handleChange}
                                    placeholder="Nhập mật khẩu"
                                    className={`w-full pl-10 pr-12 py-3 border ${errors.password ? 'border-red-500' : 'border-gray-300'
                                        } rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all outline-none`}
                                />
                                <button
                                    type="button"
                                    onClick={() => setShowPassword(!showPassword)}
                                    className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400 hover:text-gray-600 transition-colors"
                                >
                                    {showPassword ? (
                                        <i className="fa-solid fa-eye w-5 h-5" />
                                    ) : (
                                        <i className="fa-solid fa-eye-slash w-5 h-5" />
                                    )}
                                </button>
                            </div>
                            {errors.password && <p className="mt-1 text-sm text-red-500">{errors.password}</p>}
                        </div>

                        {/* Re-Password */}
                        <div>
                            <label htmlFor="rePassword" className="block text-sm font-medium text-gray-700 mb-1">
                                Xác nhận mật khẩu
                            </label>
                            <div className="relative">
                                <i className="fa-solid fa-lock absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-gray-400" />
                                <input
                                    type={showRePassword ? 'text' : 'password'}
                                    id="rePassword"
                                    name="rePassword"
                                    value={formData.rePassword}
                                    onChange={handleChange}
                                    placeholder="Nhập lại mật khẩu"
                                    className={`w-full pl-10 pr-12 py-3 border ${errors.rePassword ? 'border-red-500' : 'border-gray-300'
                                        } rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all outline-none`}
                                />
                                <button
                                    type="button"
                                    onClick={() => setShowRePassword(!showRePassword)}
                                    className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400 hover:text-gray-600 transition-colors"
                                >
                                    {showRePassword ? (
                                        <i className="fa-solid fa-eye w-5 h-5" />
                                    ) : (
                                        <i className="fa-solid fa-eye-slash w-5 h-5" />
                                    )}
                                </button>
                            </div>
                            {errors.rePassword && <p className="mt-1 text-sm text-red-500">{errors.rePassword}</p>}
                        </div>

                        <button
                            type="submit"
                            disabled={loading}
                            className="w-full bg-gradient-to-r from-blue-600 to-indigo-600 disabled:opacity-70 text-white py-3 rounded-lg font-semibold hover:from-blue-700 hover:to-indigo-700 transform hover:scale-[1.02] transition-all shadow-lg hover:shadow-xl"
                        >
                            {loading ? 'Đang tạo tài khoản...' : 'Tạo tài khoản'}
                        </button>
                    </form>

                    <div className="text-center text-sm text-gray-600">
                        Bạn đã có tài khoản?{' '}
                        <Link href="/dang-nhap" className="text-blue-600 font-semibold hover:text-blue-700 transition-colors">
                            Đăng nhập
                        </Link>
                    </div>
                </div>
            </div>
        </div>
    );
}
