"use client";

import React, { useEffect, useMemo, useState } from "react";
// đổi path này theo project của bạn
import PostCard from "../_components/post/PostCard";

const API_BASE = process.env.NEXT_PUBLIC_API_BASE_URL;

// tiện: gom topic từ mảng posts (dùng khi BE chưa có /topics)
function collectTopics(items = []) {
    const map = new Map();
    for (const p of items) {
        if (p?.topic?.id) {
            map.set(p.topic.id, { id: p.topic.id, name: p.topic.name, slug: p.topic.slug });
        }
    }
    return Array.from(map.values());
}

export default function PostPage() {
    // data
    const [posts, setPosts] = useState([]);
    const [pagination, setPagination] = useState({
        current_page: 1,
        last_page: 1,
        total: 0,
        per_page: 10,
    });

    // topics (chủ đề)
    const [topics, setTopics] = useState([]);
    const [selectedTopicId, setSelectedTopicId] = useState(null);

    // UI
    const [viewMode, setViewMode] = useState("grid"); // grid | list
    const [uiPage, setUiPage] = useState(1);
    const [loadState, setLoadState] = useState({ loading: true, error: null });

    // tạo list trang hiển thị (1 ... N) vừa phải
    const pagesToShow = useMemo(() => {
        const total = pagination.last_page || 1;
        const curr = uiPage;
        const windowSize = 5;
        let start = Math.max(1, curr - 2);
        let end = Math.min(total, start + windowSize - 1);
        start = Math.max(1, end - windowSize + 1);
        return Array.from({ length: end - start + 1 }, (_, i) => start + i);
    }, [uiPage, pagination.last_page]);

    // fetch posts mỗi khi đổi trang hoặc đổi chủ đề
    useEffect(() => {
        let alive = true;
        async function load() {
            setLoadState({ loading: true, error: null });
            try {
                const url = new URL(`${API_BASE}/getAllPost`);
                url.searchParams.set("page", String(uiPage));
                if (selectedTopicId) url.searchParams.set("topic_id", String(selectedTopicId)); // nếu BE hỗ trợ

                const res = await fetch(url.toString(), { cache: "no-store" });
                if (!res.ok) throw new Error(`HTTP ${res.status}`);
                const j = await res.json();

                if (!alive) return;

                // nếu BE CHƯA lọc theo topic_id, mình fallback client-side
                const rawItems = Array.isArray(j?.data) ? j.data : [];
                const clientFiltered = selectedTopicId
                    ? rawItems.filter(p => p?.topic?.id === selectedTopicId)
                    : rawItems;

                setPosts(clientFiltered);
                setPagination({
                    current_page: j.current_page ?? uiPage,
                    last_page: j.last_page ?? 1,
                    total: j.total ?? clientFiltered.length,
                    per_page: j.per_page ?? 10,
                });

                // gom topics từ data vừa lấy (đủ dùng cho filter đơn giản)
                const mergedTopics = collectTopics(rawItems);
                setTopics(prev => {
                    const mergedMap = new Map(prev.map(t => [t.id, t]));
                    for (const t of mergedTopics) mergedMap.set(t.id, t);
                    return Array.from(mergedMap.values()).sort((a, b) => a.name.localeCompare(b.name, "vi"));
                });

                setLoadState({ loading: false, error: null });
            } catch (e) {
                if (!alive) return;
                setLoadState({ loading: false, error: e.message || "Fetch error" });
            }
        }
        load();
        return () => {
            alive = false;
        };
    }, [uiPage, selectedTopicId]);

    return (
        <main className="min-h-screen bg-gradient-to-br from-gray-50 to-white">
            <div className="mx-auto max-w-7xl px-4 sm:px-6 py-10 pt-40">
                {/* Thanh điều khiển trên cùng */}
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

                        {/* (tuỳ thích) hiển thị tổng số bài */}
                        <div className="text-sm text-gray-600">
                            Trang {pagination.current_page} / {pagination.last_page} &middot; Tổng {pagination.total}
                        </div>

                        {/* mobile toggle */}
                        <div className="flex sm:hidden items-center gap-1">
                            <button
                                className={`px-3 py-2 rounded ${viewMode === "grid" ? "bg-gray-900 text-white" : "bg-gray-100 text-gray-700"}`}
                                onClick={() => setViewMode("grid")}
                                title="Lưới"
                            >
                                <i className="fa-solid fa-table-cells-large" />
                            </button>
                            <button
                                className={`px-3 py-2 rounded ${viewMode === "list" ? "bg-gray-900 text-white" : "bg-gray-100 text-gray-700"}`}
                                onClick={() => setViewMode("list")}
                                title="Danh sách"
                            >
                                <i className="fa-solid fa-list" />
                            </button>
                        </div>
                    </div>
                </div>

                <div className="flex flex-col gap-6 lg:flex-row">
                    {/* Sidebar: chỉ lọc theo CHỦ ĐỀ */}
                    <aside className="w-full lg:w-1/4">
                        <div className="bg-white rounded-2xl shadow border border-gray-100">
                            {/* Header */}
                            <div className="flex items-center justify-between p-4 border-b border-gray-100">
                                <div className="flex items-center gap-2">
                                    <div className="w-8 h-8 bg-gradient-to-r from-blue-600 to-purple-600 text-white rounded-lg flex items-center justify-center">
                                        <i className="fa-solid fa-filter" />
                                    </div>
                                    <h2 className="font-semibold text-gray-900">Chủ đề</h2>
                                </div>
                                <button
                                    className="text-sm text-blue-600 hover:underline"
                                    onClick={() => {
                                        setSelectedTopicId(null);
                                        setUiPage(1);
                                    }}
                                >
                                    Tất cả
                                </button>
                            </div>

                            <div className="p-4">
                                <div>
                                    {topics.length === 0 && (
                                        <div className="text-sm text-gray-500">Chưa có chủ đề.</div>
                                    )}

                                    {topics.map((t) => {
                                        const isChecked = String(selectedTopicId) === String(t.id);
                                        return (
                                            <label
                                                key={t.id}
                                                className={`flex items-center justify-between p-2 rounded cursor-pointer ${isChecked ? "bg-blue-50 border border-blue-200" : "hover:bg-gray-50"
                                                    }`}
                                            >
                                                <div className="flex items-center gap-3">
                                                    <input
                                                        type="radio"
                                                        name="topic"
                                                        value={t.id}
                                                        checked={isChecked}
                                                        onChange={() => {
                                                            setSelectedTopicId(isChecked ? null : t.id);
                                                            setUiPage(1);
                                                        }}
                                                        className="accent-blue-600"
                                                    />
                                                    <span className="text-sm text-gray-800">{t.name}</span>
                                                </div>
                                                <i className="fa-solid fa-chevron-right text-gray-300" />
                                            </label>
                                        );
                                    })}
                                </div>
                            </div>

                        </div>
                    </aside>

                    {/* Content */}
                    <section className="w-full lg:w-3/4">
                        {/* Error */}
                        {loadState.error && (
                            <div className="bg-red-50 border border-red-200 text-red-700 rounded-xl p-4 mb-4">
                                <i className="fa-solid fa-circle-exclamation mr-2" />
                                {loadState.error}
                            </div>
                        )}

                        {/* Grid/List */}
                        {viewMode === "grid" ? (
                            <div className="grid gap-6 grid-cols-1 sm:grid-cols-2 lg:grid-cols-3">
                                {loadState.loading && posts.length === 0
                                    ? Array.from({ length: 9 }).map((_, i) => (
                                        <div
                                            key={i}
                                            className="bg-white rounded-2xl shadow border border-gray-100 overflow-hidden animate-pulse"
                                        >
                                            <div className="aspect-square bg-gradient-to-br from-gray-200 to-gray-300" />
                                            <div className="p-5 space-y-3">
                                                <div className="h-4 bg-gray-200 rounded" />
                                                <div className="h-6 bg-gray-200 rounded w-3/4" />
                                                <div className="h-4 bg-gray-200 rounded w-1/2" />
                                            </div>
                                        </div>
                                    ))
                                    : posts.map((p) => <PostCard key={p.id} post={p} view="grid" />)}
                            </div>
                        ) : (
                            <div className="space-y-4">
                                {loadState.loading && posts.length === 0
                                    ? Array.from({ length: 6 }).map((_, i) => (
                                        <div
                                            key={i}
                                            className="bg-white rounded-2xl shadow border border-gray-100 overflow-hidden animate-pulse h-40"
                                        />
                                    ))
                                    : posts.map((p) => <PostCard key={p.id} post={p} view="list" />)}
                            </div>
                        )}

                        {/* Pagination */}
                        {pagination.last_page > 1 && (
                            <div className="mt-8 flex justify-center">
                                <nav className="flex items-center gap-2 bg-white rounded-2xl shadow border border-gray-100 p-2">
                                    <button
                                        disabled={uiPage <= 1}
                                        onClick={() => setUiPage((p) => Math.max(1, p - 1))}
                                        className={`flex items-center gap-2 px-4 py-2 rounded-lg ${uiPage <= 1
                                            ? "cursor-not-allowed text-gray-400 bg-gray-50"
                                            : "text-gray-700 hover:bg-blue-50 hover:text-blue-600"
                                            }`}
                                    >
                                        <i className="fa-solid fa-angle-left" />{" "}
                                        <span className="hidden sm:inline">Trước</span>
                                    </button>

                                    <div className="flex items-center gap-1">
                                        {pagesToShow.map((n) => (
                                            <button
                                                key={n}
                                                onClick={() => setUiPage(n)}
                                                className={`w-10 h-10 rounded-lg font-medium ${uiPage === n
                                                    ? "bg-gradient-to-r from-blue-600 to-purple-600 text-white shadow"
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
                                        className={`flex items-center gap-2 px-4 py-2 rounded-lg ${uiPage >= pagination.last_page
                                            ? "cursor-not-allowed text-gray-400 bg-gray-50"
                                            : "text-gray-700 hover:bg-blue-50 hover:text-blue-600"
                                            }`}
                                    >
                                        <span className="hidden sm:inline">Sau</span>{" "}
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
