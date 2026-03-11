/** @type {import('next').NextConfig} */
const nextConfig = {
    images: {
        remotePatterns: [
            {
                protocol: 'https',
                hostname: 'backend.nioo.io.vn',
                port: '',
                pathname: '/images/**',
            },
        ],
    },
};

export default nextConfig;
