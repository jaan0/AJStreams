/** @type {import('next').NextConfig} */
const nextConfig = {
    reactStrictMode: true,
    swcMinify: false, // Disable SWC minification if SWC binary fails to load on Windows
    images: {
        domains: ['res.cloudinary.com', 'image.tmdb.org', 'via.placeholder.com'],
    },
};

module.exports = nextConfig;
