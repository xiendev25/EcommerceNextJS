"use client"
import React, { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import Image from 'next/image';

const API_BASE = process.env.NEXT_PUBLIC_API_BASE_URL;

const NavBar = () => {
    const router = useRouter();

    const [user, setUser] = useState(null);
    const [authLoading, setAuthLoading] = useState(true);
    useEffect(() => {
        const fetchUser = async () => {
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
        fetchUser();
    }, [router]);

    const [isDropdownOpen, setDropdownOpen] = useState(false);

    function handleLogout() {
        if (confirm('Bạn có chắc chắn muốn đăng xuất?') == true) {
            localStorage.removeItem('token');
            alert('Đăng xuất thành công!');
            router.push('/admin/login');
        };
    }

    if (authLoading) {
        return (
            <header className="flex justify-between items-center bg-white dark:bg-slate-800 border-b border-gray-200 dark:border-slate-700 p-4 sticky top-0 z-30 shadow-sm animate-pulse">
                <div className="h-6 w-6 bg-gray-200 dark:bg-slate-700 rounded md:hidden"></div>
                <div className="flex-grow"></div>
                <div className="flex items-center space-x-4">
                    <div className="h-10 w-24 bg-gray-200 dark:bg-slate-700 rounded-full"></div>
                </div>
            </header>
        );
    }


    return (
        <header
            className="flex justify-between items-center bg-white dark:bg-slate-800 border-b border-gray-200 dark:border-slate-700 p-4 sticky top-0 z-30 shadow-sm">
            <button id="sidebar-toggle" className="md:hidden text-gray-600 dark:text-gray-300 focus:outline-none">
                <i className="fas fa-bars fa-lg"></i>
            </button>

            <div className="flex-grow"></div>

            <div className="flex items-center space-x-4">
                <div className="relative"
                    onMouseEnter={() => setDropdownOpen(true)}
                    onMouseLeave={() => setDropdownOpen(false)}>

                    <button id="user-menu-button"
                        className="flex items-center space-x-2 text-gray-600 dark:text-gray-300 focus:outline-none border border-gray-300 dark:border-slate-600 px-3 py-2 rounded-full hover:bg-gray-50 dark:hover:bg-slate-700 transition-colors">
                        {user?.avatar ? (
                            <Image src={user.avatar} alt="Avatar" width={24} height={24} className="w-6 h-6 rounded-full object-cover" unoptimized />
                        ) : (
                            <i className="fas fa-user-circle text-xl"></i>
                        )}
                        <span className="hidden sm:inline font-semibold">{user?.name || 'Admin'}</span>
                        <i className={`fas fa-chevron-down text-xs transition-transform duration-300 ${isDropdownOpen ? 'rotate-180' : ''}`}></i>
                    </button>

                    <div id="user-menu"
                        className={`absolute right-0 mt-2 w-48 bg-white dark:bg-slate-700 rounded-lg shadow-xl py-1 z-50 border border-gray-200 dark:border-slate-600 transition-all duration-300 ease-in-out transform origin-top-right
                                ${isDropdownOpen ? 'opacity-100 scale-100' : 'opacity-0 scale-95 pointer-events-none'}`}>
                        <Link href={`/admin/user/show/${user?.id}`}
                            className="block px-4 py-2 text-sm text-gray-700 dark:text-slate-200 hover:bg-indigo-50 dark:hover:bg-slate-600">
                            <i className="fas fa-user-circle w-5 mr-2"></i> Hồ sơ
                        </Link>
                        <Link href="/"
                            className="block px-4 py-2 text-sm text-gray-700 dark:text-slate-200 hover:bg-indigo-50 dark:hover:bg-slate-600">
                            <i className="fas fa-home w-5 mr-2"></i> Trang chủ
                        </Link>
                        <div className="border-t border-gray-200 dark:border-slate-600 my-1"></div>
                        <button onClick={handleLogout}
                            className="w-full text-left block px-4 py-2 text-sm text-red-600 dark:text-red-400 hover:bg-red-50 dark:hover:bg-slate-600">
                            <i className="fas fa-sign-out-alt w-5 mr-2"></i> Đăng xuất
                        </button>
                    </div>
                </div>
            </div>
        </header>
    )
}

export default NavBar;
