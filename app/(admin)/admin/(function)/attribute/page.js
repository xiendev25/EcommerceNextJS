'use client'

import React, { useEffect, useState } from 'react'
import Link from 'next/link'
import { useRouter } from 'next/navigation'

const API_BASE = process.env.NEXT_PUBLIC_API_BASE_URL

export default function Page() {
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

    const [page, setPage] = useState(1);
    const [attributeRes, setAttributeRes] = useState(null);
    const [pagedAttributes, setPagedAttributes] = useState([]);
    const [state, setState] = useState({ loading: true, error: null });

    const fetchData = async (pageToFetch) => {
        if (authLoading) return;

        setState({ loading: true, error: null });
        try {
            const res = await fetch(`${API_BASE}/getAdminAttribute?page=${pageToFetch || 1}`, { cache: 'no-store' });
            if (!res.ok) throw new Error(`Attribute HTTP ${res.status}`);

            const json = await res.json();
            setAttributeRes(json ?? null);
            setPagedAttributes(Array.isArray(json.data) ? json.data : []);
        } catch (e) {
            setState({ loading: false, error: e.message || 'Fetch error' });
        } finally {
            setState({ loading: false });
        }
    };

    useEffect(() => {
        fetchData(page);
    }, [page, authLoading]);


    const handleDelete = async (id) => {
        if (!user) {
            alert('Không thể xác định người dùng. Vui lòng đăng nhập lại.');
            router.push('/admin/login');
            return;
        }

        if (!confirm('Bạn có chắc chắn muốn xóa thuộc tính này? Thao tác này có thể ảnh hưởng đến các sản phẩm đang sử dụng nó.')) return;

        try {
            const res = await fetch(`${API_BASE}/attribute/${id}`, { method: 'DELETE' });
            if (!res.ok) {
                const errorData = await res.json().catch(() => ({}));
                throw new Error(errorData.message || 'Xóa thất bại');
            }
            alert('Xóa thuộc tính thành công!');
            if (pagedAttributes.length === 1 && page > 1) {
                setPage(page - 1);
            } else {
                fetchData(page);
            }
        } catch (err) {
            alert(err.message);
            console.error(err);
        }
    }

    if (authLoading) {
        return <div className="p-8 text-center animate-pulse">Đang xác thực quyền truy cập...</div>;
    }

    if (state.loading) return <div className="p-8 text-center animate-pulse">Đang tải...</div>;

    return (
        <div className="flex flex-col min-w-0 mb-6 break-words bg-white border-0 shadow-xl rounded-2xl">
            <div className="p-6 pb-4 mb-0 border-b border-gray-200 rounded-t-2xl">
                <div className="flex flex-wrap justify-between items-center mb-4 gap-4">
                    <div>
                        <h6 className="text-gray-800 text-xl font-bold">Quản lý Thuộc tính Sản phẩm</h6>
                        <nav aria-label="breadcrumb" className="text-sm font-medium text-gray-500">
                            <ol className="flex items-center space-x-1">
                                <li><Link href="/admin" className="hover:underline">Trang chủ</Link></li>
                                <li><span className="mx-1">/</span></li>
                                <li>Thuộc tính</li>
                            </ol>
                        </nav>
                    </div>
                    <div>
                        <Link href="/admin/attribute/create" className="inline-flex items-center px-4 py-2 bg-indigo-600 hover:bg-indigo-700 text-white text-sm font-medium rounded-lg shadow-md">
                            <i className="fas fa-plus mr-2"></i> Thêm mới
                        </Link>
                    </div>
                </div>
            </div>

            <div className="flex-auto p-4">
                {state.error && <p className="p-4 mb-4 text-center text-red-500 bg-red-50 border border-red-200 rounded-lg">Lỗi tải dữ liệu: {state.error}</p>}
                <div className="overflow-x-auto">
                    <table className="w-full text-sm align-top text-slate-600">
                        <thead className="align-bottom">
                            <tr className="text-xs font-semibold tracking-wide text-left text-gray-500 uppercase border-b border-gray-200">
                                <th className="px-6 py-3 w-[10%]">ID</th>
                                <th className="px-6 py-3 w-[80%]">Tên thuộc tính</th>
                                <th className="px-6 py-3 w-[10%] text-center">Chức năng</th>
                            </tr>
                        </thead>
                        <tbody className="divide-y divide-gray-100">
                            {pagedAttributes.map((attribute) => (
                                <tr className="hover:bg-gray-50" key={attribute.id}>
                                    <td className="px-6 py-4 font-bold text-gray-900">{attribute.id}</td>
                                    <td className="px-6 py-4 font-semibold text-gray-800">{attribute.name}</td>
                                    <td className="px-6 py-4 flex gap-2 justify-center">
                                        <Link href={`/admin/attribute/edit/${attribute.id}`} className="p-2 rounded-full hover:bg-gray-200" title="Sửa">
                                            <i className="far fa-edit text-yellow-500" />
                                        </Link>
                                        <button onClick={() => handleDelete(attribute.id)} className="p-2 rounded-full hover:bg-gray-200" title="Xóa">
                                            <i className="far fa-trash-alt text-red-500" />
                                        </button>
                                    </td>
                                </tr>
                            ))}
                            {attributeRes?.total === 0 && (
                                <tr><td colSpan={3} className="p-8 text-center text-gray-500">Chưa có thuộc tính nào.</td></tr>
                            )}
                        </tbody>
                    </table>
                </div>

                {attributeRes && attributeRes.total > attributeRes.per_page && (
                    <div className="mt-4 flex items-center justify-between flex-wrap gap-3">
                        <p className="text-sm text-gray-600">Hiển thị {attributeRes.from} – {attributeRes.to} / {attributeRes.total} mục</p>
                        <div className="flex items-center gap-2">
                            <button onClick={() => setPage(page - 1)} disabled={!attributeRes.prev_page_url} className="px-3 py-1 border rounded disabled:opacity-50">← Trước</button>
                            <button onClick={() => setPage(page + 1)} disabled={!attributeRes.next_page_url} className="px-3 py-1 border rounded disabled:opacity-50">Sau →</button>
                        </div>
                    </div>
                )}
            </div>
        </div>
    )
}
