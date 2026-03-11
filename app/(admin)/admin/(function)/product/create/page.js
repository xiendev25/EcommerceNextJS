'use client';

import React, { useEffect, useState } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import Image from 'next/image';
import TinyMCE from '../../../../_components/TinyMCE/TinyMCE'; // Adjust path if needed

const API_BASE = process.env.NEXT_PUBLIC_API_BASE_URL;

const createSlug = (str) =>
    str
        ? str
            .toLowerCase()
            .normalize('NFD')
            .replace(/[\u0300-\u036f]/g, '')
            .replace(/đ/g, 'd')
            .replace(/[^a-z0-9\s-]/g, '')
            .trim()
            .replace(/\s+/g, '-')
            .replace(/-+/g, '-')
        : '';

export default function Page() {
    const [user, setUser] = useState(null); // Admin user state
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
    const [allCategories, setAllCategories] = useState([]);
    const [allAttributesList, setAllAttributesList] = useState([]);

    const [form, setForm] = useState({
        name: '',
        slug: '',
        price_root: '',
        qty: '',
        category_id: '',
        price_buy: '',
        description: '',
        content: '',
        status: 1,
    });

    const [attributes, setAttributes] = useState([{ attribute_id: '', value: '' }]);
    const [thumbnailFile, setThumbnailFile] = useState(null);
    const [thumbnailPreview, setThumbnailPreview] = useState(null);
    const [galleryFiles, setGalleryFiles] = useState([]);
    const [galleryPreviews, setGalleryPreviews] = useState([]);

    const uploadSingleToLaravel = async (file) => {
        if (!file) return null;
        const fd = new FormData();
        fd.append('image', file);
        fd.append('slug', createSlug(form.name) || 'product');
        fd.append('perfix', 'products');
        const res = await fetch(`${API_BASE}/upload`, { method: 'POST', body: fd });
        if (!res.ok) {
            const t = await res.text().catch(() => '');
            throw new Error(t || `Upload thumbnail failed (${res.status})`);
        }
        return (await res.json());
    };

    const uploadMultipleToLaravel = async (files) => {
        if (!files || files.length === 0) return { urls: [], paths: [] };
        const fd = new FormData();
        files.forEach((f) => fd.append('images[]', f));
        fd.append('perfix', 'products');
        fd.append('slug', createSlug(form.name) || 'product-gallery');
        const res = await fetch(`${API_BASE}/uploads`, { method: 'POST', body: fd });
        if (!res.ok) {
            const t = await res.text().catch(() => '');
            throw new Error(t || `Upload gallery failed (${res.status})`);
        }
        const data = await res.json();
        return {
            urls: Array.isArray(data.urls) ? data.urls : [],
            paths: Array.isArray(data.paths) ? data.paths : [],
        };
    };


    useEffect(() => {
        if (authLoading) return;

        const fetchData = async () => {
            setState((s) => ({ ...s, loading: true, error: null }));
            try {
                const [categoriesRes, attributesRes] = await Promise.all([
                    fetch(`${API_BASE}/category`),
                    fetch(`${API_BASE}/attribute`),
                ]);
                if (!categoriesRes.ok || !attributesRes.ok) throw new Error('Lỗi khi tải dữ liệu cho form.');
                const categoriesJson = await categoriesRes.json();
                const attributesJson = await attributesRes.json();

                const cats = Array.isArray(categoriesJson) ? categoriesJson : [];
                setAllCategories(cats);
                setAllAttributesList(Array.isArray(attributesJson) ? attributesJson : []);

                if (cats.length > 0 && !form.category_id) {
                    setForm(prev => ({ ...prev, category_id: cats[0].id }));
                }
                if (Array.isArray(attributesJson) && attributesJson.length > 0 && attributes.length === 1 && !attributes[0].attribute_id) {
                    setAttributes([{ attribute_id: attributesJson[0].id, value: '' }]);
                }

            } catch (e) {
                setState((s) => ({ ...s, error: e.message }));
            } finally {
                setState((s) => ({ ...s, loading: false }));
            }
        };
        fetchData();
    }, [authLoading]);

    useEffect(() => {
        if (thumbnailFile) {
            const url = URL.createObjectURL(thumbnailFile);
            setThumbnailPreview(url);
            return () => URL.revokeObjectURL(url);
        }
        setThumbnailPreview(null);
    }, [thumbnailFile]);

    useEffect(() => {
        if (galleryFiles.length > 0) {
            const urls = galleryFiles.map((file) => URL.createObjectURL(file));
            setGalleryPreviews(urls);
            return () => urls.forEach((url) => URL.revokeObjectURL(url));
        }
        setGalleryPreviews([]);
    }, [galleryFiles]);

    const handleFormChange = (e) => {
        const { name, value } = e.target;
        setForm((prev) => ({ ...prev, [name]: value }));
        if (name === 'name') {
            setForm((prev) => ({ ...prev, slug: createSlug(value) }));
        }
    };

    const handleEditorChange = (content) => {
        setForm(prev => ({ ...prev, content: content }));
    };

    const handleAttributeChange = (index, e) => {
        const { name, value } = e.target;
        setAttributes((prev) => {
            const copy = [...prev];
            copy[index] = { ...copy[index], [name]: value };
            return copy;
        });
    };

    const addAttributeRow = () => setAttributes((prev) => [...prev, { attribute_id: '', value: '' }]);
    const removeAttributeRow = (index) => setAttributes((prev) => prev.filter((_, i) => i !== index));

    const handleSubmit = async (e) => {
        e.preventDefault();

        if (!user) {
            alert('Không thể xác định người dùng. Vui lòng đăng nhập lại.');
            router.push('/admin/login');
            return;
        }

        if (!form.name || !form.category_id || !form.price_buy || !form.qty || !form.price_root) {
            alert('Vui lòng điền đầy đủ các trường bắt buộc (*).');
            return;
        }
        if (!thumbnailFile) {
            alert('Vui lòng tải lên ảnh đại diện.');
            return;
        }

        setState((s) => ({ ...s, submitting: true, error: null }));

        try {
            const [thumb, gallery] = await Promise.all([
                uploadSingleToLaravel(thumbnailFile),
                uploadMultipleToLaravel(galleryFiles),
            ]);

            if (!thumb?.url) {
                throw new Error("Upload ảnh đại diện thất bại.");
            }
            const thumbnailUrl = thumb.url;
            const galleryUrls = gallery.urls.map((u) => ({ image: u, status: 1 }));

            const payload = {
                category_id: Number(form.category_id),
                name: form.name.trim(),
                slug: form.slug.trim() || createSlug(form.name.trim()),
                thumbnail: thumbnailUrl,
                content: form.content,
                description: form.description.trim(),
                price_buy: Number(form.price_buy),
                status: Number(form.status),
                created_by: user.id,

                store: {
                    price_root: Number(form.price_root),
                    qty: Number(form.qty),
                    status: Number(form.status),
                    created_by: user.id,
                },

                product_attribute: attributes
                    .filter((attr) => attr.attribute_id && attr.value.trim())
                    .map((x) => ({
                        attribute_id: Number(x.attribute_id),
                        value: String(x.value).trim(),
                    })),

                gallery_images: galleryUrls,
            };

            const createRes = await fetch(`${API_BASE}/product`, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify(payload),
            });

            if (!createRes.ok) {
                let errorData = {};
                try { errorData = await createRes.json(); } catch { }
                throw new Error(errorData.message || errorData.error || 'Tạo sản phẩm thất bại.');
            }

            alert('Tạo sản phẩm mới thành công!');
            router.push('/admin/product');
        } catch (err) {
            console.error(err);
            setState((s) => ({ ...s, submitting: false, error: err.message || 'Unknown error' }));
        }
    };

    if (authLoading) {
        return <div className="p-8 text-center animate-pulse">Đang xác thực quyền truy cập...</div>;
    }

    if (state.loading) return <div className="p-8 text-center animate-pulse">Đang tải dữ liệu cần thiết...</div>;


    return (
        <form onSubmit={handleSubmit} className="space-y-8">
            <div className="flex items-center justify-between">
                <h1 className="text-2xl font-bold text-gray-900">Thêm sản phẩm mới</h1>
                <div className="flex gap-3">
                    <Link
                        href="/admin/product"
                        className="px-4 py-2 bg-gray-200 hover:bg-gray-300 text-gray-800 text-sm font-medium rounded-lg"
                    >
                        Hủy
                    </Link>
                    <button
                        type="submit"
                        disabled={state.submitting}
                        className="px-4 py-2 bg-indigo-600 text-white rounded-lg disabled:opacity-60"
                    >
                        {state.submitting ? 'Đang lưu...' : 'Tạo sản phẩm'}
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
                                <label className="block text-sm font-medium mb-1">
                                    Tên sản phẩm <span className="text-red-500">*</span>
                                </label>
                                <input
                                    name="name"
                                    value={form.name}
                                    onChange={handleFormChange}
                                    required
                                    className="w-full h-12 px-4 rounded-lg bg-gray-50 border border-gray-300"
                                />
                                {form.slug && <p className="text-xs text-gray-500 mt-1">Slug: {form.slug}</p>}
                            </div>

                            <div>
                                <label className="block text-sm font-medium mb-1">Mô tả ngắn</label>
                                <textarea
                                    name="description"
                                    value={form.description}
                                    onChange={handleFormChange}
                                    rows={3}
                                    className="w-full p-4 rounded-lg bg-gray-50 border border-gray-300"
                                />
                            </div>

                            <div>
                                <label className="block text-sm font-medium mb-1">Nội dung chi tiết</label>
                                <TinyMCE
                                    value={form.content}
                                    onChange={handleEditorChange}
                                    name="content"
                                />
                            </div>
                        </div>
                    </div>

                    <div className="bg-white p-6 shadow-sm rounded-lg border">
                        <h3 className="text-lg font-semibold mb-4">Hình ảnh</h3>
                        <div className="space-y-6">
                            <div>
                                <label className="block text-sm font-medium mb-2">
                                    Ảnh đại diện (Thumbnail) <span className="text-red-500">*</span>
                                </label>
                                <input
                                    type="file"
                                    accept="image/*"
                                    required
                                    onChange={(e) => setThumbnailFile(e.target.files?.[0] || null)}
                                    className="w-full text-sm text-slate-500 file:mr-4 file:py-2 file:px-4 file:rounded-full file:border-0 file:text-sm file:font-semibold file:bg-violet-50 file:text-violet-700 hover:file:bg-violet-100"
                                />
                                {thumbnailPreview && (
                                    <Image
                                        src={thumbnailPreview}
                                        alt="Thumbnail preview"
                                        width={120}
                                        height={120}
                                        className="mt-4 rounded-lg border"
                                        unoptimized
                                    />
                                )}
                            </div>

                            <div>
                                <label className="block text-sm font-medium mb-2">Album ảnh sản phẩm</label>
                                <input
                                    type="file"
                                    multiple
                                    accept="image/*"
                                    onChange={(e) => setGalleryFiles(Array.from(e.target.files || []))}
                                    className="w-full text-sm text-slate-500 file:mr-4 file:py-2 file:px-4 file:rounded-full file:border-0 file:text-sm file:font-semibold file:bg-violet-50 file:text-violet-700 hover:file:bg-violet-100"
                                />
                                {galleryPreviews.length > 0 && (
                                    <div className="mt-4 grid grid-cols-3 sm:grid-cols-4 md:grid-cols-5 gap-4">
                                        {galleryPreviews.map((src, i) => (
                                            <Image
                                                key={i}
                                                src={src}
                                                alt={`Gallery preview ${i + 1}`}
                                                width={100}
                                                height={100}
                                                className="rounded-lg border object-cover aspect-square"
                                                unoptimized
                                            />
                                        ))}
                                    </div>
                                )}
                            </div>
                        </div>
                    </div>

                    <div className="bg-white p-6 shadow-sm rounded-lg border">
                        <h3 className="text-lg font-semibold mb-4">Thuộc tính sản phẩm</h3>
                        <div className="space-y-4">
                            {attributes.map((attr, index) => (
                                <div key={index} className="flex items-center gap-4">
                                    <select
                                        name="attribute_id"
                                        value={attr.attribute_id}
                                        onChange={(e) => handleAttributeChange(index, e)}
                                        className="w-1/3 h-12 px-4 rounded-lg bg-gray-50 border border-gray-300"
                                    >
                                        <option value="" disabled>Chọn thuộc tính</option>
                                        {allAttributesList.map((a) => (
                                            <option key={a.id} value={a.id}>{a.name}</option>
                                        ))}
                                    </select>
                                    <input
                                        name="value"
                                        value={attr.value}
                                        onChange={(e) => handleAttributeChange(index, e)}
                                        placeholder="Nhập giá trị (VD: Xanh, L, Vải Kate)"
                                        className="flex-1 h-12 px-4 rounded-lg bg-gray-50 border border-gray-300"
                                    />
                                    {attributes.length > 1 && (
                                        <button
                                            type="button"
                                            onClick={() => removeAttributeRow(index)}
                                            className="p-3 text-red-500 hover:bg-gray-100 rounded-full"
                                            aria-label="remove attribute"
                                        >
                                            <i className="far fa-trash-alt" />
                                        </button>
                                    )}
                                </div>
                            ))}
                        </div>
                        <button
                            type="button"
                            onClick={addAttributeRow}
                            className="mt-4 text-sm font-semibold text-indigo-600 hover:text-indigo-500"
                        >
                            + Thêm thuộc tính
                        </button>
                    </div>
                </div>

                <div className="lg:col-span-1 space-y-8">
                    <div className="bg-white p-6 shadow-sm rounded-lg border">
                        <h3 className="text-lg font-semibold mb-4">Kho hàng & Giá cả</h3>
                        <div className="space-y-4">
                            <div>
                                <label className="block text-sm font-medium mb-1">
                                    Giá gốc (giá nhập) <span className="text-red-500">*</span>
                                </label>
                                <input
                                    name="price_root"
                                    type="number"
                                    min="0"
                                    value={form.price_root}
                                    onChange={handleFormChange}
                                    required
                                    className="w-full h-12 px-4 rounded-lg bg-gray-50 border border-gray-300"
                                />
                            </div>
                            <div>
                                <label className="block text-sm font-medium mb-1">
                                    Giá bán <span className="text-red-500">*</span>
                                </label>
                                <input
                                    name="price_buy"
                                    type="number"
                                    min="0"
                                    value={form.price_buy}
                                    onChange={handleFormChange}
                                    required
                                    className="w-full h-12 px-4 rounded-lg bg-gray-50 border border-gray-300"
                                />
                            </div>
                            <div>
                                <label className="block text-sm font-medium mb-1">
                                    Số lượng nhập kho <span className="text-red-500">*</span>
                                </label>
                                <input
                                    name="qty"
                                    type="number"
                                    min="0"
                                    value={form.qty}
                                    onChange={handleFormChange}
                                    required
                                    className="w-full h-12 px-4 rounded-lg bg-gray-50 border border-gray-300"
                                />
                            </div>
                        </div>
                    </div>

                    <div className="bg-white p-6 shadow-sm rounded-lg border">
                        <h3 className="text-lg font-semibold mb-4">Tổ chức</h3>
                        <div className="space-y-4">
                            <div>
                                <label className="block text-sm font-medium mb-1">
                                    Danh mục sản phẩm <span className="text-red-500">*</span>
                                </label>
                                <select
                                    name="category_id"
                                    value={form.category_id}
                                    onChange={handleFormChange}
                                    required
                                    className="w-full h-12 px-4 rounded-lg bg-gray-50 border border-gray-300"
                                >
                                    <option value="" disabled>— Chọn danh mục —</option>
                                    {allCategories
                                        .filter((c) => c.parent_id === 0)
                                        .map((cat) => (
                                            <React.Fragment key={cat.id}>
                                                <option value={cat.id} className="font-bold">{cat.name}</option>
                                                {allCategories
                                                    .filter((sub) => sub.parent_id === cat.id)
                                                    .map((subCat) => (
                                                        <option key={subCat.id} value={subCat.id}>
                                                            &nbsp;&nbsp;&nbsp;-- {subCat.name}
                                                        </option>
                                                    ))}
                                            </React.Fragment>
                                        ))}
                                </select>
                            </div>
                            <div>
                                <label className="block text-sm font-medium mb-1">Trạng thái</label>
                                <select
                                    name="status"
                                    value={form.status}
                                    onChange={handleFormChange}
                                    className="w-full h-12 px-4 rounded-lg bg-gray-50 border border-gray-300"
                                >
                                    <option value={1}>Đang bán</option>
                                    <option value={0}>Ngừng bán</option>
                                </select>
                            </div>
                        </div>
                    </div>
                </div>
            </div>
        </form>
    );
}
