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

  return (
    <div className="links-icons">
      <a
        href="#history"
        id="history-link"
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
