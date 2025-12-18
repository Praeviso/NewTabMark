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

export function createLegacyBootstrap(options = {}) {
  const {
    initSpecialLinksController = true
  } = options;

  return createOnce(async () => {
    await importAndInit(() => import('./localization.js'), 'initLocalization', 'localization.js');
    await importAndInit(() => import('./onboarding.js'), 'initOnboarding', 'onboarding.js');
    await importAndInit(() => import('./welcome.js'), 'initWelcome', 'welcome.js');
    await importAndInit(() => import('./wallpaper.js'), 'initWallpaper', 'wallpaper.js');
    await importAndInit(() => import('./bookmark-cleanup.js'), 'initBookmarkCleanup', 'bookmark-cleanup.js');
    await importAndInit(() => import('./quick-links.js'), 'initQuickLinks', 'quick-links.js');
    await importAndInit(() => import('./script.js'), 'initScript', 'script.js');

    if (initSpecialLinksController) {
      await importAndInit(
        () => import('./ui/special-links-controller.js'),
        'initSpecialLinksController',
        'ui/special-links-controller.js'
      );
    }
  });
}

