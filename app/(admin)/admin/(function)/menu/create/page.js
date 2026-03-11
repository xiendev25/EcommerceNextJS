'use client'
import Link from 'next/link'
import React, { useState, useEffect, useMemo } from 'react'
import { useRouter } from 'next/navigation'

const API_BASE = process.env.NEXT_PUBLIC_API_BASE_URL

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


    const [menuData, setMenuData] = useState([])
    const [state, setState] = useState({ submitting: false, error: null, loadingList: true })

    const [form, setForm] = useState({
        name: '',
        link: '',
        type: 'navbar',
        parent_id: 0,
        sort_order: undefined,
        status: 1,
    })


    useEffect(() => {
        if (authLoading) return;

        const fetchMenuList = async () => {
            setState(s => ({ ...s, loadingList: true }));
            try {
                const res = await fetch(`${API_BASE}/menu`)
                if (!res.ok) throw new Error(`Menu HTTP ${res.status}`)
                const json = await res.json()
                const menuList = Array.isArray(json) ? json : [];
                setMenuData(menuList);
                const initialSiblings = menuList.filter(m => Number(m.parent_id) === Number(form.parent_id) && String(m.type) === String(form.type));
                setForm(prev => ({ ...prev, sort_order: initialSiblings.length + 1 }));

            } catch (e) {
                console.error("Lỗi tải danh sách menu:", e)
                setState(s => ({ ...s, error: e.message || 'Không tải được danh sách menu' }));
            } finally {
                setState(s => ({ ...s, loadingList: false }));
            }
        };
        fetchMenuList();
    }, [authLoading])

    const siblings = useMemo(() => {
        return menuData
            .filter(m => Number(m.parent_id) === Number(form.parent_id) && String(m.type) === String(form.type))
            .sort((a, b) => (Number(a.sort_order ?? 0)) - (Number(b.sort_order ?? 0)))
    }, [menuData, form.parent_id, form.type]);

    const effectiveSortOrder = useMemo(() => {
        return Number.isFinite(form.sort_order) && form.sort_order >= 1 ? Number(form.sort_order) : (siblings.length + 1);
    }, [form.sort_order, siblings.length]);

    const handleFormChange = (e) => {
        const { name, value } = e.target;
        setForm(prev => ({ ...prev, [name]: value }));
        if (name === 'parent_id' || name === 'type') {
            const newParentId = name === 'parent_id' ? Number(value) : Number(form.parent_id);
            const newType = name === 'type' ? value : form.type;
            const newSiblings = menuData.filter(m => Number(m.parent_id) === newParentId && String(m.type) === newType);
            setForm(prev => ({ ...prev, sort_order: newSiblings.length + 1 }));
            if (name === 'type') {
                setForm(prev => ({ ...prev, parent_id: 0 }));
            }
        }
    };


    const handleSubmit = async (e) => {
        e.preventDefault()

        if (!user) {
            alert('Không thể xác định người dùng. Vui lòng đăng nhập lại.');
            router.push('/admin/login');
            return;
        }

        if (!form.name.trim()) return setState(s => ({ ...s, error: 'Vui lòng nhập Tên menu.' }));
        if (!form.link.trim()) return setState(s => ({ ...s, error: 'Vui lòng nhập Liên kết.' }));

        setState(s => ({ ...s, submitting: true, error: null }))
        try {
            const payload = {
                name: form.name.trim(),
                link: form.link.trim(),
                type: form.type,
                parent_id: Number(form.parent_id) || 0,
                sort_order: Number(effectiveSortOrder) || 1,
                status: Number(form.status) ?? 0,
                created_at: new Date().toISOString(),
                created_by: user.id,
            }

            const res = await fetch(`${API_BASE}/menu`, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify(payload),
            })
            if (!res.ok) {
                const errorData = await res.json().catch(() => ({}));
                throw new Error(errorData.message || `HTTP ${res.status}`);
            }

            alert('Tạo menu thành công!')
            router.push('/admin/menu')

        } catch (err) {
            setState(s => ({ ...s, submitting: false, error: err.message || 'Gửi thất bại' }))
        }
    }

    if (authLoading) {
        return <div className="p-8 text-center animate-pulse">Đang xác thực quyền truy cập...</div>;
    }

    if (state.loadingList) return <div className="p-8 text-center animate-pulse">Đang tải dữ liệu cần thiết...</div>;

    return (
        <div className="bg-white dark:bg-slate-800 shadow-xl rounded-2xl border border-gray-200 dark:border-slate-700">
            <div className="p-6 md:p-8 border-b border-gray-200 dark:border-slate-700">
                <h6 className="text-xl text-gray-800 dark:text-white font-bold">Thêm Menu mới</h6>
                <p className="text-sm text-gray-500 dark:text-slate-400 mt-1">Nhập thông tin chi tiết của Menu.</p>
            </div>

            <form className="p-6 md:p-8" onSubmit={handleSubmit}>
                {state.error && <p className="text-red-600 mb-4 text-sm text-center bg-red-50 p-3 rounded border border-red-200">{state.error}</p>}
                <div className="space-y-6 mb-3">
                    <div>
                        <label className="block text-sm font-medium mb-2 text-gray-700 dark:text-slate-300">
                            Tên Menu <span className="text-red-500 ml-1">*</span>
                        </label>
                        <div className="relative">
                            <input
                                type="text"
                                required
                                value={form.name}
                                onChange={handleFormChange}
                                name="name"
                                className="w-full h-12 pl-4 pr-4 rounded-lg bg-gray-100 dark:bg-slate-700/50 border border-gray-300 dark:border-slate-600 focus:ring-2 focus:ring-indigo-500 transition-all"
                            />
                        </div>
                    </div>
                </div>

                <div className="space-y-6 mb-3">
                    <div>
                        <label className="block text-sm font-medium mb-2 text-gray-700 dark:text-slate-300">
                            Liên kết <span className="text-red-500 ml-1">*</span>
                        </label>
                        <div className="relative">
                            <input
                                type="text"
                                required
                                value={form.link}
                                onChange={handleFormChange}
                                name="link"
                                className="w-full h-12 pl-4 pr-4 rounded-lg bg-gray-100 dark:bg-slate-700/50 border border-gray-300 dark:border-slate-600 focus:ring-2 focus:ring-indigo-500 transition-all"
                            />
                        </div>
                    </div>
                </div>

                <div className="grid md:grid-cols-2 gap-6 mb-3">
                    <div>
                        <label className="block text-sm font-medium mb-2 text-gray-700 dark:text-slate-300">
                            Loại <span className="text-red-500 ml-1">*</span>
                        </label>
                        <select
                            value={form.type}
                            onChange={handleFormChange}
                            name="type"
                            className="w-full h-12 px-4 rounded-lg bg-gray-100 dark:bg-slate-700/50 border border-gray-300 dark:border-slate-600 focus:ring-2 focus:ring-indigo-500"
                        >
                            <option value="navbar">Navbar</option>
                            <option value="footer1">Footer 1</option>
                            <option value="footer2">Footer 2</option>
                        </select>
                    </div>

                    <div>
                        <label className="block text-sm font-medium mb-2 text-gray-700 dark:text-slate-300">
                            Thư mục cha
                        </label>
                        <select
                            value={form.parent_id}
                            onChange={handleFormChange}
                            name="parent_id"
                            className="w-full h-12 px-4 rounded-lg bg-gray-100 dark:bg-slate-700/50 border border-gray-300 dark:border-slate-600 focus:ring-2 focus:ring-indigo-500"
                        >
                            <option value={0}>— Không có —</option>
                            {menuData
                                .filter(menu => Number(menu.parent_id) === 0 && String(menu.type) === String(form.type))
                                .sort((a, b) => (Number(a.sort_order ?? 0)) - (Number(b.sort_order ?? 0)))
                                .map(menu => (
                                    <option key={menu.id} value={menu.id}>{menu.name}</option>
                                ))}
                        </select>
                    </div>
                </div>

                <div className="grid md:grid-cols-2 gap-6 mb-3">
                    <div>
                        <label className="block text-sm font-medium mb-2 text-gray-700 dark:text-slate-300">
                            Thứ tự
                        </label>
                        <select
                            value={effectiveSortOrder}
                            onChange={handleFormChange}
                            name="sort_order"
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
                            onChange={handleFormChange}
                            name="status"
                            className="w-full h-12 px-4 rounded-lg bg-gray-100 dark:bg-slate-700/50 border border-gray-300 dark:border-slate-600 focus:ring-2 focus:ring-indigo-500"
                        >
                            <option value={1}>Hoạt động</option>
                            <option value={0}>Tạm ẩn</option>
                        </select>
                    </div>
                </div>

                <div className="flex justify-end gap-x-4 mt-8 border-t border-gray-200 dark:border-slate-700 pt-6">
                    <Link href="/admin/menu"
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
