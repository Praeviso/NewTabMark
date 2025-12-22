function createOnce(asyncFn) {
  let running = null;
  let done = false;

  return async function runOnce() {
    if (done) return;
    if (running) return running;

    running = (async () => {
      await asyncFn();
      done = true;
    })();

    return running;
  };
}

async function importAndInit(importer, exportName, label) {
  const mod = await importer();
  const init = mod?.[exportName];
  if (typeof init !== 'function') {
    throw new Error(`[legacy-bootstrap] Missing ${exportName} in ${label}`);
  }
  init();
}

export function createLegacyBootstrap() {
  return createOnce(async () => {
    await importAndInit(() => import('./localization.js'), 'initLocalization', 'localization.js');
    // theme-controller.js removed: now handled by React ThemeToggle component
    // onboarding has been React-ified: see ui/OnboardingPortal.jsx
    // welcome.js removed: now handled by React WelcomeMessagePortal.jsx
    // feature-tips.js removed: now handled by React FeatureTipsPortal.jsx
    await importAndInit(() => import('./wallpaper.js'), 'initWallpaper', 'wallpaper.js');
    // settings-modal-controller.js removed: now handled by React SettingsModalController.jsx
    // bookmark-cleanup.js removed: now handled by React BookmarkCleanupButtonPortal.jsx
    await importAndInit(() => import('./quick-links.js'), 'initQuickLinks', 'quick-links.js');
    await importAndInit(() => import('./script.js'), 'initScript', 'script.js');
    // special-links-controller.js removed: now handled by React LinksIcons and SettingsIcon components
  });
}

