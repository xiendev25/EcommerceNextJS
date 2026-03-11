"use client";
import React, { useMemo } from "react";
import Image from "next/image";
import Link from "next/link";
import { useRouter } from "next/navigation"

const toNumber = (v) => {
    if (v === null || v === undefined || v === "") return NaN;
    const s = String(v).replace(/,/g, "");
    const n = Number(s);
    return Number.isFinite(n) ? n : NaN;
};

const fmtVND = (n) => {
    if (!isFinite(n)) return "";
    try {
        return Number(n).toLocaleString("vi-VN", { style: "currency", currency: "VND" });
    } catch {
        return `${n} ₫`;
    }
};

const safeDate = (d) => (d ? new Date(String(d).replace(" ", "T")) : null);

const ProductCard = ({ p = {} }) => {
    const router = useRouter();
    const attrs = useMemo(() => {
        const rows = Array.isArray(p?.product_attribute) ? p.product_attribute : [];
        return rows
            .map((r) => {
                const name = (r?.attribute?.name || r?.name || "").toString().trim();
                const value = (r?.value ?? "").toString().trim();
                return { name, value };
            })
            .filter((x) => x.name && x.value);
    }, [p]);

    const attrsObj = useMemo(() => {
        const obj = {};
        for (const a of attrs) obj[a.name] = a.value;
        return obj;
    }, [attrs]);

    const {
        isNew,
        hasSale,
        salePercent,
        priceBuy,
        priceSale,
        inStock,
        lowStock,
        qtyStock,
        finalPrice,
    } = useMemo(() => {
        const now = new Date();

        const created = safeDate(p?.product_created_at);
        const diffDays =
            created && isFinite(created) ? Math.floor((now - created) / 86400000) : Infinity;
        const isNew = diffDays <= 7;

        const priceBuy = toNumber(p?.product_price_buy);

        let priceSale = NaN;
        let hasSale = false;
        let salePercent = 0;

        if (Array.isArray(p?.product_sale) && p.product_sale.length > 0) {
            const sale = p.product_sale[0];
            const salePrice = toNumber(sale?.price_sale);
            const begin = safeDate(sale?.date_begin);
            const end = safeDate(sale?.date_end);
            const inWindow = (!begin || now >= begin) && (!end || now <= end);

            if (isFinite(salePrice) && salePrice > 0 && inWindow && isFinite(priceBuy) && priceBuy > 0) {
                priceSale = salePrice;
                hasSale = true;
                salePercent = Math.max(1, Math.min(95, Math.round((1 - salePrice / priceBuy) * 100)));
            }
        }

        const qtyStore = Number(p?.product_qty_store ?? 0);
        const qtySold = Number(p?.product_qty_sold ?? 0);
        const qtyStock = Math.max(0, qtyStore - qtySold);
        const inStock = qtyStock > 0;
        const lowStock = inStock && qtyStock <= 5;

        const finalPrice = hasSale && isFinite(priceSale) ? priceSale : priceBuy;

        return { isNew, hasSale, salePercent, priceBuy, priceSale, inStock, lowStock, qtyStock, finalPrice };
    }, [p]);

    const href = p?.product_slug ? `/san-pham/${p.product_slug}` : "#";
    const imgSrc = p?.product_thumbnail || "/images/products/product_placeholder.webp";
    const alt = p?.product_name || "Sản phẩm";

    const handleAddToCart = () => {
        if (!localStorage.getItem('user')) {
            alert('Vui lòng đăng nhập để thêm vào giỏ hàng!');
            router.push('/dang-nhap');
            return;
        };

        if (!inStock) return;

        const id = p?.product_id ?? p?.id;
        if (!id) {
            console.warn("Thiếu product_id/id trong dữ liệu sản phẩm", p);
            return;
        }

        const item = {
            id,
            name: p?.product_name,
            slug: p?.product_slug,
            thumbnail: imgSrc,
            price: finalPrice,
            hasSale: hasSale,
            priceBuy: priceBuy,
            qty: 1,
            currency: "VND",
            note: "",
        };

        let cart = [];
        try {
            cart = JSON.parse(localStorage.getItem("cart")) || [];
            if (!Array.isArray(cart)) cart = [];
        } catch {
            cart = [];
        }

        const idx = cart.findIndex((x) => x.id === id);
        if (idx > -1) {
            cart[idx].qty += 1;
        } else {
            cart.push(item);
        }

        localStorage.setItem("cart", JSON.stringify(cart));
        window.dispatchEvent(new Event('cartUpdated'));
        alert(`Đã thêm vào giỏ hàng!`);
    };

    const attrsTitle = attrs.map((a) => `${a.name}: ${a.value}`).join(" • ");

    return (
        <div className="group">
            <div className="relative mb-4 flex min-h-[270px] items-center justify-center overflow-hidden rounded-lg border border-gray-200 bg-gray-50">
                <div className="absolute left-3 top-3 z-10 flex flex-col gap-2">
                    {isNew && (
                        <div className="flex items-center gap-1 rounded-full bg-gradient-to-r from-blue-600 to-blue-700 px-2.5 py-1 text-xs font-semibold text-white shadow-lg">
                            <span className="h-1.5 w-1.5 animate-pulse rounded-full bg-white" />
                            Mới
                        </div>
                    )}
                    {!hasSale && lowStock && (
                        <div className="rounded-full bg-gradient-to-r from-amber-500 to-orange-500 px-2.5 py-1 text-xs font-semibold text-white shadow-lg">
                            Sắp hết • {qtyStock}
                        </div>
                    )}
                    {!inStock && (
                        <div className="rounded-full bg-gradient-to-r from-gray-700 to-gray-800 px-2.5 py-1 text-xs font-semibold text-white shadow-lg">
                            Tạm hết
                        </div>
                    )}
                </div>

                {hasSale && (
                    <div className="absolute right-3 top-3 z-10 flex flex-col items-end gap-2">
                        <div className="rotate-3 rounded-full bg-gradient-to-r from-red-500 to-rose-600 px-3 py-1.5 text-sm font-bold text-white shadow-lg transition-transform duration-300 hover:rotate-0">
                            -{salePercent}%
                        </div>
                        <div className="rounded-lg bg-white/95 px-2.5 py-1.5 text-[11px] text-gray-800 shadow">
                            <div className="leading-none">
                                <span className="font-bold text-red-600">{fmtVND(priceSale)}</span>
                            </div>
                            <div className="mt-0.5 leading-none text-gray-500 line-through">
                                {fmtVND(priceBuy)}
                            </div>
                        </div>
                    </div>
                )}

                <Link href={href} aria-label={alt}>
                    <Image
                        src={imgSrc}
                        width={300}
                        height={300}
                        alt={alt}
                        className="object-contain transition-transform duration-300 group-hover:scale-105"
                        priority={false}
                    />
                </Link>

                <div className="absolute bottom-0 left-0 flex w-full translate-y-full items-center justify-center gap-2.5 pb-5 transition-transform duration-300 group-hover:translate-y-0">
                    <button
                        onClick={handleAddToCart}
                        className={`flex items-center gap-2 rounded-full px-4 py-2 text-sm font-medium shadow-lg transition-all duration-300 ${inStock ? "bg-blue-600 text-white hover:bg-blue-700 hover:shadow-xl" : "cursor-not-allowed bg-gray-400 text-gray-200"
                            }`}
                        disabled={!inStock}
                        type="button"
                    >
                        {inStock ? "Thêm vào giỏ hàng" : "Tạm hết hàng"}
                    </button>
                </div>
            </div>

            {p?.category_name && (
                <p className="mb-2 inline-block rounded-md bg-blue-50 px-2 py-1 text-xs font-medium text-blue-600">
                    {p.category_name}
                </p>
            )}

            <h3 className="mb-2 line-clamp-2 font-semibold leading-tight text-gray-900 transition-colors duration-300 group-hover:text-blue-600">
                <Link href={href} className="text-base">
                    {p?.product_name || "---"}
                </Link>
            </h3>

            {!!attrs.length && (
                <div className="mb-2 flex flex-wrap items-center gap-2" title={attrsTitle}>
                    {attrs.slice(0, 4).map((a, idx) => (
                        <span
                            key={`${a.name}-${a.value}-${idx}`}
                            className="rounded-full border border-gray-200 bg-white px-2.5 py-1 text-xs text-gray-700"
                        >
                            <strong>{a.name}:</strong> {a.value}
                        </span>
                    ))}
                    {attrs.length > 4 && (
                        <span className="rounded-full border border-gray-200 bg-gray-50 px-2.5 py-1 text-xs text-gray-600">
                            +{attrs.length - 4}
                        </span>
                    )}
                </div>
            )}

            <div className="mb-3">
                {hasSale ? (
                    <div className="space-y-1">
                        <div className="flex items-center gap-2">
                            <span className="text-xl font-bold text-red-500">{fmtVND(priceSale)}</span>
                            {isFinite(priceBuy) && isFinite(priceSale) && (
                                <span className="rounded bg-red-100 px-2 py-0.5 text-xs font-medium text-red-700">
                                    Tiết kiệm {fmtVND(priceBuy - priceSale)}
                                </span>
                            )}
                        </div>
                    </div>
                ) : (
                    <span className="text-xl font-bold text-red-500">{fmtVND(priceBuy)}</span>
                )}
            </div>

            <div className="p-4 pt-0">
                <Link
                    href={href}
                    className="group/btn flex w-full items-center justify-center gap-2 rounded-xl bg-gradient-to-r from-blue-600 to-blue-700 px-4 py-3 font-medium text-white shadow transition-all duration-300 hover:from-blue-700 hover:to-blue-800 hover:shadow-lg hover:shadow-blue-500/25"
                >
                    Xem chi tiết
                    <i className="fas fa-eye h-4 w-4 transition-transform duration-300 group-hover/btn:translate-x-1" />
                </Link>
            </div>
        </div>
    );
};

export default ProductCard;
