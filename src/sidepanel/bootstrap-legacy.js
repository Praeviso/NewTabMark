let bootstrapped = false;

export async function bootstrapLegacySidepanel() {
  if (bootstrapped) return;
  bootstrapped = true;

  const { initLocalization } = await import('../localization.js');
  initLocalization();
  const { initOnboarding } = await import('../onboarding.js');
  initOnboarding();
  const { initWelcome } = await import('../welcome.js');
  initWelcome();
  const { initWallpaper } = await import('../wallpaper.js');
  initWallpaper();
  const { initBookmarkCleanup } = await import('../bookmark-cleanup.js');
  initBookmarkCleanup();
  const { initQuickLinks } = await import('../quick-links.js');
  initQuickLinks();
  const { initScript } = await import('../script.js');
  initScript();
  const { initSpecialLinksController } = await import('../ui/special-links-controller.js');
  initSpecialLinksController();
}
