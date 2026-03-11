"use client"
import React, { useState } from 'react';
import Link from 'next/link';
import { usePathname } from 'next/navigation';

const NavLink = ({ href, iconClass, label }) => {
    const pathname = usePathname();
    const isActive = pathname.startsWith(href);

    return (
        <Link href={href}
            className={`flex items-center py-2.5 px-4 rounded-lg transition duration-200 
                ${isActive
                    ? 'bg-indigo-50 text-indigo-600 font-bold'
                    : 'font-semibold hover:bg-indigo-50'
                }`}
        >
            <i className={`${iconClass} fa-lg mr-3 w-5 text-center`}></i> {label}
        </Link>
    );
};

// Component con cho các mục trong dropdown
const SubNavLink = ({ href, label }) => {
    const pathname = usePathname();
    const isActive = pathname.startsWith(href);

    return (
        <li>
            <Link href={href}
                className={`block py-2 px-4 rounded-md text-sm transition duration-200 
                    ${isActive
                        ? 'font-bold text-indigo-600'
                        : 'hover:bg-slate-100'
                    }`}
            >
                {label}
            </Link>
        </li>
    );
};


export default function SlideBar() {
    const pathname = usePathname();

    // Danh sách các link trong dropdown "Sản phẩm & Nội dung"
    const productContentLinks = [
        { href: '/admin/product', label: 'Sản phẩm' },
        { href: '/admin/category', label: 'Danh mục' },
        { href: '/admin/attribute', label: 'Thuộc tính' },
        { href: '/admin/product_sale', label: 'Khuyến mãi' },
        { href: '/admin/product_store', label: 'Kho hàng' },
        { href: '/admin/post', label: 'Bài viết' },
        { href: '/admin/topic', label: 'Chủ đề bài viết' },
        { href: '/admin/banner', label: 'Banner' },
    ];

    // Danh sách các link trong dropdown "Hệ thống"
    const systemLinks = [
        { href: '/admin/order', label: 'Đơn hàng' },
        { href: '/admin/contact', label: 'Liên hệ' },
        { href: '/admin/user', label: 'Người dùng' },
        { href: '/admin/menu', label: 'Menu' },
        { href: '/admin/social', label: 'Liên kết MXH' },
        { href: '/admin/social_icon', label: 'Icon MXH' },
    ];

    // Kiểm tra xem có link nào trong dropdown đang active không
    const isProductContentActive = productContentLinks.some(link => pathname.startsWith(link.href));
    const isSystemActive = systemLinks.some(link => pathname.startsWith(link.href));

    return (
        <>
            <div id="sidebar"
                className="sidebar bg-white text-slate-700 w-64 space-y-4 py-4 px-3 absolute inset-y-0 left-0 transform -translate-x-full md:relative md:translate-x-0 transition duration-200 ease-in-out shadow-lg z-50">
                <div className="flex items-center justify-between px-3 mb-6">
                    <Link href="/admin/dashboard" className="text-indigo-600 text-xl font-bold flex items-center">
                        <i className="fas fa-code fa-lg mr-2"></i> Admin Panel
                    </Link>
                </div>

                <nav className="space-y-1">
                    <NavLink href="/admin/dashboard" iconClass="fas fa-home" label="Trang chủ" />

                    {/* Dropdown Sản phẩm & Nội dung */}
                    <DropdownMenu
                        title="Sản phẩm & Nội dung"
                        iconClass="fas fa-boxes"
                        links={productContentLinks}
                        isActive={isProductContentActive}
                    />

                    {/* Dropdown Hệ thống */}
                    <DropdownMenu
                        title="Hệ thống"
                        iconClass="fas fa-desktop"
                        links={systemLinks}
                        isActive={isSystemActive}
                    />

                    <hr className="my-4" />

                    {/* Link Cài đặt đứng riêng */}
                    <NavLink href="/admin/setting" iconClass="fas fa-cog" label="Cài đặt" />
                </nav>
            </div>
            <div id="sidebar-overlay" className="fixed inset-0 bg-black/50 hidden md:hidden z-40"></div>
        </>
    )
}

// Component Dropdown để tái sử dụng
const DropdownMenu = ({ title, iconClass, links, isActive }) => {
    const [isOpen, setOpen] = useState(isActive);

    // Mở dropdown nếu nó đang active, đóng lại nếu không
    React.useEffect(() => {
        setOpen(isActive);
    }, [isActive]);

    return (
        <div
            onMouseEnter={() => setOpen(true)}
            onMouseLeave={() => !isActive && setOpen(false)}
        >
            <button type="button"
                className={`flex items-center justify-between w-full py-2.5 px-4 rounded-lg transition duration-200 
                    ${isActive
                        ? 'bg-indigo-50 text-indigo-600 font-bold'
                        : 'font-semibold hover:bg-indigo-50'
                    }`}
            >
                <span className="flex items-center">
                    <i className={`${iconClass} fa-lg mr-3 w-5 text-center`}></i> {title}
                </span>
                <i className={`fas fa-chevron-down text-xs transition-transform duration-300 ${isOpen ? 'rotate-180' : ''}`}></i>
            </button>
            <ul className={`submenu pl-8 mt-1 space-y-1 transition-all duration-300 ease-in-out overflow-hidden ${isOpen ? 'max-h-[500px] opacity-100' : 'max-h-0 opacity-0'}`}>
                {links.map(link => (
                    <SubNavLink key={link.href} href={link.href} label={link.label} />
                ))}
            </ul>
        </div>
    );
};