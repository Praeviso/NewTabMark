import { useMemo } from 'react';
import { getLocalizedMessageSafe } from '../localization.js';
import { openSettingsModal } from './settings-modal-controller.js';

// React portals own the click handling for special links.
// This is used by legacy controllers to avoid binding global listeners.
if (typeof document !== 'undefined') {
  document.documentElement.dataset.ntmReactSpecialLinks = 'true';
}

export function SettingsIcon() {
  const settingsLinkTitle = useMemo(
    () => getLocalizedMessageSafe('settingsLinkTitle', 'Settings'),
    []
  );
  const settingsUpdateTipText = useMemo(
    () =>
      getLocalizedMessageSafe(
        'settingsUpdateTip',
        '你可以在这里设置背景颜色、壁纸、悬浮球功能...'
      ),
    []
  );

  return (
    <div className="settings-icon">
      <a
        href="#settings"
        id="settings-link"
        data-i18n-title="settingsLinkTitle"
        title={settingsLinkTitle}
        onClick={(e) => {
          e.preventDefault();
          openSettingsModal(document);
        }}
      >
        <span className="material-icons">settings</span>
      </a>
      <div className="settings-update-tip" style={{ display: 'none' }}>
        <div className="tip-content">
          <span className="material-icons">info</span>
          <div className="tip-text">
            <p data-i18n="settingsUpdateTip">{settingsUpdateTipText}</p>
          </div>
          <button className="tip-close">
            <span className="material-icons">close</span>
          </button>
        </div>
        <div className="tip-arrow"></div>
      </div>
    </div>
  );
}
