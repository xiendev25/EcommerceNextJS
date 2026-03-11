'use client'
import React, { useEffect, useState } from 'react'

import { Swiper, SwiperSlide } from 'swiper/react'
import { Autoplay, Navigation } from 'swiper/modules'

import 'swiper/css'
import 'swiper/css/navigation'
import 'swiper/css/effect-cards'

import ProductCard from '../product/ProductCard'

const API_BASE = process.env.NEXT_PUBLIC_API_BASE_URL;

const NewProduct = () => {
    const [product, setProduct] = useState([])
    const [state, setState] = useState({ loading: true, error: null })
    const [swiperRef, setSwiperRef] = useState(null)

    useEffect(() => {
        (async () => {
            try {
                const res = await fetch(`${API_BASE}/getNewProduct`)
                if (!res.ok) throw new Error(`Product HTTP ${res.status}`)
                const json = await res.json()
                setProduct(Array.isArray(json) ? json : [])
                setState({ loading: false, error: null })
            } catch (e) {
                if (e.name !== 'AbortError') {
                    setState({ loading: false, error: e.message || 'Fetch error' })
                }
            }
        })()
    }, [])

    const handlePrev = () => {
        if (swiperRef) swiperRef.slidePrev()
    }

    const handleNext = () => {
        if (swiperRef) swiperRef.slideNext()
    }

    if (state.loading) {
        return (
            <section className=" overflow-hidden py-16 ">
                <div className="max-w-7xl mx-auto px-4 sm:px-6 xl:px-0">
                    <div className="flex items-center justify-between mb-12">
                        <div className="space-y-3">
                            <div className="w-64 h-8 bg-gradient-to-r from-gray-200 via-gray-300 to-gray-200 rounded-lg animate-pulse"></div>
                            <div className="w-48 h-4 bg-gradient-to-r from-gray-200 via-gray-300 to-gray-200 rounded animate-pulse"></div>
                        </div>
                        <div className="flex gap-3">
                            <div className="w-12 h-12 bg-gray-200 rounded-full animate-pulse"></div>
                            <div className="w-12 h-12 bg-gray-200 rounded-full animate-pulse"></div>
                        </div>
                    </div>
                    <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
                        {Array.from({ length: 4 }).map((_, i) => (
                            <div key={i} className="bg-white rounded-2xl shadow-lg p-6 animate-pulse">
                                <div className="aspect-square bg-gradient-to-br from-gray-200 via-gray-300 to-gray-200 rounded-xl mb-4 relative overflow-hidden">
                                    <div className="absolute inset-0 bg-gradient-to-r from-transparent via-white/30 to-transparent animate-shimmer"></div>
                                </div>
                                <div className="space-y-3">
                                    <div className="h-4 bg-gradient-to-r from-gray-200 via-gray-300 to-gray-200 rounded animate-pulse"></div>
                                    <div className="h-6 w-3/4 bg-gradient-to-r from-gray-200 via-gray-300 to-gray-200 rounded animate-pulse"></div>
                                    <div className="h-4 w-1/2 bg-gradient-to-r from-gray-200 via-gray-300 to-gray-200 rounded animate-pulse"></div>
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

    return (
        <section className=" overflow-hidden py-16 ">

            <div className="relative max-w-7xl mx-auto px-4 sm:px-6 xl:px-0">
                <div className="flex items-center justify-between mb-12">
                    <div className="space-y-4">
                        <h2 className="text-3xl sm:text-4xl font-bold text-gray-900">
                            Sản phẩm <span className="bg-gradient-to-r from-blue-600 via-indigo-600 to-purple-600 bg-clip-text text-transparent">mới nhất</span>
                        </h2>

                        <p className="text-gray-600 max-w-2xl text-lg">
                            Khám phá những sản phẩm mới nhất được cập nhật hàng ngày với chất lượng tuyệt vời
                        </p>
                    </div>

                    <div className="flex items-center gap-4">

                        <div className="flex gap-3">
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
                    </div>
                </div>
                <div className="relative">
                    <Swiper
                        modules={[Autoplay, Navigation]}
                        onSwiper={setSwiperRef}
                        loop={product.length > 4}
                        slidesPerView={4}
                        slidesPerGroup={1}
                        spaceBetween={24}
                        speed={800}
                        autoplay={{
                            delay: 4000,
                            disableOnInteraction: false,
                            pauseOnMouseEnter: true,
                        }}
                        breakpoints={{
                            0: { slidesPerView: 1, spaceBetween: 16 },
                            640: { slidesPerView: 2, spaceBetween: 16 },
                            768: { slidesPerView: 2, spaceBetween: 20 },
                            1024: { slidesPerView: 3, spaceBetween: 20 },
                            1280: { slidesPerView: 4, spaceBetween: 24 },
                        }}
                        className="!pb-8"
                    >
                        {product.map((p) => (
                            <SwiperSlide key={p.id}>
                                <div className="h-full">
                                    <ProductCard p={p} />
                                </div>
                            </SwiperSlide>
                        ))}
                    </Swiper>


                </div>
            </div>

        </section>
    )
}

export default NewProduct