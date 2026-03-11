'use client'
import React, { useEffect, useState } from 'react'
import { useParams, useRouter } from "next/navigation";
import Link from "next/link";

const API_BASE = process.env.NEXT_PUBLIC_API_BASE_URL;

const Page = () => {
    const { id } = useParams()
    const router = useRouter()

    const [user, setUser] = useState(null); // Admin user state
    const [authLoading, setAuthLoading] = useState(true); // Auth loading state

    useEffect(() => {
        const verifyAdmin = async () => {
            setAuthLoading(true);
            const token = localStorage.getItem('token');
            if (!token) {
                router.replace('/admin/login');
                return;
            }
            try {
                const res = await fetch(`${API_BASE}/verifyAdmin`, { headers: { Authorization: token }, cache: 'no-store' });
                if (!res.ok) {
                    localStorage.removeItem('token');
                    localStorage.removeItem('user');
                    router.replace('/admin/login');
                    return;
                }
                setUser(await res.json());
            } catch (e) {
                console.error("Lỗi xác thực:", e);
                localStorage.removeItem('token');
                localStorage.removeItem('user');
                router.replace('/admin/login');
            } finally {
                setAuthLoading(false);
            }
        };
        verifyAdmin();
    }, [router]);

    const [topicData, setTopicData] = useState(null)
    const [state, setState] = useState({ loading: true, error: null })

    useEffect(() => {
        if (!id || authLoading) return // Wait for ID and auth check

        if (isNaN(Number(id))) {
            alert("Trường ID không hợp lệ!")
            router.push("/admin/topic")
            return
        }

        const fetchData = async () => {
            setState({ loading: true, error: null }); // Start loading
            try {
                const res = await fetch(`${API_BASE}/topic/${id}`)
                if (res.status === 404) {
                    alert("Không tìm thấy topic!")
                    router.push("/admin/topic")
                    return; // Stop execution
                }
                if (!res.ok) throw new Error(`Topic HTTP ${res.status}`)
                const json = await res.json()
                setTopicData(json)
                // setState({ loading: false, error: null }) // Moved to finally
            } catch (e) {
                // Removed AbortError check
                setState({ loading: false, error: e.message || 'Fetch error' })
            } finally {
                setState(s => ({ ...s, loading: false })); // Always set loading false
            }
        };
        fetchData(); // Call fetch data function

    }, [id, router, authLoading]) // Add authLoading dependency

    if (authLoading) return <p className="p-8 text-center animate-pulse">Đang xác thực quyền truy cập...</p>;

    if (state.loading) return <p className="p-8 text-center animate-pulse">Đang tải dữ liệu...</p>;
    if (state.error) return <p className="p-8 text-center text-red-500">Lỗi: {state.error}</p>;
    if (!topicData) return null

    return (

        <div className="bg-white  shadow-xl rounded-2xl border border-gray-200">
            <div className="p-6 md:p-8 border-b border-gray-200 ">
                <h6 className="text-xl text-gray-800  font-bold">Chi tiết Topic</h6>
                <p className="text-sm text-gray-500  mt-1">Thông tin chi tiết của "{topicData.name}"</p> {/* Added quotes */}
            </div>

            <div className="p-6 md:p-8">
                <dl className="grid grid-cols-1 sm:grid-cols-2 gap-x-6 gap-y-6">
                    <div className="sm:col-span-1">
                        <dt className="text-sm font-medium text-gray-500 ">ID</dt>
                        <dd className="mt-1 text-base font-semibold text-gray-900">#{topicData.id}</dd>
                    </div>
                    <div className="sm:col-span-1">
                        <dt className="text-sm font-medium text-gray-500 ">Tiêu đề</dt>
                        <dd className="mt-1 text-base font-semibold text-gray-900">{topicData.name}</dd>
                    </div>
                    <div className="sm:col-span-2">
                        <dt className="text-sm font-medium text-gray-500 ">Slug</dt>
                        {/* Improved styling for slug */}
                        <dd className="mt-1 text-base font-mono text-gray-700 bg-gray-100 px-2 py-1 rounded inline-block">{topicData.slug}</dd>
                    </div>
                    <div className="sm:col-span-2">
                        <dt className="text-sm font-medium text-gray-500 ">Mô tả</dt>
                        {/* Handle potentially long descriptions */}
                        <dd className="mt-1 text-base text-gray-900 whitespace-pre-wrap">{topicData.description || 'Không có mô tả'}</dd>
                    </div>
                    {/* Added Sort Order */}
                    <div className="sm:col-span-1">
                        <dt className="text-sm font-medium text-gray-500">Thứ tự</dt>
                        <dd className="mt-1 text-base font-semibold text-gray-900">{topicData.sort_order || 'Mặc định'}</dd>
                    </div>
                    <div className="sm:col-span-1">
                        <dt className="text-sm font-medium text-gray-500">Trạng thái</dt>
                        <dd className="mt-1">
                            <span
                                className={`px-3 py-1 font-semibold text-xs rounded-full ${topicData.status === 1 ? 'bg-green-100 text-green-800' : 'bg-yellow-100 text-yellow-800'}`}> {/* Adjusted color for inactive */}
                                {topicData.status === 1 ? "Hoạt động" : "Tạm ẩn"} {/* Adjusted text */}
                            </span>
                        </dd>
                    </div>
                </dl>

                <div className="flex justify-end gap-x-4 mt-8 border-t border-gray-200 pt-6">
                    <Link href={"/admin/topic"}
                        className="px-4 py-2 bg-gray-200 hover:bg-gray-300 text-gray-800 text-sm font-medium rounded-lg">Quay
                        lại</Link>
                    <Link href={"/admin/topic/edit/" + topicData.id}
                        className="inline-flex items-center px-4 py-2 bg-yellow-500 hover:bg-yellow-600 text-white text-sm font-medium rounded-lg shadow-md"> {/* Added inline-flex */}
                        <i className="fas fa-edit mr-2"></i> Sửa
                    </Link>
                </div>
            </div>
        </div>

    )
}

export default Page
