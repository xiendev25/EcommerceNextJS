'use client'
import React, { useEffect, useRef, useState } from 'react'
import ProductCard from '../product/ProductCard'

const API_BASE = process.env.NEXT_PUBLIC_API_BASE_URL

const ProductByCategory = () => {
    const [categories, setCategories] = useState([])
    const [selected, setSelected] = useState(null)
    const [products, setProducts] = useState([])
    const [state, setState] = useState({ loading: true, error: null })

    // Token để biết request nào là "mới nhất"
    const activeFetchRef = useRef({ token: 0 })

    // Cache sản phẩm theo danh mục
    const cacheRef = useRef(new Map())

    const loadProductsByCategory = async (categoryId) => {
        if (!categoryId) return

        // Nếu có cache thì hiển thị ngay (cache-first)
        const cached = cacheRef.current.get(String(categoryId))
        if (cached) {
            setProducts(cached)
            setState({ loading: false, error: null })
        } else {
            setState({ loading: true, error: null })
        }

        const token = Date.now()
        activeFetchRef.current = { token }

        try {
            const res = await fetch(`${API_BASE}/getProductByCategory/${categoryId}`, {
                headers: { 'Cache-Control': 'no-cache' },
            })
            if (!res.ok) throw new Error(`Product HTTP ${res.status}`)
            const json = await res.json()

            // Nếu token khác → bỏ qua (đã bị request mới vượt mặt)
            if (activeFetchRef.current.token !== token) return

            const normalized = Array.isArray(json) ? json : []
            cacheRef.current.set(String(categoryId), normalized)

            setProducts(normalized)
            setState({ loading: false, error: null })
        } catch (e) {
            if (activeFetchRef.current.token !== token) return
            setState({ loading: false, error: e.message || 'Fetch error' })
        }
    }

    useEffect(() => {
        (async () => {
            try {
                const res = await fetch(`${API_BASE}/getChildren`)
                if (!res.ok) throw new Error(`Category HTTP ${res.status}`)
                const json = await res.json()
                const cats = Array.isArray(json) ? json : []
                setCategories(cats)

                if (cats.length > 0) {
                    const firstId = String(cats[0].id)
                    setSelected(firstId)
                    loadProductsByCategory(firstId)
                } else {
                    setState({ loading: false, error: null })
                }
            } catch (e) {
                setState({ loading: false, error: e.message || 'Fetch error' })
            }
        })()
    }, [])

    const handleSelect = (id) => {
        const idStr = String(id)
        if (idStr === selected) return
        setSelected(idStr)
        loadProductsByCategory(idStr)
    }

    if (state.loading) {
        return (
            <section className="overflow-hidden py-16">
                <div className="max-w-7xl mx-auto px-4 sm:px-6 xl:px-0">
                    <div className="flex items-center justify-between mb-12">
                        <div className="space-y-3">
                            <div className="w-64 h-8 bg-gradient-to-r from-gray-200 via-gray-300 to-gray-200 rounded-lg animate-pulse"></div>
                            <div className="w-48 h-4 bg-gradient-to-r from-gray-200 via-gray-300 to-gray-200 rounded animate-pulse"></div>
                        </div>
                    </div>
                    <div className="flex flex-wrap justify-center gap-3 mb-8">
                        {Array.from({ length: 6 }).map((_, i) => (
                            <div key={i} className="h-10 w-24 bg-gray-200 rounded-full animate-pulse" />
                        ))}
                    </div>
                    <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
                        {Array.from({ length: 8 }).map((_, i) => (
                            <div key={i} className="rounded-xl border border-gray-200 overflow-hidden">
                                <div className="aspect-square bg-gray-100 animate-pulse" />
                                <div className="p-4 space-y-3">
                                    <div className="h-5 w-3/4 bg-gray-200 rounded animate-pulse" />
                                    <div className="h-4 w-1/2 bg-gray-200 rounded animate-pulse" />
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
        <section className="overflow-hidden py-16">
            <div className="relative max-w-7xl mx-auto px-4 sm:px-6 xl:px-0">
                <div className="flex items-center justify-between mb-12">
                    <div className="space-y-4">
                        <h2 className="text-3xl sm:text-4xl font-bold text-gray-900">
                            Sản phẩm{' '}
                            <span className="bg-gradient-to-r from-blue-600 via-indigo-600 to-purple-600 bg-clip-text text-transparent">
                                theo danh mục
                            </span>
                        </h2>
                        <p className="text-gray-600 max-w-2xl text-lg">
                            Khám phá những sản phẩm theo danh mục với chất lượng tuyệt vời
                        </p>
                    </div>
                </div>

                <div className="flex flex-wrap justify-center gap-3 mb-10">
                    {categories.map((c) => {
                        const active = String(selected) === String(c.id)
                        return (
                            <button
                                key={c.id}
                                onClick={() => handleSelect(c.id)}
                                className={`px-6 py-2 rounded-full font-medium transition ${active
                                    ? 'bg-blue-600 text-white shadow-lg shadow-blue-200'
                                    : 'bg-white border border-gray-200 text-gray-700 hover:bg-blue-50'
                                    }`}
                                title={c.name}
                            >
                                {c.name}
                            </button>
                        )
                    })}
                </div>

                {products.length === 0 ? (
                    <p className="text-center text-gray-500">Danh mục này chưa có sản phẩm khả dụng.</p>
                ) : (
                    <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
                        {products.map((p) => (
                            <ProductCard key={p.id} p={p} />
                        ))}
                    </div>
                )}
            </div>
        </section>
    )
}

export default ProductByCategory
