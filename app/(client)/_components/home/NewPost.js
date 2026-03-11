'use client';

import React, { useEffect, useRef, useState } from 'react';
import { Swiper, SwiperSlide } from 'swiper/react';
import { Autoplay, Navigation } from 'swiper/modules';
import 'swiper/css';
import 'swiper/css/navigation';

import PostCard from '../post/PostCard';

const API_BASE = process.env.NEXT_PUBLIC_API_BASE_URL;

const NewPost = () => {
    const [post, setPost] = useState([]);
    const [state, setState] = useState({ loading: true, error: null });

    const prevRef = useRef(null);
    const nextRef = useRef(null);

    useEffect(() => {
        (async () => {
            try {
                const res = await fetch(`${API_BASE}/getNewPost`);
                if (!res.ok) throw new Error(`Post HTTP ${res.status}`);
                const json = await res.json();

                setPost(Array.isArray(json) ? json : []);
                setState({ loading: false, error: null });
            } catch (e) {
                if (e.name !== 'AbortError') {
                    setState({ loading: false, error: e.message || 'Fetch error' });
                }
            }
        })();
    }, []);

    console.log(post);


    if (state.loading) {
        return (
            <section className=" overflow-hidden py-20 ">
                <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 relative">
                    <div className="mb-16">
                        <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-8">
                            <div className="w-40 h-10 bg-gradient-to-r from-orange-200 via-red-200 to-pink-200 rounded-2xl animate-pulse" />
                        </div>
                    </div>
                    <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-8">
                        {Array.from({ length: 3 }).map((_, i) => (
                            <div key={i} className="group">
                                <div className="bg-white rounded-3xl shadow-xl overflow-hidden animate-pulse">
                                    <div className="relative h-64 bg-gradient-to-br from-gray-200 via-gray-300 to-gray-200 overflow-hidden">
                                        <div className="absolute inset-0 bg-gradient-to-r from-transparent via-white/30 to-transparent -translate-x-full animate-shimmer" />
                                    </div>
                                    <div className="p-6 space-y-4">
                                        <div className="h-6 bg-gradient-to-r from-gray-200 via-gray-300 to-gray-200 rounded-lg" />
                                        <div className="h-4 w-3/4 bg-gradient-to-r from-gray-200 via-gray-300 to-gray-200 rounded" />
                                        <div className="flex items-center justify-between">
                                            <div className="h-8 w-24 bg-gradient-to-r from-green-200 to-blue-200 rounded-lg" />
                                            <div className="h-4 w-16 bg-gradient-to-r from-gray-200 to-gray-300 rounded" />
                                        </div>
                                        <div className="h-12 bg-gradient-to-r from-blue-200 to-purple-200 rounded-2xl" />
                                    </div>
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

    if (!post.length) {
        return (
            <section className="relative overflow-hidden py-20">
                <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
                    <div className="text-center">
                        <h3 className="text-xl font-semibold text-gray-900 mb-2">Chưa có bài viết!</h3>
                        <p className="text-gray-600">Hiện tại chưa có bài viết để hiển thị.</p>
                    </div>
                </div>
            </section>
        );
    }

    return (
        <section className=" overflow-hidden py-20 ">

            <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 relative">
                <div className="mb-10">
                    <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-8">
                        <div className="space-y-3">
                            <h2 className="text-2xl sm:text-3xl font-bold text-gray-900">
                                Bài viết {(' ')}
                                <span className="bg-gradient-to-r from-orange-600 via-red-600 to-pink-600 bg-clip-text text-transparent">
                                    mới nhất!
                                </span>
                            </h2>
                            <p className="text-gray-600 max-w-md"> Khám phá những bài viết mới nhất được cập nhật hàng ngày.</p>
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
                        loop={post.length > 4}
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
                        {post.map((p) => (
                            <SwiperSlide key={p.id}>
                                <div className="h-full">
                                    <PostCard post={p} />
                                </div>
                            </SwiperSlide>
                        ))}
                    </Swiper>
                </div>
            </div>
        </section>
    );
};

export default NewPost;