/** @type {import('tailwindcss').Config} */
export default {
    content: [
        "./index.html",
        "./src/**/*.{js,ts,jsx,tsx}",
    ],
    darkMode: 'class',
    theme: {
        extend: {
            fontFamily: {
                sans: ['Inter', 'system-ui', '-apple-system', 'sans-serif'],
            },
            colors: {
                // Dark theme: Charcoal + Gold
                charcoal: {
                    50: '#f7f7f7',
                    100: '#e3e3e3',
                    200: '#c8c8c8',
                    300: '#a4a4a4',
                    400: '#818181',
                    500: '#666666',
                    600: '#515151',
                    700: '#434343',
                    800: '#383838',
                    900: '#1a1a1a',
                    950: '#0d0d0d',
                },
                gold: {
                    50: '#fefce8',
                    100: '#fef9c3',
                    200: '#fef08a',
                    300: '#fde047',
                    400: '#facc15',
                    500: '#d4a017',
                    600: '#b8860b',
                    700: '#a16207',
                    800: '#854d0e',
                    900: '#713f12',
                },
                // Light theme: Beige + Brown
                beige: {
                    50: '#fefdfb',
                    100: '#fdf8f0',
                    200: '#faf0e0',
                    300: '#f5e6cc',
                    400: '#e8d5b5',
                    500: '#d4c4a8',
                    600: '#b8a88e',
                    700: '#9c8d74',
                    800: '#80745c',
                    900: '#655b47',
                },
                brown: {
                    50: '#fdf8f6',
                    100: '#f2e8e5',
                    200: '#eaddd7',
                    300: '#c8b6a6',
                    400: '#a69279',
                    500: '#8b7355',
                    600: '#6f5b3e',
                    700: '#5a4a32',
                    800: '#463a27',
                    900: '#332b1e',
                    950: '#1f1a12',
                },
                risk: {
                    low: '#22c55e',
                    medium: '#f59e0b',
                    high: '#f97316',
                    critical: '#ef4444',
                },
            },
            animation: {
                'pulse-slow': 'pulse 3s ease-in-out infinite',
                'fade-in': 'fadeIn 0.5s ease-out both',
                'fade-in-up': 'fadeInUp 0.7s ease-out both',
                'fade-in-down': 'fadeInDown 0.6s ease-out both',
                'fade-in-left': 'fadeInLeft 0.7s ease-out both',
                'fade-in-right': 'fadeInRight 0.7s ease-out both',
                'slide-in': 'slideIn 0.3s ease-out',
                'slide-up': 'slideUp 0.6s ease-out forwards',
                'scale-in': 'scaleIn 0.5s ease-out forwards',
                'float': 'float 6s ease-in-out infinite',
                'float-delayed': 'float 6s ease-in-out 2s infinite',
                'glow-pulse': 'glowPulse 3s ease-in-out infinite',
                'shimmer': 'shimmer 2.5s linear infinite',
                'spin-slow': 'spin 12s linear infinite',
                'bounce-gentle': 'bounceGentle 2s ease-in-out infinite',
                'draw-line': 'drawLine 1.5s ease-out forwards',
                'counter': 'counter 2s ease-out forwards',
                'marquee': 'marquee 30s linear infinite',
                'parallax-slow': 'parallaxDrift 20s ease-in-out infinite',
            },
            keyframes: {
                fadeIn: {
                    '0%': { opacity: '0' },
                    '100%': { opacity: '1' },
                },
                fadeInUp: {
                    '0%': { opacity: '0', transform: 'translateY(40px)' },
                    '100%': { opacity: '1', transform: 'translateY(0)' },
                },
                fadeInDown: {
                    '0%': { opacity: '0', transform: 'translateY(-30px)' },
                    '100%': { opacity: '1', transform: 'translateY(0)' },
                },
                fadeInLeft: {
                    '0%': { opacity: '0', transform: 'translateX(-40px)' },
                    '100%': { opacity: '1', transform: 'translateX(0)' },
                },
                fadeInRight: {
                    '0%': { opacity: '0', transform: 'translateX(40px)' },
                    '100%': { opacity: '1', transform: 'translateX(0)' },
                },
                slideIn: {
                    '0%': { transform: 'translateX(100%)' },
                    '100%': { transform: 'translateX(0)' },
                },
                slideUp: {
                    '0%': { opacity: '0', transform: 'translateY(60px)' },
                    '100%': { opacity: '1', transform: 'translateY(0)' },
                },
                scaleIn: {
                    '0%': { opacity: '0', transform: 'scale(0.85)' },
                    '100%': { opacity: '1', transform: 'scale(1)' },
                },
                float: {
                    '0%, 100%': { transform: 'translateY(0px)' },
                    '50%': { transform: 'translateY(-20px)' },
                },
                glowPulse: {
                    '0%, 100%': { boxShadow: '0 0 20px rgba(212,160,23,0.15)' },
                    '50%': { boxShadow: '0 0 40px rgba(212,160,23,0.35)' },
                },
                shimmer: {
                    '0%': { backgroundPosition: '-200% 0' },
                    '100%': { backgroundPosition: '200% 0' },
                },
                bounceGentle: {
                    '0%, 100%': { transform: 'translateY(0)' },
                    '50%': { transform: 'translateY(-8px)' },
                },
                drawLine: {
                    '0%': { width: '0%' },
                    '100%': { width: '100%' },
                },
                marquee: {
                    '0%': { transform: 'translateX(0%)' },
                    '100%': { transform: 'translateX(-50%)' },
                },
                parallaxDrift: {
                    '0%, 100%': { transform: 'translate(0, 0) rotate(0deg)' },
                    '25%': { transform: 'translate(10px, -15px) rotate(1deg)' },
                    '50%': { transform: 'translate(-5px, -25px) rotate(-1deg)' },
                    '75%': { transform: 'translate(-15px, -10px) rotate(0.5deg)' },
                },
            },
        },
    },
    plugins: [],
}
