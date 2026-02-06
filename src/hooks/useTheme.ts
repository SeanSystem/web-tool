import { useEffect, useCallback } from 'react';
import { useLocalStorage } from './useLocalStorage';

type Theme = 'light' | 'dark' | 'system';

/**
 * Custom hook for managing theme (light/dark mode)
 * Defaults to system preference, with manual override capability
 */
export function useTheme() {
    const [theme, setTheme] = useLocalStorage<Theme>('theme', 'system');

    // Get system preference
    const getSystemTheme = useCallback((): 'light' | 'dark' => {
        if (typeof window === 'undefined') return 'light';
        return window.matchMedia('(prefers-color-scheme: dark)').matches ? 'dark' : 'light';
    }, []);

    // Get the effective theme (resolved from system if needed)
    const effectiveTheme = theme === 'system' ? getSystemTheme() : theme;

    // Apply theme to document
    useEffect(() => {
        const root = window.document.documentElement;

        if (effectiveTheme === 'dark') {
            root.classList.add('dark');
        } else {
            root.classList.remove('dark');
        }
    }, [effectiveTheme]);

    // Listen for system theme changes when in 'system' mode
    useEffect(() => {
        if (theme !== 'system') return;

        const mediaQuery = window.matchMedia('(prefers-color-scheme: dark)');

        const handleChange = () => {
            const root = window.document.documentElement;
            if (mediaQuery.matches) {
                root.classList.add('dark');
            } else {
                root.classList.remove('dark');
            }
        };

        mediaQuery.addEventListener('change', handleChange);
        return () => mediaQuery.removeEventListener('change', handleChange);
    }, [theme]);

    // Toggle through themes: system -> light -> dark -> system
    const toggleTheme = useCallback(() => {
        setTheme((prev) => {
            if (prev === 'system') return 'light';
            if (prev === 'light') return 'dark';
            return 'system';
        });
    }, [setTheme]);

    // Set specific theme
    const setSpecificTheme = useCallback((newTheme: Theme) => {
        setTheme(newTheme);
    }, [setTheme]);

    return {
        theme,
        effectiveTheme,
        toggleTheme,
        setTheme: setSpecificTheme,
        isDark: effectiveTheme === 'dark',
    };
}
