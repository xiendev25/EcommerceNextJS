'use client'
import React, { useEffect, useState } from 'react'
import { useParams, useRouter } from "next/navigation";
import Link from "next/link";

const API_BASE = process.env.NEXT_PUBLIC_API_BASE_URL;

const Page = () => {
    const { id } = useParams()
    const router = useRouter()

    const [user, setUser] = useState(null);
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
                const adminData = await res.json();
                setUser(adminData);
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


    const [menuData, setMenuData] = useState(null)
    const [state, setState] = useState({ loading: true, error: null })

    useEffect(() => {
        if (!id || authLoading) return;

        if (isNaN(Number(id))) {
            alert("Trường ID không hợp lệ!")
            router.push("/admin/menu")
            return
        }

        const fetchMenu = async () => {
            setState({ loading: true, error: null });
            try {
                const res = await fetch(`${API_BASE}/menu/${id}`)
                if (res.status === 404) {
                    setState({ loading: false, error: "Không tìm thấy menu!" });
                    return;
                }
                if (!res.ok) throw new Error(`Menu HTTP ${res.status}`)
                const json = await res.json()
                setMenuData(json)
                setState({ loading: false, error: null })
            } catch (e) {
                setState({ loading: false, error: e.message || 'Fetch error' })
            }
        };
        fetchMenu();

    }, [id, router, authLoading]);

    if (authLoading) return <p className="p-8 text-center animate-pulse">Đang xác thực quyền truy cập...</p>;

    if (state.loading) return <p className="p-8 text-center animate-pulse">Đang tải dữ liệu...</p>;
    if (state.error) return <p className="p-8 text-center text-red-500">Lỗi: {state.error}</p>;
    if (!menuData) return null

    return (

        <div className="bg-white  shadow-xl rounded-2xl border border-gray-200">
            <div className="p-6 md:p-8 border-b border-gray-200 ">
                <h6 className="text-xl text-gray-800  font-bold">Chi tiết Menu</h6>
                <p className="text-sm text-gray-500  mt-1">Thông tin chi tiết của {menuData.name}</p>
            </div>

            <div className="p-6 md:p-8">
                <dl className="grid grid-cols-1 sm:grid-cols-2 gap-x-6 gap-y-6">
                    <div className="sm:col-span-1">
                        <dt className="text-sm font-medium text-gray-500 ">ID</dt>
                        <dd className="mt-1 text-base font-semibold text-gray-900">#{menuData.id}</dd>
                    </div>
                    <div className="sm:col-span-1">
                        <dt className="text-sm font-medium text-gray-500 ">Tiêu đề</dt>
                        <dd className="mt-1 text-base font-semibold text-gray-900">{menuData.name}</dd>
                    </div>
                    <div className="sm:col-span-2">
                        <dt className="text-sm font-medium text-gray-500 ">Liên kết</dt>
                        <dd className="mt-1 text-base font-semibold text-indigo-600 ">
                            <Link href={`${menuData.link || '#'}`} target="_blank"
                                className="hover:underline">{menuData.link || 'N/A'}</Link>
                        </dd>
                    </div>
                    <div className="sm:col-span-1">
                        <dt className="text-sm font-medium text-gray-500">Menu cha</dt>
                        <dd className="mt-1 text-base font-semibold text-gray-900">
                            {menuData.parent_id === 0 ? "Là menu gốc" : (menuData.parent?.name || 'Không xác định')}
                        </dd>
                    </div>
                    <div className="sm:col-span-1">
                        <dt className="text-sm font-medium text-gray-500">Vị trí</dt>
                        <dd className="mt-1 text-base font-semibold text-gray-900 capitalize">
                            {menuData.type}
                        </dd>
                    </div>
                    <div className="sm:col-span-1">
                        <dt className="text-sm font-medium text-gray-500">Thứ tự</dt>
                        <dd className="mt-1 text-base font-semibold text-gray-900">
                            {menuData.sort_order ?? 'N/A'}
                        </dd>
                    </div>
                    <div className="sm:col-span-1">
                        <dt className="text-sm font-medium text-gray-500">Trạng thái</dt>
                        <dd className="mt-1">
                            <span
                                className={`px-2 py-1 font-semibold text-xs rounded-full ${menuData.status === 1 ? 'bg-green-100 text-green-800' : 'bg-gray-100 text-gray-800'}`}>
                                {menuData.status === 1 ? "Kích hoạt" : "Ẩn"}
                            </span>
                        </dd>
                    </div>
                </dl>

                <div className="flex justify-end gap-x-4 mt-8 border-t border-gray-200 pt-6">
                    <Link href={"/admin/menu"}
                        className="px-4 py-2 bg-gray-200 hover:bg-gray-300 text-gray-800 text-sm font-medium rounded-lg">Quay
                        lại</Link>
                    <Link href={"/admin/menu/edit/" + menuData.id}
                        className="inline-flex items-center px-4 py-2 bg-yellow-500 hover:bg-yellow-600 text-white text-sm font-medium rounded-lg shadow-md">
                        <i className="fas fa-edit mr-2"></i> Sửa
                    </Link>
                </div>
            </div>
        </div>

    )
}

export default Page
