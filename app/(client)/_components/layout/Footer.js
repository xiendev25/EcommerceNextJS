"use client";

import { useEffect, useMemo, useState } from "react";
import Link from "next/link";
import Image from "next/image";

const API_BASE = process.env.NEXT_PUBLIC_API_BASE_URL;

const Footer = () => {
    const [dataFooter, setDataFooter] = useState(null);
    const [socialList, setSocialList] = useState([]);
    const [menuFooter, setMenuFooter] = useState([]);
    const [state, setState] = useState({ loading: true, error: null });

    useEffect(() => {
        const controller = new AbortController();

        const load = async () => {
            try {
                const [menuRes, socialRes, settingRes] = await Promise.all([
                    fetch(`${API_BASE}/menu`, { signal: controller.signal }),
                    fetch(`${API_BASE}/social`, { signal: controller.signal }),
                    fetch(`${API_BASE}/setting`, { signal: controller.signal }),
                ]);

                if (!menuRes.ok) throw new Error(`Menu HTTP ${menuRes.status}`);
                if (!socialRes.ok) throw new Error(`Social HTTP ${socialRes.status}`);
                if (!settingRes.ok) throw new Error(`Setting HTTP ${settingRes.status}`);

                const [menuJson, socialJson, settingJson] = await Promise.all([
                    menuRes.json(),
                    socialRes.json(),
                    settingRes.json(),
                ]);

                setMenuFooter(Array.isArray(menuJson) ? menuJson : []);
                setSocialList(Array.isArray(socialJson) ? socialJson : []);
                setDataFooter(settingJson || null);
                setState({ loading: false, error: null });
            } catch (e) {
                if (e.name !== "AbortError") {
                    setState({ loading: false, error: e.message || "Fetch error" });
                }
            }
        };

        load();
        return () => controller.abort();
    }, []);

    const year = useMemo(() => new Date().getFullYear(), []);

    if (state.loading) {
        return (
            <footer className="border-t border-gray-200 bg-white">
                <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8 py-16">
                    <div className="grid grid-cols-1 gap-10 sm:grid-cols-2 lg:grid-cols-4">
                        {[...Array(4)].map((_, i) => (
                            <div key={i} className="space-y-3">
                                <div className="h-6 w-40 animate-pulse rounded bg-gray-200" />
                                {[...Array(5)].map((__, j) => (
                                    <div key={j} className="h-4 w-full animate-pulse rounded bg-gray-100" />
                                ))}
                            </div>
                        ))}
                    </div>
                </div>
            </footer>
        );
    }

    if (state.error) {
        return (
            <footer className="border-t border-gray-200 bg-white">
                <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8 py-10">
                    <p className="text-sm text-red-600">Không tải được footer: {state.error}</p>
                </div>
            </footer>
        );
    }

    return (
        <footer className="bg-white border-t border-gray-200 pt-10">
            <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8 pb-12">
                <div className="grid grid-cols-1 gap-12 sm:grid-cols-2 lg:grid-cols-4">
                    <div className="col-span-2">
                        <Link href="/" className="flex items-center gap-3">
                            <Image
                                src={dataFooter?.logo}
                                alt={`${dataFooter?.site_name} logo`}
                                width={165}
                                height={36}
                                className="h-9 w-auto"
                                unoptimized
                            />
                            {dataFooter?.slogan && <span className="hidden sm:inline text-sm text-gray-600">{dataFooter?.slogan}</span>}
                        </Link>

                        <h2 className="text-lg font-semibold text-gray-900">
                            Về {dataFooter?.site_name}
                        </h2>

                        <p className="mt-3 text-sm text-gray-600">
                            Cửa hàng chính hãng, giá tốt mỗi ngày. Giao nhanh 2h nội thành, hỗ trợ đổi trả dễ dàng.
                        </p>

                        <ul className="mt-5 space-y-3 text-sm text-gray-700">
                            {dataFooter?.address && (
                                <li className="flex items-start gap-3 align-middle">
                                    <i className="fa-solid fa-location-dot text-xl" />
                                    <span>{dataFooter.address}</span>
                                </li>
                            )}

                            {(dataFooter?.phone || dataFooter?.hotline) && (
                                <li className="flex items-center gap-3">
                                    <i className="fa-solid fa-phone text-xl" />
                                    {dataFooter?.phone && (
                                        <a href={`tel:${dataFooter.phone}`} className="hover:text-gray-900">
                                            {dataFooter.phone}
                                        </a>
                                    )}
                                    {dataFooter?.phone && dataFooter?.hotline && (
                                        <span className="text-gray-400">/</span>
                                    )}
                                    {dataFooter?.hotline && (
                                        <a href={`tel:${dataFooter.hotline}`} className="hover:text-gray-900">
                                            {dataFooter.hotline}
                                        </a>
                                    )}
                                </li>
                            )}

                            {dataFooter?.email && (
                                <li className="flex items-center gap-3">
                                    <i className="fa-solid fa-envelope text-xl" />
                                    <a href={`mailto:${dataFooter.email}`} className="hover:text-gray-900">
                                        {dataFooter.email}
                                    </a>
                                </li>
                            )}
                        </ul>

                        <div className="mt-5">
                            <p className="text-sm font-medium text-gray-900">Kết nối với chúng tôi</p>
                            <ul className="mt-3 flex items-center gap-3">
                                {socialList.map((item) => (
                                    <li key={item.id}>
                                        <a
                                            href={`${item?.social_icon?.link}${item?.username || ""}`}
                                            aria-label={item?.social_icon?.name || "social"}
                                            target="_blank"
                                            rel="noopener noreferrer"
                                            className="inline-flex h-9 w-9 items-center justify-center rounded-full border border-gray-200 hover:border-gray-300 hover:bg-gray-50"
                                        >
                                            <i className={item?.social_icon?.icon || "fa-brands fa-globe"} />
                                        </a>
                                    </li>
                                ))}
                            </ul>
                        </div>
                    </div>

                    <div>
                        <h2 className="text-lg font-semibold text-gray-900">Danh mục liên kết</h2>
                        <ul className="mt-5 space-y-3">
                            {menuFooter
                                .filter((item) => item.type === "footer1")
                                .map((item) => (
                                    <li key={item.id}>
                                        <Link className="text-sm text-gray-600 hover:text-gray-900" href={item.link}>
                                            {item.name}
                                        </Link>
                                    </li>
                                ))}
                        </ul>
                    </div>

                    <div>
                        <h2 className="text-lg font-semibold text-gray-900">Hỗ Trợ</h2>
                        <ul className="mt-5 space-y-3">
                            {menuFooter
                                .filter((item) => item.type === "footer2")
                                .map((item) => (
                                    <li key={item.id}>
                                        <Link className="text-sm text-gray-600 hover:text-gray-900" href={item.link}>
                                            {item.name}
                                        </Link>
                                    </li>
                                ))}
                        </ul>
                    </div>
                </div>
            </div>

            <div className="border-t border-gray-200 bg-gray-50">
                <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8 py-6">
                    <div className="flex flex-col items-start justify-between gap-3 text-sm text-gray-500 md:flex-row md:items-center">
                        <p>
                            © {year}. All rights reserved by{" "}
                            <span className="font-medium text-gray-700">{dataFooter?.site_name || "Website"}</span>.
                        </p>

                        <div className="flex flex-wrap items-center gap-x-4 gap-y-2">
                            {["Chính hãng 100%", "Đổi trả 15 ngày", "Giao nhanh 2h", "Hỗ trợ 24/7"].map((txt) => (
                                <div
                                    key={txt}
                                    className="inline-flex items-center gap-2 rounded-full border border-gray-200 bg-white px-3 py-1 text-xs text-gray-700"
                                >
                                    <span>✔</span>
                                    <span>{txt}</span>
                                </div>
                            ))}
                        </div>
                    </div>
                </div>
            </div>
        </footer>
    );
};

export default Footer;
