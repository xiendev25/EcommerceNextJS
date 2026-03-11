'use client'

import React, { useEffect, useState } from 'react'
import Link from 'next/link'
import { useRouter, useParams } from 'next/navigation'
import Image from 'next/image'; // Import Image

const API_BASE = process.env.NEXT_PUBLIC_API_BASE_URL

// Format date to 'YYYY-MM-DD HH:MM:SS' for database submission
const formatForDB = (dateString) => {
    if (!dateString) return null;
    try {
        const date = new Date(dateString);
        if (isNaN(date.getTime())) return null;
        // Output format compatible with MySQL DATETIME
        return date.toISOString().slice(0, 19).replace('T', ' ');
    } catch {
        return null;
    }
};

// Format date from DB 'YYYY-MM-DD HH:MM:SS' to 'YYYY-MM-DDTHH:MM' for datetime-local input
const formatForInput = (dbDateString) => {
    if (!dbDateString) return '';
    try {
        // Assume dbDateString is UTC or correctly represents local time in DB
        // Try parsing assuming it's UTC first
        let date = new Date(dbDateString.replace(' ', 'T') + 'Z');
        if (isNaN(date.getTime())) {
            // Fallback: Try parsing as local time if UTC fails
            date = new Date(dbDateString.replace(' ', 'T'));
            if (isNaN(date.getTime())) return ''; // Return empty if both fail
        }

        // Format to local 'YYYY-MM-DDTHH:MM'
        const year = date.getFullYear();
        const month = (date.getMonth() + 1).toString().padStart(2, '0');
        const day = date.getDate().toString().padStart(2, '0');
        const hours = date.getHours().toString().padStart(2, '0');
        const minutes = date.getMinutes().toString().padStart(2, '0');

        return `${year}-${month}-${day}T${hours}:${minutes}`;
    } catch {
        return '';
    }
};



export default function Page() {
    const router = useRouter()
    const params = useParams()
    const saleId = params?.id

    const [user, setUser] = useState(null) // Admin user state
    const [authLoading, setAuthLoading] = useState(true) // Auth loading state

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

    // Combined state for data loading and submission
    const [state, setState] = useState({ loading: true, submitting: false, error: null })

    const [form, setForm] = useState({
        name: '',
        product_id: '',
        price_sale: '',
        date_begin: '', // Stores YYYY-MM-DDTHH:MM
        date_end: '',   // Stores YYYY-MM-DDTHH:MM
        status: 1,
        price_buy: '', // Store original price as string for display
    })

    const [allSales, setAllSales] = useState([]) // Existing sales for validation
    const [selectedProductDetail, setSelectedProductDetail] = useState(null) // Details of the selected product

    // Fetch existing sale data and all sales for validation
    useEffect(() => {
        if (!saleId || authLoading) return // Wait for ID and auth check

        const fetchInitialData = async () => {
            setState(s => ({ ...s, loading: true, error: null }))
            try {
                const [saleRes, allSalesRes] = await Promise.all([
                    fetch(`${API_BASE}/product-sale/${saleId}`, { cache: 'no-store' }),
                    fetch(`${API_BASE}/product-sale`, { cache: 'no-store' }) // Fetch all sales
                ]);

                if (!saleRes.ok) {
                    if (saleRes.status === 404) throw new Error(`Không tìm thấy khuyến mãi ID ${saleId}.`);
                    throw new Error(`Không lấy được dữ liệu khuyến mãi (HTTP ${saleRes.status})`);
                }
                if (!allSalesRes.ok) console.error("Could not fetch all sales for validation."); // Log warning but continue


                const saleJson = await saleRes.json()
                const s = saleJson?.data || saleJson

                // Fetch product details for the specific sale item
                let productDetail = null;
                if (s.product_id) {
                    try {
                        const productRes = await fetch(`${API_BASE}/getAdminProductDetail/${s.product_id}`, { cache: 'no-store' }); // Use Detail endpoint
                        if (productRes.ok) {
                            const productJson = await productRes.json();
                            productDetail = productJson?.data || productJson; // Handle potential nesting
                        } else {
                            console.warn(`Could not fetch product details for ID ${s.product_id}: ${productRes.status}`)
                        }
                    } catch (prodError) {
                        console.error("Error fetching product detail for sale:", prodError);
                    }
                }
                setSelectedProductDetail(productDetail); // Store product details


                setForm({
                    name: s.name || '',
                    product_id: String(s.product_id || ''), // Ensure string
                    price_sale: String(s.price_sale ?? ''), // Ensure string
                    date_begin: formatForInput(s.date_begin), // Format for input
                    date_end: formatForInput(s.date_end),     // Format for input
                    status: Number(s.status ?? 1),
                    // Format original price from fetched productDetail
                    price_buy: productDetail?.price_buy ? `${Intl.NumberFormat('vi-VN').format(productDetail.price_buy)} ₫` : '',
                })

                // Set all sales data for validation
                const allJson = allSalesRes.ok ? await allSalesRes.json() : [];
                const list = Array.isArray(allJson) ? allJson : (Array.isArray(allJson?.data) ? allJson.data : []);
                setAllSales(list);

            } catch (e) {
                setState(s => ({ ...s, error: e?.message || 'Lỗi tải dữ liệu' }))
            } finally {
                setState(s => ({ ...s, loading: false }))
            }
        };
        fetchInitialData();
    }, [saleId, authLoading]) // Trigger after auth check


    const handleFormChange = (e) => {
        const { name, value } = e.target
        setForm(prev => ({ ...prev, [name]: name === 'status' ? Number(value) : value }))
    }

    // Validation (same as create page, but excludes the current sale ID)
    const validateTimeOverlap = () => {
        if (!form.name.trim()) return 'Vui lòng nhập tên chương trình.';
        // product_id is fixed in edit, no need to check selection
        const price = parseFloat(form.price_sale);
        if (isNaN(price) || price <= 0) return 'Giá giảm giá không hợp lệ.';
        if (!form.date_begin || !form.date_end) return 'Vui lòng chọn ngày bắt đầu và kết thúc.';

        const formStartDate = new Date(form.date_begin);
        const formEndDate = new Date(form.date_end);
        if (isNaN(formStartDate.getTime()) || isNaN(formEndDate.getTime())) return 'Ngày bắt đầu hoặc kết thúc không hợp lệ.';
        if (formEndDate <= formStartDate) return 'Ngày kết thúc phải sau ngày bắt đầu.';

        const related = allSales.filter(s =>
            Number(s.product_id) === Number(form.product_id) && // Same product
            Number(s.status) === 1 &&                           // Active sale
            Number(s.id) !== Number(saleId)                     // Exclude current sale being edited
        );

        for (const other of related) {
            try {
                // Parse existing sale dates, assuming DB stores correct format or UTC
                const otherStart = new Date(other.date_begin.replace(' ', 'T') + 'Z'); // Assume UTC or correct local string
                const otherEnd = new Date(other.date_end.replace(' ', 'T') + 'Z');
                if (isNaN(otherStart.getTime()) || isNaN(otherEnd.getTime())) {
                    // Fallback if 'Z' fails
                    const localOtherStart = new Date(other.date_begin.replace(' ', 'T'));
                    const localOtherEnd = new Date(other.date_end.replace(' ', 'T'));
                    if (isNaN(localOtherStart.getTime()) || isNaN(localOtherEnd.getTime())) continue; // Skip if still invalid
                    otherStart.setTime(localOtherStart.getTime());
                    otherEnd.setTime(localOtherEnd.getTime());
                }


                // Check for overlap: (StartA < EndB) and (StartB < EndA)
                if (formStartDate < otherEnd && otherStart < formEndDate) {
                    return (
                        `Lỗi: Thời gian khuyến mãi bị trùng!\n\n` +
                        `Sản phẩm này đã có CTKM khác (ID: ${other.id} - ${other.name}) ` +
                        `từ ${otherStart.toLocaleString('vi-VN')} đến ${otherEnd.toLocaleString('vi-VN')}.\n\n` +
                        `Vui lòng điều chỉnh lại thời gian.`
                    );
                }
            } catch (dateError) {
                console.error("Error parsing date for existing sale:", other, dateError);
                continue; // Skip if date parsing fails for an existing sale
            }
        }
        return null; // No overlap found
    }

    const handleSubmit = async (e) => {
        e.preventDefault()

        if (!user) {
            alert('Không thể xác định người dùng. Vui lòng đăng nhập lại.');
            router.push('/admin/login');
            return;
        }

        const validationError = validateTimeOverlap()
        if (validationError) return alert(validationError)

        const formattedBegin = formatForDB(form.date_begin);
        const formattedEnd = formatForDB(form.date_end);

        if (!formattedBegin || !formattedEnd) {
            alert('Ngày bắt đầu hoặc kết thúc không hợp lệ sau khi định dạng. Vui lòng kiểm tra lại.');
            return;
        }


        setState(s => ({ ...s, submitting: true, error: null }))
        try {
            const payload = {
                name: form.name.trim(),
                product_id: Number(form.product_id), // Already set, ensure it's number
                price_sale: parseFloat(form.price_sale),
                date_begin: formattedBegin, // Use formatted date
                date_end: formattedEnd,     // Use formatted date
                status: Number(form.status),
                updated_at: new Date().toISOString().slice(0, 19).replace('T', ' '), // Consistent format
                updated_by: user.id,
            }

            const res = await fetch(`${API_BASE}/product-sale/${saleId}`, {
                method: 'PUT',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify(payload),
            })
            if (!res.ok) {
                const errorData = await res.json().catch(() => ({}))
                throw new Error(errorData.message || `HTTP ${res.status}`)
            }

            alert('Cập nhật khuyến mãi thành công!')
            router.push('/admin/product_sale')
        } catch (err) {
            setState(s => ({ ...s, error: err?.message || 'Thao tác thất bại' }))
        } finally {
            setState(s => ({ ...s, submitting: false }))
        }
    }

    if (authLoading) {
        return <div className="p-8 text-center animate-pulse">Đang xác thực quyền truy cập...</div>;
    }

    if (state.loading) return <div className="p-8 text-center animate-pulse">Đang tải dữ liệu...</div>;


    return (
        // Only one main grid container
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
            {/* Left: Product Info Display (Readonly) */}
            <aside className="lg:col-span-5 bg-white shadow-xl rounded-2xl border border-gray-100 p-6">
                <h6 className="text-gray-800 text-lg font-semibold mb-4">Thông tin sản phẩm</h6>
                {state.error && !state.loading && !selectedProductDetail && (
                    <div className="p-4 text-center text-red-500 bg-red-50 border border-red-200 rounded">
                        Lỗi tải thông tin sản phẩm hoặc khuyến mãi: {state.error}
                    </div>
                )}
                {selectedProductDetail ? (
                    <div className="flex items-center gap-4">
                        <div className="w-20 h-20 rounded-lg bg-gray-100 flex items-center justify-center overflow-hidden flex-shrink-0 border">
                            {selectedProductDetail.thumbnail ? (
                                <Image src={selectedProductDetail.thumbnail} alt={selectedProductDetail.name} width={80} height={80} className="w-full h-full object-cover" unoptimized />
                            ) : (
                                <span className="text-xs text-gray-500">No img</span>
                            )}
                        </div>
                        <div className="min-w-0 flex-1">
                            <p className="font-semibold text-gray-800 truncate">{selectedProductDetail.name}</p>
                            <p className="text-sm text-gray-500">ID: {selectedProductDetail.id}</p>
                            <p className="text-base text-gray-700 font-medium">
                                Giá gốc: {form.price_buy || 'N/A'} {/* Use formatted price from form */}
                            </p>
                            <p className="text-xs text-gray-500">Tồn kho: {(selectedProductDetail.product_store?.qty ?? 0) - (selectedProductDetail.product_store?.qty_sold ?? 0)}</p>
                        </div>
                    </div>
                ) : !state.error && !state.loading ? ( // Show placeholder only if no error, not loading, and no product
                    <div className="p-6 text-center text-gray-400">Không tìm thấy thông tin sản phẩm liên kết.</div>
                ) : null}
            </aside>

            {/* RIGHT: Edit Form */}
            <section className="lg:col-span-7 flex flex-col min-w-0 mb-6 break-words bg-white border-0 shadow-xl rounded-2xl">
                <div className="p-6 pb-4 mb-0 border-b border-gray-200 rounded-t-2xl">
                    <h6 className="text-gray-800 text-xl font-bold">Chỉnh sửa Khuyến mãi</h6>
                </div>

                <form className="p-6 md:p-8" onSubmit={handleSubmit}>
                    {state.error && !state.loading && <p className="text-red-500 text-sm mb-4 bg-red-50 p-3 rounded border border-red-200">Lỗi: {state.error}</p>}
                    <div className="mb-6">
                        <label htmlFor="name" className="block text-sm font-medium mb-2 text-gray-700">
                            Tên chương trình khuyến mãi <span className="text-red-500">*</span>
                        </label>
                        <input
                            type="text"
                            id="name"
                            name="name"
                            value={form.name}
                            onChange={handleFormChange}
                            required
                            className="w-full h-12 pl-4 pr-4 rounded-lg bg-gray-100 border border-gray-300 focus:ring-2 focus:ring-indigo-500"
                        />
                    </div>

                    {/* Display Product ID (disabled) */}
                    <div className="mb-6">
                        <label className="block text-sm font-medium mb-2 text-gray-700">Mã sản phẩm</label>
                        <input
                            type="text"
                            value={form.product_id}
                            disabled
                            className="w-full h-12 pl-4 pr-4 rounded-lg bg-gray-200 border border-gray-300 cursor-not-allowed"
                        />
                    </div>

                    <div className="mb-6">
                        <label htmlFor="price_sale" className="block text-sm font-medium mb-2 text-gray-700">
                            Giá giảm giá (VNĐ) <span className="text-red-500">*</span>
                        </label>
                        <input
                            type="number"
                            id="price_sale"
                            name="price_sale"
                            min="0"
                            step="any"
                            value={form.price_sale}
                            onChange={handleFormChange}
                            required
                            className="w-full h-12 pl-4 pr-4 rounded-lg bg-gray-100 border border-gray-300 focus:ring-2 focus:ring-indigo-500"
                        />
                    </div>

                    <div className="grid md:grid-cols-2 gap-6">
                        <div className="mb-6">
                            <label htmlFor="date_begin" className="block text-sm font-medium mb-2 text-gray-700">
                                Ngày bắt đầu <span className="text-red-500">*</span>
                            </label>
                            <input
                                type="datetime-local"
                                id="date_begin"
                                name="date_begin"
                                value={form.date_begin}
                                onChange={handleFormChange}
                                required
                                className="w-full h-12 px-4 rounded-lg bg-gray-100 border border-gray-300 focus:ring-2 focus:ring-indigo-500"
                            />
                        </div>
                        <div className="mb-6">
                            <label htmlFor="date_end" className="block text-sm font-medium mb-2 text-gray-700">
                                Ngày kết thúc <span className="text-red-500">*</span>
                            </label>
                            <input
                                type="datetime-local"
                                id="date_end"
                                name="date_end"
                                value={form.date_end}
                                onChange={handleFormChange}
                                required
                                className="w-full h-12 px-4 rounded-lg bg-gray-100 border border-gray-300 focus:ring-2 focus:ring-indigo-500"
                            />
                        </div>
                    </div>

                    <div className="mb-6">
                        <label htmlFor="status" className="block text-sm font-medium mb-2 text-gray-700">Trạng thái</label>
                        <select
                            id="status"
                            name="status"
                            value={form.status}
                            onChange={handleFormChange}
                            className="w-full h-12 px-4 rounded-lg bg-gray-100 border border-gray-300 focus:ring-2 focus:ring-indigo-500"
                        >
                            <option value={1}>Kích hoạt</option>
                            <option value={0}>Tạm ẩn</option>
                        </select>
                    </div>

                    <div className="flex justify-end gap-3 border-t border-gray-200 pt-6">
                        <Link
                            href="/admin/product_sale"
                            className="px-4 py-2.5 bg-gray-200 hover:bg-gray-300 text-gray-800 text-sm font-medium rounded-lg"
                        >
                            Hủy
                        </Link>
                        <button
                            type="submit"
                            disabled={state.submitting}
                            className="px-4 py-2.5 bg-indigo-600 text-white rounded-lg disabled:opacity-60 disabled:cursor-not-allowed"
                        >
                            {state.submitting ? 'Đang xử lý...' : 'Cập nhật'}
                        </button>
                    </div>
                </form>
            </section>
        </div>
    )
}

