'use client'

import React, { useEffect, useState, useMemo } from 'react'
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


    const [allSocialIcons, setAllSocialIcons] = useState([]);
    const [state, setState] = useState({ loading: true, submitting: false, error: null });

    const [form, setForm] = useState({
        title: '',
        social_id: '',
        username: '',
        status: 1,
    });

    // Fetch initial data (social link and icons)
    useEffect(() => {
        if (!id || authLoading) return; // Wait for ID and auth check

        const fetchData = async () => {
            setState(s => ({ ...s, loading: true, error: null })); // Start loading data
            try {
                const [socialRes, iconsRes] = await Promise.all([
                    fetch(`${API_BASE}/social/${id}`),
                    fetch(`${API_BASE}/social-icon`)
                ]);

                if (socialRes.status === 404) throw new Error("Không tìm thấy liên kết này.");
                if (!socialRes.ok) throw new Error(`Lỗi tải dữ liệu liên kết (HTTP ${socialRes.status})`);
                if (!iconsRes.ok) throw new Error("Lỗi tải danh sách loại MXH."); // Check icons response


                const socialJson = await socialRes.json();
                const iconsJson = await iconsRes.json();

                setAllSocialIcons(Array.isArray(iconsJson) ? iconsJson : []);
                setForm({
                    title: socialJson.title || '',
                    social_id: String(socialJson.social_id || ''), // Ensure string
                    username: socialJson.username || '',
                    status: socialJson.status ?? 1, // Use ?? for default
                });

            } catch (e) {
                setState(s => ({ ...s, error: e.message }));
            } finally {
                setState(s => ({ ...s, loading: false })); // End loading data
            }
        };
        fetchData();
    }, [id, authLoading]); // Trigger after auth check

    const selectedSocial = useMemo(() => {
        if (!form.social_id) return null;
        return allSocialIcons.find(s => String(s.id) === String(form.social_id)); // Compare strings
    }, [form.social_id, allSocialIcons]);

    const handleFormChange = (e) => {
        const { name, value } = e.target;
        // Ensure status is number
        setForm(prev => ({ ...prev, [name]: name === 'status' ? Number(value) : value }));
    };

    const handleSubmit = async (e) => {
        e.preventDefault();
        if (!user) {
            alert('Không thể xác định người dùng. Vui lòng đăng nhập lại.');
            router.push('/admin/login');
            return;
        }

        if (!form.title || !form.social_id || !form.username) {
            return alert("Vui lòng điền đầy đủ các trường bắt buộc.");
        }

        setState(s => ({ ...s, submitting: true, error: null }));
        try {
            const payload = {
                title: form.title.trim(),
                social_id: Number(form.social_id),
                username: form.username.trim(),
                status: Number(form.status),
                // updated_at handled by backend
                updated_by: user.id,
            };

            const res = await fetch(`${API_BASE}/social/${id}`, {
                method: 'PUT',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify(payload),
            });

            if (!res.ok) {
                const errorData = await res.json().catch(() => ({}));
                throw new Error(errorData.message || "Cập nhật thất bại.");
            }

            alert('Cập nhật liên kết thành công!');
            router.push('/admin/social');

        } catch (err) {
            console.error(err);
            setState(s => ({ ...s, submitting: false, error: err.message || 'Thao tác thất bại' }));
        }
        // Removed finally block
    };

    if (authLoading) return <div className="p-8 text-center animate-pulse">Đang xác thực...</div>;

    if (state.loading) return <div className="p-8 text-center animate-pulse">Đang tải...</div>;
    // Removed error check here, handled in form

    return (
        <div className="bg-white p-6 md:p-8 shadow-sm rounded-lg border max-w-2xl mx-auto">
            <h1 className="text-2xl font-bold text-gray-900 mb-6">Cập nhật Liên kết Mạng xã hội</h1>
            {state.error && <p className="text-red-500 text-sm mb-4 bg-red-50 p-3 rounded border border-red-200">Lỗi: {state.error}</p>}
            <form onSubmit={handleSubmit} className="space-y-6">
                <div>
                    <label htmlFor="social_id" className="block text-sm font-medium text-gray-700 mb-1">Loại mạng xã hội <span className="text-red-500">*</span></label>
                    <select id="social_id" name="social_id" value={form.social_id} onChange={handleFormChange} required className="w-full h-12 px-4 rounded-lg bg-gray-50 border border-gray-300">
                        <option value="" disabled>— Chọn một mạng xã hội —</option>
                        {allSocialIcons.map(icon => (
                            <option key={icon.id} value={icon.id}>{icon.name}</option>
                        ))}
                    </select>
                </div>

                <div>
                    <label htmlFor="title" className="block text-sm font-medium text-gray-700 mb-1">Tên hiển thị <span className="text-red-500">*</span></label>
                    <input type="text" id="title" name="title" value={form.title} onChange={handleFormChange} required className="w-full h-12 px-4 rounded-lg bg-gray-50 border border-gray-300" placeholder="VD: Fanpage Facebook của Shop" />
                </div>

                <div>
                    <label htmlFor="username" className="block text-sm font-medium text-gray-700 mb-1">Username / ID <span className="text-red-500">*</span></label>
                    <div className="flex items-center">
                        {selectedSocial?.link && <span className="h-12 flex items-center px-3 bg-gray-200 text-gray-600 border border-r-0 border-gray-300 rounded-l-lg whitespace-nowrap">{selectedSocial.link}</span>}
                        <input
                            type="text"
                            id="username"
                            name="username"
                            value={form.username}
                            onChange={handleFormChange}
                            required className={`w-full h-12 px-4 border border-gray-300 ${selectedSocial?.link ? 'rounded-r-lg' : 'rounded-lg'}`}
                            placeholder="myshop.fb" />
                    </div>
                    {selectedSocial?.link && form.username && (
                        <p className="text-xs text-gray-500 mt-1">
                            Xem trước: <a href={`${selectedSocial.link.endsWith('/') ? selectedSocial.link : selectedSocial.link + '/'}${form.username}`} target="_blank" rel="noopener noreferrer" className="text-blue-600 hover:underline">{`${selectedSocial.link.endsWith('/') ? selectedSocial.link : selectedSocial.link + '/'}${form.username}`}</a>
                        </p>
                    )}
                </div>

                <div>
                    <label htmlFor="status" className="block text-sm font-medium text-gray-700 mb-1">Trạng thái</label>
                    <select id="status" name="status" value={form.status} onChange={handleFormChange} className="w-full h-12 px-4 rounded-lg bg-gray-50 border border-gray-300">
                        <option value={1}>Hiển thị</option>
                        <option value={0}>Tạm ẩn</option>
                    </select>
                </div>

                <div className="flex justify-end gap-3 border-t pt-6">
                    <Link href="/admin/social" className="px-4 py-2.5 bg-gray-200 hover:bg-gray-300 text-gray-800 text-sm font-medium rounded-lg">Hủy</Link>
                    <button type="submit" disabled={state.submitting} className="px-4 py-2.5 bg-indigo-600 text-white rounded-lg disabled:opacity-60 disabled:cursor-not-allowed">
                        {state.submitting ? 'Đang lưu...' : 'Lưu thay đổi'}
                    </button>
                </div>
            </form>
        </div>
    );
}
