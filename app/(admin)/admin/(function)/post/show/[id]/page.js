'use client'
import React, { useEffect, useState } from 'react'
import { useParams, useRouter } from "next/navigation";
import Link from "next/link";
import Image from "next/image";

const API_BASE = process.env.NEXT_PUBLIC_API_BASE_URL;

const Page = () => {
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


    const [postData, setPostData] = useState(null);
    const [state, setState] = useState({ loading: true, error: null });

    useEffect(() => {
        if (!id || isNaN(Number(id)) || authLoading) return;

        const fetchPost = async () => {
            setState({ loading: true, error: null });
            try {
                const res = await fetch(`${API_BASE}/getPostbyId/${id}`);
                if (res.status === 404) {
                    setState({ loading: false, error: "Không tìm thấy bài viết!" });
                    return;
                }
                if (!res.ok) throw new Error(`Post HTTP ${res.status}`);
                const json = await res.json();
                setPostData(json);
                setState({ loading: false, error: null });
            } catch (e) {
                setState({ loading: false, error: e.message || 'Fetch error' });
            }
        };
        fetchPost();
    }, [id, router, authLoading]);

    if (authLoading) return <p className="p-8 text-center animate-pulse">Đang xác thực quyền truy cập...</p>;

    if (state.loading) return <p className="p-8 text-center animate-pulse">Đang tải dữ liệu...</p>;
    if (state.error) return <p className="p-8 text-center text-red-500">Lỗi: {state.error}</p>;
    if (!postData) return null;

    return (
        <div className="flex flex-col min-w-0 mb-6 break-words bg-white border-0 shadow-xl rounded-2xl">
            <div className="p-6 pb-4 mb-0 border-b border-gray-200 rounded-t-2xl">
                <div className="flex flex-wrap justify-between items-center mb-4 gap-4">
                    <div>
                        <h6 className="text-gray-800 text-xl font-bold">Chi tiết Bài viết</h6>
                        <nav aria-label="breadcrumb" className="text-sm font-medium text-gray-500">
                            <ol className="flex items-center space-x-1">
                                <li><Link href="/admin" className="hover:underline">Trang chủ</Link></li>
                                <li><span className="mx-1">/</span></li>
                                <li><Link href="/admin/post" className="hover:underline">Danh sách Bài viết</Link></li>
                                <li><span className="mx-1">/</span></li>
                                <li>Chi tiết</li>
                            </ol>
                        </nav>
                    </div>
                </div>
            </div>

            <div className="p-6 md:p-8">
                <dl className="grid grid-cols-1 sm:grid-cols-2 gap-x-6 gap-y-8">
                    <div className="sm:col-span-1">
                        <dt className="text-sm font-medium text-gray-500">ID</dt>
                        <dd className="mt-1 text-base font-semibold text-gray-900">#{postData.id}</dd>
                    </div>

                    <div className="sm:col-span-1">
                        <dt className="text-sm font-medium text-gray-500">Tiêu đề</dt>
                        <dd className="mt-1 text-base font-semibold text-gray-900">{postData.title}</dd>
                    </div>

                    <div className="sm:col-span-2">
                        <dt className="text-sm font-medium text-gray-500">Slug</dt>
                        <dd className="mt-1 text-base font-mono text-gray-700 bg-gray-100 px-2 py-1 rounded inline-block">{postData.slug}</dd>
                    </div>

                    {postData.image && (
                        <div className="sm:col-span-2">
                            <dt className="text-sm font-medium text-gray-500 mb-2">Ảnh bìa</dt>
                            <dd className="mt-1">
                                <Image
                                    src={postData.image}
                                    alt={`Ảnh của ${postData.title}`}
                                    width={400}
                                    height={225}
                                    className="rounded-lg border border-gray-200 object-cover"
                                    unoptimized
                                />
                            </dd>
                        </div>
                    )}

                    <div className="sm:col-span-1">
                        <dt className="text-sm font-medium text-gray-500">Chủ đề</dt>
                        <dd className="mt-1 text-base font-semibold text-gray-900">
                            {postData.topic?.name || 'Không xác định'}
                        </dd>
                    </div>

                    <div className="sm:col-span-1">
                        <dt className="text-sm font-medium text-gray-500">Ngày tạo</dt>
                        <dd className="mt-1 text-base font-semibold text-gray-900">
                            {new Date(postData.created_at).toLocaleString('vi-VN', {
                                year: 'numeric',
                                month: 'long',
                                day: 'numeric',
                                hour: '2-digit',
                                minute: '2-digit'
                            })}
                        </dd>
                    </div>

                    <div className="sm:col-span-2">
                        <dt className="text-sm font-medium text-gray-500">Mô tả ngắn</dt>
                        <dd className="mt-1 text-base text-gray-900">{postData.description || 'Không có mô tả'}</dd>
                    </div>

                    <div className="sm:col-span-2">
                        <dt className="text-sm font-medium text-gray-500">Nội dung</dt>
                        <dd className="mt-1 text-base text-gray-900 prose max-w-none" dangerouslySetInnerHTML={{ __html: postData.content || '' }} />
                    </div>

                    <div className="sm:col-span-1">
                        <dt className="text-sm font-medium text-gray-500">Trạng thái</dt>
                        <dd className="mt-1">
                            <span
                                className={`px-3 py-1 font-semibold text-xs rounded-full ${postData.status === 1 ? 'bg-green-100 text-green-800' : 'bg-yellow-100 text-yellow-800'}`}>
                                {postData.status === 1 ? "Xuất bản" : "Bản nháp"}
                            </span>
                        </dd>
                    </div>
                </dl>

                <div className="flex justify-end gap-x-4 mt-8 border-t border-gray-200 pt-6">
                    <Link href={"/admin/post"}
                        className="px-4 py-2 bg-gray-200 hover:bg-gray-300 text-gray-800 text-sm font-medium rounded-lg">
                        Quay lại
                    </Link>
                    <Link href={`/admin/post/edit/${postData.id}`}
                        className="inline-flex items-center px-4 py-2 bg-yellow-500 hover:bg-yellow-600 text-white text-sm font-medium rounded-lg shadow-md">
                        <i className="fas fa-edit mr-2"></i> Sửa
                    </Link>
                </div>
            </div>
        </div>
    );
};

export default Page;
