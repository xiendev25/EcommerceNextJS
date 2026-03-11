'use client'
import React, { useEffect, useState } from 'react'
import { useParams, useRouter } from "next/navigation";
import Link from "next/link";

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


    const { id } = useParams();

    const [originalContact, setOriginalContact] = useState(null);
    const [existingReply, setExistingReply] = useState(null);
    const [replyContent, setReplyContent] = useState('');

    const [state, setState] = useState({
        loading: true,
        submitting: false,
        error: null
    });

    const fetchContactData = async () => {
        if (!id || isNaN(Number(id))) {
            setState(s => ({ ...s, loading: false, error: "ID liên hệ không hợp lệ!" }));
            return;
        }

        setState(s => ({ ...s, loading: true, error: null }));
        try {
            const contactRes = await fetch(`${API_BASE}/contact/${id}`);
            if (contactRes.status === 404) throw new Error("Không tìm thấy liên hệ!");
            if (!contactRes.ok) throw new Error(`Contact HTTP ${contactRes.status}`);
            const contactJson = await contactRes.json();
            setOriginalContact(contactJson);

            const replyRes = await fetch(`${API_BASE}/getReply/${id}`);
            if (replyRes.ok) {
                const replyJson = await replyRes.json();
                setExistingReply(replyJson);
            } else {
                setExistingReply(null);
            }

        } catch (e) {
            setState(s => ({ ...s, error: e.message }));
        } finally {
            setState(s => ({ ...s, loading: false }));
        }
    };

    useEffect(() => {
        if (!authLoading) {
            fetchContactData();
        }
    }, [id, router, authLoading]);

    const handleReplySubmit = async (e) => {
        e.preventDefault();
        if (!user) {
            alert('Không thể xác định người dùng. Vui lòng đăng nhập lại.');
            router.push('/admin/login');
            return;
        }

        if (!replyContent.trim()) {
            alert('Vui lòng nhập nội dung trả lời.');
            return;
        }

        setState(s => ({ ...s, submitting: true, error: null }));
        try {
            const payload1 = {
                user_id: originalContact.user_id || 0,
                name: user.name,
                email: user.email,
                phone: user.phone || '',
                content: replyContent.trim(),
                reply_id: originalContact.id,
                created_by: user.id,
            };

            const res1 = await fetch(`${API_BASE}/replyContact`, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify(payload1),
            });

            if (!res1.ok) {
                const errorData = await res1.json().catch(() => ({}));
                throw new Error(errorData.message || 'Gửi trả lời thất bại');
            }

            const res2 = await fetch(`${API_BASE}/updateStatusContact/${originalContact.id}`, {
                method: 'PUT',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ updated_by: user.id })
            });

            if (!res2.ok) {
                const errorData = await res2.json().catch(() => ({}));
                console.error("Lỗi cập nhật trạng thái:", errorData.message || `HTTP ${res2.status}`);
            }

            alert('Gửi trả lời thành công!');
            setReplyContent('');
            fetchContactData();

        } catch (err) {
            setState(s => ({ ...s, error: err.message }));
            alert(`Lỗi: ${err.message}`);
            console.error(err);
        } finally {
            setState(s => ({ ...s, submitting: false }));
        }
    };

    if (authLoading) {
        return <p className="p-8 text-center animate-pulse">Đang xác thực quyền truy cập...</p>;
    }

    if (state.loading) return <p className="p-8 text-center animate-pulse">Đang tải dữ liệu...</p>;

    return (
        <div className="flex flex-col min-w-0 mb-6 break-words bg-white border-0 shadow-xl rounded-2xl">
            <div className="p-6 pb-4 mb-0 border-b border-gray-200 rounded-t-2xl">
                <h6 className="text-gray-800 text-xl font-bold">Chi tiết & Trả lời Liên hệ</h6>
                <nav aria-label="breadcrumb" className="text-sm font-medium text-gray-500">
                    <ol className="flex items-center space-x-1">
                        <li><Link href="/admin" className="hover:underline">Trang chủ</Link></li>
                        <li><span className="mx-1">/</span></li>
                        <li><Link href="/admin/contact" className="hover:underline">Hộp thư Liên hệ</Link></li>
                        <li><span className="mx-1">/</span></li>
                        <li>Chi tiết</li>
                    </ol>
                </nav>
            </div>

            <div className="p-6 md:p-8 space-y-8">
                {state.error && !originalContact && (
                    <p className="p-4 text-center text-red-500 bg-red-50 border border-red-200 rounded-lg">
                        Lỗi tải dữ liệu liên hệ: {state.error}
                    </p>
                )}

                {originalContact && (
                    <div className="p-6 bg-gray-50 border border-gray-200 rounded-lg">
                        <h3 className="text-lg font-semibold text-gray-800 mb-4">Tin nhắn từ khách hàng</h3>
                        <dl className="grid grid-cols-1 sm:grid-cols-2 gap-x-6 gap-y-4">
                            <div className="sm:col-span-1">
                                <dt className="text-sm font-medium text-gray-500">Người gửi</dt>
                                <dd className="mt-1 text-base text-gray-900">{originalContact.name}</dd>
                            </div>
                            <div className="sm:col-span-1">
                                <dt className="text-sm font-medium text-gray-500">Ngày gửi</dt>
                                <dd className="mt-1 text-base text-gray-900">{new Date(originalContact.created_at).toLocaleString('vi-VN')}</dd>
                            </div>
                            <div className="sm:col-span-1">
                                <dt className="text-sm font-medium text-gray-500">Email</dt>
                                <dd className="mt-1 text-base text-gray-900">{originalContact.email}</dd>
                            </div>
                            <div className="sm:col-span-1">
                                <dt className="text-sm font-medium text-gray-500">Số điện thoại</dt>
                                <dd className="mt-1 text-base text-gray-900">{originalContact.phone}</dd>
                            </div>
                            <div className="sm:col-span-2">
                                <dt className="text-sm font-medium text-gray-500">Nội dung</dt>
                                <dd className="mt-2 text-base text-gray-900 whitespace-pre-wrap">{originalContact.content}</dd>
                            </div>
                        </dl>
                    </div>
                )}

                <div className="p-6 bg-blue-50 border border-blue-200 rounded-lg">
                    {existingReply ? (
                        <div>
                            <h3 className="text-lg font-semibold text-blue-800 mb-4">Câu trả lời của bạn</h3>
                            <dl>
                                <dt className="text-sm font-medium text-gray-500">Ngày trả lời</dt>
                                <dd className="mt-1 text-base text-gray-900 mb-4">{new Date(existingReply.created_at).toLocaleString('vi-VN')}</dd>
                                <dt className="text-sm font-medium text-gray-500">Nội dung</dt>
                                <dd className="mt-2 text-base text-gray-900 whitespace-pre-wrap">{existingReply.content}</dd>
                            </dl>
                        </div>
                    ) : (
                        <form onSubmit={handleReplySubmit}>
                            <h3 className="text-lg font-semibold text-blue-800 mb-4">Soạn trả lời</h3>
                            {state.error && state.submitting && (
                                <p className="text-red-500 text-sm mb-3 text-center">Lỗi gửi trả lời: {state.error}</p>
                            )}
                            <div>
                                <label htmlFor="replyContent" className="block text-sm font-medium mb-2 text-gray-700">Nội dung trả lời</label>
                                <textarea
                                    id="replyContent"
                                    rows={6}
                                    value={replyContent}
                                    onChange={(e) => setReplyContent(e.target.value)}
                                    className="w-full p-4 rounded-lg bg-white border border-gray-300 focus:ring-2 focus:ring-indigo-500"
                                    placeholder="Nhập nội dung phản hồi tại đây..."
                                    disabled={!originalContact}
                                />
                            </div>
                            <div className="flex justify-end mt-4">
                                <button
                                    type="submit"
                                    disabled={state.submitting || !originalContact}
                                    className="px-5 py-2.5 bg-indigo-600 hover:bg-indigo-700 text-white font-medium rounded-lg disabled:opacity-60 disabled:cursor-not-allowed">
                                    {state.submitting ? 'Đang gửi...' : 'Gửi trả lời'}
                                </button>
                            </div>
                        </form>
                    )}
                </div>

                <div className="flex justify-end gap-x-4 border-t border-gray-200 pt-6">
                    <Link href={"/admin/contact"} className="px-4 py-2 bg-gray-200 hover:bg-gray-300 text-gray-800 text-sm font-medium rounded-lg">
                        Quay lại danh sách
                    </Link>
                </div>
            </div>
        </div>
    );
};

export default Page;
