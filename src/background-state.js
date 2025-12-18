const DEFAULT_BACKGROUND_CLASS = 'gradient-background-7';

export function readBackgroundState(storage = localStorage) {
  return {
    selectedBackground: storage.getItem('selectedBackground'),
    useDefaultBackground: storage.getItem('useDefaultBackground'),
    originalWallpaper: storage.getItem('originalWallpaper')
  };
}

export function computeBackgroundClassToApply(
  state,
  { defaultBackgroundClass = DEFAULT_BACKGROUND_CLASS } = {}
) {
  const selectedBackground = state?.selectedBackground ?? null;
  const useDefaultBackground = state?.useDefaultBackground ?? null;
  const originalWallpaper = state?.originalWallpaper ?? null;

  if (useDefaultBackground === 'true' && selectedBackground) {
    return selectedBackground;
  }

  // No wallpaper + no explicit background selected: fallback to default gradient.
  // Note: keep compatibility with legacy state where useDefaultBackground === 'false'.
  if (!originalWallpaper && !selectedBackground && useDefaultBackground !== 'false') {
    return defaultBackgroundClass;
  }

  return null;
}

export function applyBackgroundClass(doc, bgClass) {
  if (!doc || !bgClass) return;

  const root = doc.documentElement;
  const isDarkMode = root.getAttribute('data-theme') === 'dark';

  root.className = bgClass;

  if (isDarkMode) {
    root.setAttribute('data-theme', 'dark');
  }
}

export function setActiveBackgroundOption(doc, bgClass) {
  if (!doc) return;

  doc.querySelectorAll('.settings-bg-option').forEach((option) => {
    if (bgClass && option.getAttribute('data-bg') === bgClass) {
      option.classList.add('active');
    } else {
      option.classList.remove('active');
    }
  });
}

export function clearActiveBackgroundOptions(doc) {
  if (!doc) return;

  doc.querySelectorAll('.settings-bg-option').forEach((option) => {
    option.classList.remove('active');
  });
}

export function persistBackgroundSelection(storage, bgClass) {
  if (!storage || !bgClass) return;

  storage.setItem('selectedBackground', bgClass);
  storage.setItem('useDefaultBackground', 'true');
}
