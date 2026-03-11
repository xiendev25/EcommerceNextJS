'use client'
import React, { useEffect, useState } from 'react'
import { useParams, useRouter } from "next/navigation";
import Link from "next/link";
import Image from "next/image";

const API_BASE = process.env.NEXT_PUBLIC_API_BASE_URL;

// --- Helper Functions ---
const formatCurrency = (value) => {
    const number = parseFloat(value);
    if (isNaN(number)) return '0 ₫';
    return new Intl.NumberFormat('vi-VN', { style: 'currency', currency: 'VND' }).format(number);
};

const getOrderStatus = (status) => {
    switch (status) {
        case 0: return { text: 'Đã hủy', className: 'bg-red-100 text-red-800' };
        case 1: return { text: 'Chờ xử lý', className: 'bg-yellow-100 text-yellow-800' };
        case 2: return { text: 'Đang giao', className: 'bg-blue-100 text-blue-800' };
        case 3: return { text: 'Đã giao', className: 'bg-green-100 text-green-800' };
        default: return { text: 'Không xác định', className: 'bg-gray-100 text-gray-800' };
    }
};

const getUserStatus = (status) => {
    return status === 1
        ? { text: 'Hoạt động', className: 'bg-green-100 text-green-800' }
        : { text: 'Bị khóa', className: 'bg-red-100 text-red-800' };
};

const getUserRole = (role) => {
    return role === 'admin'
        ? { text: 'Admin', className: 'bg-purple-100 text-purple-800' }
        : { text: 'Customer', className: 'bg-blue-100 text-blue-800' };
};


const Page = () => {
    const { id } = useParams();
    const router = useRouter();

    // State 'user' for the logged-in admin
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
                const res = await fetch(`${API_BASE}/verifyAdmin`, { // Use verifyAdmin
                    headers: { Authorization: token },
                    cache: 'no-store'
                });
                if (!res.ok) {
                    localStorage.removeItem('token');
                    localStorage.removeItem('user');
                    router.replace('/admin/login');
                    return;
                }
                const adminData = await res.json();
                setUser(adminData); // Set logged-in admin user
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


    const [userData, setUserData] = useState(null); // User being viewed
    const [passwordForm, setPasswordForm] = useState({ new_password: '', confirm_password: '' });
    // Combined state for data loading and form submission
    const [state, setState] = useState({ loading: true, submitting: false, error: null });

    useEffect(() => {
        // Wait for ID and auth check
        if (!id || isNaN(Number(id)) || authLoading) return;

        const fetchUserData = async () => {
            setState(s => ({ ...s, loading: true, error: null })); // Start data loading
            try {
                const res = await fetch(`${API_BASE}/user/${id}`);
                if (res.status === 404) throw new Error("Không tìm thấy người dùng.");
                if (!res.ok) throw new Error(`Lỗi khi tải dữ liệu người dùng (HTTP ${res.status}).`);
                const json = await res.json();
                setUserData(json);
            } catch (e) {
                setState(s => ({ ...s, error: e.message }));
            } finally {
                setState(s => ({ ...s, loading: false })); // End data loading
            }
        };
        fetchUserData();
    }, [id, router, authLoading]); // Add authLoading dependency

    const handlePasswordChange = (e) => {
        const { name, value } = e.target;
        setPasswordForm(prev => ({ ...prev, [name]: value }));
    };

    const handlePasswordUpdate = async (e) => {
        e.preventDefault();

        if (!user) { // Check logged-in admin user state
            alert('Không thể xác định người dùng admin. Vui lòng đăng nhập lại.');
            router.push('/admin/login');
            return;
        }

        if (!passwordForm.new_password || !passwordForm.confirm_password) {
            return alert("Vui lòng nhập mật khẩu mới và xác nhận.");
        }
        if (passwordForm.new_password !== passwordForm.confirm_password) {
            return alert("Mật khẩu xác nhận không khớp.");
        }
        if (passwordForm.new_password.length < 6) { // Consistent validation
            return alert("Mật khẩu phải có ít nhất 6 ký tự.");
        }

        setState(s => ({ ...s, submitting: true, error: null })); // Start submission
        try {
            const payload = {
                user_id: id, // ID of the user whose password is being changed
                password: passwordForm.new_password, // The new password
                updated_by: user.id // ID of the logged-in admin performing the action
            };
            const res = await fetch(`${API_BASE}/updatePassword`, { // Ensure this endpoint is correct
                method: 'PUT',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify(payload),
            });
            if (!res.ok) {
                const errorData = await res.json().catch(() => ({}));
                throw new Error(errorData.message || 'Cập nhật mật khẩu thất bại.');
            }
            alert('Cập nhật mật khẩu thành công!');
            setPasswordForm({ new_password: '', confirm_password: '' }); // Reset form
            setState(s => ({ ...s, error: null })); // Clear previous errors on success
        } catch (err) {
            setState(s => ({ ...s, error: err.message || 'Lỗi không xác định' })); // Set error message
        } finally {
            setState(s => ({ ...s, submitting: false })); // End submission
        }
    };

    if (authLoading) return <div className="p-8 text-center animate-pulse">Đang xác thực quyền truy cập...</div>;

    if (state.loading) return <div className="p-8 text-center animate-pulse">Đang tải chi tiết người dùng...</div>;

    // Show main error only if not submitting
    if (state.error && !state.submitting) return (
        <div className="p-8 text-center text-red-500 bg-red-50 border border-red-200 rounded-lg">
            <p className="font-semibold mb-2">Lỗi tải dữ liệu:</p>
            <p>{state.error}</p>
            <Link href="/admin/user" className="mt-4 inline-block text-blue-600 hover:underline">
                Quay lại danh sách
            </Link>
        </div>
    );

    if (!userData) return null; // Should not happen if loading/error handled

    const statusInfo = getUserStatus(userData.status);
    const roleInfo = getUserRole(userData.role);

    return (
        <div className="space-y-8">
            {/* --- USER DETAILS SECTION --- */}
            <div className="bg-white p-6 md:p-8 shadow-sm rounded-lg border">
                <div className="flex items-start justify-between flex-wrap gap-4">
                    <div>
                        <h2 className="text-2xl font-bold text-gray-900">{userData.name}</h2>
                        <p className="text-sm text-gray-500 mt-1">Chi tiết tài khoản người dùng</p>
                    </div>
                    <Link href="/admin/user" className="text-sm font-medium text-indigo-600 hover:text-indigo-500">← Quay lại danh sách</Link>
                </div>

                <div className="mt-6 border-t border-gray-200 pt-6">
                    <dl className="grid grid-cols-1 md:grid-cols-2 gap-x-6 gap-y-8">
                        <div className="md:col-span-2 flex items-center gap-6">
                            {userData.avatar ? (
                                <Image src={userData.avatar} alt="Avatar" width={96} height={96} className="h-24 w-24 rounded-full object-cover border" unoptimized />
                            ) : (
                                <div className="h-24 w-24 rounded-full bg-gray-100 flex items-center justify-center text-4xl text-gray-400 border">
                                    <i className="fas fa-user"></i>
                                </div>
                            )}
                            <div>
                                <h3 className="text-lg font-semibold">{userData.name}</h3>
                                <p className="text-gray-600">{userData.email}</p>
                            </div>
                        </div>
                        <div>
                            <dt className="font-medium text-gray-500 text-sm">Username</dt>
                            <dd className="mt-1 text-gray-900 font-mono">{userData.username}</dd>
                        </div>
                        <div>
                            <dt className="font-medium text-gray-500 text-sm">Số điện thoại</dt>
                            <dd className="mt-1 text-gray-900">{userData.phone || 'Chưa cập nhật'}</dd>
                        </div>
                        <div>
                            <dt className="font-medium text-gray-500 text-sm">Vai trò</dt>
                            <dd className="mt-1 text-gray-900">
                                <span className={`px-3 py-1 font-semibold rounded-full text-xs ${roleInfo.className}`}>{roleInfo.text}</span>
                            </dd>
                        </div>
                        <div>
                            <dt className="font-medium text-gray-500 text-sm">Trạng thái</dt>
                            <dd className="mt-1 text-gray-900">
                                <span className={`px-3 py-1 font-semibold rounded-full text-xs ${statusInfo.className}`}>{statusInfo.text}</span>
                            </dd>
                        </div>
                        {/* Created/Updated Info */}
                        <div className="md:col-span-2 text-xs text-gray-400 mt-4 border-t pt-4">
                            <p>ID: {userData.id}</p>
                            <p>Ngày tạo: {new Date(userData.created_at).toLocaleString('vi-VN')}</p>
                            {userData.updated_at && <p>Cập nhật lần cuối: {new Date(userData.updated_at).toLocaleString('vi-VN')}</p>}
                        </div>
                    </dl>
                    {/* Edit Button */}
                    <div className="mt-6 flex justify-end">
                        <Link href={`/admin/user/edit/${userData.id}`} className="px-4 py-2 bg-yellow-500 hover:bg-yellow-600 text-white text-sm font-medium rounded-lg shadow-md flex items-center gap-2">
                            <i className="fas fa-edit"></i> Sửa thông tin
                        </Link>
                    </div>
                </div>
            </div>

            {/* --- PURCHASE HISTORY SECTION --- */}
            <div className="bg-white p-6 md:p-8 shadow-sm rounded-lg border">
                <h3 className="text-lg font-semibold text-gray-900 mb-4">Lịch sử mua hàng ({userData.order?.length || 0} đơn)</h3>
                <div className="overflow-x-auto">
                    {/* Check if order array exists and has items */}
                    {Array.isArray(userData.order) && userData.order.length > 0 ? (
                        <table className="min-w-full divide-y divide-gray-200 text-sm">
                            <thead className="bg-gray-50">
                                <tr>
                                    <th className="px-4 py-2 text-left font-medium text-gray-500 uppercase">Mã ĐH</th>
                                    <th className="px-4 py-2 text-left font-medium text-gray-500 uppercase">Ngày đặt</th>
                                    <th className="px-4 py-2 text-right font-medium text-gray-500 uppercase">Tổng tiền</th>
                                    <th className="px-4 py-2 text-center font-medium text-gray-500 uppercase">Trạng thái</th>
                                    <th className="px-4 py-2 text-right font-medium text-gray-500 uppercase"></th>
                                </tr>
                            </thead>
                            <tbody className="bg-white divide-y divide-gray-200">
                                {userData.order.map(order => {
                                    // Calculate total safely
                                    const totalAmount = Array.isArray(order.order_detail)
                                        ? order.order_detail.reduce((sum, item) => sum + parseFloat(item.amount || 0), 0)
                                        : 0;
                                    const orderStatusInfo = getOrderStatus(order.status);
                                    return (
                                        <tr key={order.id} className="hover:bg-gray-50">
                                            <td className="px-4 py-3 font-semibold text-indigo-600">#{order.id}</td>
                                            <td className="px-4 py-3">{new Date(order.created_at).toLocaleDateString('vi-VN')}</td>
                                            <td className="px-4 py-3 text-right font-medium">{formatCurrency(totalAmount)}</td>
                                            <td className="px-4 py-3 text-center">
                                                <span className={`px-2 py-1 text-xs font-semibold rounded-full ${orderStatusInfo.className}`}>{orderStatusInfo.text}</span>
                                            </td>
                                            <td className="px-4 py-3 text-right">
                                                <Link href={`/admin/order/show/${order.id}`} className="font-medium text-indigo-600 hover:text-indigo-800">Xem chi tiết</Link>
                                            </td>
                                        </tr>
                                    );
                                })}
                            </tbody>
                        </table>
                    ) : (
                        <p className="text-center text-gray-500 py-4">Người dùng này chưa có đơn hàng nào.</p>
                    )}
                </div>
            </div>

            {/* --- PASSWORD RESET SECTION --- */}
            <div className="bg-white p-6 md:p-8 shadow-sm rounded-lg border">
                <h3 className="text-lg font-semibold text-gray-900">Đặt lại mật khẩu</h3>
                {/* Display submission error here */}
                {state.error && state.submitting && <p className="text-red-500 text-sm mb-3 bg-red-50 p-3 rounded border border-red-200">Lỗi: {state.error}</p>}
                <form onSubmit={handlePasswordUpdate} className="mt-4 grid grid-cols-1 md:grid-cols-3 gap-4 items-end">
                    <div className="md:col-span-1">
                        <label className="block text-sm font-medium text-gray-700">Mật khẩu mới</label>
                        <input type="password" name="new_password" value={passwordForm.new_password} onChange={handlePasswordChange} className="mt-1 w-full h-11 px-4 rounded-lg bg-gray-50 border border-gray-300" />
                    </div>
                    <div className="md:col-span-1">
                        <label className="block text-sm font-medium text-gray-700">Xác nhận mật khẩu mới</label>
                        <input type="password" name="confirm_password" value={passwordForm.confirm_password} onChange={handlePasswordChange} className="mt-1 w-full h-11 px-4 rounded-lg bg-gray-50 border border-gray-300" />
                    </div>
                    <div className="md:col-span-1">
                        <button type="submit" disabled={state.submitting} className="w-full h-11 px-4 bg-indigo-600 text-white rounded-lg disabled:opacity-60 flex items-center justify-center disabled:cursor-not-allowed">
                            {state.submitting ? (
                                <>
                                    <svg className="animate-spin -ml-1 mr-2 h-5 w-5 text-white" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                                        <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                                        <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                                    </svg>
                                    Đang cập nhật...
                                </>
                            ) : (
                                'Cập nhật mật khẩu'
                            )}
                        </button>
                    </div>
                </form>
            </div>
        </div>
    );
};

export default Page;

