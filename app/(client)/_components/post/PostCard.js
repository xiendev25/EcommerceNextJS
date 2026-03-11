'use client'
import Link from 'next/link'
import Image from 'next/image'

function formatDate(iso) {
    if (!iso) return ''
    try {
        const d = new Date(iso)
        return d.toLocaleDateString('vi-VN', { day: '2-digit', month: '2-digit', year: 'numeric' })
    } catch { return '' }
}

const PostCard = ({ post = {} }) => {
    return (
        <div
            className="bg-white rounded-lg overflow-hidden shadow-sm border border-gray-200 hover:shadow-xl transition-all duration-300 flex flex-col"
        >
            {/* Image */}
            <div className="relative overflow-hidden group">
                <Image
                    src={post.image}
                    alt={post.title}
                    width={500}
                    height={300}
                    className="w-full h-56 object-cover group-hover:scale-110 transition-transform duration-300"
                />
                <div className="absolute top-4 left-4">
                    <span className="bg-white text-gray-900 text-xs font-semibold px-3 py-1 rounded-full">
                        {post?.topic?.name}
                    </span>
                </div>
            </div>

            {/* Content */}
            <div className="p-6 flex flex-col flex-grow">
                <Link href={`/bai-viet/${post.slug}`} className="text-xl font-bold text-gray-900 mb-3 leading-tight hover:text-blue-600 transition cursor-pointer">
                    {post.title}
                </Link>
                <p className="text-gray-600 mb-4 line-clamp-3 flex-grow">
                    {post.description}
                </p>

                {/* Meta Info */}
                <div className="flex items-center gap-4 text-sm text-gray-500 mb-4 pt-4 border-t border-gray-100">
                    <div className="flex items-center gap-1">
                        <i className="fa-solid fa-user w-4 h-4"></i>
                        <span>{post?.user_create?.name}</span>
                    </div>
                    <div className="flex items-center gap-1">
                        <i className="fa-solid fa-clock w-4 h-4"></i>
                        <span>{formatDate(post.created_at)}</span>
                    </div>
                </div>

                {/* View Detail Button */}
                <Link href={`/bai-viet/${post.slug}`} className="w-full bg-blue-600 text-center text-white font-semibold py-3 rounded-lg hover:bg-blue-700 transition-colors">
                    Xem chi tiết
                </Link>
            </div>
        </div>
    )
}

export default PostCard
