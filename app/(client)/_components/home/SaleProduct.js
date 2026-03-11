'use client';

import React, { useEffect, useRef, useState } from 'react';
import { Swiper, SwiperSlide } from 'swiper/react';
import { Autoplay, Navigation } from 'swiper/modules';
import 'swiper/css';
import 'swiper/css/navigation';

import ProductCard from '../product/ProductCard';

const API_BASE = process.env.NEXT_PUBLIC_API_BASE_URL;

const SaleProduct = () => {
    const [products, setProducts] = useState([]);
    const [state, setState] = useState({ loading: true, error: null });

    const prevRef = useRef(null);
    const nextRef = useRef(null);

    useEffect(() => {
        (async () => {
            try {
                const res = await fetch(`${API_BASE}/getSaleProduct`);
                if (!res.ok) throw new Error(`Product HTTP ${res.status}`);
                const json = await res.json();

                setProducts(Array.isArray(json) ? json : []);
                setState({ loading: false, error: null });
            } catch (e) {
                if (e.name !== 'AbortError') {
                    setState({ loading: false, error: e.message || 'Fetch error' });
                }
            }
        })();


    }, []);

    if (state.loading) {
        return (
            <section className=" overflow-hidden py-20 ">
                <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 relative">
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
        );
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
        );
    }

    if (!products.length) {
        return (
            <section className="relative overflow-hidden py-20">
                <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
                    <div className="text-center">
                        <h3 className="text-xl font-semibold text-gray-900 mb-2">Chưa có sản phẩm hot</h3>
                        <p className="text-gray-600">Hiện tại chưa có sản phẩm bán chạy để hiển thị.</p>
                    </div>
                </div>
            </section>
        );
    }

    return (
        <section className=" overflow-hidden py-20">

            <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 relative">
                <div className="mb-10">
                    <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-8">
                        <div className="space-y-3">
                            <h2 className="text-2xl sm:text-3xl font-bold text-gray-900">
                                Đại hội {(' ')}
                                <span className="bg-gradient-to-r from-orange-600 via-red-600 to-pink-600 bg-clip-text text-transparent">
                                    giảm giá!
                                </span>
                            </h2>
                            <p className="text-gray-600 max-w-md">Đại hạ giá các sản phẩm trên cửa hàng!</p>
                        </div>

                        <div className="flex items-center gap-3" role="group" aria-label="Carousel controls">
                            <button
                                ref={prevRef}
                                className="flex items-center justify-center w-12 h-12 rounded-2xl bg-white/80 backdrop-blur-sm shadow-lg border border-white/20 text-gray-600 hover:border-blue-200 hover:text-blue-600 transition-all duration-300 disabled:opacity-50 disabled:cursor-not-allowed"
                                aria-label="Previous Slide"
                                type="button"
                            >
                                <span className="fa-solid fa-arrow-left" aria-hidden="true" />
                            </button>

                            <button
                                ref={nextRef}
                                className="flex items-center justify-center w-12 h-12 rounded-2xl bg-white/80 backdrop-blur-sm shadow-lg border border-white/20 text-gray-600 hover:border-blue-200 hover:text-blue-600 transition-all duration-300 disabled:opacity-50 disabled:cursor-not-allowed"
                                aria-label="Next Slide"
                                type="button"
                            >
                                <span className="fa-solid fa-arrow-right" aria-hidden="true" />
                            </button>
                        </div>
                    </div>
                </div>

                <div className="relative">
                    <Swiper
                        modules={[Autoplay, Navigation]}
                        navigation={{
                            prevEl: prevRef.current,
                            nextEl: nextRef.current,
                        }}
                        onInit={(swiper) => {
                            swiper.params.navigation.prevEl = prevRef.current;
                            swiper.params.navigation.nextEl = nextRef.current;
                            swiper.navigation.init();
                            swiper.navigation.update();
                        }}
                        loop={products.length > 4}
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
                        {products.map((p) => (
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
    );
};

export default SaleProduct;