'use client';

import { useEffect, useMemo, useRef, useState } from 'react';
import { useSearchParams, useRouter } from 'next/navigation';
import Link from 'next/link';

const API_BASE = process.env.NEXT_PUBLIC_API_BASE_URL;

function computeAmounts(order) {
    const total =
        Number(order?.totalAmount ?? order?.total ?? order?.amount ?? 0) || 0;
    const paid =
        Number(order?.paidAmount ?? order?.paid ?? order?.deposit ?? 0) || 0;
    const unpaid = Math.max(0, total - paid);
    return { total, paid, unpaid };
}

export default function PaymentResultContent() {
    const params = useSearchParams();
    const router = useRouter();

    const orderId = params.get('orderId');
    const resultCodeParam = params.get('resultCode');
    const [order, setOrder] = useState(null);
    const [phase, setPhase] = useState('loading');
    const [errorMsg, setErrorMsg] = useState('');
    const [attempts, setAttempts] = useState(0);

    const clearedRef = useRef(false);
    const timerRef = useRef(null);
    const aliveRef = useRef(true);

    const resultCode = useMemo(() => {
        if (resultCodeParam == null) return null;
        const n = Number(resultCodeParam);
        return Number.isFinite(n) ? n : null;
    }, [resultCodeParam]);

    const fetchOrder = async (id) => {
        try {
            const r = await fetch(`${API_BASE}/order/${encodeURIComponent(id)}`, {
                cache: 'no-store',
            });
            if (r.status === 404) {
                setPhase('notfound');
                return null;
            }
            if (!r.ok) {
                setPhase('error');
                setErrorMsg(`Lỗi tải đơn hàng (HTTP ${r.status})`);
                return null;
            }
            const data = await r.json();
            if (!aliveRef.current) return null;
            setOrder(data);
            return data;
        } catch {
            if (!aliveRef.current) return null;
            setPhase('error');
            setErrorMsg('Không thể tải thông tin đơn hàng.');
            return null;
        }
    };

    const decidePhase = (o) => {
        if (!o) return;
        if (o.status === 2) {
            setPhase('success');
        } else if (o.status === 1) {
            setPhase('pending');
        }
    };

    const startPolling = async (id) => {
        setPhase('loading');
        const first = await fetchOrder(id);
        if (!aliveRef.current || !first) return;
        decidePhase(first);

        if (first.status === 2) return;

        let tries = 0;
        const maxTries = 30;

        const tick = async () => {
            if (!aliveRef.current) return;
            setAttempts((a) => a + 1);

            const latest = await fetchOrder(id);
            if (!aliveRef.current || !latest) return;

            if (latest.status === 2) {
                setPhase('success');
                return;
            }

            tries += 1;
            if (tries >= maxTries) {
                setPhase(latest.status === 2 ? 'success' : 'fail');
                return;
            }

            timerRef.current = setTimeout(tick, 2000);
        };

        timerRef.current = setTimeout(tick, 2000);
    };

    useEffect(() => {
        aliveRef.current = true;

        if (!orderId) {
            setPhase('notfound');
            return;
        }

        startPolling(orderId);

        return () => {
            aliveRef.current = false;
            if (timerRef.current) {
                clearTimeout(timerRef.current);
                timerRef.current = null;
            }
        };
    }, [orderId]);

    useEffect(() => {
        if (phase === 'success' && !clearedRef.current) {
            try {
                localStorage.removeItem('cart');
                window.dispatchEvent(new Event('cartUpdated'));
            } catch {}
            clearedRef.current = true;
        }
    }, [phase]);

    useEffect(() => {
        if (!orderId) return;
        const cleanSearch = `?orderId=${encodeURIComponent(orderId)}`;
        const currentSearch =
            typeof window !== 'undefined' ? window.location.search : '';
        if (currentSearch !== cleanSearch) {
            router.replace(`/ket-qua-thanh-toan${cleanSearch}`);
        }
    }, [orderId, router]);

    const handleRetry = async () => {
        if (!orderId) return;
        if (timerRef.current) {
            clearTimeout(timerRef.current);
            timerRef.current = null;
        }
        setAttempts(0);
        await startPolling(orderId);
    };

    const onPayAgain = async () => {
        const { unpaid } = computeAmounts(order);
        if (!order?.id) return;
        if (unpaid <= 0) {
            alert('Đơn hàng này không còn khoản nào cần thanh toán.');
            return;
        }
        try {
            const r = await fetch(`${API_BASE}/payments/momo/create`, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ orderId: order.id, amount: unpaid }),
            });
            if (!r.ok) throw new Error(`MoMo create HTTP ${r.status}`);
            const j = await r.json();
            const payUrl = j?.payUrl || j?.data?.payUrl;
            if (!payUrl) throw new Error('Không nhận được payUrl từ backend.');
            window.location.href = payUrl;
        } catch (e) {
            console.error(e);
            alert(e.message || 'Không thể khởi tạo thanh toán.');
        }
    };

    const SuccessView = () => (
        <div className="text-center">
            <i className="fa-solid fa-circle-check text-green-600 text-6xl mb-4" />
            <h1 className="text-2xl font-bold mb-2">Thanh toán thành công</h1>
            <p className="text-gray-700 mb-1">
                Mã đơn hàng: <b>#{order?.id ?? orderId}</b>
            </p>
            <p className="text-gray-600 mb-6">
                Cảm ơn bạn đã mua hàng! Chúng tôi sẽ xử lý đơn sớm nhất.
            </p>

            <div className="flex items-center justify-center gap-3">
                <Link
                    href="/"
                    className="inline-flex items-center gap-2 bg-blue-600 text-white px-6 py-3 rounded-xl font-semibold hover:bg-blue-700"
                >
                    <i className="fa-solid fa-house"></i> Về trang chủ
                </Link>
                <Link
                    href={`/don-hang/${order?.id ?? orderId}`}
                    className="inline-flex items-center gap-2 bg-gray-100 text-gray-800 px-6 py-3 rounded-xl font-semibold hover:bg-gray-200"
                >
                    <i className="fa-solid fa-receipt"></i> Xem đơn hàng
                </Link>
            </div>
        </div>
    );

    const PendingView = () => (
        <div className="text-center">
            <i className="fa-solid fa-circle-notch fa-spin text-blue-600 text-6xl mb-4" />
            <h1 className="text-2xl font-bold mb-2">Đang xác nhận thanh toán…</h1>
            <p className="text-gray-700 mb-1">
                Mã đơn hàng: <b>#{order?.id ?? orderId}</b>
            </p>
            <p className="text-gray-600">
                Vui lòng đợi trong giây lát để hệ thống cập nhật (đã thử {attempts} lần)…
            </p>
            <div className="mt-6">
                <button
                    onClick={handleRetry}
                    className="inline-flex items-center gap-2 bg-gray-100 text-gray-700 px-6 py-3 rounded-xl font-semibold hover:bg-gray-200"
                >
                    <i className="fa-solid fa-rotate-right"></i> Thử lại
                </button>
            </div>
        </div>
    );

    const FailView = () => (
        <div className="text-center">
            <i className="fa-solid fa-circle-xmark text-red-600 text-6xl mb-4" />
            <h1 className="text-2xl font-bold mb-2">Thanh toán không thành công</h1>
            <p className="text-gray-700 mb-1">
                Mã đơn hàng: <b>#{order?.id ?? orderId}</b>
            </p>

            {typeof resultCode === 'number' && (
                <p className="text-gray-500">
                    Mã kết quả từ cổng: <b>{resultCode}</b>
                </p>
            )}

            <div className="mt-6 flex items-center justify-center gap-3">
                <Link
                    href="/gio-hang"
                    className="inline-flex items-center gap-2 bg-gray-100 text-gray-800 px-6 py-3 rounded-xl font-semibold hover:bg-gray-200"
                >
                    <i className="fa-solid fa-cart-shopping" /> Quay lại giỏ hàng
                </Link>
                <button
                    onClick={onPayAgain}
                    className="inline-flex items-center gap-2 bg-blue-600 text-white px-6 py-3 rounded-xl font-semibold hover:bg-blue-700"
                >
                    <i className="fa-solid fa-credit-card" /> Thử thanh toán lại
                </button>
            </div>
        </div>
    );

    const LoadingView = () => (
        <div className="text-center">
            <i className="fa-solid fa-circle-notch fa-spin text-blue-600 text-6xl mb-4" />
            <h1 className="text-2xl font-bold mb-2">Đang tải…</h1>
            <p className="text-gray-600">
                Đang kiểm tra trạng thái đơn hàng #{orderId}.
            </p>
        </div>
    );

    const NotFoundView = () => (
        <div className="text-center">
            <i className="fa-solid fa-triangle-exclamation text-amber-500 text-6xl mb-4" />
            <h1 className="text-2xl font-bold mb-2">Không tìm thấy đơn hàng</h1>
            <p className="text-gray-600">
                Vui lòng kiểm tra lại mã đơn hoặc liên hệ hỗ trợ.
            </p>
            <div className="mt-6">
                <Link
                    href="/"
                    className="inline-flex items-center gap-2 bg-blue-600 text-white px-6 py-3 rounded-xl font-semibold hover:bg-blue-700"
                >
                    <i className="fa-solid fa-house"></i> Về trang chủ
                </Link>
            </div>
        </div>
    );

    const ErrorView = () => (
        <div className="text-center">
            <i className="fa-solid fa-bug text-red-600 text-6xl mb-4" />
            <h1 className="text-2xl font-bold mb-2">Có lỗi xảy ra</h1>
            <p className="text-gray-600">
                {errorMsg || 'Không thể tải trạng thái thanh toán.'}
            </p>
            <div className="mt-6">
                <button
                    onClick={handleRetry}
                    className="inline-flex items-center gap-2 bg-gray-100 text-gray-800 px-6 py-3 rounded-xl font-semibold hover:bg-gray-200"
                >
                    <i className="fa-solid fa-rotate-right"></i> Thử lại
                </button>
            </div>
        </div>
    );

    return (
        <div className="min-h-[70vh] flex items-center justify-center px-4 py-12 pt-40">
            <div className="max-w-2xl w-full bg-white rounded-3xl shadow-2xl p-10 border border-gray-100">
                <div className="flex items-center justify-center gap-3 mb-6">
                    <div className="bg-gradient-to-br from-blue-600 to-indigo-600 p-3 rounded-2xl shadow-lg">
                        <i className="fa-solid fa-shield-halved text-white text-xl" />
                    </div>
                    <h2 className="text-xl font-bold text-gray-900">
                        Kết quả thanh toán
                    </h2>
                </div>

                {phase === 'loading' && <LoadingView />}
                {phase === 'pending' && <PendingView />}
                {phase === 'success' && <SuccessView />}
                {phase === 'fail' && <FailView />}
                {phase === 'notfound' && <NotFoundView />}
                {phase === 'error' && <ErrorView />}

                <div className="mt-10 text-center text-xs text-gray-500">
                    Cần hỗ trợ? Liên hệ{' '}
                    <a href="mailto:support@example.com" className="underline">
                        hỗ trợ
                    </a>{' '}
                    hoặc hotline của chúng tôi.
                </div>
            </div>
        </div>
    );
}
