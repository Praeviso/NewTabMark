/**
 * @deprecated This file is superseded by React components:
 * - src/ui/links-icons.jsx (LinksIcons) - handles history/downloads/passwords/extensions links
 * - src/ui/settings-icon.jsx (SettingsIcon) - handles settings modal opening
 *
 * When React is active (ntmReactSpecialLinks=true), initSpecialLinksController() is a no-op.
 * The file is kept as fallback for cases where React fails to load.
 */

import { openSettingsModal } from './settings-modal-controller.js';

let initialized = false;

const SPECIAL_LINKS = {
  '#history': 'chrome://history',
  '#downloads': 'chrome://downloads',
  '#passwords': 'chrome://settings/passwords',
  '#extensions': 'chrome://extensions'
};

function toElementTarget(target) {
  if (target instanceof Element) return target;
  if (target && typeof target === 'object' && 'nodeType' in target && target.nodeType === Node.TEXT_NODE) {
    return target.parentElement;
  }
  return null;
}

function isSpecialLinksArea(el) {
  return Boolean(el.closest('.links-icons, .settings-icon'));
}

function getAnchorFromEventTarget(target) {
  const elementTarget = toElementTarget(target);
  if (!elementTarget) return null;

  const anchor = elementTarget.closest('a');
  return anchor instanceof HTMLAnchorElement ? anchor : null;
}

function handleDocumentClick(event) {
  const anchor = getAnchorFromEventTarget(event.target);
  if (!anchor) return;
  if (!isSpecialLinksArea(anchor)) return;

  const href = anchor.getAttribute('href');
  if (!href) return;

  if (href === '#settings') {
    event.preventDefault();
    openSettingsModal();
    return;
  }

  const chromeUrl = SPECIAL_LINKS[href];
  if (!chromeUrl) return;

  event.preventDefault();
  if (!globalThis.chrome?.tabs?.create) return;
  chrome.tabs.create({ url: chromeUrl });
}

export function initSpecialLinksController() {
  if (initialized) return;
  initialized = true;

  // React portals (LinksIcons/SettingsIcon) handle clicks directly.
  // Skip binding to avoid duplicate behavior and reduce global listeners.
  if (document?.documentElement?.dataset?.ntmReactSpecialLinks === 'true') {
    return;
  }

  document.addEventListener('click', handleDocumentClick);
}
