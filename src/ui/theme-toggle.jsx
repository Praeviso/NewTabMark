import { useEffect, useState, useCallback } from 'react';
import { ICONS } from '../icons.js';
import { getLocalizedMessageSafe } from '../localization.js';

// Signal to legacy theme-controller.js that React is managing the theme toggle
if (typeof document !== 'undefined') {
  document.documentElement.dataset.ntmReactTheme = 'true';
}

/**
 * Gets the current theme from the document or localStorage.
 * @returns {'light' | 'dark'}
 */
function getCurrentTheme() {
  return document.documentElement.getAttribute('data-theme') || 'light';
}

/**
 * Reapply gradient background to fix CSS animation glitches after theme change.
 */
function reapplyGradientBackgroundIfNeeded() {
  const activeBackground = document.documentElement.className;
  if (!activeBackground || !activeBackground.includes('gradient-background')) return;

  requestAnimationFrame(() => {
    document.documentElement.className = '';
    requestAnimationFrame(() => {
      document.documentElement.className = activeBackground;
    });
  });
}

/**
 * Sets the theme on the document and optionally persists it.
 * @param {'light' | 'dark'} theme
 * @param {{ persist?: boolean, reapplyBackground?: boolean }} options
 */
function setTheme(theme, { persist = true, reapplyBackground = false } = {}) {
  document.documentElement.setAttribute('data-theme', theme);
  if (persist) localStorage.setItem('theme', theme);
  if (reapplyBackground) reapplyGradientBackgroundIfNeeded();
}

/**
 * ThemeToggle - A React component for toggling between light and dark theme.
 *
 * This component manages theme state internally and syncs with the document's
 * `data-theme` attribute. It replaces the legacy theme-controller.js event binding
 * while maintaining the same behavior and visual output.
 */
export function ThemeToggle() {
  const [theme, setThemeState] = useState(() => getCurrentTheme());

  const title = getLocalizedMessageSafe('toggleThemeTitle', 'Toggle theme mode');

  // Sync theme from document on mount and observe external changes
  useEffect(() => {
    // Initialize from localStorage if present
    const savedTheme = localStorage.getItem('theme');
    if (savedTheme && (savedTheme === 'light' || savedTheme === 'dark')) {
      setTheme(savedTheme, { persist: false, reapplyBackground: false });
      setThemeState(savedTheme);
    }

    // Observe changes to data-theme attribute (e.g., from legacy code)
    const observer = new MutationObserver(() => {
      const currentTheme = getCurrentTheme();
      setThemeState(currentTheme);
    });

    observer.observe(document.documentElement, {
      attributes: true,
      attributeFilter: ['data-theme']
    });

    return () => {
      observer.disconnect();
    };
  }, []);

  const handleToggle = useCallback(() => {
    const nextTheme = theme === 'dark' ? 'light' : 'dark';
    setTheme(nextTheme, { persist: true, reapplyBackground: true });
    setThemeState(nextTheme);
  }, [theme]);

  // Get the appropriate icon based on current theme
  const iconHtml = theme === 'dark' ? ICONS.dark_mode : ICONS.light_mode;

  return (
    <div className="theme-toggle">
      <button
        id="theme-toggle-btn"
        title={title}
        onClick={handleToggle}
        dangerouslySetInnerHTML={{ __html: iconHtml }}
      />
    </div>
  );
}

/**
 * ThemeTogglePortal - Portal wrapper for ThemeToggle.
 *
 * This component is kept for backward compatibility but now directly renders
 * the ThemeToggle component instead of using a portal since the theme toggle
 * is stripped from legacy HTML and rendered by React.
 */
export function ThemeTogglePortal() {
  return <ThemeToggle />;
}
