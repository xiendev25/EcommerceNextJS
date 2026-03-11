'use client';

import React, { useEffect, useState } from 'react';
import Link from 'next/link';
import { useRouter, useParams } from 'next/navigation';
import Image from 'next/image';
import TinyMCE from '../../../../../_components/TinyMCE/TinyMCE';

const API_BASE = process.env.NEXT_PUBLIC_API_BASE_URL;

const createSlug = (str) =>
    str
        ? str.toLowerCase()
            .normalize('NFD').replace(/[\u0300-\u036f]/g, '')
            .replace(/đ/g, 'd')
            .replace(/[^a-z0-9\s-]/g, '')
            .trim().replace(/\s+/g, '-').replace(/-+/g, '-')
        : '';

export default function Page() {
    const [user, setUser] = useState(null);
    const router = useRouter();
    const { id } = useParams();
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
        name: '', slug: '', category_id: '', price_buy: '',
        description: '', content: '', status: 1, thumbnail: '',
        price_root: '', qty: '',
    });

    const [attributes, setAttributes] = useState([{ attribute_id: '', value: '' }]);
    const [thumbnailFile, setThumbnailFile] = useState(null);
    const [thumbnailPreview, setThumbnailPreview] = useState(null);
    const [oldThumbnail, setOldThumbnail] = useState('');
    const [existingGallery, setExistingGallery] = useState([]);
    const [deleteGalleryIds, setDeleteGalleryIds] = useState([]);
    const [galleryFiles, setGalleryFiles] = useState([]);
    const [galleryPreviews, setGalleryPreviews] = useState([]);

    const deleteFileAPI = async (filePath) => {
        if (!filePath) return;
        try {
            const res = await fetch(`${API_BASE}/delete-image`, {
                method: 'DELETE',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ filePath: filePath }),
            });
            if (!res.ok) {
                console.error(`Failed to delete image ${filePath}: ${res.status}`);
            } else {
                console.log(`Successfully deleted image ${filePath}`);
            }
        } catch (error) {
            console.error(`Error deleting image ${filePath}:`, error);
        }
    };


    useEffect(() => {
        if (!id || authLoading) return;

        const fetchProductData = async () => {
            setState(s => ({ ...s, loading: true, error: null }));
            try {
                const [catRes, attrRes, prodRes] = await Promise.all([
                    fetch(`${API_BASE}/category`),
                    fetch(`${API_BASE}/attribute`),
                    fetch(`${API_BASE}/getAdminProductDetail/${id}`),
                ]);

                if (!prodRes.ok) {
                    if (prodRes.status === 404) throw new Error(`Không tìm thấy sản phẩm với ID ${id}.`);
                    throw new Error(`Lỗi tải sản phẩm: HTTP ${prodRes.status}`);
                }
                if (!catRes.ok) throw new Error('Lỗi tải danh mục.');
                if (!attrRes.ok) throw new Error('Lỗi tải thuộc tính.');


                const cats = await catRes.json();
                const attrs = await attrRes.json();
                const prod = await prodRes.json();
                const p = prod?.data || prod;
                const ps = p?.product_store || {};
                const imgs = Array.isArray(p?.product_image) ? p.product_image : [];
                const pattrs = Array.isArray(p?.product_attribute)
                    ? p.product_attribute.map(x => ({ attribute_id: x.attribute_id, value: x.value }))
                    : [];

                setAllCategories(Array.isArray(cats) ? cats : []);
                setAllAttributesList(Array.isArray(attrs) ? attrs : []);

                setForm({
                    name: p?.name || '',
                    slug: p?.slug || '',
                    category_id: String(p?.category_id || ''),
                    price_buy: p?.price_buy ?? '',
                    description: p?.description || '',
                    content: p?.content || '',
                    status: p?.status ?? 1,
                    thumbnail: p?.thumbnail || '',
                    price_root: ps?.price_root ?? '',
                    qty: ps?.qty ?? '',
                });
                setOldThumbnail(p?.thumbnail || '');

                setAttributes(pattrs.length ? pattrs : [{ attribute_id: '', value: '' }]);
                setExistingGallery(imgs);
                setDeleteGalleryIds([]);
                setGalleryFiles([]);
                setGalleryPreviews([]);

            } catch (e) {
                setState(s => ({ ...s, error: e.message }));
            } finally {
                setState(s => ({ ...s, loading: false }));
            }
        };
        fetchProductData();
    }, [id, authLoading]);

    useEffect(() => {
        if (thumbnailFile) {
            const url = URL.createObjectURL(thumbnailFile);
            setThumbnailPreview(url);
            return () => URL.revokeObjectURL(url);
        }
        setThumbnailPreview(null);
    }, [thumbnailFile]);

    useEffect(() => {
        if (galleryFiles.length) {
            const urls = galleryFiles.map(f => URL.createObjectURL(f));
            setGalleryPreviews(urls);
            return () => urls.forEach(u => URL.revokeObjectURL(u));
        }
        setGalleryPreviews([]);
    }, [galleryFiles]);

    const onChange = (e) => {
        const { name, value } = e.target;
        setForm(prev => ({ ...prev, [name]: value }));
        if (name === 'name') {
            setForm(prev => ({ ...prev, slug: createSlug(value) }));
        }
    };
    const handleEditorChange = (content) => {
        setForm(prev => ({ ...prev, content: content }));
    };

    const onAttrChange = (idx, e) => {
        const { name, value } = e.target;
        setAttributes(prev => {
            const next = [...prev];
            if (next[idx]) {
                next[idx] = { ...next[idx], [name]: value };
            }
            return next;
        });
    };


    const addAttr = () => setAttributes(prev => [...prev, { attribute_id: '', value: '' }]);
    const rmAttr = (idx) => setAttributes(prev => prev.filter((_, i) => i !== idx));

    const toggleDeleteGallery = (imgId) => {
        setDeleteGalleryIds(prev =>
            prev.includes(imgId) ? prev.filter(x => x !== imgId) : [...prev, imgId]
        );
    };


    const uploadSingleToLaravel = async (file, slugPrefix) => {
        if (!file) return null;
        const fd = new FormData();
        fd.append('image', file);
        fd.append('slug', createSlug(slugPrefix) || 'image');
        fd.append('perfix', 'products');
        const res = await fetch(`${API_BASE}/upload`, { method: 'POST', body: fd });
        if (!res.ok) {
            const t = await res.text().catch(() => '');
            throw new Error(t || `Upload failed (${res.status})`);
        }
        return await res.json();
    };

    const uploadMultipleToLaravel = async (files, slugPrefix) => {
        if (!files || files.length === 0) return { urls: [], paths: [] };
        const fd = new FormData();
        files.forEach((f) => fd.append('images[]', f));
        fd.append('perfix', 'products');
        fd.append('slug', createSlug(slugPrefix) || 'gallery');
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



    const handleSubmit = async (e) => {
        e.preventDefault();

        if (!user) {
            alert('Không thể xác định người dùng. Vui lòng đăng nhập lại.');
            router.push('/admin/login');
            return;
        }

        if (!form.name || !form.category_id || !form.price_buy || form.qty === '' || form.price_root === '') {
            alert('Vui lòng điền đủ các trường bắt buộc (*).');
            return;
        }

        setState(s => ({ ...s, submitting: true, error: null }));

        try {
            let thumbnailUrl = form.thumbnail;

            if (thumbnailFile) {
                if (oldThumbnail) {
                    await deleteFileAPI(oldThumbnail);
                }
                const thumbUploadRes = await uploadSingleToLaravel(thumbnailFile, form.name);
                if (!thumbUploadRes?.url) throw new Error('Upload thumbnail mới thất bại.');
                thumbnailUrl = thumbUploadRes.url;
            }

            const imagesToDeletePaths = existingGallery
                .filter(img => deleteGalleryIds.includes(img.id))
                .map(img => img.image);

            imagesToDeletePaths.forEach(filePath => deleteFileAPI(filePath));

            const galleryAddUploadRes = await uploadMultipleToLaravel(galleryFiles, form.name + '-gallery');
            const galleryToAdd = galleryAddUploadRes.urls.map((url) => ({ image: url, status: 1 }));


            const payload = {
                category_id: Number(form.category_id),
                name: form.name.trim(),
                slug: form.slug.trim() || createSlug(form.name.trim()),
                thumbnail: thumbnailUrl,
                content: form.content,
                description: form.description.trim(),
                price_buy: Number(form.price_buy),
                status: Number(form.status),
                updated_at: new Date().toISOString(),
                updated_by: user.id,

                product_store: {
                    price_root: Number(form.price_root),
                    qty: Number(form.qty),
                    status: Number(form.status),
                    updated_by: user.id,
                },

                product_attribute: attributes
                    .filter(a => a.attribute_id && a.value.trim())
                    .map(a => ({ attribute_id: Number(a.attribute_id), value: String(a.value).trim() })),

                gallery_images_add: galleryToAdd,
                product_image_ids_delete: deleteGalleryIds,
            };

            const res = await fetch(`${API_BASE}/product/${id}`, {
                method: 'PUT',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify(payload),
            });

            if (!res.ok) {
                let js = {};
                try { js = await res.json(); } catch { }
                throw new Error(js?.message || js?.error || 'Cập nhật thất bại');
            }

            alert('Cập nhật sản phẩm thành công!');
            router.push('/admin/product');
        } catch (err) {
            console.error(err);
            setState(s => ({ ...s, submitting: false, error: err.message }));
        }
    };

    if (authLoading) {
        return <div className="p-8 text-center animate-pulse">Đang xác thực quyền truy cập...</div>;
    }

    if (state.loading) return <div className="p-8 text-center animate-pulse">Đang tải dữ liệu sản phẩm...</div>;


    return (
        <form onSubmit={handleSubmit} className="space-y-8">
            <div className="flex items-center justify-between">
                <div>
                    <h1 className="text-2xl font-bold text-gray-900">Chỉnh sửa sản phẩm</h1>
                    <p className="text-sm text-gray-500 mt-1">ID: {id}</p>
                </div>
                <div className="flex gap-3">
                    <Link href="/admin/product" className="px-4 py-2 bg-gray-200 hover:bg-gray-300 text-gray-800 text-sm font-medium rounded-lg">Hủy</Link>
                    <button type="submit" disabled={state.submitting} className="px-4 py-2 bg-indigo-600 text-white rounded-lg disabled:opacity-60">
                        {state.submitting ? 'Đang lưu...' : 'Lưu thay đổi'}
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
                                <label className="block text-sm font-medium mb-1">Tên sản phẩm <span className="text-red-500">*</span></label>
                                <input name="name" value={form.name} onChange={onChange} required className="w-full h-12 px-4 rounded-lg bg-gray-50 border border-gray-300" />
                                {form.slug && <p className="text-xs text-gray-500 mt-1">Slug: {form.slug}</p>}
                            </div>
                            <div>
                                <label className="block text-sm font-medium mb-1">Mô tả ngắn</label>
                                <textarea name="description" value={form.description} onChange={onChange} rows={3} className="w-full p-4 rounded-lg bg-gray-50 border border-gray-300" />
                            </div>
                            <div>
                                <label className="block text-sm font-medium mb-1">Nội dung chi tiết</label>
                                <TinyMCE name="content" value={form.content} onChange={handleEditorChange} />
                            </div>
                        </div>
                    </div>

                    <div className="bg-white p-6 shadow-sm rounded-lg border">
                        <h3 className="text-lg font-semibold mb-4">Hình ảnh</h3>
                        <div className="space-y-3">
                            <label className="block text-sm font-medium">Ảnh đại diện — Tải lên ảnh mới để thay thế</label>
                            <div className="flex items-center gap-4">
                                {(thumbnailPreview || form.thumbnail) && (
                                    <Image
                                        src={thumbnailPreview || form.thumbnail}
                                        alt={thumbnailPreview ? "New thumbnail" : "Current thumbnail"}
                                        width={120} height={120}
                                        className="rounded-lg border object-cover aspect-square"
                                        unoptimized
                                    />
                                )}
                                <input
                                    type="file"
                                    accept="image/*"
                                    onChange={(e) => setThumbnailFile(e.target.files?.[0] || null)}
                                    className="w-full text-sm text-slate-500 file:mr-4 file:py-2 file:px-4 file:rounded-full file:border-0 file:text-sm file:font-semibold file:bg-violet-50 file:text-violet-700 hover:file:bg-violet-100"
                                />
                            </div>
                        </div>

                        <div className="mt-6">
                            <label className="block text-sm font-medium mb-2">Album hiện có (Chọn để xóa)</label>
                            {existingGallery.length === 0 ? (
                                <p className="text-gray-500 text-sm">Chưa có ảnh.</p>
                            ) : (
                                <div className="grid grid-cols-3 sm:grid-cols-4 md:grid-cols-5 gap-4">
                                    {existingGallery.map(img => {
                                        const marked = deleteGalleryIds.includes(img.id);
                                        return (
                                            <div key={img.id} className="relative group cursor-pointer" onClick={() => toggleDeleteGallery(img.id)}>
                                                <Image src={img.image} alt={'Image ' + img.id} width={110} height={110}
                                                    className={`rounded-lg border object-cover aspect-square transition-opacity duration-200 ${marked ? 'opacity-40 ring-2 ring-red-500 ring-offset-2' : 'opacity-100'}`}
                                                    unoptimized
                                                />
                                                <div className={`absolute inset-0 flex items-center justify-center bg-black/50 rounded-lg transition-opacity duration-200 ${marked ? 'opacity-100' : 'opacity-0 group-hover:opacity-100'}`}>
                                                    <i className={`fas ${marked ? 'fa-undo' : 'fa-trash-alt'} text-white text-xl`}></i>
                                                </div>
                                            </div>
                                        );
                                    })}
                                </div>
                            )}
                        </div>

                        <div className="mt-6">
                            <label className="block text-sm font-medium mb-2">Thêm ảnh vào album</label>
                            <input type="file" multiple accept="image/*"
                                onChange={(e) => setGalleryFiles(Array.from(e.target.files || []))}
                                className="w-full text-sm text-slate-500 file:mr-4 file:py-2 file:px-4 file:rounded-full file:border-0 file:text-sm file:font-semibold file:bg-violet-50 file:text-violet-700 hover:file:bg-violet-100" />
                            {galleryPreviews.length > 0 && (
                                <div className="mt-4 grid grid-cols-3 sm:grid-cols-4 md:grid-cols-5 gap-4">
                                    {galleryPreviews.map((src, i) => (
                                        <Image key={i} src={src} alt={`new-${i}`} width={100} height={100}
                                            className="rounded-lg border object-cover aspect-square" unoptimized />
                                    ))}
                                </div>
                            )}
                        </div>
                    </div>

                    <div className="bg-white p-6 shadow-sm rounded-lg border">
                        <h3 className="text-lg font-semibold mb-4">Thuộc tính sản phẩm</h3>
                        <div className="space-y-4">
                            {attributes.map((attr, idx) => (
                                <div key={idx} className="flex items-center gap-4">
                                    <select name="attribute_id" value={attr.attribute_id} onChange={(e) => onAttrChange(idx, e)}
                                        className="w-1/3 h-12 px-4 rounded-lg bg-gray-50 border border-gray-300">
                                        <option value="" disabled>Chọn thuộc tính</option>
                                        {allAttributesList.map(a => <option key={a.id} value={a.id}>{a.name}</option>)}
                                    </select>
                                    <input name="value" value={attr.value} onChange={(e) => onAttrChange(idx, e)}
                                        placeholder="VD: Đỏ, L, Vải Kate"
                                        className="flex-1 h-12 px-4 rounded-lg bg-gray-50 border border-gray-300" />
                                    {attributes.length > 1 && (
                                        <button type="button" onClick={() => rmAttr(idx)} className="p-3 text-red-500 hover:bg-gray-100 rounded-full">
                                            <i className="far fa-trash-alt" />
                                        </button>
                                    )}
                                </div>
                            ))}
                        </div>
                        <button type="button" onClick={addAttr}
                            className="mt-4 text-sm font-semibold text-indigo-600 hover:text-indigo-500">
                            + Thêm thuộc tính
                        </button>
                    </div>
                </div>

                <div className="lg:col-span-1 space-y-8">
                    <div className="bg-white p-6 shadow-sm rounded-lg border">
                        <h3 className="text-lg font-semibold mb-4">Kho hàng & Giá cả</h3>
                        <div className="space-y-4">
                            <div>
                                <label className="block text-sm font-medium mb-1">Giá gốc (giá nhập) <span className="text-red-500">*</span></label>
                                <input name="price_root" type="number" min="0" value={form.price_root} onChange={onChange} required
                                    className="w-full h-12 px-4 rounded-lg bg-gray-50 border border-gray-300" />
                            </div>
                            <div>
                                <label className="block text-sm font-medium mb-1">Giá bán <span className="text-red-500">*</span></label>
                                <input name="price_buy" type="number" min="0" value={form.price_buy} onChange={onChange} required
                                    className="w-full h-12 px-4 rounded-lg bg-gray-50 border border-gray-300" />
                            </div>
                            <div>
                                <label className="block text-sm font-medium mb-1">Số lượng tồn kho <span className="text-red-500">*</span></label>
                                <input name="qty" type="number" min="0" value={form.qty} onChange={onChange} required
                                    className="w-full h-12 px-4 rounded-lg bg-gray-50 border border-gray-300" />
                            </div>
                        </div>
                    </div>

                    <div className="bg-white p-6 shadow-sm rounded-lg border">
                        <h3 className="text-lg font-semibold mb-4">Tổ chức</h3>
                        <div className="space-y-4">
                            <div>
                                <label className="block text-sm font-medium mb-1">Danh mục sản phẩm <span className="text-red-500">*</span></label>
                                <select name="category_id" value={form.category_id} onChange={onChange} required
                                    className="w-full h-12 px-4 rounded-lg bg-gray-50 border border-gray-300">
                                    <option value="" disabled>— Chọn danh mục —</option>
                                    {allCategories.filter(c => c.parent_id === 0).map(cat => (
                                        <React.Fragment key={cat.id}>
                                            <option value={cat.id} className="font-bold">{cat.name}</option>
                                            {allCategories.filter(sub => sub.parent_id === cat.id).map(sub => (
                                                <option key={sub.id} value={sub.id}>&nbsp;&nbsp;&nbsp;-- {sub.name}</option>
                                            ))}
                                        </React.Fragment>
                                    ))}
                                </select>
                            </div>
                            <div>
                                <label className="block text-sm font-medium mb-1">Trạng thái</label>
                                <select name="status" value={form.status} onChange={onChange}
                                    className="w-full h-12 px-4 rounded-lg bg-gray-50 border border-gray-300">
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
