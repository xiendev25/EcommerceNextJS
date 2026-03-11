'use client'
import React, { useEffect, useState } from 'react'
import Link from 'next/link'
import { useRouter } from 'next/navigation'

const API_BASE = process.env.NEXT_PUBLIC_API_BASE_URL

const formatCurrency = (value) => {
    if (!value) return '0 ₫';
    const number = parseFloat(value);
    if (isNaN(number)) return '0 ₫';
    return new Intl.NumberFormat('vi-VN', { style: 'currency', currency: 'VND' }).format(number);
};

const getOrderStatus = (status) => {
    switch (status) {
        case 0:
            return { text: 'Đã hủy', className: 'bg-red-100 text-red-800' };
        case 1:
            return { text: 'Chờ xử lý', className: 'bg-yellow-100 text-yellow-800' };
        case 2:
            return { text: 'Đang giao hàng', className: 'bg-blue-100 text-blue-800' };
        case 3:
            return { text: 'Đã giao', className: 'bg-green-100 text-green-800' };
        case 4:
            return { text: 'Hoàn trả', className: 'bg-purple-100 text-purple-800' };
        default:
            return { text: 'Không xác định', className: 'bg-gray-100 text-gray-800' };
    }
};


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
    const [orderRes, setOrderRes] = useState(null);
    const [pagedOrders, setPagedOrders] = useState([]);
    const [state, setState] = useState({ loading: true, error: null });

    const fetchData = async (pageToFetch) => {
        if (authLoading) return;

        setState({ loading: true, error: null });
        try {
            const res = await fetch(`${API_BASE}/getAdminOrder?page=${pageToFetch || 1}`, { cache: 'no-store' });
            if (!res.ok) throw new Error(`Order HTTP ${res.status}`);

            const json = await res.json();
            setOrderRes(json ?? null);
            setPagedOrders(Array.isArray(json.data) ? json.data : []);
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

        if (!confirm('Bạn có chắc chắn muốn xóa đơn hàng này? Thao tác này không thể hoàn tác.')) return;

        try {
            const res = await fetch(`${API_BASE}/order/${id}`, { method: 'DELETE' });
            if (!res.ok && res.status !== 404) {
                const errorData = await res.json().catch(() => ({}));
                throw new Error(errorData.message || 'Xóa thất bại');
            }

            alert('Xóa đơn hàng thành công!');
            if (pagedOrders.length === 1 && page > 1) {
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
                    </div>
                </div>
                <div className="flex-auto p-4">
                    <div className="overflow-x-auto">
                        <table className="w-full text-sm align-top text-slate-600">
                            <thead className="align-bottom">
                                <tr className="text-xs font-semibold tracking-wide text-left text-gray-500 uppercase border-b border-gray-200">
                                    <th className="px-6 py-3 w-[10%]"><div className="w-12 h-4 bg-gray-200 rounded"></div></th>
                                    <th className="px-6 py-3 w-[25%]"><div className="w-32 h-4 bg-gray-200 rounded"></div></th>
                                    <th className="px-6 py-3 w-[15%]"><div className="w-24 h-4 bg-gray-200 rounded"></div></th>
                                    <th className="px-6 py-3 w-[15%]"><div className="w-20 h-4 bg-gray-200 rounded"></div></th>
                                    <th className="px-6 py-3 w-[15%]"><div className="w-24 h-4 bg-gray-200 rounded"></div></th>
                                    <th className="px-6 py-3 w-[10%]"><div className="w-20 h-4 bg-gray-200 rounded"></div></th>
                                </tr>
                            </thead>
                            <tbody className="divide-y divide-gray-100">
                                {[...Array(10)].map((_, i) => (
                                    <tr key={i}>
                                        <td className="px-6 py-4"><div className="w-12 h-6 bg-gray-200 rounded" /></td>
                                        <td className="px-6 py-4 space-y-2">
                                            <div className="w-40 h-5 bg-gray-200 rounded" />
                                            <div className="w-32 h-4 bg-gray-200 rounded" />
                                            <div className="w-full h-4 bg-gray-200 rounded" />
                                        </td>
                                        <td className="px-6 py-4"><div className="w-24 h-5 bg-gray-200 rounded" /></td>
                                        <td className="px-6 py-4"><div className="w-20 h-6 bg-gray-200 rounded" /></td>
                                        <td className="px-6 py-4"><div className="w-24 h-6 bg-gray-200 rounded-full" /></td>
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
                        <h6 className="text-gray-800 text-xl font-bold">Danh sách Đơn hàng</h6>
                        <nav aria-label="breadcrumb" className="text-sm font-medium text-gray-500">
                            <ol className="flex items-center space-x-1">
                                <li><Link href="/admin" className="hover:underline">Trang chủ</Link></li>
                                <li><span className="mx-1">/</span></li>
                                <li>Đơn hàng</li>
                            </ol>
                        </nav>
                    </div>
                </div>
            </div>

            <div className="flex-auto p-4">
                {state.error && <p className="p-4 mb-4 text-center text-red-500 bg-red-50 border border-red-200 rounded-lg">Lỗi tải dữ liệu: {state.error}</p>}
                <div className="overflow-x-auto">
                    <table className="w-full text-sm align-top text-slate-600">
                        <thead className="align-bottom">
                            <tr className="text-xs font-semibold tracking-wide text-left text-gray-500 uppercase border-b border-gray-200">
                                <th className="px-6 py-3 w-[10%]">Mã ĐH</th>
                                <th className="px-6 py-3 w-[25%]">Khách hàng</th>
                                <th className="px-6 py-3 w-[15%]">Ngày đặt</th>
                                <th className="px-6 py-3 w-[15%] text-right">Tổng tiền</th>
                                <th className="px-6 py-3 w-[15%] text-center">Trạng thái</th>
                                <th className="px-6 py-3 w-[10%] text-center">Chức năng</th>
                            </tr>
                        </thead>
                        <tbody className="divide-y divide-gray-100">
                            {pagedOrders.map((order) => {
                                const totalAmount = Array.isArray(order.order_detail)
                                    ? order.order_detail.reduce((sum, item) => sum + parseFloat(item.amount || 0), 0)
                                    : 0;
                                const statusInfo = getOrderStatus(order.status);
                                return (
                                    <tr className="hover:bg-gray-50" key={order.id}>
                                        <td className="px-6 py-4">
                                            <p className="font-bold text-indigo-600">#{order.id}</p>
                                        </td>
                                        <td className="px-6 py-4">
                                            <p className="font-semibold text-gray-900">{order.name}</p>
                                            <p className="text-xs text-gray-600">{order.phone}</p>
                                            <p className="text-xs text-gray-500 truncate">{order.address}</p>
                                        </td>
                                        <td className="px-6 py-4 text-xs">
                                            {new Date(order.created_at).toLocaleDateString('vi-VN', {
                                                day: '2-digit', month: '2-digit', year: 'numeric'
                                            })}
                                        </td>
                                        <td className="px-6 py-4 font-semibold text-right">
                                            {formatCurrency(totalAmount)}
                                        </td>
                                        <td className="px-6 py-4 text-center">
                                            <span className={`px-3 py-1 font-semibold rounded-full text-xs ${statusInfo.className}`}>
                                                {statusInfo.text}
                                            </span>
                                        </td>
                                        <td className="px-6 py-4 flex gap-2 justify-center">
                                            <Link href={`/admin/order/show/${order.id}`} className="p-2 rounded-full hover:bg-gray-200" title="Xem chi tiết">
                                                <i className="far fa-eye text-blue-500" />
                                            </Link>
                                            <button onClick={() => handleDelete(order.id)} className="p-2 rounded-full hover:bg-gray-200" title="Xóa">
                                                <i className="far fa-trash-alt text-red-500" />
                                            </button>
                                        </td>
                                    </tr>
                                );
                            })}
                            {orderRes?.total === 0 && (
                                <tr>
                                    <td colSpan={6} className="p-8 text-center text-gray-500">Không có đơn hàng nào.</td>
                                </tr>
                            )}
                        </tbody>
                    </table>
                </div>

                {orderRes && orderRes.total > orderRes.per_page && (
                    <div className="mt-4 flex items-center justify-between flex-wrap gap-3">
                        <p className="text-sm text-gray-600">
                            Hiển thị {orderRes.from} – {orderRes.to} / {orderRes.total}
                        </p>
                        <div className="flex items-center gap-2">
                            <button
                                onClick={() => setPage(page - 1)}
                                disabled={!orderRes.prev_page_url}
                                className="px-3 py-1 border rounded disabled:opacity-50"
                            >← Trước</button>
                            <button
                                onClick={() => setPage(page + 1)}
                                disabled={!orderRes.next_page_url}
                                className="px-3 py-1 border rounded disabled:opacity-50"
                            >Sau →</button>
                        </div>
                    </div>
                )}
            </div>
        </div>
    )
}
