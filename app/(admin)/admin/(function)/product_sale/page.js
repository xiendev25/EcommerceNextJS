'use client'
import React, { useEffect, useState } from 'react'
import Link from 'next/link'
import Image from 'next/image'
import { useRouter } from 'next/navigation' // Thêm useRouter

const API_BASE = process.env.NEXT_PUBLIC_API_BASE_URL

const formatCurrency = (value) => {
    const number = parseFloat(value);
    if (isNaN(number)) return '0 ₫';
    return new Intl.NumberFormat('vi-VN', { style: 'currency', currency: 'VND' }).format(number);
};

const formatDateTime = (dateString) => {
    if (!dateString) return '';
    try {
        // Assume UTC or correct local time string from DB
        const date = new Date(dateString.replace(' ', 'T') + 'Z');
        if (isNaN(date.getTime())) {
            // Fallback if 'Z' fails
            const localDate = new Date(dateString.replace(' ', 'T'));
            if (isNaN(localDate.getTime())) return 'Ngày không hợp lệ';
            date.setTime(localDate.getTime());
        }
        return date.toLocaleString('vi-VN', {
            day: '2-digit', month: '2-digit', year: 'numeric',
            hour: '2-digit', minute: '2-digit'
        });
    } catch {
        return 'Ngày không hợp lệ';
    }
};


const getSaleStatus = (sale) => {
    // Check internal status first
    if (sale.status === 0) {
        return { text: 'Tạm ẩn', className: 'bg-gray-100 text-gray-800' };
    }
    // Then check dates
    try {
        const now = new Date();
        const startDate = new Date(sale.date_begin.replace(' ', 'T') + 'Z'); // Assume UTC or correct local
        const endDate = new Date(sale.date_end.replace(' ', 'T') + 'Z');   // Assume UTC or correct local
        if (isNaN(startDate.getTime()) || isNaN(endDate.getTime())) {
            return { text: 'Lỗi ngày', className: 'bg-red-100 text-red-800' };
        }


        if (now < startDate) {
            return { text: 'Sắp diễn ra', className: 'bg-blue-100 text-blue-800' };
        } else if (now > endDate) {
            return { text: 'Đã kết thúc', className: 'bg-red-100 text-red-800' };
        } else {
            return { text: 'Đang diễn ra', className: 'bg-green-100 text-green-800' };
        }
    } catch {
        return { text: 'Lỗi ngày', className: 'bg-red-100 text-red-800' };
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
    const [saleRes, setSaleRes] = useState(null); // Full API response with pagination
    const [pagedSales, setPagedSales] = useState([]); // Just the data array
    const [state, setState] = useState({ loading: true, error: null });

    const fetchData = async (pageToFetch) => {
        if (authLoading) return; // Wait for auth check

        setState({ loading: true, error: null });
        try {
            const res = await fetch(`${API_BASE}/getAdminProductSale?page=${pageToFetch || 1}`, { cache: 'no-store' });
            if (!res.ok) throw new Error(`ProductSale HTTP ${res.status}`);
            const json = await res.json();
            setSaleRes(json ?? null);
            setPagedSales(Array.isArray(json?.data) ? json.data : []); // Safely access data
        } catch (e) {
            setState({ loading: false, error: e.message || 'Fetch error' });
            setSaleRes(null); // Reset on error
            setPagedSales([]); // Clear list on error
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

        if (!confirm('Bạn có chắc chắn muốn xóa chương trình giảm giá này?')) return;

        try {
            const res = await fetch(`${API_BASE}/product-sale/${id}`, { method: 'DELETE' });
            // Treat 404 as success (already deleted)
            if (!res.ok && res.status !== 404) {
                const errorData = await res.json().catch(() => ({}));
                throw new Error(errorData.message || 'Xóa thất bại');
            }
            alert('Xóa khuyến mãi thành công!');
            if (pagedSales.length === 1 && page > 1) {
                setPage(page - 1); // Go back if last item on page
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
                        <div><div className="w-60 h-8 bg-gray-200 rounded-lg" /></div>
                        <div className="w-24 h-10 bg-gray-200 rounded-lg" />
                    </div>
                </div>
                <div className="flex-auto p-4">
                    <div className="overflow-x-auto">
                        <table className="w-full text-sm align-top text-slate-600">
                            <thead className="align-bottom">
                                <tr className="text-xs font-semibold tracking-wide text-left text-gray-500 uppercase border-b border-gray-200">
                                    <th className="px-6 py-3 w-[5%]"><div className="w-8 h-4 bg-gray-200 rounded"></div></th>
                                    <th className="px-6 py-3 w-[25%]"><div className="w-40 h-4 bg-gray-200 rounded"></div></th>
                                    <th className="px-6 py-3 w-[15%]"><div className="w-20 h-4 bg-gray-200 rounded"></div></th>
                                    <th className="px-6 py-3 w-[15%]"><div className="w-20 h-4 bg-gray-200 rounded"></div></th>
                                    <th className="px-6 py-3 w-[20%]"><div className="w-32 h-4 bg-gray-200 rounded"></div></th>
                                    <th className="px-6 py-3 w-[10%]"><div className="w-20 h-4 bg-gray-200 rounded"></div></th>
                                    <th className="px-6 py-3 w-[10%]"><div className="w-16 h-4 bg-gray-200 rounded"></div></th>
                                </tr>
                            </thead>
                            <tbody className="divide-y divide-gray-100">
                                {[...Array(10)].map((_, i) => (
                                    <tr key={i}>
                                        <td className="px-6 py-4"><div className="w-10 h-6 bg-gray-200 rounded" /></td>
                                        <td className="px-6 py-4 flex items-center gap-4">
                                            <div className="w-14 h-14 bg-gray-200 rounded" />
                                            <div className="space-y-2">
                                                <div className="w-48 h-5 bg-gray-200 rounded" />
                                                <div className="w-24 h-4 bg-gray-200 rounded" />
                                            </div>
                                        </td>
                                        <td className="px-6 py-4"><div className="w-20 h-6 bg-gray-200 rounded" /></td>
                                        <td className="px-6 py-4"><div className="w-20 h-6 bg-gray-200 rounded" /></td>
                                        <td className="px-6 py-4 space-y-1">
                                            <div className="w-32 h-4 bg-gray-200 rounded" />
                                            <div className="w-32 h-4 bg-gray-200 rounded" />
                                        </td>
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
                        <h6 className="text-gray-800 text-xl font-bold">Quản lý Khuyến mãi</h6>
                        <nav aria-label="breadcrumb" className="text-sm font-medium text-gray-500">
                            <ol className="flex items-center space-x-1">
                                <li><Link href="/admin" className="hover:underline">Trang chủ</Link></li>
                                <li><span className="mx-1">/</span></li>
                                <li>Khuyến mãi</li>
                            </ol>
                        </nav>
                    </div>
                    <div className="flex space-x-3 items-center">
                        <Link href="/admin/product_sale/create" className="inline-flex items-center px-4 py-2 bg-indigo-600 hover:bg-indigo-700 text-white text-sm font-medium rounded-lg shadow-md hover:-translate-y-0.5 transition-transform">
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
                                <th className="px-6 py-3 w-[25%]">Sản phẩm</th>
                                <th className="px-6 py-3 w-[15%] text-right">Giá gốc</th>
                                <th className="px-6 py-3 w-[15%] text-right">Giá giảm giá</th>
                                <th className="px-6 py-3 w-[20%]">Thời gian áp dụng</th>
                                <th className="px-6 py-3 w-[10%] text-center">Trạng thái</th>
                                <th className="px-6 py-3 w-[10%] text-center">Chức năng</th>
                            </tr>
                        </thead>
                        <tbody className="divide-y divide-gray-100">
                            {pagedSales.map((sale) => {
                                const statusInfo = getSaleStatus(sale);
                                // Safely access product properties with optional chaining and fallbacks
                                const originalPrice = parseFloat(sale.product?.price_buy || 0);
                                const salePrice = parseFloat(sale.price_sale || 0);
                                const discountPercent = originalPrice > 0 ? Math.round(((originalPrice - salePrice) / originalPrice) * 100) : 0;
                                const productName = sale.product?.name || 'Sản phẩm không tồn tại';
                                const productThumbnail = sale.product?.thumbnail || '/placeholder.jpg'; // Add placeholder

                                return (
                                    <tr className="hover:bg-gray-50" key={sale.id}>
                                        <td className="px-6 py-4 font-bold text-gray-900">{sale.id}</td>
                                        <td className="px-6 py-4">
                                            <div className="flex items-center gap-4">
                                                <Image src={productThumbnail} alt={productName} width={56} height={56} className="h-14 w-14 rounded-md object-cover flex-shrink-0" unoptimized />
                                                <div className="min-w-0">
                                                    <p className="font-semibold text-gray-800 line-clamp-2">{productName}</p>
                                                    <p className="text-xs text-gray-500">ID Sản phẩm: {sale.product_id}</p>
                                                </div>
                                            </div>
                                        </td>
                                        <td className="px-6 py-4 text-gray-500 line-through text-right">{formatCurrency(originalPrice)}</td>
                                        <td className="px-6 py-4 text-right">
                                            <p className="font-semibold text-red-600">{formatCurrency(salePrice)}</p>
                                            {discountPercent > 0 && (
                                                <span className="text-xs font-bold text-green-600"> (↓{discountPercent}%)</span>
                                            )}
                                        </td>
                                        <td className="px-6 py-4 text-xs">
                                            <p>BĐ: {formatDateTime(sale.date_begin)}</p>
                                            <p>KT: {formatDateTime(sale.date_end)}</p>
                                        </td>
                                        <td className="px-6 py-4 text-center">
                                            <span className={`px-3 py-1 font-semibold rounded-full text-xs ${statusInfo.className}`}>
                                                {statusInfo.text}
                                            </span>
                                        </td>
                                        <td className="px-6 py-4 flex gap-2 justify-center">
                                            <Link href={`/admin/product_sale/edit/${sale.id}`} className="p-2 rounded-full hover:bg-gray-200" title="Sửa">
                                                <i className="far fa-edit text-yellow-500" />
                                            </Link>
                                            <button onClick={() => handleDelete(sale.id)} className="p-2 rounded-full hover:bg-gray-200" title="Xóa">
                                                <i className="far fa-trash-alt text-red-500" />
                                            </button>
                                        </td>
                                    </tr>
                                );
                            })}
                            {saleRes?.total === 0 && (
                                <tr>
                                    <td colSpan={7} className="p-8 text-center text-gray-500">Chưa có chương trình khuyến mãi nào.</td>
                                </tr>
                            )}
                        </tbody>
                    </table>
                </div>

                {saleRes && saleRes.total > saleRes.per_page && (
                    <div className="mt-4 flex items-center justify-between flex-wrap gap-3">
                        <p className="text-sm text-gray-600">
                            Hiển thị {saleRes.from} – {saleRes.to} / {saleRes.total}
                        </p>
                        <div className="flex items-center gap-2">
                            <button onClick={() => setPage(page - 1)} disabled={!saleRes.prev_page_url} className="px-3 py-1 border rounded disabled:opacity-50">← Trước</button>
                            <button onClick={() => setPage(page + 1)} disabled={!saleRes.next_page_url} className="px-3 py-1 border rounded disabled:opacity-50">Sau →</button>
                        </div>
                    </div>
                )}
            </div>
        </div>
    )
}
