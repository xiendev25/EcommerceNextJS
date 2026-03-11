'use client'
import React, { useEffect, useState } from 'react'
import Link from 'next/link'
import { useRouter } from 'next/navigation' // Thêm useRouter

const API_BASE = process.env.NEXT_PUBLIC_API_BASE_URL

const getStatusInfo = (status) => {
    return status === 1
        ? { text: 'Hiển thị', className: 'bg-green-100 text-green-800' }
        : { text: 'Tạm ẩn', className: 'bg-yellow-100 text-yellow-800' };
};

export default function Page() {
    const [user, setUser] = useState(null); // Admin user state
    const router = useRouter();
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

    const [page, setPage] = useState(1);
    const [socialRes, setSocialRes] = useState(null); // Full API response
    const [pagedSocials, setPagedSocials] = useState([]); // Data array
    const [state, setState] = useState({ loading: true, error: null }); // Data fetch state

    const fetchData = async (pageToFetch) => {
        if (authLoading) return; // Wait for auth check

        setState({ loading: true, error: null });
        try {
            const res = await fetch(`${API_BASE}/getAdminSocial?page=${pageToFetch || 1}`, { cache: 'no-store' });
            if (!res.ok) throw new Error(`Social HTTP ${res.status}`);

            const json = await res.json();
            setSocialRes(json ?? null);
            setPagedSocials(Array.isArray(json?.data) ? json.data : []); // Safely access data
        } catch (e) {
            setState({ loading: false, error: e.message || 'Fetch error' });
            setSocialRes(null); // Reset pagination on error
            setPagedSocials([]); // Clear list on error
        } finally {
            setState({ loading: false });
        }
    };

    useEffect(() => {
        fetchData(page);
    }, [page, authLoading]); // Add authLoading dependency

    const handleDelete = async (id) => {
        if (!user) {
            alert('Không thể xác định người dùng. Vui lòng đăng nhập lại.');
            router.push('/admin/login');
            return;
        }

        if (!confirm('Bạn có chắc chắn muốn xóa liên kết này?')) return;

        try {
            const res = await fetch(`${API_BASE}/social/${id}`, { method: 'DELETE' });
            // Treat 404 as success (already deleted)
            if (!res.ok && res.status !== 404) {
                const errorData = await res.json().catch(() => ({}));
                throw new Error(errorData.message || 'Xóa thất bại');
            }
            alert('Xóa liên kết thành công!');
            if (pagedSocials.length === 1 && page > 1) {
                setPage(page - 1); // Go back if last item
            } else {
                fetchData(page); // Reload current page
            }
        } catch (err) {
            alert(err.message);
            console.error(err);
        }
    }

    if (authLoading) {
        return <div className="p-8 text-center animate-pulse">Đang xác thực quyền truy cập...</div>;
    }

    // Skeleton UI
    if (state.loading) {
        return (
            <div className="flex flex-col min-w-0 mb-6 break-words bg-white border-0 shadow-xl rounded-2xl animate-pulse">
                <div className="p-6 pb-4 mb-0 border-b border-gray-200 rounded-t-2xl">
                    <div className="flex flex-wrap justify-between items-center mb-4 gap-4">
                        <div><div className="w-64 h-8 bg-gray-200 rounded-lg" /></div>
                        <div className="w-24 h-10 bg-gray-200 rounded-lg" />
                    </div>
                </div>
                <div className="flex-auto p-4">
                    <div className="overflow-x-auto">
                        <table className="w-full text-sm align-top text-slate-600">
                            <thead className="align-bottom">
                                <tr className="text-xs font-semibold tracking-wide text-left text-gray-500 uppercase border-b border-gray-200">
                                    <th className="px-6 py-3 w-[5%]"><div className="w-8 h-4 bg-gray-200 rounded"></div></th>
                                    <th className="px-6 py-3 w-[20%]"><div className="w-32 h-4 bg-gray-200 rounded"></div></th>
                                    <th className="px-6 py-3 w-[25%]"><div className="w-40 h-4 bg-gray-200 rounded"></div></th>
                                    <th className="px-6 py-3 w-[30%]"><div className="w-56 h-4 bg-gray-200 rounded"></div></th>
                                    <th className="px-6 py-3 w-[10%]"><div className="w-20 h-4 bg-gray-200 rounded"></div></th>
                                    <th className="px-6 py-3 w-[10%]"><div className="w-16 h-4 bg-gray-200 rounded"></div></th>
                                </tr>
                            </thead>
                            <tbody className="divide-y divide-gray-100">
                                {[...Array(10)].map((_, i) => (
                                    <tr key={i}>
                                        <td className="px-6 py-4"><div className="w-10 h-6 bg-gray-200 rounded" /></td>
                                        <td className="px-6 py-4 flex items-center gap-3">
                                            <div className="w-6 h-6 bg-gray-200 rounded-full" />
                                            <div className="w-24 h-5 bg-gray-200 rounded" />
                                        </td>
                                        <td className="px-6 py-4"><div className="w-32 h-5 bg-gray-200 rounded" /></td>
                                        <td className="px-6 py-4"><div className="w-full h-5 bg-gray-200 rounded" /></td>
                                        <td className="px-6 py-4"><div className="w-24 h-6 bg-gray-200 rounded-full mx-auto" /></td>
                                        <td className="px-6 py-4 flex gap-2 justify-center">
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
                        <h6 className="text-gray-800 text-xl font-bold">Liên kết Mạng xã hội</h6>
                        <nav aria-label="breadcrumb" className="text-sm font-medium text-gray-500">
                            <ol className="flex items-center space-x-1">
                                <li><Link href="/admin" className="hover:underline">Trang chủ</Link></li>
                                <li><span className="mx-1">/</span></li>
                                <li>Liên kết MXH</li>
                            </ol>
                        </nav>
                    </div>
                    <div className="flex space-x-3 items-center">
                        <Link href="/admin/social/create" className="inline-flex items-center px-4 py-2 bg-indigo-600 hover:bg-indigo-700 text-white text-sm font-medium rounded-lg shadow-md">
                            <i className="fas fa-plus mr-2"></i> Thêm mới
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
                                <th className="px-6 py-3 w-[20%]">Mạng xã hội</th>
                                <th className="px-6 py-3 w-[25%]">Tên hiển thị</th>
                                <th className="px-6 py-3 w-[30%]">Đường dẫn</th>
                                <th className="px-6 py-3 w-[10%] text-center">Trạng thái</th>
                                <th className="px-6 py-3 w-[10%] text-center">Chức năng</th>
                            </tr>
                        </thead>
                        <tbody className="divide-y divide-gray-100">
                            {pagedSocials.map((social) => {
                                const statusInfo = getStatusInfo(social.status);
                                // More robust link joining
                                const baseLink = social.social_icon?.link || '';
                                const usernamePart = social.username || '';
                                let fullLink = '';
                                try {
                                    // Try creating URL objects for safer joining
                                    const baseUrl = new URL(baseLink);
                                    // Append username, removing leading/trailing slashes from username if necessary
                                    fullLink = new URL(usernamePart.replace(/^\/+|\/+$/g, ''), baseUrl).href;
                                } catch {
                                    // Fallback for invalid baseLink or simple concatenation
                                    fullLink = baseLink.endsWith('/')
                                        ? `${baseLink}${usernamePart}`
                                        : `${baseLink}/${usernamePart}`;
                                }


                                return (
                                    <tr className="hover:bg-gray-50" key={social.id}>
                                        <td className="px-6 py-4 font-bold text-gray-900">{social.id}</td>
                                        <td className="px-6 py-4">
                                            <div className="flex items-center gap-3">
                                                {social.social_icon?.icon && <i className={`${social.social_icon.icon} text-xl w-6 text-center text-gray-600`}></i>}
                                                <span className="font-semibold text-gray-800">{social.social_icon?.name || 'N/A'}</span>
                                            </div>
                                        </td>
                                        <td className="px-6 py-4">{social.title}</td>
                                        <td className="px-6 py-4">
                                            {fullLink ? (
                                                <a href={fullLink} target="_blank" rel="noopener noreferrer" className="text-blue-600 hover:underline truncate block max-w-xs" title={fullLink}>
                                                    {fullLink}
                                                </a>
                                            ) : (
                                                <span className="text-gray-400 italic">Link không hợp lệ</span>
                                            )}
                                        </td>
                                        <td className="px-6 py-4 text-center">
                                            <span className={`px-3 py-1 font-semibold rounded-full text-xs ${statusInfo.className}`}>
                                                {statusInfo.text}
                                            </span>
                                        </td>
                                        <td className="px-6 py-4 flex gap-2 justify-center">
                                            <Link href={`/admin/social/edit/${social.id}`} className="p-2 rounded-full hover:bg-gray-200" title="Sửa">
                                                <i className="far fa-edit text-yellow-500" />
                                            </Link>
                                            <button onClick={() => handleDelete(social.id)} className="p-2 rounded-full hover:bg-gray-200" title="Xóa">
                                                <i className="far fa-trash-alt text-red-500" />
                                            </button>
                                        </td>
                                    </tr>
                                );
                            })}
                            {socialRes?.total === 0 && (
                                <tr>
                                    <td colSpan={6} className="p-8 text-center text-gray-500">Chưa có liên kết nào.</td>
                                </tr>
                            )}
                        </tbody>
                    </table>
                </div>

                {/* Phân trang */}
                {socialRes && socialRes.total > socialRes.per_page && (
                    <div className="mt-4 flex items-center justify-between flex-wrap gap-3">
                        <p className="text-sm text-gray-600">Hiển thị {socialRes.from || 0} – {socialRes.to || 0} / {socialRes.total || 0} mục</p>
                        <div className="flex items-center gap-2">
                            <button onClick={() => setPage(page - 1)} disabled={!socialRes.prev_page_url} className="px-3 py-1 border rounded disabled:opacity-50">← Trước</button>
                            <button onClick={() => setPage(page + 1)} disabled={!socialRes.next_page_url} className="px-3 py-1 border rounded disabled:opacity-50">Sau →</button>
                        </div>
                    </div>
                )}
            </div>
        </div>
    )
}
