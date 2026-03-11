'use client'
import React, { useEffect, useState } from 'react'
import Image from 'next/image'
import Link from 'next/link'
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


    const [page, setPage] = useState(1);
    const [postRes, setPostRes] = useState(null);
    const [pagedPosts, setPagedPosts] = useState([]);
    const [state, setState] = useState({ loading: true, error: null });

    const fetchData = async (pageToFetch) => {
        if (authLoading) return;

        setState({ loading: true, error: null });
        try {
            const res = await fetch(`${API_BASE}/getAdminPost?page=${pageToFetch || 1}`, { cache: 'no-store' });
            if (!res.ok) throw new Error(`Post HTTP ${res.status}`);

            const json = await res.json();
            setPostRes(json ?? null);
            setPagedPosts(Array.isArray(json.data) ? json.data : []);
        } catch (e) {
            setState({ loading: false, error: e.message || 'Fetch error' });
        } finally {
            setState({ loading: false });
        }
    };

    useEffect(() => {
        fetchData(page);
    }, [page, authLoading]);

    const handleDelete = async (id) => {
        if (!user) {
            alert('Không thể xác định người dùng. Vui lòng đăng nhập lại.');
            router.push('/admin/login');
            return;
        }

        if (!confirm('Bạn có chắc chắn muốn xóa bài viết này? Thao tác này sẽ xóa cả ảnh liên quan.')) return;
        if (!id || isNaN(Number(id))) {
            alert("Trường ID không hợp lệ!");
            return;
        }
        try {
            const resData = await fetch(`${API_BASE}/post/${id}`);
            if (resData.status === 404) {
                fetchData(page);
                return;
            }
            if (!resData.ok) throw new Error(`Không thể lấy thông tin bài viết (HTTP ${resData.status})`);
            const json = await resData.json();

            if (json.image) {
                const payload = { imagePath: json.image };
                fetch('/api/upload', {
                    method: 'DELETE',
                    headers: { 'Content-Type': 'application/json' },
                    body: JSON.stringify(payload),
                })
                    .then(res => res.json())
                    .then(data => console.log('Xóa ảnh thành công:', data.message))
                    .catch(err => console.error('Lỗi khi xóa ảnh:', err));
            }

            const res = await fetch(`${API_BASE}/post/${id}`, {
                method: 'DELETE',
            });

            if (!res.ok) {
                const errorData = await res.json().catch(() => ({}));
                throw new Error(errorData.message || 'Xóa thất bại');
            }

            alert('Xóa bài viết thành công!');
            if (pagedPosts.length === 1 && page > 1) {
                setPage(page - 1);
            } else {
                fetchData(page);
            }

        } catch (err) {
            alert(`Lỗi khi xóa: ${err.message}`);
            console.error(err);
        }
    }

    if (authLoading) {
        return <div className="p-8 text-center animate-pulse">Đang xác thực quyền truy cập...</div>;
    }

    if (state.loading) {
        return (
            <div className="flex flex-col min-w-0 mb-6 break-words bg-white border-0 shadow-xl rounded-2xl animate-pulse">
                <div className="p-6 pb-4 mb-0 border-b border-gray-200 rounded-t-2xl">
                    <div className="flex flex-wrap justify-between items-center mb-4 gap-4">
                        <div><div className="w-60 h-8 bg-gray-200 rounded-lg" /></div>
                        <div className="flex space-x-3 items-center">
                            <div className="w-24 h-10 bg-gray-200 rounded-lg" />
                        </div>
                    </div>
                </div>
                <div className="flex-auto p-4">
                    <div className="overflow-x-auto">
                        <table className="w-full text-sm align-top text-slate-600">
                            <thead className="align-bottom">
                                <tr className="text-xs font-semibold tracking-wide text-left text-gray-500 uppercase border-b border-gray-200">
                                    <th className="px-6 py-3 w-[5%]"><div className="w-8 h-4 bg-gray-200 rounded"></div></th>
                                    <th className="px-6 py-3 w-[15%]"><div className="w-24 h-4 bg-gray-200 rounded"></div></th>
                                    <th className="px-6 py-3 w-[35%]"><div className="w-48 h-4 bg-gray-200 rounded"></div></th>
                                    <th className="px-6 py-3 w-[15%]"><div className="w-24 h-4 bg-gray-200 rounded"></div></th>
                                    <th className="px-6 py-3 w-[15%]"><div className="w-20 h-4 bg-gray-200 rounded"></div></th>
                                    <th className="px-6 py-3 w-[15%]"><div className="w-24 h-4 bg-gray-200 rounded"></div></th>
                                </tr>
                            </thead>
                            <tbody className="divide-y divide-gray-100">
                                {[...Array(10)].map((_, i) => (
                                    <tr key={i}>
                                        <td className="px-6 py-4"><div className="w-10 h-6 bg-gray-200 rounded" /></td>
                                        <td className="px-6 py-4"><div className="w-28 h-14 bg-gray-200 rounded" /></td>
                                        <td className="px-6 py-4 space-y-2">
                                            <div className="w-full h-5 bg-gray-200 rounded" />
                                            <div className="w-3/4 h-4 bg-gray-200 rounded" />
                                        </td>
                                        <td className="px-6 py-4"><div className="w-24 h-5 bg-gray-200 rounded" /></td>
                                        <td className="px-6 py-4"><div className="w-20 h-6 bg-gray-200 rounded-full" /></td>
                                        <td className="px-6 py-4 flex gap-2 justify-center">
                                            <div className="w-8 h-8 bg-gray-200 rounded-full" />
                                            <div className="w-8 h-8 bg-gray-200 rounded-full" />
                                            <div className="w-8 h-8 bg-gray-200 rounded-full" />
                                        </td>
                                    </tr>
                                ))}
                            </tbody>
                        </table>
                    </div>
                </div>
            </div>
        );
    }


    return (
        <div className="flex flex-col min-w-0 mb-6 break-words bg-white border-0 shadow-xl rounded-2xl">
            <div className="p-6 pb-4 mb-0 border-b border-gray-200 rounded-t-2xl">
                <div className="flex flex-wrap justify-between items-center mb-4 gap-4">
                    <div>
                        <h6 className="text-gray-800 text-xl font-bold">Danh sách Bài viết</h6>
                        <nav aria-label="breadcrumb" className="text-sm font-medium text-gray-500">
                            <ol className="flex items-center space-x-1">
                                <li><Link href="/admin" className="hover:underline">Trang chủ</Link></li>
                                <li><span className="mx-1">/</span></li>
                                <li>Danh sách Bài viết</li>
                            </ol>
                        </nav>
                    </div>
                    <div className="flex space-x-3 items-center">
                        <Link href="/admin/post/create" className="inline-flex items-center px-4 py-2 bg-indigo-600 hover:bg-indigo-700 text-white text-sm font-medium rounded-lg shadow-md hover:-translate-y-0.5 transition-transform">
                            <i className="fas fa-plus mr-2 text-base"></i> Thêm mới
                        </Link>
                    </div>
                </div>
            </div>

            <div className="flex-auto p-4">
                {state.error && <p className="p-4 mb-4 text-center text-red-500 bg-red-50 border border-red-200 rounded-lg">Lỗi tải dữ liệu: {state.error}</p>}
                <div className="overflow-x-auto">
                    <table className="w-full text-sm align-top text-slate-600">
                        <thead className="align-bottom">
                            <tr className="text-xs font-semibold tracking-wide text-left text-gray-500 uppercase border-b border-gray-200">
                                <th className="px-6 py-3 w-[5%]">ID</th>
                                <th className="px-6 py-3 w-[15%]">Hình ảnh</th>
                                <th className="px-6 py-3 w-[35%]">Tiêu đề</th>
                                <th className="px-6 py-3 w-[15%]">Chủ đề</th>
                                <th className="px-6 py-3 w-[15%] text-center">Trạng thái</th>
                                <th className="px-6 py-3 w-[15%] text-center">Chức năng</th>
                            </tr>
                        </thead>
                        <tbody className="divide-y divide-gray-100">
                            {pagedPosts.map((post) => (
                                <tr className="hover:bg-gray-50" key={post.id}>
                                    <td className="px-6 py-4 font-bold text-gray-900">{post.id}</td>
                                    <td className="px-6 py-4">
                                        <Image
                                            src={post.image || '/placeholder.jpg'}
                                            alt={post.title}
                                            width={120}
                                            height={67}
                                            className="rounded object-cover"
                                            unoptimized
                                        />
                                    </td>
                                    <td className="px-6 py-4">
                                        <h2 className="font-bold text-gray-900 line-clamp-2">{post.title}</h2>
                                        <p className="text-gray-500 text-xs line-clamp-2">{post.description}</p>
                                    </td>
                                    <td className="px-6 py-4">{post.topic?.name || 'Chưa phân loại'}</td>
                                    <td className="px-6 py-4 text-center">
                                        {post.status === 1 ? (
                                            <span className="px-3 py-1 font-semibold rounded-full text-xs bg-green-100 text-green-800">
                                                Xuất bản
                                            </span>
                                        ) : (
                                            <span className="px-3 py-1 font-semibold rounded-full text-xs bg-yellow-100 text-yellow-800">
                                                Bản nháp
                                            </span>
                                        )}
                                    </td>
                                    <td className="px-6 py-4 flex gap-2 justify-center">
                                        <Link href={`/admin/post/show/${post.id}`} className="p-2 rounded-full hover:bg-gray-200" title="Xem">
                                            <i className="far fa-eye text-blue-500" />
                                        </Link>
                                        <Link href={`/admin/post/edit/${post.id}`} className="p-2 rounded-full hover:bg-gray-200" title="Sửa">
                                            <i className="far fa-edit text-yellow-500" />
                                        </Link>
                                        <button onClick={() => handleDelete(post.id)} className="p-2 rounded-full hover:bg-gray-200" title="Xóa">
                                            <i className="far fa-trash-alt text-red-500" />
                                        </button>
                                    </td>
                                </tr>
                            ))}
                            {postRes?.total === 0 && (
                                <tr>
                                    <td colSpan={6} className="p-8 text-center text-gray-500">Không có dữ liệu bài viết</td>
                                </tr>
                            )}
                        </tbody>
                    </table>
                </div>

                {postRes && postRes.total > postRes.per_page && (
                    <div className="mt-4 flex items-center justify-between flex-wrap gap-3">
                        <p className="text-sm text-gray-600">
                            Hiển thị {postRes.from} – {postRes.to} / {postRes.total}
                        </p>
                        <div className="flex items-center gap-2">
                            <button
                                onClick={() => setPage(page - 1)}
                                disabled={!postRes.prev_page_url}
                                className="px-3 py-1 border rounded disabled:opacity-50"
                            >
                                ← Trước
                            </button>
                            <button
                                onClick={() => setPage(page + 1)}
                                disabled={!postRes.next_page_url}
                                className="px-3 py-1 border rounded disabled:opacity-50"
                            >
                                Sau →
                            </button>
                        </div>
                    </div>
                )}
            </div>
        </div>
    )
}
