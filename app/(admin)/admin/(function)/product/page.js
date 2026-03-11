'use client'
import React, { useEffect, useMemo, useState } from 'react'
import Image from 'next/image'
import Link from 'next/link'
import { useRouter } from 'next/navigation'

const API_BASE = process.env.NEXT_PUBLIC_API_BASE_URL

const formatCurrency = (value) => {
    const number = parseFloat(value)
    if (isNaN(number)) return '0 ₫'
    return new Intl.NumberFormat('vi-VN', { style: 'currency', currency: 'VND' }).format(number)
}

const getProductStatus = (status) => {
    switch (status) {
        case 1: return { text: 'Đang bán', className: 'bg-green-100 text-green-800' }
        case 0: return { text: 'Ngừng bán', className: 'bg-red-100 text-red-800' }
        default: return { text: 'Lưu nháp', className: 'bg-yellow-100 text-yellow-800' }
    }
}

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


    const [page, setPage] = useState(1)
    const [productRes, setProductRes] = useState(null)
    const [pagedProducts, setPagedProducts] = useState([])
    const [state, setState] = useState({ loading: true, error: null })
    const [filters, setFilters] = useState({ search: '', category_id: '' })
    const [categories, setCategories] = useState([])

    useEffect(() => {
        if (authLoading) return;

        const fetchCategories = async () => {
            try {
                const res = await fetch(`${API_BASE}/category`, { cache: 'no-store' })
                if (!res.ok) throw new Error(`HTTP ${res.status}`)
                const json = await res.json()
                setCategories(Array.isArray(json) ? json : [])
            } catch {
                setCategories([])
                console.error("Failed to fetch categories");
            }
        }
        fetchCategories()
    }, [authLoading])
    const fetchData = async (pageToFetch = 1, nextFilters = filters) => {
        if (authLoading) return;

        setState({ loading: true, error: null })
        try {
            const qs = new URLSearchParams()
            qs.set('page', String(pageToFetch))
            if (nextFilters.search?.trim()) qs.set('search', nextFilters.search.trim())
            if (nextFilters.category_id && nextFilters.category_id !== "") qs.set('category_id', String(nextFilters.category_id))

            const res = await fetch(`${API_BASE}/getAdminProduct?${qs.toString()}`, { cache: 'no-store' })
            if (!res.ok) throw new Error(`Product HTTP ${res.status}`)

            const json = await res.json()
            setProductRes(json ?? null)
            setPagedProducts(Array.isArray(json?.data) ? json.data : [])
            setState({ loading: false, error: null });
        } catch (e) {
            setState({ loading: false, error: e.message || 'Fetch error' })
            setProductRes(null);
            setPagedProducts([]);
        }
    }

    useEffect(() => {
        fetchData(page, filters)
    }, [page, authLoading])

    const handleFilterSubmit = (e) => {
        e.preventDefault()
        setPage(1)
        fetchData(1, filters)
    }

    const pageNumbers = useMemo(() => {
        const current = productRes?.current_page ?? 1
        const last = productRes?.last_page ?? 1
        return buildPageList(current, last, 1)
    }, [productRes])

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


    const handleDelete = async (id) => {
        if (!user) {
            alert('Không thể xác định người dùng. Vui lòng đăng nhập lại.');
            router.push('/admin/login');
            return;
        }

        if (!confirm('Bạn có chắc muốn xóa sản phẩm này? Ảnh và mọi dữ liệu liên quan (kho, thuộc tính,...) sẽ bị xóa vĩnh viễn.')) return
        try {
            const productDetailRes = await fetch(`${API_BASE}/getAdminProductDetail/${id}`, { cache: 'no-store' });
            let productJson = null;
            if (productDetailRes.ok) {
                productJson = await productDetailRes.json().catch(() => null);
                productJson = productJson?.data || productJson;
            } else if (productDetailRes.status !== 404) {
                console.error(`Error fetching product details for deletion: HTTP ${productDetailRes.status}`);
            }


            if (productJson) {
                if (productJson.thumbnail) {
                    deleteFileAPI(productJson.thumbnail);
                }
                if (Array.isArray(productJson.product_image)) {
                    productJson.product_image.forEach(img => {
                        if (img?.image) {
                            deleteFileAPI(img.image);
                        }
                    });
                }
            }

            const delRes = await fetch(`${API_BASE}/product/${id}`, { method: 'DELETE' })
            if (!delRes.ok && delRes.status !== 404) {
                const err = await delRes.json().catch(() => ({}))
                throw new Error(err?.message || err?.error || 'Xoá sản phẩm thất bại.')
            }

            alert(`Xóa sản phẩm (ID: ${id}) thành công!`);

            if (pagedProducts.length === 1 && page > 1) {
                setPage(page - 1)
            } else {
                fetchData(page, filters)
            }
        } catch (e) {
            console.error("Lỗi xóa sản phẩm:", e)
            alert(e.message || 'Đã xảy ra lỗi khi xoá.')
        }
    }

    if (authLoading) {
        return <div className="p-8 text-center animate-pulse">Đang xác thực quyền truy cập...</div>;
    }

    if (state.loading) return (
        <div className="flex flex-col min-w-0 mb-6 break-words bg-white border-0 shadow-xl rounded-2xl animate-pulse">
            <div className="p-6 pb-4 mb-0 border-b border-gray-200 rounded-t-2xl">
                <div className="flex flex-wrap justify-between items-center mb-4 gap-4">
                    <div><div className="w-60 h-8 bg-gray-200 rounded-lg" /></div>
                    <div className="w-32 h-10 bg-gray-200 rounded-lg" />
                </div>
                <div className="flex flex-wrap items-end gap-4 mb-4">
                    <div className="flex-1 min-w-[220px]"><div className="w-full h-12 bg-gray-200 rounded-lg" /></div>
                    <div className="min-w-[220px]"><div className="w-full h-12 bg-gray-200 rounded-lg" /></div>
                    <div className="w-24 h-12 bg-gray-200 rounded-lg" />
                </div>
            </div>
            <div className="flex-auto p-4">
                <div className="overflow-x-auto">
                    <table className="w-full text-sm align-top text-slate-600">
                        <thead className="align-bottom">
                            <tr className="text-xs font-semibold tracking-wide text-left text-gray-500 uppercase border-b border-gray-200">
                                <th className="px-6 py-3 w-[5%]"><div className="w-8 h-4 bg-gray-200 rounded"></div></th>
                                <th className="px-6 py-3 w-[30%]"><div className="w-40 h-4 bg-gray-200 rounded"></div></th>
                                <th className="px-6 py-3 w-[15%]"><div className="w-24 h-4 bg-gray-200 rounded"></div></th>
                                <th className="px-6 py-3 w-[15%]"><div className="w-20 h-4 bg-gray-200 rounded"></div></th>
                                <th className="px-6 py-3 w-[10%]"><div className="w-16 h-4 bg-gray-200 rounded"></div></th>
                                <th className="px-6 py-3 w-[15%]"><div className="w-20 h-4 bg-gray-200 rounded"></div></th>
                                <th className="px-6 py-3 w-[10%]"><div className="w-20 h-4 bg-gray-200 rounded"></div></th>
                            </tr>
                        </thead>
                        <tbody className="divide-y divide-gray-100">
                            {[...Array(10)].map((_, i) => (
                                <tr key={i}>
                                    <td className="px-6 py-4"><div className="w-10 h-6 bg-gray-200 rounded" /></td>
                                    <td className="px-6 py-4 flex items-center gap-4">
                                        <div className="w-16 h-16 bg-gray-200 rounded" />
                                        <div className="w-40 h-5 bg-gray-200 rounded" />
                                    </td>
                                    <td className="px-6 py-4"><div className="w-24 h-5 bg-gray-200 rounded" /></td>
                                    <td className="px-6 py-4"><div className="w-20 h-6 bg-gray-200 rounded" /></td>
                                    <td className="px-6 py-4"><div className="w-16 h-6 bg-gray-200 rounded" /></td>
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


    return (
        <div className="flex flex-col min-w-0 mb-6 break-words bg-white border-0 shadow-xl rounded-2xl">
            <div className="p-6 pb-4 mb-0 border-b border-gray-200 rounded-t-2xl">
                <div className="flex flex-wrap justify-between items-center mb-4 gap-4">
                    <div>
                        <h6 className="text-gray-800 text-xl font-bold">Danh sách Sản phẩm</h6>
                        <nav aria-label="breadcrumb" className="text-sm font-medium text-gray-500">
                            <ol className="flex items-center space-x-1">
                                <li><Link href="/admin" className="hover:underline">Trang chủ</Link></li>
                                <li><span className="mx-1">/</span></li>
                                <li>Sản phẩm</li>
                            </ol>
                        </nav>
                    </div>
                    <Link
                        href="/admin/product/create"
                        className="inline-flex items-center px-4 py-2 bg-indigo-600 hover:bg-indigo-700 text-white text-sm font-medium rounded-lg shadow-md hover:-translate-y-0.5 transition-transform"
                    >
                        <i className="fas fa-plus mr-2 text-base"></i> Thêm sản phẩm
                    </Link>
                </div>

                <form className="flex flex-wrap items-end gap-4 mb-4" onSubmit={handleFilterSubmit}>
                    <div className="flex-1 min-w-[220px]">
                        <label className="block text-sm font-medium mb-1">Tìm kiếm</label>
                        <input
                            value={filters.search}
                            onChange={(e) => setFilters((f) => ({ ...f, search: e.target.value }))}
                            placeholder="Nhập tên sản phẩm"
                            className="w-full h-11 px-4 rounded-lg bg-gray-50 border border-gray-300 focus:outline-none focus:ring-2 focus:ring-indigo-500" // Reduced height
                        />
                    </div>

                    <div className="min-w-[220px]">
                        <label className="block text-sm font-medium mb-1">Danh mục</label>
                        <select
                            value={filters.category_id}
                            onChange={(e) => setFilters((f) => ({ ...f, category_id: e.target.value }))}
                            className="w-full h-11 px-4 rounded-lg bg-gray-50 border border-gray-300 focus:outline-none focus:ring-2 focus:ring-indigo-500" // Reduced height
                        >
                            <option value="">— Tất cả —</option>
                            {categories
                                .filter(c => c.parent_id === 0)
                                .map(cat => (
                                    <React.Fragment key={cat.id}>
                                        <option value={cat.id} className="font-bold">{cat.name}</option>
                                        {categories
                                            .filter(sub => sub.parent_id === cat.id)
                                            .map(subCat => (
                                                <option key={subCat.id} value={subCat.id}>
                                                    &nbsp;&nbsp;&nbsp;-- {subCat.name}
                                                </option>
                                            ))}
                                    </React.Fragment>
                                ))}
                        </select>
                    </div>

                    <button
                        type="submit"
                        className="h-11 px-5 rounded-lg bg-indigo-600 hover:bg-indigo-700 text-white font-medium shadow"
                    >
                        Áp dụng
                    </button>

                    {(filters.search || filters.category_id) && (
                        <button
                            type="button"
                            onClick={() => {
                                const cleared = { search: '', category_id: '' }
                                setFilters(cleared)
                                setPage(1)
                                fetchData(1, cleared)
                            }}
                            className="h-11 px-4 rounded-lg border border-gray-300 hover:bg-gray-50 font-medium"
                        >
                            Xóa lọc
                        </button>
                    )}
                </form>
            </div>

            <div className="flex-auto p-4">
                {state.error && <p className="p-4 mb-4 text-center text-red-500 bg-red-50 border border-red-200 rounded-lg">Lỗi tải dữ liệu: {state.error}</p>}
                <div className="overflow-x-auto">
                    <table className="w-full text-sm align-top text-slate-600">
                        <thead className="align-bottom">
                            <tr className="text-xs font-semibold tracking-wide text-left text-gray-500 uppercase border-b border-gray-200">
                                <th className="px-6 py-3 w-[5%]">ID</th>
                                <th className="px-6 py-3 w-[30%]">Sản phẩm</th>
                                <th className="px-6 py-3 w-[15%]">Danh mục</th>
                                <th className="px-6 py-3 w-[15%] text-right">Giá bán</th>
                                <th className="px-6 py-3 w-[10%] text-center">Tồn kho</th>
                                <th className="px-6 py-3 w-[15%] text-center">Trạng thái</th>
                                <th className="px-6 py-3 w-[10%] text-center">Chức năng</th>
                            </tr>
                        </thead>
                        <tbody className="divide-y divide-gray-100">
                            {pagedProducts.map((product) => {
                                const statusInfo = getProductStatus(product.status)
                                const qtyStore = parseInt(product.qty_store, 10) || 0
                                const qtySold = parseInt(product.qty_sold, 10) || 0
                                const stockQty = qtyStore - qtySold

                                return (
                                    <tr className="hover:bg-gray-50" key={product.id}>
                                        <td className="px-6 py-4 font-bold text-gray-900">{product.id}</td>
                                        <td className="px-6 py-4">
                                            <div className="flex items-center gap-4">
                                                <Image
                                                    src={product.thumbnail || '/placeholder.jpg'}
                                                    alt={product.name}
                                                    width={64}
                                                    height={64}
                                                    className="h-16 w-16 rounded-md object-cover flex-shrink-0"
                                                    unoptimized
                                                />
                                                <p className="font-semibold text-gray-800 line-clamp-2">{product.name}</p>
                                            </div>
                                        </td>
                                        <td className="px-6 py-4 text-xs">{product?.category?.name || 'N/A'}</td>
                                        <td className="px-6 py-4 font-semibold text-gray-700 text-right">{formatCurrency(product.price_buy)}</td>
                                        <td className={`px-6 py-4 font-bold text-center ${stockQty < 10 && stockQty > 0 ? 'text-orange-500' : (stockQty <= 0 ? 'text-red-500' : 'text-gray-700')}`}>
                                            {stockQty}
                                        </td>
                                        <td className="px-6 py-4 text-center">
                                            <span className={`px-3 py-1 font-semibold rounded-full text-xs ${statusInfo.className}`}>
                                                {statusInfo.text}
                                            </span>
                                        </td>
                                        <td className="px-6 py-4 flex gap-2 justify-center">
                                            <Link href={`/admin/product/show/${product.id}`} className="p-2 rounded-full hover:bg-gray-200" title="Xem">
                                                <i className="far fa-eye text-blue-500" />
                                            </Link>
                                            <Link href={`/admin/product/edit/${product.id}`} className="p-2 rounded-full hover:bg-gray-200" title="Sửa">
                                                <i className="far fa-edit text-yellow-500" />
                                            </Link>
                                            <button onClick={() => handleDelete(product.id)} className="p-2 rounded-full hover:bg-gray-200" title="Xóa">
                                                <i className="far fa-trash-alt text-red-500" />
                                            </button>
                                        </td>
                                    </tr>
                                )
                            })}
                            {productRes?.total === 0 && (
                                <tr>
                                    <td colSpan={7} className="p-8 text-center text-gray-500">Chưa có sản phẩm nào{filters.search || filters.category_id ? ' phù hợp với bộ lọc' : ''}.</td>
                                </tr>
                            )}
                        </tbody>
                    </table>
                </div>

                {productRes && productRes.total > productRes.per_page && (
                    <div className="mt-4 flex items-center justify-between flex-wrap gap-3">
                        <p className="text-sm text-gray-600">
                            Hiển thị {productRes.from || 0} – {productRes.to || 0} / {productRes.total || 0}
                            {(filters.search || filters.category_id) && productRes.total > 0 ? (
                                <span className="ml-2 italic text-gray-500">(đã lọc)</span>
                            ) : null}
                        </p>

                        <div className="flex items-center gap-1">
                            <button
                                onClick={() => setPage((p) => Math.max(1, p - 1))}
                                disabled={!productRes.prev_page_url}
                                className="px-3 py-1 border rounded disabled:opacity-50"
                            >
                                ← Trước
                            </button>

                            {pageNumbers.map((p, idx) => (
                                <button
                                    key={`${p}-${idx}`}
                                    disabled={p === '…'}
                                    onClick={() => typeof p === 'number' && setPage(p)}
                                    className={`px-3 py-1 border rounded text-sm ${p === productRes.current_page ? 'bg-indigo-600 text-white border-indigo-600 font-semibold' : 'bg-white hover:bg-gray-50'} ${p === '…' ? 'cursor-default opacity-70 bg-gray-50' : ''}`}
                                >
                                    {p}
                                </button>
                            ))}

                            <button
                                onClick={() => setPage((p) => Math.min(productRes.last_page || p, p + 1))}
                                disabled={!productRes.next_page_url}
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
