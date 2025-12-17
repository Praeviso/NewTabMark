import { ICONS } from '../icons.js';

let initialized = false;

function updateThemeIcon(themeToggleBtn, theme) {
  if (!themeToggleBtn) return;
  themeToggleBtn.innerHTML = theme === 'dark' ? ICONS.dark_mode : ICONS.light_mode;
}

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

export function getCurrentTheme() {
  return document.documentElement.getAttribute('data-theme') || 'light';
}

export function setTheme(theme, { persist = true, reapplyBackground = false } = {}) {
  document.documentElement.setAttribute('data-theme', theme);
  if (persist) localStorage.setItem('theme', theme);
  if (reapplyBackground) reapplyGradientBackgroundIfNeeded();

  const themeToggleBtn = document.getElementById('theme-toggle-btn');
  updateThemeIcon(themeToggleBtn, theme);
}

export function syncThemeToggleIcon() {
  const themeToggleBtn = document.getElementById('theme-toggle-btn');
  if (!themeToggleBtn) return;
  updateThemeIcon(themeToggleBtn, getCurrentTheme());
}

export function initThemeController() {
  if (initialized) return;
  initialized = true;

  const themeToggleBtn = document.getElementById('theme-toggle-btn');
  if (themeToggleBtn && themeToggleBtn.dataset.ntmThemeBound !== 'true') {
    themeToggleBtn.dataset.ntmThemeBound = 'true';

    themeToggleBtn.addEventListener('click', () => {
      const isDark = getCurrentTheme() === 'dark';
      setTheme(isDark ? 'light' : 'dark', { persist: true, reapplyBackground: true });
    });
  }

  const savedTheme = localStorage.getItem('theme');
  if (savedTheme) setTheme(savedTheme, { persist: false, reapplyBackground: false });
  syncThemeToggleIcon();

  const observer = new MutationObserver(() => {
    syncThemeToggleIcon();
  });

  observer.observe(document.documentElement, {
    attributes: true,
    attributeFilter: ['data-theme']
  });
}

