import { useMemo } from 'react';
import { getLocalizedMessageSafe } from '../localization.js';

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
      >
        <span className="material-icons">history</span>
      </a>
      <a
        href="#downloads"
        id="downloads-link"
        data-i18n-title="downloadsLinkTitle"
        title={titles.downloads}
      >
        <span className="material-icons">download</span>
      </a>
      <a
        href="#passwords"
        id="passwords-link"
        data-i18n-title="passwordsLinkTitle"
        title={titles.passwords}
      >
        <span className="material-icons">vpn_key</span>
      </a>
      <a
        href="#extensions"
        id="extensions-link"
        data-i18n-title="extensionsLinkTitle"
        title={titles.extensions}
      >
        <span className="material-icons">extension</span>
      </a>
    </div>
  );
}
