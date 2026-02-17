import { createContext, useContext, useState, useEffect, useCallback } from 'react';

const ThemeContext = createContext();

export function ThemeProvider({ children }) {
    const [isDark, setIsDark] = useState(() => {
        const saved = localStorage.getItem('ai-obs-theme');
        return saved ? saved === 'dark' : false; // default to light
    });

    useEffect(() => {
        const root = document.documentElement;
        if (isDark) {
            root.classList.add('dark');
        } else {
            root.classList.remove('dark');
        }
        localStorage.setItem('ai-obs-theme', isDark ? 'dark' : 'light');
    }, [isDark]);

    const toggle = useCallback(() => setIsDark(prev => !prev), []);
    const setDark = useCallback(() => setIsDark(true), []);
    const setLight = useCallback(() => setIsDark(false), []);

    return (
        <ThemeContext.Provider value={{ isDark, toggle, setDark, setLight }}>
            {children}
        </ThemeContext.Provider>
    );
}

export function useTheme() {
    const ctx = useContext(ThemeContext);
    if (!ctx) throw new Error('useTheme must be used within ThemeProvider');
    return ctx;
}
