'use client'

import React, { useEffect, useMemo, useState } from 'react'
import Link from 'next/link'
import Image from 'next/image';
import { useRouter, useParams } from 'next/navigation'

const API_BASE = process.env.NEXT_PUBLIC_API_BASE_URL

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
    const params = useParams();
    const categoryId = params.id;
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
    const [allCategories, setAllCategories] = useState([]);
    const [form, setForm] = useState({
        name: '',
        slug: '',
        parent_id: 0,
        description: '',
        sort_order: 1,
        status: 1,
    });

    const [imageFile, setImageFile] = useState(null);
    const [imagePreview, setImagePreview] = useState(null);
    const [initialImageUrl, setInitialImageUrl] = useState(null);

    useEffect(() => {
        if (!categoryId || authLoading) return; // Wait for auth check

        const fetchData = async () => {
            setState(s => ({ ...s, loading: true, error: null }));
            try {
                const [categoryRes, allCategoriesRes] = await Promise.all([
                    fetch(`${API_BASE}/category/${categoryId}`),
                    fetch(`${API_BASE}/category`)
                ]);

                if (!categoryRes.ok) {
                    if (categoryRes.status === 404) throw new Error(`Không tìm thấy danh mục với ID ${categoryId}.`);
                    throw new Error(`Lỗi tải danh mục: HTTP ${categoryRes.status}`);
                }
                if (!allCategoriesRes.ok) throw new Error('Lỗi khi tải danh sách danh mục.');

                const categoryData = await categoryRes.json();
                const allCategoriesData = await allCategoriesRes.json();

                setForm({
                    name: categoryData.name || '',
                    slug: categoryData.slug || '',
                    parent_id: categoryData.parent_id || 0,
                    description: categoryData.description || '',
                    sort_order: Number(categoryData.sort_order) || 1,
                    status: categoryData.status ?? 1,
                });
                setInitialImageUrl(categoryData.image || null);

                setAllCategories(Array.isArray(allCategoriesData) ? allCategoriesData : []);

            } catch (e) {
                setState(s => ({ ...s, error: e.message }));
            } finally {
                setState(s => ({ ...s, loading: false }));
            }
        };
        fetchData();
    }, [categoryId, authLoading]);

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
        fd.append('perfix', "categories");

        const res = await fetch(`${API_BASE}/upload`, { method: 'POST', body: fd });
        if (!res.ok) {
            const t = await res.text().catch(() => '');
            throw new Error(t || `Upload ảnh thất bại (${res.status})`);
        }
        return (await res.json());
    };

    const siblings = useMemo(() => {
        return allCategories
            .filter(c => Number(c.parent_id) === Number(form.parent_id) && c.id !== Number(categoryId))
            .sort((a, b) => (Number(a.sort_order ?? 0)) - (Number(b.sort_order ?? 0)));
    }, [allCategories, form.parent_id, categoryId]);

    const effectiveSortOrder = useMemo(() => {
        return Number.isFinite(form.sort_order) && form.sort_order >= 1 ? Number(form.sort_order) : (siblings.length + 1);
    }, [form.sort_order, siblings.length]);

    const handleFormChange = (e) => {
        const { name, value } = e.target;
        setForm(prev => ({ ...prev, [name]: value }));

        if (name === 'name') {
            setForm(prev => ({ ...prev, slug: createSlug(value) }));
        }
        if (name === 'parent_id') {
            const newSiblings = allCategories.filter(c => Number(c.parent_id) === Number(value) && c.id !== Number(categoryId));
            setForm(prev => ({ ...prev, sort_order: undefined })); 
        }
    };

    const handleSubmit = async (e) => {
        e.preventDefault();

        if (!user) {
            alert('Không thể xác định người dùng. Vui lòng đăng nhập lại.');
            router.push('/admin/login');
            return;
        }

        if (!form.name.trim()) {
            alert('Vui lòng nhập Tên danh mục.');
            return;
        }

        setState(s => ({ ...s, submitting: true, error: null }));
        try {
            let finalImageUrl = initialImageUrl;

            if (imageFile) {
                const uploadData = await uploadSingleToLaravel(imageFile);
                finalImageUrl = uploadData.url;
            }

            const payload = {
                name: form.name.trim(),
                slug: form.slug.trim(),
                parent_id: Number(form.parent_id),
                sort_order: Number(effectiveSortOrder) || 1,
                description: form.description.trim(),
                status: Number(form.status),
                image: finalImageUrl,
                updated_by: user.id,
            };

            const res = await fetch(`${API_BASE}/category/${categoryId}`, {
                method: 'PUT',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify(payload),
            });

            if (!res.ok) {
                const errorData = await res.json().catch(() => ({}));
                throw new Error(errorData.message || `HTTP ${res.status}`);
            }

            alert('Cập nhật danh mục thành công!');
            router.push('/admin/category');

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

    if (state.loading) return <div className="p-8 text-center animate-pulse">Đang tải dữ liệu danh mục...</div>;


    return (
        <form onSubmit={handleSubmit} className="space-y-8">
            <div className="flex items-center justify-between">
                <h1 className="text-2xl font-bold text-gray-900">Chỉnh sửa Danh mục</h1>
                <div className="flex gap-3">
                    <Link href="/admin/category" className="px-4 py-2 bg-gray-200 hover:bg-gray-300 text-gray-800 text-sm font-medium rounded-lg">
                        Hủy
                    </Link>
                    <button type="submit" disabled={state.submitting} className="px-4 py-2 bg-indigo-600 text-white rounded-lg disabled:opacity-60">
                        {state.submitting ? 'Đang lưu...' : 'Cập nhật Danh mục'}
                    </button>
                </div>
            </div>

            <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
                <div className="lg:col-span-2 space-y-8">
                    <div className="bg-white p-6 shadow-sm rounded-lg border">
                        <h3 className="text-lg font-semibold mb-4">Thông tin cơ bản</h3>
                        {state.error && <p className="text-red-500 text-sm mb-4 bg-red-50 p-3 rounded border border-red-200">Lỗi: {state.error}</p>}
                        <div className="space-y-4">
                            <div>
                                <label className="block text-sm font-medium mb-1">Tên Danh mục <span className="text-red-500">*</span></label>
                                <input name="name" type="text" required value={form.name} onChange={handleFormChange} className="w-full h-12 px-4 rounded-lg bg-gray-50 border border-gray-300" />
                                {form.slug && <p className="text-xs text-gray-500 mt-1">Slug: {form.slug}</p>}
                            </div>
                            <div>
                                <label className="block text-sm font-medium mb-1">Mô tả</label>
                                <textarea name="description" value={form.description} onChange={handleFormChange} rows={4} className="w-full p-4 rounded-lg bg-gray-50 border border-gray-300" />
                            </div>
                        </div>
                    </div>
                </div>

                <div className="lg:col-span-1 space-y-8">
                    <div className="bg-white p-6 shadow-sm rounded-lg border">
                        <h3 className="text-lg font-semibold mb-4">Tổ chức</h3>
                        <div className="space-y-4">
                            <div>
                                <label className="block text-sm font-medium mb-1">Danh mục cha</label>
                                <select name="parent_id" value={form.parent_id} onChange={handleFormChange} className="w-full h-12 px-4 rounded-lg bg-gray-50 border border-gray-300">
                                    <option value={0}>— Là danh mục gốc —</option>
                                    {allCategories.filter(c => c.parent_id === 0 && c.id !== Number(categoryId)).map((cat) => (
                                        <option key={cat.id} value={cat.id} className="font-bold">{cat.name}</option>
                                    ))}
                                </select>
                            </div>
                            <div>
                                <label className="block text-sm font-medium mb-1">Thứ tự</label>
                                <select name="sort_order" value={effectiveSortOrder} onChange={handleFormChange} className="w-full h-12 px-4 rounded-lg bg-gray-50 border border-gray-300">
                                    <option value={1}>Đầu tiên</option>
                                    {siblings.map((c) => (
                                        <option key={c.id} value={(Number(c.sort_order ?? 0) + 1)}>
                                            Sau: {c.name}
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
                    </div>

                    <div className="bg-white p-6 shadow-sm rounded-lg border">
                        <h3 className="text-lg font-semibold mb-4">Ảnh đại diện (Tùy chọn)</h3>
                        <input type="file" accept="image/*" onChange={(e) => setImageFile(e.target.files?.[0] || null)} className="w-full text-sm text-slate-500 file:mr-4 file:py-2 file:px-4 file:rounded-full file:border-0 file:text-sm file:font-semibold file:bg-violet-50 file:text-violet-700 hover:file:bg-violet-100" />
                        {(imagePreview || initialImageUrl) && (
                            <div className="mt-4">
                                <Image src={imagePreview || initialImageUrl || ''} alt="Preview" width={120} height={120} className="rounded border border-gray-300 object-cover" unoptimized />
                            </div>
                        )}
                        {(!imagePreview && !initialImageUrl) && (
                            <p className="text-sm text-gray-500 mt-2">Chưa có ảnh đại diện.</p>
                        )}
                    </div>
                </div>
            </div>
        </form>
    );
}
