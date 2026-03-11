'use client'

import React, { useEffect, useMemo, useState } from 'react'
import Link from 'next/link'
import { useRouter } from "next/navigation";
import Image from 'next/image'; // Import Image

const API_BASE = process.env.NEXT_PUBLIC_API_BASE_URL;

const formatCurrency = (value) => {
    const number = parseFloat(value);
    if (isNaN(number)) return 'Chưa có';
    return new Intl.NumberFormat('vi-VN', { style: 'currency', currency: 'VND' }).format(number);
};

export default function Page() {
    const router = useRouter();

    const [user, setUser] = useState(null); // Admin user state
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

    // ===== Left panel: picker (search + pagination via getAdminProduct) =====
    const [query, setQuery] = useState('');
    const [debouncedQuery, setDebouncedQuery] = useState('');
    const [page, setPage] = useState(1);
    const [pickerLoading, setPickerLoading] = useState(false); // Init as false
    const [pickerError, setPickerError] = useState(null);
    const [pickerItems, setPickerItems] = useState([]);
    const [pickerTotal, setPickerTotal] = useState(0);
    const [pickerLastPage, setPickerLastPage] = useState(1);

    // Form submission state
    const [state, setState] = useState({ submitting: false, error: null });
    // Removed loading state for allProducts as it's not fetched here anymore
    // const [allProducts, setAllProducts] = useState([]); // Removed
    const [form, setForm] = useState({
        product_id: '',
        qty: '',
        price_root: '', // Changed from price_buy to price_root
    });

    // Debounce search
    useEffect(() => {
        const t = setTimeout(() => setDebouncedQuery(query.trim()), 350);
        return () => clearTimeout(t);
    }, [query]);

    // Removed useEffect fetching allProducts

    // Fetch products for picker
    useEffect(() => {
        if (authLoading) return; // Wait for auth check

        const fetchPickerProducts = async () => {
            setPickerLoading(true);
            setPickerError(null);
            try {
                const qs = new URLSearchParams();
                qs.set('page', String(page));
                if (debouncedQuery) qs.set('search', debouncedQuery);

                const res = await fetch(`${API_BASE}/getAdminProduct?${qs.toString()}`, { cache: 'no-store' });
                if (!res.ok) throw new Error(`Lỗi tải sản phẩm (HTTP ${res.status})`);
                const json = await res.json();

                const items = Array.isArray(json?.data) ? json.data : [];
                setPickerItems(items);
                setPickerTotal(json?.total || items.length || 0);
                setPickerLastPage(json?.last_page || 1);
            } catch (e) {
                setPickerError(e?.message || 'Không tải được danh sách sản phẩm');
                setPickerItems([]);
                setPickerTotal(0);
                setPickerLastPage(1);
            } finally {
                setPickerLoading(false);
            }
        };
        fetchPickerProducts();
    }, [debouncedQuery, page, authLoading]); // Add authLoading dependency

    const handleFormChange = (e) => {
        const { name, value } = e.target;
        // Allow only non-negative integers for qty and price_root
        if ((name === 'qty' || name === 'price_root') && value !== '' && (!/^\d+$/.test(value) || parseInt(value) < 0)) {
            return; // Ignore invalid input
        }
        setForm(prev => ({ ...prev, [name]: value }));
    };

    const handlePickProduct = (p) => {
        setForm(prev => ({ ...prev, product_id: String(p.id) }));
    };

    const handleSubmit = async (e) => {
        e.preventDefault();

        if (!user) {
            alert('Không thể xác định người dùng. Vui lòng đăng nhập lại.');
            router.push('/admin/login');
            return;
        }

        if (!form.product_id || !form.qty || !form.price_root) {
            return alert("Vui lòng chọn sản phẩm, nhập số lượng và giá nhập.");
        }
        const qty = parseInt(form.qty);
        const priceRoot = parseInt(form.price_root);

        if (isNaN(qty) || qty <= 0) {
            return alert("Số lượng nhập phải là số nguyên dương.");
        }
        if (isNaN(priceRoot) || priceRoot < 0) {
            return alert("Giá nhập phải là số không âm.");
        }


        setState(s => ({ ...s, submitting: true, error: null }));
        try {
            const payload = {
                product_id: Number(form.product_id),
                qty: qty,
                price_root: priceRoot,
                // Status might be set by backend, but sending 1 as default
                status: 1,
                created_by: user.id,
                // created_at is usually handled by the backend
            };

            const res = await fetch(`${API_BASE}/product-store`, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify(payload),
            });

            if (!res.ok) {
                const errorData = await res.json().catch(() => ({}));
                throw new Error(errorData.message || "Tạo phiếu nhập thất bại.");
            }

            alert('Nhập hàng thành công!');
            router.push('/admin/product_store');
        } catch (err) {
            console.error(err);
            setState(s => ({ ...s, submitting: false, error: err.message || 'Thao tác thất bại' }));
        }
        // Removed finally block setting submitting false, let it be handled in catch/success path
    };

    if (authLoading) {
        return <div className="p-8 text-center animate-pulse">Đang xác thực quyền truy cập...</div>;
    }

    // Removed data loading check as only picker loads data now

    return (
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
            <aside className="lg:col-span-6 bg-white shadow-xl rounded-2xl border border-gray-100">
                <div className="p-6 border-b border-gray-200 rounded-t-2xl">
                    <h6 className="text-gray-800 text-lg font-semibold">Chọn sản phẩm</h6>
                    <p className="text-sm text-gray-500 mt-1">Tìm kiếm & phân trang</p>
                    <div className="mt-4 flex gap-3">
                        <input
                            value={query}
                            onChange={(e) => { setQuery(e.target.value); setPage(1); }}
                            placeholder="Tìm theo tên sản phẩm…"
                            className="flex-1 h-11 px-4 rounded-lg bg-gray-100 border border-gray-300 focus:ring-2 focus:ring-indigo-500"
                        />
                    </div>
                </div>

                <div className="p-4">
                    {pickerLoading ? (
                        <div className="p-6 text-center animate-pulse">Đang tải sản phẩm...</div>
                    ) : pickerError ? (
                        <div className="p-6 text-center text-red-500">{pickerError}</div>
                    ) : pickerItems.length === 0 ? (
                        <div className="p-6 text-center text-gray-500">Không có sản phẩm phù hợp</div>
                    ) : (
                        <ul className="grid sm:grid-cols-2 gap-3">
                            {pickerItems.map((p) => {
                                const name = p.name || p.product_name || `Sản phẩm #${p.id}`; // More robust fallback
                                const active = Number(form.product_id) === p.id;
                                const stockQty = (p.qty_store || 0) - (p.qty_sold || 0);
                                return (
                                    <li key={p.id}>
                                        <button
                                            type="button"
                                            onClick={() => handlePickProduct(p)}
                                            className={`w-full text-left rounded-xl border p-3 hover:shadow-md transition ${active ? 'border-indigo-500 ring-2 ring-indigo-200' : 'border-gray-200'}`}
                                            title="Chọn sản phẩm"
                                        >
                                            <div className="flex items-center gap-3">
                                                <div className="w-12 h-12 rounded-lg bg-gray-100 flex items-center justify-center overflow-hidden flex-shrink-0 border">
                                                    {p.thumbnail ? (
                                                        <Image src={p.thumbnail} alt={name} width={48} height={48} className="w-full h-full object-cover" unoptimized />
                                                    ) : (
                                                        <span className="text-xs text-gray-500">No img</span>
                                                    )}
                                                </div>
                                                <div className="min-w-0 flex-1">
                                                    <p className="font-medium text-gray-800 truncate">{name}</p>
                                                    <p className="text-xs text-gray-500">ID: {p.id}</p>
                                                    {/* Display current stock */}
                                                    <p className={`text-xs ${stockQty <= 0 ? 'text-red-500' : 'text-gray-500'}`}>Tồn kho: {stockQty}</p>
                                                </div>
                                            </div>
                                        </button>
                                    </li>
                                );
                            })}
                        </ul>
                    )}

                    {pickerTotal > 0 && (
                        <div className="mt-4 flex items-center justify-between">
                            <div className="text-sm text-gray-600">
                                Tổng: {pickerTotal} • Trang {page}/{pickerLastPage}
                            </div>
                            <div className="flex gap-2">
                                <button
                                    type="button"
                                    onClick={() => setPage(p => Math.max(1, p - 1))}
                                    disabled={page <= 1 || pickerLoading}
                                    className="px-3 py-2 text-sm rounded-lg bg-gray-100 disabled:opacity-50"
                                >
                                    Trước
                                </button>
                                <button
                                    type="button"
                                    onClick={() => setPage(p => Math.min(pickerLastPage, p + 1))}
                                    disabled={page >= pickerLastPage || pickerLoading}
                                    className="px-3 py-2 text-sm rounded-lg bg-gray-100 disabled:opacity-50"
                                >
                                    Sau
                                </button>
                            </div>
                        </div>
                    )}
                </div>
            </aside>

            <section className="lg:col-span-6 bg-white p-6 md:p-8 shadow-sm rounded-lg border">
                <h1 className="text-2xl font-bold text-gray-900 mb-6">Tạo Phiếu Nhập Kho</h1>
                {state.error && <p className="text-red-500 text-sm mb-4 bg-red-50 p-3 rounded border border-red-200">Lỗi: {state.error}</p>}

                <form onSubmit={handleSubmit} className="space-y-6">
                    <div>
                        <label className="block text-sm font-medium text-gray-700 mb-1">Mã sản phẩm</label>
                        <input
                            type="text"
                            value={form.product_id}
                            disabled
                            readOnly // Make it explicitly readonly
                            className="w-full h-12 px-4 rounded-lg bg-gray-200 border border-gray-300 cursor-not-allowed"
                        />
                        <p className="text-xs text-gray-500 mt-1">* Chọn sản phẩm ở panel bên trái.</p>
                    </div>

                    <div>
                        <label htmlFor="price_root" className="block text-sm font-medium text-gray-700 mb-1">
                            Giá nhập (VNĐ) <span className="text-red-500">*</span>
                        </label>
                        <input
                            type="number" // Use number for better input control
                            id="price_root"
                            name="price_root"
                            placeholder="Nhập giá nhập..."
                            min="0" // Prevent negative
                            step="1" // Allow only integers
                            value={form.price_root}
                            onChange={handleFormChange}
                            required
                            className="w-full h-12 px-4 rounded-lg bg-gray-50 border border-gray-300"
                        />
                    </div>

                    <div>
                        <label htmlFor="qty" className="block text-sm font-medium text-gray-700 mb-1">
                            Số lượng nhập mới <span className="text-red-500">*</span>
                        </label>
                        <input
                            type="number" // Use number
                            id="qty"
                            name="qty"
                            placeholder="Nhập số lượng..."
                            min="1" // Must be at least 1
                            step="1" // Allow only integers
                            value={form.qty}
                            onChange={handleFormChange}
                            required
                            className="w-full h-12 px-4 rounded-lg bg-gray-50 border border-gray-300"
                        />
                    </div>

                    <div className="flex justify-end gap-3 border-t pt-6">
                        <Link href="/admin/product_store" className="px-4 py-2.5 bg-gray-200 hover:bg-gray-300 text-gray-800 text-sm font-medium rounded-lg">
                            Hủy
                        </Link>
                        <button
                            type="submit"
                            disabled={state.submitting}
                            className="px-4 py-2.5 bg-indigo-600 text-white rounded-lg disabled:opacity-60 disabled:cursor-not-allowed"
                        >
                            {state.submitting ? 'Đang xử lý...' : 'Xác nhận nhập hàng'}
                        </button>
                    </div>
                </form>
            </section>
        </div>
    );
}
