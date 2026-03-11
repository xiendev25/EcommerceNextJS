"use client";

import React, { useEffect, useMemo, useState } from "react";
import PriceRangeSlider from "../_components/priceRangeSlider/PriceRangeSlider";
import ProductCard from "../_components/product/ProductCard";

const API_BASE = process.env.NEXT_PUBLIC_API_BASE_URL;
const MAX_PRICE = 5000000;

function encodeAttrsParam(blocks) {
    try {
        return encodeURIComponent(JSON.stringify(blocks || []));
    } catch {
        return "";
    }
}

function collectAttrValuesFromProducts(items = []) {
    const map = new Map();
    for (const p of items) {
        const list = p?.product_attribute || p?.productAttributes || [];
        for (const pa of list) {
            const attrId = pa?.attribute_id ?? pa?.attribute?.id;
            const attrName = pa?.attribute?.name;
            const v = pa?.value;
            if (!attrId || v == null) continue;
            if (!map.has(attrId)) map.set(attrId, { id: attrId, name: attrName || `#${attrId}`, values: new Set() });
            map.get(attrId).values.add(String(v));
        }
    }
    // convert set -> array sorted
    return Array.from(map.values()).map(a => ({ ...a, values: Array.from(a.values).sort() }));
}

export default function ProductPage() {
    // data
    const [products, setProducts] = useState([]);
    const [pagination, setPagination] = useState({
        current_page: 1,
        last_page: 1,
        total: 0,
        per_page: 9,
    });
    const [viewMode, setViewMode] = useState("grid");
    const [uiPage, setUiPage] = useState(1);
    const [loadState, setLoadState] = useState({ loading: true, error: null });

    const [categories, setCategories] = useState([]);
    const [selectedCategoryId, setSelectedCategoryId] = useState(null);
    const [appliedPriceRange, setAppliedPriceRange] = useState([0, MAX_PRICE]);

    const [attributes, setAttributes] = useState([]);
    const [pickedAttrValues, setPickedAttrValues] = useState({});

    const [onlySale, setOnlySale] = useState(false);
    const [isNew, setIsNew] = useState(false);
    const [sort, setSort] = useState("latest");

    const pagesToShow = useMemo(() => {
        const total = pagination.last_page || 1;
        const curr = uiPage;
        const windowSize = 5;
        let start = Math.max(1, curr - 2);
        let end = Math.min(total, start + windowSize - 1);
        start = Math.max(1, end - windowSize + 1);
        return Array.from({ length: end - start + 1 }, (_, i) => start + i);
    }, [uiPage, pagination.last_page]);

    useEffect(() => {
        (async () => {
            try {
                const res = await fetch(`${API_BASE}/getCategories`);
                if (!res.ok) throw new Error(`Category HTTP ${res.status}`);
                const data = await res.json();
                setCategories(Array.isArray(data) ? data : []);
            } catch (e) {
                console.error("Failed to fetch categories:", e);
            }
        })();
    }, []);

    useEffect(() => {
        (async () => {
            try {
                const res = await fetch(`${API_BASE}/attribute`);
                if (!res.ok) throw new Error(`Attribute HTTP ${res.status}`);
                const data = await res.json();
                const normalized = (Array.isArray(data) ? data : []).map(a => ({
                    id: a.id,
                    name: a.name,
                    values: Array.isArray(a.values) ? a.values : [],
                }));
                setAttributes(normalized);
            } catch (e) {
                console.warn("Could not fetch /attribute, will fallback from products later.");
            }
        })();
    }, []);

    const attrsPayload = useMemo(() => {
        const blocks = [];
        for (const attrIdStr of Object.keys(pickedAttrValues)) {
            const valuesSet = pickedAttrValues[attrIdStr];
            if (!valuesSet || valuesSet.size === 0) continue;
            blocks.push({ id: Number(attrIdStr) || attrIdStr, values: Array.from(valuesSet) });
        }
        return blocks;
    }, [pickedAttrValues]);

    useEffect(() => {
        (async () => {
            setLoadState({ loading: true, error: null });

            const params = new URLSearchParams();
            params.append("page", uiPage);
            if (selectedCategoryId) params.append("category_id", selectedCategoryId);
            params.append("min_price", appliedPriceRange[0]);
            params.append("max_price", appliedPriceRange[1]);
            params.append("sort", sort);

            if (onlySale) params.append("only_sale", "1");
            if (isNew) params.append("is_new", "1");

            if (attrsPayload.length > 0) {
                params.append("attrs", decodeURIComponent(encodeAttrsParam(attrsPayload)));
            }

            const url = `${API_BASE}/getListProduct?${params.toString()}`;

            try {
                const res = await fetch(url);
                if (!res.ok) throw new Error(`Product HTTP ${res.status}`);

                const j = await res.json();
                const items = Array.isArray(j?.data) ? j.data : [];
                setProducts(items);
                setPagination({
                    current_page: j.current_page,
                    last_page: j.last_page,
                    total: j.total,
                    per_page: j.per_page,
                });

                const hasValues = attributes.some(a => Array.isArray(a.values) && a.values.length > 0);
                if (!hasValues && items.length > 0) {
                    const derived = collectAttrValuesFromProducts(items);
                    if (derived.length > 0) {
                        setAttributes(prev => {
                            const map = new Map(prev.map(a => [String(a.id), a]));
                            for (const d of derived) {
                                const key = String(d.id);
                                const old = map.get(key);
                                map.set(key, {
                                    id: d.id,
                                    name: old?.name || d.name,
                                    values: Array.isArray(old?.values) && old.values.length ? old.values : d.values,
                                });
                            }
                            return Array.from(map.values());
                        });
                    }
                }

                setLoadState({ loading: false, error: null });
            } catch (e) {
                setProducts([]);
                setLoadState({ loading: false, error: e.message || "Fetch error" });
            }
        })();
    }, [
        uiPage,
        selectedCategoryId,
        appliedPriceRange,
        sort,
        onlySale,
        isNew,
        attrsPayload,
    ]);

    const handlePriceApply = (newRange) => {
        setAppliedPriceRange(newRange);
        setUiPage(1);
    };

    const toggleAttrValue = (attrId, value) => {
        setPickedAttrValues(prev => {
            const key = String(attrId);
            const next = new Map(Object.entries(prev).map(([k, v]) => [k, new Set(v)]));
            const set = next.get(key) || new Set();
            if (set.has(value)) set.delete(value);
            else set.add(value);
            next.set(key, set);
            const obj = {};
            for (const [k, v] of next.entries()) obj[k] = v;
            return obj;
        });
        setUiPage(1);
    };

    const clearAllAttrs = () => {
        setPickedAttrValues({});
        setUiPage(1);
    };

    const clearAllFilters = () => {
        setSelectedCategoryId(null);
        setAppliedPriceRange([0, MAX_PRICE]);
        setPickedAttrValues({});
        setOnlySale(false);
        setIsNew(false);
        setSort("latest");
        setUiPage(1);
    };

    return (
        <main className="min-h-screen bg-gradient-to-br from-gray-50 to-white">
            <div className="mx-auto max-w-7xl px-4 sm:px-6 py-10 pt-40">
                <div className="bg-white rounded-2xl shadow border border-gray-100 p-4 sm:p-6 mb-6">
                    <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
                        <div className="flex items-center gap-3">
                            <div className="hidden sm:flex items-center gap-1 ml-2">
                                <button
                                    className={`px-3 py-2 rounded ${viewMode === "grid" ? "bg-gray-900 text-white" : "bg-gray-100 text-gray-700"}`}
                                    onClick={() => setViewMode("grid")}
                                    title="Xem dạng lưới"
                                >
                                    <i className="fa-solid fa-table-cells-large" />
                                </button>
                                <button
                                    className={`px-3 py-2 rounded ${viewMode === "list" ? "bg-gray-900 text-white" : "bg-gray-100 text-gray-700"}`}
                                    onClick={() => setViewMode("list")}
                                    title="Xem dạng danh sách"
                                >
                                    <i className="fa-solid fa-list" />
                                </button>
                            </div>
                        </div>
                        <div className="flex items-center gap-2">
                            <label className="text-sm text-gray-600">Sắp xếp:</label>
                            <select
                                value={sort}
                                onChange={(e) => { setSort(e.target.value); setUiPage(1); }}
                                className="rounded-lg border border-gray-200 px-3 py-2 text-sm"
                            >
                                <option value="latest">Mới nhất</option>
                                <option value="price_asc">Giá thấp đến cao</option>
                                <option value="price_desc">Giá cao đến thấp</option>
                            </select>
                        </div>

                    </div>
                </div>

                <div className="flex flex-col gap-6 lg:flex-row">
                    <aside className="w-full lg:w-1/4 space-y-6">
                        <div className="bg-white rounded-2xl shadow border border-gray-100">
                            <div className="flex items-center justify-between p-4 border-b border-gray-100">
                                <div className="flex items-center gap-2">
                                    <div className="w-8 h-8 bg-gradient-to-r from-blue-600 to-purple-600 text-white rounded-lg flex items-center justify-center">
                                        <i className="fa-solid fa-filter" />
                                    </div>
                                    <h2 className="font-semibold text-gray-900">Chủ đề</h2>
                                </div>
                                <button
                                    className="text-sm text-blue-600 hover:underline"
                                    onClick={() => { setSelectedCategoryId(null); setUiPage(1); }}
                                >
                                    Tất cả
                                </button>
                            </div>
                            <div className="p-4">
                                <div className="space-y-2">
                                    {categories.length === 0 && <div className="text-sm text-gray-500">Đang tải...</div>}
                                    {categories
                                        // chỉ hiển thị category có sản phẩm con
                                        .filter(c => Number(c.product_count ?? 0) > 0)
                                        .map((c) => {
                                            const checked = String(selectedCategoryId) === String(c.id);
                                            return (
                                                <label
                                                    key={c.id}
                                                    className={`flex items-center justify-between p-2 rounded cursor-pointer transition-colors ${checked ? "bg-blue-50 border border-blue-200" : "hover:bg-gray-50"
                                                        }`}
                                                >
                                                    <div className="flex items-center gap-3">
                                                        <input
                                                            type="radio"
                                                            name="category"
                                                            checked={checked}
                                                            onChange={() => {
                                                                setSelectedCategoryId(checked ? null : c.id);
                                                                setUiPage(1);
                                                            }}
                                                            className="accent-blue-600"
                                                        />
                                                        <span className="text-sm text-gray-800">
                                                            {c.name}{" "}
                                                            <span className="text-gray-400 text-xs">
                                                                ({c.product_count})
                                                            </span>
                                                        </span>
                                                    </div>
                                                    <i className="fa-solid fa-chevron-right text-gray-300" />
                                                </label>
                                            );
                                        })}

                                </div>
                            </div>
                        </div>

                        <div className="bg-white rounded-2xl shadow border border-gray-100">
                            <div className="flex items-center justify-between p-4 border-b border-gray-100">
                                <h2 className="font-semibold text-gray-900">Thuộc tính</h2>
                                <button
                                    className="text-sm text-blue-600 hover:underline"
                                    onClick={clearAllAttrs}
                                >
                                    Xóa
                                </button>
                            </div>

                            <div className="p-4 space-y-4 ">
                                {attributes.filter(a => Array.isArray(a.values) && a.values.length > 0).length === 0 && (
                                    <div className="text-sm text-gray-500">Không có thuộc tính khả dụng.</div>
                                )}

                                {attributes
                                    .filter(a => Array.isArray(a.values) && a.values.length > 0)
                                    .map((a) => (
                                        <div key={a.id} className="border border-gray-100 rounded-lg">
                                            <div className="px-3 py-2 bg-gray-50 rounded-t-lg text-sm font-medium text-gray-800">
                                                {a.name}
                                            </div>
                                            <div className="p-3 flex flex-wrap gap-2">
                                                {a.values.map((v) => {
                                                    const isPicked = pickedAttrValues[String(a.id)]?.has?.(String(v));
                                                    return (
                                                        <button
                                                            key={v}
                                                            onClick={() => toggleAttrValue(a.id, String(v))}
                                                            className={`px-3 py-1 rounded-full text-xs border transition ${isPicked
                                                                ? "bg-blue-600 text-white border-blue-600"
                                                                : "bg-white text-gray-700 border-gray-200 hover:bg-blue-50"
                                                                }`}
                                                            title={String(v)}
                                                        >
                                                            {String(v)}
                                                        </button>
                                                    );
                                                })}
                                            </div>
                                        </div>
                                    ))}
                            </div>
                        </div>


                        <div className="bg-white rounded-2xl shadow border border-gray-100">
                            <div className="flex items-center justify-between p-4 border-b border-gray-100">
                                <h2 className="font-semibold text-gray-900">Tình trạng</h2>
                                <button
                                    className="text-sm text-blue-600 hover:underline"
                                    onClick={() => { setOnlySale(false); setIsNew(false); setUiPage(1); }}
                                >
                                    Xóa
                                </button>
                            </div>
                            <div className="p-4 space-y-2">
                                <label className="flex items-center gap-3 cursor-pointer">
                                    <input
                                        type="checkbox"
                                        checked={isNew}
                                        onChange={(e) => { setIsNew(e.target.checked); setUiPage(1); }}
                                        className="accent-blue-600"
                                    />
                                    <span className="text-sm text-gray-800">Mới</span>
                                </label>
                                <label className="flex items-center gap-3 cursor-pointer">
                                    <input
                                        type="checkbox"
                                        checked={onlySale}
                                        onChange={(e) => { setOnlySale(e.target.checked); setUiPage(1); }}
                                        className="accent-blue-600"
                                    />
                                    <span className="text-sm text-gray-800">Đang giảm giá</span>
                                </label>
                            </div>
                        </div>

                        {/* Price */}
                        <PriceRangeSlider
                            min={0}
                            max={MAX_PRICE}
                            step={10000}
                            initialMin={appliedPriceRange[0]}
                            initialMax={appliedPriceRange[1]}
                            onApply={(range) => { handlePriceApply(range); }}
                        />

                        {/* Clear all */}
                        <button
                            onClick={clearAllFilters}
                            className="w-full mt-2 px-4 py-2 rounded-xl bg-gray-100 hover:bg-gray-200 text-gray-800"
                        >
                            Xóa tất cả bộ lọc
                        </button>
                    </aside>

                    {/* Content */}
                    <section className="w-full lg:w-3/4">
                        {loadState.error && (
                            <div className="bg-red-50 border border-red-200 text-red-700 rounded-xl p-4 mb-4">
                                <i className="fa-solid fa-circle-exclamation mr-2" />
                                Lỗi: {loadState.error}
                            </div>
                        )}

                        {!loadState.loading && products.length === 0 && !loadState.error && (
                            <div className="text-center py-10 bg-white rounded-2xl shadow border border-gray-100">
                                <p className="text-gray-500">Không tìm thấy sản phẩm nào phù hợp.</p>
                            </div>
                        )}

                        {viewMode === "grid" ? (
                            <div className="grid gap-6 grid-cols-1 sm:grid-cols-2 lg:grid-cols-3">
                                {loadState.loading
                                    ? Array.from({ length: 9 }).map((_, i) => (
                                        <div key={i} className="bg-white rounded-2xl shadow border border-gray-100 overflow-hidden animate-pulse">
                                            <div className="aspect-square bg-gradient-to-br from-gray-200 to-gray-300" />
                                            <div className="p-5 space-y-3">
                                                <div className="h-4 bg-gray-200 rounded" />
                                                <div className="h-6 bg-gray-200 rounded w-3/4" />
                                                <div className="h-4 bg-gray-200 rounded w-1/2" />
                                            </div>
                                        </div>
                                    ))
                                    : products.map((p) => <ProductCard key={p.id} p={p} view="grid" />)}
                            </div>
                        ) : (
                            <div className="space-y-4">
                                {loadState.loading
                                    ? Array.from({ length: 6 }).map((_, i) => (
                                        <div key={i} className="bg-white rounded-2xl shadow border border-gray-100 overflow-hidden animate-pulse h-40" />
                                    ))
                                    : products.map((p) => <ProductCard key={p.id} p={p} view="list" />)}
                            </div>
                        )}

                        {!loadState.loading && pagination.last_page > 1 && (
                            <div className="mt-8 flex justify-center">
                                <nav className="flex items-center gap-2 bg-white rounded-2xl shadow border border-gray-100 p-2">
                                    <button
                                        disabled={uiPage <= 1}
                                        onClick={() => setUiPage((p) => Math.max(1, p - 1))}
                                        className={`flex items-center gap-2 px-4 py-2 rounded-lg transition-colors ${uiPage <= 1 ? "cursor-not-allowed text-gray-400 bg-gray-50" : "text-gray-700 hover:bg-blue-50 hover:text-blue-600"
                                            }`}
                                    >
                                        <i className="fa-solid fa-angle-left" />
                                        <span className="hidden sm:inline">Trước</span>
                                    </button>

                                    <div className="flex items-center gap-1">
                                        {pagesToShow.map((n) => (
                                            <button
                                                key={n}
                                                onClick={() => setUiPage(n)}
                                                className={`w-10 h-10 rounded-lg font-medium transition-all ${uiPage === n
                                                    ? "bg-gradient-to-r from-blue-600 to-purple-600 text-white shadow scale-110"
                                                    : "text-gray-700 hover:bg-gray-100 hover:text-blue-600"
                                                    }`}
                                            >
                                                {n}
                                            </button>
                                        ))}
                                    </div>

                                    <button
                                        disabled={uiPage >= pagination.last_page}
                                        onClick={() => setUiPage((p) => Math.min(pagination.last_page, p + 1))}
                                        className={`flex items-center gap-2 px-4 py-2 rounded-lg transition-colors ${uiPage >= pagination.last_page ? "cursor-not-allowed text-gray-400 bg-gray-50" : "text-gray-700 hover:bg-blue-50 hover:text-blue-600"
                                            }`}
                                    >
                                        <span className="hidden sm:inline">Sau</span>
                                        <i className="fa-solid fa-angle-right" />
                                    </button>
                                </nav>
                            </div>
                        )}
                    </section>
                </div>
            </div>
        </main>
    );
}
