'use client';

import { useEffect, useMemo, useRef, useState } from 'react';
import Link from 'next/link';
import { useRouter, useSearchParams } from 'next/navigation';

const API_BASE = process.env.NEXT_PUBLIC_API_BASE_URL;

const fmtVND = (n) =>
    new Intl.NumberFormat('vi-VN', { style: 'currency', currency: 'VND' })
        .format(Number.isFinite(n) ? n : 0);

const toDate = (s) => (typeof s === 'string' ? new Date(s.replace(' ', 'T')) : null);
const isSaleActive = (sale, now = new Date()) => {
    const b = toDate(sale?.date_begin);
    const e = toDate(sale?.date_end);
    if (!b || !e) return false;
    return now >= b && now <= e;
};
const getBasePrice = (p) => Number(p?.product_price_buy ?? p?.product_price ?? 0);
const getEffectivePrice = (p, now = new Date()) => {
    const base = getBasePrice(p);
    const sales = Array.isArray(p?.product_sale) ? p.product_sale : [];
    const active = sales.filter((s) => isSaleActive(s, now));
    if (active.length === 0) return { price: base, hasSale: false, basePrice: base, salePrice: null };
    const minSale = active.reduce(
        (acc, s) => (acc == null || Number(s.price_sale) < acc ? Number(s.price_sale) : acc),
        null
    );
    const salePrice = Number(minSale ?? base);
    return { price: salePrice, hasSale: salePrice < base, basePrice: base, salePrice };
};


const useCart = () => {
    const [cartItems, setCartItems] = useState([]);
    const [cartMounted, setCartMounted] = useState(false);
    const [enriching, setEnriching] = useState(true);

    useEffect(() => {
        try {
            const raw = localStorage.getItem('cart');
            const data = raw ? JSON.parse(raw) : [];
            const arr = Array.isArray(data) ? data : [];
            const map = new Map();
            for (const it of arr) {
                const id = Number(it.id);
                const qty = Math.max(1, Number(it.qty || 1));
                if (!id) continue;
                map.set(id, (map.get(id) || 0) + qty);
            }
            setCartItems([...map.entries()].map(([id, qty]) => ({ id, qty })));
        } catch {
            setCartItems([]);
        } finally {
            setCartMounted(true);
        }
    }, []);

    useEffect(() => {
        if (!cartMounted) return;
        if (cartItems.length === 0) {
            setEnriching(false);
            return;
        }
        const need = cartItems.some((i) => typeof i.product_name === 'undefined');
        if (!need) {
            setEnriching(false);
            return;
        }

        const ac = new AbortController();
        const { signal } = ac;

        (async () => {
            setEnriching(true);
            try {
                const details = await Promise.all(
                    cartItems.map(async (row) => {
                        if (typeof row.product_name !== 'undefined') return row;
                        const res = await fetch(`${API_BASE}/showById/${row.id}`, { signal });
                        if (!res.ok) throw new Error(`showById ${row.id} HTTP ${res.status}`);
                        const d = await res.json();
                        return { ...d, qty: row.qty };
                    })
                );
                const map = new Map(details.map((d) => [Number(d.id), d]));
                const merged = cartItems.map((row) => map.get(Number(row.id)) || row);
                setCartItems(merged);
            } catch (e) {
                if (e.name !== 'AbortError') console.error('Enrich cart failed:', e);
            } finally {
                setEnriching(false);
            }
        })();

        return () => ac.abort();
    }, [cartMounted, cartItems.length]);

    useEffect(() => {
        if (!cartMounted) return;
        try {
            const minimal = cartItems.map((i) => ({
                id: i.id,
                qty: Math.max(1, Number(i.qty || 1)),
            }));
            localStorage.setItem('cart', JSON.stringify(minimal));
            window.dispatchEvent(new Event('cartUpdated'));
        } catch { }
    }, [cartItems, cartMounted]);

    const subtotal = useMemo(() => {
        return cartItems.reduce((s, it) => {
            const { price } =
                typeof it.product_name !== 'undefined' ? getEffectivePrice(it) : { price: 0 };
            return s + price * Math.max(1, Number(it.qty || 1));
        }, 0);
    }, [cartItems]);

    return { cartItems, setCartItems, subtotal, cartMounted, enriching };
};

export default function PaymentPage() {
    const router = useRouter();
    const searchParams = useSearchParams();
    const existingOrderId = searchParams.get('orderId');

    const { cartItems, subtotal: cartSubtotal, cartMounted, enriching } = useCart();

    const [mounted, setMounted] = useState(false);
    const [token, setToken] = useState(null);
    const [user, setUser] = useState(null);
    const [authChecking, setAuthChecking] = useState(true);

    const [step, setStep] = useState(1);
    const [paymentMethod, setPaymentMethod] = useState('momo');
    const [loading, setLoading] = useState(false);

    const [shippingInfo, setShippingInfo] = useState({
        email: '',
        phone: '',
        name: '',
        address: '',
        note: '',
    });

    const [orderDetail, setOrderDetail] = useState({
        loading: !!existingOrderId,
        data: null,
        error: null,
    });


    const [sepayOrderId, setSepayOrderId] = useState(null);
    const [sepayPolling, setSepayPolling] = useState(false);
    const sepayTimerRef = useRef(null);

    const shippingFee = 0;

    const orderItems = useMemo(() => {
        const d = orderDetail.data;
        return Array.isArray(d?.order_detail) ? d.order_detail : [];
    }, [orderDetail.data]);

    const orderTotal = useMemo(() => {
        const d = orderDetail.data;
        if (!d) return 0;
        return orderItems.reduce((sum, it) => {
            const amount = Number(it?.amount);
            if (Number.isFinite(amount)) return sum + amount;
            const p = Number(it?.price);
            const q = Number(it?.qty);
            return sum + (Number.isFinite(p) && Number.isFinite(q) ? p * q : 0);
        }, 0);
    }, [orderDetail.data, orderItems]);

    const subtotal = existingOrderId ? orderTotal : cartSubtotal;
    const total = useMemo(() => subtotal + shippingFee, [subtotal, shippingFee]);

    useEffect(() => {
        setMounted(true);
    }, []);

    useEffect(() => {
        let cancelled = false;

        const run = async () => {
            try {
                const t = localStorage.getItem('token');
                setToken(t);

                if (!t) {
                    setAuthChecking(false);
                    alert('Vui lòng đăng nhập lại.');
                    router.replace('/dang-nhap');
                    return;
                }

                const rs = await fetch(`${API_BASE}/verifyUser`, {
                    headers: { Authorization: t },
                    cache: 'no-store',
                });

                if (!rs.ok) {
                    setAuthChecking(false);
                    alert('Vui lòng đăng nhập lại.');
                    router.replace('/dang-nhap');
                    return;
                }

                const data = await rs.json();
                if (cancelled) return;

                setUser(data);

                if (!existingOrderId) {
                    setShippingInfo(() => ({
                        email: data.email || '',
                        phone: data.phone || '',
                        name: data.name || '',
                        address: '',
                        note: '',
                    }));
                }
            } catch (e) {
                console.error(e);
                router.replace('/dang-nhap');
            } finally {
                if (!cancelled) setAuthChecking(false);
            }
        };

        run();
        return () => {
            cancelled = true;
        };
    }, [router, existingOrderId]);

    useEffect(() => {
        if (!existingOrderId) return;
        let cancelled = false;

        (async () => {
            setOrderDetail({ loading: true, data: null, error: null });
            try {
                const r = await fetch(`${API_BASE}/order/${encodeURIComponent(existingOrderId)}`, {
                    cache: 'no-store',
                });
                if (!r.ok) throw new Error(`HTTP ${r.status}`);
                const data = await r.json();

                const patch = {
                    email: data?.email ?? '',
                    phone: data?.phone ?? '',
                    name: data?.name ?? '',
                    address: data?.address ?? '',
                    note: data?.note ?? '',
                };
                if (!cancelled) {
                    setOrderDetail({ loading: false, data, error: null });
                    setShippingInfo((prev) => ({ ...prev, ...patch }));
                }
            } catch (e) {
                if (!cancelled) setOrderDetail({ loading: false, data: null, error: e.message || 'Fetch lỗi' });
            }
        })();

        return () => {
            cancelled = true;
        };
    }, [existingOrderId]);

    const createOrder = async () => {
        const itemsPayload = cartItems.map((it) => {
            const { price: unit } =
                typeof it.product_name !== 'undefined' ? getEffectivePrice(it) : { price: 0 };
            return {
                id: it.id,
                price: unit,
                qty: Math.max(1, Number(it.qty || 1)),
            };
        });

        const orderRes = await fetch(`${API_BASE}/order`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({
                user_id: user.id,
                name: shippingInfo.name,
                email: shippingInfo.email,
                phone: shippingInfo.phone,
                address: shippingInfo.address,
                note: shippingInfo.note,
                status: 1,
                created_by: user.id,
                total,
                items: itemsPayload,
            }),
        });
        if (!orderRes.ok) throw new Error(`Create order HTTP ${orderRes.status}`);
        const orderJson = await orderRes.json();
        const orderId = orderJson?.id || orderJson?.data?.id || orderJson?.order?.id;
        if (!orderId) throw new Error('Không nhận được orderId');
        return orderId;
    };

    const payWithMomo = async (orderId) => {
        const momoRes = await fetch(`${API_BASE}/payments/momo/create`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ orderId, amount: total }),
        });
        if (!momoRes.ok) throw new Error(`MoMo create HTTP ${momoRes.status}`);
        const momoJson = await momoRes.json();
        const payUrl = momoJson?.payUrl || momoJson?.data?.payUrl || momoJson?.result?.payUrl;
        if (!payUrl) throw new Error('Không nhận được payUrl từ backend');
        window.location.href = payUrl;
    };

    const startPollOrderStatus = (orderId) => {
        setSepayPolling(true);
        if (sepayTimerRef.current) clearTimeout(sepayTimerRef.current);

        const tick = async () => {
            try {
                const r = await fetch(`${API_BASE}/order/${encodeURIComponent(orderId)}`, {
                    cache: 'no-store',
                });
                if (!r.ok) throw new Error('HTTP ' + r.status);
                const o = await r.json();
                if (o?.status === 2) {
                    router.replace(`/ket-qua-thanh-toan?orderId=${orderId}&provider=sepay`);
                    return;
                }
            } catch (e) { }
            sepayTimerRef.current = setTimeout(tick, 2000);
        };

        sepayTimerRef.current = setTimeout(tick, 2000);
    };

    const payWithSePay = async (orderId) => {
        setSepayOrderId(orderId);
        startPollOrderStatus(orderId);
    };

    const handleSubmit = async (e) => {
        e.preventDefault();

        if (step === 1) {
            if (
                !shippingInfo.email ||
                !shippingInfo.phone ||
                !shippingInfo.name ||
                !shippingInfo.address
            ) {
                alert('Vui lòng điền đầy đủ thông tin giao hàng.');
                return;
            }
            setStep(2);
            return;
        }

        if (!user || !token) {
            alert('Vui lòng đăng nhập lại.');
            router.replace('/dang-nhap');
            return;
        }
        if (!existingOrderId && cartItems.length === 0) {
            alert('Giỏ hàng trống.');
            router.replace('/san-pham');
            return;
        }

        setLoading(true);
        try {
            const orderId = existingOrderId || (await createOrder());

            if (paymentMethod === 'momo') {
                await payWithMomo(orderId);
            } else if (paymentMethod === 'card') {
                alert('Thanh toán thẻ (demo).');
            } else if (paymentMethod === 'sepay') {
                await payWithSePay(orderId);
            }
        } catch (err) {
            console.error(err);
            alert(err?.message || 'Không thể khởi tạo thanh toán. Vui lòng thử lại.');
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => {
        return () => {
            if (sepayTimerRef.current) {
                clearTimeout(sepayTimerRef.current);
                sepayTimerRef.current = null;
            }
        };
    }, []);

    const isBlockingLoad =
        !mounted || !cartMounted || authChecking || (existingOrderId && orderDetail.loading);

    if (isBlockingLoad) {
        return (
            <div className="min-h-screen grid place-items-center">
                <div className="text-gray-600">Đang tải…</div>
            </div>
        );
    }

    const sepayQR = sepayOrderId
        ? `https://qr.sepay.vn/img?acc=${encodeURIComponent('96247XIEN25')}&bank=${encodeURIComponent(
            'BIDV'
        )}&amount=${encodeURIComponent(total)}&des=${encodeURIComponent(
            'XIEN' + sepayOrderId
        )}&template=compact`
        : null;

    return (
        <div className="min-h-screen pt-30">
            <div className="max-w-7xl mx-auto px-4 py-8 sm:px-6 lg:px-8">
                <div className="mb-8">
                    {!existingOrderId && (
                        <Link
                            href="/gio-hang"
                            className="flex items-center gap-2 text-gray-600 hover:text-gray-900 transition-colors mb-4 font-semibold"
                        >
                            <i className="fa-solid fa-arrow-left w-5 h-5" />
                            Quay lại giỏ hàng
                        </Link>
                    )}

                    <h1 className="text-4xl font-bold bg-gradient-to-r from-gray-900 to-gray-600 bg-clip-text text-transparent flex items-center gap-3">
                        <div className="bg-gradient-to-br from-blue-600 to-indigo-600 p-3 rounded-2xl shadow-lg">
                            <i className="fa-solid fa-lock w-8 h-8 text-white" />
                        </div>
                        {existingOrderId ? `Thanh toán lại #${existingOrderId}` : 'Thanh toán an toàn'}
                    </h1>

                    <div className="flex items-center gap-4 mt-6">
                        <div className={`flex items-center gap-2 ${step >= 1 ? 'text-blue-600' : 'text-gray-400'}`}>
                            <div className={`w-10 h-10 rounded-full flex items-center justify-center font-bold ${step >= 1 ? 'bg-blue-600 text-white' : 'bg-gray-200'}`}>
                                {step > 1 ? <i className="fa-solid fa-check w-6 h-6" /> : '1'}
                            </div>
                            <span className="font-semibold hidden sm:inline">Giao hàng</span>
                        </div>
                        <div className="flex-1 h-1 bg-gray-200 rounded">
                            <div className={`h-1 rounded transition-all duration-500 ${step >= 2 ? 'bg-blue-600 w-full' : 'w-0'}`} />
                        </div>
                        <div className={`flex items-center gap-2 ${step >= 2 ? 'text-blue-600' : 'text-gray-400'}`}>
                            <div className={`w-10 h-10 rounded-full flex items-center justify-center font-bold ${step >= 2 ? 'bg-blue-600 text-white' : 'bg-gray-200'}`}>
                                2
                            </div>
                            <span className="font-semibold hidden sm:inline">Thanh toán</span>
                        </div>
                    </div>
                </div>

                <div className="grid lg:grid-cols-3 gap-8">
                    <div className="lg:col-span-2">
                        <form onSubmit={handleSubmit}>
                            {step === 1 && (
                                <div className="bg-white rounded-3xl shadow-2xl p-8 backdrop-blur-sm bg-opacity-95 border border-gray-100">
                                    <h2 className="text-2xl font-bold text-gray-900 mb-6 flex items-center gap-2">
                                        <i className="fa-solid fa-truck w-6 h-6 text-blue-600" />
                                        Thông tin giao hàng
                                    </h2>

                                    <div className="space-y-5">
                                        <div className="grid md:grid-cols-2 gap-5">
                                            <div>
                                                <label className="block text-sm font-semibold text-gray-700 mb-2">
                                                    <i className="fa-solid fa-envelope text-blue-600 mr-2" />
                                                    Email
                                                </label>
                                                <input
                                                    type="email"
                                                    value={shippingInfo.email}
                                                    onChange={(e) =>
                                                        setShippingInfo({ ...shippingInfo, email: e.target.value })
                                                    }
                                                    className="w-full border-2 border-gray-200 rounded-xl px-4 py-3 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all"
                                                    placeholder="ten@vidu.com"
                                                    required
                                                />
                                            </div>
                                            <div>
                                                <label className="block text-sm font-semibold text-gray-700 mb-2">
                                                    <i className="fa-solid fa-phone text-blue-600 mr-2" />
                                                    Số điện thoại
                                                </label>
                                                <input
                                                    type="tel"
                                                    value={shippingInfo.phone}
                                                    onChange={(e) =>
                                                        setShippingInfo({ ...shippingInfo, phone: e.target.value })
                                                    }
                                                    className="w-full border-2 border-gray-200 rounded-xl px-4 py-3 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all"
                                                    placeholder="09xx xxx xxx"
                                                    required
                                                />
                                            </div>
                                        </div>

                                        <div>
                                            <label className="block text-sm font-semibold text-gray-700 mb-2">Họ và Tên</label>
                                            <input
                                                type="text"
                                                value={shippingInfo.name}
                                                onChange={(e) =>
                                                    setShippingInfo({ ...shippingInfo, name: e.target.value })
                                                }
                                                className="w-full border-2 border-gray-200 rounded-xl px-4 py-3 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all"
                                                placeholder="Nguyễn Văn A"
                                                required
                                            />
                                        </div>

                                        <div>
                                            <label className="block text-sm font-semibold text-gray-700 mb-2">
                                                <i className="fa-solid fa-location-dot text-blue-600 mr-2" />
                                                Địa chỉ
                                            </label>
                                            <input
                                                type="text"
                                                value={shippingInfo.address}
                                                onChange={(e) =>
                                                    setShippingInfo({ ...shippingInfo, address: e.target.value })
                                                }
                                                className="w-full border-2 border-gray-200 rounded-xl px-4 py-3 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all"
                                                placeholder="Số nhà, đường..."
                                                required
                                            />
                                        </div>

                                        <div>
                                            <label className="block text-sm font-semibold text-gray-700 mb-2">Ghi chú</label>
                                            <input
                                                type="text"
                                                value={shippingInfo.note}
                                                onChange={(e) =>
                                                    setShippingInfo({ ...shippingInfo, note: e.target.value })
                                                }
                                                className="w-full border-2 border-gray-200 rounded-xl px-4 py-3 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all"
                                                placeholder="Ghi chú đơn hàng"
                                            />
                                        </div>
                                    </div>

                                    <button
                                        type="submit"
                                        className="w-full mt-8 bg-gradient-to-r from-blue-600 to-indigo-600 text-white py-4 rounded-xl font-bold text-lg hover:shadow-2xl transition-all duration-300 transform hover:scale-105 flex items-center justify-center gap-2"
                                    >
                                        Tiếp tục thanh toán
                                        <i className="fa-solid fa-arrow-right w-5 h-5" />
                                    </button>
                                </div>
                            )}

                            {step === 2 && (
                                <div className="space-y-6">
                                    <div className="bg-white rounded-3xl shadow-2xl p-8 backdrop-blur-sm bg-opacity-95 border border-gray-100">
                                        <h2 className="text-2xl font-bold text-gray-900 mb-6 flex items-center gap-2">
                                            <i className="fa-solid fa-credit-card w-6 h-6 text-blue-600" />
                                            Phương thức thanh toán
                                        </h2>

                                        <div className="grid grid-cols-2 gap-4 mb-6">
                                            <button
                                                type="button"
                                                onClick={() => setPaymentMethod('momo')}
                                                className={`p-4 rounded-xl border-2 transition-all ${paymentMethod === 'momo'
                                                    ? 'border-blue-600 bg-blue-50'
                                                    : 'border-gray-200 hover:border-gray-300'
                                                    }`}
                                            >
                                                <i
                                                    className={`fa-solid fa-wallet w-8 h-8 mx-auto mb-2 ${paymentMethod === 'momo' ? 'text-blue-600' : 'text-gray-400'
                                                        }`}
                                                />
                                                <p className="text-sm font-semibold text-center">MoMo</p>
                                            </button>

                                            <button
                                                type="button"
                                                onClick={() => setPaymentMethod('sepay')}
                                                className={`p-4 rounded-xl border-2 transition-all ${paymentMethod === 'sepay'
                                                    ? 'border-blue-600 bg-blue-50'
                                                    : 'border-gray-200 hover:border-gray-300'
                                                    }`}
                                            >
                                                <i
                                                    className={`fa-solid fa-building-columns w-8 h-8 mx-auto mb-2 ${paymentMethod === 'sepay' ? 'text-blue-600' : 'text-gray-400'
                                                        }`}
                                                />
                                                <p className="text-sm font-semibold text-center">SePay/Chuyển khoản</p>
                                            </button>
                                        </div>

                                        {paymentMethod === 'momo' && (
                                            <div className="text-center py-8">
                                                <i className="fa-solid fa-wallet text-blue-600 text-5xl mb-4" />
                                                <p className="text-gray-600 mb-4">
                                                    Bạn sẽ được chuyển sang <b>MoMo</b> để hoàn tất thanh toán.
                                                </p>
                                                <div className="bg-blue-50 rounded-xl p-4 text-sm text-blue-800">
                                                    Nhấn “Hoàn tất thanh toán” để tiếp tục đến MoMo
                                                </div>
                                            </div>
                                        )}

                                        {paymentMethod === 'sepay' && (
                                            <div className="py-6">
                                                {!sepayOrderId ? (
                                                    <div className="text-center">
                                                        <i className="fa-solid fa-building-columns text-blue-600 text-5xl mb-4" />
                                                        <p className="text-gray-600 mb-4">
                                                            {existingOrderId
                                                                ? 'Hệ thống sẽ hiển thị mã QR để thanh toán lại đơn hàng.'
                                                                : 'Hệ thống sẽ tạo đơn hàng và hiển thị mã QR chuyển khoản.'}
                                                        </p>
                                                        <div className="bg-yellow-50 rounded-xl p-4 text-sm text-yellow-800">
                                                            Vui lòng thanh toán <b>đúng số tiền</b> và <b>đúng nội dung</b> để hệ thống tự động xác nhận.
                                                        </div>
                                                    </div>
                                                ) : (
                                                    <div className="space-y-4">
                                                        <div className="text-center">
                                                            <p className="text-gray-700">
                                                                Mã đơn hàng: <b>#{sepayOrderId}</b>
                                                            </p>
                                                            <p className="text-gray-600">
                                                                Số tiền: <b>{fmtVND(total)}</b>
                                                            </p>
                                                            <p className="text-gray-600">
                                                                Nội dung chuyển khoản: <b>{`XIEN${sepayOrderId}`}</b>
                                                            </p>
                                                        </div>
                                                        <div className="flex items-center justify-center">
                                                            <img
                                                                src={sepayQR || ''}
                                                                alt="QR chuyển khoản SePay"
                                                                className="rounded-2xl shadow-xl border border-gray-100 max-w-[360px] w-full"
                                                            />
                                                        </div>
                                                        <div className="bg-emerald-50 rounded-xl p-4 text-sm text-emerald-800">
                                                            Sau khi chuyển khoản xong, hệ thống sẽ tự động xác nhận (mất vài giây). Bạn có thể ở lại trang này,
                                                            hoặc mở trang kết quả để theo dõi.
                                                        </div>
                                                        <div className="flex flex-wrap gap-3 justify-center pt-2">
                                                            <button
                                                                type="button"
                                                                onClick={() =>
                                                                    router.push(`/ket-qua-thanh-toan?orderId=${sepayOrderId}&provider=sepay`)
                                                                }
                                                                className="inline-flex items-center gap-2 bg-blue-600 text-white px-5 py-3 rounded-xl font-semibold hover:bg-blue-700 transition-colors"
                                                            >
                                                                <i className="fa-solid fa-receipt"></i> Mở trang kết quả
                                                            </button>
                                                            <button
                                                                type="button"
                                                                onClick={() => startPollOrderStatus(sepayOrderId)}
                                                                className="inline-flex items-center gap-2 bg-gray-100 text-gray-800 px-5 py-3 rounded-xl font-semibold hover:bg-gray-200 transition-colors"
                                                            >
                                                                <i className="fa-solid fa-rotate-right"></i> Kiểm tra trạng thái
                                                            </button>
                                                        </div>
                                                    </div>
                                                )}
                                            </div>
                                        )}
                                    </div>

                                    <div className="flex gap-4">
                                        <button
                                            type="button"
                                            onClick={() => setStep(1)}
                                            className="flex-1 bg-gray-100 text-gray-700 py-4 rounded-xl font-bold text-lg hover:bg-gray-200 transition-all duration-300"
                                            disabled={loading}
                                        >
                                            Quay lại
                                        </button>
                                        <button
                                            type="submit"
                                            className="flex-1 bg-gradient-to-r from-green-600 to-emerald-600 text-white py-4 rounded-xl font-bold text-lg hover:shadow-2xl transition-all duration-300 transform hover:scale-105 flex items-center justify-center gap-2 disabled:opacity-70"
                                            disabled={loading || enriching || (existingOrderId && orderDetail.loading)}
                                        >
                                            <i className="fa-solid fa-lock w-5 h-5" />
                                            {loading
                                                ? 'Đang xử lý...'
                                                : paymentMethod === 'sepay'
                                                    ? existingOrderId
                                                        ? 'Hiển thị QR (thanh toán lại)'
                                                        : 'Hoàn tất & Hiển thị QR'
                                                    : existingOrderId
                                                        ? 'Thanh toán lại'
                                                        : 'Hoàn tất thanh toán'}
                                        </button>
                                    </div>
                                </div>
                            )}
                        </form>
                    </div>

                    <div className="lg:col-span-1">
                        <div className="bg-white rounded-3xl shadow-2xl p-8 sticky top-8 backdrop-blur-sm bg-opacity-95 border border-gray-100">
                            <h2 className="text-2xl font-bold text-gray-900 mb-6">
                                {existingOrderId ? `Tóm tắt đơn #${existingOrderId}` : 'Tóm tắt đơn hàng'}
                            </h2>

                            {existingOrderId && orderItems.length > 0 && (
                                <div className="space-y-4 mb-6">
                                    {orderItems.map((od) => (
                                        <div key={od.id} className="flex gap-3 items-center">
                                            <img
                                                src={od?.product?.thumbnail}
                                                alt={od?.product?.name || 'product'}
                                                className="w-14 h-14 rounded-lg object-cover border border-gray-100"
                                            />
                                            <div className="min-w-0 flex-1">
                                                <p className="text-sm font-medium text-gray-900 line-clamp-2">
                                                    {od?.product?.name || `SP #${od.product_id}`}
                                                </p>
                                                <p className="text-xs text-gray-500">SL: {od?.qty}</p>
                                            </div>
                                            <div className="text-right">
                                                <p className="text-sm font-semibold text-gray-900">
                                                    {fmtVND(Number(od?.amount) || (Number(od?.price) || 0) * (Number(od?.qty) || 1))}
                                                </p>
                                            </div>
                                        </div>
                                    ))}
                                    <div className="border-t border-gray-200 pt-3" />
                                </div>
                            )}

                            <div className="space-y-3 mb-6 pb-6 border-b-2 border-gray-200">
                                <div className="flex justify-between text-sm">
                                    <span className="text-gray-600">
                                        {existingOrderId ? 'Tổng tiền theo đơn' : 'Tổng tiền sản phẩm'}
                                    </span>
                                    <span className="font-semibold text-gray-900">{fmtVND(subtotal)}</span>
                                </div>
                                <div className="flex justify-between text-sm">
                                    <span className="text-gray-600">Vận chuyển</span>
                                    <span className="font-semibold text-green-600">
                                        {shippingFee === 0 ? 'Miễn phí' : fmtVND(shippingFee)}
                                    </span>
                                </div>
                            </div>

                            <div className="flex justify-between items-center mb-6">
                                <span className="text-xl font-bold text-gray-900">Tổng cộng</span>
                                <span className="text-3xl font-bold bg-gradient-to-r from-blue-600 to-indigo-600 bg-clip-text text-transparent">
                                    {fmtVND(total)}
                                </span>
                            </div>

                            <div className="space-y-3 pt-6 border-t-2 border-gray-200">
                                <div className="flex items-center gap-3 text-sm text-gray-600">
                                    <div className="bg-green-100 p-2 rounded-lg">
                                        <i className="fa-solid fa-shield-halved text-green-600" />
                                    </div>
                                    <span>Thanh toán bảo mật SSL 256-bit</span>
                                </div>
                                <div className="flex items-center gap-3 text-sm text-gray-600">
                                    <div className="bg-blue-100 p-2 rounded-lg">
                                        <i className="fa-solid fa-lock text-blue-600" />
                                    </div>
                                    <span>Tuân thủ PCI DSS</span>
                                </div>
                                <div className="flex items-center gap-3 text-sm text-gray-600">
                                    <div className="bg-purple-100 p-2 rounded-lg">
                                        <i className="fa-solid fa-truck-fast text-purple-600" />
                                    </div>
                                    <span>Đổi trả miễn phí trong 30 ngày</span>
                                </div>
                            </div>

                            {(enriching || (existingOrderId && orderDetail.loading)) && (
                                <p className="text-center text-xs text-gray-500 mt-4">
                                    Đang tải chi tiết…
                                </p>
                            )}

                            {orderDetail.error && existingOrderId && (
                                <p className="text-xs text-red-600 mt-4 text-center">
                                    Không tải được đơn #{existingOrderId}: {orderDetail.error}
                                </p>
                            )}

                            <div className="mt-6 pt-6 border-t-2 border-gray-200">
                                <p className="text-xs text-gray-500 text-center mb-3">Chấp nhận</p>
                                <div className="flex justify-center gap-3 flex-wrap">
                                    <div className="bg-gray-100 px-3 py-2 rounded text-xs font-semibold">MoMo</div>
                                    <div className="bg-gray-100 px-3 py-2 rounded text-xs font-semibold">SePay</div>
                                </div>
                            </div>

                        </div>
                    </div>
                </div>
            </div>
        </div>
    );
}
