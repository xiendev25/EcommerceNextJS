'use client'
import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';

const API_BASE = process.env.NEXT_PUBLIC_API_BASE_URL;

const Page = () => {
    const [user, setUser] = useState(null);
    const router = useRouter();
    const [authLoading, setAuthLoading] = useState(true);

    useEffect(() => {
        const verifyAdmin = async () => {
            setAuthLoading(true);
            const token = localStorage.getItem('token');
            if (!token) {
                router.replace('/admin/login');
                return;
            }
            try {
                const res = await fetch(`${API_BASE}/verifyAdmin`, {
                    headers: { Authorization: token },
                    cache: 'no-store'
                });
                if (!res.ok) {
                    localStorage.removeItem('token');
                    router.replace('/admin/login');
                    return;
                }
                const userData = await res.json();
                setUser(userData);
            } catch (e) {
                console.error("Lỗi xác thực:", e);
                localStorage.removeItem('token');
                router.replace('/admin/login');
            } finally {
                setAuthLoading(false);
            }
        };
        verifyAdmin();
    }, [router]);

    if (authLoading) return <div className="p-8 text-center animate-pulse">Đang xác thực quyền truy cập...</div>;


    return (
        <>
            <div className="space-y-6">
                <div>
                    <h1 className="text-2xl font-bold text-gray-900 dark:text-white">Chào mừng trở lại, {user?.name || 'Admin'}</h1>
                    <p className="text-gray-600 dark:text-slate-400 mt-1">Đây là tổng quan hệ thống của bạn hôm nay.</p>
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-4 gap-6">
                    <div
                        className="p-6 bg-white dark:bg-slate-800 rounded-2xl shadow-lg border border-gray-200 dark:border-slate-700 flex items-center gap-6">
                        <div className="h-12 w-12 rounded-lg flex items-center justify-center bg-indigo-100 dark:bg-indigo-500/20">
                            <i className="fa-solid fa-users text-2xl text-indigo-600 dark:text-indigo-400"></i>
                        </div>
                        <div>
                            <p className="text-sm text-gray-500 dark:text-slate-400">Test 1</p>
                            <p className="text-3xl font-bold text-gray-900 dark:text-white">1234</p>
                        </div>
                    </div>
                    <div
                        className="p-6 bg-white dark:bg-slate-800 rounded-2xl shadow-lg border border-gray-200 dark:border-slate-700 flex items-center gap-6">
                        <div className="h-12 w-12 rounded-lg flex items-center justify-center bg-sky-100 dark:bg-sky-500/20">
                            <i className="fa-solid fa-bolt text-2xl text-sky-600 dark:text-sky-400"></i>
                        </div>
                        <div>
                            <p className="text-sm text-gray-500 dark:text-slate-400">Test 2</p>
                            <p className="text-3xl font-bold text-gray-900 dark:text-white">2345
                            </p>
                        </div>
                    </div>
                    <div
                        className="p-6 bg-white dark:bg-slate-800 rounded-2xl shadow-lg border border-gray-200 dark:border-slate-700 flex items-center gap-6">
                        <div
                            className="h-12 w-12 rounded-lg flex items-center justify-center bg-emerald-100 dark:bg-emerald-500/20">
                            <i className="fa-solid fa-clipboard-check text-2xl text-emerald-600 dark:text-emerald-400"></i>
                        </div>
                        <div>
                            <p className="text-sm text-gray-500 dark:text-slate-400">Test 3</p>
                            <p className="text-3xl font-bold text-gray-900 dark:text-white">3456
                            </p>
                        </div>
                    </div>
                    <div
                        className="p-6 bg-white dark:bg-slate-800 rounded-2xl shadow-lg border border-gray-200 dark:border-slate-700 flex items-center gap-6">
                        <div className="h-12 w-12 rounded-lg flex items-center justify-center bg-rose-100 dark:bg-rose-500/20">
                            <i className="fa-solid fa-link text-2xl text-rose-600 dark:text-rose-400"></i>
                        </div>
                        <div>
                            <p className="text-sm text-gray-500 dark:text-slate-400">Test 4</p>
                            <p className="text-3xl font-bold text-gray-900 dark:text-white">4567
                            </p>
                        </div>
                    </div>
                </div>

                <div className="grid grid-cols-1 xl:grid-cols-3 gap-6">
                    <div
                        className="xl:col-span-1 bg-white dark:bg-slate-800 shadow-xl rounded-2xl border border-gray-200 dark:border-slate-700 p-6">
                        <h3 className="text-lg font-semibold text-gray-800 dark:text-white mb-4">Table 1</h3>
                        <ul className="space-y-4">
                            <li className="flex items-start gap-4">
                                <div className="flex-shrink-0 pt-1">
                                    <i className="fa-solid fa-calendar-star text-sky-500"></i>
                                </div>
                                <div>
                                    <p className="font-semibold text-gray-900 dark:text-white">Name
                                    </p>
                                    <p className="text-xs text-gray-500 dark:text-slate-400">
                                        time</p>
                                </div>
                            </li>
                            <li className="text-center text-sm text-gray-500 dark:text-slate-400 py-8">
                                <p>Chưa có.</p>
                            </li>
                        </ul>
                    </div>
                    <div
                        className="xl:col-span-1 bg-white dark:bg-slate-800 shadow-xl rounded-2xl border border-gray-200 dark:border-slate-700 p-6">
                        <h3 className="text-lg font-semibold text-gray-800 dark:text-white mb-4">Table 1</h3>
                        <ul className="space-y-4">
                            <li className="flex items-start gap-4">
                                <div className="flex-shrink-0 pt-1">
                                    <i className="fa-solid fa-calendar-star text-sky-500"></i>
                                </div>
                                <div>
                                    <p className="font-semibold text-gray-900 dark:text-white">Name
                                    </p>
                                    <p className="text-xs text-gray-500 dark:text-slate-400">
                                        time</p>
                                </div>
                            </li>
                            <li className="text-center text-sm text-gray-500 dark:text-slate-400 py-8">
                                <p>Chưa có.</p>
                            </li>
                        </ul>
                    </div>
                    <div
                        className="xl:col-span-1 bg-white dark:bg-slate-800 shadow-xl rounded-2xl border border-gray-200 dark:border-slate-700 p-6">
                        <h3 className="text-lg font-semibold text-gray-800 dark:text-white mb-4">Table 1</h3>
                        <ul className="space-y-4">
                            <li className="flex items-start gap-4">
                                <div className="flex-shrink-0 pt-1">
                                    <i className="fa-solid fa-calendar-star text-sky-500"></i>
                                </div>
                                <div>
                                    <p className="font-semibold text-gray-900 dark:text-white">Name
                                    </p>
                                    <p className="text-xs text-gray-500 dark:text-slate-400">
                                        time</p>
                                </div>
                            </li>
                            <li className="text-center text-sm text-gray-500 dark:text-slate-400 py-8">
                                <p>Chưa có.</p>
                            </li>
                        </ul>
                    </div>
                </div>


            </div>

        </>

    )
}

export default Page
