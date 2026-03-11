'use client'
import React, { useEffect, useState, useMemo } from 'react'
import Link from 'next/link'
import { useRouter } from 'next/navigation'

const API_BASE = process.env.NEXT_PUBLIC_API_BASE_URL

function paginate(array, page = 1, pageSize = 10) {
    const totalItems = array.length
    const totalPages = Math.max(1, Math.ceil(totalItems / pageSize))
    const currentPage = Math.min(Math.max(page, 1), totalPages)
    const start = (currentPage - 1) * pageSize
    const end = start + pageSize
    return {
        items: array.slice(start, end),
        page: currentPage,
        pageSize,
        totalItems,
        totalPages,
        hasPrev: currentPage > 1,
        hasNext: currentPage < totalPages,
    }
}

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

    const [menuData, setMenuData] = useState([])
    const [state, setState] = useState({ loading: true, error: null })
    const [page, setPage] = useState(1)
    const pageSize = 10;

    const fetchData = async () => {
        if (authLoading) return;

        setState({ loading: true, error: null });
        try {
            const res = await fetch(`${API_BASE}/menu`)
            if (!res.ok) throw new Error(`menu HTTP ${res.status}`)
            const json = await res.json()
            setMenuData(Array.isArray(json) ? json : [])
        } catch (e) {
            setState({ loading: false, error: e.message || 'Fetch error' })
        } finally {
            setState({ loading: false });
        }
    };

    useEffect(() => {
        fetchData()
    }, [authLoading])
    const paginatedData = useMemo(() => paginate(menuData, page, pageSize), [menuData, page, pageSize]);

    useEffect(() => {
        if (paginatedData.page !== page) {
            setPage(paginatedData.page);
        }
    }, [paginatedData.page, page]);


    const handleDelete = async (menuId) => {
        if (!user) {
            alert('Không thể xác định người dùng. Vui lòng đăng nhập lại.');
            router.push('/admin/login');
            return;
        }

        if (confirm('Bạn có chắc chắn muốn xóa menu này?')) {
            try {
                const res = await fetch(`${API_BASE}/menu/${menuId}`, {
                    method: 'DELETE',
                });
                if (!res.ok) {
                    const errorData = await res.json().catch(() => ({}));
                    throw new Error(errorData.message || 'Xóa thất bại');
                }
                alert('Xóa thành công!');
                fetchData();
                if (paginatedData.items.length === 1 && page > 1) {
                    setPage(page - 1);
                }

            } catch (err) {
                alert(`Lỗi: ${err.message}`);
                console.error(err);
            }
        }
    };


    if (authLoading) {
        return <div className="p-8 text-center animate-pulse">Đang xác thực quyền truy cập...</div>;
    }

    if (state.loading) {
        return (
            <div className="flex flex-col min-w-0 mb-6 break-words bg-white border-0 shadow-xl rounded-2xl animate-pulse">
                <div className="p-6 pb-4 mb-0 border-b border-gray-200 rounded-t-2xl">
                    <div className="flex flex-wrap justify-between items-center mb-4 gap-4">
                        <div><div className="w-50 h-10 bg-gray-200 rounded-lg" /></div>
                        <div className="flex space-x-3 items-center">
                            <div className="w-30 h-10 bg-gray-200 rounded-lg" />
                        </div>
                    </div>
                </div>
                <div className="flex-auto p-4">
                    <div className="overflow-x-auto">
                        <table className="w-full text-sm align-top text-slate-600">
                            <thead className="align-bottom">
                                <tr className="text-xs font-semibold tracking-wide text-left text-gray-500 uppercase border-b border-gray-200">
                                    <th className="px-6 py-3 w-[5%]"><div className="w-8 h-4 bg-gray-200 rounded"></div></th>
                                    <th className="px-6 py-3 w-[20%]"><div className="w-24 h-4 bg-gray-200 rounded"></div></th>
                                    <th className="px-6 py-3 w-[20%]"><div className="w-32 h-4 bg-gray-200 rounded"></div></th>
                                    <th className="px-6 py-3 w-[20%]"><div className="w-24 h-4 bg-gray-200 rounded"></div></th>
                                    <th className="px-6 py-3 w-[15%]"><div className="w-20 h-4 bg-gray-200 rounded"></div></th>
                                    <th className="px-6 py-3 w-[20%]"><div className="w-24 h-4 bg-gray-200 rounded"></div></th>
                                </tr>
                            </thead>
                            <tbody className="divide-y divide-gray-100">
                                {[...Array(pageSize)].map((_, i) => (
                                    <tr key={i}>
                                        <td className="px-6 py-4"><div className="w-10 h-6 bg-gray-200 rounded" /></td>
                                        <td className="px-6 py-4 space-y-1">
                                            <div className="w-32 h-5 bg-gray-200 rounded" />
                                            <div className="w-16 h-4 bg-gray-200 rounded" />
                                        </td>
                                        <td className="px-6 py-4"><div className="w-40 h-5 bg-gray-200 rounded" /></td>
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
        )
    }


    return (
        <div className="flex flex-col min-w-0 mb-6 break-words bg-white border-0 shadow-xl rounded-2xl">
            <div className="p-6 pb-4 mb-0 border-b border-gray-200 rounded-t-2xl">
                <div className="flex flex-wrap justify-between items-center mb-4 gap-4">
                    <div>
                        <h6 className="text-gray-800 text-xl font-bold">Danh sách menu</h6>
                        <nav aria-label="breadcrumb" className="text-sm font-medium text-gray-500">
                            <ol className="flex items-center space-x-1">
                                <li><Link href="/admin" className="hover:underline">Trang chủ</Link></li>
                                <li><span className="mx-1">/</span></li>
                                <li>Danh sách menu</li>
                            </ol>
                        </nav>
                    </div>

                    <div className="flex space-x-3 items-center">
                        <Link href={"/admin/menu/create"} className="inline-flex items-center px-4 py-2 bg-indigo-600 hover:bg-indigo-700 text-white text-sm font-medium rounded-lg shadow-md hover:-translate-y-0.5 transition-transform">
                            <i className="fas fa-plus mr-2 text-base"></i> Thêm </Link>

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
                                <th className="px-6 py-3 w-[20%]">Tên / Loại</th>
                                <th className="px-6 py-3 w-[20%]">Liên kết</th>
                                <th className="px-6 py-3 w-[20%]">Danh mục Cha</th>
                                <th className="px-6 py-3 w-[15%] text-center">Trạng thái</th>
                                <th className="px-6 py-3 w-[20%] text-center">Chức năng</th>
                            </tr>
                        </thead>
                        <tbody className="divide-y divide-gray-100">
                            {paginatedData.items.map((menu) => (
                                <tr className="hover:bg-gray-50" key={menu.id}>
                                    <td className="px-6 py-4">
                                        <p className="font-bold text-gray-900">{menu.id}</p>
                                    </td>
                                    <td className="px-6 py-4">
                                        <h2 className="font-bold text-gray-900">{menu.name}</h2>
                                        <p className="text-gray-500 text-xs capitalize">{menu.type}</p>
                                    </td>
                                    <td className="px-6 py-4">
                                        <Link href={menu.link || '#'} target="_blank" className="text-indigo-600 hover:underline text-xs break-all">
                                            {menu.link}
                                        </Link>
                                    </td>
                                    <td className="px-6 py-4">
                                        <p className="text-gray-500">{menu.parent_id === 0 ? '—' : (menuData.find(m => m.id === menu.parent_id)?.name || 'Không rõ')}</p>
                                    </td>
                                    <td className="px-6 py-4 text-center">
                                        {menu.status === 1 ? (
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
                                        <Link href={"/admin/menu/show/" + menu.id} className="p-2 rounded-full hover:bg-gray-200 transition-colors" title="Xem">
                                            <i className="far fa-eye text-blue-500" />
                                        </Link>
                                        <Link href={"/admin/menu/edit/" + menu.id} className="p-2 rounded-full hover:bg-gray-200 transition-colors" title="Sửa">
                                            <i className="far fa-edit text-yellow-500" />
                                        </Link>
                                        <button onClick={() => handleDelete(menu.id)} className="p-2 rounded-full hover:bg-gray-200 transition-colors" title="Xóa">
                                            <i className="far fa-trash-alt text-red-500" />
                                        </button>
                                    </td>
                                </tr>
                            ))}

                            {paginatedData.totalItems === 0 && (
                                <tr>
                                    <td colSpan={6} className="p-8 text-center text-gray-500">Không có dữ liệu</td>
                                </tr>
                            )}
                        </tbody>
                    </table>
                </div>

                {paginatedData.totalItems > pageSize && (
                    <div className="mt-4 flex items-center justify-between flex-wrap gap-3">
                        <p className="text-sm text-gray-600">
                            Hiển thị {paginatedData.totalItems === 0 ? 0 : (paginatedData.page - 1) * paginatedData.pageSize + 1}
                            –
                            {Math.min(paginatedData.page * paginatedData.pageSize, paginatedData.totalItems)}
                            /{paginatedData.totalItems}
                        </p>

                        <div className="flex items-center gap-2">
                            <button
                                onClick={() => setPage(paginatedData.page - 1)}
                                disabled={!paginatedData.hasPrev}
                                className="px-3 py-1 border rounded disabled:opacity-50"
                                aria-label="Trang trước"
                            >
                                ← Trước
                            </button>
                            <span className="text-sm font-medium">
                                Trang {paginatedData.page} / {paginatedData.totalPages}
                            </span>
                            <button
                                onClick={() => setPage(paginatedData.page + 1)}
                                disabled={!paginatedData.hasNext}
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
