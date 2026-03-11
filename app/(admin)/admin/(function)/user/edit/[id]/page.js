'use client'
import React, { useState, useEffect } from 'react';
import Link from 'next/link';
import Image from 'next/image';
import { useParams, useRouter } from 'next/navigation';

const API_BASE = process.env.NEXT_PUBLIC_API_BASE_URL;

export default function Page() {
    const { id } = useParams();
    const router = useRouter();
    // Sử dụng tên biến 'user' cho admin đang đăng nhập
    const [user, setUser] = useState(null);
    const [authLoading, setAuthLoading] = useState(true);

    useEffect(() => {
        const verifyAdmin = async () => {
            setAuthLoading(true);
            const token = localStorage.getItem('token');
            if (!token) {
                router.replace('/admin/login');
                return;
            }
            try {
                const res = await fetch(`${API_BASE}/verifyAdmin`, { // Dùng verifyAdmin
                    headers: { Authorization: token },
                    cache: 'no-store'
                });
                if (!res.ok) {
                    localStorage.removeItem('token');
                    localStorage.removeItem('user');
                    router.replace('/admin/login');
                    return;
                }
                const adminData = await res.json();
                setUser(adminData); // Lưu thông tin admin vào state 'user'
            } catch (e) {
                console.error("Lỗi xác thực:", e);
                localStorage.removeItem('token');
                localStorage.removeItem('user');
                router.replace('/admin/login');
            } finally {
                setAuthLoading(false);
            }
        };
        verifyAdmin();
    }, [router]);

    // State for user data being edited
    const [state, setState] = useState({ loading: true, submitting: false, error: null });

    const [form, setForm] = useState({
        name: '', email: '', phone: '', username: '', role: 'customer', status: 1,
    });
    const [avatarFile, setAvatarFile] = useState(null); // New avatar file
    const [avatarPreview, setAvatarPreview] = useState(null); // Preview for new avatar
    const [initialAvatarUrl, setInitialAvatarUrl] = useState(''); // Store initial avatar URL

    // Fetch user data to edit
    useEffect(() => {
        // Wait for ID and auth check
        if (!id || authLoading) return;

        const fetchData = async () => {
            setState(s => ({ ...s, loading: true, error: null })); // Start data loading
            try {
                const res = await fetch(`${API_BASE}/user/${id}`);
                if (res.status === 404) throw new Error("Không tìm thấy người dùng.");
                if (!res.ok) throw new Error(`Lỗi khi tải dữ liệu người dùng (HTTP ${res.status}).`);
                const data = await res.json();
                setForm({ // Populate form with fetched data
                    name: data.name || '',
                    email: data.email || '',
                    phone: data.phone || '',
                    username: data.username || '',
                    role: data.role || 'customer',
                    status: data.status ?? 1, // Use ?? for default
                });
                setInitialAvatarUrl(data.avatar || ''); // Store initial avatar URL
            } catch (e) {
                setState(s => ({ ...s, error: e.message }));
            } finally {
                setState(s => ({ ...s, loading: false })); // End data loading
            }
        };
        fetchData();
    }, [id, authLoading]); // Add authLoading dependency


    // Create preview URL for new avatar file
    useEffect(() => {
        if (avatarFile) {
            const url = URL.createObjectURL(avatarFile);
            setAvatarPreview(url);
            return () => URL.revokeObjectURL(url); // Clean up object URL
        } else {
            setAvatarPreview(null); // Reset preview if file is removed
        }
    }, [avatarFile]);

    // Handle form input changes
    const handleChange = (e) => {
        const { name, value } = e.target;
        // Ensure status is a number
        setForm(prev => ({ ...prev, [name]: name === 'status' ? Number(value) : value }));
    };

    // Standardized avatar upload function
    const uploadAvatar = async (file) => {
        if (!file) return null;

        const fd = new FormData();
        fd.append('image', file);
        fd.append('perfix', 'avatars');

        const res = await fetch(`${API_BASE}/upload`, { method: 'POST', body: fd });
        if (!res.ok) {
            const t = await res.text().catch(() => '');
            throw new Error(t || `Upload avatar thất bại (${res.status})`);
        }
        return await res.json();
    };

    // Handle delete image API call (adjust endpoint if needed)
    const deleteImageApi = async (filePath) => {
        if (!filePath) return;
        try {
            // Assume API endpoint for deletion based on path exists
            await fetch(`${API_BASE}/delete-image`, { // Use the correct endpoint for deletion by path
                method: 'DELETE',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ filePath }) // Send the file path to delete
            });
            console.log("Deleted old avatar:", filePath); // Log success
        } catch (deleteError) {
            console.warn("Could not delete old avatar, proceeding anyway:", deleteError); // Log warning but proceed
        }
    };


    // Handle form submission
    const handleSubmit = async (e) => {
        e.preventDefault();

        // Check 'user' state (admin currently logged in)
        if (!user) {
            alert('Không thể xác định người dùng admin. Vui lòng đăng nhập lại.');
            router.push('/admin/login');
            return;
        }
        if (!form.name || !form.email || !form.username) {
            setState(s => ({ ...s, error: "Vui lòng điền các trường bắt buộc (*)." }));
            return;
        }


        setState(s => ({ ...s, submitting: true, error: null }));
        try {
            let avatarUrl = initialAvatarUrl;
            if (avatarFile) {
                if (initialAvatarUrl) {
                    await deleteImageApi(initialAvatarUrl);
                }
                const uploadRes = await uploadAvatar(avatarFile);
                avatarUrl = uploadRes.url;
            }

            const payload = {
                name: form.name.trim(),
                email: form.email.trim(),
                phone: form.phone.trim() || null,
                username: form.username.trim(),
                role: form.role,
                status: Number(form.status),
                avatar: avatarUrl, // Use the final avatar URL
                updated_by: user.id, // Use user.id (logged-in admin)
                // updated_at handled by backend
            };

            const res = await fetch(`${API_BASE}/user/${id}`, { // PUT to /user/{id}
                method: 'PUT',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify(payload),
            });

            if (!res.ok) {
                const errorData = await res.json().catch(() => ({}));
                let errMsg = "Cập nhật thất bại.";
                if (errorData.message) {
                    errMsg = errorData.message;
                } else if (res.status === 422) { // Handle validation errors
                    errMsg = "Dữ liệu không hợp lệ. Email hoặc Username có thể đã được sử dụng.";
                }
                throw new Error(errMsg);
            }
            alert("Cập nhật thông tin thành công!");
            router.push('/admin/user'); // Redirect to user list
        } catch (err) {
            console.error("Lỗi khi submit:", err);
            setState(s => ({ ...s, error: err.message || 'Lỗi không xác định' }));
        } finally {
            setState(s => ({ ...s, submitting: false }));
        }
    };

    if (authLoading) return <div className="p-8 text-center animate-pulse">Đang xác thực quyền truy cập...</div>;

    if (state.loading) return <div className="p-8 text-center animate-pulse">Đang tải thông tin người dùng...</div>;

    // Display error loading data (if not submitting)
    if (state.error && !state.submitting) return (
        <div className="p-8 text-center text-red-500 bg-red-50 border border-red-200 rounded-lg">
            <p className="font-semibold mb-2">Lỗi tải dữ liệu:</p>
            <p>{state.error}</p>
            <Link href="/admin/user" className="mt-4 inline-block text-blue-600 hover:underline">
                Quay lại danh sách
            </Link>
        </div>
    );


    return (
        <form onSubmit={handleSubmit} className="space-y-8 max-w-4xl mx-auto">
            <div className="flex items-center justify-between">
                <h1 className="text-2xl font-bold text-gray-900">Cập nhật thông tin Người dùng</h1>
                <div className="flex gap-3">
                    <Link href="/admin/user" className="px-4 py-2 bg-gray-200 hover:bg-gray-300 text-gray-800 text-sm font-medium rounded-lg">Hủy</Link>
                    <button type="submit" disabled={state.submitting} className="px-4 py-2 bg-indigo-600 text-white rounded-lg disabled:opacity-60 disabled:cursor-not-allowed">
                        {state.submitting ? 'Đang lưu...' : 'Lưu thay đổi'}
                    </button>
                </div>
            </div>

            {/* Display submission error */}
            {state.error && state.submitting && (
                <div className="p-4 bg-red-50 border border-red-200 text-red-700 rounded-lg text-sm">
                    {state.error}
                </div>
            )}


            <div className="bg-white p-6 md:p-8 shadow-sm rounded-lg border space-y-6">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                    <div>
                        <label className="block text-sm font-medium mb-1">Họ và tên <span className="text-red-500">*</span></label>
                        <input name="name" value={form.name} onChange={handleChange} required className="w-full h-11 px-4 rounded-lg bg-gray-50 border border-gray-300" />
                    </div>
                    <div>
                        <label className="block text-sm font-medium mb-1">Username <span className="text-red-500">*</span></label>
                        <input name="username" value={form.username} onChange={handleChange} required className="w-full h-11 px-4 rounded-lg bg-gray-50 border border-gray-300" />
                    </div>
                </div>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                    <div>
                        <label className="block text-sm font-medium mb-1">Email <span className="text-red-500">*</span></label>
                        <input name="email" type="email" value={form.email} onChange={handleChange} required className="w-full h-11 px-4 rounded-lg bg-gray-50 border border-gray-300" />
                    </div>
                    <div>
                        <label className="block text-sm font-medium mb-1">Số điện thoại</label>
                        <input name="phone" value={form.phone} onChange={handleChange} className="w-full h-11 px-4 rounded-lg bg-gray-50 border border-gray-300" />
                    </div>
                </div>
                {/* Password fields removed - use separate password reset on show page */}
                <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">Ảnh đại diện (Avatar)</label>
                    <input type="file" accept="image/*" onChange={e => setAvatarFile(e.target.files?.[0] || null)} className="w-full text-sm text-slate-500 file:mr-4 file:py-2 file:px-4 file:rounded-full file:border-0 file:text-sm file:font-semibold file:bg-violet-50 file:text-violet-700 hover:file:bg-violet-100" />
                    <div className="mt-4">
                        {avatarPreview ? (
                            <Image src={avatarPreview} alt="Avatar preview" width={80} height={80} className="rounded-full border" unoptimized />
                        ) : (initialAvatarUrl &&
                            <Image src={initialAvatarUrl} alt="Current Avatar" width={80} height={80} className="rounded-full border" unoptimized />
                        )}
                        {!avatarPreview && !initialAvatarUrl && <p className="text-sm text-gray-500">Chưa có ảnh</p>}
                    </div>
                </div>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                    <div>
                        <label className="block text-sm font-medium mb-1">Vai trò</label>
                        <select name="role" value={form.role} onChange={handleChange} className="w-full h-11 px-4 rounded-lg bg-gray-50 border border-gray-300">
                            <option value="customer">Customer</option>
                            <option value="admin">Admin</option>
                        </select>
                    </div>
                    <div>
                        <label className="block text-sm font-medium mb-1">Trạng thái</label>
                        <select name="status" value={form.status} onChange={handleChange} className="w-full h-11 px-4 rounded-lg bg-gray-50 border border-gray-300">
                            <option value={1}>Hoạt động</option>
                            <option value={0}>Bị khóa</option>
                        </select>
                    </div>
                </div>
            </div>
        </form>
    );
}

