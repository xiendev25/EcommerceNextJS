'use client'
import React, { useEffect, useState } from 'react'
import HotProductCard from '../product/HotProductCard'

const API_BASE = process.env.NEXT_PUBLIC_API_BASE_URL

const HotProduct = () => {
    const [product, setProduct] = useState([])
    const [state, setState] = useState({ loading: true, error: null })

    useEffect(() => {
        (async () => {
            try {
                const res = await fetch(`${API_BASE}/getHotProduct`)
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

    const renderCard = (p, index) => (
        <div
            className="group relative  w-full max-w-[360px] mx-auto"
            key={p?.id ?? index}
            style={{ animation: `fadeInUp 0.8s ease-out ${index * 0.1}s both` }}
        >
            <div className="relative">
                <div className="absolute inset-0 bg-gradient-to-r from-orange-500/0 via-red-500/0 to-pink-500/0 group-hover:from-orange-500/20 group-hover:via-red-500/20 group-hover:to-pink-500/20 rounded-3xl blur-xl transition-all duration-500 group-hover:scale-110"></div>
                <div className="relative bg-white rounded-3xl shadow-xl group-hover:shadow-2xl transition-all duration-500 overflow-hidden group-hover:scale-105 border border-white/50 group-hover:border-orange-200/50">
                    <HotProductCard p={p} />
                    <div className="absolute top-4 right-4 opacity-0 group-hover:opacity-100 transition-all duration-300">
                        <div className="bg-gradient-to-r from-orange-500 to-red-500 text-white p-2 rounded-full shadow-lg animate-bounce">
                            <i className="fa-solid fa-fire w-4 h-4"></i>
                        </div>
                    </div>
                </div>
            </div>
        </div>
    )

    if (state.loading) {
        return (
            <section className=" overflow-hidden py-20">
                <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 relative">
                    <div className="flex items-center justify-between mb-12">
                        <div className="space-y-3">
                            <div className="w-64 h-8 bg-gradient-to-r from-gray-200 via-gray-300 to-gray-200 rounded-lg animate-pulse"></div>
                            <div className="w-48 h-4 bg-gradient-to-r from-gray-200 via-gray-300 to-gray-200 rounded animate-pulse"></div>
                        </div>
                    </div>

                    <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-8">
                        {Array.from({ length: 3 }).map((_, i) => (
                            <div key={i} className="group" style={{ animationDelay: `${i * 150}ms` }}>
                                <div className="bg-white rounded-3xl shadow-xl overflow-hidden animate-pulse">
                                    <div className="relative h-64 bg-gradient-to-br from-gray-200 via-gray-300 to-gray-200 overflow-hidden">
                                        <div className="absolute inset-0 bg-gradient-to-r from-transparent via-white/30 to-transparent -translate-x-full animate-shimmer"></div>
                                        <div className="absolute top-4 left-4 w-16 h-8 bg-gradient-to-r from-orange-200 to-red-200 rounded-full"></div>
                                        <div className="absolute top-4 right-4 w-10 h-10 bg-white/80 rounded-full"></div>
                                    </div>
                                    <div className="p-6 space-y-4">
                                        <div className="h-6 bg-gradient-to-r from-gray-200 via-gray-300 to-gray-200 rounded-lg"></div>
                                        <div className="h-4 w-3/4 bg-gradient-to-r from-gray-200 via-gray-300 to-gray-200 rounded"></div>
                                        <div className="flex items-center justify-between">
                                            <div className="h-8 w-24 bg-gradient-to-r from-green-200 to-blue-200 rounded-lg"></div>
                                            <div className="h-4 w-16 bg-gradient-to-r from-gray-200 to-gray-300 rounded"></div>
                                        </div>
                                        <div className="h-12 bg-gradient-to-r from-blue-200 to-purple-200 rounded-2xl"></div>
                                    </div>
                                </div>
                            </div>
                        ))}
                    </div>
                </div>
            </section>
        )
    }

    // Error UI
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

    // Empty UI
    if (!product.length) {
        return (
            <section className="relative overflow-hidden py-20">
                <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
                    <div className="text-center">
                        <h3 className="text-xl font-semibold text-gray-900 mb-2">Chưa có sản phẩm hot</h3>
                        <p className="text-gray-600">Hiện tại chưa có sản phẩm bán chạy để hiển thị.</p>
                    </div>
                </div>
            </section>
        )
    }

    const count = product.length // BE đã giới hạn 1–3

    return (
        <section className=" overflow-hidden py-20 ">

            <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 relative">
                <div className="mb-10">
                    <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-8">
                        <div className="space-y-6">
                            <h2 className="text-2xl sm:text-3xl font-bold text-gray-900">
                                Sản phẩm đang được{' '}
                                <span className="bg-gradient-to-r from-orange-600 via-red-600 to-pink-600 bg-clip-text text-transparent">
                                    săn đón nhiều
                                </span>
                            </h2>
                            <p className="text-gray-600 max-w-md">
                                Những sản phẩm đang được săn đón nhiều nhất tại cửa hàng!
                            </p>
                        </div>
                    </div>
                </div>

                {/* Layout theo số lượng */}
                {count === 1 && (
                    <div className="flex justify-center">
                        <div className="w-full sm:w-[520px]">{renderCard(product[0], 0)}</div>
                    </div>
                )}

                {count === 2 && (
                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-8">
                        {product.map((p, i) => renderCard(p, i))}
                    </div>
                )}

                {count === 3 && (
                    <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-8">
                        {product.map((p, i) => renderCard(p, i))}
                    </div>
                )}
            </div>
        </section>
    )
}

export default HotProduct
