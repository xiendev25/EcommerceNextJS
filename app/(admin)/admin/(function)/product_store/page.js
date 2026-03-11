'use client'
import React, { useEffect, useState, useMemo } from 'react'
import Image from 'next/image'
import Link from 'next/link'
import { useRouter } from 'next/navigation'

const API_BASE = process.env.NEXT_PUBLIC_API_BASE_URL

// --- Helper Functions ---
const formatCurrency = (value) => {
    const number = parseFloat(value);
    if (isNaN(number)) return '0 ₫';
    return new Intl.NumberFormat('vi-VN', { style: 'currency', currency: 'VND' }).format(number);
};

// --- Thêm hàm buildPageList từ file mẫu ---
const buildPageList = (current, last, windowSize = 1) => {
    if (!last || last <= 1) return [1];
    const pages = [];
    const start = Math.max(1, current - windowSize);
    const end = Math.min(last, current + windowSize);

    if (start > 1) pages.push(1, '…');
    for (let i = start; i <= end; i++) pages.push(i);
    if (end < last) pages.push('…', last);

    return [...new Set(pages)];
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
    const [storeRes, setStoreRes] = useState(null);
    const [pagedStoreEntries, setPagedStoreEntries] = useState([]);
    const [state, setState] = useState({ loading: true, error: null });

    const fetchData = async (pageToFetch) => {
        if (authLoading) return;

        setState({ loading: true, error: null });
        try {
            const res = await fetch(`${API_BASE}/getAdminStore?page=${pageToFetch || 1}`, { cache: 'no-store' });
            if (!res.ok) throw new Error(`ProductStore HTTP ${res.status}`);
            const json = await res.json();
            setStoreRes(json ?? null);
            setPagedStoreEntries(Array.isArray(json?.data) ? json.data : []);
        } catch (e) {
            setState({ loading: false, error: e.message || 'Fetch error' });
            setStoreRes(null);
            setPagedStoreEntries([]);
        } finally {
            setState({ loading: false });
        }
    };

    useEffect(() => {
        fetchData(page);
    }, [page, authLoading]);


    // Function to delete a file via API
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


    // Handle deletion of a product and all related data
    const handleDelete = async (productId) => {
        if (!user) {
            alert('Không thể xác định người dùng. Vui lòng đăng nhập lại.');
            router.push('/admin/login');
            return;
        }

        if (!confirm(`XÓA VĨNH VIỄN!\nBạn có chắc chắn muốn xóa sản phẩm ID: ${productId} và TOÀN BỘ dữ liệu liên quan (ảnh, thuộc tính, kho, khuyến mãi...)?\nThao tác này KHÔNG THỂ HOÀN TÁC.`)) return;

        try {
            // 1. Fetch product details to get all image paths
            const productRes = await fetch(`${API_BASE}/getAdminProductDetail/${productId}`, { cache: 'no-store' });
            let productData = null;
            let imagesToDelete = [];

            if (productRes.ok) {
                const productJson = await productRes.json().catch(() => null);
                productData = productJson?.data || productJson;
                if (productData) {
                    if (productData.thumbnail) imagesToDelete.push(productData.thumbnail);
                    if (Array.isArray(productData.product_image)) {
                        productData.product_image.forEach(img => {
                            if (img?.image) imagesToDelete.push(img.image);
                        });
                    }
                }
            } else if (productRes.status !== 404) {
                console.error(`Error fetching details for product ${productId} before deletion: HTTP ${productRes.status}`);
            }


            // 2. Asynchronously delete images
            if (imagesToDelete.length > 0) {
                console.log(`Attempting to delete ${imagesToDelete.length} images for product ${productId}...`);
                imagesToDelete.forEach(filePath => deleteFileAPI(filePath));
            }

            // 3. Delete the product record
            const deleteRes = await fetch(`${API_BASE}/product/${productId}`, { method: 'DELETE' });

            if (!deleteRes.ok && deleteRes.status !== 404) {
                const errorData = await deleteRes.json().catch(() => ({}));
                throw new Error(errorData.message || 'Xóa sản phẩm thất bại.');
            }

            alert(`Xóa thành công sản phẩm ID: ${productId} và dữ liệu liên quan.`);

            // 4. Refetch the store list data
            if (pagedStoreEntries.length === 1 && page > 1) {
                setPage(page - 1);
            } else {
                fetchData(page);
            }

        } catch (err) {
            alert(`Đã có lỗi xảy ra: ${err.message}`);
            console.error(err);
        }
    };

    // --- Thêm useMemo cho pageNumbers từ file mẫu ---
    const pageNumbers = useMemo(() => {
        const current = storeRes?.current_page ?? 1
        const last = storeRes?.last_page ?? 1
        return buildPageList(current, last, 1)
    }, [storeRes])


    if (authLoading) {
        return <div className="p-8 text-center animate-pulse">Đang xác thực quyền truy cập...</div>;
    }

    // Skeleton UI for loading data
    if (state.loading) return (
        <div className="flex flex-col min-w-0 mb-6 break-words bg-white border-0 shadow-xl rounded-2xl animate-pulse">
            <div className="p-6 pb-4 mb-0 border-b border-gray-200 rounded-t-2xl">
                <div className="flex flex-wrap justify-between items-center mb-4 gap-4">
                    <div><div className="w-48 h-8 bg-gray-200 rounded-lg" /></div>
                    <div><div className="w-32 h-10 bg-gray-200 rounded-lg" /></div>
                </div>
            </div>
            <div className="flex-auto p-4">
                <div className="overflow-x-auto">
                    <table className="w-full text-sm align-top text-slate-600">
                        <thead className="align-bottom">
                            <tr className="text-xs font-semibold tracking-wide text-left text-gray-500 uppercase border-b border-gray-200">
                                <th className="px-6 py-3 w-[10%]"><div className="w-16 h-4 bg-gray-200 rounded"></div></th>
                                <th className="px-6 py-3 w-[40%]"><div className="w-48 h-4 bg-gray-200 rounded"></div></th>
                                <th className="px-6 py-3 w-[15%]"><div className="w-20 h-4 bg-gray-200 rounded"></div></th>
                                <th className="px-6 py-3 w-[10%]"><div className="w-16 h-4 bg-gray-200 rounded"></div></th>
                                <th className="px-6 py-3 w-[10%]"><div className="w-16 h-4 bg-gray-200 rounded"></div></th>
                                <th className="px-6 py-3 w-[15%]"><div className="w-20 h-4 bg-gray-200 rounded"></div></th>
                            </tr>
                        </thead>
                        <tbody className="divide-y divide-gray-100">
                            {[...Array(10)].map((_, i) => (
                                <tr key={i}>
                                    <td className="px-6 py-4"><div className="w-12 h-6 bg-gray-200 rounded" /></td>
                                    <td className="px-6 py-4 flex items-center gap-4">
                                        <div className="w-16 h-16 bg-gray-200 rounded" />
                                        <div className="w-40 h-5 bg-gray-200 rounded" />
                                    </td>
                                    <td className="px-6 py-4"><div className="w-24 h-6 bg-gray-200 rounded" /></td>
                                    <td className="px-6 py-4"><div className="w-12 h-6 bg-gray-200 rounded mx-auto" /></td>
                                    <td className="px-6 py-4"><div className="w-12 h-6 bg-gray-200 rounded mx-auto" /></td>
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


    return (
        <div className="flex flex-col min-w-0 mb-6 break-words bg-white border-0 shadow-xl rounded-2xl">
            <div className="p-6 pb-4 mb-0 border-b border-gray-200 rounded-t-2xl">
                <div className="flex flex-wrap justify-between items-center mb-4 gap-4">
                    <div>
                        <h6 className="text-gray-800 text-xl font-bold">Quản lý Kho hàng</h6>
                        <nav aria-label="breadcrumb" className="text-sm font-medium text-gray-500">
                            <ol className="flex items-center space-x-1">
                                <li><Link href="/admin" className="hover:underline">Trang chủ</Link></li>
                                <li><span className="mx-1">/</span></li>
                                <li>Kho hàng</li>
                            </ol>
                        </nav>
                    </div>
                    <div>
                        <Link href="/admin/product_store/create" className="inline-flex items-center px-4 py-2 bg-indigo-600 hover:bg-indigo-700 text-white text-sm font-medium rounded-lg shadow-md">
                            <i className="fas fa-plus mr-2"></i> Nhập hàng mới
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
                                <th className="px-6 py-3 w-[10%]">ID SP</th>
                                <th className="px-6 py-3 w-[40%]">Sản phẩm</th>
                                <th className="px-6 py-3 w-[15%] text-right">Giá bán</th>
                                <th className="px-6 py-3 w-[10%] text-center">Đã nhập</th>
                                <th className="px-6 py-3 w-[10%] text-center">Đã bán</th>
                                <th className="px-6 py-3 w-[15%] text-center">Chức năng</th>
                            </tr>
                        </thead>
                        {/* ================================================================
                          BẮT ĐẦU SỬA LỖI HYDRATION:
                          Xóa bỏ khoảng trắng/xuống dòng giữa 2 block {}
                          ================================================================
                        */}
                        <tbody className="divide-y divide-gray-100">
                            {pagedStoreEntries.map((entry) => {
                                const product = entry.product;
                                const productName = product?.name || 'Sản phẩm không tồn tại';
                                const productThumbnail = product?.thumbnail || '/placeholder.jpg';
                                const priceBuy = product?.price_buy;
                                const qtyStore = entry.qty_store || 0;
                                const qtySold = entry.qty_sold || 0;
                                const stockQty = qtyStore - qtySold;

                                return (
                                    <tr className="hover:bg-gray-50" key={entry.product_id}>
                                        <td className="px-6 py-4 font-bold text-gray-900">{entry.product_id}</td>
                                        <td className="px-6 py-4">
                                            <div className="flex items-center gap-4">
                                                <Image
                                                    src={productThumbnail}
                                                    alt={productName}
                                                    width={64}
                                                    height={64}
                                                    className="h-16 w-16 rounded-md object-cover flex-shrink-0 border" unoptimized />
                                                <div className="min-w-0">
                                                    <p className="font-semibold text-gray-800 line-clamp-2">{productName}</p>
                                                    <p className={`text-xs ${stockQty <= 0 ? 'text-red-500' : (stockQty < 10 ? 'text-orange-500' : 'text-gray-500')}`}>Tồn kho: {stockQty}</p>
                                                </div>
                                            </div>
                                        </td>
                                        <td className="px-6 py-4 font-semibold text-gray-700 text-right">{formatCurrency(priceBuy)}</td>
                                        <td className="px-6 py-4 font-medium text-center text-blue-600">{qtyStore}</td>
                                        <td className="px-6 py-4 font-medium text-center text-green-600">{qtySold}</td>
                                        <td className="px-6 py-4 text-center flex gap-2 justify-center">
                                            <Link href={`/admin/product/edit/${entry.product_id}`} className="p-2 rounded-full hover:bg-gray-200" title="Sửa Sản Phẩm">
                                                <i className="far fa-edit text-yellow-500" />
                                            </Link>
                                            <button onClick={() => handleDelete(entry.product_id)} className="p-2 rounded-full hover:bg-gray-200" title="Xóa vĩnh viễn sản phẩm">
                                                <i className="far fa-trash-alt text-red-500" />
                                            </button>
                                        </td>
                                    </tr>
                                )
                            })}{storeRes?.total === 0 && (
                                <tr><td colSpan={6} className="p-8 text-center text-gray-500">Chưa có dữ liệu nhập kho.</td></tr>
                            )}
                        </tbody>
                        {/* ================================================================
                          KẾT THÚC SỬA LỖI HYDRATION
                          ================================================================
                        */}
                    </table>
                </div>

                {/* ================================================================
                  BẮT ĐẦU NÂNG CẤP PHÂN TRANG (giống file mẫu)
                  ================================================================
                */}
                {storeRes && storeRes.total > storeRes.per_page && (
                    <div className="mt-4 flex items-center justify-between flex-wrap gap-3">
                        <p className="text-sm text-gray-600">
                            Hiển thị {storeRes.from || 0} – {storeRes.to || 0} / {storeRes.total || 0} dòng dữ liệu
                        </p>

                        <div className="flex items-center gap-1">
                            <button
                                onClick={() => setPage((p) => Math.max(1, p - 1))}
                                disabled={!storeRes.prev_page_url}
                                className="px-3 py-1 border rounded disabled:opacity-50"
                            >
                                ← Trước
                            </button>

                            {pageNumbers.map((p, idx) => (
                                <button
                                    key={`${p}-${idx}`}
                                    disabled={p === '…'}
                                    onClick={() => typeof p === 'number' && setPage(p)}
                                    className={`px-3 py-1 border rounded text-sm ${p === storeRes.current_page ? 'bg-indigo-600 text-white border-indigo-600 font-semibold' : 'bg-white hover:bg-gray-50'} ${p === '…' ? 'cursor-default opacity-70 bg-gray-50' : ''}`}
                                >
                                    {p}
                                </button>
                            ))}

                            <button
                                onClick={() => setPage((p) => Math.min(storeRes.last_page || p, p + 1))}
                                disabled={!storeRes.next_page_url}
                                className="px-3 py-1 border rounded disabled:opacity-50"
                            >
                                Sau →
                            </button>
                        </div>
                    </div>
                )}
                {/* ================================================================
                  KẾT THÚC NÂNG CẤP PHÂN TRANG
                  ================================================================
                */}
            </div>
        </div>
    )
}