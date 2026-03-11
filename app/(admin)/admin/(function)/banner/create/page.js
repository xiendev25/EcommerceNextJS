'use client';

import React, { useEffect, useMemo, useState } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import Image from 'next/image';

const API_BASE = process.env.NEXT_PUBLIC_API_BASE_URL;

const createSlug = (str) =>
    str
        ? str
            .toLowerCase()
            .normalize('NFD').replace(/[\u0300-\u036f]/g, '')
            .replace(/đ/g, 'd')
            .replace(/[^a-z0-9\s-]/g, '')
            .trim()
            .replace(/\s+/g, '-')
            .replace(/-+/g, '-')
        : '';

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

    const [state, setState] = useState({ loading: true, submitting: false, error: null });
    const [allBanners, setAllBanners] = useState([]);
    const [form, setForm] = useState({
        name: '',
        link: '',
        position: 'slideshow',
        description: '',
        sort_order: undefined,
        status: 1,
    });

    const [imageFile, setImageFile] = useState(null);
    const [imagePreview, setImagePreview] = useState(null);

    useEffect(() => {
        if (authLoading) return;
        const fetchBanners = async () => {
            setState(s => ({ ...s, loading: true, error: null }));
            try {
                const res = await fetch(`${API_BASE}/banner`);
                if (!res.ok) throw new Error('Lỗi khi tải danh sách banners.');
                const json = await res.json();
                const bannerList = Array.isArray(json) ? json : [];
                setAllBanners(bannerList);
                const initialSiblings = bannerList.filter(b => String(b.position) === String(form.position));
                setForm(prev => ({ ...prev, sort_order: initialSiblings.length + 1 }));

            } catch (e) {
                setState(s => ({ ...s, error: e.message }));
            } finally {
                setState(s => ({ ...s, loading: false }));
            }
        };
        fetchBanners();
    }, [authLoading, form.position]);

    useEffect(() => {
        if (imageFile) {
            const url = URL.createObjectURL(imageFile);
            setImagePreview(url);
            return () => URL.revokeObjectURL(url);
        }
        setImagePreview(null);
    }, [imageFile]);

    const uploadSingleToLaravel = async (file) => {
        const fd = new FormData();
        fd.append('image', file);
        fd.append('slug', createSlug(form.name));
        fd.append('perfix', "banners");

        const res = await fetch(`${API_BASE}/upload`, { method: 'POST', body: fd });
        if (!res.ok) {
            const t = await res.text().catch(() => '');
            throw new Error(t || `Upload ảnh thất bại (${res.status})`);
        }
        return (await res.json());
    };

    const siblings = useMemo(() => {
        return allBanners
            .filter(b => String(b.position) === String(form.position))
            .sort((a, b) => (Number(a.sort_order ?? 0)) - (Number(b.sort_order ?? 0)));
    }, [allBanners, form.position]);

    const effectiveSortOrder = useMemo(() => {
        return Number.isFinite(form.sort_order) && form.sort_order >= 1 ? Number(form.sort_order) : (siblings.length + 1);
    }, [form.sort_order, siblings.length]);

    const handleFormChange = (e) => {
        const { name, value } = e.target;
        setForm(prev => ({ ...prev, [name]: value }));
        if (name === 'position') {
            const newSiblings = allBanners.filter(b => String(b.position) === String(value));
            setForm(prev => ({ ...prev, sort_order: newSiblings.length + 1 }));
        }
    };

    const handleSubmit = async (e) => {
        e.preventDefault();

        if (!user) {
            alert('Không thể xác định người dùng. Vui lòng đăng nhập lại.');
            router.push('/admin/login');
            return;
        }

        if (!form.name.trim() || !form.link.trim() || !imageFile) {
            alert('Vui lòng điền đầy đủ Tên, Liên kết và chọn Ảnh.');
            return;
        }

        setState(s => ({ ...s, submitting: true, error: null }));
        try {
            const uploadData = await uploadSingleToLaravel(imageFile);

            const payload = {
                name: form.name.trim(),
                link: form.link.trim(),
                position: form.position,
                sort_order: Number(effectiveSortOrder) || 1,
                description: form.description.trim(),
                status: Number(form.status),
                image: uploadData.url,
                created_by: user.id,
            };

            const res = await fetch(`${API_BASE}/banner`, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify(payload),
            });

            if (!res.ok) {
                const errorData = await res.json().catch(() => ({}));
                throw new Error(errorData.message || `HTTP ${res.status}`);
            }

            alert('Tạo banner mới thành công!');
            router.push('/admin/banner');

        } catch (err) {
            console.error(err);
            setState(s => ({ ...s, error: err.message || 'Thao tác thất bại' }));
        } finally {
            setState(s => ({ ...s, submitting: false }));
        }
    };

    if (authLoading) {
        return <div className="p-8 text-center animate-pulse">Đang xác thực quyền truy cập...</div>;
    }

    if (state.loading) return <div className="p-8 text-center animate-pulse">Đang tải dữ liệu cần thiết...</div>;


    return (
        <form onSubmit={handleSubmit} className="space-y-8">
            <div className="flex items-center justify-between">
                <h1 className="text-2xl font-bold text-gray-900">Thêm Banner mới</h1>
                <div className="flex gap-3">
                    <Link href="/admin/banner" className="px-4 py-2 bg-gray-200 hover:bg-gray-300 text-gray-800 text-sm font-medium rounded-lg">
                        Hủy
                    </Link>
                    <button type="submit" disabled={state.submitting} className="px-4 py-2 bg-indigo-600 text-white rounded-lg disabled:opacity-60">
                        {state.submitting ? 'Đang tạo...' : 'Tạo Banner'}
                    </button>
                </div>
            </div>

            <div className="bg-white p-6 shadow-sm rounded-lg border space-y-6">
                {state.error && <p className="text-red-500 text-sm text-center mb-4 bg-red-50 p-3 rounded border border-red-200">Lỗi: {state.error}</p>}
                <div>
                    <label className="block text-sm font-medium mb-1">Tên Banner <span className="text-red-500">*</span></label>
                    <input name="name" type="text" required value={form.name} onChange={handleFormChange} className="w-full h-12 px-4 rounded-lg bg-gray-50 border border-gray-300" />
                </div>
                <div>
                    <label className="block text-sm font-medium mb-1">Liên kết <span className="text-red-500">*</span></label>
                    <input name="link" type="text" required value={form.link} onChange={handleFormChange} className="w-full h-12 px-4 rounded-lg bg-gray-50 border border-gray-300" placeholder="/san-pham/noi-bat" />
                </div>
                <div>
                    <label className="block text-sm font-medium mb-1">Ảnh <span className="text-red-500">*</span></label>
                    <input type="file" accept="image/*" required onChange={(e) => setImageFile(e.target.files?.[0] || null)} className="w-full text-sm text-slate-500 file:mr-4 file:py-2 file:px-4 file:rounded-full file:border-0 file:text-sm file:font-semibold file:bg-violet-50 file:text-violet-700 hover:file:bg-violet-100" />
                    {imagePreview && (
                        <div className="mt-4">
                            <Image src={imagePreview} alt="Preview" width={300} height={150} className="rounded border border-gray-300 object-contain" unoptimized />
                        </div>
                    )}
                </div>

                <div className="grid md:grid-cols-3 gap-6">
                    <div>
                        <label className="block text-sm font-medium mb-1">Vị trí</label>
                        <select name="position" value={form.position} onChange={handleFormChange} className="w-full h-12 px-4 rounded-lg bg-gray-50 border border-gray-300">
                            <option value="slideshow">Slideshow</option>
                            <option value="sidebar">Sidebar</option>
                            <option value="footer">Footer</option>
                        </select>
                    </div>
                    <div>
                        <label className="block text-sm font-medium mb-1">Thứ tự</label>
                        <select name="sort_order" value={effectiveSortOrder} onChange={handleFormChange} className="w-full h-12 px-4 rounded-lg bg-gray-50 border border-gray-300">
                            <option value={1}>Đầu tiên</option>
                            {siblings.map((b) => (
                                <option key={b.id} value={(Number(b.sort_order ?? 0) + 1)}>
                                    Sau: {b.name}
                                </option>
                            ))}
                            <option value={siblings.length + 1}>Cuối cùng</option>
                        </select>
                    </div>
                    <div>
                        <label className="block text-sm font-medium mb-1">Trạng thái</label>
                        <select name="status" value={form.status} onChange={handleFormChange} className="w-full h-12 px-4 rounded-lg bg-gray-50 border border-gray-300">
                            <option value={1}>Hoạt động</option>
                            <option value={0}>Tạm ẩn</option>
                        </select>
                    </div>
                </div>

                <div>
                    <label className="block text-sm font-medium mb-1">Mô tả</label>
                    <textarea name="description" value={form.description} onChange={handleFormChange} rows={3} className="w-full p-4 rounded-lg bg-gray-50 border border-gray-300" />
                </div>
            </div>

        </form>
    );
}
