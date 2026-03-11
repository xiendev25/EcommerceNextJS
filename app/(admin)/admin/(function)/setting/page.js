'use client'

// Thêm: import { useRouter }
import React, { useEffect, useState } from 'react'
import Image from 'next/image'
import { useRouter } from 'next/navigation' // <--- THÊM MỚI

const API_BASE = process.env.NEXT_PUBLIC_API_BASE_URL

export default function Page() {
    const [user, setUser] = useState(null)
    const router = useRouter() // <--- THÊM MỚI

    // Thay đổi: Logic fetch user bằng token
    const [authLoading, setAuthLoading] = useState(true); // State mới để theo dõi việc load user
    useEffect(() => {
        const fetchUser = async () => {
            setAuthLoading(true);
            const token = localStorage.getItem('token');
            if (!token) {
                router.replace('/admin/login'); // Chuyển hướng nếu không có token
                return;
            }
            try {
                const res = await fetch(`${API_BASE}/verifyUser`, {
                    headers: { Authorization: token },
                    cache: 'no-store'
                });
                if (!res.ok) {
                    localStorage.removeItem('token'); // Xóa token nếu không hợp lệ
                    router.replace('/admin/login');
                    return;
                }
                const userData = await res.json();
                setUser(userData); // Set user data lấy từ token
            } catch (e) {
                console.error("Lỗi xác thực:", e);
                localStorage.removeItem('token');
                router.replace('/admin/login');
            } finally {
                setAuthLoading(false); // Kết thúc loading user dù thành công hay lỗi
            }
        };
        fetchUser();
    }, [router]); // Thêm router vào dependencies
    // Kết thúc thay đổi

    const [state, setState] = useState({ loading: true, submitting: false, error: null, notice: null })
    const [settingData, setSettingData] = useState(null)
    const [form, setForm] = useState({
        site_name: '',
        slogan: '',
        email: '',
        phone: '',
        hotline: '',
        address: '',
    })

    const [logoFile, setLogoFile] = useState(null)
    const [faviconFile, setFaviconFile] = useState(null)
    const [logoPreview, setLogoPreview] = useState('')
    const [faviconPreview, setFaviconPreview] = useState('')

    // Fetch setting data (giữ nguyên)
    useEffect(() => {
        const fetchData = async () => {
            setState(s => ({ ...s, loading: true, error: null, notice: null }))
            try {
                const res = await fetch(`${API_BASE}/setting`)
                if (res.status === 404) {
                    setSettingData(null)
                    return
                }
                if (!res.ok) throw new Error('Không thể tải dữ liệu cài đặt.')
                const json = await res.json()
                setSettingData(json)
                setForm({
                    site_name: json.site_name || '',
                    slogan: json.slogan || '',
                    email: json.email || '',
                    phone: json.phone || '',
                    hotline: json.hotline || '',
                    address: json.address || '',
                })
            } catch (e) {
                setState(s => ({ ...s, error: e.message || 'Lỗi không xác định' }))
            } finally {
                setState(s => ({ ...s, loading: false }))
            }
        }
        fetchData()
    }, [])

    useEffect(() => {
        if (logoFile) {
            const url = URL.createObjectURL(logoFile)
            setLogoPreview(url)
            return () => URL.revokeObjectURL(url)
        } else {
            setLogoPreview('')
        }
    }, [logoFile])

    useEffect(() => {
        if (faviconFile) {
            const url = URL.createObjectURL(faviconFile)
            setFaviconPreview(url)
            return () => URL.revokeObjectURL(url)
        } else {
            setFaviconPreview('')
        }
    }, [faviconFile])

    const handleFormChange = (e) => {
        const { name, value } = e.target
        setForm(prev => ({ ...prev, [name]: value }))
    }

    const MAX_SIZE = 5 * 1024 * 1024 // 5MB
    const validateFile = (file, allowedExts, allowedMimes) => {
        const ext = (file.name.split('.').pop() || '').toLowerCase()
        if (!allowedExts.includes(ext)) {
            throw new Error(`Định dạng .${ext} không được hỗ trợ. Chỉ cho phép: ${allowedExts.join(', ')}`)
        }
        if (file.type && !allowedMimes.includes(file.type)) {
            throw new Error(`MIME type không hợp lệ: ${file.type}`)
        }
        if (file.size > MAX_SIZE) {
            throw new Error(`Kích thước tối đa 5MB. File hiện tại ${(file.size / 1024 / 1024).toFixed(2)}MB`)
        }
    }

    const uploadSettingImage = async (file, slug) => {
        if (!file) return null
        const fd = new FormData()
        fd.append('image', file)
        fd.append('slug', slug)
        fd.append('perfix', 'setting') // KHỚP controller

        const res = await fetch(`${API_BASE}/upload`, { method: 'POST', body: fd })
        if (!res.ok) {
            const t = await res.text().catch(() => '')
            throw new Error(t || `Upload ${slug} thất bại (${res.status})`)
        }
        return await res.json() // { url: '...' }
    }

    const handleSubmit = async (e) => {
        e.preventDefault();

        // Thêm: Kiểm tra user trước khi submit
        if (!user) {
            alert('Không tìm thấy thông tin người dùng. Vui lòng đăng nhập lại.');
            router.push('/admin/login');
            return;
        }
        // Kết thúc thêm

        setState(s => ({ ...s, submitting: true, error: null, notice: null }))

        try {
            // Logo: png/jpg/jpeg/webp
            if (logoFile) {
                validateFile(
                    logoFile,
                    ['png', 'jpg', 'jpeg', 'webp'],
                    ['image/png', 'image/jpeg', 'image/webp']
                )
            }
            // Favicon: KHÔNG .ico (BE không nhận) → dùng png/jpg/webp
            if (faviconFile) {
                validateFile(
                    faviconFile,
                    ['png', 'jpg', 'jpeg', 'webp'],
                    ['image/png', 'image/jpeg', 'image/webp']
                )
            }

            if (!settingData && !logoFile && !faviconFile) {
                setState(s => ({ ...s, notice: 'Khuyến nghị thêm logo và favicon (PNG). Bạn vẫn có thể lưu trước và cập nhật sau.' }))
            }

            const [logoUploadRes, faviconUploadRes] = await Promise.all([
                uploadSettingImage(logoFile, 'logo'),
                uploadSettingImage(faviconFile, 'favicon'),
            ])

            const finalLogoUrl = logoUploadRes ? logoUploadRes.url : (settingData && settingData.logo ? settingData.logo : null)
            const finalFaviconUrl = faviconUploadRes ? faviconUploadRes.url : (settingData && settingData.favicon ? settingData.favicon : null)

            const isUpdating = !!settingData
            const payload = {
                ...form,
                logo: finalLogoUrl,
                favicon: finalFaviconUrl,
                // Thay đổi: Lấy user.id từ state user
                ...(isUpdating ? { updated_by: user.id } : { created_by: user.id }),
            }

            const url = isUpdating ? `${API_BASE}/setting/${settingData.id}` : `${API_BASE}/setting`
            const method = isUpdating ? 'PUT' : 'POST'

            const res = await fetch(url, {
                method,
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify(payload),
            })

            if (!res.ok) {
                const errorData = await res.json().catch(() => ({}))
                throw new Error(errorData.message || 'Lưu cài đặt thất bại.')
            }

            alert('Lưu cài đặt thành công!')
            router.refresh()
        } catch (err) {
            console.error(err)
            setState(s => ({ ...s, error: err.message || 'Đã có lỗi xảy ra' }))
        } finally {
            setState(s => ({ ...s, submitting: false }))
        }
    }

    // Thêm: Check authLoading
    if (authLoading) return <div className="p-8 text-center animate-pulse">Đang xác thực...</div>;
    // Kết thúc thêm

    if (state.loading) return <div className="p-8 text-center animate-pulse">Đang tải cài đặt...</div>

    return (
        <form onSubmit={handleSubmit} className="bg-white p-6 md:p-8 shadow-sm rounded-lg border max-w-4xl mx-auto">
            <div className="mb-8">
                <h1 className="text-2xl font-bold text-gray-900">Cài đặt Website</h1>
                <p className="text-sm text-gray-500 mt-1">Quản lý các thông tin chung của trang web.</p>
            </div>

            <div className="space-y-6">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                    <div>
                        <label className="block text-sm font-medium text-gray-700 mb-1">Tên Website</label>
                        <input name="site_name" value={form.site_name} onChange={handleFormChange} className="w-full h-11 px-4 rounded-lg bg-gray-50 border border-gray-300" />
                    </div>
                    <div>
                        <label className="block text-sm font-medium text-gray-700 mb-1">Slogan</label>
                        <input name="slogan" value={form.slogan} onChange={handleFormChange} className="w-full h-11 px-4 rounded-lg bg-gray-50 border border-gray-300" />
                    </div>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                    <div>
                        <label className="block text-sm font-medium text-gray-700 mb-1">Email</label>
                        <input name="email" type="email" value={form.email} onChange={handleFormChange} className="w-full h-11 px-4 rounded-lg bg-gray-50 border border-gray-300" />
                    </div>
                    <div>
                        <label className="block text-sm font-medium text-gray-700 mb-1">Phone</label>
                        <input name="phone" value={form.phone} onChange={handleFormChange} className="w-full h-11 px-4 rounded-lg bg-gray-50 border border-gray-300" />
                    </div>
                    <div>
                        <label className="block text-sm font-medium text-gray-700 mb-1">Hotline</label>
                        <input name="hotline" value={form.hotline} onChange={handleFormChange} className="w-full h-11 px-4 rounded-lg bg-gray-50 border border-gray-300" />
                    </div>
                </div>

                <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">Địa chỉ</label>
                    <textarea name="address" value={form.address} onChange={handleFormChange} rows={3} className="w-full p-4 rounded-lg bg-gray-50 border border-gray-300" />
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-8 pt-4 border-t">
                    <div>
                        <label className="block text-sm font-medium text-gray-700 mb-2">Logo (PNG/JPG/WEBP, ≤ 5MB)</label>
                        <input
                            type="file"
                            accept="image/png, image/jpeg, image/webp"
                            onChange={e => setLogoFile((e.target.files && e.target.files[0]) || null)}
                            className="w-full text-sm text-slate-500 file:mr-4 file:py-2 file:px-4 file:rounded-full file:border-0 file:text-sm file:font-semibold file:bg-violet-50 file:text-violet-700 hover:file:bg-violet-100"
                        />
                        <div className="mt-4 p-4 border border-dashed rounded-lg h-28 flex items-center justify-center">
                            {logoPreview ? (
                                <Image src={logoPreview} alt="Logo preview" width={100} height={40} className="max-h-20 w-auto" />
                            ) : settingData && settingData.logo ? (
                                <Image src={settingData.logo} alt="Current Logo" width={100} height={40} className="max-h-20 w-auto" unoptimized />
                            ) : (
                                <p className="text-xs text-gray-400">Chưa có ảnh</p>
                            )}
                        </div>
                    </div>

                    <div>
                        <label className="block text-sm font-medium text-gray-700 mb-2">Favicon (PNG/JPG/WEBP, ≤ 5MB)</label>
                        <input
                            type="file"
                            accept="image/png, image/jpeg, image/webp"
                            onChange={e => setFaviconFile((e.target.files && e.target.files[0]) || null)}
                            className="w-full text-sm text-slate-500 file:mr-4 file:py-2 file:px-4 file:rounded-full file:border-0 file:text-sm file:font-semibold file:bg-violet-50 file:text-violet-700 hover:file:bg-violet-100"
                        />
                        <div className="mt-4 p-4 border border-dashed rounded-lg h-28 flex items-center justify-center">
                            {faviconPreview ? (
                                <Image src={faviconPreview} alt="Favicon preview" width={48} height={48} />
                            ) : settingData && settingData.favicon ? (
                                <Image src={settingData.favicon} alt="Current Favicon" width={48} height={48} unoptimized />
                            ) : (
                                <p className="text-xs text-gray-400">Chưa có ảnh</p>
                            )}
                        </div>
                    </div>
                </div>
            </div>

            {state.notice && <p className="text-amber-600 text-sm text-center mt-4">{state.notice}</p>}
            {state.error && <p className="text-red-600 text-sm text-center mt-2">Lỗi: {state.error}</p>}

            <div className="flex justify-end gap-3 border-t pt-6 mt-8">
                <button
                    type="submit"
                    disabled={state.submitting}
                    className="px-6 py-2.5 bg-indigo-600 text-white font-medium rounded-lg disabled:opacity-60 disabled:cursor-not-allowed"
                >
                    {state.submitting ? 'Đang lưu...' : 'Lưu thay đổi'}
                </button>
            </div>
        </form>
    )
}