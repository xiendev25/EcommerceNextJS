"use client"

import { useEffect, useMemo, useRef, useState } from "react";
import Link from "next/link";
import Image from "next/image";
import { useRouter } from "next/navigation";

const API_BASE = process.env.NEXT_PUBLIC_API_BASE_URL;

function buildTree(items) {
    if (!Array.isArray(items)) return [];
    const byId = new Map();
    items.forEach((i) => byId.set(i.id, { ...i, children: [] }));
    const roots = [];
    for (const node of byId.values()) {
        if (node.parent_id && byId.has(node.parent_id)) {
            byId.get(node.parent_id).children.push(node);
        } else {
            roots.push(node);
        }
    }
    const sortRec = (arr) => {
        arr.sort((a, b) => (a.sort_order ?? 0) - (b.sort_order ?? 0));
        arr.forEach((n) => sortRec(n.children));
    };
    sortRec(roots);
    return roots;
}

export default function Header() {
    const [mobileOpen, setMobileOpen] = useState(false);
    const [userOpen, setUserOpen] = useState(false);
    const [cartOpen, setCartOpen] = useState(false);
    const [categoryOpen, setCategoryOpen] = useState(false);
    const [hoveredParentId, setHoveredParentId] = useState(null);
    const [searchQuery, setSearchQuery] = useState("");
    const [isLoggedIn, setIsLoggedIn] = useState(false);
    const [cartItems, setCartItems] = useState([]);

    const [setting, setSetting] = useState(null);
    const [category, setCategory] = useState([]);
    const [menu, setMenu] = useState([]);
    const [state, setState] = useState({ loading: true, error: null });

    const userCloseTimer = useRef(null);
    const cartCloseTimer = useRef(null);

    const router = useRouter();

    useEffect(() => {
        const token = localStorage.getItem("token");
        if (token) {
            setIsLoggedIn(true);
        }
        setIsLoggedIn(!!localStorage.getItem("token"));
    }, []);

    useEffect(() => {
        const loadCart = () => {
            try {
                const raw = localStorage.getItem('cart');
                if (!raw) {
                    setCartItems([]);
                    return;
                }
                const data = JSON.parse(raw);
                const normalized = Array.isArray(data)
                    ? data.map(i => ({ ...i, qty: Math.max(1, Number(i.qty || 1)) }))
                    : [];
                setCartItems(normalized);
            } catch (e) {
                console.warn('Parse cart failed', e);
                setCartItems([]);
            }
        };

        loadCart();
        const handleStorage = (e) => {
            if (e.key === 'cart') loadCart();
        };
        window.addEventListener('storage', handleStorage);
        const handleCartUpdate = () => loadCart();
        window.addEventListener('cartUpdated', handleCartUpdate);

        return () => {
            window.removeEventListener('storage', handleStorage);
            window.removeEventListener('cartUpdated', handleCartUpdate);
        };
    }, []);

    useEffect(() => {
        (async () => {
            try {
                const [settingRes, categoryRes, menuRes] = await Promise.all([
                    fetch(`${API_BASE}/setting`),
                    fetch(`${API_BASE}/category`),
                    fetch(`${API_BASE}/menu`),
                ]);

                if (!settingRes.ok) throw new Error(`Setting HTTP ${settingRes.status}`);
                if (!categoryRes.ok) throw new Error(`category HTTP ${categoryRes.status}`);
                if (!menuRes.ok) throw new Error(`Menu HTTP ${menuRes.status}`);

                const [settingJson, categoryJson, menuJson] = await Promise.all([
                    settingRes.json(),
                    categoryRes.json(),
                    menuRes.json(),
                ]);

                setSetting(settingJson || null);
                setCategory(Array.isArray(categoryJson) ? categoryJson : []);
                const headerMenu = Array.isArray(menuJson)
                    ? menuJson.filter((m) => (m.type || "").toLowerCase() === "navbar")
                    : [];
                setMenu(headerMenu);
                setState({ loading: false, error: null });
            } catch (e) {
                if (e.name !== "AbortError") {
                    setState({ loading: false, error: e.message || "Fetch error" });
                }
            }
        })();
    }, []);

    useEffect(() => {
        return () => {
            if (userCloseTimer.current) clearTimeout(userCloseTimer.current);
            if (cartCloseTimer.current) clearTimeout(cartCloseTimer.current);
        };
    }, []);

    const categoryTree = useMemo(() => buildTree(category), [category]);
    const menuTree = useMemo(() => buildTree(menu), [menu]);

    const hoveredParent = useMemo(() => {
        if (!hoveredParentId) return null;
        const stack = [...categoryTree];
        while (stack.length) {
            const n = stack.pop();
            if (n.id === hoveredParentId) return n;
            if (n.children?.length) stack.push(...n.children);
        }
        return null;
    }, [hoveredParentId, categoryTree]);

    const year = useMemo(() => new Date().getFullYear(), []);

    function handleLogout() {
        if (confirm("Bạn có chắc chắn muốn đăng xuất?")) {
            localStorage.removeItem("token");
            setIsLoggedIn(false);
            alert("Đăng xuất thành công!");
            router.push("/");
        }
    }

    const handleSearch = (e) => {
        e.preventDefault();
        if (searchQuery.trim()) {
            router.push(`/tim-kiem?q=${encodeURIComponent(searchQuery)}`);
        }
    };

    const openUser = () => {
        if (userCloseTimer.current) clearTimeout(userCloseTimer.current);
        setUserOpen(true);
    };
    const scheduleCloseUser = () => {
        if (userCloseTimer.current) clearTimeout(userCloseTimer.current);
        userCloseTimer.current = setTimeout(() => setUserOpen(false), 500);
    };

    const openCart = () => {
        if (cartCloseTimer.current) clearTimeout(cartCloseTimer.current);
        setCartOpen(true);
    };
    const scheduleCloseCart = () => {
        if (cartCloseTimer.current) clearTimeout(cartCloseTimer.current);
        cartCloseTimer.current = setTimeout(() => setCartOpen(false), 500);
    };

    if (state.loading) {
        return (
            <header className="fixed inset-x-0 top-0 z-50 w-full bg-white/95 backdrop-blur-md shadow-sm">
                <div className="mx-auto max-w-7xl px-4 sm:px-6 xl:px-8">
                    <div className="flex items-center justify-between py-4">
                        <div className="flex items-center gap-3">
                            <div className="h-10 w-40 rounded-lg bg-gradient-to-r from-gray-200 to-gray-100 animate-pulse" />
                            <div className="h-4 w-44 rounded bg-gray-100 animate-pulse" />
                        </div>
                        <div className="hidden md:block w-full max-w-xl mx-8">
                            <div className="h-11 w-full rounded-xl bg-gray-100 border border-gray-200 animate-pulse" />
                        </div>
                        <div className="flex items-center gap-4">
                            <div className="h-9 w-9 rounded-full bg-gray-200 animate-pulse" />
                            <div className="h-9 w-9 rounded-full bg-gray-200 animate-pulse" />
                            <div className="h-9 w-9 rounded-full bg-gray-200 animate-pulse md:hidden" />
                        </div>
                    </div>
                </div>
            </header>
        );
    }

    if (state.error) {
        return (
            <header className="fixed inset-x-0 top-0 z-50 bg-white shadow-md">
                <div className="max-w-7xl mx-auto px-4 py-4">
                    <p className="text-sm text-red-600">Không tải được header: {String(state.error)}</p>
                </div>
            </header>
        );
    }

    return (
        <>
            <header className="fixed inset-x-0 top-0 z-50 bg-white/95 backdrop-blur-md shadow-sm transition-all">
                <div className="max-w-7xl mx-auto px-4 sm:px-6 xl:px-8">
                    <div className="flex items-center justify-between gap-4 py-4">
                        <Link href="/" className="flex items-center gap-3 group">
                            <div className="relative">
                                <Image
                                    src={setting?.logo}
                                    alt={`${setting?.site_name} logo`}
                                    width={165}
                                    height={40}
                                    className="h-10 w-auto transition-transform group-hover:scale-105"
                                    unoptimized
                                    priority
                                />
                            </div>
                            {setting?.slogan && (
                                <span className="hidden lg:inline text-sm text-gray-600 font-medium">
                                    {setting?.slogan}
                                </span>
                            )}
                        </Link>

                        <div className="hidden md:block w-full max-w-xl">
                            <form onSubmit={handleSearch}>
                                <div className="relative group">
                                    <i className="fa-solid fa-magnifying-glass absolute left-4 top-1/2 -translate-y-1/2 text-gray-400 text-[18px]" />
                                    <input
                                        type="search"
                                        value={searchQuery}
                                        onChange={(e) => setSearchQuery(e.target.value)}
                                        placeholder="Tìm kiếm sản phẩm, danh mục..."
                                        className="w-full h-11 rounded-xl bg-gray-50 border border-gray-200 pl-12 pr-4 text-sm transition-all focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent focus:bg-white"
                                    />
                                </div>
                            </form>
                        </div>

                        <div className="flex items-center gap-2">
                            {/* USER (hover to open, auto close after 3s) */}
                            <div
                                className="relative"
                                onMouseEnter={openUser}
                                onMouseLeave={scheduleCloseUser}
                            >
                                <button
                                    className="flex items-center gap-2 px-3 py-2 rounded-lg text-gray-700 hover:bg-gray-100 transition-all group"
                                    aria-haspopup="menu"
                                    aria-expanded={userOpen}
                                >
                                    <i className="fa-regular fa-user text-[18px] group-hover:scale-110 transition-transform" />
                                    <i
                                        className={`fa-solid fa-chevron-down text-[12px] transition-transform ${userOpen ? "rotate-180" : ""
                                            }`}
                                    />
                                </button>

                                <div
                                    className={`absolute right-0 z-10 top-full mt-2 w-56 rounded-xl border border-gray-200 bg-white shadow-xl transition-all ${userOpen
                                        ? "opacity-100 translate-y-0"
                                        : "opacity-0 -translate-y-2 pointer-events-none"
                                        }`}
                                    onMouseEnter={openUser}
                                    onMouseLeave={scheduleCloseUser}
                                >
                                    {isLoggedIn ? (
                                        <>
                                            <Link
                                                href="/tai-khoan"
                                                className="flex items-center gap-3 px-4 py-3 text-sm hover:bg-blue-50 rounded-t-xl transition-colors"
                                            >
                                                <i className="fa-regular fa-user text-[16px]" />
                                                <span>Tài khoản của tôi</span>
                                            </Link>
                                            <div className="border-t border-gray-100" />
                                            <button
                                                onClick={handleLogout}
                                                className="w-full flex items-center gap-3 px-4 py-3 text-sm text-red-600 hover:bg-red-50 rounded-b-xl transition-colors"
                                            >
                                                <i className="fa-solid fa-right-from-bracket text-[16px]" />
                                                <span>Đăng xuất</span>
                                            </button>
                                        </>
                                    ) : (
                                        <>
                                            <Link
                                                href="/dang-nhap"
                                                className="flex items-center gap-3 px-4 py-3 text-sm hover:bg-blue-50 rounded-t-xl transition-colors"
                                            >
                                                <i className="fa-solid fa-right-to-bracket text-[16px]" />
                                                <span>Đăng nhập</span>
                                            </Link>
                                            <Link
                                                href="/dang-ky"
                                                className="flex items-center gap-3 px-4 py-3 text-sm hover:bg-blue-50 rounded-b-xl transition-colors"
                                            >
                                                <i className="fa-regular fa-user text-[16px]" />
                                                <span>Đăng ký</span>
                                            </Link>
                                        </>
                                    )}
                                </div>
                            </div>

                            {/* CART (hover to open, auto close after 3s) */}
                            {isLoggedIn && (
                                <div
                                    className="relative"
                                    onMouseEnter={openCart}
                                    onMouseLeave={scheduleCloseCart}
                                >
                                    <button
                                        className="relative px-3 py-2 rounded-lg text-gray-700 hover:bg-gray-100 transition-all group"
                                        aria-haspopup="menu"
                                        aria-expanded={cartOpen}
                                    >
                                        <i className="fa-solid fa-cart-shopping text-[18px] group-hover:scale-110 transition-transform" />
                                        <span className="absolute -right-1 -top-1 flex h-5 w-5 items-center justify-center rounded-full bg-gradient-to-br from-blue-600 to-blue-700 text-[10px] font-semibold text-white shadow-lg">
                                            {cartItems.length}
                                        </span>
                                    </button>
                                    <div
                                        className={`absolute right-0 z-10 top-full mt-2 w-80 rounded-xl border border-gray-200 bg-white shadow-xl transition-all ${cartOpen
                                            ? "opacity-100 translate-y-0"
                                            : "opacity-0 -translate-y-2 pointer-events-none"
                                            }`}
                                        onMouseEnter={openCart}
                                        onMouseLeave={scheduleCloseCart}
                                    >
                                        {cartItems.length === 0 ? (
                                            <div className="px-4 py-8 text-center">
                                                <i className="fa-solid fa-cart-shopping text-gray-300 text-4xl mb-3" />
                                                <p className="text-sm text-gray-600 font-medium">Giỏ hàng trống</p>
                                                <p className="text-xs text-gray-400 mt-1">Thêm sản phẩm để bắt đầu mua sắm</p>
                                            </div>
                                        ) : (
                                            <>
                                                <div className="px-4 py-3 border-b border-gray-100">
                                                    <div className="flex items-center justify-between">
                                                        <h3 className="text-sm font-semibold text-gray-900">
                                                            Giỏ hàng của bạn
                                                        </h3>
                                                        <span className="text-xs text-gray-500">
                                                            {cartItems.length} sản phẩm
                                                        </span>
                                                    </div>
                                                </div>

                                                <div className="max-h-96 overflow-y-auto">
                                                    {cartItems.map((item, idx) => {
                                                        const formatVND = (n) =>
                                                            Number(n || 0).toLocaleString("vi-VN", { style: "currency", currency: "VND" });

                                                        return (
                                                            <div key={`${item.id}-${idx}`} className="px-4 py-3 border-b border-gray-50 hover:bg-gray-50 transition-colors">
                                                                <div className="flex gap-3">
                                                                    <div className="w-16 h-16 flex-shrink-0 rounded-lg overflow-hidden bg-gray-100 border border-gray-200">
                                                                        <img
                                                                            src={item.thumbnail}
                                                                            alt={item.name}
                                                                            className="w-full h-full object-cover"
                                                                        />
                                                                    </div>

                                                                    <div className="min-w-0 flex-1">
                                                                        <Link
                                                                            href={`/san-pham/${item.slug}`}
                                                                            className="block text-sm font-medium text-gray-900 line-clamp-2 hover:text-blue-600 transition-colors"
                                                                        >
                                                                            {item.name}
                                                                        </Link>

                                                                        {(item.note || (item.attributes && Object.keys(item.attributes).length > 0)) && (
                                                                            <p className="mt-1 text-xs text-gray-500 line-clamp-1">
                                                                                {item.note || Object.values(item.attributes || {}).join(", ")}
                                                                            </p>
                                                                        )}

                                                                        <div className="mt-2 flex items-center justify-between">
                                                                            <span className="text-sm font-semibold text-blue-600">
                                                                                {formatVND(item.price)}
                                                                            </span>
                                                                            <span className="text-xs text-gray-500 bg-gray-100 px-2 py-1 rounded-md">
                                                                                SL: {item.qty}
                                                                            </span>
                                                                        </div>
                                                                    </div>
                                                                </div>
                                                            </div>
                                                        );
                                                    })}
                                                </div>

                                                <div className="px-4 py-3 bg-gray-50 rounded-b-xl">
                                                    <Link
                                                        href="/gio-hang"
                                                        className="block text-center px-4 py-2.5 rounded-lg bg-blue-600 text-white text-sm font-semibold hover:bg-blue-700 transition-colors"
                                                    >
                                                        Xem giỏ hàng đầy đủ
                                                    </Link>
                                                </div>
                                            </>
                                        )}
                                    </div>
                                </div>
                            )}

                            {/* Mobile menu button */}
                            <button
                                className="md:hidden p-2 rounded-lg text-gray-700 hover:bg-gray-100 transition-all"
                                onClick={() => setMobileOpen(true)}
                            >
                                <i className="fa-solid fa-bars text-[20px]" />
                            </button>
                        </div>
                    </div>
                </div>

                {/* Category & menu row */}
                <div className="hidden md:block border-t border-gray-100">
                    <div className="max-w-7xl mx-auto px-4 sm:px-6 xl:px-8">
                        <div className="flex items-center justify-between">
                            <div
                                className="relative"
                                onMouseEnter={() => setCategoryOpen(true)}
                                onMouseLeave={() => {
                                    setCategoryOpen(false);
                                    setHoveredParentId(null);
                                }}
                            >
                                <button className="flex items-center gap-2 px-4 py-3 text-sm font-semibold text-gray-700 hover:text-blue-600 transition-colors group">
                                    <i className="fa-solid fa-list text-[14px]" />
                                    Danh mục sản phẩm
                                    <i
                                        className={`fa-solid fa-chevron-down text-[12px] transition-transform ${categoryOpen ? "rotate-180" : ""
                                            }`}
                                    />
                                </button>

                                <div
                                    className={`absolute left-0 z-20 top-full mt-0 w-[820px] rounded-b-2xl border border-gray-200 bg-white shadow-2xl transition-all ${categoryOpen
                                        ? "opacity-100 translate-y-0"
                                        : "opacity-0 -translate-y-2 pointer-events-none"
                                        }`}
                                >
                                    <div className="grid grid-cols-5 gap-0">
                                        <div className="col-span-2 bg-gray-50 rounded-bl-2xl p-4 max-h-[420px] overflow-auto">
                                            {categoryTree.map((parent) => (
                                                <button
                                                    key={parent.id}
                                                    type="button"
                                                    onMouseEnter={() => setHoveredParentId(parent.id)}
                                                    className={`flex w-full justify-between items-center rounded-lg px-4 py-3 text-sm font-medium transition-all ${hoveredParentId === parent.id
                                                        ? "bg-white shadow-sm text-blue-600"
                                                        : "text-gray-700 hover:bg-white hover:shadow-sm"
                                                        }`}
                                                >
                                                    <span>{parent.name}</span>
                                                    <i className="fa-solid fa-chevron-down -rotate-90 text-[11px]" />
                                                </button>
                                            ))}
                                        </div>

                                        <div className="col-span-3 p-6 max-h-[420px] overflow-auto">
                                            {!hoveredParent ? (
                                                <div className="flex h-full items-center justify-center text-sm text-gray-400">
                                                    <div className="text-center">
                                                        <i className="fa-solid fa-list text-gray-300 text-4xl mx-auto mb-2" />
                                                        <p>Di chuột để xem danh mục con</p>
                                                    </div>
                                                </div>
                                            ) : hoveredParent.children?.length ? (
                                                <div>
                                                    <div className="mb-4 pb-3 border-b border-gray-100">
                                                        <h3 className="text-base font-bold text-gray-900">
                                                            {hoveredParent.name}
                                                        </h3>
                                                        <p className="text-xs text-gray-500 mt-1">
                                                            {hoveredParent.children.length} danh mục
                                                        </p>
                                                    </div>
                                                    <div className="grid grid-cols-2 gap-2">
                                                        {hoveredParent.children.map((child) => (
                                                            <Link
                                                                key={child.id}
                                                                href={child.link || `/danh-muc/${child.slug}`}
                                                                className="block rounded-lg px-4 py-2.5 text-sm text-gray-700 hover:bg-blue-50 hover:text-blue-600 transition-colors"
                                                            >
                                                                {child.name}
                                                            </Link>
                                                        ))}
                                                    </div>
                                                </div>
                                            ) : (
                                                <div className="flex h-full items-center justify-center text-sm text-gray-400">
                                                    <div className="text-center">
                                                        <i className="fa-solid fa-list text-gray-300 text-4xl mx-auto mb-2" />
                                                        <p>Không có danh mục con</p>
                                                    </div>
                                                </div>
                                            )}
                                        </div>
                                    </div>
                                </div>
                            </div>

                            <nav className="flex items-center gap-1">
                                {menuTree.map((item) => (
                                    <div key={item.id} className="relative group">
                                        <Link
                                            href={item.link || "#"}
                                            className="px-4 py-3 text-sm font-medium text-gray-700 hover:text-blue-600 transition-colors inline-flex items-center gap-2"
                                        >
                                            {item.name}
                                            {item.children?.length > 0 && (
                                                <i className="fa-solid fa-chevron-down text-[12px]" />
                                            )}
                                        </Link>
                                        {item.children?.length > 0 && (
                                            <div className="invisible absolute left-0 top-full mt-0 w-56 rounded-b-xl border border-gray-200 bg-white shadow-xl opacity-0 transition-all group-hover:visible group-hover:opacity-100 group-hover:translate-y-0 -translate-y-2">
                                                <div className="py-2">
                                                    {item.children.map((child) => (
                                                        <Link
                                                            key={child.id}
                                                            href={child.link || "#"}
                                                            className="block px-4 py-2.5 text-sm text-gray-700 hover:bg-blue-50 hover:text-blue-600 transition-colors"
                                                        >
                                                            {child.name}
                                                        </Link>
                                                    ))}
                                                </div>
                                            </div>
                                        )}
                                    </div>
                                ))}
                            </nav>
                        </div>
                    </div>
                </div>
            </header>

            {/* Backdrop for mobile drawer */}
            <div
                className={`md:hidden fixed inset-0 z-40 bg-black/50 backdrop-blur-sm transition-opacity ${mobileOpen ? "opacity-100" : "opacity-0 pointer-events-none"
                    }`}
                onClick={() => setMobileOpen(false)}
            />

            {/* Mobile drawer */}
            <aside
                className={`md:hidden fixed inset-y-0 left-0 z-50 w-[85%] max-w-sm bg-white shadow-2xl transform transition-transform ${mobileOpen ? "translate-x-0" : "-translate-x-full"
                    }`}
            >
                <div className="flex items-center justify-between border-b border-gray-100 p-4 bg-gradient-to-r from-blue-50 to-indigo-50">
                    <Image src={setting?.logo} alt="Logo" width={120} height={32} className="h-8 w-auto" unoptimized />
                    <button
                        onClick={() => setMobileOpen(false)}
                        className="p-2 rounded-lg hover:bg-white/50 transition-colors"
                    >
                        <i className="fa-solid fa-xmark text-[18px]" />
                    </button>
                </div>

                <div className="p-4">
                    <form onSubmit={handleSearch}>
                        <div className="relative">
                            <i className="fa-solid fa-magnifying-glass absolute left-3 top-1/2 -translate-y-1/2 text-gray-400 text-[18px]" />
                            <input
                                type="search"
                                value={searchQuery}
                                onChange={(e) => setSearchQuery(e.target.value)}
                                placeholder="Tìm kiếm..."
                                className="w-full h-11 rounded-xl bg-gray-50 border border-gray-200 pl-11 pr-4 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
                            />
                        </div>
                    </form>
                </div>

                <div className="overflow-auto h-[calc(100vh-180px)]">
                    {/* === Mobile: Danh mục sản phẩm === */}
                    <div className="border-t border-gray-100">
                        <details open className="group">
                            <summary className="px-4 py-3 text-sm font-semibold flex justify-between items-center cursor-pointer hover:bg-gray-50 transition-colors">
                                <span className="flex items-center gap-2">
                                    <i className="fa-solid fa-list text-[14px]" />
                                    Danh mục sản phẩm
                                </span>
                                <i className="fa-solid fa-chevron-down text-[14px] group-open:rotate-180 transition-transform" />
                            </summary>

                            <div className="bg-gray-50">
                                {categoryTree.map((parent) => {
                                    const parentHref = parent.link || (parent.slug ? `/danh-muc/${parent.slug}` : "#");
                                    const hasChildren = Array.isArray(parent.children) && parent.children.length > 0;

                                    if (!hasChildren) {
                                        // ✅ Cha không có con -> là link
                                        return (
                                            <Link
                                                key={parent.id}
                                                href={parentHref}
                                                className="block px-3 py-2.5 mx-2 my-1 rounded-lg text-sm text-gray-700 hover:bg-white hover:text-blue-600 transition-colors"
                                                onClick={() => setMobileOpen(false)}
                                            >
                                                {parent.name}
                                            </Link>
                                        );
                                    }

                                    // ✅ Cha có con -> giữ <details> + liệt kê con
                                    return (
                                        <details key={parent.id} className="px-2 group/item">
                                            <summary className="px-3 py-2.5 text-sm cursor-pointer hover:bg-white rounded-lg transition-colors flex justify-between items-center">
                                                <span>{parent.name}</span>
                                                <i className="fa-solid fa-chevron-down text-[12px] group-open/item:rotate-180 transition-transform" />
                                            </summary>

                                            {/* (tuỳ chọn) Link “Xem tất cả” tới cha */}
                                            <Link
                                                href={parentHref}
                                                className="block pl-8 pr-3 py-2 text-sm font-medium text-gray-700 hover:bg-white hover:text-blue-600 rounded-lg transition-colors"
                                                onClick={() => setMobileOpen(false)}
                                            >
                                                Xem tất cả {parent.name}
                                            </Link>

                                            {parent.children.map((child) => {
                                                const childHref = child.link || (child.slug ? `/danh-muc/${child.slug}` : "#");
                                                return (
                                                    <Link
                                                        key={child.id}
                                                        href={childHref}
                                                        className="block pl-8 pr-3 py-2 text-sm text-gray-700 hover:bg-white hover:text-blue-600 rounded-lg transition-colors"
                                                        onClick={() => setMobileOpen(false)}
                                                    >
                                                        {child.name}
                                                    </Link>
                                                );
                                            })}
                                        </details>
                                    );
                                })}
                            </div>
                        </details>
                    </div>

                    {/* === Mobile: Menu === */}
                    <nav className="border-t border-gray-100 py-2">
                        {menuTree.map((item) => {
                            const itemHref = item.link || "#";
                            const hasChildren = Array.isArray(item.children) && item.children.length > 0;

                            if (!hasChildren) {
                                // ✅ Mục menu không có con -> link thẳng
                                return (
                                    <Link
                                        key={item.id}
                                        href={itemHref}
                                        className="block px-4 py-2.5 text-sm rounded-lg hover:bg-gray-50 hover:text-blue-600 transition-colors"
                                        onClick={() => setMobileOpen(false)}
                                    >
                                        {item.name}
                                    </Link>
                                );
                            }

                            // ✅ Có con -> <details> + các link con
                            return (
                                <details key={item.id} className="group/menu">
                                    <summary className="px-4 py-2.5 text-sm cursor-pointer hover:bg-gray-50 rounded-lg transition-colors flex justify-between items-center">
                                        <span>{item.name}</span>
                                        <i className="fa-solid fa-chevron-down text-[12px] group-open/menu:rotate-180 transition-transform" />
                                    </summary>

                                    {/* (tuỳ chọn) Link tới mục cha */}
                                    <Link
                                        href={itemHref}
                                        className="block pl-8 pr-4 py-2 text-sm font-medium rounded-lg hover:bg-gray-50 hover:text-blue-600 transition-colors"
                                        onClick={() => setMobileOpen(false)}
                                    >
                                        Mở {item.name}
                                    </Link>

                                    {item.children.map((child) => (
                                        <Link
                                            key={child.id}
                                            href={child.link || "#"}
                                            className="block pl-8 pr-4 py-2 text-sm text-gray-700 hover:bg-gray-50 hover:text-blue-600 rounded-lg transition-colors"
                                            onClick={() => setMobileOpen(false)}
                                        >
                                            {child.name}
                                        </Link>
                                    ))}
                                </details>
                            );
                        })}
                    </nav>

                </div>

                <div className="absolute bottom-0 inset-x-0 border-t border-gray-100 p-4 bg-gray-50">
                    <p className="text-xs text-center text-gray-500">
                        © {year} {setting?.site_name}. All rights reserved.
                    </p>
                </div>
            </aside>
        </>
    );
}