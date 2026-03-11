'use client';

import { useEffect, useMemo, useState } from 'react';
import { useParams, useRouter } from 'next/navigation';
import Link from 'next/link';

const API_BASE = process.env.NEXT_PUBLIC_API_BASE_URL;

const fmtVND = (n) =>
    new Intl.NumberFormat('vi-VN', { style: 'currency', currency: 'VND' }).format(
        Number.isFinite(+n) ? +n : 0
    );

const fmtDate = (s) => {
    if (!s) return '—';
    const d = new Date(String(s).replace(' ', 'T'));
    return isNaN(+d) ? '—' : d.toLocaleString('vi-VN');
};

const sumAll = (details = []) =>
    details.reduce((s, d) => s + Number(d?.amount || 0), 0);


export default function OrderDetailPage() {
    const params = useParams();
    const id = params?.id;

    const router = useRouter();

    const [order, setOrder] = useState(null);
    const [loading, setLoading] = useState(true);
    const [err, setErr] = useState('');

    useEffect(() => {
        if (!id) {
            setLoading(false);
            setErr('Không tìm thấy ID đơn hàng.');
            return;
        }

        (async () => {
            try {
                setLoading(true);
                setErr('');
                setOrder(null);

                const token = localStorage.getItem('token');
                if (!token) {
                    setErr('Vui lòng đăng nhập để xem đơn hàng.');
                    router.replace('/dang-nhap');
                    return;
                }

                const verifyRes = await fetch(`${API_BASE}/verifyUser`, {
                    headers: { Authorization: token },
                    cache: 'no-store',
                });

                if (!verifyRes.ok) {
                    localStorage.removeItem('token');
                    localStorage.removeItem('user');
                    setErr('Phiên đăng nhập không hợp lệ.');
                    router.replace('/dang-nhap');
                    return;
                }

                const verifiedUser = await verifyRes.json();
                if (!verifiedUser?.id) {
                    throw new Error('Không thể xác thực người dùng.');
                }

                const orderRes = await fetch(`${API_BASE}/order/${id}`);
                if (!orderRes.ok) {
                    if (orderRes.status === 404) {
                        throw new Error('Không tìm thấy đơn hàng này.');
                    }
                    throw new Error(`Lỗi tải đơn hàng (HTTP ${orderRes.status})`);
                }

                const orderData = await orderRes.json();

                if (String(orderData.user_id) !== String(verifiedUser.id)) {
                    throw new Error('Bạn không có quyền xem đơn hàng này.');
                }

                setOrder(orderData);
                setErr('');

            } catch (e) {
                console.error(e);
                setErr(e.message || 'Không tải được đơn hàng.');
                setOrder(null);
            } finally {
                setLoading(false);
            }
        })();
    }, [id, router]);

    const total = useMemo(() => sumAll(order?.order_detail || []), [order?.order_detail]);

    const cancelOrder = async () => {
        if (!order?.id) return;
        if (order.status === 0) {
            alert('Đơn hàng này đã bị huỷ.');
            return;
        }
        try {
            const r = await fetch(`${API_BASE}/updateStatusOrder/${order.id}`, {
                method: 'PUT',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify
                    ({
                        status: 0,
                        updated_by: order.user_id,
                    })
                ,
            });
            if (!r.ok) {
                const errorData = await r.json().catch(() => ({}));
                throw new Error(errorData.message || 'Cập nhật thất bại');
            }
            alert('Cập nhật trạng thái thành công!');
            router.replace(`/don-hang/${order.id}`);
        } catch (e) {
            alert(e.message || 'Không thể cập nhật đơn hàng.');
        }
    }

    if (loading) return <div className="max-w-4xl mx-auto p-8 text-center">Đang tải chi tiết đơn hàng...</div>;

    if (err || !order) {
        return (
            <div className="max-w-4xl mx-auto p-8 text-center text-red-600 bg-red-50 rounded-2xl border border-red-200">
                <p className="font-bold text-lg mb-2">Đã xảy ra lỗi</p>
                <p>{err || 'Không tìm thấy đơn hàng.'}</p>
                <a
                    href="/tai-khoan"
                    className="mt-4 inline-block px-5 py-2 bg-blue-600 text-white rounded-lg font-semibold hover:bg-blue-700"
                >
                    Về trang tài khoản
                </a>
            </div>
        );
    }

    return (
        <div className="max-w-5xl mx-auto p-6 sm:p-10 mt-30">
            <div className="mb-6">
                <a href="/tai-khoan" className="text-gray-600 hover:text-gray-900 font-semibold inline-flex items-center gap-2">
                    <i className="fa-solid fa-arrow-left" />
                    Quay lại tài khoản
                </a>
            </div>

            <div className="bg-white rounded-2xl shadow-xl border border-gray-100 overflow-hidden">
                <div className="bg-gradient-to-r from-blue-600 to-indigo-600 px-6 py-8 text-white flex items-center justify-between">
                    <div>
                        <h1 className="text-2xl sm:text-3xl font-bold">Đơn hàng #{order.id}</h1>
                        <p className="text-blue-100 mt-1">Tạo lúc: {fmtDate(order.created_at)}</p>
                    </div>
                    <div className="text-right">
                        <div
                            className={`inline-flex items-center gap-2 px-3 py-1.5 rounded-full text-sm font-bold ${+order.status === 2
                                ? 'bg-green-500/20 text-green-200 border border-green-300/40'
                                : order.status === 0 ? 'bg-red-500/20 text-red-200 border border-red-300/40' :
                                    'bg-amber-500/20 text-amber-200 border border-amber-300/40'
                                }`}
                        >
                            <i className={`fa-solid ${+order.status === 2 ? 'fa-circle-check' : order.status === 0 ? 'fa-x' : 'fa-clock'}`} />
                            {+order.status === 2 ? 'Thành công' : order.status === 0 ? 'Đã huỷ' : 'Đang chờ thanh toán'}
                        </div>
                    </div>
                </div>

                <div className="p-6 sm:p-8">
                    <div className="grid md:grid-cols-2 gap-6 mb-8">
                        <div className="rounded-xl border-2 border-gray-100 p-5">
                            <h3 className="font-bold text-gray-900 mb-3">Người nhận</h3>
                            <div className="space-y-1 text-sm text-gray-700">
                                <div><span className="font-medium">Họ tên:</span> {order.name}</div>
                                <div><span className="font-medium">Email:</span> {order.email}</div>
                                <div><span className="font-medium">Điện thoại:</span> {order.phone}</div>
                                <div><span className="font-medium">Địa chỉ:</span> {order.address}</div>
                                {order.note && <div><span className="font-medium">Ghi chú:</span> {order.note}</div>}
                            </div>
                        </div>
                        <div className="rounded-xl border-2 border-gray-100 p-5">
                            <h3 className="font-bold text-gray-900 mb-3">Tổng quan</h3>
                            <div className="space-y-2">
                                <div className="flex justify-between text-sm">
                                    <span className="text-gray-600">Tổng giá trị đơn</span>
                                    <span className="font-semibold">{fmtVND(total)}</span>
                                </div>
                            </div>
                        </div>
                    </div>

                    <div className="rounded-2xl border-2 border-gray-100 overflow-hidden">
                        <div className="bg-gray-50 px-5 py-4 font-bold text-gray-900">Chi tiết sản phẩm</div>
                        <div className="overflow-x-auto">
                            <table className="min-w-full text-sm">
                                <thead>
                                    <tr className="bg-gray-50 text-gray-600">
                                        <th className="text-left px-5 py-3">#</th>
                                        <th className="text-left px-5 py-3">Sản phẩm</th>
                                        <th className="text-right px-5 py-3">Đơn giá</th>
                                        <th className="text-center px-5 py-3">SL</th>
                                        <th className="text-right px-5 py-3">Thành tiền</th>
                                        <th className="text-center px-5 py-3">Trạng thái</th>
                                    </tr>
                                </thead>
                                <tbody>
                                    {(order?.order_detail || []).map((d, idx) => (
                                        <tr key={d.id} className="border-t border-gray-100">
                                            <td className="px-5 py-3">{idx + 1}</td>
                                            <td className="px-5 py-3">{d.product.name || `Sản phẩm #${d.product_id}`}</td>
                                            <td className="px-5 py-3 text-right">{fmtVND(d.price)}</td>
                                            <td className="px-5 py-3 text-center">{d.qty}</td>
                                            <td className="px-5 py-3 text-right font-semibold">{fmtVND(d.amount)}</td>
                                            <td className="px-5 py-3 text-center">
                                                {+d.status === 1 ? (
                                                    <span className="text-green-700 bg-green-50 border border-green-200 px-2 py-1 rounded-full text-xs font-bold">
                                                        Đã thanh toán
                                                    </span>
                                                ) : (
                                                    <span className="text-amber-700 bg-amber-50 border border-amber-200 px-2 py-1 rounded-full text-xs font-bold">
                                                        Chưa thanh toán
                                                    </span>
                                                )}
                                            </td>
                                        </tr>
                                    ))}
                                    <tr className="bg-gray-50 border-t-2 border-gray-100">
                                        <td colSpan={4} className="px-5 py-4 text-right font-bold">Tổng cộng</td>
                                        <td className="px-5 py-4 text-right text-blue-600 font-extrabold text-lg">
                                            {fmtVND(total)}
                                        </td>
                                        <td />
                                    </tr>
                                </tbody>
                            </table>
                        </div>
                    </div>

                    <div className="mt-6 flex flex-wrap items-center justify-between gap-3">
                        <a
                            href="/tai-khoan"
                            className="px-5 py-3 rounded-xl bg-gray-100 hover:bg-gray-200 text-gray-700 font-bold hover:shadow-xl transition-all"
                        >
                            Về tài khoản
                        </a>
                        {order.status === 1 && (
                            <div className="flex gap-3">
                                <Link href={`/thanh-toan?orderId=${order.id}`}
                                    className="px-5 py-3 rounded-xl bg-blue-500 hover:bg-blue-600 text-white font-bold hover:shadow-xl transition-all"
                                >
                                    Thanh toán lại
                                </Link>
                                <button
                                    onClick={cancelOrder}
                                    className="px-5 py-3 rounded-xl bg-red-500 hover:bg-red-600 text-white font-bold hover:shadow-xl transition-all"
                                >
                                    Huỷ đơn hàng
                                </button>
                            </div>


                        )}
                    </div>
                </div>
            </div>
        </div>
    );
}