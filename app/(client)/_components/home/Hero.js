'use client'
import React, { useEffect, useState } from 'react'
import Image from 'next/image'

import { Swiper, SwiperSlide } from 'swiper/react'
import { Pagination, Autoplay, EffectFade } from 'swiper/modules'

import 'swiper/css'
import 'swiper/css/pagination'
import 'swiper/css/effect-fade'

const API_BASE = process.env.NEXT_PUBLIC_API_BASE_URL

const Hero = () => {
    const [sliderData, setSliderData] = useState([])
    const [state, setState] = useState({ loading: true, error: null })

    useEffect(() => {
        (async () => {
            try {
                const res = await fetch(`${API_BASE}/banner`)
                if (!res.ok) throw new Error(`Slider HTTP ${res.status}`)
                const json = await res.json()
                setSliderData(Array.isArray(json) ? json : [])
                setState({ loading: false, error: null })
            } catch (e) {
                if (e.name !== 'AbortError') {
                    setState({ loading: false, error: e.message || 'Fetch error' })
                }
            }
        })()
    }, [])

    const features = [
        {
            icon: "🚚",
            title: "Miễn phí vận chuyển",
            description: "Cho đơn hàng từ 200.000₫",
            gradient: "from-blue-500 via-blue-600 to-cyan-500",
            bgColor: "bg-gradient-to-r from-blue-50 to-cyan-50",
            iconBg: "bg-gradient-to-r from-blue-100 to-cyan-100",
            textColor: "text-blue-600"
        },
        {
            icon: "🔄",
            title: "Đổi trả dễ dàng",
            description: "Trong vòng 7 ngày",
            gradient: "from-emerald-500 via-green-600 to-teal-500",
            bgColor: "bg-gradient-to-r from-emerald-50 to-teal-50",
            iconBg: "bg-gradient-to-r from-emerald-100 to-teal-100",
            textColor: "text-emerald-600"
        },
        {
            icon: "🛡️",
            title: "Bảo mật 100%",
            description: "Thanh toán an toàn",
            gradient: "from-purple-500 via-violet-600 to-indigo-500",
            bgColor: "bg-gradient-to-r from-purple-50 to-indigo-50",
            iconBg: "bg-gradient-to-r from-purple-100 to-indigo-100",
            textColor: "text-purple-600"
        },
        {
            icon: "💬",
            title: "Hỗ trợ 24/7",
            description: "Tư vấn mọi lúc",
            gradient: "from-orange-500 via-red-500 to-pink-500",
            bgColor: "bg-gradient-to-r from-orange-50 to-pink-50",
            iconBg: "bg-gradient-to-r from-orange-100 to-pink-100",
            textColor: "text-orange-600"
        }
    ]

    if (state.loading) {
        return (
            <div className="min-h-screen">
                <section className="relative overflow-hidden">
                    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 pt-8">
                        <div className="relative w-full h-[400px] sm:h-[500px] lg:h-[600px] rounded-3xl overflow-hidden shadow-2xl">
                            <div className="absolute inset-0 bg-gradient-to-r from-gray-200 via-gray-300 to-gray-200 animate-pulse">
                                <div className="absolute inset-0 bg-gradient-to-r from-transparent via-white/20 to-transparent animate-shimmer"></div>
                            </div>
                            <div className="absolute left-8 sm:left-16 top-1/2 -translate-y-1/2 space-y-4">
                                <div className="h-12 w-80 bg-white/30 rounded-lg animate-pulse"></div>
                                <div className="h-6 w-60 bg-white/20 rounded-lg animate-pulse"></div>
                                <div className="h-12 w-32 bg-white/40 rounded-full animate-pulse"></div>
                            </div>
                        </div>
                    </div>
                </section>

                <section className="py-20">
                    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
                        <div className="text-center mb-16 space-y-4">
                            <div className="h-10 w-80 bg-gray-200 rounded-lg mx-auto animate-pulse"></div>
                            <div className="h-6 w-96 bg-gray-200 rounded-lg mx-auto animate-pulse"></div>
                        </div>
                        <div className="grid gap-8 md:grid-cols-2 lg:grid-cols-4">
                            {[1, 2, 3, 4].map((i) => (
                                <div key={i} className="bg-white rounded-3xl p-8 shadow-lg">
                                    <div className="w-20 h-20 bg-gray-200 rounded-2xl mb-6 animate-pulse"></div>
                                    <div className="h-6 bg-gray-200 rounded-lg mb-3 animate-pulse"></div>
                                    <div className="h-4 bg-gray-200 rounded-lg animate-pulse"></div>
                                </div>
                            ))}
                        </div>
                    </div>
                </section>
            </div>
        )
    }

    if (state.error) {
        return (
            <section className="relative overflow-hidden py-20">
                <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
                    <div className="text-center">
                        <h3 className="text-2xl font-bold text-gray-900 mb-3">Oops! Có lỗi xảy ra</h3>
                        <p className="text-red-600 px-4 py-2 rounded-xl inline-block">{state.error}</p>
                    </div>
                </div>
            </section>
        )
    }

    return (
        <div className="min-h-screen">
            <section className="relative overflow-hidden pb-20">
                <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 pt-8 relative">
                    <Swiper
                        modules={[Pagination, Autoplay, EffectFade]}
                        loop
                        effect="fade"
                        autoplay={{
                            delay: 5000,
                            disableOnInteraction: false,
                        }}
                        pagination={{
                            clickable: true,
                            bulletClass: 'swiper-pagination-bullet !w-3 !h-3 !bg-white/60 !opacity-100',
                            bulletActiveClass: 'swiper-pagination-bullet-active !bg-white !scale-125'
                        }}
                        className="rounded-3xl overflow-hidden shadow-2xl hero-swiper"
                    >
                        {sliderData.map((slide, index) => (
                            <SwiperSlide key={slide.id}>
                                <div className="relative w-full h-[400px] sm:h-[500px] lg:h-[600px] bg-black overflow-hidden">
                                    <Image
                                        src={slide?.image}
                                        alt={slide?.name}
                                        fill
                                        className="object-cover transition-transform duration-[8000ms] hover:scale-105"
                                        priority={index === 0}
                                        sizes="100vw"
                                        unoptimized
                                    />
                                    <div className="absolute inset-0 bg-gradient-to-r from-black/70 via-black/30 to-transparent"></div>
                                    <div className="absolute inset-0 bg-gradient-to-t from-black/50 via-transparent to-transparent"></div>

                                    <div className="absolute left-8 sm:left-16 top-1/2 -translate-y-1/2 text-white max-w-lg z-10">
                                        <div className="space-y-6 transform transition-all duration-1000">
                                            <div className="space-y-3">
                                                <h1 className="font-bold text-2xl sm:text-4xl lg:text-5xl leading-tight">
                                                    {slide.name}
                                                </h1>
                                                {slide.description && (
                                                    <p className="text-sm sm:text-lg text-white/90 leading-relaxed max-w-md">
                                                        {slide.description}
                                                    </p>
                                                )}
                                            </div>

                                            <div className="flex gap-4">
                                                <a
                                                    className="group relative inline-flex items-center justify-center font-semibold text-white text-sm sm:text-base rounded-2xl bg-gradient-to-r from-blue-600 to-blue-700 py-3 sm:py-4 px-8 sm:px-10 hover:from-blue-700 hover:to-blue-800 transition-all duration-300 transform hover:scale-105 hover:shadow-2xl shadow-lg"
                                                    href={slide.link}
                                                >
                                                    <span className="relative z-10">MUA NGAY</span>
                                                    <div className="absolute inset-0 rounded-2xl bg-gradient-to-r from-white/20 to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-300"></div>
                                                </a>

                                                <button className="group inline-flex items-center justify-center font-medium text-white text-sm sm:text-base rounded-2xl border-2 border-white/30 py-3 sm:py-4 px-8 sm:px-10 hover:bg-white/10 hover:border-white/50 transition-all duration-300 backdrop-blur-sm">
                                                    <span>Tìm hiểu thêm</span>
                                                    <span className="ml-2 transform group-hover:translate-x-1 transition-transform duration-300">→</span>
                                                </button>
                                            </div>
                                        </div>
                                    </div>

                                    <div className="absolute top-8 right-8 w-20 h-20 bg-white/10 rounded-full backdrop-blur-sm animate-pulse"></div>
                                    <div className="absolute bottom-8 right-8 w-12 h-12 bg-blue-500/20 rounded-full backdrop-blur-sm animate-bounce" style={{ animationDelay: '1s' }}></div>
                                </div>
                            </SwiperSlide>
                        ))}
                    </Swiper>
                </div>
            </section>

            <section className="py-20 relative overflow-hidden">
                <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 relative">
                    <div className="text-center mb-16 space-y-6">
                        <div className="space-y-4">
                            <h2 className="text-3xl sm:text-4xl lg:text-5xl font-bold bg-gradient-to-r from-gray-900 via-blue-900 to-purple-900 bg-clip-text text-transparent">
                                Tại sao chọn chúng tôi?
                            </h2>
                            <div className="w-24 h-1 bg-gradient-to-r from-blue-500 to-purple-500 mx-auto rounded-full"></div>
                        </div>
                        <p className="text-gray-600 text-lg leading-relaxed max-w-3xl mx-auto">
                            Chúng tôi cam kết mang đến trải nghiệm mua sắm tuyệt vời nhất với những dịch vụ chất lượng cao và sự chăm sóc khách hàng tận tâm
                        </p>
                    </div>

                    <div className="grid gap-8 md:grid-cols-2 lg:grid-cols-4">
                        {features.map((feature, index) => (
                            <div
                                key={index}
                                className="group relative bg-white rounded-3xl p-8 shadow-lg hover:shadow-2xl transition-all duration-500 hover:-translate-y-3 border border-gray-100 hover:border-transparent overflow-hidden"
                                style={{
                                    animationDelay: `${index * 100}ms`
                                }}
                            >
                                <div className={`absolute inset-0 bg-gradient-to-br ${feature.gradient} opacity-0 group-hover:opacity-5 transition-opacity duration-500`}></div>

                                <div className="absolute inset-0 bg-gradient-to-r from-transparent via-white/5 to-transparent -translate-x-full group-hover:translate-x-full transition-transform duration-1000"></div>

                                <div className="relative z-10">
                                    <div className={`inline-flex items-center justify-center w-20 h-20 ${feature.iconBg} rounded-2xl mb-6 group-hover:scale-110 group-hover:rotate-3 transition-all duration-500 shadow-lg`}>
                                        <span className="text-3xl filter group-hover:brightness-110 transition-all duration-300">
                                            {feature.icon}
                                        </span>
                                    </div>

                                    <div className="space-y-3">
                                        <h3 className="text-xl font-bold text-gray-900 group-hover:text-gray-800 transition-colors duration-300">
                                            {feature.title}
                                        </h3>
                                        <p className="text-gray-600 text-sm leading-relaxed group-hover:text-gray-700 transition-colors duration-300">
                                            {feature.description}
                                        </p>
                                    </div>

                                    <div className="absolute top-6 right-6 opacity-0 group-hover:opacity-100 transition-all duration-300 transform translate-x-2 group-hover:translate-x-0">
                                        <div className={`w-8 h-8 rounded-full bg-gradient-to-r ${feature.gradient} flex items-center justify-center shadow-lg`}>
                                            <span className="text-white text-sm">→</span>
                                        </div>
                                    </div>

                                    <div className={`absolute bottom-0 left-0 h-1 bg-gradient-to-r ${feature.gradient} w-0 group-hover:w-full transition-all duration-500 rounded-b-3xl`}></div>
                                </div>
                            </div>
                        ))}
                    </div>
                </div>
            </section>

            <style jsx>{`
                .hero-swiper .swiper-pagination {
                    bottom: 20px !important;
                }
                
                @keyframes shimmer {
                    0% { transform: translateX(-100%); }
                    100% { transform: translateX(100%); }
                }
                
                .animate-shimmer {
                    animation: shimmer 2s infinite;
                }
            `}</style>
        </div>
    )
}

export default Hero