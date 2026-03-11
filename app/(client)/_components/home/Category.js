'use client'
import React, { useEffect, useState } from 'react'
import Image from 'next/image'
import Link from 'next/link'

import { Swiper, SwiperSlide } from 'swiper/react'
import { Autoplay, Navigation } from 'swiper/modules'

import 'swiper/css'
import 'swiper/css/navigation'
import 'swiper/css/effect-cards'

const API_BASE = process.env.NEXT_PUBLIC_API_BASE_URL

const Category = () => {
    const [categories, setCategories] = useState([])
    const [state, setState] = useState({ loading: true, error: null })
    const [swiperRef, setSwiperRef] = useState(null)

    useEffect(() => {
        (async () => {
            try {
                const res = await fetch(`${API_BASE}/getParent`)
                if (!res.ok) throw new Error(`Category HTTP ${res.status}`)
                const json = await res.json()

                setCategories(Array.isArray(json) ? json : []);

                setState({ loading: false, error: null })
            } catch (e) {
                if (e.name !== 'AbortError') {
                    setState({ loading: false, error: e.message || 'Fetch error' })
                }
            }
        })()
    }, [])

    const handlePrev = () => { swiperRef?.slidePrev() }
    const handleNext = () => { swiperRef?.slideNext() }

    if (state.loading) {
        return (
            <section className="overflow-hidden py-20 ">

                <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 relative">
                    <div className="flex items-center justify-between mb-16">
                        <div className="space-y-4">
                            <div className="flex items-center gap-4">
                                <div className="w-28 h-8 bg-gradient-to-r from-blue-200 via-purple-200 to-pink-200 rounded-full animate-pulse"></div>
                                <div className="w-32 h-6 bg-gradient-to-r from-orange-200 to-red-200 rounded-full animate-pulse"></div>
                            </div>
                            <div className="h-10 w-80 bg-gradient-to-r from-gray-200 via-gray-300 to-gray-200 rounded-xl animate-pulse"></div>
                            <div className="h-5 w-96 bg-gradient-to-r from-gray-200 via-gray-300 to-gray-200 rounded-lg animate-pulse"></div>
                        </div>
                        <div className="flex gap-4">
                            <div className="w-14 h-14 bg-white rounded-2xl shadow-lg animate-pulse"></div>
                            <div className="w-14 h-14 bg-white rounded-2xl shadow-lg animate-pulse"></div>
                        </div>
                    </div>

                    <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-6 gap-8">
                        {Array.from({ length: 5 }).filter(cat => cat?.parent_id === 0).map((_, i) => (
                            <div key={i} className="text-center group" style={{ animationDelay: `${i * 100}ms` }}>
                                <div className="relative mx-auto mb-6">
                                    <div className="w-28 h-28 sm:w-32 sm:h-32 bg-white rounded-3xl shadow-xl animate-pulse relative overflow-hidden">
                                        <div className="absolute inset-0 bg-gradient-to-br from-blue-100 via-purple-100 to-pink-100"></div>
                                        <div className="absolute inset-0 bg-gradient-to-r from-transparent via-white/40 to-transparent -translate-x-full animate-shimmer"></div>
                                    </div>
                                    <div className="absolute -top-2 -right-2 w-8 h-8 bg-gradient-to-r from-orange-200 to-pink-200 rounded-full animate-pulse"></div>
                                    <div className="absolute -bottom-3 -left-3 w-6 h-6 bg-gradient-to-r from-green-200 to-blue-200 rounded-full animate-pulse" style={{ animationDelay: '0.5s' }}></div>
                                </div>
                                <div className="space-y-2">
                                    <div className="h-5 w-20 mx-auto bg-gradient-to-r from-gray-200 via-gray-300 to-gray-200 rounded-lg animate-pulse"></div>
                                    <div className="h-3 w-16 mx-auto bg-gradient-to-r from-gray-200 via-gray-300 to-gray-200 rounded animate-pulse"></div>
                                </div>
                            </div>
                        ))}
                    </div>
                </div>
            </section>
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

    if (!categories.length) {
        return (
            <section className="relative overflow-hidden py-20">
                <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
                    <div className="text-center">
                        <h3 className="text-xl font-semibold text-gray-900 mb-2">Chưa có danh mục</h3>
                        <p className="text-gray-600">Hiện chưa có danh mục để hiển thị.</p>
                    </div>
                </div>
            </section>
        )
    }

    return (
        <section className="overflow-hidden py-10">
            <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 relative">
                <div className="flex flex-col lg:flex-row lg:items-center justify-between mb-16 gap-8">
                    <div className="space-y-6">
                        <h2 className="text-2xl sm:text-3xl font-bold text-gray-900">
                            Khám phá theo <span className="bg-gradient-to-r from-blue-600 to-purple-600 bg-clip-text text-transparent">danh mục</span>
                        </h2>
                        <p className="text-gray-600 max-w-md">
                            Tìm kiếm sản phẩm yêu thích của bạn qua các danh mục đa dạng
                        </p>

                    </div>

                    {/* --- ĐÃ SỬA: Chỉ hiển thị nút khi có > 6 categories --- */}
                    {categories.length > 6 && (
                        <div className="flex items-center gap-4">
                            <button
                                onClick={handlePrev}
                                className="flex items-center justify-center w-14 h-14 rounded-2xl bg-white/80 backdrop-blur-sm shadow-lg border border-white/20 text-gray-600 hover:border-blue-200 hover:text-blue-600 transition-all duration-300"
                                aria-label="Previous Slide"
                            >
                                <span className="fa-solid fa-arrow-left" aria-hidden="true"></span>
                            </button>

                            <button
                                onClick={handleNext}
                                className="flex items-center justify-center w-14 h-14 rounded-2xl bg-white/80 backdrop-blur-sm shadow-lg border border-white/20 text-gray-600 hover:border-blue-200 hover:text-blue-600 transition-all duration-300"
                                aria-label="Next Slide"
                            >
                                <span className="fa-solid fa-arrow-right" aria-hidden="true"></span>
                            </button>
                        </div>
                    )}
                </div>

                <div className="relative">
                    <Swiper
                        modules={[Autoplay, Navigation]}
                        onSwiper={setSwiperRef}
                        loop={categories.length > 6}
                        slidesPerView={6}
                        slidesPerGroup={1}
                        spaceBetween={32}
                        speed={1000}
                        autoplay={{
                            delay: 4000,
                            disableOnInteraction: false,
                            pauseOnMouseEnter: true,
                        }}
                        // --- ĐÃ SỬA: Tự động căn giữa khi không đủ slide ---
                        centerInsufficientSlides={true}
                        breakpoints={{
                            0: { slidesPerView: 2, spaceBetween: 16 },
                            480: { slidesPerView: 3, spaceBetween: 20 },
                            768: { slidesPerView: 4, spaceBetween: 24 },
                            1024: { slidesPerView: 5, spaceBetween: 28 },
                            1280: { slidesPerView: 6, spaceBetween: 32 },
                        }}
                        className="!pb-12"
                    >
                        {categories.map((category, index) => (
                            <SwiperSlide key={category.id} className='p-5'>
                                <div
                                    className="group relative"
                                    style={{
                                        animation: `fadeInUp 0.8s ease-out ${index * 0.1}s both`
                                    }}
                                >
                                    <Link
                                        href={`/danh-muc/${category.slug}`}
                                        className="block text-center"

                                    >
                                        <div className="relative mx-auto mb-6">
                                            <div className="relative mx-auto flex h-28 w-28 sm:h-32 sm:w-32 items-center justify-center rounded-3xl bg-white shadow-xl transition-all duration-500 group-hover:scale-110 border border-white/50 group-hover:border-blue-200/50 overflow-hidden">
                                                <div className="absolute inset-0 bg-gradient-to-br from-blue-500/0 via-purple-500/0 to-pink-500/0 transition-all duration-500 group-hover:from-blue-500/10 group-hover:via-purple-500/5 group-hover:to-pink-500/10" />

                                                <div className="absolute inset-0 rounded-3xl bg-gradient-to-r from-blue-500 via-purple-500 to-pink-500 p-0.5 opacity-0 group-hover:opacity-100 transition-opacity duration-500">
                                                    <div className="w-full h-full rounded-3xl bg-white"></div>
                                                </div>

                                                <div className="relative z-20 p-4">
                                                    <Image
                                                        src={category.image}
                                                        alt={category.name}
                                                        width={56}
                                                        height={56}
                                                        className="h-14 w-14 sm:h-16 sm:w-16 object-contain transition-all duration-500 group-hover:scale-110 filter group-hover:brightness-110"
                                                        unoptimized
                                                    />
                                                </div>

                                                <div className="absolute -bottom-3 -left-3 flex gap-1 opacity-0 group-hover:opacity-100 transition-all duration-500">
                                                    <div className="w-2 h-2 bg-blue-400 rounded-full animate-bounce"></div>
                                                    <div className="w-2 h-2 bg-purple-400 rounded-full animate-bounce" style={{ animationDelay: '0.1s' }}></div>
                                                    <div className="w-2 h-2 bg-pink-400 rounded-full animate-bounce" style={{ animationDelay: '0.2s' }}></div>
                                                </div>
                                            </div>
                                            <div className="absolute inset-0 mx-auto h-28 w-28 sm:h-32 sm:w-32 scale-125 rounded-3xl bg-gradient-to-r from-blue-500/0 via-purple-500/0 to-pink-500/0 opacity-0 blur-xl transition-all duration-500 group-hover:scale-135 group-hover:opacity-30 group-hover:from-blue-500/50 group-hover:via-purple-500/50 group-hover:to-pink-500/50"></div>
                                        </div>
                                        <div className="space-y-3">
                                            <h3 className="line-clamp-2 text-sm sm:text-base font-bold text-gray-800 transition-all duration-300 group-hover:text-transparent group-hover:bg-gradient-to-r group-hover:from-blue-600 group-hover:to-purple-600 group-hover:bg-clip-text leading-tight">
                                                {category.name}
                                            </h3>
                                        </div>
                                    </Link> {/* --- ĐÃ SỬA: Sửa </L> thành </Link> --- */}
                                </div>
                            </SwiperSlide>
                        ))}
                    </Swiper>
                </div>
            </div>
        </section>
    )
}

export default Category;


