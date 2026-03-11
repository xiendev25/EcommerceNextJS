'use client'

import React, { useEffect, useState } from 'react'
import Link from 'next/link'
import { useParams, useRouter } from "next/navigation";

const API_BASE = process.env.NEXT_PUBLIC_API_BASE_URL;

export default function Page() {
    const { id } = useParams();
    const router = useRouter();

    const [user, setUser] = useState(null); // Admin user state
    const [authLoading, setAuthLoading] = useState(true); // Auth loading state

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


    const [state, setState] = useState({ loading: true, submitting: false, error: null });
    const [form, setForm] = useState({ name: '', link: '', icon: '' });

    useEffect(() => {
        if (!id || authLoading) return; // Wait for ID and auth check

        const fetchData = async () => {
            setState(s => ({ ...s, loading: true, error: null })); // Start data loading
            try {
                const res = await fetch(`${API_BASE}/social-icon/${id}`);
                if (res.status === 404) throw new Error("Không tìm thấy icon.");
                if (!res.ok) throw new Error("Lỗi khi tải dữ liệu.");
                const json = await res.json();
                setForm({
                    name: json.name || '',
                    link: json.link || '',
                    icon: json.icon || '',
                });
            } catch (e) {
                setState(s => ({ ...s, error: e.message }));
            } finally {
                setState(s => ({ ...s, loading: false })); // End data loading
            }
        };
        fetchData();
    }, [id, authLoading]); // Add authLoading dependency

    const handleFormChange = (e) => {
        const { name, value } = e.target;
        setForm(prev => ({ ...prev, [name]: value }));
    };

    const handleSubmit = async (e) => {
        e.preventDefault();
        if (!user) {
            alert('Không thể xác định người dùng. Vui lòng đăng nhập lại.');
            router.push('/admin/login');
            return;
        }

        if (!form.name || !form.link || !form.icon) {
            return alert("Vui lòng điền đầy đủ thông tin.");
        }
        setState(s => ({ ...s, submitting: true, error: null }));
        try {
            // Adjust payload if updated_by is needed
            const payload = {
                name: form.name.trim(),
                link: form.link.trim(),
                icon: form.icon.trim(),
                // updated_by: user.id, // Uncomment if API requires this
            };

            const res = await fetch(`${API_BASE}/social-icon/${id}`, {
                method: 'PUT',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify(payload),
            });
            if (!res.ok) {
                const errorData = await res.json().catch(() => ({}));
                throw new Error(errorData.message || "Cập nhật thất bại.");
            }
            alert('Cập nhật icon thành công!');
            router.push('/admin/social_icon');
        } catch (err) {
            setState(s => ({ ...s, submitting: false, error: err.message || 'Thao tác thất bại' }));
        }
    };

    if (authLoading) {
        return <div className="p-8 text-center animate-pulse">Đang xác thực quyền truy cập...</div>;
    }

    if (state.loading) return <div className="p-8 text-center animate-pulse">Đang tải...</div>;


    return (
        <div className="bg-white p-6 md:p-8 shadow-sm rounded-lg border max-w-2xl mx-auto">
            <h1 className="text-2xl font-bold text-gray-900 mb-6">Cập nhật Icon Mạng xã hội</h1>
            {state.error && <p className="text-red-500 text-sm mb-4 bg-red-50 p-3 rounded border border-red-200">Lỗi: {state.error}</p>}
            <form onSubmit={handleSubmit} className="space-y-6">
                <div>
                    <label htmlFor="name" className="block text-sm font-medium text-gray-700 mb-1">Tên Mạng xã hội <span className="text-red-500">*</span></label>
                    <input type="text" id="name" name="name" value={form.name} onChange={handleFormChange} required className="w-full h-12 px-4 rounded-lg bg-gray-50 border border-gray-300" placeholder="VD: Facebook" />
                </div>
                <div>
                    <label htmlFor="link" className="block text-sm font-medium text-gray-700 mb-1">Link gốc <span className="text-red-500">*</span></label>
                    <input type="text" id="link" name="link" value={form.link} onChange={handleFormChange} required className="w-full h-12 px-4 rounded-lg bg-gray-50 border border-gray-300" placeholder="VD: https://facebook.com/" />
                </div>
                <div>
                    <label htmlFor="icon" className="block text-sm font-medium text-gray-700 mb-1">Class Icon (Font Awesome) <span className="text-red-500">*</span></label>
                    <input type="text" id="icon" name="icon" value={form.icon} onChange={handleFormChange} required className="w-full h-12 px-4 rounded-lg bg-gray-50 border border-gray-300" placeholder="VD: fab fa-facebook-f hoặc fas fa-envelope" />
                    <p className="text-xs text-gray-500 mt-1">Tìm class tại <a href="https://fontawesome.com/search?o=r&m=free" target="_blank" rel="noopener noreferrer" className="text-blue-600 hover:underline">Font Awesome</a> (chỉ dùng icon Free).</p>
                </div>

                <div className="flex justify-end gap-3 border-t pt-6">
                    <Link href="/admin/social_icon" className="px-4 py-2.5 bg-gray-200 hover:bg-gray-300 text-gray-800 text-sm font-medium rounded-lg">Hủy</Link>
                    <button type="submit" disabled={state.submitting} className="px-4 py-2.5 bg-indigo-600 text-white rounded-lg disabled:opacity-60 disabled:cursor-not-allowed">
                        {state.submitting ? 'Đang lưu...' : 'Lưu thay đổi'}
                    </button>
                </div>
            </form>
        </div>
    );
}
