'use client'
import React, { useEffect, useState } from 'react'
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

    const [page, setPage] = useState(1)
    const [topicRes, setTopicRes] = useState(null)
    const [state, setState] = useState({ loading: true, error: null })
    const [topicData, setTopicData] = useState([]) // Renamed from pagedTopics for clarity

    const fetchData = async (pageToFetch) => {
        if (authLoading) return; // Wait for auth check

        setState({ loading: true, error: null });
        try {
            const res = await fetch(`${API_BASE}/getAdminTopic?page=${pageToFetch || 1}`, { cache: 'no-store' }); // Added cache control
            if (!res.ok) throw new Error(`Topic HTTP ${res.status}`)
            const json = await res.json()
            setTopicRes(json ?? null)
            setTopicData(Array.isArray(json?.data) ? json.data : []) // Safely access data
        } catch (e) {
            // Removed AbortError check
            setState({ loading: false, error: e.message || 'Fetch error' })
            setTopicRes(null); // Reset pagination on error
            setTopicData([]); // Clear list on error
        } finally {
            setState({ loading: false }); // Always set loading false
        }
    }

    useEffect(() => {
        fetchData(page)
    }, [page, authLoading]) // Add authLoading dependency

    const handleDelete = async (topicId) => {
        if (!user) {
            alert('Không thể xác định người dùng. Vui lòng đăng nhập lại.');
            router.push('/admin/login');
            return;
        }

        if (confirm('Bạn có chắc chắn muốn xóa topic này?')) {
            try {
                // Assuming DELETE /topic/{id} is the endpoint
                const res = await fetch(`${API_BASE}/topic/${topicId}`, {
                    method: 'DELETE',
                });
                // Treat 404 as success (already deleted)
                if (!res.ok && res.status !== 404) {
                    const errorData = await res.json().catch(() => ({}));
                    throw new Error(errorData.message || 'Xóa thất bại');
                }
                alert('Xóa thành công!');
                // Reload data, go back a page if necessary
                if (topicData.length === 1 && page > 1) {
                    setPage(page - 1);
                } else {
                    fetchData(page);
                }
            } catch (err) {
                alert(`Lỗi: ${err.message}`);
                console.error(err);
            }
        }
    };

    if (authLoading) return <div className="p-8 text-center animate-pulse">Đang xác thực quyền truy cập...</div>;


    // Skeleton UI
    if (state.loading) {
        return (
            <div className="flex flex-col min-w-0 mb-6 break-words bg-white border-0 shadow-xl rounded-2xl animate-pulse">
                <div className="p-6 pb-4 mb-0 border-b border-gray-200 rounded-t-2xl">
                    <div className="flex flex-wrap justify-between items-center mb-4 gap-4">
                        <div><div className="w-48 h-8 bg-gray-200 rounded-lg" /></div>
                        <div className="w-32 h-10 bg-gray-200 rounded-lg" />
                    </div>
                </div>
                <div className="flex-auto p-4">
                    <div className="overflow-x-auto">
                        <table className="w-full text-sm align-top text-slate-600">
                            <thead className="align-bottom">
                                <tr className="text-xs font-semibold tracking-wide text-left text-gray-500 uppercase border-b border-gray-200">
                                    <th className="px-6 py-3 w-[15%]"><div className="w-8 h-4 bg-gray-200 rounded" /></th>
                                    <th className="px-6 py-3 w-[35%]"><div className="w-40 h-4 bg-gray-200 rounded" /></th>
                                    <th className="px-6 py-3 w-[25%]"><div className="w-24 h-4 bg-gray-200 rounded" /></th>
                                    <th className="px-6 py-3 w-[25%]"><div className="w-20 h-4 bg-gray-200 rounded" /></th>
                                </tr>
                            </thead>
                            <tbody className="divide-y divide-gray-100">
                                {[...Array(10)].map((_, i) => (
                                    <tr key={i}>
                                        <td className="px-6 py-4"><div className="w-10 h-6 bg-gray-200 rounded" /></td>
                                        <td className="px-6 py-4 space-y-2">
                                            <div className="w-full h-5 bg-gray-200 rounded" />
                                            <div className="w-3/4 h-4 bg-gray-200 rounded" />
                                        </td>
                                        <td className="px-6 py-4"><div className="w-24 h-6 bg-gray-200 rounded-full mx-auto" /></td>
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
        )
    }


    return (
        <div className="flex flex-col min-w-0 mb-6 break-words bg-white border-0 shadow-xl rounded-2xl">
            <div className="p-6 pb-4 mb-0 border-b border-gray-200 rounded-t-2xl">
                <div className="flex flex-wrap justify-between items-center mb-4 gap-4">
                    <div>
                        <h6 className="text-gray-800 text-xl font-bold">Danh sách Topic</h6>
                        <nav aria-label="breadcrumb" className="text-sm font-medium text-gray-500">
                            <ol className="flex items-center space-x-1">
                                <li><Link href="/admin" className="hover:underline">Trang chủ</Link></li>
                                <li><span className="mx-1">/</span></li>
                                <li>Danh sách Topic</li>
                            </ol>
                        </nav>
                    </div>

                    <div className="flex space-x-3 items-center">
                        <Link href={"/admin/topic/create"} className="inline-flex items-center px-4 py-2 bg-indigo-600 hover:bg-indigo-700 text-white text-sm font-medium rounded-lg shadow-md hover:-translate-y-0.5 transition-transform">
                            <i className="fas fa-plus mr-2 text-base"></i> Thêm Topic</Link>

                    </div>
                </div>
            </div>

            <div className="flex-auto p-4">
                {state.error && <p className="p-4 mb-4 text-center text-red-500 bg-red-50 border border-red-200 rounded-lg">Lỗi tải dữ liệu: {state.error}</p>}
                <div className="overflow-x-auto">
                    <table className="w-full text-sm align-top text-slate-600">
                        <thead className="align-bottom">
                            <tr className="text-xs font-semibold tracking-wide text-left text-gray-500 uppercase border-b border-gray-200">
                                <th className="px-6 py-3 w-[15%]">ID</th>
                                <th className="px-6 py-3 w-[35%]">Tiêu đề / slug</th>
                                <th className="px-6 py-3 w-[25%]">Trạng thái</th>
                                <th className="px-6 py-3 w-[25%] text-center">Chức năng</th>
                            </tr>
                        </thead>
                        <tbody className="divide-y divide-gray-100">
                            {topicData?.map((topic) => (
                                <tr className="hover:bg-gray-50" key={topic.id}>
                                    <td className="px-6 py-4">
                                        <p className="font-bold text-gray-900">{topic.id}</p>
                                    </td>
                                    <td className="px-6 py-4">
                                        <h2 className="font-bold text-gray-900">{topic.name}</h2>
                                        <p className="text-gray-500 text-xs">{topic.slug}</p>
                                    </td>
                                    <td className="px-6 py-4">
                                        {topic.status === 1 ? (
                                            <span className="px-3 py-1 font-semibold rounded-full text-xs bg-green-100 text-green-800">
                                                Hoạt động
                                            </span>
                                        ) : (
                                            <span className="px-3 py-1 font-semibold rounded-full text-xs bg-yellow-100 text-yellow-800">
                                                Tạm ẩn
                                            </span>
                                        )}
                                    </td>
                                    <td className="px-6 py-4 flex gap-2 justify-center">
                                        <Link href={"/admin/topic/show/" + topic.id} className="p-2 rounded-full hover:bg-gray-200 transition-colors" title="Xem">
                                            <i className="far fa-eye text-blue-500" />
                                        </Link>
                                        <Link href={"/admin/topic/edit/" + topic.id} className="p-2 rounded-full hover:bg-gray-200 transition-colors" title="Sửa">
                                            <i className="far fa-edit text-yellow-500" />
                                        </Link>
                                        <button onClick={() => handleDelete(topic.id)} className="p-2 rounded-full hover:bg-gray-200 transition-colors" title="Xóa">
                                            <i className="far fa-trash-alt text-red-500" />
                                        </button>
                                    </td>
                                </tr>
                            ))}

                            {topicRes?.total === 0 && (
                                <tr>
                                    <td colSpan={4} className="p-8 text-center text-gray-500">Không có dữ liệu</td>
                                </tr>
                            )}
                        </tbody>
                    </table>

                </div>
                {topicRes && topicRes.total > topicRes.per_page && (
                    <div className="mt-4 flex items-center justify-between flex-wrap gap-3">
                        <p className="text-sm text-gray-600">
                            Hiển thị {topicRes.from || 0} – {topicRes.to || 0} / {topicRes.total || 0}
                        </p>
                        <div className="flex items-center gap-2">
                            <button
                                onClick={() => setPage(page - 1)}
                                disabled={!topicRes.prev_page_url}
                                className="px-3 py-1 border rounded disabled:opacity-50"
                                aria-label="Trang trước"
                            >
                                ← Trước
                            </button>

                            <button
                                onClick={() => setPage(page + 1)}
                                disabled={!topicRes.next_page_url}
                                className="px-3 py-1 border rounded disabled:opacity-50"
                                aria-label="Trang sau"
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
