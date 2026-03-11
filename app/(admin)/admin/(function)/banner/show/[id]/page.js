'use client'
import React, { useEffect, useState } from 'react'
import { useParams, useRouter } from "next/navigation";
import Link from "next/link";
import Image from "next/image";

const API_BASE = process.env.NEXT_PUBLIC_API_BASE_URL;

const Page = () => {
    const { id } = useParams();
    const router = useRouter();

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

    const [bannerData, setBannerData] = useState(null);
    const [state, setState] = useState({ loading: true, error: null });

    useEffect(() => {
        if (!id || isNaN(Number(id)) || authLoading) return;

        const fetchBanner = async () => {
            setState({ loading: true, error: null });
            try {
                const res = await fetch(`${API_BASE}/banner/${id}`);
                if (res.status === 404) {
                    setState({ loading: false, error: "Không tìm thấy banner!" });
                    return;
                }
                if (!res.ok) throw new Error(`Banner HTTP ${res.status}`);
                const json = await res.json();
                setBannerData(json);
                setState({ loading: false, error: null });
            } catch (e) {
                setState({ loading: false, error: e.message || 'Fetch error' });
            }
        };
        fetchBanner();
    }, [id, router, authLoading]);

    if (authLoading) {
        return <p className="p-8 text-center animate-pulse">Đang xác thực quyền truy cập...</p>;
    }

    if (state.loading) return <p className="p-8 text-center animate-pulse">Đang tải dữ liệu...</p>;
    if (state.error) return <p className="p-8 text-center text-red-500">Lỗi: {state.error}</p>;
    if (!bannerData) return null;

    return (
        <div className="bg-white shadow-xl rounded-2xl border border-gray-200">
            <div className="p-6 md:p-8 border-b border-gray-200">
                <h6 className="text-xl text-gray-800 font-bold">Chi tiết Banner</h6>
                <p className="text-sm text-gray-500 mt-1">Thông tin chi tiết của "{bannerData.name}"</p>
            </div>

            <div className="p-6 md:p-8">
                <dl className="grid grid-cols-1 sm:grid-cols-2 gap-x-6 gap-y-8">
                    <div className="sm:col-span-1">
                        <dt className="text-sm font-medium text-gray-500">ID</dt>
                        <dd className="mt-1 text-base font-semibold text-gray-900">#{bannerData.id}</dd>
                    </div>

                    <div className="sm:col-span-1">
                        <dt className="text-sm font-medium text-gray-500">Tên Banner</dt>
                        <dd className="mt-1 text-base font-semibold text-gray-900">{bannerData.name}</dd>
                    </div>

                    <div className="sm:col-span-2">
                        <dt className="text-sm font-medium text-gray-500 mb-2">Hình ảnh</dt>
                        <dd className="mt-1">
                            <Image
                                src={bannerData.image || '/placeholder.jpg'}
                                alt={`Ảnh của ${bannerData.name}`}
                                width={400}
                                height={200}
                                className="rounded-lg border border-gray-200 object-contain"
                                unoptimized
                            />
                        </dd>
                    </div>

                    <div className="sm:col-span-2">
                        <dt className="text-sm font-medium text-gray-500">Liên kết</dt>
                        <dd className="mt-1 text-base font-semibold text-blue-600 hover:underline">
                            <Link href={bannerData.link || '#'} target="_blank">{bannerData.link || 'Không có'}</Link>
                        </dd>
                    </div>

                    <div className="sm:col-span-1">
                        <dt className="text-sm font-medium text-gray-500">Vị trí</dt>
                        <dd className="mt-1 text-base font-semibold text-gray-900 capitalize">{bannerData.position}</dd>
                    </div>

                    <div className="sm:col-span-1">
                        <dt className="text-sm font-medium text-gray-500">Thứ tự</dt>
                        <dd className="mt-1 text-base font-semibold text-gray-900">{bannerData.sort_order}</dd>
                    </div>

                    <div className="sm:col-span-2">
                        <dt className="text-sm font-medium text-gray-500">Mô tả</dt>
                        <dd className="mt-1 text-base text-gray-900">{bannerData.description || 'Không có mô tả'}</dd>
                    </div>

                    <div className="sm:col-span-1">
                        <dt className="text-sm font-medium text-gray-500">Trạng thái</dt>
                        <dd className="mt-1">
                            <span
                                className={`px-3 py-1 font-semibold text-xs rounded-full ${bannerData.status === 1 ? 'bg-green-100 text-green-800' : 'bg-gray-100 text-gray-800'}`}>
                                {bannerData.status === 1 ? "Hoạt động" : "Tạm ẩn"}
                            </span>
                        </dd>
                    </div>


                </dl>

                <div className="flex justify-end gap-x-4 mt-8 border-t border-gray-200 pt-6">
                    <Link href={"/admin/banner"}
                        className="px-4 py-2 bg-gray-200 hover:bg-gray-300 text-gray-800 text-sm font-medium rounded-lg">
                        Quay lại
                    </Link>
                    <Link href={"/admin/banner/edit/" + bannerData.id}
                        className="px-4 py-2 bg-yellow-500 hover:bg-yellow-600 text-white text-sm font-medium rounded-lg shadow-md">
                        <i className="fas fa-edit mr-2"></i> Sửa
                    </Link>
                </div>
            </div>
        </div>
    );
};

export default Page;
