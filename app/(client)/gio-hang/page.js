'use client';

import { useEffect, useState, useMemo } from 'react';
import Link from 'next/link';

const fmtVND = (n) =>
    new Intl.NumberFormat('vi-VN', { style: 'currency', currency: 'VND' })
        .format(Number.isFinite(n) ? n : 0);

export default function CartPage() {
    const [cartItems, setCartItems] = useState([]);
    const [mounted, setMounted] = useState(false);

    useEffect(() => {
        try {
            const raw = localStorage.getItem('cart');
            if (raw) {
                const data = JSON.parse(raw);
                const safe = Array.isArray(data)
                    ? data.map(i => ({ ...i, qty: Math.max(1, Number(i.qty || 1)) }))
                    : [];
                setCartItems(safe);
            }
        } catch {
        } finally {
            setMounted(true);
        }
    }, []);

    useEffect(() => {
        if (!mounted) return;
        try {
            localStorage.setItem('cart', JSON.stringify(cartItems));
            window.dispatchEvent(new Event('cartUpdated'));
        } catch { }
    }, [cartItems, mounted]);

    const subtotal = useMemo(
        () => cartItems.reduce((s, it) => s + (Number(it.price) || 0) * (Number(it.qty) || 1), 0),
        [cartItems]
    );
    const shipping = 0;
    const total = subtotal + shipping;

    const updateQty = (id, delta) => {
        setCartItems(items =>
            items.map(it =>
                it.id === id ? { ...it, qty: Math.max(1, (Number(it.qty) || 1) + delta) } : it
            )
        );
    };

    const removeItem = (id) => {
        setCartItems(items => items.filter(it => it.id !== id));
    };

    const clearCart = () => {
        try {
            localStorage.removeItem('cart');
            window.dispatchEvent(new Event('cartUpdated'));
        } catch { }
        setCartItems([]);
    };

    if (!mounted) {
        return (
            <div className="min-h-screen pt-30">
                <div className="max-w-7xl mx-auto px-4 py-8 sm:px-6 lg:px-8">
                    <div className="mb-8">
                        <h1 className="text-4xl font-bold bg-gradient-to-r from-gray-900 to-gray-600 bg-clip-text text-transparent flex items-center gap-3">
                            <div className="bg-gradient-to-br from-blue-600 to-indigo-600 p-3 rounded-2xl shadow-lg">
                                <i className="fa-solid fa-basket-shopping w-8 h-8 text-white"></i>
                            </div>
                            Giỏ hàng
                        </h1>
                        <p className="text-gray-600 mt-3">
                            <span className="bg-blue-100 text-blue-700 px-3 py-1 rounded-full text-sm font-semibold">
                                Đang tải...
                            </span>
                        </p>
                    </div>
                    <div className="grid lg:grid-cols-3 gap-8">
                        <div className="lg:col-span-2 space-y-4">
                            <div className="bg-white rounded-2xl shadow-lg p-6 border border-gray-100 h-40 animate-pulse" />
                            <div className="bg-white rounded-2xl shadow-lg p-6 border border-gray-100 h-40 animate-pulse" />
                        </div>
                        <div className="lg:col-span-1">
                            <div className="bg-white rounded-3xl shadow-2xl p-8 border border-gray-100 h-72 animate-pulse" />
                        </div>
                    </div>
                </div>
            </div>
        );
    }

    return (
        <div className="min-h-screen pt-30">
            <div className="max-w-7xl mx-auto px-4 py-8 sm:px-6 lg:px-8">
                <div className="mb-8">
                    <h1 className="text-4xl font-bold bg-gradient-to-r from-gray-900 to-gray-600 bg-clip-text text-transparent flex items-center gap-3">
                        <div className="bg-gradient-to-br from-blue-600 to-indigo-600 p-3 rounded-2xl shadow-lg">
                            <i className="fa-solid fa-basket-shopping w-8 h-8 text-white"></i>
                        </div>
                        Giỏ hàng
                    </h1>
                    <p className="text-gray-600 mt-3 flex items-center gap-2">
                        <span className="bg-blue-100 text-blue-700 px-3 py-1 rounded-full text-sm font-semibold">
                            {cartItems.length} items
                        </span>
                    </p>
                </div>

                <div className="grid lg:grid-cols-3 gap-8">
                    <div className="lg:col-span-2">
                        {cartItems.length === 0 ? (
                            <div className="bg-white rounded-3xl shadow-xl p-12 text-center">
                                <h3 className="text-2xl font-bold text-gray-900 mb-2">Giỏ hàng trống!</h3>
                                <Link
                                    href="/san-pham"
                                    className="inline-flex items-center gap-2 bg-gradient-to-r from-blue-600 to-indigo-600 text-white px-8 py-4 rounded-xl font-semibold hover:shadow-xl transition-all duration-300 transform hover:scale-105"
                                >
                                    Đi ngay <i className="fa-solid fa-arrow-right"></i>
                                </Link>
                            </div>
                        ) : (
                            <div className="space-y-4">
                                {cartItems.map(item => (
                                    <div key={item.id} className="bg-white rounded-2xl shadow-lg p-6 border border-gray-100">
                                        <div className="flex gap-6">
                                            <img
                                                src={item.thumbnail}
                                                alt={item.name}
                                                className="w-32 h-32 object-cover rounded-xl shadow-md"
                                            />
                                            <div className="flex-1">
                                                <div className="flex justify-between items-start mb-3">
                                                    <div>
                                                        <h3 className="text-xl font-bold text-gray-900 mb-2">{item.name}</h3>

                                                        {item.attributes && Object.keys(item.attributes).length > 0 && (
                                                            <div className="flex flex-wrap gap-2 text-sm mb-2">
                                                                {Object.entries(item.attributes).map(([k, v]) => (
                                                                    <span key={k} className="bg-gray-100 px-3 py-1 rounded-full text-gray-700">
                                                                        {v}
                                                                    </span>
                                                                ))}
                                                            </div>
                                                        )}

                                                        {item.note && (
                                                            <p className="text-xs text-gray-500">{item.note}</p>
                                                        )}

                                                        {item.hasSale && (
                                                            <span className="text-xs text-red-600 font-semibold block mt-1">Đang khuyến mãi</span>
                                                        )}
                                                    </div>
                                                    <button
                                                        onClick={() => removeItem(item.id)}
                                                        className="p-2 hover:bg-red-50 rounded-xl"
                                                        title="Xóa sản phẩm"
                                                    >
                                                        <i className="fa-solid fa-trash-can text-gray-400 hover:text-red-500"></i>
                                                    </button>
                                                </div>

                                                <div className="flex justify-between items-center mt-6">
                                                    <div className="flex items-center gap-2 bg-gradient-to-r from-gray-50 to-gray-100 rounded-xl px-2 py-2 shadow-inner border border-gray-200">
                                                        <button
                                                            onClick={() => updateQty(item.id, -1)}
                                                            className="w-8 h-8 flex items-center justify-center bg-white rounded-lg hover:bg-blue-50 hover:text-blue-600 transition-all shadow-sm"
                                                            title="Giảm"
                                                        >
                                                            <i className="fa-solid fa-minus"></i>
                                                        </button>
                                                        <span className="font-bold text-gray-900 w-12 text-center text-lg">
                                                            {item.qty}
                                                        </span>
                                                        <button
                                                            onClick={() => updateQty(item.id, 1)}
                                                            className="w-8 h-8 flex items-center justify-center bg-white rounded-lg hover:bg-blue-50 hover:text-blue-600 transition-all shadow-sm"
                                                            title="Tăng"
                                                        >
                                                            <i className="fa-solid fa-plus"></i>
                                                        </button>
                                                    </div>

                                                    <div className="text-right">
                                                        <p className="text-2xl font-bold bg-gradient-to-r from-blue-600 to-indigo-600 bg-clip-text text-transparent">
                                                            {fmtVND((Number(item.price) || 0) * (Number(item.qty) || 1))}
                                                        </p>
                                                        <p className="text-sm text-gray-500">{fmtVND(Number(item.price) || 0)} / sp</p>
                                                    </div>
                                                </div>
                                            </div>
                                        </div>
                                    </div>
                                ))}
                            </div>
                        )}
                    </div>

                    <div className="lg:col-span-1">
                        <div className="bg-white rounded-3xl shadow-2xl p-8 sticky top-8 border border-gray-100">
                            <h2 className="text-2xl font-bold text-gray-900 mb-6 flex items-center gap-2">
                                <i className="fa-solid fa-tag w-6 h-6 text-blue-600"></i>
                                Tóm tắt đơn hàng
                            </h2>

                            <div className="space-y-4 mb-6">
                                <div className="flex justify-between text-gray-600 text-lg">
                                    <span>Tạm tính</span>
                                    <span className="font-semibold text-gray-900">{fmtVND(subtotal)}</span>
                                </div>
                                <div className="flex justify-between text-gray-600 text-lg">
                                    <span className="flex items-center gap-2">
                                        Vận chuyển <i className="fa-solid fa-truck text-gray-400"></i>
                                    </span>
                                    <span className="font-semibold text-green-600">FREE</span>
                                </div>
                                <div className="border-t-2 border-gray-200 pt-4 mt-4">
                                    <div className="flex justify-between items-center">
                                        <span className="text-xl font-bold text-gray-900">Tổng cộng</span>
                                        <span className="text-3xl font-bold bg-gradient-to-r from-blue-600 to-indigo-600 bg-clip-text text-transparent">
                                            {fmtVND(total)}
                                        </span>
                                    </div>
                                </div>
                            </div>

                            <div className="flex flex-col">
                                {cartItems.length > 0 && (
                                    <Link
                                        href="/thanh-toan"
                                        className="w-full bg-gradient-to-r from-blue-600 to-indigo-600 text-white py-4 rounded-xl font-bold text-lg hover:shadow-2xl transition-all duration-300 transform hover:scale-105 flex items-center justify-center gap-2 mb-3"
                                    >
                                        Tiến hành thanh toán <i className="fa-solid fa-arrow-right"></i>
                                    </Link>
                                )}

                                <Link
                                    href="/san-pham"
                                    className="w-full text-center bg-gray-100 text-gray-700 py-4 rounded-xl font-semibold hover:bg-gray-200 transition-all duration-300 mb-3"
                                >
                                    Tiếp tục mua sắm
                                </Link>

                                {cartItems.length > 0 && (
                                    <button
                                        onClick={clearCart}
                                        className="w-full text-center bg-red-50 text-red-600 py-4 rounded-xl font-semibold hover:bg-red-100 transition-all duration-300 flex items-center justify-center gap-2"
                                    >
                                        <i className="fa-solid fa-trash-can"></i>
                                        Xóa giỏ hàng
                                    </button>
                                )}
                            </div>
                        </div>
                    </div>
                </div>
            </div>
        </div>
    );
}
