'use client'
import React, { useEffect, useState } from 'react'
import Image from 'next/image'
import Link from 'next/link'
import { useRouter } from 'next/navigation'

const API_BASE = process.env.NEXT_PUBLIC_API_BASE_URL

// --- Helper Functions ---
const getUserStatus = (status) => {
    return status === 1
        ? { text: 'Hoạt động', className: 'bg-green-100 text-green-800' }
        : { text: 'Bị khóa', className: 'bg-red-100 text-red-800' };
};

const getUserRole = (role) => {
    return role === 'admin'
        ? { text: 'Admin', className: 'bg-purple-100 text-purple-800' }
        : { text: 'Customer', className: 'bg-blue-100 text-blue-800' };
};

export default function Page() {
    // State 'user' for the logged-in admin
    const [user, setUser] = useState(null);
    const router = useRouter();
    const [authLoading, setAuthLoading] = useState(true);

    useEffect(() => {
        const verifyAdmin = async () => { // Changed function name
            setAuthLoading(true);
            const token = localStorage.getItem('token');
            if (!token) {
                router.replace('/admin/login');
                return;
            }
            try {
                const res = await fetch(`${API_BASE}/verifyAdmin`, { // Use verifyAdmin endpoint
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
                setUser(adminData); // Set logged-in admin user data
            } catch (e) {
                console.error("Lỗi xác thực:", e);
                localStorage.removeItem('token');
                localStorage.removeItem('user');
                router.replace('/admin/login');
            } finally {
                setAuthLoading(false);
            }
        };
        verifyAdmin(); // Call the correct function
    }, [router]);


    const [page, setPage] = useState(1);
    const [userRes, setUserRes] = useState(null); // Full API response
    const [pagedUsers, setPagedUsers] = useState([]); // Data array for current page
    const [state, setState] = useState({ loading: true, error: null }); // Data fetch state

    const fetchData = async (pageToFetch) => {
        if (authLoading) return; // Wait for auth check

        setState({ loading: true, error: null });
        try {
            const res = await fetch(`${API_BASE}/getAdminUser?page=${pageToFetch || 1}`, { cache: 'no-store' });
            if (!res.ok) throw new Error(`User HTTP ${res.status}`);
            const json = await res.json();
            setUserRes(json ?? null);
            setPagedUsers(Array.isArray(json?.data) ? json.data : []); // Safely access data
        } catch (e) {
            setState({ loading: false, error: e.message || 'Fetch error' });
            setUserRes(null); // Reset pagination on error
            setPagedUsers([]); // Clear list on error
        } finally {
            setState({ loading: false });
        }
    };

    useEffect(() => {
        fetchData(page);
    }, [page, authLoading]); // Add authLoading dependency

    const handleDelete = async (userToDelete) => {
        if (!user) { // Check logged-in admin user state
            alert('Không thể xác định người dùng admin. Vui lòng đăng nhập lại.');
            router.push('/admin/login');
            return;
        }

        if (user.id === userToDelete.id) { // Prevent self-deletion
            alert('Bạn không thể xóa chính mình.');
            return;
        }

        if (!confirm(`Bạn có chắc chắn muốn xóa người dùng "${userToDelete.name}"?`)) return;
        try {
            // Delete avatar first if exists
            if (userToDelete.avatar) {
                try {
                    // Assume API endpoint for deletion by path exists
                    await fetch(`${API_BASE}/delete-image`, { // Use the correct endpoint
                        method: 'DELETE',
                        headers: { 'Content-Type': 'application/json' },
                        body: JSON.stringify({ filePath: userToDelete.avatar }), // Send the path
                    });
                } catch (imgErr) {
                    console.warn("Could not delete avatar, proceeding with user deletion:", imgErr);
                }
            }
            // Delete user record
            const res = await fetch(`${API_BASE}/user/${userToDelete.id}`, { method: 'DELETE' });
            // Treat 404 as success
            if (!res.ok && res.status !== 404) {
                const errorData = await res.json().catch(() => ({}));
                throw new Error(errorData.message || 'Xóa thất bại');
            }
            alert('Xóa người dùng thành công!');
            // Reload data
            if (pagedUsers.length === 1 && page > 1) {
                setPage(page - 1);
            } else {
                fetchData(page);
            }
        } catch (err) {
            alert(err.message || 'Lỗi không xác định khi xóa');
            console.error(err);
        }
    }

    if (authLoading) return <div className="p-8 text-center animate-pulse">Đang xác thực quyền truy cập...</div>;

    // Skeleton UI
    if (state.loading) return (
        <div className="flex flex-col min-w-0 mb-6 break-words bg-white border-0 shadow-xl rounded-2xl animate-pulse">
            <div className="p-6 pb-4 mb-0 border-b border-gray-200 rounded-t-2xl">
                <div className="flex flex-wrap justify-between items-center mb-4 gap-4">
                    <div><div className="w-48 h-8 bg-gray-200 rounded-lg" /></div>
                    <div className="w-24 h-10 bg-gray-200 rounded-lg" />
                </div>
            </div>
            <div className="flex-auto p-4">
                <div className="overflow-x-auto">
                    <table className="w-full text-sm align-top text-slate-600">
                        <thead className="align-bottom">
                            <tr className="text-xs font-semibold tracking-wide text-left text-gray-500 uppercase border-b border-gray-200">
                                <th className="px-6 py-3 w-[25%]"><div className="w-24 h-4 bg-gray-200 rounded"></div></th>
                                <th className="px-6 py-3 w-[25%]"><div className="w-32 h-4 bg-gray-200 rounded"></div></th>
                                <th className="px-6 py-3 w-[15%]"><div className="w-20 h-4 bg-gray-200 rounded"></div></th>
                                <th className="px-6 py-3 w-[15%]"><div className="w-16 h-4 bg-gray-200 rounded"></div></th>
                                <th className="px-6 py-3 w-[10%]"><div className="w-16 h-4 bg-gray-200 rounded"></div></th>
                                <th className="px-6 py-3 w-[10%]"><div className="w-16 h-4 bg-gray-200 rounded"></div></th>
                            </tr>
                        </thead>
                        <tbody className="divide-y divide-gray-100">
                            {[...Array(10)].map((_, i) => (
                                <tr key={i}>
                                    <td className="px-6 py-4 flex items-center gap-4">
                                        <div className="w-10 h-10 bg-gray-200 rounded-full" />
                                        <div className="w-32 h-5 bg-gray-200 rounded" />
                                    </td>
                                    <td className="px-6 py-4 space-y-1">
                                        <div className="w-40 h-4 bg-gray-200 rounded" />
                                        <div className="w-24 h-4 bg-gray-200 rounded" />
                                    </td>
                                    <td className="px-6 py-4"><div className="w-20 h-4 bg-gray-200 rounded" /></td>
                                    <td className="px-6 py-4"><div className="w-20 h-6 bg-gray-200 rounded-full mx-auto" /></td>
                                    <td className="px-6 py-4"><div className="w-20 h-6 bg-gray-200 rounded-full mx-auto" /></td>
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

    return (
        <div className="flex flex-col min-w-0 mb-6 break-words bg-white border-0 shadow-xl rounded-2xl">
            <div className="p-6 pb-4 mb-0 border-b border-gray-200 rounded-t-2xl">
                <div className="flex flex-wrap justify-between items-center mb-4 gap-4">
                    <div><h6 className="text-gray-800 text-xl font-bold">Quản lý Người dùng</h6></div>
                    <div>
                        <Link href="/admin/user/create" className="inline-flex items-center px-4 py-2 bg-indigo-600 hover:bg-indigo-700 text-white text-sm font-medium rounded-lg shadow-md">
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
                                <th className="px-6 py-3 w-[25%]">Người dùng</th>
                                <th className="px-6 py-3 w-[25%]">Thông tin liên hệ</th>
                                <th className="px-6 py-3 w-[15%]">Username</th>
                                <th className="px-6 py-3 w-[15%] text-center">Vai trò</th>
                                <th className="px-6 py-3 w-[10%] text-center">Trạng thái</th>
                                <th className="px-6 py-3 w-[10%] text-center">Chức năng</th>
                            </tr>
                        </thead>
                        <tbody className="divide-y divide-gray-100">
                            {pagedUsers.map((userItem) => {
                                const statusInfo = getUserStatus(userItem.status);
                                const roleInfo = getUserRole(userItem.role);
                                const isAdminCurrentUser = user?.id === userItem.id; // Use 'user' state

                                return (
                                    <tr className="hover:bg-gray-50" key={userItem.id}>
                                        <td className="px-6 py-4">
                                            <div className="flex items-center gap-4">
                                                {userItem.avatar ? (
                                                    <Image src={userItem.avatar} alt={userItem.name} width={40} height={40} className="h-10 w-10 rounded-full object-cover border" unoptimized />
                                                ) : (
                                                    <div className="h-10 w-10 rounded-full bg-gray-200 flex items-center justify-center border">
                                                        <i className="fas fa-user text-gray-500"></i>
                                                    </div>
                                                )}
                                                <p className="font-semibold text-gray-800">{userItem.name}</p>
                                            </div>
                                        </td>
                                        <td className="px-6 py-4 text-xs">
                                            <p className="text-gray-800">{userItem.email}</p>
                                            <p className="text-gray-500">{userItem.phone || 'N/A'}</p>
                                        </td>
                                        <td className="px-6 py-4 font-mono text-xs">{userItem.username}</td>
                                        <td className="px-6 py-4 text-center">
                                            <span className={`px-3 py-1 font-semibold rounded-full text-xs ${roleInfo.className}`}>{roleInfo.text}</span>
                                        </td>
                                        <td className="px-6 py-4 text-center">
                                            <span className={`px-3 py-1 font-semibold rounded-full text-xs ${statusInfo.className}`}>{statusInfo.text}</span>
                                        </td>
                                        <td className="px-6 py-4 flex gap-2 justify-center">
                                            <Link href={`/admin/user/show/${userItem.id}`} className="p-2 rounded-full hover:bg-gray-200" title="Xem chi tiết"><i className="far fa-eye text-blue-500" /></Link>
                                            <Link href={`/admin/user/edit/${userItem.id}`} className="p-2 rounded-full hover:bg-gray-200" title="Sửa"><i className="far fa-edit text-yellow-500" /></Link>
                                            <button
                                                onClick={() => handleDelete(userItem)}
                                                disabled={isAdminCurrentUser} // Disable based on comparison
                                                className={`p-2 rounded-full hover:bg-gray-200 ${isAdminCurrentUser ? 'opacity-50 cursor-not-allowed' : ''}`}
                                                title={isAdminCurrentUser ? "Không thể xóa chính mình" : "Xóa"}
                                            >
                                                <i className="far fa-trash-alt text-red-500" />
                                            </button>
                                        </td>
                                    </tr>
                                );
                            })}
                            {userRes?.total === 0 && (
                                <tr>
                                    <td colSpan={6} className="p-8 text-center text-gray-500">Không có người dùng nào.</td>
                                </tr>
                            )}
                        </tbody>
                    </table>
                </div>

                {userRes && userRes.total > userRes.per_page && (
                    <div className="mt-4 flex items-center justify-between flex-wrap gap-3">
                        <p className="text-sm text-gray-600">
                            Hiển thị {userRes.from || 0} – {userRes.to || 0} trên tổng số {userRes.total || 0} người dùng
                        </p>
                        <div className="flex items-center gap-2">
                            <button
                                onClick={() => setPage(page - 1)}
                                disabled={!userRes.prev_page_url}
                                className="px-3 py-1 border rounded disabled:opacity-50 disabled:cursor-not-allowed"
                                aria-label="Trang trước"
                            >
                                ← Trước
                            </button>
                            {/* Simple Prev/Next pagination - Can add page numbers if needed */}
                            <button
                                onClick={() => setPage(page + 1)}
                                disabled={!userRes.next_page_url}
                                className="px-3 py-1 border rounded disabled:opacity-50 disabled:cursor-not-allowed"
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

