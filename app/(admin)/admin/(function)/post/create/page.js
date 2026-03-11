'use client';

import React, { useEffect, useState } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import Image from 'next/image';
import TinyMCE from '../../../../_components/TinyMCE/TinyMCE';

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
    const [allTopics, setAllTopics] = useState([]);
    const [form, setForm] = useState({
        title: '',
        slug: '',
        topic_id: '',
        description: '',
        content: '',
        status: 1,
    });
    const [thumbnailFile, setThumbnailFile] = useState(null);
    const [thumbnailPreview, setThumbnailPreview] = useState(null);

    const uploadSingleToLaravel = async (file) => {
        const fd = new FormData();
        fd.append('image', file);
        fd.append('slug', createSlug(form.title));
        fd.append('perfix', 'posts');
        const res = await fetch(`${API_BASE}/upload`, { method: 'POST', body: fd });
        if (!res.ok) {
            const t = await res.text().catch(() => '');
            throw new Error(t || `Upload ảnh bìa thất bại (${res.status})`);
        }
        return (await res.json());
    };

    useEffect(() => {
        if (authLoading) return;

        const fetchTopics = async () => {
            setState((s) => ({ ...s, loading: true, error: null }));
            try {
                const res = await fetch(`${API_BASE}/topic`);
                if (!res.ok) throw new Error('Không thể tải danh sách chủ đề.');
                const json = await res.json();
                const topicList = Array.isArray(json) ? json : [];
                setAllTopics(topicList);
                if (topicList.length > 0 && !form.topic_id) {
                    setForm(prev => ({ ...prev, topic_id: topicList[0].id }));
                }

            } catch (e) {
                setState((s) => ({ ...s, error: e.message }));
            } finally {
                setState((s) => ({ ...s, loading: false }));
            }
        };
        fetchTopics();
    }, [authLoading]);

    useEffect(() => {
        if (thumbnailFile) {
            const url = URL.createObjectURL(thumbnailFile);
            setThumbnailPreview(url);
            return () => URL.revokeObjectURL(url);
        }
        setThumbnailPreview(null);
    }, [thumbnailFile]);

    const handleFormChange = (e) => {
        const { name, value } = e.target;
        setForm((prev) => ({ ...prev, [name]: value }));
        if (name === 'title') {
            setForm((prev) => ({ ...prev, slug: createSlug(value) }));
        }
    };



    const handleSubmit = async (e) => {
        e.preventDefault();

        if (!user) {
            alert('Không thể xác định người dùng. Vui lòng đăng nhập lại.');
            router.push('/admin/login');
            return;
        }

        if (!form.title || !form.topic_id || !form.content) {
            alert('Vui lòng điền đầy đủ các trường bắt buộc (*).');
            return;
        }
        if (!thumbnailFile) {
            alert('Vui lòng tải lên ảnh bìa.');
            return;
        }

        setState((s) => ({ ...s, submitting: true, error: null }));

        try {
            const thumb = await uploadSingleToLaravel(thumbnailFile);
            const imageUrl = thumb.url;

            const payload = {
                topic_id: Number(form.topic_id),
                title: form.title,
                slug: form.slug || createSlug(form.title),
                image: imageUrl,
                content: form.content,
                description: form.description,
                status: Number(form.status),
                created_by: user.id,
            };

            const createRes = await fetch(`${API_BASE}/post`, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify(payload),
            });

            if (!createRes.ok) {
                let errorData = {};
                try { errorData = await createRes.json(); } catch { }
                throw new Error(errorData.message || errorData.error || 'Tạo bài viết thất bại.');
            }

            alert('Tạo bài viết mới thành công!');
            router.push('/admin/post');
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
                <h1 className="text-2xl font-bold text-gray-900">Thêm bài viết mới</h1>
                <div className="flex gap-3">
                    <Link
                        href="/admin/post"
                        className="px-4 py-2 bg-gray-200 hover:bg-gray-300 text-gray-800 text-sm font-medium rounded-lg"
                    >
                        Hủy
                    </Link>
                    <button
                        type="submit"
                        disabled={state.submitting}
                        className="px-4 py-2 bg-indigo-600 text-white rounded-lg disabled:opacity-60"
                    >
                        {state.submitting ? 'Đang lưu...' : 'Tạo bài viết'}
                    </button>
                </div>
            </div>

            <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
                <div className="lg:col-span-2 space-y-8">
                    <div className="bg-white p-6 shadow-sm rounded-lg border">
                        <h3 className="text-lg font-semibold mb-4">Nội dung bài viết</h3>
                        {state.error && <p className="text-red-500 text-sm mb-4 bg-red-50 p-3 rounded border border-red-200">Lỗi: {state.error}</p>}
                        <div className="space-y-4">
                            <div>
                                <label className="block text-sm font-medium mb-1">
                                    Tiêu đề <span className="text-red-500">*</span>
                                </label>
                                <input
                                    name="title"
                                    value={form.title}
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
                                <label className="block text-sm font-medium mb-1">
                                    Nội dung chi tiết <span className="text-red-500">*</span>
                                </label>
                                <TinyMCE
                                    value={form.content}
                                    onChange={handleFormChange}
                                    name="content"
                                />
                            </div>
                        </div>
                    </div>
                </div>

                <div className="lg:col-span-1 space-y-8">
                    <div className="bg-white p-6 shadow-sm rounded-lg border">
                        <h3 className="text-lg font-semibold mb-4">Tổ chức</h3>
                        <div className="space-y-4">
                            <div>
                                <label className="block text-sm font-medium mb-1">
                                    Chủ đề <span className="text-red-500">*</span>
                                </label>
                                <select
                                    name="topic_id"
                                    value={form.topic_id}
                                    onChange={handleFormChange}
                                    required
                                    className="w-full h-12 px-4 rounded-lg bg-gray-50 border border-gray-300"
                                >
                                    <option value="" disabled>— Chọn chủ đề —</option>
                                    {allTopics.map((topic) => (
                                        <option key={topic.id} value={topic.id}>{topic.name}</option>
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
                                    <option value={1}>Xuất bản</option>
                                    <option value={0}>Bản nháp</option>
                                </select>
                            </div>
                        </div>
                    </div>

                    <div className="bg-white p-6 shadow-sm rounded-lg border">
                        <h3 className="text-lg font-semibold mb-4">Ảnh bìa</h3>
                        <div>
                            <label className="block text-sm font-medium mb-2">
                                Tải ảnh lên <span className="text-red-500">*</span>
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
                                    width={200}
                                    height={120}
                                    className="mt-4 rounded-lg border object-cover w-full"
                                    unoptimized
                                />
                            )}
                        </div>
                    </div>
                </div>
            </div>
        </form>
    );
}
