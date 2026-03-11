'use client'
import Link from 'next/link'
import { useParams, useRouter } from "next/navigation"
import React, { useState, useEffect, useMemo } from 'react'

const API_BASE = process.env.NEXT_PUBLIC_API_BASE_URL

const createSlug = (str) => {
    if (!str) return ''; // Handle empty input
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
    const { id } = useParams()
    const router = useRouter()

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
                const res = await fetch(`${API_BASE}/verifyAdmin`, { headers: { Authorization: token }, cache: 'no-store' });
                if (!res.ok) {
                    localStorage.removeItem('token');
                    localStorage.removeItem('user');
                    router.replace('/admin/login');
                    return;
                }
                setUser(await res.json());
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

    // Removed topicData state, using form state directly
    const [topicListData, setTopicListData] = useState([]) // For sort order calculation
    const [state, setState] = useState({ loading: true, submitting: false, error: null }) // Combined state

    const [form, setForm] = useState({
        name: '',
        description: '',
        sort_order: 1,
        status: 1,
    })

    // Fetch topic data to edit and list of all topics
    useEffect(() => {
        if (!id || authLoading) return; // Wait for ID and auth check

        const fetchData = async () => {
            setState(s => ({ ...s, loading: true, error: null }));
            try {
                const [topicRes, listRes] = await Promise.all([
                    fetch(`${API_BASE}/topic/${id}`),
                    fetch(`${API_BASE}/topic`) // Fetch all topics for sorting context
                ]);

                if (topicRes.status === 404) {
                    alert("Không tìm thấy topic!")
                    router.push("/admin/topic")
                    return;
                }
                if (!topicRes.ok) throw new Error(`Topic HTTP ${topicRes.status}`);
                if (!listRes.ok) console.error("Could not fetch topic list for sorting."); // Log error but continue

                const topicJson = await topicRes.json();
                const listJson = listRes.ok ? await listRes.json() : [];

                setForm({
                    name: topicJson.name || '',
                    description: topicJson.description || '',
                    sort_order: Number(topicJson.sort_order) || 1,
                    status: Number(topicJson.status) ?? 1,
                });
                setTopicListData(Array.isArray(listJson) ? listJson : []); // Set list data

            } catch (e) {
                console.error(e)
                setState(s => ({ ...s, error: e.message || 'Lỗi tải dữ liệu' }));
            } finally {
                setState(s => ({ ...s, loading: false }));
            }
        };
        fetchData();
    }, [id, router, authLoading]) // Add authLoading dependency

    const siblings = useMemo(() => {
        return topicListData
            .filter(t => String(t.id) !== String(id)) // Exclude current topic
            .sort((a, b) => (Number(a.sort_order ?? 0)) - (Number(b.sort_order ?? 0)));
    }, [topicListData, id]); // Add id dependency

    // Calculate effective sort order based on form value or position among siblings
    const effectiveSortOrder = useMemo(() => {
        // Use form value if valid, otherwise place at the end
        return Number.isFinite(form.sort_order) && form.sort_order >= 1 ? Number(form.sort_order) : (siblings.length + 1);
    }, [form.sort_order, siblings.length]);

    const handleFormChange = (e) => { // Added handler for form inputs
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

        if (!form.name.trim()) return setState(s => ({ ...s, error: "Vui lòng nhập Tên topic." }));
        if (!form.description.trim()) return setState(s => ({ ...s, error: "Vui lòng nhập Mô tả." }));

        setState(s => ({ ...s, submitting: true, error: null }));
        try {
            const payload = {
                name: form.name.trim(),
                slug: createSlug(form.name.trim()),
                description: form.description.trim(),
                sort_order: Number(effectiveSortOrder) || 1, // Use calculated order
                status: Number(form.status) ?? 0,
                // updated_at handled by backend
                updated_by: user.id,
            }

            const res = await fetch(`${API_BASE}/topic/${id}`, {
                method: 'PUT',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify(payload),
            })
            if (!res.ok) {
                const errorData = await res.json().catch(() => ({}));
                throw new Error(errorData.message || `HTTP ${res.status}`);
            }

            alert('Cập nhật thành công!')
            router.push('/admin/topic/show/' + id);

        } catch (err) {
            setState(s => ({ ...s, submitting: false, error: err.message || "Gửi thất bại" }));
        }
    }

    if (authLoading) return <div className="p-8 text-center animate-pulse">Đang xác thực quyền truy cập...</div>;

    if (state.loading) return <div className="p-6 text-sm text-gray-600 animate-pulse text-center">Đang tải dữ liệu topic...</div>;

    return (
        <div className="bg-white dark:bg-slate-800 shadow-xl rounded-2xl border border-gray-200 dark:border-slate-700">
            <div className="p-6 md:p-8 border-b border-gray-200 dark:border-slate-700">
                <h6 className="text-xl text-gray-800 dark:text-white font-bold">Cập nhật Topic #{id}</h6>
                <p className="text-sm text-gray-500 dark:text-slate-400 mt-1">Chỉnh sửa thông tin chi tiết của Topic.</p>
            </div>
            {/* Display error if exists */}
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
                                name="name" // Add name attribute
                                required
                                value={form.name}
                                onChange={handleFormChange} // Use handler
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
                                name="description" // Add name attribute
                                required
                                value={form.description}
                                onChange={handleFormChange} // Use handler
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
                            name="sort_order" // Add name attribute
                            value={effectiveSortOrder} // Use calculated value
                            onChange={handleFormChange} // Use handler
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
                            name="status" // Add name attribute
                            value={form.status}
                            onChange={handleFormChange} // Use handler
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
                        {state.submitting ? 'Đang cập nhật...' : 'Cập nhật'}
                    </button>
                </div>
            </form>
        </div>
    )
}
