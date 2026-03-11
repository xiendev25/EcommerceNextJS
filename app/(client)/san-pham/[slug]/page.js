"use client";

import React, { useEffect, useMemo, useState } from "react";
import { useParams, useRouter } from "next/navigation";
import Link from "next/link";
import ProductCard from "../../_components/product/ProductCard";

const API_BASE = process.env.NEXT_PUBLIC_API_BASE_URL;

const formatVND = (amount) => {
    const n = Number(amount);
    if (!isFinite(n)) return "";
    try {
        return n.toLocaleString("vi-VN", { style: "currency", currency: "VND" });
    } catch {
        return `${n} ₫`;
    }
};

const normalizeList = (json) => {
    if (Array.isArray(json)) return json;
    return json?.data?.data ?? json?.data ?? json?.items ?? [];
};

const safeDate = (d) => {
    if (!d) return null;
    const t = new Date(String(d).replace(" ", "T"));
    return isNaN(+t) ? null : t;
};

const toNumber = (v) => {
    if (v === null || v === undefined || v === "") return NaN;
    return Number(String(v).replace(/[, ]+/g, ""));
};

function computePricing(product) {
    const originalPrice = toNumber(product?.product_price_buy) || 0;
    let finalPrice = originalPrice;
    let salePrice = null;
    let hasSale = false;
    let discount = 0;

    const now = Date.now();
    const sales = Array.isArray(product?.product_sale) ? product.product_sale : [];
    const active = sales.find((s) => {
        const from = safeDate(s?.date_begin);
        const to = safeDate(s?.date_end);
        return from && to && +from <= now && now <= +to;
    });

    if (active) {
        const p = toNumber(active.price_sale);
        if (isFinite(p) && p > 0 && p < originalPrice) {
            hasSale = true;
            salePrice = p;
            finalPrice = p;
            discount = Math.round(((originalPrice - p) / Math.max(1, originalPrice)) * 100);
        }
    }

    return {
        originalPrice,
        finalPrice,
        hasSale,
        salePrice: salePrice ?? originalPrice,
        discount: Math.max(0, discount),
    };
}

function buildGroupedAttributes(product) {
    const arr = Array.isArray(product?.product_attribute) ? product.product_attribute : [];
    const map = new Map();
    for (const it of arr) {
        const id = it?.attribute_id;
        if (!id) continue;
        const name = it?.attribute?.name ?? `Thuộc tính #${id}`;
        const value = String(it?.value ?? "").trim();
        if (!map.has(id)) map.set(id, { id, name, values: new Set() });
        if (value) map.get(id).values.add(value);
    }
    return [...map.values()].map((g) => ({ ...g, values: [...g.values] }));
}

export default function ProductDetailPage() {
    const params = useParams();
    const slug = Array.isArray(params?.slug) ? params.slug[0] : params?.slug;
    const router = useRouter();

    const [product, setProduct] = useState(null);
    const [state, setState] = useState({ loading: true, error: null });

    const [selectedAttributes, setSelectedAttributes] = useState({});
    const [selectedImage, setSelectedImage] = useState(null);
    const [quantity, setQuantity] = useState(1);

    const [related, setRelated] = useState([]);

    const [lightboxOpen, setLightboxOpen] = useState(false);
    const [lightboxImage, setLightboxImage] = useState(null);

    useEffect(() => {
        if (!slug) return;

        (async () => {
            try {
                setState({ loading: true, error: null });

                const res = await fetch(`${API_BASE}/product/${encodeURIComponent(slug)}`);
                if (!res.ok) throw new Error(`HTTP ${res.status}`);
                const data = await res.json();
                const found = data?.data ?? data;

                setProduct(found);

                const firstImg =
                    found?.product_thumbnail ||
                    found?.product_image?.[0]?.image ||
                    "/images/products/product_placeholder.webp";
                setSelectedImage(firstImg);

                setState({ loading: false, error: null });
            } catch (e) {
                if (e.name !== "AbortError") {
                    setState({ loading: false, error: e.message || "Fetch error" });
                }
            }
        })();
    }, [slug]);

    useEffect(() => {
        if (!product?.category_slug && !product?.category_id) return;

        (async () => {
            try {
                const res = await fetch(
                    `${API_BASE}/getProductByCategory/${encodeURIComponent(product.category_id)}`
                );
                if (!res.ok) throw new Error(`Related HTTP ${res.status}`);
                const j = await res.json();
                const list = normalizeList(j)
                    .filter((x) => x?.id !== product?.id)
                    .map((x) => ({
                        ...x,
                        pricing: computePricing(x),
                    }));
                setRelated(list);
            } catch (e) {
                if (e.name !== "AbortError") {
                    console.warn("Fetch related failed:", e.message || e);
                }
            }
        })();
    }, [product?.category_slug, product?.category_id, product?.id]);

    useEffect(() => {
        if (!lightboxOpen) return;
        const onKey = (e) => {
            if (e.key === "Escape") setLightboxOpen(false);
        };
        window.addEventListener("keydown", onKey);
        return () => window.removeEventListener("keydown", onKey);
    }, [lightboxOpen]);

    const pricing = useMemo(() => computePricing(product), [product]);
    const isNew = useMemo(() => {
        const created = safeDate(product?.product_created_at);
        return created ? Math.floor((Date.now() - +created) / 86400000) <= 7 : false;
    }, [product]);

    const qtyStore = Number(product?.product_qty_store ?? 0);
    const qtySold = Number(product?.product_qty_sold ?? 0);
    const qtyLeft = Math.max(0, qtyStore - qtySold);

    const groupedAttributes = useMemo(() => buildGroupedAttributes(product), [product]);

    const handleQuantityChange = (delta) => setQuantity((q) => Math.max(1, q + delta));
    const handleAttributeSelect = (attributeId, value) =>
        setSelectedAttributes((s) => ({ ...s, [attributeId]: value }));

    const openLightbox = (imgSrc) => {
        setLightboxImage(imgSrc);
        setLightboxOpen(true);
    };
    const closeLightbox = () => {
        setLightboxOpen(false);
    };

    const handleAddToCart = () => {
        const user = localStorage.getItem("token");
        if (!user) {
            alert("Vui lòng đăng nhập để thêm vào giỏ hàng!");
            router.push("/dang-nhap");
            return;
        }
        if (qtyLeft === 0) return;

        const id = product?.product_id ?? product?.id;
        if (!id) {
            console.warn("Thiếu product_id/id trong dữ liệu sản phẩm", product);
            return;
        }


        const item = {
            id,
            product_name: product?.product_name,
            product_slug: product?.product_slug,
            product_thumbnail: product?.product_thumbnail,
            product_price_buy: product?.product_price_buy,
            product_price_sale: product?.product_price_sale,
            qty: quantity,
        };

        let cart = [];
        try {
            cart = JSON.parse(localStorage.getItem("cart")) || [];
            if (!Array.isArray(cart)) cart = [];
        } catch {
            cart = [];
        }

        const keyAttrs = JSON.stringify(item.attributes || {});
        const idx = cart.findIndex((x) => x.id === id && JSON.stringify(x.attributes || {}) === keyAttrs);
        if (idx > -1) {
            cart[idx].qty += item.qty;
        } else {
            cart.push(item);
        }

        localStorage.setItem("cart", JSON.stringify(cart));
        window.dispatchEvent(new Event('cartUpdated'));
        alert("Đã thêm vào giỏ hàng!");
    };

    if (state.loading) {
        return (
            <div className="min-h-screen flex items-center justify-center">
                <div className="text-center">
                    <h2 className="text-2xl font-semibold text-gray-900 mb-2">Đang tải…</h2>
                    <p className="text-gray-600">Vui lòng chờ trong giây lát.</p>
                </div>
            </div>
        );
    }

    if (state.error || !product) {
        return (
            <div className="min-h-screen flex items-center justify-center">
                <div className="text-center">
                    <h2 className="text-2xl font-semibold text-gray-900 mb-2">Không tìm thấy sản phẩm</h2>
                    <p className="text-gray-600">{state.error || "Sản phẩm không tồn tại hoặc đã bị xoá."}</p>
                    <div className="mt-4">
                        <Link href="/" className="text-blue-600 hover:underline">
                            ← Về trang chủ
                        </Link>
                    </div>
                </div>
            </div>
        );
    }

    return (
        <div className="min-h-screen bg-gray-50 pt-30">
            <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
                <div className="lg:grid lg:grid-cols-2 lg:gap-12">
                    <div className="mb-8 lg:mb-0">
                        <div className="relative">
                            <div className="aspect-square bg-white rounded-2xl shadow-lg overflow-hidden mb-4">
                                <img
                                    src={selectedImage || product?.product_image?.[0]?.image}
                                    alt={product.product_name}
                                    className="w-full h-full object-cover cursor-zoom-in"
                                    onClick={() => openLightbox(selectedImage || product?.product_image?.[0]?.image)}
                                />

                                <div className="absolute top-4 left-4 flex flex-col gap-2">
                                    {isNew && (
                                        <span className="bg-blue-500 text-white text-xs font-semibold px-3 py-1 rounded-full">Mới</span>
                                    )}
                                    {pricing.hasSale && (
                                        <span className="bg-red-500 text-white text-xs font-semibold px-3 py-1 rounded-full">
                                            -{pricing.discount}%
                                        </span>
                                    )}
                                </div>
                            </div>

                            {/* Thumbnails */}
                            <div className="flex gap-3 overflow-x-auto pb-2">
                                {product.product_thumbnail && (
                                    <button
                                        onClick={() => {
                                            setSelectedImage(product.product_thumbnail);
                                        }}
                                        className={`flex-shrink-0 w-20 h-20 rounded-lg overflow-hidden border-2 transition-colors ${selectedImage === product.product_thumbnail
                                            ? "border-blue-500"
                                            : "border-gray-200 hover:border-gray-300"
                                            }`}
                                        aria-label="Thumbnail"
                                    >
                                        <img src={product.product_thumbnail} alt="" className="w-full h-full object-cover" />
                                    </button>
                                )}
                                {(product.product_image ?? []).map((img) => (
                                    <button
                                        key={img.id}
                                        onClick={() => {
                                            setSelectedImage(img.image);
                                        }}
                                        className={`flex-shrink-0 w-20 h-20 rounded-lg overflow-hidden border-2 transition-colors ${selectedImage === img.image ? "border-blue-500" : "border-gray-200 hover:border-gray-300"
                                            }`}
                                        aria-label={img?.alt || img?.title || "Ảnh sản phẩm"}
                                        aria-selected={selectedImage === img.image}
                                    >
                                        <img src={img.image} alt={img.alt || ""} className="w-full h-full object-cover" />
                                    </button>
                                ))}
                            </div>
                        </div>
                    </div>

                    {/* Info */}
                    <div className="space-y-6">
                        <div>
                            <h1 className="text-3xl font-bold text-gray-900 mb-2">{product.product_name}</h1>
                            <div className="flex items-center gap-2 mb-4">
                                <div className="flex items-center gap-1 text-yellow-400">
                                    {[...Array(5)].map((_, i) => (
                                        <i key={i} className="fa-solid fa-star text-sm" />
                                    ))}
                                </div>
                                <span className="text-sm text-gray-600">(128 đánh giá)</span>
                                <span className="text-sm text-gray-400">|</span>
                                <span className="text-sm text-gray-600">
                                    Đã bán: {Number(product.product_qty_sold ?? 0).toLocaleString("vi-VN")}
                                </span>
                            </div>
                        </div>

                        {/* Price */}
                        <div className="bg-gradient-to-r from-blue-50 to-purple-50 p-6 rounded-2xl">
                            <div className="flex items-center gap-3 mb-2">
                                {pricing.hasSale ? (
                                    <>
                                        <span className="text-3xl font-bold text-blue-600">{formatVND(pricing.salePrice)}</span>
                                        <span className="text-xl text-gray-400 line-through">{formatVND(pricing.originalPrice)}</span>
                                    </>
                                ) : (
                                    <span className="text-3xl font-bold text-blue-600">{formatVND(pricing.originalPrice)}</span>
                                )}
                            </div>
                            <p className="text-sm text-gray-600">
                                Tiết kiệm:{" "}
                                <span className="font-semibold text-green-600">
                                    {formatVND(Math.max(0, pricing.originalPrice - pricing.finalPrice))}
                                </span>
                            </p>
                        </div>

                        {/* Attributes */}
                        {groupedAttributes.map((attr) => (
                            <div key={attr.id}>
                                <h3 className="text-lg font-semibold text-gray-900 mb-3">{attr.name}</h3>
                                <div className="flex flex-wrap gap-3">
                                    {attr.values.map((value) => {
                                        const active = selectedAttributes[attr.id] === value;
                                        return (
                                            <button
                                                key={value}
                                                onClick={() => handleAttributeSelect(attr.id, value)}
                                                className={`px-4 py-2 border-2 rounded-lg font-medium transition-colors ${active ? "border-blue-500 bg-blue-50 text-blue-700" : "border-gray-200 hover:border-gray-300 text-gray-700"
                                                    }`}
                                                aria-pressed={active}
                                            >
                                                {value}
                                            </button>
                                        );
                                    })}
                                </div>
                            </div>
                        ))}

                        {/* Quantity */}
                        <div>
                            <h3 className="text-lg font-semibold text-gray-900 mb-3">Số lượng</h3>
                            <div className="flex items-center gap-4">
                                <div className="flex items-center border-2 border-gray-200 rounded-lg">
                                    <button
                                        onClick={() => handleQuantityChange(-1)}
                                        className="p-2 hover:bg-gray-100 transition-colors"
                                        aria-label="Giảm"
                                    >
                                        <i className="fa-solid fa-minus" />
                                    </button>
                                    <span className="px-4 py-2 font-semibold">{quantity}</span>
                                    <button
                                        onClick={() => handleQuantityChange(1)}
                                        className="p-2 hover:bg-gray-100 transition-colors"
                                        aria-label="Tăng"
                                    >
                                        <i className="fa-solid fa-plus" />
                                    </button>
                                </div>
                                <span className="text-sm text-gray-600">
                                    Còn lại: <span className="font-semibold">{qtyLeft}</span> sản phẩm
                                </span>
                            </div>
                        </div>

                        <div className="flex gap-4">
                            <button
                                onClick={handleAddToCart}
                                className="flex-1 flex items-center justify-center gap-2 bg-blue-600 text-white py-4 px-6 rounded-xl font-semibold hover:bg-blue-700 transition-colors"
                            >
                                <i className="fa-solid fa-cart-plus" />
                                Thêm vào giỏ
                            </button>
                        </div>

                        {/* Trust badges */}
                        <div className="grid grid-cols-2 md:grid-cols-4 gap-4 pt-6 border-t">
                            <div className="flex items-center gap-2 text-sm text-gray-600">
                                <i className="fa-solid fa-truck text-green-500" />
                                <span>Miễn phí vận chuyển</span>
                            </div>
                            <div className="flex items-center gap-2 text-sm text-gray-600">
                                <i className="fa-solid fa-rotate-left text-blue-500" />
                                <span>Đổi trả 7 ngày</span>
                            </div>
                            <div className="flex items-center gap-2 text-sm text-gray-600">
                                <i className="fa-solid fa-shield-halved text-purple-500" />
                                <span>Bảo hành chính hãng</span>
                            </div>
                            <div className="flex items-center gap-2 text-sm text-gray-600">
                                <i className="fa-solid fa-award text-yellow-500" />
                                <span>Hàng chính hãng</span>
                            </div>
                        </div>
                    </div>
                </div>

                {/* Description */}
                <div className="mt-16 bg-white rounded-2xl shadow-lg p-8">
                    <h2 className="text-2xl font-bold text-gray-900 mb-6">Mô tả sản phẩm</h2>
                    <div className="prose max-w-none">
                        {product?.product_description && (
                            <p className="text-gray-700 leading-relaxed mb-4">{product.product_description}</p>
                        )}
                        {product?.product_content && (
                            <div className="text-gray-700 leading-relaxed">
                                <div dangerouslySetInnerHTML={{ __html: product.product_content }} />
                            </div>
                        )}
                    </div>
                </div>

                {/* Specifications */}
                <div className="mt-8 bg-white rounded-2xl shadow-lg p-8">
                    <h2 className="text-2xl font-bold text-gray-900 mb-6">Thông số kỹ thuật</h2>
                    <div className="grid md:grid-cols-2 gap-6">
                        <div className="space-y-3">
                            <div className="flex justify-between py-2 border-b border-gray-100">
                                <span className="text-gray-600">Mã sản phẩm:</span>
                                <span className="font-semibold">#{product.id}</span>
                            </div>
                            <div className="flex justify-between py-2 border-b border-gray-100">
                                <span className="text-gray-600">Danh mục:</span>
                                <span className="font-semibold">{product?.category_name ?? "—"}</span>
                            </div>
                            <div className="flex justify-between py-2 border-b border-gray-100">
                                <span className="text-gray-600">Giá gốc:</span>
                                <span className="font-semibold">{formatVND(product?.product_price_buy)}</span>
                            </div>
                        </div>
                        <div className="space-y-3">
                            <div className="flex justify-between py-2 border-b border-gray-100">
                                <span className="text-gray-600">Tình trạng:</span>
                                <span className={`font-semibold ${qtyLeft > 0 ? "text-green-600" : "text-red-600"}`}>
                                    {qtyLeft > 0 ? "Còn hàng" : "Hết hàng"}
                                </span>
                            </div>
                            <div className="flex justify-between py-2 border-b border-gray-100">
                                <span className="text-gray-600">Số lượng trong kho:</span>
                                <span className="font-semibold">{qtyLeft}</span>
                            </div>
                            <div className="flex justify-between py-2 border-b border-gray-100">
                                <span className="text-gray-600">Ngày tạo:</span>
                                <span className="font-semibold">
                                    {product?.product_created_at
                                        ? new Date(product.product_created_at.replace(" ", "T")).toLocaleDateString("vi-VN")
                                        : "—"}
                                </span>
                            </div>
                        </div>
                    </div>
                </div>

                {/* Related */}
                <div className="mt-12 bg-white rounded-2xl shadow-lg p-8">
                    <div className="flex items-center justify-between mb-8">
                        <h2 className="text-2xl font-bold text-gray-900">Sản phẩm liên quan</h2>
                        {product?.category_slug && (
                            <Link
                                href={`/danh-muc/${product.category_slug}`}
                                className="text-blue-600 hover:text-blue-700 font-semibold text-sm flex items-center gap-1 transition-colors"
                            >
                                Xem tất cả <i className="fa-solid fa-angle-right" />
                            </Link>
                        )}
                    </div>

                    <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
                        {(related || []).slice(0, 8).map((rp) => (
                            <ProductCard key={rp.id} p={rp} />
                        ))}
                    </div>

                    {related.length > 8 && (
                        <div className="flex justify-center mt-8">
                            <Link
                                href={`/danh-muc/${product?.category_slug ?? ""}`}
                                className="bg-gray-100 hover:bg-gray-200 text-gray-700 font-semibold py-3 px-8 rounded-xl transition-colors"
                            >
                                Xem thêm sản phẩm
                            </Link>
                        </div>
                    )}
                </div>
            </div>
            {/* Lightbox */}
            {lightboxOpen && (
                <div
                    className="fixed inset-0 z-[60] bg-black/70 backdrop-blur-sm flex items-center justify-center p-4"
                    onClick={closeLightbox}
                >
                    <div
                        className="relative max-w-[90vw] max-h-[85vh]"
                        onClick={(e) => e.stopPropagation()}
                    >
                        <img
                            src={lightboxImage}
                            alt="Xem ảnh lớn"
                            className="w-auto h-auto max-w-[90vw] max-h-[85vh] rounded-xl shadow-2xl"
                        />
                        <button
                            className="absolute -top-3 -right-3 p-2 rounded-full bg-white text-gray-700 shadow-lg hover:bg-gray-100"
                            onClick={closeLightbox}
                            aria-label="Đóng ảnh"
                            title="Đóng"
                        >
                            <i className="fa-solid fa-xmark" />
                        </button>
                    </div>
                </div>
            )}
        </div>
    );
}
