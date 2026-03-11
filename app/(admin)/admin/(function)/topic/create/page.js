'use client'
import Link from 'next/link'
import React, { useState, useEffect, useMemo } from 'react'
import { useRouter } from 'next/navigation'

const API_BASE = process.env.NEXT_PUBLIC_API_BASE_URL

const createSlug = (str) => {
    return str
        .toLowerCase()
        .normalize("NFD")
        .replace(/[\u0300-\u036f]/g, "")
        .replace(/đ/g, "d")
        .replace(/[^a-z0-9\s-]/g, "")
        .trim()
        .replace(/\s+/g, "-")
        .replace(/-+/g, "-");
}

export default function Page() {
    const [user, setUser] = useState(null);
    const router = useRouter();
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
                    localStorage.removeItem('user');
                    router.replace('/admin/login');
                    return;
                }
                const adminData = await res.json();
                setUser(adminData);
            } catch (e) {
                console.error("Lỗi xác thực:", e);
                localStorage.removeItem('token');
                localStorage.removeItem('user');
                router.replace('/admin/login');
            } finally {
                setAuthLoading(false);
            }
        };
        verifyAdmin();
    }, [router]);

    const [topicData, setTopicData] = useState([])
    const [state, setState] = useState({ submitting: false, error: null })

    const [form, setForm] = useState({
        name: '',
        description: '',
        sort_order: 1,
        status: 1,
    })

    useEffect(() => {
        if (authLoading) return; // Wait for auth check

        (async () => {
            try {
                const res = await fetch(`${API_BASE}/topic`)
                if (!res.ok) throw new Error(`Topic HTTP ${res.status}`)
                const json = await res.json()
                setTopicData(Array.isArray(json) ? json : [])
            } catch (e) {
                console.error("Error fetching topic list:", e)
                setState(s => ({ ...s, error: e.message || 'Không tải được danh sách chủ đề' }));
            }
        })()
    }, [authLoading]) // Add authLoading dependency

    const siblings = useMemo(() => {
        return topicData
            .sort((a, b) => (Number(a.sort_order ?? 0)) - (Number(b.sort_order ?? 0)));
    }, [topicData]);

    const effectiveSortOrder = useMemo(() => {
        return Number.isFinite(form.sort_order) && form.sort_order >= 1 ? Number(form.sort_order) : (siblings.length + 1);
    }, [form.sort_order, siblings.length]);


    const handleSubmit = async (e) => {
        e.preventDefault();

        if (!user) {
            alert('Không thể xác định người dùng. Vui lòng đăng nhập lại.');
            router.push('/admin/login');
            return;
        }

        if (!form.name.trim()) return setState(s => ({ ...s, error: "Vui lòng nhập Tên topic." }));
        if (!form.description.trim()) return setState(s => ({ ...s, error: "Vui lòng nhập Mô tả." }));

        setState(s => ({ ...s, submitting: true, error: null }));
        try {
            const payload = {
                name: form.name.trim(),
                slug: createSlug(form.name.trim()),
                description: form.description.trim(),
                sort_order: Number(effectiveSortOrder) || 1,
                status: Number(form.status) ?? 0,
                // created_at handled by backend
                created_by: user.id,
            }

            const res = await fetch(`${API_BASE}/topic`, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify(payload),
            })
            if (!res.ok) {
                const errorData = await res.json().catch(() => ({}));
                throw new Error(errorData.message || `HTTP ${res.status}`);
            }

            alert('Tạo topic thành công!')
            router.push('/admin/topic')

        } catch (err) {
            setState(s => ({ ...s, submitting: false, error: err.message || "Gửi thất bại" }));
        }
    }

    if (authLoading) return <div className="p-8 text-center animate-pulse">Đang xác thực quyền truy cập...</div>;

    return (
        <div className="bg-white dark:bg-slate-800 shadow-xl rounded-2xl border border-gray-200 dark:border-slate-700">
            <div className="p-6 md:p-8 border-b border-gray-200 dark:border-slate-700">
                <h6 className="text-xl text-gray-800 dark:text-white font-bold">Thêm Topic mới</h6>
                <p className="text-sm text-gray-500 dark:text-slate-400 mt-1">Nhập thông tin chi tiết của Topic.</p>
            </div>
            {state.error && <p className="p-4 m-6 text-center text-red-500 bg-red-50 border border-red-200 rounded-lg">{state.error}</p>}

            <form className="p-6 md:p-8" onSubmit={handleSubmit}>
                <div className="space-y-6 mb-3">
                    <div>
                        <label className="block text-sm font-medium mb-2 text-gray-700 dark:text-slate-300">
                            Tên Topic <span className="text-red-500 ml-1">*</span>
                        </label>
                        <div className="relative">
                            <input
                                type="text"
                                required
                                value={form.name}
                                onChange={(e) => setForm({ ...form, name: e.target.value })}
                                className="w-full h-12 pl-4 pr-4 rounded-lg bg-gray-100 dark:bg-slate-700/50 border border-gray-300 dark:border-slate-600 focus:ring-2 focus:ring-indigo-500 transition-all"
                            />
                        </div>
                    </div>
                </div>

                <div className="space-y-6 mb-3">
                    <div>
                        <label className="block text-sm font-medium mb-2 text-gray-700">
                            Mô tả <span className="text-red-500 ml-1">*</span>
                        </label>
                        <div className="relative">
                            <textarea
                                required
                                value={form.description}
                                onChange={(e) => setForm({ ...form, description: e.target.value })}
                                rows={4}
                                className="w-full p-4 rounded-lg bg-gray-100 dark:bg-slate-700/50 border border-gray-300 dark:border-slate-600 focus:ring-2 focus:ring-indigo-500 transition-all resize-none"
                            />
                        </div>
                    </div>
                </div>

                <div className="grid md:grid-cols-2 gap-6 mb-3">
                    <div>
                        <label className="block text-sm font-medium mb-2 text-gray-700 dark:text-slate-300">
                            Thứ tự
                        </label>
                        <select
                            value={effectiveSortOrder}
                            onChange={(e) => setForm({ ...form, sort_order: Number(e.target.value) })}
                            className="w-full h-12 px-4 rounded-lg bg-gray-100 dark:bg-slate-700/50 border border-gray-300 dark:border-slate-600 focus:ring-2 focus:ring-indigo-500"
                        >
                            <option value={1}>Đầu tiên</option>
                            {siblings.map((m) => (
                                <option key={m.id} value={(Number(m.sort_order ?? 0) + 1)}>
                                    Sau: {m.name}
                                </option>
                            ))}
                            <option value={siblings.length + 1}>Cuối cùng</option>
                        </select>
                    </div>

                    <div>
                        <label className="block text-sm font-medium mb-2 text-gray-700 dark:text-slate-300">Trạng thái</label>
                        <select
                            value={form.status}
                            onChange={(e) => setForm({ ...form, status: Number(e.target.value) })}
                            className="w-full h-12 px-4 rounded-lg bg-gray-100 dark:bg-slate-700/50 border border-gray-300 dark:border-slate-600 focus:ring-2 focus:ring-indigo-500"
                        >
                            <option value={1}>Hoạt động</option>
                            <option value={0}>Tạm ẩn</option>
                        </select>
                    </div>
                </div>

                <div className="flex justify-end gap-x-4 mt-8 border-t border-gray-200 dark:border-slate-700 pt-6">
                    <Link href="/admin/topic"
                        className="px-4 py-2 bg-gray-200 hover:bg-gray-300 dark:bg-slate-700 dark:hover:bg-slate-600 text-gray-800 dark:text-white text-sm font-medium rounded-lg"
                    >
                        Hủy
                    </Link>

                    <button
                        type="submit"
                        disabled={state.submitting}
                        className="px-4 py-2 bg-indigo-600 text-white rounded disabled:opacity-60 disabled:cursor-not-allowed"
                    >
                        {state.submitting ? 'Đang tạo...' : 'Thêm'}
                    </button>
                </div>
            </form>
        </div>
    )
}
