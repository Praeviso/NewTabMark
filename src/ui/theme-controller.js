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

/**
 * Initialize the theme controller.
 *
 * NOTE: Click event binding for the theme toggle button is now handled by the
 * React ThemeToggle component. This function only initializes the theme state
 * from localStorage and sets up the mutation observer for icon sync.
 *
 * The React component checks for `data-ntm-react-theme` attribute to avoid
 * duplicate event binding.
 */
export function initThemeController() {
  if (initialized) return;
  initialized = true;

  // Check if React is managing the theme toggle button
  const reactManaged = document.documentElement.dataset.ntmReactTheme === 'true';

  const themeToggleBtn = document.getElementById('theme-toggle-btn');

  // Only bind click event if React is NOT managing the button
  // This provides backward compatibility for cases where React hasn't loaded yet
  if (themeToggleBtn && !reactManaged && themeToggleBtn.dataset.ntmThemeBound !== 'true') {
    themeToggleBtn.dataset.ntmThemeBound = 'true';

    themeToggleBtn.addEventListener('click', () => {
      const isDark = getCurrentTheme() === 'dark';
      setTheme(isDark ? 'light' : 'dark', { persist: true, reapplyBackground: true });
    });
  }

  // Initialize theme from localStorage
  const savedTheme = localStorage.getItem('theme');
  if (savedTheme) setTheme(savedTheme, { persist: false, reapplyBackground: false });
  syncThemeToggleIcon();

  // Observe data-theme attribute for external changes
  const observer = new MutationObserver(() => {
    syncThemeToggleIcon();
  });

  observer.observe(document.documentElement, {
    attributes: true,
    attributeFilter: ['data-theme']
  });
}
