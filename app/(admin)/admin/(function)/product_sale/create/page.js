'use client'

import React, { useEffect, useState } from 'react'
import Link from 'next/link'
import { useRouter } from 'next/navigation'

const API_BASE = process.env.NEXT_PUBLIC_API_BASE_URL

// Format date to 'YYYY-MM-DD HH:MM:SS' for database
const formatForDB = (dateString) => {
    if (!dateString) return null
    try {
        // Ensure the input is treated as local time when creating the Date object
        const date = new Date(dateString);
        if (isNaN(date.getTime())) return null; // Invalid date input

        // Adjust for local timezone offset ONLY if necessary (often not needed if input is local)
        // const tzOffset = date.getTimezoneOffset() * 60000;
        // const localISOTime = (new Date(date.getTime() - tzOffset)).toISOString().slice(0, 19);

        // Directly format if the input is already correct local time
        const localISOTime = new Date(date).toISOString().slice(0, 19);


        return localISOTime.replace('T', ' ');
    } catch {
        return null; // Handle potential errors during date parsing
    }
}

// Format date from DB 'YYYY-MM-DD HH:MM:SS' to 'YYYY-MM-DDTHH:MM' for datetime-local input
const formatForInput = (dbDateString) => {
    if (!dbDateString) return '';
    try {
        // Replace space with 'T' for Date constructor
        const date = new Date(dbDateString.replace(' ', 'T'));
        if (isNaN(date.getTime())) return ''; // Invalid date from DB

        // Format to 'YYYY-MM-DDTHH:MM'
        const year = date.getFullYear();
        const month = (date.getMonth() + 1).toString().padStart(2, '0');
        const day = date.getDate().toString().padStart(2, '0');
        const hours = date.getHours().toString().padStart(2, '0');
        const minutes = date.getMinutes().toString().padStart(2, '0');

        return `${year}-${month}-${day}T${hours}:${minutes}`;
    } catch {
        return '';
    }
}

export default function Page() {
    const router = useRouter()

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
    const [state, setState] = useState({ dataLoading: true, submitting: false, error: null })

    const [form, setForm] = useState({
        name: '',
        product_id: '',
        price_sale: '',
        date_begin: '', // Store as YYYY-MM-DDTHH:MM for input
        date_end: '',   // Store as YYYY-MM-DDTHH:MM for input
        status: 1,
        price_buy: '', // To display original price for reference
    })

    const [allSales, setAllSales] = useState([]) // Existing sales for validation

    // Product Picker State
    const [query, setQuery] = useState('')
    const [debouncedQuery, setDebouncedQuery] = useState('')
    const [page, setPage] = useState(1)
    const [pickerLoading, setPickerLoading] = useState(false) // Start as false
    const [pickerError, setPickerError] = useState(null)
    const [pickerItems, setPickerItems] = useState([])
    const [pickerTotal, setPickerTotal] = useState(0)
    const [pickerLastPage, setPickerLastPage] = useState(1)

    // Fetch existing sales data for validation
    useEffect(() => {
        if (authLoading) return; // Wait for auth check

        const fetchExistingSales = async () => {
            setState(s => ({ ...s, dataLoading: true, error: null })); // Start data loading
            try {
                const salesRes = await fetch(`${API_BASE}/product-sale`) // Fetch all sales
                if (!salesRes.ok) throw new Error('Lỗi tải danh sách khuyến mãi hiện có.')
                const salesJson = await salesRes.json()
                setAllSales(Array.isArray(salesJson) ? salesJson : (Array.isArray(salesJson?.data) ? salesJson.data : []))
            } catch (e) {
                setState(s => ({ ...s, error: e?.message || 'Lỗi tải dữ liệu cần thiết' }))
            } finally {
                setState(s => ({ ...s, dataLoading: false })); // End data loading
            }
        };
        fetchExistingSales();
    }, [authLoading]) // Trigger after auth check

    // Debounce search query
    useEffect(() => {
        const t = setTimeout(() => setDebouncedQuery(query.trim()), 350)
        return () => clearTimeout(t)
    }, [query])

    // Fetch products for picker based on search/page
    useEffect(() => {
        if (authLoading) return; // Wait for auth check

        const fetchProductsForPicker = async () => {
            setPickerLoading(true)
            setPickerError(null)
            try {
                const qs = new URLSearchParams()
                qs.set('page', String(page))
                if (debouncedQuery) qs.set('search', debouncedQuery)

                const res = await fetch(`${API_BASE}/getAdminProduct?${qs.toString()}`, { cache: 'no-store' })
                if (!res.ok) throw new Error(`Lỗi tải sản phẩm (HTTP ${res.status})`)
                const json = await res.json()

                const items = Array.isArray(json?.data) ? json.data : []
                setPickerItems(items)
                setPickerTotal(json?.total || items.length || 0)
                setPickerLastPage(json?.last_page || 1)
            } catch (e) {
                setPickerError(e?.message || 'Không tải được danh sách sản phẩm')
                setPickerItems([]) // Clear items on error
                setPickerTotal(0)
                setPickerLastPage(1)
            } finally {
                setPickerLoading(false)
            }
        };
        fetchProductsForPicker();
    }, [debouncedQuery, page, authLoading]) // Trigger after auth check and on page/query change


    const handleFormChange = (e) => {
        const { name, value } = e.target
        setForm(prev => ({ ...prev, [name]: name === 'status' ? Number(value) : value }))
    }

    // Update form when a product is picked
    const handlePickProduct = (p) => {
        setForm(prev => ({
            ...prev,
            name: `Khuyến mãi ${p.name || ''}`.trim(), // Auto-generate name
            price_buy: p.price_buy ? `${Intl.NumberFormat('vi-VN').format(p.price_buy)} ₫` : '', // Format original price
            product_id: String(p.id || ''), // Ensure product_id is a string
        }))
    }

    // Validate form, especially time overlap
    const validateTimeOverlap = () => {
        if (!form.name.trim()) return 'Vui lòng nhập tên chương trình.'
        if (!form.product_id) return 'Vui lòng chọn sản phẩm.'
        const price = parseFloat(form.price_sale)
        if (isNaN(price) || price <= 0) return 'Giá giảm giá không hợp lệ.'
        if (!form.date_begin || !form.date_end) return 'Vui lòng chọn ngày bắt đầu và kết thúc.'

        const formStartDate = new Date(form.date_begin)
        const formEndDate = new Date(form.date_end)
        if (isNaN(formStartDate.getTime()) || isNaN(formEndDate.getTime())) return 'Ngày bắt đầu hoặc kết thúc không hợp lệ.'
        if (formEndDate <= formStartDate) return 'Ngày kết thúc phải sau ngày bắt đầu.'

        // Filter relevant existing sales
        const related = allSales.filter(s =>
            Number(s.product_id) === Number(form.product_id) &&
            Number(s.status) === 1 // Only check active sales
        )

        for (const other of related) {
            try {
                const otherStart = new Date(other.date_begin.replace(' ', 'T')); // Handle DB format
                const otherEnd = new Date(other.date_end.replace(' ', 'T')); // Handle DB format
                if (isNaN(otherStart.getTime()) || isNaN(otherEnd.getTime())) continue; // Skip invalid dates in existing data

                // Check for overlap: (StartA < EndB) and (StartB < EndA)
                if (formStartDate < otherEnd && otherStart < formEndDate) {
                    return (
                        `Lỗi: Thời gian khuyến mãi bị trùng!\n\n` +
                        `Sản phẩm này đã có CTKM khác (ID: ${other.id} - ${other.name}) ` +
                        `từ ${otherStart.toLocaleString('vi-VN')} đến ${otherEnd.toLocaleString('vi-VN')}.\n\n` +
                        `Vui lòng điều chỉnh lại thời gian.`
                    )
                }
            } catch (dateError) {
                console.error("Error parsing date for existing sale:", other, dateError);
                continue; // Skip if date parsing fails for an existing sale
            }
        }
        return null // No overlap found
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
            alert('Ngày bắt đầu hoặc kết thúc không hợp lệ. Vui lòng kiểm tra lại.');
            return;
        }


        setState(s => ({ ...s, submitting: true, error: null }))
        try {
            const payload = {
                name: form.name.trim(),
                product_id: Number(form.product_id),
                price_sale: parseFloat(form.price_sale),
                date_begin: formattedBegin, // Use formatted date
                date_end: formattedEnd,     // Use formatted date
                status: Number(form.status),
                created_at: new Date().toISOString().slice(0, 19).replace('T', ' '), // Consistent format
                created_by: user.id,
            }

            const res = await fetch(`${API_BASE}/product-sale`, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify(payload),
            })
            if (!res.ok) {
                const errorData = await res.json().catch(() => ({}))
                throw new Error(errorData.message || `HTTP ${res.status}`)
            }

            alert('Tạo khuyến mãi mới thành công!')
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

    if (state.dataLoading) return <div className="p-8 text-center animate-pulse">Đang tải dữ liệu cần thiết...</div>;


    return (
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
            <aside className="lg:col-span-5 bg-white shadow-xl rounded-2xl border border-gray-100">
                <div className="p-6 border-b border-gray-200 rounded-t-2xl">
                    <h6 className="text-gray-800 text-lg font-semibold">Chọn sản phẩm</h6>
                    <p className="text-sm text-gray-500 mt-1">Tìm kiếm & phân trang</p>
                    <div className="mt-4 flex gap-3">
                        <input
                            value={query}
                            onChange={(e) => { setQuery(e.target.value); setPage(1) }}
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
                                const name = p.name || 'Sản phẩm không tên'; // Fallback name
                                const price = p.price_buy;
                                const active = Number(form.product_id) === p.id;
                                return (
                                    <li key={p.id}>
                                        <button
                                            type="button"
                                            onClick={() => handlePickProduct(p)}
                                            className={`w-full text-left rounded-xl border p-3 hover:shadow-md transition ${active ? 'border-indigo-500 ring-2 ring-indigo-200' : 'border-gray-200'}`}
                                        >
                                            <div className="flex items-center gap-3">
                                                <div className="w-12 h-12 rounded-lg bg-gray-100 flex items-center justify-center overflow-hidden flex-shrink-0">
                                                    {p.thumbnail ? (
                                                        <Image src={p.thumbnail} alt={name} width={48} height={48} className="w-full h-full object-cover" unoptimized />
                                                    ) : (
                                                        <span className="text-xs text-gray-500">No img</span>
                                                    )}
                                                </div>
                                                <div className="min-w-0 flex-1">
                                                    <p className="font-medium text-gray-800 truncate">{name}</p>
                                                    <p className="text-xs text-gray-500">ID: {p.id}</p>
                                                    <p className="text-sm text-gray-700">
                                                        Giá gốc: {price ? Intl.NumberFormat('vi-VN').format(price) + ' ₫' : 'N/A'}
                                                    </p>
                                                </div>
                                            </div>
                                        </button>
                                    </li>
                                )
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

            <section className="lg:col-span-7 flex flex-col min-w-0 mb-6 break-words bg-white border-0 shadow-xl rounded-2xl">
                <div className="p-6 pb-4 mb-0 border-b border-gray-200 rounded-t-2xl">
                    <h6 className="text-gray-800 text-xl font-bold">Thêm Khuyến mãi mới</h6>
                </div>

                <form className="p-6 md:p-8" onSubmit={handleSubmit}>
                    {state.error && <p className="text-red-500 text-sm mb-4 bg-red-50 p-3 rounded border border-red-200">Lỗi: {state.error}</p>}
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

                    <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
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
                            <label className="block text-sm font-medium mb-2 text-gray-700">Giá gốc (Tham khảo)</label>
                            <input
                                type="text"
                                value={form.price_buy}
                                disabled
                                className="w-full h-12 pl-4 pr-4 rounded-lg bg-gray-200 border border-gray-300 cursor-not-allowed"
                            />
                        </div>
                    </div>


                    <div className="mb-6">
                        <label htmlFor="price_sale" className="block text-sm font-medium mb-2 text-gray-700">
                            Giá giảm giá (VNĐ) <span className="text-red-500">*</span>
                        </label>
                        <input
                            type="number"
                            id="price_sale"
                            name="price_sale"
                            min="0" // Prevent negative
                            step="any" // Allow decimals if needed
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
                            {state.submitting ? 'Đang xử lý...' : 'Thêm Khuyến mãi'}
                        </button>
                    </div>
                </form>
            </section>
        </div>
    )
}
