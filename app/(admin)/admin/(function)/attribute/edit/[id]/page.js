'use client'

import React, { useEffect, useState } from 'react'
import Link from 'next/link'
import { useParams, useRouter } from "next/navigation";

const API_BASE = process.env.NEXT_PUBLIC_API_BASE_URL;

export default function Page() {
    const { id } = useParams();
    const router = useRouter();

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

    const [state, setState] = useState({ loading: true, submitting: false, error: null });
    const [form, setForm] = useState({ name: '' });

    useEffect(() => {
        if (!id) return;

        if (authLoading) return;

        const fetchData = async () => {
            setState(s => ({ ...s, loading: true, error: null }));
            try {
                const res = await fetch(`${API_BASE}/attribute/${id}`);
                if (res.status === 404) throw new Error("Không tìm thấy thuộc tính.");
                if (!res.ok) throw new Error("Lỗi khi tải dữ liệu.");
                const json = await res.json();
                setForm({ name: json.name || '' });
            } catch (e) {
                setState(s => ({ ...s, error: e.message }));
            } finally {
                setState(s => ({ ...s, loading: false }));
            }
        };
        fetchData();
    }, [id, authLoading]);

    const handleFormChange = (e) => {
        setForm({ name: e.target.value });
    };

    const handleSubmit = async (e) => {
        e.preventDefault();

        if (!user) {
            alert('Không thể xác định người dùng. Vui lòng đăng nhập lại.');
            router.push('/admin/login');
            return;
        }

        if (!form.name.trim()) {
            return alert("Vui lòng nhập tên thuộc tính.");
        }
        setState(s => ({ ...s, submitting: true, error: null }));
        try {
            const payload = {
                name: form.name.trim(),
                updated_by: user.id
            };

            const res = await fetch(`${API_BASE}/attribute/${id}`, {
                method: 'PUT',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify(payload),
            });
            if (!res.ok) {
                const errorData = await res.json().catch(() => ({}));
                throw new Error(errorData.message || "Cập nhật thất bại.");
            }
            alert('Cập nhật thuộc tính thành công!');
            router.push('/admin/attribute');
        } catch (err) {
            setState(s => ({ ...s, submitting: false, error: err.message }));
        }
    };

    if (authLoading) {
        return <div className="p-8 text-center animate-pulse">Đang xác thực quyền truy cập...</div>;
    }

    if (state.loading) return <div className="p-8 text-center animate-pulse">Đang tải thuộc tính...</div>;

    return (
        <div className="bg-white p-6 md:p-8 shadow-sm rounded-lg border max-w-lg mx-auto">
            <h1 className="text-2xl font-bold text-gray-900 mb-6">Cập nhật Thuộc tính</h1>
            {state.error && !state.submitting && <p className="text-red-500 text-sm text-center mb-4">Lỗi tải dữ liệu: {state.error}</p>}
            <form onSubmit={handleSubmit} className="space-y-6">
                <div>
                    <label htmlFor="name" className="block text-sm font-medium text-gray-700 mb-1">Tên thuộc tính <span className="text-red-500">*</span></label>
                    <input type="text" id="name" name="name" value={form.name} onChange={handleFormChange} required className="w-full h-12 px-4 rounded-lg bg-gray-50 border border-gray-300" placeholder="VD: Màu sắc" />
                </div>

                {state.error && state.submitting && <p className="text-red-500 text-sm text-center">Lỗi: {state.error}</p>}

                <div className="flex justify-end gap-3 border-t pt-6">
                    <Link href="/admin/attribute" className="px-4 py-2.5 bg-gray-200 hover:bg-gray-300 text-gray-800 text-sm font-medium rounded-lg">Hủy</Link>
                    <button type="submit" disabled={state.submitting} className="px-4 py-2.5 bg-indigo-600 text-white rounded-lg disabled:opacity-60">
                        {state.submitting ? 'Đang lưu...' : 'Lưu thay đổi'}
                    </button>
                </div>
            </form>
        </div>
    );
}
