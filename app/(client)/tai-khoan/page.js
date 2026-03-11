'use client';

import { useEffect, useMemo, useRef, useState } from 'react';
import { useRouter } from 'next/navigation';
import {
    User, Mail, Phone, AtSign, Camera, Save, X, Check,
    Shield, Lock, Eye, EyeOff, ShoppingBag, MapPin, FileText
} from 'lucide-react';

/* =================== Config =================== */
const API_BASE = process.env.NEXT_PUBLIC_API_BASE_URL || '';
const MAX_FILE_SIZE = 3 * 1024 * 1024; // 3MB
const ALLOWED_MIME = ['image/jpeg', 'image/png', 'image/webp', 'image/gif'];

/* =================== Utils =================== */
const fmtVND = (n) =>
    new Intl.NumberFormat('vi-VN', { style: 'currency', currency: 'VND' })
        .format(Number.isFinite(+n) ? +n : 0);

const toDate = (s) => {
    if (!s) return null;
    const d = new Date(String(s).replace(' ', 'T'));
    return isNaN(+d) ? null : d;
};

const fmtDate = (s) => {
    const d = toDate(s);
    return d ? d.toLocaleString('vi-VN') : '—';
};

const statusBadge = (st) => {
    const v = +st;
    if (v === 2)
        return (
            <span className="inline-flex items-center gap-1.5 text-green-700 bg-green-50 border-2 border-green-200 px-3 py-1.5 rounded-full text-xs font-bold">
                <i className="fa-solid fa-circle-check" />
                Thành công
            </span>
        );
    if (v === 1)
        return (
            <span className="inline-flex items-center gap-1.5 text-amber-700 bg-amber-50 border-2 border-amber-200 px-3 py-1.5 rounded-full text-xs font-bold">
                <i className="fa-solid fa-clock" />
                Chờ xử lý
            </span>
        );
    if (v === 0)
        return (
            <span className="inline-flex items-center gap-1.5 text-red-700 bg-red-50 border-2 border-red-200 px-3 py-1.5 rounded-full text-xs font-bold">
                <i className="fa-solid fa-x" />
                Đã huỷ
            </span>
        );
    return (
        <span className="inline-flex items-center gap-1.5 text-gray-700 bg-gray-50 border-2 border-gray-200 px-3 py-1.5 rounded-full text-xs font-bold">
            <svg className="w-3.5 h-3.5" fill="currentColor" viewBox="0 0 20 20">
                <path
                    fillRule="evenodd"
                    d="M18 10a8 8 0 11-16 0 8 8 0 0116 0zm-8-3a1 1 0 00-.867.5 1 1 0 11-1.731-1A3 3 0 0113 8a3.001 3.001 0 01-2 2.83V11a1 1 0 11-2 0v-1a1 1 0 011-1 1 1 0 100-2zm0 8a1 1 0 100-2 1 1 0 000 2z"
                    clipRule="evenodd"
                />
            </svg>
            Không rõ
        </span>
    );
};

const sumOrderAmount = (o) =>
    (o?.order_detail || []).reduce((s, d) => s + Number(d?.amount || 0), 0);

/* =================== Page =================== */
export default function UserAccountPage() {
    const router = useRouter();

    // server data
    const [me, setMe] = useState(null);
    const [loadingMe, setLoadingMe] = useState(true);
    const [errMe, setErrMe] = useState('');

    // profile edit state
    const [userInfo, setUserInfo] = useState({
        name: '',
        email: '',
        phone: '',
        username: '',
        avatar: '',
    });
    const [isEditing, setIsEditing] = useState(false);
    const [savingProfile, setSavingProfile] = useState(false);

    // avatar states
    const [avatarFile, setAvatarFile] = useState(null);
    const [avatarPreview, setAvatarPreview] = useState(null);

    // tabs
    const [activeTab, setActiveTab] = useState('profile');

    // password state
    const [showPassword, setShowPassword] = useState(false);
    const [passwords, setPasswords] = useState({ current: '', new: '', confirm: '' });
    const [savingPw, setSavingPw] = useState(false);

    useEffect(() => {
        (async () => {
            let verifiedUser = null;
            try {
                setLoadingMe(true);
                setErrMe('');

                const token = localStorage.getItem('token');
                if (!token) {
                    router.replace('/dang-nhap');
                    return;
                }

                const verifyRes = await fetch(`${API_BASE}/verifyUser`, {
                    headers: { Authorization: token },
                    cache: 'no-store',
                });
                if (!verifyRes.ok) {
                    localStorage.removeItem('token');
                    router.replace('/dang-nhap');
                    return;
                }

                verifiedUser = await verifyRes.json();
                if (!verifiedUser?.id) throw new Error('Không tìm thấy ID người dùng từ token.');

                const fullDataRes = await fetch(`${API_BASE}/user/${verifiedUser.id}`, {
                    cache: 'no-store',
                    headers: { Authorization: token },
                });
                if (!fullDataRes.ok) throw new Error(`Không tải được chi tiết tài khoản (HTTP ${fullDataRes.status})`);

                const fullData = await fullDataRes.json();
                setMe(fullData);
                setUserInfo({
                    name: fullData?.name,
                    email: fullData?.email,
                    phone: fullData?.phone,
                    username: fullData?.username,
                    avatar: fullData?.avatar,
                });
                setAvatarPreview(fullData?.avatar);
                setErrMe('');
            } catch (e) {
                console.error(e);
                setErrMe(e.message || 'Không tải được thông tin người dùng.');
                setMe(null);
                if (String(e?.message || '').includes('401') || String(e?.message || '').includes('403')) {
                    router.replace('/dang-nhap');
                }
            } finally {
                setLoadingMe(false);
            }
        })();
    }, [router]);

    const totalSpent = useMemo(() => {
        const orders = me?.order || [];
        return orders.reduce((sum, o) => {
            const paid = (o?.order_detail || [])
                .filter((d) => +d.status === 1)
                .reduce((s, d) => s + Number(d.amount || 0), 0);
            return sum + paid;
        }, 0);
    }, [me]);

    const successOrders = useMemo(
        () => (me?.order || []).filter((o) => +o.status === 2).length,
        [me]
    );

    /* ====== File helpers ====== */
    const validateImage = (file) => {
        if (!file) return null;
        if (!ALLOWED_MIME.includes(file.type)) return 'Định dạng ảnh không hợp lệ. Chỉ JPEG/PNG/WebP/GIF.';
        if (file.size > MAX_FILE_SIZE) return `Kích thước ảnh tối đa ${Math.round(MAX_FILE_SIZE / 1024 / 1024)}MB.`;
        return null;
    };

    const uploadAvatar = async (file) => {
        if (!file) return null;
        const err = validateImage(file);
        if (err) throw new Error(err);

        const fd = new FormData();
        fd.append('image', file);
        fd.append('perfix', 'avatars');
        fd.append('slug', me.username);

        const res = await fetch(`${API_BASE}/upload`, {
            method: 'POST',
            body: fd
        });
        if (!res.ok) {
            const t = await res.text().catch(() => '');
            throw new Error(t || `Upload avatar thất bại (${res.status})`);
        }
        return await res.json();
    };

    const handleAvatarInput = (e) => {
        const file = e.target.files?.[0] || null;
        if (!file) return setAvatarFile(null);
        const err = validateImage(file);
        if (err) {
            alert(err);
            e.target.value = '';
            return;
        }
        setAvatarFile(file);
        setAvatarPreview(URL.createObjectURL(file));
    };

    const handleInputChange = (field, value) => {
        setUserInfo((s) => ({ ...s, [field]: value }));
    };

    const handleCancelProfile = () => {
        setUserInfo({
            name: me?.name || '',
            email: me?.email || '',
            phone: me?.phone || '',
            username: me?.username || '',
            avatar: me?.avatar || '',
        });
        setAvatarFile(null);
        setIsEditing(false);
    };

    const handleSaveProfile = async () => {
        if (!me?.id) return;
        try {
            setSavingProfile(true);
            const token = localStorage.getItem('token');

            let newAvatarUrl = me?.avatar || null;
            if (avatarFile) {
                const up = await uploadAvatar(avatarFile);
                newAvatarUrl = up?.url || '';
                if (!newAvatarUrl) throw new Error('Upload thành công nhưng không nhận được URL ảnh.');
            }

            const payload = {
                name: userInfo.name.trim(),
                email: userInfo.email.trim(),
                phone: userInfo.phone.trim() || null,
                username: userInfo.username.trim(),
                avatar: newAvatarUrl,
                updated_by: me.id,
            };

            const r = await fetch(`${API_BASE}/user/${me.id}`, {
                method: 'PUT',
                headers: {
                    'Content-Type': 'application/json',
                    ...(token ? { Authorization: token } : {}),
                },
                body: JSON.stringify(payload),
            });
            if (!r.ok) {
                const j = await r.json().catch(() => ({}));
                let errMsg = j?.message || `Cập nhật hồ sơ thất bại (HTTP ${r.status})`;
                if (r.status === 422) errMsg = 'Dữ liệu không hợp lệ. Email hoặc Username có thể đã tồn tại.';
                throw new Error(errMsg);
            }

            const updated = await r.json().catch(() => null);
            const merged = updated ? { ...me, ...updated } : { ...me, ...payload };
            setMe(merged);
            setUserInfo((s) => ({ ...s, avatar: newAvatarUrl || '' }));
            setAvatarPreview(newAvatarUrl);
            setAvatarFile(null);
            setIsEditing(false);
            alert("Cập nhật hồ sơ thành công!")
        } catch (e) {
            console.error(e);
            alert(e.message || 'Cập nhật hồ sơ thất bại.');
        } finally {
            setSavingProfile(false);
        }
    };

    const submitChangePassword = async (e) => {
        e.preventDefault();
        if (!passwords.current || !passwords.new || !passwords.confirm) {
            return alert('Vui lòng điền đầy đủ các trường.');
        }
        if (passwords.new.length < 8) {
            return alert('Mật khẩu mới phải có ít nhất 8 ký tự.');
        }
        if (passwords.new !== passwords.confirm) {
            return alert('Xác nhận mật khẩu không khớp.');
        }
        try {
            setSavingPw(true);
            const token = localStorage.getItem('token');
            const r = await fetch(`${API_BASE}/changePassword`, {
                method: 'PUT',
                headers: {
                    'Content-Type': 'application/json',
                    ...(token ? { Authorization: token } : {}),
                },
                body: JSON.stringify({
                    user_id: me?.id,
                    current_password: passwords.current,
                    new_password: passwords.new,
                    updated_by: me?.id,
                }),
            });
            if (!r.ok) {
                const j = await r.json().catch(() => ({}));
                throw new Error(j?.message || `Đổi mật khẩu thất bại (HTTP ${r.status})`);
            }
            alert('Đổi mật khẩu thành công!');
            setPasswords({ current: '', new: '', confirm: '' });
        } catch (e) {
            alert(e.message || 'Đổi mật khẩu thất bại.');
        } finally {
            setSavingPw(false);
        }
    };

    return (
        <div className="min-h-screen bg-gradient-to-br from-slate-50 via-purple-50 to-blue-50 py-40">
            <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">

                <div className="mb-8">
                    <h1 className="text-4xl font-bold bg-gradient-to-r from-gray-900 to-gray-600 bg-clip-text text-transparent flex items-center gap-3">
                        <div className="bg-gradient-to-br from-purple-600 to-blue-600 p-3 rounded-2xl shadow-lg">
                            <User className="w-8 h-8 text-white" />
                        </div>
                        Quản Lý Tài Khoản
                    </h1>
                    <p className="text-gray-600 mt-2">Cập nhật thông tin cá nhân, xem đơn hàng và đổi mật khẩu</p>
                </div>

                {!loadingMe && me && (
                    <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-6">
                        <div className="bg-white rounded-2xl p-6 shadow-lg border border-blue-100">
                            <div className="flex items-center gap-4">
                                <div className="p-3 bg-gradient-to-br from-blue-500 to-blue-600 rounded-xl">
                                    <ShoppingBag className="w-6 h-6 text-white" />
                                </div>
                                <div>
                                    <p className="text-sm text-gray-600">Tổng đơn hàng</p>
                                    <p className="text-2xl font-bold text-gray-900">{me?.order?.length ?? 0}</p>
                                </div>
                            </div>
                        </div>
                        <div className="bg-white rounded-2xl p-6 shadow-lg border border-green-100">
                            <div className="flex items-center gap-4">
                                <div className="p-3 bg-gradient-to-br from-green-500 to-green-600 rounded-xl">
                                    <Check className="w-6 h-6 text-white" />
                                </div>
                                <div>
                                    <p className="text-sm text-gray-600">Đơn thành công</p>
                                    <p className="text-2xl font-bold text-gray-900">{successOrders}</p>
                                </div>
                            </div>
                        </div>
                        <div className="bg-white rounded-2xl p-6 shadow-lg border border-purple-100">
                            <div className="flex items-center gap-4">
                                <div className="p-3 bg-gradient-to-br from-purple-500 to-purple-600 rounded-xl">
                                    <svg className="w-6 h-6 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2}
                                            d="M12 8c-1.657 0-3 .895-3 2s1.343 2 3 2 3 .895 3 2-1.343 2-3 2m0-8c1.11 0 2.08.402 2.599 1M12 8V7m0 1v8m0 0v1m0-1c-1.11 0-2.08-.402-2.599-1M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                                    </svg>
                                </div>
                                <div>
                                    <p className="text-sm text-gray-600">Tổng chi tiêu</p>
                                    <p className="text-2xl font-bold text-gray-900">{fmtVND(totalSpent)}</p>
                                </div>
                            </div>
                        </div>
                    </div>
                )}

                <div className="bg-white rounded-2xl shadow-lg p-2 mb-6 flex gap-2">
                    <button
                        onClick={() => setActiveTab('profile')}
                        className={`flex-1 py-3 px-6 rounded-xl font-semibold transition-all duration-300 ${activeTab === 'profile'
                            ? 'bg-gradient-to-r from-purple-600 to-blue-600 text-white shadow-lg'
                            : 'text-gray-600 hover:bg-gray-100'}`}
                    >
                        <User className="w-5 h-5 inline mr-2" />
                        Thông Tin Cá Nhân
                    </button>
                    <button
                        onClick={() => setActiveTab('orders')}
                        className={`flex-1 py-3 px-6 rounded-xl font-semibold transition-all duration-300 ${activeTab === 'orders'
                            ? 'bg-gradient-to-r from-purple-600 to-blue-600 text-white shadow-lg'
                            : 'text-gray-600 hover:bg-gray-100'}`}
                    >
                        <ShoppingBag className="w-5 h-5 inline mr-2" />
                        Đơn Hàng
                    </button>
                    <button
                        onClick={() => setActiveTab('security')}
                        className={`flex-1 py-3 px-6 rounded-xl font-semibold transition-all duration-300 ${activeTab === 'security'
                            ? 'bg-gradient-to-r from-purple-600 to-blue-600 text-white shadow-lg'
                            : 'text-gray-600 hover:bg-gray-100'}`}
                    >
                        <Shield className="w-5 h-5 inline mr-2" />
                        Bảo Mật
                    </button>
                </div>

                {loadingMe ? (
                    <div className="text-center text-gray-500 py-16">Đang tải...</div>
                ) : errMe ? (
                    <div className="text-center text-red-600 bg-red-50 p-6 rounded-2xl border border-red-200">{errMe}</div>
                ) : !me ? (
                    <div className="text-center text-gray-500">Không tìm thấy dữ liệu.</div>
                ) : (
                    <>
                        {activeTab === 'orders' && (
                            <div className="bg-white rounded-3xl shadow-2xl p-8 border border-gray-100">
                                <div className="flex items-center justify-between mb-8">
                                    <h2 className="text-2xl font-bold text-gray-900 flex items-center gap-3">
                                        <div className="w-10 h-10 bg-blue-100 rounded-xl flex items-center justify-center">
                                            <ShoppingBag className="w-6 h-6 text-blue-600" />
                                        </div>
                                        Lịch sử đơn hàng
                                    </h2>
                                    <a
                                        href="/san-pham"
                                        className="px-4 py-2 bg-blue-600 text-white rounded-xl font-semibold hover:bg-blue-700 transition-all flex items-center gap-2"
                                    >
                                        Mua sắm ngay
                                        <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 7l5 5m0 0l-5 5m5-5H6" />
                                        </svg>
                                    </a>
                                </div>

                                {(me?.order || []).length === 0 ? (
                                    <div className="text-center py-12">
                                        <svg className="w-20 h-20 mx-auto text-gray-300 mb-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M16 11V7a4 4 0 00-8 0v4M5 9h14l1 12H4L5 9z" />
                                        </svg>
                                        <p className="text-gray-500 mb-4">Chưa có đơn hàng nào</p>
                                        <a href="/san-pham" className="text-blue-600 font-semibold hover:underline">Mua sắm ngay →</a>
                                    </div>
                                ) : (
                                    <div className="space-y-4">
                                        {(me?.order || []).map((o) => {
                                            const total = sumOrderAmount(o);
                                            return (
                                                <div key={o.id} className="rounded-2xl border-2 border-gray-200 p-6 hover:shadow-xl hover:border-blue-300 transition-all">
                                                    <div className="flex flex-wrap items-start justify-between gap-4 mb-4">
                                                        <div className="flex items-start gap-4">
                                                            <div className="w-14 h-14 bg-gradient-to-br from-blue-500 to-indigo-600 rounded-xl flex items-center justify-center text-white">
                                                                <FileText className="w-7 h-7" />
                                                            </div>
                                                            <div>
                                                                <div className="font-bold text-lg text-gray-900 mb-1">Đơn hàng #{o.id}</div>
                                                                <div className="text-sm text-gray-500 flex items-center gap-2">
                                                                    <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                                                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z" />
                                                                    </svg>
                                                                    {fmtDate(o.created_at)}
                                                                </div>
                                                            </div>
                                                        </div>
                                                        <div className="text-right">
                                                            <div className="mb-2">{statusBadge(o.status)}</div>
                                                            <div className="text-xs text-gray-500 mb-1">Tổng tiền</div>
                                                            <div className="text-2xl font-bold text-blue-600">{fmtVND(total)}</div>
                                                        </div>
                                                    </div>

                                                    <div className="bg-gray-50 rounded-xl p-4 space-y-2 text-sm">
                                                        <div className="flex items-start gap-2">
                                                            <MapPin className="w-4 h-4 text-gray-400 mt-0.5 flex-shrink-0" />
                                                            <span className="text-gray-700">
                                                                <span className="font-medium">Địa chỉ:</span> {o.address || '—'}
                                                            </span>
                                                        </div>
                                                        {o.note && (
                                                            <div className="flex items-start gap-2">
                                                                <svg className="w-4 h-4 text-gray-400 mt-0.5 flex-shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                                                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M7 8h10M7 12h4m1 8l-4-4H5a2 2 0 01-2-2V6a2 2 0 012-2h14a2 2 0 012 2v8a2 2 0 01-2 2h-3l-4 4z" />
                                                                </svg>
                                                                <span className="text-gray-700">
                                                                    <span className="font-medium">Ghi chú:</span> {o.note}
                                                                </span>
                                                            </div>
                                                        )}
                                                    </div>

                                                    <div className="mt-4 flex items-center gap-3">
                                                        <a
                                                            href={`/don-hang/${o.id}`}
                                                            className="flex-1 text-center px-4 py-3 rounded-xl bg-gray-100 hover:bg-gray-200 font-semibold text-gray-700 transition-all"
                                                        >
                                                            Xem chi tiết
                                                        </a>
                                                    </div>
                                                </div>
                                            );
                                        })}
                                    </div>
                                )}
                            </div>
                        )}

                        {activeTab === 'security' && (
                            <div className="bg-white rounded-3xl shadow-2xl p-8 backdrop-blur-sm bg-opacity-95 border border-gray-100">
                                <h2 className="text-2xl font-bold text-gray-900 mb-6 flex items-center gap-2">
                                    <Lock className="w-6 h-6 text-purple-600" />
                                    Đổi Mật Khẩu
                                </h2>

                                <form onSubmit={submitChangePassword} className="space-y-6 max-w-2xl">
                                    <div>
                                        <label className="block text-sm font-semibold text-gray-700 mb-2">Mật Khẩu Hiện Tại</label>
                                        <div className="relative">
                                            <input
                                                type={showPassword ? 'text' : 'password'}
                                                value={passwords.current}
                                                onChange={(e) => setPasswords({ ...passwords, current: e.target.value })}
                                                className="w-full border-2 border-purple-200 rounded-xl px-4 py-3 pr-12 focus:outline-none focus:ring-2 focus:ring-purple-500 focus:border-transparent"
                                                placeholder="Nhập mật khẩu hiện tại"
                                            />
                                            <button
                                                type="button"
                                                onClick={() => setShowPassword(!showPassword)}
                                                className="absolute right-4 top-1/2 -translate-y-1/2 text-gray-400 hover:text-gray-600"
                                            >
                                                {showPassword ? <EyeOff className="w-5 h-5" /> : <Eye className="w-5 h-5" />}
                                            </button>
                                        </div>
                                    </div>

                                    <div>
                                        <label className="block text-sm font-semibold text-gray-700 mb-2">Mật Khẩu Mới</label>
                                        <input
                                            type={showPassword ? 'text' : 'password'}
                                            value={passwords.new}
                                            onChange={(e) => setPasswords({ ...passwords, new: e.target.value })}
                                            className="w-full border-2 border-purple-200 rounded-xl px-4 py-3 focus:outline-none focus:ring-2 focus:ring-purple-500 focus:border-transparent"
                                            placeholder="Nhập mật khẩu mới"
                                        />
                                    </div>

                                    <div>
                                        <label className="block text-sm font-semibold text-gray-700 mb-2">Xác Nhận Mật Khẩu Mới</label>
                                        <input
                                            type={showPassword ? 'text' : 'password'}
                                            value={passwords.confirm}
                                            onChange={(e) => setPasswords({ ...passwords, confirm: e.target.value })}
                                            className="w-full border-2 border-purple-200 rounded-xl px-4 py-3 focus:outline-none focus:ring-2 focus:ring-purple-500 focus:border-transparent"
                                            placeholder="Nhập lại mật khẩu mới"
                                        />
                                    </div>

                                    <button
                                        type="submit"
                                        disabled={savingPw}
                                        className="bg-gradient-to-r from-purple-600 to-blue-600 text-white px-8 py-3 rounded-xl font-semibold hover:shadow-xl transition-all duration-300 transform hover:scale-105 disabled:opacity-60"
                                    >
                                        <Lock className="w-4 h-4 inline mr-2" />
                                        {savingPw ? 'Đang lưu…' : 'Cập Nhật Mật Khẩu'}
                                    </button>

                                    <div className="mt-6 p-4 bg-amber-50 rounded-xl border border-amber-200">
                                        <p className="text-sm text-amber-800 font-semibold mb-2">Lưu ý bảo mật:</p>
                                        <ul className="text-sm text-amber-700 space-y-1 list-disc list-inside">
                                            <li>Mật khẩu phải có ít nhất 8 ký tự</li>
                                            <li>Nên bao gồm chữ hoa, chữ thường và số</li>
                                            <li>Không sử dụng mật khẩu dễ đoán</li>
                                        </ul>
                                    </div>
                                </form>
                            </div>
                        )}

                        {activeTab === 'profile' && (
                            <div className="grid lg:grid-cols-3 gap-6">
                                <div className="lg:col-span-1">
                                    <div className="bg-white rounded-3xl shadow-2xl p-8 border border-gray-100 text-center">
                                        <div className="relative inline-block mb-6">
                                            <img
                                                src={avatarPreview || 'https://placehold.co/160x160?text=Avatar'}
                                                alt="Avatar"
                                                className="w-40 h-40 rounded-full object-cover border-4 border-transparent shadow-2xl"
                                            />
                                        </div>

                                        <h2 className="text-2xl font-bold text-gray-900 mt-6 mb-1">{userInfo.name || '—'}</h2>
                                        <p className="text-gray-500 mb-6">@{userInfo.username || 'username'}</p>

                                        <div className="space-y-3 text-left">
                                            <div className="flex items-center gap-3 p-3 bg-gradient-to-r from-purple-50 to-blue-50 rounded-xl">
                                                <Mail className="w-5 h-5 text-purple-600" />
                                                <span className="text-sm text-gray-700 break-words">{userInfo.email || '—'}</span>
                                            </div>
                                            <div className="flex items-center gap-3 p-3 bg-gradient-to-r from-purple-50 to-blue-50 rounded-xl">
                                                <Phone className="w-5 h-5 text-blue-600" />
                                                <span className="text-sm text-gray-700">{userInfo.phone || '—'}</span>
                                            </div>
                                        </div>
                                    </div>
                                </div>

                                <div className="lg:col-span-2">
                                    <div className="bg-white rounded-3xl shadow-2xl p-8 border border-gray-100">
                                        <div className="flex justify-between items-center mb-6">
                                            <h2 className="text-2xl font-bold text-gray-900">Thông Tin Chi Tiết</h2>
                                            {!isEditing ? (
                                                <button
                                                    onClick={() => setIsEditing(true)}
                                                    className="bg-gradient-to-r from-purple-600 to-blue-600 text-white px-6 py-2 rounded-xl font-semibold hover:shadow-xl transition-all duration-300 transform hover:scale-105"
                                                >
                                                    Chỉnh Sửa
                                                </button>
                                            ) : (
                                                <div className="flex gap-2">
                                                    <button
                                                        onClick={handleCancelProfile}
                                                        className="bg-gray-100 text-gray-700 px-6 py-2 rounded-xl font-semibold hover:bg-gray-200 transition-all"
                                                    >
                                                        <X className="w-4 h-4 inline mr-1" />
                                                        Hủy
                                                    </button>
                                                    <button
                                                        onClick={handleSaveProfile}
                                                        disabled={savingProfile}
                                                        className="bg-gradient-to-r from-green-600 to-emerald-600 text-white px-6 py-2 rounded-xl font-semibold hover:shadow-xl transition-all duration-300 transform hover:scale-105 disabled:opacity-60"
                                                    >
                                                        <Save className="w-4 h-4 inline mr-1" />
                                                        {savingProfile ? 'Đang lưu…' : 'Lưu'}
                                                    </button>
                                                </div>
                                            )}
                                        </div>

                                        <div className="space-y-6">
                                            <div>
                                                <label className="block text-sm font-semibold text-gray-700 mb-2 flex items-center gap-2">
                                                    <User className="w-4 h-4 text-purple-600" />
                                                    Họ và Tên
                                                </label>
                                                <input
                                                    type="text"
                                                    value={userInfo.name}
                                                    onChange={(e) => handleInputChange('name', e.target.value)}
                                                    disabled={!isEditing}
                                                    className={`w-full border-2 rounded-xl px-4 py-3 transition-all ${isEditing
                                                        ? 'border-purple-200 focus:outline-none focus:ring-2 focus:ring-purple-500 focus:border-transparent'
                                                        : 'border-gray-200 bg-gray-50 cursor-not-allowed'
                                                        }`}
                                                    placeholder="Nhập họ và tên"
                                                />
                                            </div>

                                            <div>
                                                <label className="block text-sm font-semibold text-gray-700 mb-2 flex items-center gap-2">
                                                    <AtSign className="w-4 h-4 text-blue-600" />
                                                    Tên Đăng Nhập
                                                </label>
                                                <input
                                                    type="text"
                                                    value={userInfo.username}
                                                    onChange={(e) => handleInputChange('username', e.target.value)}
                                                    disabled={!isEditing}
                                                    className={`w-full border-2 rounded-xl px-4 py-3 transition-all ${isEditing
                                                        ? 'border-purple-200 focus:outline-none focus:ring-2 focus:ring-purple-500 focus:border-transparent'
                                                        : 'border-gray-200 bg-gray-50 cursor-not-allowed'
                                                        }`}
                                                    placeholder="Nhập tên đăng nhập"
                                                />
                                            </div>

                                            <div>
                                                <label className="block text-sm font-semibold text-gray-700 mb-2 flex items-center gap-2">
                                                    <Mail className="w-4 h-4 text-purple-600" />
                                                    Email
                                                </label>
                                                <input
                                                    type="email"
                                                    value={userInfo.email}
                                                    onChange={(e) => handleInputChange('email', e.target.value)}
                                                    disabled={!isEditing}
                                                    className={`w-full border-2 rounded-xl px-4 py-3 transition-all ${isEditing
                                                        ? 'border-purple-200 focus:outline-none focus:ring-2 focus:ring-purple-500 focus:border-transparent'
                                                        : 'border-gray-200 bg-gray-50 cursor-not-allowed'
                                                        }`}
                                                    placeholder="Nhập email"
                                                />
                                            </div>

                                            <div>
                                                <label className="block text-sm font-semibold text-gray-700 mb-2 flex items-center gap-2">
                                                    <Phone className="w-4 h-4 text-blue-600" />
                                                    Số Điện Thoại
                                                </label>
                                                <input
                                                    type="tel"
                                                    value={userInfo.phone}
                                                    onChange={(e) => handleInputChange('phone', e.target.value)}
                                                    disabled={!isEditing}
                                                    className={`w-full border-2 rounded-xl px-4 py-3 transition-all ${isEditing
                                                        ? 'border-purple-200 focus:outline-none focus:ring-2 focus:ring-purple-500 focus:border-transparent'
                                                        : 'border-gray-200 bg-gray-50 cursor-not-allowed'
                                                        }`}
                                                    placeholder="Nhập số điện thoại"
                                                />
                                            </div>

                                            {isEditing && (
                                                <div>
                                                    <label className="block text-sm font-semibold text-gray-700 mb-2 flex items-center gap-2">
                                                        <Camera className="w-4 h-4 text-purple-600" />
                                                        Ảnh đại diện (Avatar)
                                                    </label>
                                                    <input
                                                        type="file"
                                                        accept="image/*"
                                                        onChange={handleAvatarInput}
                                                        className="w-full text-sm text-slate-600 file:mr-4 file:py-2 file:px-4 file:rounded-full file:border-0 file:text-sm file:font-semibold file:bg-violet-50 file:text-violet-700 hover:file:bg-violet-100"
                                                    />
                                                </div>
                                            )}
                                        </div>
                                    </div>
                                </div>
                            </div>
                        )}
                    </>
                )}

                <style jsx>{`
          .animate-fade-in { animation: fadeIn 0.5s ease-out; }
          @keyframes fadeIn { from { opacity: 0; transform: translateY(-4px); } to { opacity: 1; transform: translateY(0); } }
        `}</style>
            </div>
        </div>
    );
}
