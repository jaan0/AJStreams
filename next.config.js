/** @type {import('next').NextConfig} */
const nextConfig = {
    // Allow validation builds to stay separate from the development cache.
    distDir: process.env.NEXT_BUILD_DIR || '.next',
    reactStrictMode: true,
    swcMinify: false,
    images: {
        remotePatterns: [
            { protocol: 'https', hostname: 'res.cloudinary.com' },
            { protocol: 'https', hostname: 'image.tmdb.org' },
            { protocol: 'https', hostname: 'via.placeholder.com' },
            { protocol: 'https', hostname: 'images.unsplash.com' },
        ],
    },
};

module.exports = nextConfig;
