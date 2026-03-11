'use client';
import { useEffect, useState } from 'react';
import { useParams, useRouter } from "next/navigation";
import PostCard from '../../_components/post/PostCard';

const API_BASE = process.env.NEXT_PUBLIC_API_BASE_URL;
function formatDate(iso) {
    if (!iso) return ''
    try {
        const d = new Date(iso)
        return d.toLocaleDateString('vi-VN', { day: '2-digit', month: '2-digit', year: 'numeric' })
    } catch { return '' }
}

export default function Page() {
    const { slug } = useParams();
    const router = useRouter();

    const [post, setPost] = useState(null);
    const [topics, setTopics] = useState([]);
    const [relatedPosts, setRelatedPosts] = useState([]);
    const [newPosts, setNewPosts] = useState([]);

    const [loading, setLoading] = useState(true);
    const [err, setErr] = useState(null);

    useEffect(() => {
        if (!slug) {
            alert("Trường slug không hợp lệ!");
            router.push("/bai-viet");
            return;
        }

        (async () => {
            try {
                const res = await fetch(`${API_BASE}/post/${slug}`);
                if (res.status === 404) {
                    alert("Không tìm thấy bài viết!");
                    router.push("/bai-viet");
                    return;
                }
                if (!res.ok) throw new Error(`Post HTTP ${res.status}`);
                const json = await res.json();
                setPost(json);

                const res1 = await fetch(`${API_BASE}/getPostByTopic/${json.topic.id}`);
                if (!res1.ok) throw new Error(`Related Posts HTTP ${res1.status}`);
                const relPosts = await res1.json();
                setRelatedPosts(relPosts);

                const res2 = await fetch(`${API_BASE}/topic`);
                if (!res2.ok) throw new Error(`Topics HTTP ${res2.status}`);
                const topics = await res2.json();
                setTopics(topics);

                const res3 = await fetch(`${API_BASE}/getNewPost`);
                if (!res3.ok) throw new Error(`New Posts HTTP ${res3.status}`);
                const newPosts = await res3.json();
                setNewPosts(newPosts);

                setLoading(false);
            } catch (e) {
                if (e.name !== 'AbortError') {
                    setErr({ loading: false, error: e.message || 'Fetch error' });
                }
            }
        })();
    }, [slug, router]);


    if (loading) {
        return (
            <div className="min-h-screen bg-gray-50 pt-30">
                <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-12">
                    <div className="animate-pulse space-y-6">
                        <div className="h-6 bg-gray-200 rounded w-40" />
                        <div className="h-10 bg-gray-200 rounded w-3/4" />
                        <div className="h-96 bg-gray-200 rounded" />
                        <div className="h-6 bg-gray-200 rounded w-1/2" />
                    </div>
                </div>
            </div>
        );
    }

    if (err) {
        return (
            <div className="min-h-screen bg-gray-50 pt-30">
                <div className="max-w-3xl mx-auto px-4 sm:px-6 lg:px-8 py-12">
                    <div className="p-4 bg-red-50 border border-red-200 rounded text-red-700">
                        Lỗi tải dữ liệu: {err}
                    </div>
                </div>
            </div>
        );
    }

    if (!post) return null;

    return (
        <div className="min-h-screen bg-gray-50 pt-30">
            <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-12">
                <div className="flex flex-col lg:flex-row gap-8">
                    <main className="flex-1 lg:max-w-3xl">
                        <div className="mb-4">
                            <span className="inline-block bg-blue-100 text-blue-800 text-sm font-medium px-3 py-1 rounded-full">
                                {post?.topic?.name}
                            </span>
                        </div>

                        <h1 className="text-4xl md:text-5xl font-bold text-gray-900 mb-6 leading-tight">
                            {post.title}
                        </h1>

                        <div className="flex flex-wrap items-center gap-6 text-gray-600 mb-8 pb-8 border-b border-gray-200 justify-between">
                            <div className="flex items-center gap-2">
                                <div className="w-10 h-10 bg-gradient-to-br from-blue-500 to-purple-600 rounded-full flex items-center justify-center text-white font-semibold">
                                    {post?.user_create?.name.split(' ').map(n => n[0]).join('')}
                                </div>
                                <div>
                                    <p className="font-medium text-gray-900">{post.user_create.name}</p>
                                </div>
                            </div>
                            <div className="flex items-center gap-2">
                                <i className="fa-solid fa-calendar w-4 h-4" />
                                <span>{formatDate(post.created_at)}</span>
                            </div>
                        </div>

                        {post.image && (
                            <div className="mb-8 rounded-xl overflow-hidden shadow-lg">
                                <img src={post.image} alt={post.title} className="w-full h-96 object-cover" />
                            </div>
                        )}

                        <div className="border-b border-gray-200 mb-8 pb-8" />

                        {/* Article Content */}
                        <article className="prose prose-lg max-w-none mb-12">
                            <div
                                dangerouslySetInnerHTML={{ __html: post.content }}
                                className="text-gray-800 leading-relaxed"
                            />
                        </article>

                        <div className="flex flex-wrap gap-2 mb-12 pb-12 border-b border-gray-200">
                            <span
                                className="px-4 py-2 bg-gray-100 text-gray-700 rounded-lg text-sm font-medium hover:bg-gray-200 transition cursor-pointer">
                                #{post?.topic?.name}
                            </span>
                        </div>

                        {/* Related Posts */}
                        {!!relatedPosts.length && (
                            <section className="mb-12">
                                <h2 className="text-3xl font-bold text-gray-900 mb-8">Related Posts</h2>
                                <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                                    {relatedPosts.map(relPost => (
                                        <PostCard post={relPost} key={relPost.id} />

                                    ))}
                                </div>
                            </section>
                        )}
                    </main>

                    {/* Sidebar */}
                    <aside className="lg:w-80 space-y-8">
                        {/* Topics List — KHÔNG sticky nữa */}
                        <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6">
                            <h3 className="text-xl font-bold text-gray-900 mb-6 flex items-center gap-2">
                                <i className="fa-solid fa-arrow-trend-up w-5 h-5 text-blue-600" />
                                Chủ đề bài viết
                            </h3>
                            <div>
                                {topics.map((topic, index) => (
                                    <div
                                        key={`${topic.name}-${index}`}
                                        className="flex items-center justify-between p-3 rounded-lg hover:bg-gray-50 transition cursor-pointer group"
                                    >
                                        <div className="flex items-center gap-3">
                                            <div className={`w-2 h-2 rounded-full bg-blue-500`} />
                                            <span className="font-medium text-gray-900 group-hover:text-blue-600 transition">
                                                {topic.name}
                                            </span>
                                        </div>
                                    </div>
                                ))}
                            </div>
                        </div>
                        {newPosts.length && (<div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6">
                            <h3 className="text-xl font-bold text-gray-900 mb-6">Bài viết mới</h3>
                            <div className="space-y-4">
                                {newPosts.map((tPost, index) => (
                                    <div
                                        key={tPost.id}
                                        className="flex gap-3 pb-4 border-b border-gray-100 last:border-0 last:pb-0 cursor-pointer group"
                                    >
                                        <div className="flex-shrink-0 w-8 h-8 bg-gradient-to-br from-blue-500 to-purple-600 rounded-full flex items-center justify-center text-white font-bold text-sm">
                                            {index + 1}
                                        </div>
                                        <div className="flex-1">
                                            <h4 className="font-medium text-gray-900 text-sm leading-snug group-hover:text-blue-600 transition mb-1">
                                                {tPost.title}
                                            </h4>
                                            <span className="text-xs text-gray-500">{tPost.user_create.name}</span>
                                        </div>
                                    </div>
                                ))}
                            </div>
                        </div>)}


                        {/* Newsletter */}
                        <div className="bg-gradient-to-br from-blue-600 to-purple-600 rounded-lg shadow-lg p-6 text-white">
                            <h3 className="text-xl font-bold mb-3">Subscribe to Newsletter</h3>
                            <p className="text-blue-100 text-sm mb-4">
                                Get the latest articles and updates delivered to your inbox.
                            </p>
                            <input
                                type="email"
                                placeholder="Enter your email"
                                className="w-full px-4 py-2 rounded-lg text-gray-900 mb-3 focus:outline-none focus:ring-2 focus:ring-white"
                            />
                            <button className="w-full bg-white text-blue-600 font-semibold py-2 rounded-lg hover:bg-blue-50 transition">
                                Subscribe
                            </button>
                        </div>
                    </aside>
                </div>
            </div>
        </div>
    );
}
