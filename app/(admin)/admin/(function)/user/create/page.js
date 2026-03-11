'use client'

import React, { useState, useEffect } from 'react'
import Link from 'next/link'
import { useRouter } from "next/navigation";
import Image from "next/image";

const API_BASE = process.env.NEXT_PUBLIC_API_BASE_URL;

export default function Page() {
    const router = useRouter();
    // Sử dụng tên biến 'user' cho admin đang đăng nhập
    const [user, setUser] = useState(null);
    const [authLoading, setAuthLoading] = useState(true);

    useEffect(() => {
        const verifyAdmin = async () => {
            setAuthLoading(true);
            const token = localStorage.getItem('token');
            if (!token) {
                router.replace('/admin/login');
                return;
            }
            try {
                const res = await fetch(`${API_BASE}/verifyAdmin`, {
                    headers: { Authorization: token },
                    cache: 'no-store'
                });
                if (!res.ok) {
                    localStorage.removeItem('token');
                    router.replace('/admin/login');
                    return;
                }
                const adminData = await res.json();
                setUser(adminData);
            } catch (e) {
                console.error("Lỗi xác thực:", e);
                localStorage.removeItem('token');
                router.replace('/admin/login');
            } finally {
                setAuthLoading(false);
            }
        };
        verifyAdmin();
    }, [router]);

    const [state, setState] = useState({ submitting: false, error: null });
    const [form, setForm] = useState({
        name: '',
        email: '',
        phone: '',
        username: '',
        password: '',
        confirm_password: '',
        role: 'customer',
        status: 1,
    });
    const [avatarFile, setAvatarFile] = useState(null);
    const [avatarPreview, setAvatarPreview] = useState(null);


    useEffect(() => {
        if (avatarFile) {
            const url = URL.createObjectURL(avatarFile);
            setAvatarPreview(url);
            return () => URL.revokeObjectURL(url);
        }
        setAvatarPreview(null);
    }, [avatarFile]);

    const handleChange = (e) => {
        const { name, value } = e.target;
        setForm(prev => ({ ...prev, [name]: value }));
    };

    const uploadAvatar = async (file) => {
        if (!file) return null;

        const fd = new FormData();
        fd.append('image', file);
        fd.append('perfix', 'avatars');

        const res = await fetch(`${API_BASE}/upload`, { method: 'POST', body: fd });
        if (!res.ok) {
            const t = await res.text().catch(() => '');
            throw new Error(t || `Upload avatar thất bại (${res.status})`);
        }
        return await res.json();
    };

    const handleSubmit = async (e) => {
        e.preventDefault();

        if (!user) {
            alert('Không thể xác định người dùng admin. Vui lòng đăng nhập lại.');
            router.push('/admin/login');
            return;
        }

        if (form.password !== form.confirm_password) {
            setState(s => ({ ...s, error: "Mật khẩu xác nhận không khớp." }));
            return;
        }
        if (!form.name || !form.email || !form.username || !form.password) {
            setState(s => ({ ...s, error: "Vui lòng điền các trường bắt buộc (*)." }));
            return;
        }
        if (form.password.length < 6) { 
            setState(s => ({ ...s, error: "Mật khẩu phải có ít nhất 6 ký tự." }));
            return;
        }


        setState(s => ({ ...s, submitting: true, error: null }));

        try {
            let avatarUrl = null;
            if (avatarFile) {
                const uploadRes = await uploadAvatar(avatarFile);
                avatarUrl = uploadRes.url;
            }

            const payload = {
                name: form.name.trim(),
                email: form.email.trim(),
                phone: form.phone.trim() || null, // Gửi null nếu trống
                username: form.username.trim(),
                password: form.password, // Backend sẽ hash mật khẩu này
                role: form.role,
                status: Number(form.status),
                avatar: avatarUrl,
                created_by: user.id, // Dùng user.id (admin đang đăng nhập)
                // created_at sẽ được xử lý bởi backend
            };
            // Không cần xóa confirm_password vì không có trong payload

            const createRes = await fetch(`${API_BASE}/user`, { // Endpoint tạo user mới
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify(payload),
            });

            if (!createRes.ok) {
                const errorData = await createRes.json().catch(() => ({}));
                let errMsg = "Tạo người dùng thất bại.";
                // Cố gắng lấy thông báo lỗi cụ thể từ backend
                if (errorData.message) {
                    errMsg = errorData.message;
                } else if (createRes.status === 422) { // Unprocessable Entity (Validation error)
                    errMsg = "Dữ liệu không hợp lệ. Email hoặc Username có thể đã tồn tại.";
                }
                throw new Error(errMsg);
            }

            alert("Tạo người dùng mới thành công!");
            router.push('/admin/user'); // Chuyển về trang danh sách user

        } catch (err) {
            console.error(err);
            // Hiển thị lỗi cho người dùng
            setState(s => ({ ...s, submitting: false, error: err.message || 'Lỗi không xác định' }));
        }
        // Không cần finally vì submitting đã được set trong catch
    };

    // Hiển thị loading khi đang xác thực admin
    if (authLoading) return <div className="p-8 text-center animate-pulse">Đang xác thực quyền truy cập...</div>;

    // Render form
    return (
        <form onSubmit={handleSubmit} className="space-y-8 max-w-4xl mx-auto">
            {/* Header */}
            <div className="flex items-center justify-between">
                <h1 className="text-2xl font-bold text-gray-900">Thêm Người dùng mới</h1>
                <div className="flex gap-3">
                    <Link href="/admin/user" className="px-4 py-2 bg-gray-200 hover:bg-gray-300 text-gray-800 text-sm font-medium rounded-lg">Hủy</Link>
                    <button type="submit" disabled={state.submitting} className="px-4 py-2 bg-indigo-600 text-white rounded-lg disabled:opacity-60 disabled:cursor-not-allowed">
                        {state.submitting ? 'Đang tạo...' : 'Tạo người dùng'}
                    </button>
                </div>
            </div>

            {/* Error Display */}
            {state.error && (
                <div className="p-4 bg-red-50 border border-red-200 text-red-700 rounded-lg text-sm">
                    {state.error}
                </div>
            )}

            {/* Form Fields */}
            <div className="bg-white p-6 md:p-8 shadow-sm rounded-lg border space-y-6">
                {/* Name & Username */}
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                    <div>
                        <label className="block text-sm font-medium mb-1">Họ và tên <span className="text-red-500">*</span></label>
                        <input name="name" value={form.name} onChange={handleChange} required className="w-full h-11 px-4 rounded-lg bg-gray-50 border border-gray-300" />
                    </div>
                    <div>
                        <label className="block text-sm font-medium mb-1">Username <span className="text-red-500">*</span></label>
                        <input name="username" value={form.username} onChange={handleChange} required className="w-full h-11 px-4 rounded-lg bg-gray-50 border border-gray-300" />
                    </div>
                </div>
                {/* Email & Phone */}
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                    <div>
                        <label className="block text-sm font-medium mb-1">Email <span className="text-red-500">*</span></label>
                        <input name="email" type="email" value={form.email} onChange={handleChange} required className="w-full h-11 px-4 rounded-lg bg-gray-50 border border-gray-300" />
                    </div>
                    <div>
                        <label className="block text-sm font-medium mb-1">Số điện thoại</label>
                        <input name="phone" value={form.phone} onChange={handleChange} className="w-full h-11 px-4 rounded-lg bg-gray-50 border border-gray-300" />
                    </div>
                </div>
                {/* Password */}
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                    <div>
                        <label className="block text-sm font-medium mb-1">Mật khẩu <span className="text-red-500">*</span></label>
                        <input name="password" type="password" value={form.password} onChange={handleChange} required className="w-full h-11 px-4 rounded-lg bg-gray-50 border border-gray-300" />
                    </div>
                    <div>
                        <label className="block text-sm font-medium mb-1">Xác nhận mật khẩu <span className="text-red-500">*</span></label>
                        <input name="confirm_password" type="password" value={form.confirm_password} onChange={handleChange} required className="w-full h-11 px-4 rounded-lg bg-gray-50 border border-gray-300" />
                    </div>
                </div>
                {/* Avatar */}
                <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">Ảnh đại diện (Avatar)</label>
                    <input type="file" accept="image/*" onChange={e => setAvatarFile(e.target.files?.[0] || null)} className="w-full text-sm text-slate-500 file:mr-4 file:py-2 file:px-4 file:rounded-full file:border-0 file:text-sm file:font-semibold file:bg-violet-50 file:text-violet-700 hover:file:bg-violet-100" />
                    {avatarPreview && <Image src={avatarPreview} alt="Avatar preview" width={80} height={80} className="mt-4 rounded-full border" unoptimized />}
                </div>
                {/* Role & Status */}
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                    <div>
                        <label className="block text-sm font-medium mb-1">Vai trò</label>
                        <select name="role" value={form.role} onChange={handleChange} className="w-full h-11 px-4 rounded-lg bg-gray-50 border border-gray-300">
                            <option value="customer">Customer</option>
                            <option value="admin">Admin</option>
                        </select>
                    </div>
                    <div>
                        <label className="block text-sm font-medium mb-1">Trạng thái</label>
                        <select name="status" value={form.status} onChange={handleChange} className="w-full h-11 px-4 rounded-lg bg-gray-50 border border-gray-300">
                            <option value={1}>Hoạt động</option>
                            <option value={0}>Bị khóa</option>
                        </select>
                    </div>
                </div>
            </div>
        </form>
    );
}

