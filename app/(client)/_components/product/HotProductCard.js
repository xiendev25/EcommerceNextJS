"use client";
import React, { useMemo, useState } from "react";
import Image from "next/image";
import Link from "next/link";

const toNumber = (v) => {
    if (v === null || v === undefined || v === "") return NaN;
    return Number(String(v).replace(/[, ]+/g, ""));
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

const HotProductCard = ({ p = {} }) => {
    const [imageError, setImageError] = useState(false);

    const {
        isNew,
        hasSale,
        priceBuy,
        priceSale,
        salePercent,
        soldCount,
        salesTrend,
    } = useMemo(() => {
        const now = new Date();

        // NEW badge: 10 ngày
        const created = safeDate(p?.product_created_at);
        const diffDays = created && isFinite(created) ? Math.floor((now - created) / 86400000) : Infinity;
        const isNew = diffDays <= 10;

        // Giá gốc
        const priceBuy = toNumber(p?.product_price_buy);

        // SALE từ mảng product_sale
        let priceSale = NaN;
        let hasSale = false;

        if (Array.isArray(p?.product_sale) && p.product_sale.length > 0 && isFinite(priceBuy) && priceBuy > 0) {
            // lọc các sale đang hiệu lực
            const actives = p.product_sale.filter((s) => {
                const ps = toNumber(s?.price_sale);
                const begin = safeDate(s?.date_begin);
                const end = safeDate(s?.date_end);
                const inWindow = (!begin || now >= begin) && (!end || now <= end);
                return isFinite(ps) && ps > 0 && ps < priceBuy && inWindow;
            });
            if (actives.length) {
                // chọn sale có price_sale thấp nhất
                const best = actives.reduce((min, s) =>
                    toNumber(s.price_sale) < toNumber(min.price_sale) ? s : min
                );
                priceSale = toNumber(best.price_sale);
                hasSale = true;
            }
        }

        const salePercent = hasSale ? Math.max(1, Math.min(95, Math.round((1 - priceSale / priceBuy) * 100))) : 0;

        // Sold count (đồng bộ tên trường mới)
        const soldCount = Number(p?.product_qty_sold ?? p?.qty_sold ?? 0);
        const salesTrend = soldCount > 100 ? "trending" : soldCount > 50 ? "hot" : "normal";

        return { isNew, hasSale, priceBuy, priceSale, salePercent, soldCount, salesTrend };
    }, [p]);

    const imgSrc =
        p?.product_thumbnail ||
        p?.product_image?.[0]?.image ||
        "/images/products/product-2-bg-1.png";

    const href = p?.product_slug ? `/san-pham/${p.product_slug}` : "#";

    return (
        <div className="group relative flex min-h-[420px] flex-col overflow-hidden rounded-2xl border border-gray-100 bg-white shadow-md transition-all duration-500 hover:-translate-y-2 hover:border-orange-200 hover:shadow-2xl">
            <div className="absolute inset-0 bg-gradient-to-br from-orange-500/5 via-red-500/5 to-pink-500/5 opacity-0 transition-opacity duration-500 group-hover:opacity-100" />

            <div className="absolute left-3 top-3 z-20 flex flex-col gap-2">
                {(salesTrend === "hot" || salesTrend === "trending") && (
                    <div className="flex items-center gap-1 rounded-full bg-gradient-to-r from-orange-500 via-red-500 to-pink-500 px-3 py-1.5 text-xs font-bold text-white shadow-lg animate-pulse">
                        <i className="fa-solid fa-fire h-3 w-3 animate-bounce"></i>
                        {salesTrend === "trending" ? "TRENDING" : "HOT"}
                    </div>
                )}
                {isNew && (
                    <div className="flex items-center gap-1 rounded-full bg-gradient-to-r from-blue-600 to-indigo-600 px-3 py-1.5 text-xs font-bold text-white shadow-lg">
                        <span className="h-2 w-2 animate-ping rounded-full bg-white"></span>
                        MỚI
                    </div>
                )}
            </div>

            {hasSale && (
                <div className="absolute right-3 top-3 z-20">
                    <div className="rotate-6 rounded-full bg-gradient-to-r from-red-500 to-rose-600 px-4 py-2 text-sm font-bold text-white shadow-xl transition-transform duration-300 hover:rotate-0">
                        <div className="text-center leading-tight">
                            <div className="text-lg leading-none">-{salePercent}%</div>
                            <div className="text-[10px] opacity-90">GIẢM GIÁ</div>
                        </div>
                    </div>
                </div>
            )}

            <div className="relative aspect-square overflow-hidden bg-gradient-to-br from-orange-50 to-pink-50 transition-all duration-500 group-hover:from-orange-100 group-hover:to-pink-100">
                <Link href={href} className="block h-full w-full p-4" aria-label={p?.product_name || "Sản phẩm"}>
                    {!imageError ? (
                        <Image
                            src={imgSrc}
                            fill
                            alt={p?.product_name || "Sản phẩm"}
                            className="object-contain drop-shadow-lg transition-transform duration-700 ease-out group-hover:scale-110"
                            onError={() => setImageError(true)}
                            sizes="(max-width: 768px) 100vw, (max-width: 1200px) 50vw, 25vw"
                        />
                    ) : (
                        <div className="flex h-full w-full items-center justify-center rounded-lg bg-gradient-to-br from-gray-200 to-gray-300">
                            <div className="text-center text-gray-400">
                                <div className="mx-auto mb-3 flex h-20 w-20 items-center justify-center rounded-xl bg-gray-300">
                                    <i className="fa-solid fa-fire h-8 w-8"></i>
                                </div>
                                <p className="text-sm font-medium">Hot Product</p>
                            </div>
                        </div>
                    )}
                </Link>
            </div>

            <div className="flex flex-1 flex-col justify-between p-4">
                <div className="mb-4 text-center">
                    <h3 className="mb-2 line-clamp-2 text-lg font-bold text-gray-900 transition-all duration-300 group-hover:bg-gradient-to-r group-hover:from-orange-600 group-hover:to-red-600 group-hover:bg-clip-text group-hover:text-transparent">
                        <Link href={href}>{p?.product_name || "---"}</Link>
                    </h3>

                    <div className="mb-3">
                        {hasSale ? (
                            <div className="space-y-1">
                                <div className="flex items-center justify-center gap-3">
                                    <span className="bg-gradient-to-r from-red-500 to-rose-600 bg-clip-text text-2xl font-bold text-transparent">
                                        {fmtVND(priceSale)}
                                    </span>
                                </div>
                                <div className="flex items-center justify-center gap-2">
                                    <span className="line-through text-sm text-gray-500">{fmtVND(priceBuy)}</span>
                                    <span className="rounded-full bg-red-100 px-2 py-1 text-xs font-bold text-red-700">
                                        Tiết kiệm {fmtVND(priceBuy - priceSale)}
                                    </span>
                                </div>
                            </div>
                        ) : (
                            <span className="text-2xl font-bold text-gray-900">{fmtVND(priceBuy)}</span>
                        )}
                    </div>

                    {soldCount > 0 && (
                        <div className="mb-4 rounded-full bg-gradient-to-r from-orange-100 to-pink-100 px-4 py-2">
                            <div className="flex items-center justify-center gap-2">
                                <i className="fa-solid fa-arrow-trend-up h-4 w-4 text-orange-600"></i>
                                <span className="text-sm font-bold text-orange-800">
                                    Đã bán {soldCount.toLocaleString("vi-VN")} sản phẩm
                                </span>
                                {salesTrend === "trending" && (
                                    <div className="flex gap-1">
                                        <div className="h-4 w-1 animate-bounce rounded bg-orange-500"></div>
                                        <div className="h-4 w-1 animate-bounce rounded bg-red-500" style={{ animationDelay: "0.1s" }}></div>
                                        <div className="h-4 w-1 animate-bounce rounded bg-pink-500" style={{ animationDelay: "0.2s" }}></div>
                                    </div>
                                )}
                            </div>
                        </div>
                    )}
                </div>

                <Link
                    href={href}
                    className="group/btn flex w-full transform items-center justify-center gap-2 rounded-xl bg-gradient-to-r from-orange-500 via-red-500 to-pink-500 px-6 py-3 font-bold text-white shadow transition-all duration-300 hover:scale-105 hover:from-orange-600 hover:via-red-600 hover:to-pink-600 hover:shadow-xl hover:shadow-orange-500/25"
                >
                    Mua sản phẩm HOT
                    <i className="fa-solid fa-eye h-4 w-4 transition-transform duration-300 group-hover/btn:translate-x-1"></i>
                </Link>
            </div>
        </div>
    );
};

export default HotProductCard;
