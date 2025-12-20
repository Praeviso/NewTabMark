import { useMemo } from 'react';
import { getLocalizedMessageSafe } from '../localization.js';

// React portals own the click handling for special links.
// This is used by legacy controllers to avoid binding global listeners.
if (typeof document !== 'undefined') {
  document.documentElement.dataset.ntmReactSpecialLinks = 'true';
}

function openChromeUrl(url) {
  if (!url) return;
  if (!globalThis.chrome?.tabs?.create) return;
  chrome.tabs.create({ url });
}

export function LinksIcons() {
  const titles = useMemo(
    () => ({
      history: getLocalizedMessageSafe('historyLinkTitle', 'History'),
      downloads: getLocalizedMessageSafe('downloadsLinkTitle', 'Downloads'),
      passwords: getLocalizedMessageSafe('passwordsLinkTitle', 'Passwords'),
      extensions: getLocalizedMessageSafe('extensionsLinkTitle', 'Extensions')
    }),
    []
  );

  // Container classes: fixed position, white bg (dark: neutral-700), rounded, shadow, flex column
  // Using arbitrary selector for data-theme dark mode compatibility
  const containerClasses = [
    'fixed right-8 top-[calc(30%_+_56px)] z-[2]',
    'w-10 flex flex-col items-center py-1.5',
    'bg-white rounded-xl shadow-md',
    'transition-all duration-300',
    // Dark mode via data-theme attribute
    '[[data-theme=dark]_&]:bg-neutral-700'
  ].join(' ');

  // Link classes: flex center, gray text with hover effects
  const linkClasses = [
    'flex items-center justify-center',
    'w-7 h-7 mx-auto my-0.5 rounded-lg',
    'text-gray-500 no-underline',
    'transition-all duration-300',
    'hover:text-emerald-500 hover:bg-gray-100',
    'active:scale-110',
    // Dark mode
    '[[data-theme=dark]_&]:text-white',
    '[[data-theme=dark]_&]:hover:text-neutral-900'
  ].join(' ');

  return (
    <div className={containerClasses}>
      <a
        href="#history"
        id="history-link"
        className={linkClasses}
        data-i18n-title="historyLinkTitle"
        title={titles.history}
        onClick={(e) => {
          if (!globalThis.chrome?.tabs?.create) return;
          e.preventDefault();
          openChromeUrl('chrome://history');
        }}
      >
        <span className="material-icons">history</span>
      </a>
      <a
        href="#downloads"
        id="downloads-link"
        className={linkClasses}
        data-i18n-title="downloadsLinkTitle"
        title={titles.downloads}
        onClick={(e) => {
          if (!globalThis.chrome?.tabs?.create) return;
          e.preventDefault();
          openChromeUrl('chrome://downloads');
        }}
      >
        <span className="material-icons">download</span>
      </a>
      <a
        href="#passwords"
        id="passwords-link"
        className={linkClasses}
        data-i18n-title="passwordsLinkTitle"
        title={titles.passwords}
        onClick={(e) => {
          if (!globalThis.chrome?.tabs?.create) return;
          e.preventDefault();
          openChromeUrl('chrome://settings/passwords');
        }}
      >
        <span className="material-icons">vpn_key</span>
      </a>
      <a
        href="#extensions"
        id="extensions-link"
        className={linkClasses}
        data-i18n-title="extensionsLinkTitle"
        title={titles.extensions}
        onClick={(e) => {
          if (!globalThis.chrome?.tabs?.create) return;
          e.preventDefault();
          openChromeUrl('chrome://extensions');
        }}
      >
        <span className="material-icons">extension</span>
      </a>
    </div>
  );
}
