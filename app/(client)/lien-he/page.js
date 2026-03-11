'use client';

import React, { useState, useEffect } from 'react';
import { MapPin, Mail, Phone, Send } from 'lucide-react';
import { useRouter } from 'next/navigation';

const API_BASE = process.env.NEXT_PUBLIC_API_BASE_URL;

export default function ContactPage() {
    const [formData, setFormData] = useState({
        name: '',
        email: '',
        phone: '',
        content: '',
    });

    const [errors, setErrors] = useState({});
    const [showSuccess, setShowSuccess] = useState(false);
    const [loading, setLoading] = useState(false);
    const [sendContact, setSendContact] = useState(false);
    const [user, setUser] = useState(null);
    const [setting, setSetting] = useState(null);

    const router = useRouter();

    useEffect(() => {
        if (!localStorage.getItem('token')) {
            return;
        }
        (async () => {
            try {
                const res = await fetch(`${API_BASE}/verifyUser`, {
                    method: 'GET',
                    headers: {
                        Accept: 'application/json',
                        Authorization: `${localStorage.getItem('token')}`,
                    },
                });

                if (res.status === 401) {
                    const data = await res.json();
                    alert(data.message);
                    localStorage.removeItem('token');
                    router.replace('/dang-nhap');
                    return;
                }

                if (!res.ok) {
                    const errorData = await res.json().catch(() => null);
                    throw new Error(errorData?.message || `Lỗi xác thực (HTTP ${res.status}).`);
                }

                const json = await res.json();
                setUser(json);
                setFormData((prev) => ({
                    ...prev,
                    name: json?.name || '',
                    email: json?.email || '',
                    phone: json?.phone || '',
                }));
            } catch (e) {
                alert(e?.message ?? 'Lỗi không xác định khi xác thực.');
                localStorage.removeItem('token');
                router.replace('/dang-nhap');
            }
        })();
    }, []);

    useEffect(() => {
        (async () => {
            try {
                const res = await fetch(`${API_BASE}/setting`);

                if (!res.ok) {
                    const errorData = await res.json().catch(() => null);
                    throw new Error(errorData?.message || `Lỗi xác thực (HTTP ${res.status}).`);
                }

                const json = await res.json();
                setSetting(json);

            } catch (e) {
                alert(e?.message);
            }
        })();
    }, []);

    const handleChange = (e) => {
        const { name, value } = e.target;
        setFormData((prev) => ({ ...prev, [name]: value }));

        if (errors[name]) {
            setErrors((prev) => ({ ...prev, [name]: '' }));
        }
    };

    const validateForm = () => {
        const newErrors = {};

        if (!formData.name.trim()) newErrors.name = 'Vui lòng nhập họ tên';
        if (!formData.email.trim()) newErrors.email = 'Vui lòng nhập email';
        else if (!/\S+@\S+\.\S+/.test(formData.email))
            newErrors.email = 'Email không hợp lệ';
        if (!formData.phone.trim()) newErrors.phone = 'Vui lòng nhập số điện thoại';
        else if (!/^[0-9]{10}$/.test(formData.phone.replace(/\s/g, '')))
            newErrors.phone = 'Số điện thoại không hợp lệ';
        if (!formData.content.trim()) newErrors.content = 'Vui lòng nhập nội dung';

        return newErrors;
    };

    const handleSubmit = async (e) => {
        e.preventDefault();
        const newErrors = validateForm();
        if (Object.keys(newErrors).length > 0) {
            setErrors(newErrors);
            return;
        }

        setLoading(true);
        try {
            const payload = {
                user_id: user?.id || 0,
                name: formData.name,
                email: formData.email,
                phone: formData.phone,
                content: formData.content,
                created_by: user?.id || 0,
            }

            const res = await fetch(`${API_BASE}/contact`, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify(payload),
            });
            if (!res.ok) throw new Error('Gửi thất bại');

            setShowSuccess(true);
            setSendContact(true);
            setTimeout(() => setShowSuccess(false), 4000);
        } catch (err) {
            alert('Không thể gửi tin nhắn. Vui lòng thử lại sau.');
        } finally {
            setLoading(false);
        }
    };

    return (
        <div className="min-h-screen py-12 px-4 pt-40">
            <div className="max-w-7xl mx-auto">
                <div className="text-center mb-12">
                    <h1 className="text-5xl font-bold text-gray-800 mb-4">
                        Liên Hệ Với Chúng Tôi
                    </h1>
                    <p className="text-xl text-gray-600">
                        Chúng tôi sẵn sàng lắng nghe và hỗ trợ bạn
                    </p>
                </div>

                <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
                    {/* Form liên hệ */}
                    <div className="bg-white rounded-2xl shadow-xl p-8 lg:p-10">
                        <h2 className="text-2xl font-bold text-gray-800 mb-6">Gửi Tin Nhắn</h2>

                        <div className="space-y-6">
                            {/* Họ tên */}
                            <div>
                                <label className="block text-sm font-semibold text-gray-700 mb-2">
                                    Họ và Tên <span className="text-red-500">*</span>
                                </label>
                                <input
                                    type="text"
                                    name="name"
                                    value={formData.name}
                                    onChange={handleChange}
                                    className={`w-full px-4 py-3 border ${errors.name ? 'border-red-500' : 'border-gray-300'
                                        } rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-transparent outline-none`}
                                    placeholder="Nguyễn Văn A"
                                />
                                {errors.name && (
                                    <p className="text-sm text-red-500 mt-1">{errors.name}</p>
                                )}
                            </div>

                            {/* Email */}
                            <div>
                                <label className="block text-sm font-semibold text-gray-700 mb-2">
                                    Email <span className="text-red-500">*</span>
                                </label>
                                <input
                                    type="email"
                                    name="email"
                                    value={formData.email}
                                    onChange={handleChange}
                                    className={`w-full px-4 py-3 border ${errors.email ? 'border-red-500' : 'border-gray-300'
                                        } rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-transparent outline-none`}
                                    placeholder="example@email.com"
                                />
                                {errors.email && (
                                    <p className="text-sm text-red-500 mt-1">{errors.email}</p>
                                )}
                            </div>

                            {/* Số điện thoại */}
                            <div>
                                <label className="block text-sm font-semibold text-gray-700 mb-2">
                                    Số Điện Thoại <span className="text-red-500">*</span>
                                </label>
                                <input
                                    type="tel"
                                    name="phone"
                                    value={formData.phone}
                                    onChange={handleChange}
                                    className={`w-full px-4 py-3 border ${errors.phone ? 'border-red-500' : 'border-gray-300'
                                        } rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-transparent outline-none`}
                                    placeholder="0123 456 789"
                                />
                                {errors.phone && (
                                    <p className="text-sm text-red-500 mt-1">{errors.phone}</p>
                                )}
                            </div>

                            {/* Nội dung */}
                            <div>
                                <label className="block text-sm font-semibold text-gray-700 mb-2">
                                    Nội Dung <span className="text-red-500">*</span>
                                </label>
                                <textarea
                                    name="content"
                                    value={formData.content}
                                    onChange={handleChange}
                                    rows={5}
                                    className={`w-full px-4 py-3 border ${errors.content ? 'border-red-500' : 'border-gray-300'
                                        } rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-transparent outline-none resize-none`}
                                    placeholder="Nhập nội dung tin nhắn của bạn..."
                                />
                                {errors.content && (
                                    <p className="text-sm text-red-500 mt-1">{errors.content}</p>
                                )}
                            </div>

                            {/* Nút gửi */}
                            <button
                                onClick={handleSubmit}
                                disabled={sendContact}
                                className={`w-full bg-gradient-to-r from-indigo-600 to-purple-600 text-white font-semibold py-3 px-6 rounded-lg shadow-lg flex items-center justify-center gap-2 transition duration-300 ${loading
                                    ? 'opacity-70 cursor-not-allowed'
                                    : 'hover:from-indigo-700 hover:to-purple-700 hover:scale-105 hover:shadow-xl'
                                    } ${sendContact ? 'opacity-70 cursor-not-allowed' : ''}`}
                            >
                                <Send size={20} />
                                {loading ? 'Đang gửi...' : sendContact ? 'Gửi thành công' : 'Gửi'}
                            </button>
                        </div>

                        {showSuccess && (
                            <div className="mt-6 p-4 bg-green-100 border border-green-400 text-green-700 rounded-lg">
                                <p className="font-semibold">✓ Gửi thành công!</p>
                                <p className="text-sm">Chúng tôi sẽ liên hệ với bạn sớm nhất có thể.</p>
                            </div>
                        )}
                    </div>

                    {/* Bản đồ + thông tin liên hệ */}
                    <div className="space-y-8">
                        {/* Bản đồ */}
                        <div className="bg-white rounded-2xl shadow-xl overflow-hidden h-80">
                            <iframe
                                src="https://www.google.com/maps/embed?pb=!1m18!1m12!1m3!1d501726.4831089374!2d106.41505105!3d10.754716449999999!2m3!1f0!2f0!3f0!3m2!1i1024!2i768!4f13.1!3m3!1m2!1s0x317529292e8d3dd1%3A0xf15f5aad773c112b!2zVGjDoG5oIHBo4buRIEjhu5MgQ2jDrSBNaW5oLCBWaeG7h3QgTmFt!5e0!3m2!1svi!2s!4v1234567890123!5m2!1svi!2s"
                                width="100%"
                                height="100%"
                                style={{ border: 0 }}
                                allowFullScreen
                                loading="lazy"
                                referrerPolicy="no-referrer-when-downgrade"
                                title="Bản đồ vị trí"
                            />
                        </div>

                        {/* Thông tin liên hệ */}
                        <div className="grid grid-cols-1 gap-4">
                            <div className="bg-white rounded-xl p-6 shadow-lg hover:shadow-xl transition duration-300">
                                <div className="flex items-start gap-4">
                                    <div className="bg-indigo-100 p-3 rounded-lg">
                                        <MapPin className="text-indigo-600" size={24} />
                                    </div>
                                    <div>
                                        <h3 className="font-semibold text-gray-800 mb-1">Địa Chỉ</h3>
                                        <p className="text-gray-600">
                                            {setting?.address}
                                        </p>
                                    </div>
                                </div>
                            </div>

                            <div className="bg-white rounded-xl p-6 shadow-lg hover:shadow-xl transition duration-300">
                                <div className="flex items-start gap-4">
                                    <div className="bg-purple-100 p-3 rounded-lg">
                                        <Mail className="text-purple-600" size={24} />
                                    </div>
                                    <div>
                                        <h3 className="font-semibold text-gray-800 mb-1">Email</h3>
                                        <p className="text-gray-600">{setting?.email}</p>
                                    </div>
                                </div>
                            </div>

                            <div className="bg-white rounded-xl p-6 shadow-lg hover:shadow-xl transition duration-300">
                                <div className="flex items-start gap-4">
                                    <div className="bg-blue-100 p-3 rounded-lg">
                                        <Phone className="text-blue-600" size={24} />
                                    </div>
                                    <div>
                                        <h3 className="font-semibold text-gray-800 mb-1">Điện Thoại</h3>
                                        <p className="text-gray-600">{setting?.phone}</p>
                                    </div>
                                </div>
                            </div>
                        </div>
                    </div>
                </div>
            </div>
        </div>
    );
}
