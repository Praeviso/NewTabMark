import {
  disposeQuickLinks,
  disposeQuickLinksVisibility,
  initQuickLinks,
  initQuickLinksVisibility
} from '../quick-links.js';

function installPagehideDisposeOnce(root, dispose) {
  const markerHost = root || document.documentElement;
  if (!markerHost) return;
  if (markerHost.__ntmQuickLinksPagehideBound) return;
  markerHost.__ntmQuickLinksPagehideBound = true;

  window.addEventListener(
    'pagehide',
    () => {
      try {
        dispose();
      } catch {
        // noop
      }
    },
    { once: true }
  );
}

export function createQuickLinksController({ root } = {}) {
  const resolvedRoot = root || document;
  let disposed = false;

  function dispose() {
    if (disposed) return;
    disposed = true;

    disposeQuickLinks({ root: resolvedRoot });
    disposeQuickLinksVisibility();
  }

  // Keep visibility in sync even if the feature is hidden.
  initQuickLinksVisibility();

  // Initialize the full Quick Links feature once the container exists.
  initQuickLinks({ root: resolvedRoot });

  installPagehideDisposeOnce(resolvedRoot, dispose);

  return { dispose };
}
