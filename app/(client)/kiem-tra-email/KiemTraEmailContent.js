'use client';

import { useEffect, useMemo, useState } from 'react';
import { useSearchParams } from 'next/navigation';

const API_BASE = process.env.NEXT_PUBLIC_API_BASE_URL || '';

export default function KiemTraEmailPage() {
    const params = useSearchParams();
    const [email, setEmail] = useState('');
    const [sending, setSending] = useState(false);
    const [serverMsg, setServerMsg] = useState('');
    const [serverErr, setServerErr] = useState('');
    const [cooldown, setCooldown] = useState(0);

    // Lấy email từ query (?email=...)
    useEffect(() => {
        const e = params.get('email') || '';
        setEmail(e);
    }, [params]);

    // Cooldown đếm ngược
    useEffect(() => {
        if (cooldown <= 0) return;
        const t = setInterval(() => setCooldown((c) => c - 1), 1000);
        return () => clearInterval(t);
    }, [cooldown]);

    // Lấy domain từ email
    const emailDomain = useMemo(() => {
        const parts = String(email).split('@');
        return parts.length === 2 ? parts[1].trim().toLowerCase() : '';
    }, [email]);

    // Xác định host (gmail/outlook/hotmail/yahoo/khác)
    const provider = useMemo(() => {
        if (!emailDomain) return '';
        if (emailDomain.includes('gmail.')) return 'gmail';
        if (emailDomain.includes('yahoo.')) return 'yahoo';
        if (emailDomain.includes('outlook.') || emailDomain.includes('hotmail.')) return 'outlook';
        return 'other';
    }, [emailDomain]);

    // Link mở hộp thư
    const mailboxLink = useMemo(() => {
        if (!emailDomain) return 'https://mail.google.com/';
        switch (provider) {
            case 'gmail':
                return 'https://mail.google.com/';
            case 'yahoo':
                return 'https://mail.yahoo.com/';
            case 'outlook':
                return 'https://outlook.live.com/mail/';
            default:
                // Trỏ domain gốc: https://<domain>
                return `https://${emailDomain}`;
        }
    }, [provider, emailDomain]);

    const onResend = async () => {
        setServerMsg('');
        setServerErr('');

        if (!email) {
            setServerErr('Không tìm thấy email. Vui lòng đăng ký lại hoặc nhập đúng đường dẫn.');
            return;
        }
        if (cooldown > 0 || sending) return;

        try {
            setSending(true);
            const res = await fetch(`${API_BASE}/auth/resend-verification`, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ email }),
            });

            const data = await res.json().catch(() => ({}));

            if (!res.ok) {
                throw new Error(data?.message || 'Gửi lại thất bại.');
            }

            setServerMsg(data?.message || 'Đã gửi lại email xác thực. Vui lòng kiểm tra hộp thư!');
            setCooldown(60);
        } catch (e) {
            setServerErr(e.message || 'Có lỗi xảy ra khi gửi lại email.');
        } finally {
            setSending(false);
        }
    };

    return (
        <div className="min-h-screen bg-gradient-to-br from-blue-50 via-indigo-50 to-purple-50 flex items-center justify-center px-4 py-10 pt-40">
            <div className="w-full max-w-2xl">
                <div className="bg-white rounded-3xl shadow-2xl overflow-hidden border border-blue-100">
                    {/* Header */}
                    <div className="bg-gradient-to-r from-blue-600 via-indigo-600 to-purple-600 px-8 py-12 text-center relative overflow-hidden">
                        <div className="absolute top-0 right-0 w-64 h-64 bg-white/10 rounded-full blur-3xl" />
                        <div className="absolute bottom-0 left-0 w-64 h-64 bg-white/10 rounded-full blur-3xl" />

                        <div className="relative z-10">
                            <div className="inline-flex items-center justify-center w-20 h-20 rounded-2xl bg-white/20 backdrop-blur-sm shadow-xl mb-4 animate-bounce-slow">
                                <svg className="w-10 h-10 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 8l7.89 5.26a2 2 0 002.22 0L21 8M5 19h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v10a2 2 0 002 2z" />
                                </svg>
                            </div>
                            <h1 className="text-3xl sm:text-4xl font-bold text-white mb-3">Kiểm tra email của bạn</h1>
                            <p className="text-blue-100 text-lg max-w-md mx-auto">
                                Chúng tôi đã gửi liên kết xác thực đến email của bạn
                            </p>
                        </div>
                    </div>

                    {/* Content */}
                    <div className="p-8 space-y-6">
                        {/* Email box */}
                        <div className="bg-gradient-to-r from-blue-50 to-indigo-50 rounded-2xl p-6 border-2 border-blue-200">
                            <div className="flex items-center gap-4">
                                <div className="flex-shrink-0 w-12 h-12 rounded-xl bg-blue-600 flex items-center justify-center">
                                    <svg className="w-6 h-6 text-white" fill="currentColor" viewBox="0 0 20 20">
                                        <path d="M2.003 5.884L10 9.882l7.997-3.998A2 2 0 0016 4H4a2 2 0 00-1.997 1.884z" />
                                        <path d="M18 8.118l-8 4-8-4V14a2 2 0 002 2h12a2 2 0 002-2V8.118z" />
                                    </svg>
                                </div>
                                <div className="flex-1 min-w-0">
                                    <p className="text-sm text-gray-600 mb-1">Email xác thực đã gửi đến:</p>
                                    <p className="text-lg font-bold text-gray-900 truncate">
                                        {email || '(không có email)'}
                                    </p>
                                </div>
                            </div>
                        </div>

                        {/* Server messages */}
                        {serverMsg && (
                            <div className="bg-green-50 border-2 border-green-200 text-green-800 p-4 rounded-xl flex items-start gap-3 animate-fade-in">
                                <svg className="w-5 h-5 text-green-600 mt-0.5 flex-shrink-0" fill="currentColor" viewBox="0 0 20 20">
                                    <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z" clipRule="evenodd" />
                                </svg>
                                <span className="text-sm font-medium">{serverMsg}</span>
                            </div>
                        )}
                        {serverErr && (
                            <div className="bg-red-50 border-2 border-red-200 text-red-800 p-4 rounded-xl flex items-start gap-3 animate-fade-in">
                                <svg className="w-5 h-5 text-red-600 mt-0.5 flex-shrink-0" fill="currentColor" viewBox="0 0 20 20">
                                    <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zM8.707 7.293a1 1 0 00-1.414 1.414L8.586 10l-1.293 1.293a1 1 0 101.414 1.414L10 11.414l1.293 1.293a1 1 0 001.414-1.414L11.414 10l1.293-1.293a1 1 0 00-1.414-1.414L10 8.586 8.707 7.293z" clipRule="evenodd" />
                                </svg>
                                <span className="text-sm font-medium">{serverErr}</span>
                            </div>
                        )}

                        {/* Instructions */}
                        <div className="bg-gradient-to-r from-purple-50 to-pink-50 rounded-2xl p-6 border border-purple-200">
                            <h3 className="text-lg font-bold text-gray-900 mb-4 flex items-center gap-2">
                                <svg className="w-5 h-5 text-purple-600" fill="currentColor" viewBox="0 0 20 20">
                                    <path fillRule="evenodd" d="M18 10a8 8 0 11-16 0 8 8 0 0116 0zm-7-4a1 1 0 11-2 0 1 1 0 012 0zM9 9a1 1 0 000 2v3a1 1 0 001 1h1a1 1 0 100-2v-3a1 1 0 00-1-1H9z" clipRule="evenodd" />
                                </svg>
                                Hướng dẫn xác thực
                            </h3>
                            <ol className="space-y-3 text-sm text-gray-700">
                                <li className="flex gap-3">
                                    <span className="flex-shrink-0 w-6 h-6 rounded-full bg-purple-600 text-white flex items-center justify-center text-xs font-bold">1</span>
                                    <span>Mở hộp thư email của bạn</span>
                                </li>
                                <li className="flex gap-3">
                                    <span className="flex-shrink-0 w-6 h-6 rounded-full bg-purple-600 text-white flex items-center justify-center text-xs font-bold">2</span>
                                    <span>Tìm email từ chúng tôi (kiểm tra cả thư mục Spam/Quảng cáo)</span>
                                </li>
                                <li className="flex gap-3">
                                    <span className="flex-shrink-0 w-6 h-6 rounded-full bg-purple-600 text-white flex items-center justify-center text-xs font-bold">3</span>
                                    <span>Nhấp nút “Xác thực tài khoản” trong email</span>
                                </li>
                            </ol>
                        </div>

                        {/* Actions */}
                        <div className="space-y-3">
                            <a
                                href={mailboxLink}
                                target="_blank"
                                rel="noreferrer"
                                className="w-full inline-flex items-center justify-center gap-3 bg-gradient-to-r from-blue-600 via-indigo-600 to-purple-600 text-white py-4 rounded-xl font-bold text-lg hover:shadow-2xl hover:scale-105 transition-all duration-300 group"
                            >
                                <svg className="w-6 h-6 group-hover:rotate-12 transition-transform" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10 6H6a2 2 0 00-2 2v10a2 2 0 002 2h10a2 2 0 002-2v-4M14 4h6m0 0v6m0-6L10 14" />
                                </svg>
                                Mở hộp thư {provider === 'gmail' ? 'Gmail' : provider === 'yahoo' ? 'Yahoo' : provider === 'outlook' ? 'Outlook/Hotmail' : emailDomain}
                            </a>

                            <button
                                onClick={onResend}
                                disabled={sending || cooldown > 0}
                                className="w-full inline-flex items-center justify-center gap-3 bg-gray-100 text-gray-800 py-4 rounded-xl font-bold hover:bg-gray-200 transition-all disabled:opacity-50 disabled:cursor-not-allowed group"
                            >
                                <svg className={`w-5 h-5 ${sending ? 'animate-spin' : 'group-hover:translate-x-1 transition-transform'}`} fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 19l9 2-9-18-9 18 9-2zm0 0v-8" />
                                </svg>
                                {sending ? 'Đang gửi...' : cooldown > 0 ? `Gửi lại sau ${cooldown}s` : 'Gửi lại email xác thực'}
                            </button>
                        </div>

                        {/* Extra */}
                        <div className="bg-amber-50 rounded-xl p-4 border-2 border-amber-200 flex items-start gap-3">
                            <svg className="w-5 h-5 text-amber-600 mt-0.5 flex-shrink-0" fill="currentColor" viewBox="0 0 20 20">
                                <path d="M11 3a1 1 0 10-2 0v1a1 1 0 102 0V3zM15.657 5.757a1 1 0 00-1.414-1.414l-.707.707a1 1 0 001.414 1.414l.707-.707zM18 10a1 1 0 01-1 1h-1a1 1 0 110-2h1a1 1 0 011 1zM5.05 6.464A1 1 0 106.464 5.05l-.707-.707a1 1 0 00-1.414 1.414l.707.707zM5 10a1 1 0 01-1 1H3a1 1 0 110-2h1a1 1 0 011 1zM8 16v-1h4v1a2 2 0 11-4 0zM12 14c.015-.34.208-.646.477-.859a4 4 0 10-4.954 0c.27.213.462.519.476.859h4.002z" />
                            </svg>
                            <div className="flex-1">
                                <p className="text-sm font-semibold text-amber-900 mb-1">Mẹo hữu ích</p>
                                <p className="text-xs text-amber-800">
                                    Thêm địa chỉ email của chúng tôi vào danh bạ để tránh vào Spam. Kiểm tra cả tab "Promotions/Quảng cáo" nếu dùng Gmail.
                                </p>
                            </div>
                        </div>
                    </div>
                </div>

                {/* Bottom help */}
                <div className="mt-6 text-center">
                    <p className="text-sm text-gray-600">
                        Vẫn gặp vấn đề?{' '}
                        <a href="/lien-he" className="text-blue-600 hover:text-blue-700 font-semibold hover:underline">
                            Liên hệ hỗ trợ
                        </a>
                    </p>
                </div>
            </div>

            <style jsx>{`
        @keyframes bounce-slow {
          0%, 100% {
            transform: translateY(-5%);
            animation-timing-function: cubic-bezier(0.8, 0, 1, 1);
          }
          50% {
            transform: translateY(0);
            animation-timing-function: cubic-bezier(0, 0, 0.2, 1);
          }
        }
        @keyframes fade-in {
          from { opacity: 0; transform: translateY(-10px); }
          to { opacity: 1; transform: translateY(0); }
        }
        .animate-bounce-slow { animation: bounce-slow 2s infinite; }
        .animate-fade-in { animation: fade-in 0.3s ease-out; }
      `}</style>
        </div>
    );
}

