import type { Config } from "tailwindcss";

const config: Config = {
    content: [
        "./src/pages/**/*.{js,ts,jsx,tsx,mdx}",
        "./src/components/**/*.{js,ts,jsx,tsx,mdx}",
        "./src/app/**/*.{js,ts,jsx,tsx,mdx}",
    ],
    theme: {
        extend: {
            colors: {
                background: "var(--background)",
                foreground: "var(--foreground)",
                brand: {
                    purple: '#9333ea',  // Primary purple
                    pink: '#db2777',    // Primary pink
                },
                primary: {
                    bg: '#0a0a0a',      // Primary background
                },
                card: {
                    bg: 'rgba(255,255,255,0.05)', // Card background
                }
            },
            boxShadow: {
                'glow': '0 0 20px rgba(147,51,234,0.5)',
                'glow-lg': '0 0 30px rgba(147,51,234,0.6)',
                'glow-pink': '0 0 20px rgba(219,39,119,0.5)',
            },
            spacing: {
                // 4px base unit system
                '0.5': '2px',
                '1': '4px',
                '2': '8px',
                '3': '12px',
                '4': '16px',
                '5': '20px',
                '6': '24px',
                '8': '32px',
                '10': '40px',
                '12': '48px',
                '16': '64px',
                '20': '80px',
                '24': '96px',
            },
            borderRadius: {
                'modal': '16px',
                'card': '12px',
                'button': '8px',
            },
            backgroundImage: {
                'gradient-radial': 'radial-gradient(var(--tw-gradient-stops))',
                'conic': 'conic-gradient(from 180deg at 50% 50%, var(--tw-gradient-stops))',
                'hero-glow': 'conic-gradient(from 90deg at 50% 50%, #00000000 50%, #000 50%), radial-gradient(rgba(200,200,200,0.1) 0%, transparent 80%)',
                'gradient-purple-pink': 'linear-gradient(135deg, #9333ea 0%, #db2777 100%)',
            },
            animation: {
                'slide-up': 'slideUp 0.3s ease-out',
                'slide-down': 'slideDown 0.3s ease-out',
                'fade-in': 'fadeIn 0.3s ease-out',
                'scale-in': 'scaleIn 0.3s ease-out',
            },
            keyframes: {
                slideUp: {
                    '0%': { transform: 'translateY(100%)', opacity: '0' },
                    '100%': { transform: 'translateY(0)', opacity: '1' },
                },
                slideDown: {
                    '0%': { transform: 'translateY(-10px)', opacity: '0' },
                    '100%': { transform: 'translateY(0)', opacity: '1' },
                },
                fadeIn: {
                    '0%': { opacity: '0' },
                    '100%': { opacity: '1' },
                },
                scaleIn: {
                    '0%': { transform: 'scale(0.95)', opacity: '0' },
                    '100%': { transform: 'scale(1)', opacity: '1' },
                },
            },
        },
    },
    plugins: [],
};
export default config;
