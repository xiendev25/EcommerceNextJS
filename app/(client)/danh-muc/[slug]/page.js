'use client';

import React, { useEffect, useMemo, useState } from 'react';
import { useParams } from 'next/navigation';
import ProductCard from '../../_components/product/ProductCard';

const API_BASE = process.env.NEXT_PUBLIC_API_BASE_URL;

export default function ProductsByCategoryPage() {
    const params = useParams();
    const slug = params?.slug;

    const [viewMode, setViewMode] = useState('grid');
    const [uiPage, setUiPage] = useState(1);
    const [sort, setSort] = useState('latest');

    const [category, setCategory] = useState(null);
    const [products, setProducts] = useState([]);
    const [pagination, setPagination] = useState({
        current_page: 1,
        last_page: 1,
        total: 0,
        per_page: 9,
    });
    const [state, setState] = useState({ loading: true, error: null });

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
        if (!slug) return;

        let alive = true;
        (async () => {
            setState({ loading: true, error: null });
            try {
                const url = new URL(`${API_BASE}/getProductCategory/${slug}`);
                url.searchParams.set('sort', sort);
                url.searchParams.set('page', uiPage);

                const res = await fetch(url.toString(), { cache: 'no-store' });
                if (!res.ok) throw new Error(`HTTP ${res.status}`);
                const j = await res.json();

                if (!alive) return;

                setCategory(j?.category || null);

                const items = Array.isArray(j?.data) ? j.data : [];

                setProducts(items);
                setPagination({
                    current_page: j.current_page,
                    last_page: j.last_page,
                    total: j.total,
                    per_page: j.per_page,
                });
                setState({ loading: false, error: null });
            } catch (e) {
                if (!alive) return;
                setProducts([]);
                setState({ loading: false, error: e.message || 'Fetch error' });
            }
        })();

        return () => {
            alive = false;
        };
    }, [slug, uiPage, sort]);

    return (
        <main className="min-h-screen bg-gradient-to-br from-gray-50 to-white">
            <div className="mx-auto max-w-7xl px-4 sm:px-6 py-10 pt-40">
                <div className="mb-6">
                    <nav className="text-sm text-gray-500">
                        <a href="/" className="hover:text-gray-700">Trang chủ</a>
                        <span className="mx-2">/</span>
                        <a href="/products" className="hover:text-gray-700">Sản phẩm</a>
                        <span className="mx-2">/</span>
                        {state.loading ? (
                            <span>Đang tải...</span>
                        ) : (
                            <span className="text-gray-900 font-medium">
                                {category?.name || 'Danh mục'}
                            </span>
                        )}
                    </nav>
                </div>

                <div className="bg-white rounded-2xl shadow border border-gray-100 p-4 sm:p-6 mb-6">
                    <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
                        <div className="flex items-center gap-3">
                            <h1 className="text-xl sm:text-2xl font-bold text-gray-900">
                                {category?.name ? `Danh mục: ${category.name}` : 'Sản phẩm theo danh mục'}
                            </h1>
                            <div className="hidden sm:flex items-center gap-1 ml-4">
                                <button
                                    className={`px-3 py-2 rounded ${viewMode === 'grid' ? 'bg-gray-900 text-white' : 'bg-gray-100 text-gray-700'}`}
                                    onClick={() => setViewMode('grid')}
                                    title="Xem dạng lưới"
                                >
                                    <i className="fa-solid fa-table-cells-large" />
                                </button>
                                <button
                                    className={`px-3 py-2 rounded ${viewMode === 'list' ? 'bg-gray-900 text-white' : 'bg-gray-100 text-gray-700'}`}
                                    onClick={() => setViewMode('list')}
                                    title="Xem dạng danh sách"
                                >
                                    <i className="fa-solid fa-list" />
                                </button>
                            </div>
                        </div>

                        <div className="flex items-center gap-3">
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
                </div>

                {state.error && (
                    <div className="bg-red-50 border border-red-200 text-red-700 rounded-xl p-4 mb-6">
                        <i className="fa-solid fa-circle-exclamation mr-2" />
                        {state.error}
                    </div>
                )}

                {viewMode === 'grid' ? (
                    <div className="grid gap-6 grid-cols-1 sm:grid-cols-2 lg:grid-cols-3">
                        {state.loading
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
                        {state.loading
                            ? Array.from({ length: 6 }).map((_, i) => (
                                <div key={i} className="bg-white rounded-2xl shadow border border-gray-100 overflow-hidden animate-pulse h-40" />
                            ))
                            : products.map((p) => <ProductCard key={p.id} p={p} view="list" />)}
                    </div>
                )}

                {!state.loading && products.length === 0 && !state.error && (
                    <div className="text-center py-10 bg-white rounded-2xl shadow border border-gray-100 mt-4">
                        <p className="text-gray-500">Không có sản phẩm trong danh mục này.</p>
                    </div>
                )}

                {!state.loading && pagination.last_page > 1 && (
                    <div className="mt-8 flex justify-center">
                        <nav className="flex items-center gap-2 bg-white rounded-2xl shadow border border-gray-100 p-2">
                            <button
                                disabled={uiPage <= 1}
                                onClick={() => setUiPage((p) => Math.max(1, p - 1))}
                                className={`flex items-center gap-2 px-4 py-2 rounded-lg transition-colors ${uiPage <= 1
                                    ? 'cursor-not-allowed text-gray-400 bg-gray-50'
                                    : 'text-gray-700 hover:bg-blue-50 hover:text-blue-600'
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
                                            ? 'bg-gradient-to-r from-blue-600 to-purple-600 text-white shadow scale-110'
                                            : 'text-gray-700 hover:bg-gray-100 hover:text-blue-600'
                                            }`}
                                    >
                                        {n}
                                    </button>
                                ))}
                            </div>

                            <button
                                disabled={uiPage >= pagination.last_page}
                                onClick={() => setUiPage((p) => Math.min(pagination.last_page, p + 1))}
                                className={`flex items-center gap-2 px-4 py-2 rounded-lg transition-colors ${uiPage >= pagination.last_page
                                    ? 'cursor-not-allowed text-gray-400 bg-gray-50'
                                    : 'text-gray-700 hover:bg-blue-50 hover:text-blue-600'
                                    }`}
                            >
                                <span className="hidden sm:inline">Sau</span>
                                <i className="fa-solid fa-angle-right" />
                            </button>
                        </nav>
                    </div>
                )}
            </div>
        </main>
    );
}
