"use client"
import { useEffect, useState } from "react";

export default function VerifySuccessPage() {
    const [countdown, setCountdown] = useState(5);

    useEffect(() => {
        const iv = setInterval(() => {
            setCountdown((c) => {
                if (c <= 1) {
                    // Redirect to login page
                    window.location.href = "/dang-nhap";
                    return 0;
                }
                return c - 1;
            });
        }, 1000);
        return () => clearInterval(iv);
    }, []);

    return (
        <div className="min-h-screen bg-gradient-to-br from-green-50 via-emerald-50 to-teal-50 flex items-center justify-center px-4 py-12 pt-40">
            <div className="max-w-2xl w-full">
                {/* Main Card */}
                <div className="bg-white rounded-3xl shadow-2xl p-8 sm:p-12 text-center border border-green-100 relative overflow-hidden">
                    {/* Background Decoration */}
                    <div className="absolute top-0 right-0 w-64 h-64 bg-gradient-to-br from-green-100 to-emerald-100 rounded-full blur-3xl opacity-30 -z-10" />
                    <div className="absolute bottom-0 left-0 w-64 h-64 bg-gradient-to-tr from-teal-100 to-cyan-100 rounded-full blur-3xl opacity-30 -z-10" />

                    {/* Success Animation Container */}
                    <div className="relative mb-6">
                        <div className="mx-auto w-24 h-24 rounded-full bg-gradient-to-br from-green-400 to-emerald-500 flex items-center justify-center shadow-2xl animate-bounce-slow">
                            <svg className="w-14 h-14 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={3} d="M5 13l4 4L19 7" />
                            </svg>
                        </div>
                        {/* Ripple Effect */}
                        <div className="absolute inset-0 flex items-center justify-center">
                            <div className="w-24 h-24 rounded-full border-4 border-green-300 animate-ping opacity-75" />
                        </div>
                    </div>

                    {/* Title */}
                    <h1 className="text-3xl sm:text-4xl font-extrabold text-gray-900 mb-3 bg-gradient-to-r from-green-600 to-emerald-600 bg-clip-text ">
                        Xác thực thành công! 🎉
                    </h1>

                    <p className="text-lg text-gray-600 mb-2">
                        Tài khoản của bạn đã được kích hoạt
                    </p>

                    <p className="text-gray-500 mb-8 max-w-md mx-auto">
                        Chúc mừng! Bạn đã hoàn tất quá trình đăng ký. Giờ đây bạn có thể đăng nhập và bắt đầu sử dụng dịch vụ của chúng tôi.
                    </p>

                    {/* Benefits Cards */}
                    <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 mb-8 max-w-2xl mx-auto">
                        <div className="bg-gradient-to-br from-green-50 to-emerald-50 rounded-2xl p-4 border border-green-100">
                            <div className="text-3xl mb-2">🔓</div>
                            <p className="text-sm font-semibold text-gray-700">Truy cập đầy đủ</p>
                        </div>
                        <div className="bg-gradient-to-br from-blue-50 to-indigo-50 rounded-2xl p-4 border border-blue-100">
                            <div className="text-3xl mb-2">🎁</div>
                            <p className="text-sm font-semibold text-gray-700">Ưu đãi độc quyền</p>
                        </div>
                        <div className="bg-gradient-to-br from-purple-50 to-pink-50 rounded-2xl p-4 border border-purple-100">
                            <div className="text-3xl mb-2">⚡</div>
                            <p className="text-sm font-semibold text-gray-700">Trải nghiệm nhanh</p>
                        </div>
                    </div>

                    {/* CTA Button */}
                    <div className="mb-6">
                        <a
                            href="/dang-nhap"
                            className="inline-flex items-center gap-3 bg-gradient-to-r from-green-500 via-emerald-500 to-teal-500 text-white px-8 py-4 rounded-2xl font-bold text-lg hover:shadow-2xl hover:scale-105 transition-all duration-300 group"
                        >
                            <svg className="w-6 h-6 group-hover:translate-x-1 transition-transform" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M11 16l-4-4m0 0l4-4m-4 4h14m-5 4v1a3 3 0 01-3 3H6a3 3 0 01-3-3V7a3 3 0 013-3h7a3 3 0 013 3v1" />
                            </svg>
                            Đăng nhập ngay
                        </a>
                    </div>

                    {/* Countdown */}
                    <div className="inline-flex items-center gap-2 bg-gradient-to-r from-gray-100 to-gray-50 px-6 py-3 rounded-full border border-gray-200 shadow-sm">
                        <svg className="w-5 h-5 text-gray-500 animate-spin-slow" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" />
                        </svg>
                        <p className="text-sm text-gray-600">
                            Tự động chuyển trong{" "}
                            <span className="font-bold text-green-600 text-lg">{countdown}</span>
                            <span className="text-gray-500">s</span>
                        </p>
                    </div>

                    {/* Divider */}
                    <div className="mt-8 pt-6 border-t border-gray-100">
                        <div className="flex items-start gap-3 bg-blue-50 border border-blue-100 rounded-xl p-4 text-left">
                            <svg className="w-5 h-5 text-blue-500 mt-0.5 flex-shrink-0" fill="currentColor" viewBox="0 0 20 20">
                                <path fillRule="evenodd" d="M18 10a8 8 0 11-16 0 8 8 0 0116 0zm-7-4a1 1 0 11-2 0 1 1 0 012 0zM9 9a1 1 0 000 2v3a1 1 0 001 1h1a1 1 0 100-2v-3a1 1 0 00-1-1H9z" clipRule="evenodd" />
                            </svg>
                            <div>
                                <p className="text-sm font-semibold text-blue-900 mb-1">Lưu ý bảo mật</p>
                                <p className="text-xs text-blue-700 leading-relaxed">
                                    Nếu bạn không thực hiện đăng ký này, có thể ai đó đã sử dụng email của bạn. Vui lòng liên hệ với chúng tôi ngay để được hỗ trợ.
                                </p>
                            </div>
                        </div>
                    </div>
                </div>

                {/* Bottom Help Link */}
                <div className="mt-6 text-center">
                    <p className="text-sm text-gray-500">
                        Cần hỗ trợ?{" "}
                        <a href="/ho-tro" className="text-green-600 hover:text-green-700 font-semibold hover:underline">
                            Liên hệ với chúng tôi
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
        @keyframes spin-slow {
          from {
            transform: rotate(0deg);
          }
          to {
            transform: rotate(360deg);
          }
        }
        .animate-bounce-slow {
          animation: bounce-slow 2s infinite;
        }
        .animate-spin-slow {
          animation: spin-slow 3s linear infinite;
        }
      `}</style>
        </div>
    );
}